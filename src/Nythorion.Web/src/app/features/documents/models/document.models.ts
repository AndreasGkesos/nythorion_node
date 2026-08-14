export interface Document {
  id: string;
  displayName: string;
  fileName: string;
  contentType: string;
  fileSizeBytes: number;
  status: 'Uploading' | 'Processing' | 'Ready' | 'Failed';
  uploadedAt: string;
}

export interface UploadResult {
  documentId: string;
  chunkCount: number;
}

export interface Summary {
  summaryId: string;
  content: string;
}

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctOptionIndex: number;
}

export interface SearchResult {
  documentId: string;
  fileName: string;
  chunkId: string;
  chunkIndex: number;
  content: string;
  score: number;
}

export interface AskResult {
  answer: string;
  sources: string[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResult {
  answer: string;
  sources: string[];
}

export interface Note {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}
