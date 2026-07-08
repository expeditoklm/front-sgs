import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, LoginResponse, User } from '../models/auth.models';
import { completeLogout } from '../helpers/auth.helpers';

@Injectable({ providedIn: 'root' })
export class AuthenticationService {
  private endpoint = `${environment.apiUrl}/authentication`;

  user = signal<User | null>(this.userFromStorage);

  constructor(private http: HttpClient) {
  }

  login$(credentials: { username: string; password: string }): Observable<boolean> {
    return this.http
      .post<ApiResponse<LoginResponse>>(`${this.endpoint}/login`, credentials, { withCredentials: true })
      .pipe(
        tap((response) => this.storeAuthentication(response.data)),
        map(() => true),
        catchError(() => of(false))
      );
  }

  refreshToken$(): Observable<LoginResponse | null> {
    return this.http
      .post<ApiResponse<LoginResponse>>(`${this.endpoint}/refresh-token`, {}, { withCredentials: true })
      .pipe(
        tap((response) => this.storeAuthentication(response.data)),
        map((response) => response.data),
        catchError(() => of(null))
      );
  }

  logout(): void {
    this.http.post(`${this.endpoint}/logout`, {}, { withCredentials: true }).subscribe();
    completeLogout();
  }

  get isAuthenticated(): boolean {
    return localStorage.getItem('token') !== null;
  }

  get currentProfile(): string | null {
    return this.user()?.profilCode ?? null;
  }

  hasAnyRole(roles: string[]): boolean {
    const profile = this.currentProfile;
    return profile !== null && roles.includes(profile);
  }

  private get userFromStorage(): User | null {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  }

  private storeAuthentication(authentication: LoginResponse): void {
    localStorage.setItem('token', authentication.token);
    localStorage.setItem('refresh_token', authentication.refreshToken);
    localStorage.setItem('user', JSON.stringify(authentication.user));
    localStorage.setItem('profile', authentication.user.profilCode);
    this.user.set(authentication.user);
  }
}
