import { Router } from 'express'
import { postToEbay, checkEbayLoginStatus } from '../services/ebay-poster.js'

export const postRouter = Router()

postRouter.get('/ebay-status', async (_req, res) => {
  const loggedIn = await checkEbayLoginStatus()
  res.json({ loggedIn })
})

postRouter.post('/post-listing', async (req, res) => {
  try {
    const { title, description, condition, price, category, photoPath } = req.body

    const result = await postToEbay({
      title,
      description,
      condition,
      price,
      category,
      photoPath,
    })

    res.json(result)
  } catch (error: any) {
    console.error('Post listing error:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})
