import { Router } from 'express'
import { insforge } from '../lib/insforge.js'

export const listingsRouter = Router()

listingsRouter.get('/listings', async (_req, res) => {
  try {
    const { data, error } = await insforge.database
      .from('listings')
      .select()
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Fetch listings error:', error)
      return res.status(500).json({ error: error.message })
    }

    res.json({ listings: data || [] })
  } catch (error: any) {
    console.error('Fetch listings error:', error)
    res.status(500).json({ error: error.message })
  }
})

listingsRouter.post('/listings', async (req, res) => {
  try {
    const { data, error } = await insforge.database
      .from('listings')
      .insert({
        title: req.body.title,
        description: req.body.description,
        item_name: req.body.item_name,
        condition: req.body.condition,
        price: req.body.price,
        category: req.body.category,
        photo_url: req.body.photoUrl,
        photo_path: req.body.photoPath,
        status: req.body.status || 'confirmed',
      })
      .select()

    if (error) {
      console.error('Create listing error:', error)
      return res.status(500).json({ error: error.message })
    }

    res.json({ listing: data?.[0] || null })
  } catch (error: any) {
    console.error('Create listing error:', error)
    res.status(500).json({ error: error.message })
  }
})

listingsRouter.patch('/listings/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { data, error } = await insforge.database
      .from('listings')
      .update(req.body)
      .eq('id', id)
      .select()

    if (error) {
      console.error('Update listing error:', error)
      return res.status(500).json({ error: error.message })
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Listing not found' })
    }

    res.json({ listing: data[0] })
  } catch (error: any) {
    console.error('Update listing error:', error)
    res.status(500).json({ error: error.message })
  }
})
