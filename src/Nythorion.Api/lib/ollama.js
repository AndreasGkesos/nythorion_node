import { Ollama } from 'ollama'
import { env } from '../config/env.js'

const client = new Ollama({ host: env.ollamaBaseUrl })

export async function embed(text) {
  const response = await client.embeddings({ model: env.ollamaEmbedModel, prompt: text })
  return response.embedding
}
