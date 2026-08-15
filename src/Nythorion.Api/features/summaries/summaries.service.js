import { Document, DocumentChunk } from '../documents/documents.model.js'
import { Summary } from './summaries.model.js'
import { generate } from '../../lib/ollama.js'

const CHUNKS_PER_BATCH = 10

const MAP_SYSTEM_PROMPT = `You are a document summarizer. Summarize only what the user provides. Plain prose only — no headers, no bullets, no markdown.`

const REDUCE_SYSTEM_PROMPT = `You are a document summarizer. Synthesize the provided passage notes into a single cohesive summary. Plain prose only — no headers, no bullets, no markdown.`

async function mapChunks(texts) {
  const batchSummaries = []

  for (let i = 0; i < texts.length; i += CHUNKS_PER_BATCH) {
    const batch = texts.slice(i, i + CHUNKS_PER_BATCH)
    const batchText = batch.join('\n\n')

    const userPrompt = `Summarize the following passage in 2 to 3 sentences of plain prose. Only use information from the passage below.

${batchText}`

    const result = await generate(MAP_SYSTEM_PROMPT, userPrompt)
    batchSummaries.push(result.trim())
  }

  return batchSummaries
}

async function reduceSummaries(batchSummaries) {
  const combined = batchSummaries.join('\n\n')

  const userPrompt = `Below are notes summarizing different sections of a document:

${combined}

Write a detailed plain prose summary of the full document in 8 to 12 sentences. Cover the main topics, key arguments, important concepts, and conclusions. Do not repeat yourself.`

  const result = await generate(REDUCE_SYSTEM_PROMPT, userPrompt)
  return result.trim()
}

export async function generateSummary({ userId, documentId }) {
  const document = await Document.findOne({ _id: documentId, userId })
  if (!document) throw new Error(`Document ${documentId} not found.`)

  const chunks = await DocumentChunk.find({ documentId, userId }).sort({ chunkIndex: 1 })
  if (chunks.length === 0) throw new Error(`No chunks found for document ${documentId}.`)

  const batchSummaries = await mapChunks(chunks.map(c => c.text))
  const content = await reduceSummaries(batchSummaries)

  await Summary.findOneAndDelete({ documentId })
  const summary = await Summary.create({ documentId, userId, content })

  return summary
}

export async function getSummary({ userId, documentId }) {
  const document = await Document.findOne({ _id: documentId, userId })
  if (!document) throw new Error(`Document ${documentId} not found.`)

  const summary = await Summary.findOne({ documentId, userId })
  if (!summary) throw new Error(`No summary found for document ${documentId}.`)

  return summary
}
