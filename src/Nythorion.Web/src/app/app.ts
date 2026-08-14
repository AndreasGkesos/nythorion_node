import { Component, inject, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from './core/services/auth.service';
import { ConfigService } from './core/services/config.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatSidenavModule, MatToolbarModule, MatListModule, MatIconModule, MatButtonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  private readonly auth = inject(AuthService);
  readonly configService = inject(ConfigService);

  get username(): string {
    return this.auth.username;
  }

  ngOnInit(): void {
    if (this.auth.isLoggedIn) this.configService.load();
  }

  logout(): void {
    this.auth.logout();
  }
}
