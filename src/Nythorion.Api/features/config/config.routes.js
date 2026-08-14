import { env } from '../../config/env.js'

export async function configRoutes(fastify) {
  fastify.get('/config', async (request, reply) => {
    return reply.send({
      llmModel: env.ollamaLlmModel,
      embedModel: env.ollamaEmbedModel,
      temperature: env.ollamaTemperature,
      numPredict: env.ollamaNumPredict
    })
  })
}
