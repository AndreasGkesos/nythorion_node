import Fastify from 'fastify'
import cors from '@fastify/cors'
import multipart from '@fastify/multipart'
import authPlugin from './plugins/auth.js'
import { documentsRoutes } from './features/documents/documents.routes.js'
import { searchRoutes } from './features/search/search.routes.js'
import { configRoutes } from './features/config/config.routes.js'

export function buildServer() {
  const fastify = Fastify({ logger: true })

  fastify.register(cors, { origin: 'http://localhost:4200' })
  fastify.register(multipart)
  fastify.register(authPlugin)
  fastify.register(documentsRoutes)
  fastify.register(searchRoutes)
  fastify.register(configRoutes)

  return fastify
}
