import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { AskResult, Document } from '../../documents/models/document.models';
import { DocumentService } from '../../documents/services/document.service';
import { NotificationService } from '../../../shared/services/notification.service';

@Component({
  selector: 'app-ask-page',
  imports: [FormsModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatIconModule, MatInputModule, MatProgressSpinnerModule, MatSelectModule, MatSlideToggleModule],
  templateUrl: './ask-page.html',
  styleUrl: './ask-page.scss'
})
export class AskPage implements OnInit {
  private readonly documentService = inject(DocumentService);
  private readonly notify = inject(NotificationService);

  question = signal('');
  result = signal<AskResult | null>(null);
  loading = signal(false);
  asked = signal(false);

  specificDocument = signal(false);
  documents = signal<Document[]>([]);
  selectedDocumentId = signal<string | null>(null);

  ngOnInit(): void {
    this.documentService.getDocuments().subscribe(docs =>
      this.documents.set(docs.filter(d => d.status === 'Ready'))
    );
  }

  ask(): void {
    if (!this.question().trim()) return;
    if (this.specificDocument() && !this.selectedDocumentId()) return;

    this.loading.set(true);
    this.asked.set(true);
    this.result.set(null);

    const documentId = this.specificDocument() ? this.selectedDocumentId()! : undefined;

    this.documentService.ask(this.question(), documentId).subscribe({
      next: result => {
        this.result.set(result);
        this.loading.set(false);
      },
      error: () => { this.loading.set(false); this.notify.error('Request failed. Please try again.'); }
    });
  }

  onToggleChange(checked: boolean): void {
    this.specificDocument.set(checked);
    if (!checked) this.selectedDocumentId.set(null);
  }
}
