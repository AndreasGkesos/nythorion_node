import { generateSummary, getSummary } from './summaries.service.js'

export async function summariesRoutes(fastify) {
  fastify.get('/documents/:id/summary', async (request, reply) => {
    try {
      const result = await getSummary({ userId: request.userId, documentId: request.params.id })
      return reply.send(result)
    } catch (err) {
      return reply.code(404).send({ error: err.message })
    }
  })

  fastify.post('/documents/:id/summary/generate', async (request, reply) => {
    try {
      const result = await generateSummary({ userId: request.userId, documentId: request.params.id })
      return reply.send(result)
    } catch (err) {
      return reply.code(404).send({ error: err.message })
    }
  })
}
