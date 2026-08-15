import mongoose from 'mongoose'

const quizQuestionSchema = new mongoose.Schema({
  documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true },
  userId: { type: String, required: true },
  question: { type: String, required: true },
  options: { type: [String], required: true },
  correctOptionIndex: { type: Number, required: true }
}, { timestamps: { createdAt: true, updatedAt: false } })

quizQuestionSchema.index({ userId: 1, documentId: 1 })

quizQuestionSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString()
    delete ret._id
    delete ret.__v
  }
})

export const QuizQuestion = mongoose.model('QuizQuestion', quizQuestionSchema)
