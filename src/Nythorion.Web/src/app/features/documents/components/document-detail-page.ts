import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { DocumentService } from '../services/document.service';
import { Flashcard, Note, QuizQuestion, Summary } from '../models/document.models';
import { NotificationService } from '../../../shared/services/notification.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog';

@Component({
  selector: 'app-document-detail-page',
  standalone: true,
  imports: [
    CommonModule, RouterLink, FormsModule,
    MatTabsModule, MatCardModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatChipsModule, MatInputModule, MatFormFieldModule
  ],
  templateUrl: './document-detail-page.html',
  styleUrl: './document-detail-page.scss'
})
export class DocumentDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly documentService = inject(DocumentService);
  private readonly notify = inject(NotificationService);
  private readonly dialog = inject(MatDialog);

  readonly documentId = signal('');

  readonly summary = signal<Summary | null>(null);
  readonly flashcards = signal<Flashcard[]>([]);
  readonly quiz = signal<QuizQuestion[]>([]);

  readonly loadingSummary = signal(false);
  readonly loadingFlashcards = signal(false);
  readonly loadingQuiz = signal(false);
  readonly generatingFlashcard = signal(false);
  readonly generatingFlashcards = signal(false);
  readonly generatingQuestion = signal(false);
  readonly generatingQuiz = signal(false);
  readonly generatingSummary = signal(false);

  readonly notes = signal<Note[]>([]);
  readonly loadingNotes = signal(false);
  readonly savingNote = signal(false);
  newNoteContent = signal('');

  // Flashcard study state
  readonly currentFlashcardIndex = signal(0);
  readonly flashcardFlipped = signal(false);
  readonly currentFlashcard = computed(() => this.flashcards()[this.currentFlashcardIndex()] ?? null);

  // Quiz state
  readonly quizAnswers = signal<Record<string, number | null>>({});
  readonly quizSubmitted = signal(false);
  readonly quizScore = computed(() => {
    if (!this.quizSubmitted()) return null;
    const answers = this.quizAnswers();
    return this.quiz().filter(q => answers[q.id] === q.correctOptionIndex).length;
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.documentId.set(id);
    this.loadSummary();
    this.loadFlashcards();
    this.loadQuiz();
    this.loadNotes();
  }

  loadNotes() {
    this.loadingNotes.set(true);
    this.documentService.getNotes(this.documentId()).subscribe({
      next: n => { this.notes.set(n); this.loadingNotes.set(false); },
      error: () => { this.loadingNotes.set(false); this.notify.error('Failed to load notes.'); }
    });
  }

  addNote() {
    const content = this.newNoteContent().trim();
    if (!content) return;
    this.savingNote.set(true);
    this.documentService.addNote(this.documentId(), content).subscribe({
      next: note => {
        this.notes.update(list => [note, ...list]);
        this.newNoteContent.set('');
        this.savingNote.set(false);
      },
      error: () => { this.savingNote.set(false); this.notify.error('Failed to save note.'); }
    });
  }

  deleteNote(id: string) {
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Delete Note', message: 'Are you sure you want to delete this note?' }
    }).afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.documentService.deleteNote(this.documentId(), id).subscribe({
        next: () => this.notes.update(list => list.filter(n => n.id !== id)),
        error: () => this.notify.error('Failed to delete note.')
      });
    });
  }

  generateSummary() {
    const doGenerate = () => {
      this.generatingSummary.set(true);
      this.documentService.generateSummary(this.documentId()).subscribe({
        next: s => { this.summary.set(s); this.generatingSummary.set(false); this.notify.success('Summary generated.'); },
        error: () => { this.generatingSummary.set(false); this.notify.error('Failed to generate summary.'); }
      });
    };

    if (this.summary()) {
      this.dialog.open(ConfirmDialogComponent, {
        data: { title: 'Regenerate Summary', message: 'This will replace the existing summary. Continue?', confirmLabel: 'Regenerate' }
      }).afterClosed().subscribe(confirmed => { if (confirmed) doGenerate(); });
    } else {
      doGenerate();
    }
  }

  loadSummary() {
    this.loadingSummary.set(true);
    this.documentService.getSummary(this.documentId()).subscribe({
      next: s => { this.summary.set(s); this.loadingSummary.set(false); },
      error: () => { this.loadingSummary.set(false); this.notify.error('Failed to load summary.'); }
    });
  }

  loadFlashcards() {
    this.loadingFlashcards.set(true);
    this.documentService.getFlashcards(this.documentId()).subscribe({
      next: f => { this.flashcards.set(f); this.loadingFlashcards.set(false); },
      error: () => { this.loadingFlashcards.set(false); this.notify.error('Failed to load flashcards.'); }
    });
  }

  loadQuiz() {
    this.loadingQuiz.set(true);
    this.documentService.getQuiz(this.documentId()).subscribe({
      next: q => { this.quiz.set(q); this.loadingQuiz.set(false); },
      error: () => { this.loadingQuiz.set(false); this.notify.error('Failed to load quiz.'); }
    });
  }

  deleteFlashcard(id: string) {
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Delete Flashcard', message: 'Are you sure you want to delete this flashcard?' }
    }).afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.documentService.deleteFlashcard(this.documentId(), id).subscribe({
        next: () => {
          const updated = this.flashcards().filter(f => f.id !== id);
          this.flashcards.set(updated);
          if (this.currentFlashcardIndex() >= updated.length)
            this.currentFlashcardIndex.set(Math.max(0, updated.length - 1));
        },
        error: () => this.notify.error('Failed to delete flashcard.')
      });
    });
  }

  generateFlashcard() {
    this.generatingFlashcard.set(true);
    this.documentService.generateOneFlashcard(this.documentId()).subscribe({
      next: f => { this.flashcards.update(list => [...list, f]); this.generatingFlashcard.set(false); },
      error: (err) => {
        this.generatingFlashcard.set(false);
        const message = err?.error && typeof err.error === 'string' ? err.error : 'Failed to generate flashcard.';
        this.notify.error(message);
      }
    });
  }

  generateFlashcards(count: number = 10) {
    this.generatingFlashcards.set(true);
    this.documentService.generateFlashcards(this.documentId(), count).subscribe({
      next: result => {
        this.flashcards.update(list => [...list, ...result.flashcards]);
        this.generatingFlashcards.set(false);
        this.notify.success(`Generated ${result.flashcards.length} flashcards.`);
      },
      error: () => { this.generatingFlashcards.set(false); this.notify.error('Failed to generate flashcards.'); }
    });
  }

  generateQuiz(count: number = 5) {
    this.generatingQuiz.set(true);
    this.documentService.generateQuiz(this.documentId(), count).subscribe({
      next: result => {
        this.quiz.update(list => [...list, ...result.questions]);
        this.generatingQuiz.set(false);
        this.notify.success(`Generated ${result.questions.length} quiz questions.`);
      },
      error: (err) => {
        this.generatingQuiz.set(false);
        const message = err?.error && typeof err.error === 'string' ? err.error : 'Failed to generate quiz. You need at least 2 flashcards first.';
        this.notify.error(message);
      }
    });
  }

  deleteQuestion(id: string) {
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Delete Question', message: 'Are you sure you want to delete this quiz question?' }
    }).afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.documentService.deleteQuizQuestion(this.documentId(), id).subscribe({
        next: () => {
          this.quiz.update(list => list.filter(q => q.id !== id));
          this.quizAnswers.update(a => { const copy = { ...a }; delete copy[id]; return copy; });
        },
        error: () => this.notify.error('Failed to delete question.')
      });
    });
  }

  generateQuestion() {
    this.generatingQuestion.set(true);
    this.documentService.generateOneQuizQuestion(this.documentId()).subscribe({
      next: q => { this.quiz.update(list => [...list, q]); this.generatingQuestion.set(false); },
      error: (err) => {
        this.generatingQuestion.set(false);
        const message = err?.error && typeof err.error === 'string' ? err.error : 'Failed to generate question.';
        this.notify.error(message);
      }
    });
  }

  // Flashcard navigation
  prevCard() {
    this.flashcardFlipped.set(false);
    this.currentFlashcardIndex.update(i => Math.max(0, i - 1));
  }

  nextCard() {
    this.flashcardFlipped.set(false);
    this.currentFlashcardIndex.update(i => Math.min(this.flashcards().length - 1, i + 1));
  }

  flipCard() {
    this.flashcardFlipped.update(v => !v);
  }

  // Quiz
  selectAnswer(questionId: string, optionIndex: number) {
    if (this.quizSubmitted()) return;
    this.quizAnswers.update(a => ({ ...a, [questionId]: optionIndex }));
  }

  submitQuiz() {
    this.quizSubmitted.set(true);
  }

  resetQuiz() {
    this.quizAnswers.set({});
    this.quizSubmitted.set(false);
  }

}
