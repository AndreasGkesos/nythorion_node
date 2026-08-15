import { Document, DocumentChunk } from './documents.model.js'
import { parsePdf } from './parsing/pdf.js'
import { parseDocx } from './parsing/docx.js'
import { chunkText } from './parsing/chunker.js'
import { embed } from '../../lib/ollama.js'
import { Summary } from '../summaries/summaries.model.js'
import { Flashcard } from '../flashcards/flashcards.model.js'
import { QuizQuestion } from '../quiz/quiz.model.js'
import { Note } from '../notes/notes.model.js'
import { generateSummary } from '../summaries/summaries.service.js'
import { generateFlashcards } from '../flashcards/flashcards.service.js'
import { generateQuiz } from '../quiz/quiz.service.js'

const DISPLAY_NAME_MAX_LENGTH = 255

const PARSERS = {
  'application/pdf': parsePdf,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': parseDocx
}

async function resolveDisplayName(userId, desiredName, excludeDocumentId) {
  const filter = excludeDocumentId ? { userId, _id: { $ne: excludeDocumentId } } : { userId }
  const existingNames = await Document.find(filter).distinct('displayName')
  const existing = new Set(existingNames)

  if (!existing.has(desiredName)) return desiredName

  let counter = 1
  let candidate
  do {
    candidate = `${desiredName} (${counter++})`
  } while (existing.has(candidate))

  return candidate
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

async function generateLearningContent({ userId, documentId, chunkCount }) {
  const flashcardCount = clamp(Math.floor(chunkCount / 5), 2, 10)
  const quizCount = clamp(Math.floor(chunkCount / 5), 2, 10)

  try {
    await generateSummary({ userId, documentId })
  } catch (err) {
    console.error(`Auto-summary failed for document ${documentId}:`, err)
  }

  try {
    await generateFlashcards({ userId, documentId, count: flashcardCount })
  } catch (err) {
    console.error(`Auto-flashcards failed for document ${documentId}:`, err)
  }

  try {
    await generateQuiz({ userId, documentId, count: quizCount })
  } catch (err) {
    console.error(`Auto-quiz failed for document ${documentId}:`, err)
  }
}

async function processDocument(document, userId) {
  try {
    document.status = 'Processing'
    await document.save()

    const chunks = await DocumentChunk.find({ documentId: document._id }).sort({ chunkIndex: 1 })

    for (const chunk of chunks) {
      chunk.embedding = await embed(chunk.text)
      await chunk.save()
    }

    await generateLearningContent({ userId, documentId: document._id.toString(), chunkCount: chunks.length })

    document.status = 'Ready'
    await document.save()
  } catch (err) {
    document.status = 'Failed'
    await document.save()
    throw err
  }
}

export async function uploadDocument({ userId, displayName, fileName, contentType, fileSizeBytes, buffer }) {
  if (displayName.length > DISPLAY_NAME_MAX_LENGTH) {
    throw new Error('Display name cannot exceed 255 characters.')
  }

  const parse = PARSERS[contentType]
  if (!parse) throw new Error(`Unsupported file type: ${contentType}`)

  const text = await parse(buffer)
  const chunks = chunkText(text)

  const resolvedDisplayName = await resolveDisplayName(userId, displayName)

  const document = await Document.create({
    userId,
    displayName: resolvedDisplayName,
    fileName,
    contentType,
    fileSizeBytes,
    status: 'Uploading'
  })

  await DocumentChunk.insertMany(
    chunks.map((text, i) => ({ documentId: document._id, userId, chunkIndex: i, text, embedding: [] }))
  )

  // Fire-and-forget: embedding + summary/flashcard/quiz generation run in the
  // background so the upload request returns immediately. The UI polls
  // GET /documents and picks up the status transition to Ready/Failed.
  processDocument(document, userId).catch(err => {
    console.error(`Processing failed for document ${document._id}:`, err)
  })

  return { documentId: document._id.toString(), chunkCount: chunks.length }
}

export async function listDocuments(userId) {
  return Document.find({ userId }).sort({ uploadedAt: -1 })
}

export async function renameDocument(userId, documentId, displayName) {
  const trimmed = displayName?.trim()
  if (!trimmed) throw new Error('Display name is required.')

  const document = await Document.findOne({ _id: documentId, userId })
  if (!document) return false

  document.displayName = trimmed
  await document.save()
  return true
}

export async function deleteDocument(userId, documentId) {
  const document = await Document.findOneAndDelete({ _id: documentId, userId })
  if (!document) return false

  await Promise.all([
    DocumentChunk.deleteMany({ documentId, userId }),
    Summary.deleteMany({ documentId, userId }),
    Flashcard.deleteMany({ documentId, userId }),
    QuizQuestion.deleteMany({ documentId, userId }),
    Note.deleteMany({ documentId, userId })
  ])

  return true
}
