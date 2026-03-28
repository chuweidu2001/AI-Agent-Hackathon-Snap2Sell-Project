import express from 'express'
import cors from 'cors'
import { identifyRouter } from './routes/identify.js'
import { priceRouter } from './routes/price.js'
import { postRouter } from './routes/post.js'
import { listingsRouter } from './routes/listings.js'

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json({ limit: '50mb' }))
app.use('/uploads', express.static('/app/uploads'))

app.use('/api', identifyRouter)
app.use('/api', priceRouter)
app.use('/api', postRouter)
app.use('/api', listingsRouter)

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`)
})
