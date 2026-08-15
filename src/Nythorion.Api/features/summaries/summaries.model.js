import mongoose from 'mongoose'

const summarySchema = new mongoose.Schema({
  documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true, unique: true },
  userId: { type: String, required: true },
  content: { type: String, required: true }
}, { timestamps: true })

summarySchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.summaryId = ret._id.toString()
    delete ret._id
    delete ret.__v
  }
})

export const Summary = mongoose.model('Summary', summarySchema)
