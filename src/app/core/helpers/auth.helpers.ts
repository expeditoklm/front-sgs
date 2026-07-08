import { environment } from '../../../environments/environment';

export function completeLogout(): void {
  localStorage.clear();
  window.location.href = '/signin';
}

export function httpHeaders(): Record<string, string> {
  return {
    'X-App-Name': 'SGS',
    'X-User-Role': localStorage.getItem('profile') || ''
  };
}

export function isAuthEndpoint(url: string): boolean {
  const endpointsToSkip = [
    'login',
    'validate-otp',
    'select-role',
    'resend-otp',
    'refresh-token',
    'reset-request',
    'reset'
  ];
  return endpointsToSkip.some((endpoint) => url.includes(endpoint));
}

export function frontendUrl(path: string): string {
  return environment.frontendUrl + path;
}
