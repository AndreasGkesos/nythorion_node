import 'dotenv/config'

export const env = {
  mongoUri: process.env.MONGO_URI,
  apiPort: Number(process.env.API_PORT) || 3000,
  authServerUrl: process.env.AUTH_SERVER_URL,
  ollamaBaseUrl: process.env.OLLAMA_BASE_URL,
  ollamaEmbedModel: process.env.OLLAMA_EMBED_MODEL,
  ollamaLlmModel: process.env.OLLAMA_LLM_MODEL,
  ollamaTemperature: Number(process.env.OLLAMA_TEMPERATURE) || 0.1,
  ollamaNumPredict: Number(process.env.OLLAMA_NUM_PREDICT) || 4096
}
