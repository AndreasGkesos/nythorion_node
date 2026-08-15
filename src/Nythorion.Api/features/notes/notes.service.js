import { Document } from '../documents/documents.model.js'
import { Note } from './notes.model.js'

export async function addNote({ userId, documentId, content }) {
  const document = await Document.findOne({ _id: documentId, userId })
  if (!document) throw new Error(`Document ${documentId} not found.`)

  return Note.create({ documentId, userId, content })
}

export async function listNotes({ userId, documentId }) {
  return Note.find({ documentId, userId }).sort({ createdAt: 1 })
}

export async function deleteNote({ userId, documentId, noteId }) {
  const deleted = await Note.findOneAndDelete({ _id: noteId, documentId, userId })
  return !!deleted
}
