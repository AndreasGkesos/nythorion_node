import { generateOneQuizQuestion, generateQuiz, listQuiz, deleteQuizQuestion } from './quiz.service.js'

const DEFAULT_COUNT = 5

export async function quizRoutes(fastify) {
  fastify.get('/documents/:id/quiz', async (request, reply) => {
    const questions = await listQuiz({ userId: request.userId, documentId: request.params.id })
    return reply.send(questions)
  })

  fastify.post('/documents/:id/quiz/generate', async (request, reply) => {
    try {
      const question = await generateOneQuizQuestion({ userId: request.userId, documentId: request.params.id })
      return reply.send(question)
    } catch (err) {
      return reply.code(err.message.includes('not found') ? 404 : 400).send({ error: err.message })
    }
  })

  fastify.post('/documents/:id/quiz/generate/batch', async (request, reply) => {
    const count = request.body?.count || DEFAULT_COUNT

    try {
      const result = await generateQuiz({ userId: request.userId, documentId: request.params.id, count })
      return reply.send(result)
    } catch (err) {
      return reply.code(err.message.includes('not found') ? 404 : 400).send({ error: err.message })
    }
  })

  fastify.delete('/documents/:id/quiz/:questionId', async (request, reply) => {
    const deleted = await deleteQuizQuestion({
      userId: request.userId,
      documentId: request.params.id,
      questionId: request.params.questionId
    })
    if (!deleted) return reply.code(404).send({ error: 'Quiz question not found' })
    return reply.code(204).send()
  })
}
