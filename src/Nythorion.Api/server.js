import Fastify from 'fastify'
import cors from '@fastify/cors'
import multipart from '@fastify/multipart'
import authPlugin from './plugins/auth.js'
import { documentsRoutes } from './features/documents/documents.routes.js'
import { searchRoutes } from './features/search/search.routes.js'
import { summariesRoutes } from './features/summaries/summaries.routes.js'
import { flashcardsRoutes } from './features/flashcards/flashcards.routes.js'
import { quizRoutes } from './features/quiz/quiz.routes.js'
import { notesRoutes } from './features/notes/notes.routes.js'
import { configRoutes } from './features/config/config.routes.js'

export function buildServer() {
  const fastify = Fastify({ logger: true })

  fastify.register(cors, { origin: 'http://localhost:4200' })
  fastify.register(multipart, { limits: { fileSize: 50 * 1024 * 1024 } })
  fastify.register(authPlugin)
  fastify.register(documentsRoutes)
  fastify.register(searchRoutes)
  fastify.register(summariesRoutes)
  fastify.register(flashcardsRoutes)
  fastify.register(quizRoutes)
  fastify.register(notesRoutes)
  fastify.register(configRoutes)

  return fastify
}
