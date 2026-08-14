import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AskResult, ChatMessage, ChatResult, Document, Flashcard, Note, QuizQuestion, SearchResult, Summary, UploadResult } from '../models/document.models';

@Injectable({ providedIn: 'root' })
export class DocumentService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  getDocuments(): Observable<Document[]> {
    return this.http.get<Document[]>(`${this.base}/documents`);
  }

  deleteDocument(documentId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/documents/${documentId}`);
  }

  uploadDocument(file: File, displayName: string): Observable<UploadResult> {
    const form = new FormData();
    form.append('file', file);
    form.append('displayName', displayName);
    return this.http.post<UploadResult>(`${this.base}/documents/upload`, form);
  }

  renameDocument(documentId: string, displayName: string): Observable<void> {
    return this.http.patch<void>(`${this.base}/documents/${documentId}/name`, { displayName });
  }

  getSummary(documentId: string): Observable<Summary> {
    return this.http.get<Summary>(`${this.base}/documents/${documentId}/summary`);
  }

  generateSummary(documentId: string): Observable<Summary> {
    return this.http.post<Summary>(`${this.base}/documents/${documentId}/summary/generate`, {});
  }

  getFlashcards(documentId: string): Observable<Flashcard[]> {
    return this.http.get<Flashcard[]>(`${this.base}/documents/${documentId}/flashcards`);
  }

  generateOneFlashcard(documentId: string): Observable<Flashcard> {
    return this.http.post<Flashcard>(`${this.base}/documents/${documentId}/flashcards/generate`, {});
  }

  generateFlashcards(documentId: string, count: number): Observable<{ documentId: string; flashcards: Flashcard[] }> {
    return this.http.post<{ documentId: string; flashcards: Flashcard[] }>(`${this.base}/documents/${documentId}/flashcards/generate/batch`, { count });
  }

  deleteFlashcard(documentId: string, flashcardId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/documents/${documentId}/flashcards/${flashcardId}`);
  }

  getQuiz(documentId: string): Observable<QuizQuestion[]> {
    return this.http.get<QuizQuestion[]>(`${this.base}/documents/${documentId}/quiz`);
  }

  generateOneQuizQuestion(documentId: string): Observable<QuizQuestion> {
    return this.http.post<QuizQuestion>(`${this.base}/documents/${documentId}/quiz/generate`, {});
  }

  generateQuiz(documentId: string, count: number): Observable<{ documentId: string; questions: QuizQuestion[] }> {
    return this.http.post<{ documentId: string; questions: QuizQuestion[] }>(`${this.base}/documents/${documentId}/quiz/generate/batch`, { count });
  }

  deleteQuizQuestion(documentId: string, questionId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/documents/${documentId}/quiz/${questionId}`);
  }

  search(query: string, documentId?: string): Observable<SearchResult[]> {
    return this.http.post<SearchResult[]>(`${this.base}/search`, { text: query, documentId: documentId ?? null });
  }

  getNotes(documentId: string): Observable<Note[]> {
    return this.http.get<Note[]>(`${this.base}/documents/${documentId}/notes`);
  }

  addNote(documentId: string, content: string): Observable<Note> {
    return this.http.post<Note>(`${this.base}/documents/${documentId}/notes`, { content });
  }

  deleteNote(documentId: string, noteId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/documents/${documentId}/notes/${noteId}`);
  }

  ask(question: string, documentId?: string): Observable<AskResult> {
    return this.http.post<AskResult>(`${this.base}/search/ask`, { question, documentId: documentId ?? null });
  }

  chat(messages: ChatMessage[], documentId?: string): Observable<ChatResult> {
    return this.http.post<ChatResult>(`${this.base}/search/chat`, { messages, documentId: documentId ?? null });
  }
}
