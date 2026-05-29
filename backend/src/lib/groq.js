import 'dotenv/config'
import Groq from 'groq-sdk'

let groqInstance = null

export function getGroqClient() {
  if (!groqInstance) {
    if (!process.env.GROQ_API_KEY) {
      throw new Error('Missing GROQ_API_KEY in environment variables')
    }
    groqInstance = new Groq({ apiKey: process.env.GROQ_API_KEY })
  }
  return groqInstance
}

export function getGroq() {
  return getGroqClient()
}