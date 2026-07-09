import { HttpErrorResponse, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { BehaviorSubject, Observable, catchError, of, switchMap, throwError } from 'rxjs';
import { AuthenticationService } from '../services/authentication.service';
import { completeLogout, httpHeaders, isAuthEndpoint } from '../helpers/auth.helpers';

let isTokenRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const tokenInterceptor: HttpInterceptorFn = (request, next) => {
  const authService = inject(AuthenticationService);

  if (isAuthEndpoint(request.url)) {
    return next(request);
  }

  const authorizedRequest = request.clone({
    withCredentials: true,
    setHeaders: httpHeaders()
  });

  return next(authorizedRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401) {
        return throwError(() => error);
      }
      if (localStorage.getItem('refresh_token') !== null) {
        return handleRefreshToken(authorizedRequest, next, authService);
      }
      // 401 sans refresh_token exploitable (token invalide/absent, pas seulement expiré) :
      // aucun rafraîchissement possible, retour direct à /signin plutôt que de laisser
      // l'erreur remonter silencieusement jusqu'au composant appelant.
      completeLogout();
      return throwError(() => error);
    })
  );
};

function handleRefreshToken(
  request: HttpRequest<unknown>,
  next: HttpHandlerFn,
  authService: AuthenticationService
): Observable<any> {
  if (!isTokenRefreshing) {
    isTokenRefreshing = true;
    refreshTokenSubject.next(null);

    return authService.refreshToken$().pipe(
      switchMap((refreshed) => {
        isTokenRefreshing = false;
        if (!refreshed) {
          completeLogout();
          return of();
        }
        refreshTokenSubject.next('refreshed');
        return next(request.clone({ withCredentials: true, setHeaders: httpHeaders() }));
      })
    );
  }

  return refreshTokenSubject.pipe(
    switchMap(() => next(request.clone({ withCredentials: true, setHeaders: httpHeaders() })))
  );
}
