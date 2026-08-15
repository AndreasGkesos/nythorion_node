import { uploadDocument, listDocuments, renameDocument, deleteDocument } from './documents.service.js'

export async function documentsRoutes(fastify) {
  fastify.get('/documents', async (request, reply) => {
    const documents = await listDocuments(request.userId)
    return reply.send(documents)
  })

  fastify.post('/documents/upload', async (request, reply) => {
    let file
    let displayName

    for await (const part of request.parts()) {
      if (part.type === 'file' && part.fieldname === 'file') {
        file = { filename: part.filename, mimetype: part.mimetype, buffer: await part.toBuffer() }
      } else if (part.fieldname === 'displayName') {
        displayName = part.value
      }
    }

    if (!file) return reply.code(400).send({ error: 'No file uploaded' })

    try {
      const result = await uploadDocument({
        userId: request.userId,
        displayName: displayName || file.filename,
        fileName: file.filename,
        contentType: file.mimetype,
        fileSizeBytes: file.buffer.length,
        buffer: file.buffer
      })
      return reply.code(201).send(result)
    } catch (err) {
      return reply.code(400).send({ error: err.message })
    }
  })

  fastify.patch('/documents/:id/name', async (request, reply) => {
    try {
      const renamed = await renameDocument(request.userId, request.params.id, request.body.displayName)
      if (!renamed) return reply.code(404).send({ error: 'Document not found' })
      return reply.code(204).send()
    } catch (err) {
      return reply.code(400).send({ error: err.message })
    }
  })

  fastify.delete('/documents/:id', async (request, reply) => {
    const deleted = await deleteDocument(request.userId, request.params.id)
    if (!deleted) return reply.code(404).send({ error: 'Document not found' })
    return reply.code(204).send()
  })
}
