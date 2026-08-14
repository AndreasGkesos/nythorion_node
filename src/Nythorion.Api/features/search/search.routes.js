import { semanticSearch } from './search.service.js'

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
}
