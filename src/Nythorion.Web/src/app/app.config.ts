import { APP_INITIALIZER, ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideOAuthClient } from 'angular-oauth2-oidc';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { AuthService } from './core/services/auth.service';

function initAuth(auth: AuthService) {
  return async () => {
    auth.configure();
    await auth.init();
  };
}

// TEMP: APP_INITIALIZER auth bootstrap disabled while Nythorion.Api has no auth
// wired up yet (see CLAUDE.md build order — auth is its own later slice).
// With it enabled, app bootstrap blocks on fetching Nythorion.Auth's OIDC
// discovery document, which hangs the app if Auth isn't running. Restore
// once the auth slice lands.
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideAnimationsAsync(),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideOAuthClient(),
    // {
    //   provide: APP_INITIALIZER,
    //   useFactory: initAuth,
    //   deps: [AuthService],
    //   multi: true
    // }
  ]
};
