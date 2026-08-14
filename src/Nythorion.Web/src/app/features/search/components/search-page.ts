import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Document, SearchResult } from '../../documents/models/document.models';
import { DocumentService } from '../../documents/services/document.service';
import { NotificationService } from '../../../shared/services/notification.service';

@Component({
  selector: 'app-search-page',
  imports: [FormsModule, MatButtonModule, MatCardModule, MatChipsModule, MatFormFieldModule, MatIconModule, MatInputModule, MatProgressSpinnerModule, MatSelectModule, MatSlideToggleModule],
  templateUrl: './search-page.html',
  styleUrl: './search-page.scss'
})
export class SearchPage implements OnInit {
  private readonly documentService = inject(DocumentService);
  private readonly notify = inject(NotificationService);

  query = signal('');
  results = signal<SearchResult[]>([]);
  loading = signal(false);
  searched = signal(false);

  specificDocument = signal(false);
  documents = signal<Document[]>([]);
  selectedDocumentId = signal<string | null>(null);

  ngOnInit(): void {
    this.documentService.getDocuments().subscribe(docs =>
      this.documents.set(docs.filter(d => d.status === 'Ready'))
    );
  }

  search(): void {
    if (!this.query().trim()) return;
    if (this.specificDocument() && !this.selectedDocumentId()) return;

    this.loading.set(true);
    this.searched.set(true);

    const documentId = this.specificDocument() ? this.selectedDocumentId()! : undefined;

    this.documentService.search(this.query(), documentId).subscribe({
      next: results => {
        this.results.set(results);
        this.loading.set(false);
      },
      error: () => { this.loading.set(false); this.notify.error('Search failed. Please try again.'); }
    });
  }

  onToggleChange(checked: boolean): void {
    this.specificDocument.set(checked);
    if (!checked) this.selectedDocumentId.set(null);
  }

  scorePercent(score: number): number {
    return Math.round((1 - score) * 100);
  }
}
