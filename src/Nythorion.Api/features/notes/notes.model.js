import mongoose from 'mongoose'

const noteSchema = new mongoose.Schema({
  documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true },
  userId: { type: String, required: true },
  content: { type: String, required: true }
}, { timestamps: true })

noteSchema.index({ userId: 1, documentId: 1 })

noteSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString()
    delete ret._id
    delete ret.__v
  }
})

export const Note = mongoose.model('Note', noteSchema)
