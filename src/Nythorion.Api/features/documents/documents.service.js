import { Document, DocumentChunk } from './documents.model.js'
import { parsePdf } from './parsing/pdf.js'
import { parseDocx } from './parsing/docx.js'
import { chunkText } from './parsing/chunker.js'
import { embed } from '../../lib/ollama.js'

const PARSERS = {
  'application/pdf': parsePdf,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': parseDocx
}

export async function uploadDocument({ userId, displayName, fileName, contentType, fileSizeBytes, buffer }) {
  const parse = PARSERS[contentType]
  if (!parse) throw new Error(`Unsupported file type: ${contentType}`)

  const document = await Document.create({
    userId,
    displayName,
    fileName,
    contentType,
    fileSizeBytes,
    status: 'Processing'
  })

  let chunkCount = 0

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
    chunkCount = chunkDocs.length

    document.status = 'Ready'
    await document.save()
  } catch (err) {
    document.status = 'Failed'
    await document.save()
    throw err
  }

  return { documentId: document._id.toString(), chunkCount }
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
