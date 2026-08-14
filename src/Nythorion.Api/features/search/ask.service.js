import { semanticSearch } from './search.service.js'
import { generate } from '../../lib/ollama.js'

const TOP_K = 8

const SYSTEM_PROMPT = `You are a helpful assistant that answers questions based strictly on the provided document excerpts.
If the answer cannot be found in the excerpts, say so clearly.
Do not make up information. Answer in plain prose only — no headers, no bullet points, no lists, no markdown.`

export async function ask({ userId, question, documentId }) {
  const chunks = await semanticSearch({ userId, text: question, documentId, topK: TOP_K })

  if (chunks.length === 0) {
    return { answer: 'I could not find any relevant information in your documents.', sources: [] }
  }

  const context = chunks.map((c, i) => `[${i + 1}] ${c.content}`).join('\n\n')
  const sources = [...new Set(chunks.map(c => c.documentId))]

  const userPrompt = `Document excerpts:
${context}

Question: ${question}

Answer in plain prose only. Do not use bullet points, numbered lists, headers, or any markdown formatting.`

  const answer = await generate(SYSTEM_PROMPT, userPrompt)

  return { answer, sources }
}
