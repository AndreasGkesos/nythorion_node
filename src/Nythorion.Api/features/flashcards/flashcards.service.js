import { Document, DocumentChunk } from '../documents/documents.model.js'
import { Flashcard } from './flashcards.model.js'
import { generateFlashcard } from './flashcard.generator.js'

async function loadContext(userId, documentId) {
  const document = await Document.findOne({ _id: documentId, userId })
  if (!document) throw new Error(`Document ${documentId} not found.`)

  const chunks = await DocumentChunk.find({ documentId, userId }).sort({ chunkIndex: 1 })
  if (chunks.length === 0) throw new Error(`No chunks found for document ${documentId}.`)

  const existing = await Flashcard.find({ documentId, userId }).select('question')

  return { allChunks: chunks.map(c => c.text), existingQuestions: existing.map(f => f.question) }
}

export async function generateOneFlashcard({ userId, documentId }) {
  const { allChunks, existingQuestions } = await loadContext(userId, documentId)

  const generated = await generateFlashcard(allChunks, existingQuestions)
  if (!generated) throw new Error('Could not generate a flashcard, please try again.')

  return Flashcard.create({ documentId, userId, question: generated.question, answer: generated.answer })
}

export async function generateFlashcards({ userId, documentId, count }) {
  const { allChunks, existingQuestions } = await loadContext(userId, documentId)

  const created = []

  for (let i = 0; i < count; i++) {
    const generated = await generateFlashcard(allChunks, existingQuestions)
    if (!generated) continue

    const flashcard = await Flashcard.create({
      documentId,
      userId,
      question: generated.question,
      answer: generated.answer
    })

    existingQuestions.push(flashcard.question)
    created.push(flashcard)
  }

  return { documentId, flashcards: created }
}

export async function listFlashcards({ userId, documentId }) {
  return Flashcard.find({ documentId, userId }).sort({ createdAt: 1 })
}

export async function deleteFlashcard({ userId, documentId, flashcardId }) {
  const deleted = await Flashcard.findOneAndDelete({ _id: flashcardId, documentId, userId })
  return !!deleted
}
