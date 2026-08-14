import { semanticSearch } from './search.service.js'

const STUB_USER_ID = 'dev-user'

export async function searchRoutes(fastify) {
  fastify.post('/search', async (request, reply) => {
    const { text, documentId } = request.body

    const results = await semanticSearch({
      userId: STUB_USER_ID,
      text,
      documentId: documentId || undefined
    })

    return reply.send(results)
  })
}
