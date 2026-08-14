import { Document, DocumentChunk } from './documents.model.js'
import { parsePdf } from './parsing/pdf.js'
import { parseDocx } from './parsing/docx.js'
import { chunkText } from './parsing/chunker.js'
import { embed } from '../../lib/ollama.js'

const PARSERS = {
  'application/pdf': parsePdf,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': parseDocx
}

async function processDocument(document, userId, contentType, buffer) {
  const parse = PARSERS[contentType]

  try {
    const text = await parse(buffer)
    const chunks = chunkText(text)

    const chunkDocs = []
    for (let i = 0; i < chunks.length; i++) {
      const embedding = await embed(chunks[i])
      chunkDocs.push({
        documentId: document._id,
        userId,
        chunkIndex: i,
        text: chunks[i],
        embedding
      })
    }

    await DocumentChunk.insertMany(chunkDocs)

    document.status = 'Ready'
    await document.save()
  } catch (err) {
    document.status = 'Failed'
    await document.save()
    throw err
  }
}

export async function uploadDocument({ userId, displayName, fileName, contentType, fileSizeBytes, buffer }) {
  if (!PARSERS[contentType]) throw new Error(`Unsupported file type: ${contentType}`)

  const document = await Document.create({
    userId,
    displayName,
    fileName,
    contentType,
    fileSizeBytes,
    status: 'Processing'
  })

  // Fire-and-forget: parsing/chunking/embedding runs in the background so the
  // upload request returns immediately. The UI polls GET /documents and picks
  // up the status transition to Ready/Failed.
  processDocument(document, userId, contentType, buffer).catch(err => {
    console.error(`Document processing failed for ${document._id}:`, err)
  })

  return { documentId: document._id.toString() }
}

export async function listDocuments(userId) {
  return Document.find({ userId }).sort({ uploadedAt: -1 })
}

export async function deleteDocument(userId, documentId) {
  const document = await Document.findOneAndDelete({ _id: documentId, userId })
  if (!document) return false
  await DocumentChunk.deleteMany({ documentId, userId })
  return true
}
