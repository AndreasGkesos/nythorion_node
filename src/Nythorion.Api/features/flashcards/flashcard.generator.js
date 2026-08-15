import { generate } from '../../lib/ollama.js'

const WINDOW_SIZE = 5
const MIN_WORDS = 4
const SIMILARITY_THRESHOLD = 0.65

const SYSTEM_PROMPT = `You are a flashcard generator. Create 1 flashcard from the provided text.
The question must be clear and complete — someone reading it with no context should understand what is being asked.
The answer must be a full sentence explanation.
Good example: {"question":"What communication mechanism do microservices use?","answer":"Microservices communicate via lightweight mechanisms such as HTTP or message queues."}
Bad example: {"question":"What is communicationMechanism?","answer":"HTTP"}
Output ONLY a valid JSON object with EXACTLY these two fields: "question" and "answer". No extra text, no markdown.`

const STOP_WORDS = new Set([
  'what', 'is', 'are', 'the', 'a', 'an', 'of', 'in', 'to', 'and', 'or',
  'how', 'why', 'when', 'where', 'which', 'do', 'does', 'did', 'be',
  'between', 'for', 'on', 'at', 'by', 'with', 'from', 'that', 'this'
])

function words(text) {
  return new Set(
    text.toLowerCase()
      .split(' ')
      .filter(Boolean)
      .filter(w => !STOP_WORDS.has(w))
  )
}

function wordOverlap(a, b) {
  const intersection = [...a].filter(w => b.has(w)).length
  return intersection / Math.max(a.size, b.size)
}

function pickWindow(allChunks) {
  const shuffled = [...allChunks].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, WINDOW_SIZE)
}

function parse(raw, existingQuestions) {
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start < 0 || end <= start) {
    console.warn('Flashcard parse: no JSON object found in response.')
    return null
  }

  let parsed
  try {
    parsed = JSON.parse(raw.slice(start, end + 1))
  } catch (err) {
    console.warn(`Flashcard parse: JSON exception — ${err.message}`)
    return null
  }

  const { question, answer } = parsed
  if (!question || !answer) {
    console.warn('Flashcard parse: question or answer is null.')
    return null
  }

  if (question.split(' ').length < MIN_WORDS || answer.split(' ').length < MIN_WORDS) {
    console.warn(`Flashcard parse: rejected — too short. Q=${question} A=${answer}`)
    return null
  }

  const newWords = words(question)
  const tooSimilar = existingQuestions.some(q => wordOverlap(newWords, words(q)) > SIMILARITY_THRESHOLD)
  if (tooSimilar) {
    console.warn('Flashcard parse: rejected — too similar to an existing question.')
    return null
  }

  return { question, answer }
}

export async function generateFlashcard(allChunks, existingQuestions) {
  const window = pickWindow(allChunks)
  const text = window.join('\n\n')

  const existingList = existingQuestions.length > 0
    ? 'Do NOT duplicate these existing questions:\n' + existingQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')
    : ''

  const userPrompt = `Generate 1 flashcard from this text. ${existingList}\n\nText:\n${text}`

  const raw = await generate(SYSTEM_PROMPT, userPrompt, { jsonFormat: true })
  console.log(`Flashcard raw response: ${raw}`)
  return parse(raw, existingQuestions)
}
