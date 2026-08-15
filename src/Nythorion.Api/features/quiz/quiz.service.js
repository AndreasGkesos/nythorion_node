import { Document } from '../documents/documents.model.js'
import { Flashcard } from '../flashcards/flashcards.model.js'
import { QuizQuestion } from './quiz.model.js'

function shuffle(array) {
  return [...array].sort(() => Math.random() - 0.5)
}

function buildQuestion(card, flashcards) {
  const wrongAnswers = [...new Set(
    shuffle(flashcards.filter(f => !f._id.equals(card._id)).map(f => f.answer))
  )].slice(0, 3)

  // Need at least 1 wrong answer to make a valid question
  if (wrongAnswers.length === 0) return null

  const correctOptionIndex = Math.floor(Math.random() * (wrongAnswers.length + 1))
  const options = [...wrongAnswers]
  options.splice(correctOptionIndex, 0, card.answer)

  return { question: card.question, options, correctOptionIndex }
}

async function loadFlashcards(userId, documentId) {
  const document = await Document.findOne({ _id: documentId, userId })
  if (!document) throw new Error(`Document ${documentId} not found.`)

  const flashcards = await Flashcard.find({ documentId, userId })
  if (flashcards.length < 2) throw new Error(`Need at least 2 flashcards to generate a quiz, found ${flashcards.length}.`)

  return flashcards
}

export async function generateOneQuizQuestion({ userId, documentId }) {
  const flashcards = await loadFlashcards(userId, documentId)

  const existing = await QuizQuestion.find({ documentId, userId }).select('question')
  const usedQuestions = new Set(existing.map(q => q.question))
  const unused = flashcards.filter(f => !usedQuestions.has(f.question))

  const candidates = unused.length > 0 ? unused : flashcards
  const card = shuffle(candidates)[0]

  const built = buildQuestion(card, flashcards)
  if (!built) throw new Error('Could not generate a quiz question, please try again.')

  return QuizQuestion.create({ documentId, userId, ...built })
}

export async function generateQuiz({ userId, documentId, count }) {
  const flashcards = await loadFlashcards(userId, documentId)

  const candidates = shuffle(flashcards).slice(0, count)

  const built = candidates
    .map(card => buildQuestion(card, flashcards))
    .filter(Boolean)

  const questions = await QuizQuestion.insertMany(
    built.map(q => ({ documentId, userId, ...q }))
  )

  return { documentId, questions }
}

export async function listQuiz({ userId, documentId }) {
  return QuizQuestion.find({ documentId, userId }).sort({ createdAt: 1 })
}

export async function deleteQuizQuestion({ userId, documentId, questionId }) {
  const deleted = await QuizQuestion.findOneAndDelete({ _id: questionId, documentId, userId })
  return !!deleted
}
