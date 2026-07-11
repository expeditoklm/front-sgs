import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/audit.models';

export interface ArchivedBulletin {
  uuid: string;
  eleveUuid: string;
  eleveNomComplet: string;
  classeLibelle: string;
  periodeLibelle: string;
  anneeScolaireCode: string;
  etatCode: string;
  taille: number;
  genereLe: string;
  telechargement: string;
}

// Consomme le catalogue d'États administrables (service-report, cf. EtatController) - distinct de
// InscriptionService.telechargerRecu (service-inscription, flux PDF direct) : ici la réponse est
// enveloppée dans ApiResponse et le PDF y est encodé en base64 (Jackson sérialise tout byte[] de
// cette façon), pas un flux binaire brut - cf. EtatController.generate() côté backend.
@Injectable({ providedIn: 'root' })
export class ReportService {
  private base = `${environment.apiUrl}/reports`;

  constructor(private http: HttpClient) {
  }

  genererCertificatInscription(inscriptionUuid: string): Observable<Blob> {
    return this.http
      .post<ApiResponse<string>>(`${this.base}/CERTIFICAT_INSCRIPTION/generate`, { inscriptionUuid })
      .pipe(map((response) => this.base64ToPdfBlob(response.data)));
  }

  listerBulletinsParents(): Observable<ArchivedBulletin[]> {
    return this.http
      .get<ApiResponse<ArchivedBulletin[]>>(`${this.base}/parents/bulletins`)
      .pipe(map((response) => response.data ?? []));
  }

  telechargerBulletinArchive(uuid: string): Observable<Blob> {
    return this.http.get(`${this.base}/parents/bulletins/${uuid}/download`, {
      responseType: 'blob'
    });
  }

  private base64ToPdfBlob(base64: string): Blob {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    return new Blob([new Uint8Array(byteNumbers)], { type: 'application/pdf' });
  }
}
