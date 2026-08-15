import fp from 'fastify-plugin'
import { jwtVerify, createRemoteJWKSet } from 'jose'
import { env } from '../config/env.js'

const jwks = createRemoteJWKSet(new URL('/.well-known/jwks', env.authServerUrl))

async function authPlugin(fastify) {
  fastify.decorateRequest('userId', null)

  fastify.addHook('onRequest', async (request, reply) => {
    if (request.method === 'OPTIONS') return

    const authHeader = request.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return reply.code(401).send({ error: 'Missing bearer token' })
    }

    const token = authHeader.slice('Bearer '.length)

    try {
      const { payload } = await jwtVerify(token, jwks, {
        issuer: env.authServerUrl + '/',
        audience: 'nythorion-api'
      })
      request.userId = payload.sub
    } catch {
      return reply.code(401).send({ error: 'Invalid or expired token' })
    }
  })
}

export default fp(authPlugin)
