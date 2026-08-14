import { semanticSearch } from './search.service.js'
import { ask } from './ask.service.js'

export async function searchRoutes(fastify) {
  fastify.post('/search', async (request, reply) => {
    const { text, documentId } = request.body

    const results = await semanticSearch({
      userId: request.userId,
      text,
      documentId: documentId || undefined
    })

    return reply.send(results)
  })

  fastify.post('/search/ask', async (request, reply) => {
    const { question, documentId } = request.body

    const result = await ask({
      userId: request.userId,
      question,
      documentId: documentId || undefined
    })

    return reply.send(result)
  })
}
