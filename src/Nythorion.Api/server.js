import Fastify from 'fastify'
import cors from '@fastify/cors'
import multipart from '@fastify/multipart'
import { documentsRoutes } from './features/documents/documents.routes.js'

export function buildServer() {
  const fastify = Fastify({ logger: true })

  fastify.register(cors, { origin: 'http://localhost:4200' })
  fastify.register(multipart)
  fastify.register(documentsRoutes)

  return fastify
}
