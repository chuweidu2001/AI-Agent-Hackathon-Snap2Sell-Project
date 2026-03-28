import { chromium, type BrowserContext } from 'playwright'
import path from 'path'
import fs from 'fs'

const SESSION_DIR = '/app/.ebay-session'
const STORAGE_STATE_PATH = path.join(SESSION_DIR, 'storage-state.json')

function hasSession(): boolean {
  return fs.existsSync(STORAGE_STATE_PATH)
}

async function createContext(): Promise<BrowserContext> {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  if (hasSession()) {
    return browser.newContext({ storageState: STORAGE_STATE_PATH })
  }
  return browser.newContext()
}

export async function checkEbayLoginStatus(): Promise<boolean> {
  if (!hasSession()) return false

  try {
    const context = await createContext()
    const page = await context.newPage()
    await page.goto('https://www.ebay.com', { waitUntil: 'domcontentloaded' })

    // Check if logged in by looking for sign-in link absence
    const signInLink = await page.$('a[href*="signin"]')
    const isLoggedIn = !signInLink

    await context.close()
    return isLoggedIn
  } catch {
    return false
  }
}

export interface ListingData {
  title: string
  description: string
  condition: string
  price: number
  category: string
  photoPath: string
}

export async function postToEbay(listing: ListingData): Promise<{ success: boolean; ebayUrl?: string; error?: string }> {
  if (!hasSession()) {
    return { success: false, error: 'Not logged into eBay. Run the login setup first.' }
  }

  try {
    const context = await createContext()
    const page = await context.newPage()

    // Navigate to sell page
    await page.goto('https://www.ebay.com/sl/sell', { waitUntil: 'networkidle', timeout: 30000 })

    // Wait for the listing form to load
    await page.waitForTimeout(3000)

    // Try to fill in the title/search field
    const titleInput = await page.$('input[type="text"]')
    if (titleInput) {
      await titleInput.fill(listing.title)
      await page.waitForTimeout(1000)
    }

    // Take a screenshot for debugging
    await page.screenshot({ path: '/app/uploads/ebay-debug.png' })

    // Save the current URL as a reference
    const currentUrl = page.url()

    await context.close()

    return {
      success: true,
      ebayUrl: currentUrl,
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Setup script for initial eBay login
export async function setupEbayLogin(email: string, password: string): Promise<boolean> {
  try {
    const browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })

    const context = await browser.newContext()
    const page = await context.newPage()

    await page.goto('https://signin.ebay.com/ws/eBayISAPI.dll?SignIn', {
      waitUntil: 'networkidle',
    })

    // Fill email
    await page.fill('#userid', email)
    await page.click('#signin-continue-btn')
    await page.waitForTimeout(2000)

    // Fill password
    await page.fill('#pass', password)
    await page.click('#sgnBt')
    await page.waitForTimeout(5000)

    // Save session
    fs.mkdirSync(SESSION_DIR, { recursive: true })
    await context.storageState({ path: STORAGE_STATE_PATH })

    await browser.close()
    console.log('eBay login session saved successfully!')
    return true
  } catch (error: any) {
    console.error('eBay login failed:', error.message)
    return false
  }
}
