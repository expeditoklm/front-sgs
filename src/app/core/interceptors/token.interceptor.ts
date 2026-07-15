import { HttpErrorResponse, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { BehaviorSubject, Observable, catchError, filter, of, switchMap, take, throwError } from 'rxjs';
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
      // Les microservices SGS renvoient actuellement un 403 sans corps lorsqu'aucune
      // Authentication n'a été créée par GlobalAuthenticationFilter. Fonctionnellement,
      // c'est le même cas qu'un 401 : tenter une fois le refresh avant d'abandonner.
      const authenticationMissing = error.status === 401 ||
        (error.status === 403 && (error.error === null || error.error === '' || error.error === undefined));
      if (!authenticationMissing) {
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
    // BehaviorSubject émet immédiatement sa valeur initiale null. Sans ce filtre, les requêtes
    // parallèles repartent aussitôt avec le jeton expiré pendant que la première le renouvelle.
    filter((status): status is string => status !== null),
    take(1),
    switchMap(() => next(request.clone({ withCredentials: true, setHeaders: httpHeaders() })))
  );
}
