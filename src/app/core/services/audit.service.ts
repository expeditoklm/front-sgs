import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, AuditLogFilters, AuditRevision, PageResponse, ReferentielRecord } from '../models/audit.models';

@Injectable({ providedIn: 'root' })
export class AuditService {
  private endpoint = `${environment.apiUrl}/referentiels`;

  constructor(private http: HttpClient) {
  }

  listRecords(entityPath: string, filter: string, page = 1, size = 25): Observable<PageResponse<ReferentielRecord>> {
    let params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sortField', 'id')
      .set('sortOrder', 'DESC');
    if (filter) {
      params = params.set('filter', filter);
    }

    return this.http
      .get<ApiResponse<PageResponse<ReferentielRecord>>>(`${this.endpoint}/${entityPath}`, { params })
      .pipe(map((response) => response.data));
  }

  getHistory(entityPath: string, id: number): Observable<AuditRevision[]> {
    return this.http
      .get<ApiResponse<AuditRevision[]>>(`${this.endpoint}/${entityPath}/${id}/history`)
      .pipe(map((response) => response.data));
  }

  getAuditLogs(
    entityPath: string,
    filters: AuditLogFilters,
    page: number,
    size: number
  ): Observable<PageResponse<AuditRevision>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (filters.dateFrom) params = params.set('dateFrom', filters.dateFrom);
    if (filters.dateTo) params = params.set('dateTo', filters.dateTo);
    if (filters.operateur) params = params.set('operateur', filters.operateur);
    if (filters.actionType) params = params.set('actionType', filters.actionType);

    return this.http
      .get<ApiResponse<PageResponse<AuditRevision>>>(`${this.endpoint}/${entityPath}/audit-logs`, { params })
      .pipe(map((response) => response.data));
  }
}
