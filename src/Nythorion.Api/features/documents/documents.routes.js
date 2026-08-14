import { uploadDocument, listDocuments, deleteDocument } from './documents.service.js'

const STUB_USER_ID = 'dev-user'

export async function documentsRoutes(fastify) {
  fastify.get('/documents', async (request, reply) => {
    const documents = await listDocuments(STUB_USER_ID)
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

    const result = await uploadDocument({
      userId: STUB_USER_ID,
      displayName: displayName || file.filename,
      fileName: file.filename,
      contentType: file.mimetype,
      fileSizeBytes: file.buffer.length,
      buffer: file.buffer
    })

    return reply.code(201).send(result)
  })

  fastify.delete('/documents/:id', async (request, reply) => {
    const deleted = await deleteDocument(STUB_USER_ID, request.params.id)
    if (!deleted) return reply.code(404).send({ error: 'Document not found' })
    return reply.code(204).send()
  })
}
