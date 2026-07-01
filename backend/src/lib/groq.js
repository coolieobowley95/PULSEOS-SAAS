import 'dotenv/config'
import OpenAI from 'openai'

let qwenInstance = null

export function getGroqClient() {
  if (!qwenInstance) {
    if (!process.env.QWEN_API_KEY) {
      throw new Error('Missing QWEN_API_KEY in environment variables')
    }
    qwenInstance = new OpenAI({
      apiKey: process.env.QWEN_API_KEY,
      baseURL: 'https://ws-0hy7gf5blw0er34o.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1'
    })
  }
  return qwenInstance
}

export function getGroq() {
  return getGroqClient()
}
