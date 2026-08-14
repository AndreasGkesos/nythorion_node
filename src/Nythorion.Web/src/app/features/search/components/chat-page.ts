import { Component, inject, OnInit, signal, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { CommonModule } from '@angular/common';
import { ChatMessage, Document } from '../../documents/models/document.models';
import { DocumentService } from '../../documents/services/document.service';
import { NotificationService } from '../../../shared/services/notification.service';

interface DisplayMessage {
  role: 'user' | 'assistant';
  content: string;
}

@Component({
  selector: 'app-chat-page',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule, MatProgressSpinnerModule, MatSelectModule, MatSlideToggleModule],
  templateUrl: './chat-page.html',
  styleUrl: './chat-page.scss'
})
export class ChatPage implements OnInit, AfterViewChecked {
  @ViewChild('messagesEnd') private messagesEnd!: ElementRef;

  private readonly documentService = inject(DocumentService);
  private readonly notify = inject(NotificationService);

  input = signal('');
  messages = signal<DisplayMessage[]>([]);
  loading = signal(false);

  specificDocument = signal(false);
  documents = signal<Document[]>([]);
  selectedDocumentId = signal<string | null>(null);

  ngOnInit(): void {
    this.documentService.getDocuments().subscribe(docs =>
      this.documents.set(docs.filter(d => d.status === 'Ready'))
    );
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  send(): void {
    const content = this.input().trim();
    if (!content || this.loading()) return;
    if (this.specificDocument() && !this.selectedDocumentId()) return;

    this.messages.update(list => [...list, { role: 'user', content }]);
    this.input.set('');
    this.loading.set(true);

    const history: ChatMessage[] = this.messages().map(m => ({ role: m.role, content: m.content }));
    const documentId = this.specificDocument() ? this.selectedDocumentId()! : undefined;

    this.documentService.chat(history, documentId).subscribe({
      next: result => {
        this.messages.update(list => [...list, { role: 'assistant', content: result.answer }]);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notify.error('Request failed. Please try again.');
      }
    });
  }

  clearChat(): void {
    this.messages.set([]);
  }

  onToggleChange(checked: boolean): void {
    this.specificDocument.set(checked);
    if (!checked) this.selectedDocumentId.set(null);
  }

  private scrollToBottom(): void {
    try {
      this.messagesEnd?.nativeElement.scrollIntoView({ behavior: 'smooth' });
    } catch {}
  }
}
