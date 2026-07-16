import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, MonProfil, MonProfilRequest } from '../models/auth.models';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly endpoint = `${environment.apiUrl}/referentiels/mon-profil`;

  constructor(private http: HttpClient) {
  }

  consulter(): Observable<MonProfil> {
    return this.http
      .get<ApiResponse<MonProfil>>(this.endpoint)
      .pipe(map((response) => response.data));
  }

  modifier(payload: MonProfilRequest): Observable<MonProfil> {
    return this.http
      .put<ApiResponse<MonProfil>>(this.endpoint, payload)
      .pipe(map((response) => response.data));
  }
}
