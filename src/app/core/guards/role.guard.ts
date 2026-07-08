import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthenticationService } from '../services/authentication.service';

/**
 * Protège une route en fonction des rôles autorisés déclarés dans route.data.roles.
 * Exemple : { path: 'admin', canActivate: [roleGuard], data: { roles: ['SADM', 'ADM'] } }
 */
export const roleGuard: CanActivateFn = (route) => {
  const authService = inject(AuthenticationService);
  const router = inject(Router);

  const allowedRoles: string[] = route.data['roles'] ?? [];
  if (allowedRoles.length === 0 || authService.hasAnyRole(allowedRoles)) {
    return true;
  }

  return router.createUrlTree(['/']);
};
