import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { environment } from '../../../environments/environment';

export interface AppConfig {
  llmModel: string;
  embedModel: string;
  temperature: number;
  numPredict: number;
}

@Injectable({ providedIn: 'root' })
export class ConfigService {
  private readonly http = inject(HttpClient);
  readonly config = signal<AppConfig | null>(null);

  load(): void {
    this.http.get<AppConfig>(`${environment.apiUrl}/config`).subscribe({
      next: c => this.config.set(c),
      error: () => {}
    });
  }
}
