import express from 'express'
import cors from 'cors'
import { config } from 'dotenv'

config({ path: '../../.env' })

import chatRouter from './routes/chat.js'
import tasksRouter from './routes/tasks.js'

const app = express()
const PORT = process.env.API_PORT || 3002

app.use(cors({ origin: ['http://localhost:3001', 'http://localhost:5173'], credentials: true }))
app.use(express.json({ limit: '10mb' }))

app.use('/api/chat', chatRouter)
app.use('/api/tasks', tasksRouter)

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    providers: {
      openai: !!process.env.OPENAI_API_KEY,
      anthropic: !!process.env.ANTHROPIC_API_KEY,
      ollama: true,
    },
  })
})

app.listen(PORT, () => {
  console.log(`✅ AI R&D Backend running on http://localhost:${PORT}`)
  console.log(`   OpenAI:    ${process.env.OPENAI_API_KEY ? '✓' : '✗ (set OPENAI_API_KEY)'}`)
  console.log(`   Anthropic: ${process.env.ANTHROPIC_API_KEY ? '✓' : '✗ (set ANTHROPIC_API_KEY)'}`)
  console.log(`   Ollama:    ✓ (http://localhost:11434)`)
})
