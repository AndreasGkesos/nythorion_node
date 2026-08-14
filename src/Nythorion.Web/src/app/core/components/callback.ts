import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-callback',
  template: ''
})
export class CallbackComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  async ngOnInit(): Promise<void> {
    await this.auth.init();
    await this.router.navigateByUrl('/documents');
  }
}
