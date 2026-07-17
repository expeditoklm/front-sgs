import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PageResponse } from '../models/audit.models';

export interface ListCriteria {
  page: number;
  size: number;
  sortField: string;
  sortOrder: 'ASC' | 'DESC';
  filter: string;
}

export interface BusinessParameterOption {
  id: number;
  uuid: string;
  groupe: string;
  code: string;
  libelle: string;
  description?: string;
  ordre: number;
  actif: boolean;
  metadonnees?: string;
}

export interface StorageUploadResponse {
  id: number;
  fileName: string;
  // Le backend expose ici l'UUID du fichier malgré le nom historique "download".
  download: string;
  fileSize: number;
}

// Générique par construction : les 8 référentiels du Module 01 partagent exactement le même
// contrat REST (MasterController/AbstractBaseService côté backend), donc un seul service
// paramétré par path, plutôt que 8 sous-classes quasi identiques.
@Injectable({ providedIn: 'root' })
export class ReferentielCrudService {
  private endpoint = `${environment.apiUrl}/referentiels`;

  constructor(private http: HttpClient) {
  }

  list(path: string, criteria: ListCriteria): Observable<PageResponse<Record<string, any>>> {
    let params = new HttpParams()
      .set('page', criteria.page)
      .set('size', criteria.size)
      .set('sortField', criteria.sortField)
      .set('sortOrder', criteria.sortOrder);
    if (criteria.filter) {
      params = params.set('filter', criteria.filter);
    }

    return this.http
      .get<ApiResponse<PageResponse<Record<string, any>>>>(`${this.endpoint}/${path}`, { params })
      .pipe(map((response) => response.data));
  }

  create(path: string, payload: Record<string, unknown>): Observable<Record<string, any>> {
    return this.http
      .post<ApiResponse<Record<string, any>>>(`${this.endpoint}/${path}`, payload)
      .pipe(map((response) => response.data));
  }

  update(path: string, uuid: string, payload: Record<string, unknown>): Observable<Record<string, any>> {
    return this.http
      .put<ApiResponse<Record<string, any>>>(`${this.endpoint}/${path}/${uuid}`, payload)
      .pipe(map((response) => response.data));
  }

  remove(path: string, uuid: string): Observable<boolean> {
    return this.http
      .delete<ApiResponse<boolean>>(`${this.endpoint}/${path}/${uuid}`)
      .pipe(map((response) => response.data));
  }

  businessParameterOptions(group: string, niveauCode?: string | null): Observable<BusinessParameterOption[]> {
    let params = new HttpParams().set('groupe', group);
    if (niveauCode) {
      params = params.set('niveauCode', niveauCode);
    }
    return this.http.get<ApiResponse<BusinessParameterOption[]>>(
      `${this.endpoint}/parametres-metier-options`,
      { params }
    ).pipe(map((response) => response.data));
  }

  uploadFile(file: File, directory: string): Observable<StorageUploadResponse> {
    const formData = new FormData();
    formData.append('directory', directory);
    formData.append('file', file);
    return this.http.post<StorageUploadResponse>(`${environment.apiUrl}/storage/upload`, formData);
  }

  publicLogoUrl(fileUuid: string): string {
    return `${environment.apiUrl}/storage/public/logos/${encodeURIComponent(fileUuid)}`;
  }
}
