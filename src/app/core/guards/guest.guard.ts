import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthenticationService } from '../services/authentication.service';
import { environment } from '../../../environments/environment';

export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthenticationService);
  const router = inject(Router);

  if (!environment.authEnabled || !authService.isAuthenticated) {
    return true;
  }

  return router.createUrlTree(['/']);
};
