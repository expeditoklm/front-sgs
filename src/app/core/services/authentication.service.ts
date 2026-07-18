import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, MonProfil, ProfileOption, User, UserSummary } from '../models/auth.models';
import { completeLogout } from '../helpers/auth.helpers';

interface LoginStepData {
  token: string;
  user: UserSummary;
}

interface OtpStepData {
  login: string;
  profiles: ProfileOption[];
}

interface RoleSelectionData {
  roleName: string;
  roleUuid: string;
  accessToken: string;
  refreshToken: string;
  permissions: string[];
  profiles?: ProfileOption[];
}

interface RefreshTokenData {
  token: string;
  refreshToken: string;
}

@Injectable({ providedIn: 'root' })
export class AuthenticationService {
  private endpoint = `${environment.apiUrl}/authentication`;

  // Le flux de connexion SGS se fait en 3 étapes (login -> OTP -> sélection de profil) : le token
  // temporaire qui relie ces étapes n'a de sens que le temps de la connexion, donc en mémoire
  // uniquement, jamais en localStorage.
  private pendingToken: string | null = null;
  private pendingUser: UserSummary | null = null;
  private pendingLogin: string | null = null;
  private pendingProfiles: ProfileOption[] = [];

  user = signal<User | null>(this.userFromStorage);

  constructor(private http: HttpClient) {
  }

  login$(credentials: { login: string; password: string }): Observable<{ success: boolean; user?: UserSummary }> {
    return this.http
      .post<ApiResponse<LoginStepData>>(`${this.endpoint}/login`, credentials, { withCredentials: true })
      .pipe(
        tap((response) => {
          this.pendingToken = response.data.token;
          this.pendingUser = response.data.user;
        }),
        map((response) => ({ success: true, user: response.data.user })),
        catchError(() => of({ success: false }))
      );
  }

  validateOtp$(otp: string): Observable<{ success: boolean; profiles?: ProfileOption[] }> {
    if (!this.pendingToken) {
      return of({ success: false });
    }

    return this.http
      .post<ApiResponse<OtpStepData>>(
        `${this.endpoint}/validate-otp`,
        { token: this.pendingToken, otp },
        { withCredentials: true }
      )
      .pipe(
        tap((response) => {
          this.pendingLogin = response.data.login;
          this.pendingProfiles = this.normalizeProfiles(response.data.profiles);
        }),
        map((response) => ({ success: true, profiles: response.data.profiles })),
        catchError(() => of({ success: false }))
      );
  }

  resendOtp$(): Observable<boolean> {
    if (!this.pendingToken) {
      return of(false);
    }

    return this.http
      .post(`${this.endpoint}/resend-otp`, { token: this.pendingToken }, { withCredentials: true })
      .pipe(
        map(() => true),
        catchError(() => of(false))
      );
  }

  selectRole$(profileCode: string, profileLibelle: string): Observable<boolean> {
    if (!this.pendingToken || !this.pendingUser) {
      return of(false);
    }

    return this.http
      .post<ApiResponse<RoleSelectionData>>(
        `${this.endpoint}/select-role`,
        { token: this.pendingToken, role: profileCode },
        { withCredentials: true }
      )
      .pipe(
        tap((response) => this.storeAuthentication(response.data, profileLibelle)),
        map(() => true),
        catchError(() => of(false))
      );
  }

  availableProfiles$(): Observable<ProfileOption[]> {
    return this.http
      .get<ApiResponse<ProfileOption[]>>(`${this.endpoint}/profiles`)
      .pipe(
        map((response) => this.normalizeProfiles(response.data ?? [])),
        tap((profiles) => this.updateStoredProfiles(profiles))
      );
  }

  switchProfile$(profile: ProfileOption): Observable<boolean> {
    return this.http
      .post<ApiResponse<RoleSelectionData>>(
        `${this.endpoint}/switch-role`,
        { role: profile.code },
        { withCredentials: true }
      )
      .pipe(
        tap((response) => {
          const current = this.user();
          if (!current) return;

          const profiles = this.normalizeProfiles(response.data.profiles ?? current.profiles ?? []);
          const updated: User = {
            ...current,
            profilCode: response.data.roleName.replace(/^ROLE_/, ''),
            profilLibelle: profile.libelle,
            permissions: response.data.permissions ?? [],
            profiles
          };
          localStorage.setItem('user', JSON.stringify(updated));
          localStorage.setItem('profile', updated.profilCode);
          this.user.set(updated);
        }),
        map(() => true),
        catchError(() => of(false))
      );
  }

  // Le backend pose aussi un cookie httpOnly, mais SameSite=Lax : le navigateur ne l'envoie pas
  // sur les appels cross-origin (Angular sur :4200, API sur :58080 - ports différents = origines
  // différentes). On garde donc le vrai access token pour l'attacher nous-mêmes en
  // Authorization: Bearer (cf. httpHeaders()) - le backend accepte déjà ce fallback
  // (KeycloakAuthorizationFilter.extractToken()).
  refreshToken$(): Observable<boolean> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      return of(false);
    }

    return this.http
      .post<ApiResponse<RefreshTokenData>>(
        `${this.endpoint}/refresh-token`,
        { token: refreshToken },
        { withCredentials: true }
      )
      .pipe(
        tap((response) => {
          localStorage.setItem('access_token', response.data.token);
          localStorage.setItem('refresh_token', response.data.refreshToken);
        }),
        map(() => true),
        catchError(() => of(false))
      );
  }

  forgotPassword$(login: string): Observable<boolean> {
    return this.http
      .post(`${this.endpoint}/forgot-password`, { login })
      .pipe(
        map(() => true),
        catchError(() => of(false))
      );
  }

  resetPasswordConfirm$(token: string, newPassword: string): Observable<{ success: boolean; message: string }> {
    return this.http
      .post<ApiResponse<unknown>>(`${this.endpoint}/reset-password-confirm`, { token, newPassword })
      .pipe(
        map((response) => ({ success: true, message: response.message })),
        catchError((error: HttpErrorResponse) => of({
          success: false,
          message: error.error?.details || error.error?.message || 'La réinitialisation du mot de passe a échoué.'
        }))
      );
  }

  requestAccount$(payload: {
    nom: string;
    prenom: string;
    email: string;
    telephone?: string;
    etablissement: string;
    message?: string;
  }): Observable<boolean> {
    return this.http
      .post(`${this.endpoint}/account-request`, payload)
      .pipe(
        map(() => true),
        catchError(() => of(false))
      );
  }

  accountRequests$(status?: string): Observable<any[]> {
    const options = status ? { params: { status } } : {};
    return this.http
      .get<ApiResponse<any[]>>(`${this.endpoint}/account-requests`, options)
      .pipe(map(response => response.data ?? []));
  }

  accountRequestRoles$(): Observable<Array<{ code: string; label: string }>> {
    return this.http
      .get<ApiResponse<Array<{ code: string; label: string }>>>(`${this.endpoint}/account-requests/roles`)
      .pipe(map(response => response.data ?? []));
  }

  approveAccountRequest$(
    uuid: string,
    payload: { username?: string; roleCodes: string[]; comment?: string }
  ): Observable<ApiResponse<unknown>> {
    return this.http.post<ApiResponse<unknown>>(
      `${this.endpoint}/account-requests/${uuid}/approve`,
      payload
    );
  }

  rejectAccountRequest$(uuid: string, reason: string): Observable<ApiResponse<unknown>> {
    return this.http.post<ApiResponse<unknown>>(
      `${this.endpoint}/account-requests/${uuid}/reject`,
      { reason }
    );
  }

  // Réservé SADM/ADM (cf. SecurityConfig.SADM_ADM_PATHS côté gateway) - distinct de
  // resetPasswordConfirm$ (self-service, anonyme). "x-app-user-creation" n'est vérifié que comme
  // UUID syntaxiquement valide côté backend, la vraie protection vient du rôle exigé au gateway.
  resetUserPasswordAdmin$(keycloakUserId: string, newPassword: string): Observable<boolean> {
    return this.http
      .put(
        `${this.endpoint}/reset-password`,
        { userId: keycloakUserId, newPassword },
        { headers: new HttpHeaders({ 'x-app-user-creation': crypto.randomUUID() }) }
      )
      .pipe(
        map(() => true),
        catchError(() => of(false))
      );
  }

  revokeUserSessions$(keycloakUserId: string): Observable<boolean> {
    return this.http
      .post(`${this.endpoint}/${keycloakUserId}/revoke-sessions`, {})
      .pipe(
        map(() => true),
        catchError(() => of(false))
      );
  }

  logout(): void {
    this.http.post(`${this.endpoint}/logout`, {}, { withCredentials: true }).subscribe();
    this.resetPendingState();
    completeLogout();
  }

  get isAuthenticated(): boolean {
    return localStorage.getItem('user') !== null &&
      (localStorage.getItem('access_token') !== null || localStorage.getItem('refresh_token') !== null);
  }

  get currentProfile(): string | null {
    return this.user()?.profilCode ?? null;
  }

  hasAnyRole(roles: string[]): boolean {
    const profile = this.currentProfile;
    return profile !== null && roles.includes(profile);
  }

  hasPermission(permission: string): boolean {
    const user = this.user();
    return user?.profilCode === 'SADM' || (user?.permissions ?? []).includes(permission);
  }

  hasAnyPermission(permissions: string[]): boolean {
    return permissions.length === 0 || permissions.some(permission => this.hasPermission(permission));
  }

  synchroniserProfil(profile: MonProfil): void {
    const current = this.user();
    if (!current) return;

    const updated: User = {
      ...current,
      email: profile.email,
      firstName: profile.firstName,
      lastName: profile.lastName,
      // /mon-profil décrit le compte, pas le contexte de session choisi. Conserver le profil
      // actif évite qu'un rafraîchissement des informations personnelles annule visuellement un
      // basculement (notamment pour un administrateur également parent ou enseignant).
      profilCode: current.profilCode || profile.profilCode,
      profilLibelle: current.profilLibelle || profile.profilLibelle
    };
    localStorage.setItem('user', JSON.stringify(updated));
    this.user.set(updated);
  }

  private get userFromStorage(): User | null {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  }

  private storeAuthentication(data: RoleSelectionData, profileLibelle: string): void {
    const user: User = {
      login: this.pendingLogin ?? '',
      email: this.pendingUser?.email ?? '',
      firstName: this.pendingUser?.firstName ?? '',
      lastName: this.pendingUser?.lastName ?? '',
      profilCode: data.roleName,
      profilLibelle: profileLibelle,
      permissions: data.permissions ?? [],
      profiles: this.normalizeProfiles(data.profiles ?? this.pendingProfiles)
    };

    localStorage.setItem('access_token', data.accessToken);
    localStorage.setItem('refresh_token', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('profile', user.profilCode);
    this.user.set(user);
    this.resetPendingState();
  }

  private resetPendingState(): void {
    this.pendingToken = null;
    this.pendingUser = null;
    this.pendingLogin = null;
    this.pendingProfiles = [];
  }

  private normalizeProfiles(profiles: ProfileOption[]): ProfileOption[] {
    return profiles.map((profile) => ({
      ...profile,
      code: profile.code.replace(/^ROLE_/, '')
    }));
  }

  private updateStoredProfiles(profiles: ProfileOption[]): void {
    const current = this.user();
    if (!current) return;
    const updated = { ...current, profiles };
    localStorage.setItem('user', JSON.stringify(updated));
    this.user.set(updated);
  }
}
