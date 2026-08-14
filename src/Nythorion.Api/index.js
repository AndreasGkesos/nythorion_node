import { buildServer } from './server.js'
import { connectDb } from './config/db.js'
import { env } from './config/env.js'

await connectDb()

const fastify = buildServer()
await fastify.listen({ port: env.apiPort })
