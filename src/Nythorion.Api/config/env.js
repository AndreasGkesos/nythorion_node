import 'dotenv/config'

export const env = {
  mongoUri: process.env.MONGO_URI,
  apiPort: Number(process.env.API_PORT) || 3000,
  ollamaBaseUrl: process.env.OLLAMA_BASE_URL,
  ollamaEmbedModel: process.env.OLLAMA_EMBED_MODEL,
  ollamaLlmModel: process.env.OLLAMA_LLM_MODEL
}
