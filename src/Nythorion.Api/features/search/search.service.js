import { Document, DocumentChunk } from '../documents/documents.model.js'
import { embed } from '../../lib/ollama.js'

const DEFAULT_TOP_K = 8

function cosineDistance(a, b) {
  let dot = 0, normA = 0, normB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  const similarity = dot / (Math.sqrt(normA) * Math.sqrt(normB))
  return 1 - similarity
}

export async function semanticSearch({ userId, text, documentId, topK = DEFAULT_TOP_K }) {
  const queryEmbedding = await embed(text)

  const filter = { userId, 'embedding.0': { $exists: true } }
  if (documentId) filter.documentId = documentId

  const chunks = await DocumentChunk.find(filter)
  const documentIds = [...new Set(chunks.map(c => c.documentId.toString()))]
  const documents = await Document.find({ _id: { $in: documentIds } })
  const fileNameByDocumentId = new Map(documents.map(d => [d._id.toString(), d.fileName]))

  const scored = chunks.map(chunk => ({
    documentId: chunk.documentId.toString(),
    fileName: fileNameByDocumentId.get(chunk.documentId.toString()),
    chunkId: chunk._id.toString(),
    chunkIndex: chunk.chunkIndex,
    content: chunk.text,
    score: cosineDistance(queryEmbedding, chunk.embedding)
  }))

  scored.sort((a, b) => a.score - b.score)

  return scored.slice(0, topK)
}
