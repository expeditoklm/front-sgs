import { environment } from '../../../environments/environment';

export function completeLogout(): void {
  localStorage.clear();
  window.location.href = '/signin';
}

export function httpHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'X-App-Name': 'SGS',
    'X-User-Role': localStorage.getItem('profile') || ''
  };

  // Le cookie de session posé par le backend est SameSite=Lax : il n'est pas envoyé sur les
  // appels cross-origin (Angular :4200 -> API :58080). On attache donc explicitement l'access
  // token en Bearer - le backend gère déjà ce fallback (KeycloakAuthorizationFilter.extractToken()).
  const accessToken = localStorage.getItem('access_token');
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  return headers;
}

export function isAuthEndpoint(url: string): boolean {
  const endpointsToSkip = [
    'login',
    'validate-otp',
    'select-role',
    'resend-otp',
    'refresh-token',
    'forgot-password',
    'reset-password-confirm',
    'account-request',
    'frontend-errors'
  ];
  return endpointsToSkip.some((endpoint) => url.includes(endpoint));
}

export function frontendUrl(path: string): string {
  return environment.frontendUrl + path;
}
