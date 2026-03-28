import { Router } from 'express'
import { searchComparables } from '../services/ebay-scraper.js'
import { suggestPrice, suggestAlternativePrices } from '../services/openai.js'

export const priceRouter = Router()

priceRouter.post('/price-research', async (req, res) => {
  try {
    const { item_name, condition } = req.body

    if (!item_name) {
      return res.status(400).json({ error: 'item_name is required' })
    }

    // Scrape eBay for comparable items
    const { active, sold } = await searchComparables(item_name)

    const allComparables = [
      ...active.map((c) => ({ ...c, sold: false })),
      ...sold.map((c) => ({ ...c, sold: true })),
    ]

    // Get AI price suggestion
    const { suggested_price, reasoning } = await suggestPrice(
      item_name,
      condition || 'Good',
      allComparables
    )

    res.json({
      suggested_price,
      reasoning,
      comparables: {
        active: active.slice(0, 5),
        sold: sold.slice(0, 5),
      },
    })
  } catch (error: any) {
    console.error('Price research error:', error)
    res.status(500).json({ error: error.message })
  }
})

priceRouter.post('/suggest-alternatives', async (req, res) => {
  try {
    const { item_name, condition, rejected_price, comparables } = req.body

    const allComparables = [
      ...(comparables?.active || []),
      ...(comparables?.sold || []),
    ]

    const alternatives = await suggestAlternativePrices(
      item_name,
      condition,
      rejected_price,
      allComparables
    )

    res.json({ alternatives })
  } catch (error: any) {
    console.error('Suggest alternatives error:', error)
    res.status(500).json({ error: error.message })
  }
})
