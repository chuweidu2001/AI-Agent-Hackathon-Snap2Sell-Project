import * as cheerio from 'cheerio'

interface ComparableItem {
  title: string
  price: number
  link: string
  image: string
  sold: boolean
}

async function fetchEbaySearch(query: string, sold: boolean): Promise<ComparableItem[]> {
  const encodedQuery = encodeURIComponent(query)
  let url = `https://www.ebay.com/sch/i.html?_nkw=${encodedQuery}&_sop=12`
  if (sold) {
    url += '&LH_Complete=1&LH_Sold=1'
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)

    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (!response.ok) {
      console.warn(`eBay search returned ${response.status}`)
      return []
    }

    const html = await response.text()
    const $ = cheerio.load(html)
    const items: ComparableItem[] = []

    $('li.s-item').each((_i, el) => {
      const title = $(el).find('.s-item__title span').text().trim()
      const priceText = $(el).find('.s-item__price').first().text().trim()
      const link = $(el).find('.s-item__link').attr('href') || ''
      const image = $(el).find('.s-item__image-img').attr('src') || ''

      const priceMatch = priceText.match(/\$?([\d,]+\.?\d*)/)
      const price = priceMatch ? parseFloat(priceMatch[1].replace(',', '')) : 0

      if (title && price > 0 && !title.includes('Shop on eBay')) {
        items.push({ title, price, link, image, sold })
      }
    })

    return items.slice(0, 8)
  } catch (error) {
    console.warn('eBay search failed (may be blocked):', (error as Error).message)
    return []
  }
}

export async function searchComparables(
  itemName: string
): Promise<{ active: ComparableItem[]; sold: ComparableItem[] }> {
  const [active, sold] = await Promise.all([
    fetchEbaySearch(itemName, false),
    fetchEbaySearch(itemName, true),
  ])

  if (active.length === 0 && sold.length === 0) {
    console.log('No eBay comparables found — AI will estimate price from knowledge base')
  }

  return { active, sold }
}
