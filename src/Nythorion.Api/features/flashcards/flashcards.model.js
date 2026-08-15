import mongoose from 'mongoose'

const flashcardSchema = new mongoose.Schema({
  documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true },
  userId: { type: String, required: true },
  question: { type: String, required: true },
  answer: { type: String, required: true }
}, { timestamps: { createdAt: true, updatedAt: false } })

flashcardSchema.index({ userId: 1, documentId: 1 })

flashcardSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString()
    delete ret._id
    delete ret.__v
  }
})

export const Flashcard = mongoose.model('Flashcard', flashcardSchema)
