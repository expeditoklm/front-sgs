import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/auth.models';
import { PermissionMatrix } from '../models/permission.models';

@Injectable({ providedIn: 'root' })
export class PermissionService {
  private readonly endpoint = `${environment.apiUrl}/referentiels/profils/matrice-permissions`;

  constructor(private http: HttpClient) {
  }

  charger(): Observable<PermissionMatrix> {
    return this.http.get<ApiResponse<PermissionMatrix>>(this.endpoint)
      .pipe(map(response => response.data));
  }

  enregistrer(affectations: Record<string, string[]>): Observable<PermissionMatrix> {
    return this.http.put<ApiResponse<PermissionMatrix>>(this.endpoint, { affectations })
      .pipe(map(response => response.data));
  }
}
