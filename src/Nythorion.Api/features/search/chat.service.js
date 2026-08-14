import { semanticSearch } from './search.service.js'
import { chat as ollamaChat, generate } from '../../lib/ollama.js'

const TOP_K = 8

const ANSWER_SYSTEM_PROMPT = `You are a helpful assistant that answers questions based strictly on the provided document excerpts.
You are in a conversation — use previous messages for context, but only answer from the excerpts below.
If the answer cannot be found in the excerpts, say so clearly.
Do not make up information. Answer in plain prose only — no headers, no bullet points, no markdown.`

const REWRITE_SYSTEM_PROMPT = `You are a search query rewriter. Given a conversation history and the latest user message,
rewrite the latest message into a single, self-contained search query that captures the full
context needed to find relevant information. Output ONLY the rewritten query — no explanation,
no punctuation at the end, no extra text.`

async function rewriteQuery(messages, lastUserMessage) {
  const history = messages.slice(0, -1).map(m => `${m.role}: ${m.content}`).join('\n')
  const userPrompt = `Conversation so far:\n${history}\n\nLatest message: ${lastUserMessage}\n\nRewritten search query:`

  const rewritten = await generate(REWRITE_SYSTEM_PROMPT, userPrompt)
  return rewritten?.trim() || lastUserMessage
}

export async function chat({ userId, messages, documentId }) {
  const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')?.content ?? ''

  const searchQuery = messages.length > 1
    ? await rewriteQuery(messages, lastUserMessage)
    : lastUserMessage

  const chunks = await semanticSearch({ userId, text: searchQuery, documentId, topK: TOP_K })

  if (chunks.length === 0) {
    return { answer: 'I could not find any relevant information in your documents.', sources: [] }
  }

  const context = chunks.map((c, i) => `[${i + 1}] ${c.content}`).join('\n\n')
  const sources = [...new Set(chunks.map(c => c.documentId))]

  const history = [...messages]
  const lastIndex = history.map(m => m.role).lastIndexOf('user')
  history[lastIndex] = {
    ...history[lastIndex],
    content: `Document excerpts:\n${context}\n\nQuestion: ${history[lastIndex].content}`
  }

  const answer = await ollamaChat(ANSWER_SYSTEM_PROMPT, history)

  return { answer, sources }
}
