import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { identifyItem, identifyItemWithContext } from '../services/openai.js'

const upload = multer({
  dest: '/app/uploads/',
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
})

export const identifyRouter = Router()

identifyRouter.post('/identify', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No photo uploaded' })
    }

    // Read file as base64
    const filePath = req.file.path
    const ext = path.extname(req.file.originalname) || '.jpg'
    const newPath = `${filePath}${ext}`
    fs.renameSync(filePath, newPath)

    const base64Image = fs.readFileSync(newPath).toString('base64')

    // Call OpenAI to identify the item
    const result = await identifyItem(base64Image)

    res.json({
      ...result,
      photoPath: newPath,
      photoUrl: `/uploads/${path.basename(newPath)}`,
    })
  } catch (error: any) {
    console.error('Identify error:', error)
    res.status(500).json({ error: error.message })
  }
})

identifyRouter.post('/clarify', async (req, res) => {
  try {
    const { answer, photoPath } = req.body
    if (!answer || !photoPath) {
      return res.status(400).json({ error: 'Answer and photoPath are required' })
    }

    const base64Image = fs.readFileSync(photoPath).toString('base64')
    const result = await identifyItemWithContext(base64Image, answer)

    res.json({
      ...result,
      photoPath,
      photoUrl: `/uploads/${path.basename(photoPath)}`,
    })
  } catch (error: any) {
    console.error('Clarify error:', error)
    res.status(500).json({ error: error.message })
  }
})
