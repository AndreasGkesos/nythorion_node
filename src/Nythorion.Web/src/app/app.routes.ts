import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { CallbackComponent } from './core/components/callback';

export const routes: Routes = [
  { path: '', redirectTo: 'documents', pathMatch: 'full' },
  { path: 'callback', component: CallbackComponent },
  {
    path: 'documents',
    loadComponent: () => import('./features/documents/components/documents-page').then(m => m.DocumentsPage),
    canActivate: [authGuard]
  },
  {
    path: 'documents/:id',
    loadComponent: () => import('./features/documents/components/document-detail-page').then(m => m.DocumentDetailPage),
    canActivate: [authGuard]
  },
  {
    path: 'search',
    loadComponent: () => import('./features/search/components/search-page').then(m => m.SearchPage),
    canActivate: [authGuard]
  },
  {
    path: 'ask',
    loadComponent: () => import('./features/search/components/ask-page').then(m => m.AskPage),
    canActivate: [authGuard]
  },
  {
    path: 'chat',
    loadComponent: () => import('./features/search/components/chat-page').then(m => m.ChatPage),
    canActivate: [authGuard]
  }
];
