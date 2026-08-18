import { HttpErrorResponse, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { BehaviorSubject, Observable, catchError, filter, of, switchMap, take, throwError } from 'rxjs';
import { AuthenticationService } from '../services/authentication.service';
import { completeLogout, httpHeaders, isAuthEndpoint } from '../helpers/auth.helpers';
import { TenantContextService } from '../services/tenant-context.service';

let isTokenRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const tokenInterceptor: HttpInterceptorFn = (request, next) => {
  const authService = inject(AuthenticationService);
  const tenantContext = inject(TenantContextService);

  if (isAuthEndpoint(request.url)) {
    // Les routes login/OTP/select-role ne doivent pas recevoir un ancien Bearer, mais elles ont
    // besoin du tenant choisi pour charger les profils dans la base de la bonne école.
    const tenantId = tenantContext.tenantId;
    return next(request.clone({
      withCredentials: true,
      setHeaders: tenantId ? { 'X-SGS-Tenant-ID': tenantId } : {}
    }));
  }

  const authorizedRequest = request.clone({
    withCredentials: true,
    setHeaders: requestHeaders(tenantContext)
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
      // Le refresh token est un cookie HttpOnly : le frontend ne peut et ne doit pas tester sa
      // présence. La gateway répondra 401 si la session de renouvellement n'existe plus.
      return handleRefreshToken(authorizedRequest, next, authService, tenantContext);
    })
  );
};

function handleRefreshToken(
  request: HttpRequest<unknown>,
  next: HttpHandlerFn,
  authService: AuthenticationService
  , tenantContext: TenantContextService
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
        return next(request.clone({ withCredentials: true, setHeaders: requestHeaders(tenantContext) }));
      })
    );
  }

  return refreshTokenSubject.pipe(
    // BehaviorSubject émet immédiatement sa valeur initiale null. Sans ce filtre, les requêtes
    // parallèles repartent aussitôt avec le jeton expiré pendant que la première le renouvelle.
    filter((status): status is string => status !== null),
    take(1),
    switchMap(() => next(request.clone({ withCredentials: true, setHeaders: requestHeaders(tenantContext) })))
  );
}

function requestHeaders(tenantContext: TenantContextService): Record<string, string> {
  const headers = httpHeaders();
  const tenantId = tenantContext.tenantId;
  if (tenantId) headers['X-SGS-Tenant-ID'] = tenantId;
  return headers;
}
