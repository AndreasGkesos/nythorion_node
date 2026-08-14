import { HttpHandlerFn, HttpInterceptorFn, HttpRequest, HttpStatusCode } from '@angular/common/http';
import { inject } from '@angular/core';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../../shared/services/notification.service';

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  if (!req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }

  const auth = inject(AuthService);
  const notify = inject(NotificationService);
  const token = auth.accessToken;
  const outgoing = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(outgoing).pipe(
    tap({
      error: err => {
        switch (err.status) {
          case HttpStatusCode.Unauthorized:
            auth.login();
            break;
          case HttpStatusCode.Forbidden:
            notify.error('You do not have permission to perform this action.');
            break;
          case HttpStatusCode.InternalServerError:
            notify.error('A server error occurred. Please try again.');
            break;
          case 0: // network failure or CORS — no HTTP response received
            notify.error('Could not reach the server. Check your connection.');
            break;
        }
      }
    })
  );
};
