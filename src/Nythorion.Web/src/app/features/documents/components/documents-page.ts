import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Document } from '../models/document.models';
import { DocumentService } from '../services/document.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { UploadDialogComponent } from './upload-dialog';

@Component({
  selector: 'app-documents-page',
  imports: [RouterLink, FormsModule, DatePipe, MatButtonModule, MatIconModule, MatInputModule, MatProgressSpinnerModule, MatTooltipModule],
  templateUrl: './documents-page.html',
  styleUrl: './documents-page.scss'
})
export class DocumentsPage implements OnInit, OnDestroy {
  private readonly documentService = inject(DocumentService);
  private readonly notify = inject(NotificationService);
  private readonly dialog = inject(MatDialog);
  private pollTimer: ReturnType<typeof setTimeout> | null = null;

  documents = signal<Document[]>([]);
  loading = signal(false);
  uploading = signal(false);

  editingId = signal<string | null>(null);
  editingName = signal('');

  private readonly statusConfig: Record<Document['status'], { color: string; icon: string }> = {
    Ready:      { color: 'primary', icon: 'check_circle' },
    Processing: { color: 'accent',  icon: 'sync' },
    Uploading:  { color: 'accent',  icon: 'upload' },
    Failed:     { color: 'warn',    icon: 'error' },
  };

  ngOnInit(): void {
    this.loadDocuments();
  }

  ngOnDestroy(): void {
    if (this.pollTimer !== null) clearTimeout(this.pollTimer);
  }

  loadDocuments(): void {
    this.loading.set(true);
    this.documentService.getDocuments().subscribe({
      next: docs => {
        this.documents.set(docs);
        this.loading.set(false);
        if (docs.some(d => d.status === 'Uploading' || d.status === 'Processing'))
          this.pollTimer = setTimeout(() => this.loadDocuments(), 15000);
      },
      error: () => { this.loading.set(false); this.notify.error('Failed to load documents.'); }
    });
  }

  openUploadDialog(): void {
    const ref = this.dialog.open(UploadDialogComponent, { width: '440px' });
    ref.afterClosed().subscribe(result => {
      if (!result) return;
      this.uploading.set(true);
      this.documentService.uploadDocument(result.file, result.displayName).subscribe({
        next: () => { this.uploading.set(false); this.loadDocuments(); },
        error: () => { this.uploading.set(false); this.notify.error('Upload failed. Please try again.'); }
      });
    });
  }

  startEdit(doc: Document): void {
    this.editingId.set(doc.id);
    this.editingName.set(doc.displayName);
  }

  saveEdit(doc: Document): void {
    const name = this.editingName().trim();
    if (!name || name === doc.displayName) { this.cancelEdit(); return; }

    this.documentService.renameDocument(doc.id, name).subscribe({
      next: () => {
        this.documents.update(docs => docs.map(d => d.id === doc.id ? { ...d, displayName: name } : d));
        this.cancelEdit();
      },
      error: () => this.notify.error('Failed to rename document.')
    });
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.editingName.set('');
  }

  deleteDocument(id: string): void {
    if (!confirm('Delete this document and all its data?')) return;
    this.documentService.deleteDocument(id).subscribe({
      next: () => {
        this.documents.update(docs => docs.filter(d => d.id !== id));
        this.notify.success('Document deleted.');
      },
      error: () => this.notify.error('Failed to delete document.')
    });
  }

  statusColor(status: Document['status']): string {
    return this.statusConfig[status].color;
  }

  statusIcon(status: Document['status']): string {
    return this.statusConfig[status].icon;
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}
