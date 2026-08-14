import { Ollama } from 'ollama'
import { env } from '../config/env.js'

const client = new Ollama({ host: env.ollamaBaseUrl })

export async function embed(text) {
  const response = await client.embeddings({ model: env.ollamaEmbedModel, prompt: text })
  return response.embedding
}

export async function generate(systemPrompt, userPrompt) {
  const response = await client.chat({
    model: env.ollamaLlmModel,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    options: {
      temperature: env.ollamaTemperature,
      num_predict: env.ollamaNumPredict
    }
  })
  return response.message.content
}
