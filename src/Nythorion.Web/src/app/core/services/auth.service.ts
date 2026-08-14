import { inject, Injectable } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly oauthService = inject(OAuthService);

  configure(): void {
    this.oauthService.configure({
      issuer: environment.authUrl,
      redirectUri: window.location.origin + '/callback',
      clientId: environment.clientId,
      scope: environment.scope,
      responseType: 'code',
      postLogoutRedirectUri: window.location.origin,
      requireHttps: false,
      showDebugInformation: false,
      strictDiscoveryDocumentValidation: false,
      skipIssuerCheck: true,
    });
  }

  async init(): Promise<void> {
    await this.oauthService.loadDiscoveryDocumentAndTryLogin();
  }

  login(): void {
    this.oauthService.initCodeFlow();
  }

  logout(): void {
    this.oauthService.logOut();
  }

  get isLoggedIn(): boolean {
    return this.oauthService.hasValidAccessToken();
  }

  get accessToken(): string {
    return this.oauthService.getAccessToken();
  }

  get username(): string {
    const claims = this.oauthService.getIdentityClaims() as Record<string, string> | null;
    return claims?.['name'] ?? claims?.['sub'] ?? '';
  }
}
