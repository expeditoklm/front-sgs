import { ErrorHandler, Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

// Remonte chaque erreur JS non interceptée vers le gateway (POST /monitoring/frontend-errors,
// public - cf. SecurityConfig côté backend), qui incrémente un compteur Prometheus
// (sgs.frontend.errors) scrapé par le monitoring Kubernetes. Best-effort volontaire : un échec
// du beacon lui-même ne doit jamais faire planter l'app ni remonter d'erreur en cascade.
@Injectable({ providedIn: 'root' })
export class GlobalErrorHandler implements ErrorHandler {
  private http = inject(HttpClient);

  handleError(error: unknown): void {
    console.error(error);

    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? (error.stack ?? '') : '';

    this.http
      .post(`${environment.apiUrl}/monitoring/frontend-errors`, {
        message: message.slice(0, 500),
        url: window.location.href,
        component: this.guessComponent(window.location.pathname),
        stack: stack.slice(0, 2000)
      })
      .subscribe({ error: () => { /* beacon best-effort : on ignore un échec d'envoi */ } });
  }

  private guessComponent(pathname: string): string {
    if (pathname.startsWith('/signin') || pathname.startsWith('/demande-compte') || pathname.startsWith('/reset-password')) return 'signin';
    if (pathname.startsWith('/audit')) return 'audit';
    if (pathname.startsWith('/referentiels')) return 'referentiel';
    if (pathname === '/') return 'dashboard';
    return 'unknown';
  }
}
