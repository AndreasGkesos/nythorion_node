const MAX_WORDS_PER_CHUNK = 400
const OVERLAP_SENTENCES = 2
const MIN_ALPHANUMERIC_RATIO = 0.4

// Splits on sentence-ending punctuation followed by whitespace and an uppercase letter/quote/paren, or end of string
const SENTENCE_SPLITTER = /(?<=[.!?])\s+(?=[A-Z"'(])|(?<=[.!?])\s*$/m

// Matches ToC dot-leaders like ". . . . . 5" or "......... 12"
const DOT_LEADER_PATTERN = /(\. ){4,}|\s\.{4,}/g

function countWords(sentence) {
  return sentence.split(' ').filter(Boolean).length
}

function isNoisy(chunk) {
  if (chunk.length === 0) return true

  const alphanumericCount = (chunk.match(/[a-zA-Z0-9]/g) || []).length
  if (alphanumericCount / chunk.length < MIN_ALPHANUMERIC_RATIO) return true

  const dotLeaderMatches = chunk.match(DOT_LEADER_PATTERN) || []
  if (dotLeaderMatches.length >= 3) return true

  return false
}

export function chunkText(text) {
  const sentences = text
    .trim()
    .split(SENTENCE_SPLITTER)
    .map(s => s.trim())
    .filter(s => s.length > 0)

  const chunks = []
  let i = 0

  while (i < sentences.length) {
    const accumulated = []
    let wordCount = 0
    let j = i

    while (j < sentences.length) {
      const sentenceWords = countWords(sentences[j])
      if (accumulated.length > 0 && wordCount + sentenceWords > MAX_WORDS_PER_CHUNK) break

      accumulated.push(sentences[j])
      wordCount += sentenceWords
      j++
    }

    // If a single sentence exceeds the limit, include it anyway to avoid infinite loop
    if (accumulated.length === 0) {
      accumulated.push(sentences[j])
      j++
    }

    const chunk = accumulated.join(' ')
    if (!isNoisy(chunk)) chunks.push(chunk)

    // Advance by the number of new sentences, keeping last N for overlap
    const newSentences = j - i
    i += Math.max(1, newSentences - OVERLAP_SENTENCES)
  }

  return chunks
}
