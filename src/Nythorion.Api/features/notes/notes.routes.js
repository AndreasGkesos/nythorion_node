import { addNote, listNotes, deleteNote } from './notes.service.js'

export async function notesRoutes(fastify) {
  fastify.get('/documents/:id/notes', async (request, reply) => {
    const notes = await listNotes({ userId: request.userId, documentId: request.params.id })
    return reply.send(notes)
  })

  fastify.post('/documents/:id/notes', async (request, reply) => {
    try {
      const note = await addNote({ userId: request.userId, documentId: request.params.id, content: request.body.content })
      return reply.code(201).send(note)
    } catch (err) {
      return reply.code(404).send({ error: err.message })
    }
  })

  fastify.delete('/documents/:id/notes/:noteId', async (request, reply) => {
    const deleted = await deleteNote({ userId: request.userId, documentId: request.params.id, noteId: request.params.noteId })
    if (!deleted) return reply.code(404).send({ error: 'Note not found' })
    return reply.code(204).send()
  })
}
