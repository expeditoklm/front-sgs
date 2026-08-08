import { environment } from '../../../environments/environment';

export function completeLogout(): void {
  // Le tenant sélectionné représente le portail/établissement dans lequel
  // l'utilisateur souhaite se connecter. Il ne fait pas partie de la session
  // d'authentification et doit survivre à une déconnexion, à un token expiré
  // ou au parcours OTP. Le supprimer ici faisait perdre X-SGS-Tenant-ID après
  // « Administrer », puis toutes les API métier répondaient 403.
  const tenantContext = localStorage.getItem('sgs_tenant');
  const theme = localStorage.getItem('theme');
  localStorage.clear();
  if (tenantContext) localStorage.setItem('sgs_tenant', tenantContext);
  if (theme) localStorage.setItem('theme', theme);
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
  try {
    const tenant = JSON.parse(localStorage.getItem('sgs_tenant') || 'null');
    if (tenant?.id) headers['X-SGS-Tenant-ID'] = String(tenant.id);
  } catch {
    localStorage.removeItem('sgs_tenant');
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
  // Comparer des segments de route complets. Un simple includes('login') classait par erreur
  // /emplois-du-temps/planning comme endpoint public, car "planning" contient "login" :
  // l'intercepteur retirait alors implicitement le JWT et le service répondait 403.
  const pathname = new URL(url, window.location.origin).pathname;
  if (pathname === '/monitoring/frontend-errors') return true;
  return endpointsToSkip.some((endpoint) =>
    pathname === `/authentication/${endpoint}` ||
    pathname.startsWith(`/authentication/${endpoint}/`)
  );
}

export function frontendUrl(path: string): string {
  return environment.frontendUrl + path;
}
