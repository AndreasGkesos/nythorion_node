import { generateOneFlashcard, generateFlashcards, listFlashcards, deleteFlashcard } from './flashcards.service.js'

const DEFAULT_COUNT = 5

export async function flashcardsRoutes(fastify) {
  fastify.get('/documents/:id/flashcards', async (request, reply) => {
    const flashcards = await listFlashcards({ userId: request.userId, documentId: request.params.id })
    return reply.send(flashcards)
  })

  fastify.post('/documents/:id/flashcards/generate', async (request, reply) => {
    try {
      const flashcard = await generateOneFlashcard({ userId: request.userId, documentId: request.params.id })
      return reply.send(flashcard)
    } catch (err) {
      return reply.code(err.message.includes('not found') ? 404 : 400).send({ error: err.message })
    }
  })

  fastify.post('/documents/:id/flashcards/generate/batch', async (request, reply) => {
    const count = request.body?.count || DEFAULT_COUNT

    try {
      const result = await generateFlashcards({ userId: request.userId, documentId: request.params.id, count })
      return reply.send(result)
    } catch (err) {
      return reply.code(404).send({ error: err.message })
    }
  })

  fastify.delete('/documents/:id/flashcards/:flashcardId', async (request, reply) => {
    const deleted = await deleteFlashcard({
      userId: request.userId,
      documentId: request.params.id,
      flashcardId: request.params.flashcardId
    })
    if (!deleted) return reply.code(404).send({ error: 'Flashcard not found' })
    return reply.code(204).send()
  })
}
