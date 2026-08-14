import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { CallbackComponent } from './core/components/callback';

// TEMP: authGuard disabled on document/search routes while auth is not yet wired
// into Nythorion.Api (see CLAUDE.md build order — auth is its own later slice).
// Restore `canActivate: [authGuard]` once that slice lands.
export const routes: Routes = [
  { path: '', redirectTo: 'documents', pathMatch: 'full' },
  { path: 'callback', component: CallbackComponent },
  {
    path: 'documents',
    loadComponent: () => import('./features/documents/components/documents-page').then(m => m.DocumentsPage)
  },
  {
    path: 'documents/:id',
    loadComponent: () => import('./features/documents/components/document-detail-page').then(m => m.DocumentDetailPage)
  },
  {
    path: 'search',
    loadComponent: () => import('./features/search/components/search-page').then(m => m.SearchPage)
  },
  {
    path: 'ask',
    loadComponent: () => import('./features/search/components/ask-page').then(m => m.AskPage)
  },
  {
    path: 'chat',
    loadComponent: () => import('./features/search/components/chat-page').then(m => m.ChatPage)
  }
];
