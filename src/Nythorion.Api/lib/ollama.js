import { Ollama } from 'ollama'
import { env } from '../config/env.js'

const client = new Ollama({ host: env.ollamaBaseUrl })

export async function embed(text) {
  const response = await client.embeddings({ model: env.ollamaEmbedModel, prompt: text })
  return response.embedding
}

export async function chat(systemPrompt, messages, { jsonFormat = false } = {}) {
  const response = await client.chat({
    model: env.ollamaLlmModel,
    messages: [{ role: 'system', content: systemPrompt }, ...messages],
    format: jsonFormat ? 'json' : undefined,
    options: {
      temperature: env.ollamaTemperature,
      num_predict: env.ollamaNumPredict
    }
  })
  return response.message.content
}

export async function generate(systemPrompt, userPrompt, options) {
  return chat(systemPrompt, [{ role: 'user', content: userPrompt }], options)
}
