import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

export interface UploadDialogResult {
  file: File;
  displayName: string;
}

@Component({
  selector: 'app-upload-dialog',
  imports: [FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>Upload Document</h2>
    <mat-dialog-content>
      <div class="file-picker">
        @if (file()) {
          <div class="file-selected">
            <mat-icon>description</mat-icon>
            <span>{{ file()!.name }}</span>
            <button mat-icon-button (click)="clearFile()"><mat-icon>close</mat-icon></button>
          </div>
        } @else {
          <button mat-stroked-button (click)="fileInput.click()">
            <mat-icon>attach_file</mat-icon> Choose file
          </button>
        }
        <input #fileInput type="file" accept=".pdf,.docx" hidden (change)="onFileSelected($event)">
      </div>

      <mat-form-field appearance="outline" class="name-field">
        <mat-label>Name</mat-label>
        <input matInput [(ngModel)]="displayName" placeholder="Give this document a name" />
      </mat-form-field>
      <p class="upload-note">* Depending on document size, parsing may take a few minutes.</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button [disabled]="!file() || !displayName.trim()" (click)="confirm()">Upload</button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-dialog-content { display: flex; flex-direction: column; gap: 16px; padding-top: 8px; min-width: 360px; }
    .file-picker { display: flex; align-items: center; }
    .file-selected { display: flex; align-items: center; gap: 8px; font-size: 14px; overflow: hidden; }
    .file-selected span { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .name-field { width: 100%; }
    .upload-note { margin: 0; font-size: 12px; color: var(--mat-sys-on-surface-variant); }
  `]
})
export class UploadDialogComponent {
  file = signal<File | null>(null);
  displayName = '';

  constructor(private dialogRef: MatDialogRef<UploadDialogComponent, UploadDialogResult>) {}

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const selected = input.files?.[0];
    if (!selected) return;
    this.file.set(selected);
    if (!this.displayName.trim())
      this.displayName = selected.name.replace(/\.[^.]+$/, '');
    input.value = '';
  }

  clearFile(): void {
    this.file.set(null);
  }

  confirm(): void {
    const f = this.file();
    if (!f) return;
    this.dialogRef.close({ file: f, displayName: this.displayName.trim() });
  }
}
