import mongoose from 'mongoose'

const documentSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  displayName: { type: String, required: true },
  fileName: { type: String, required: true },
  contentType: { type: String, required: true },
  fileSizeBytes: { type: Number, required: true },
  status: { type: String, enum: ['Uploading', 'Processing', 'Ready', 'Failed'], default: 'Uploading' }
}, { timestamps: { createdAt: 'uploadedAt', updatedAt: false } })

const documentChunkSchema = new mongoose.Schema({
  documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true },
  userId: { type: String, required: true },
  chunkIndex: { type: Number, required: true },
  text: { type: String, required: true },
  embedding: { type: [Number], required: true }
}, { timestamps: true })

documentSchema.index({ userId: 1 })
documentChunkSchema.index({ userId: 1, documentId: 1 })

documentSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString()
    delete ret._id
    delete ret.__v
  }
})

export const Document = mongoose.model('Document', documentSchema)
export const DocumentChunk = mongoose.model('DocumentChunk', documentChunkSchema)
