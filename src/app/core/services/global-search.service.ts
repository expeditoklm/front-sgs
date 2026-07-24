import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, forkJoin, map, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/audit.models';
import { AuthenticationService } from './authentication.service';
import { PersonnelService } from './personnel.service';
import { ReferentielCrudService } from './referentiel-crud.service';

export interface GlobalStudentResult {
  eleveUuid: string;
  matricule: string;
  nomComplet: string;
  telephone: string | null;
  inscriptionUuid: string | null;
  inscriptionCode: string | null;
  classe: string | null;
  anneeScolaire: string | null;
  soldeRestant: number | null;
  dernierNumeroRecu: string | null;
}

export interface GlobalPersonnelResult {
  uuid: string;
  matricule: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string | null;
  categorie: string;
  specialite: string | null;
}

export interface GlobalReferenceResult {
  type: 'Classe' | 'Matière' | 'Salle';
  label: string;
  code: string;
  route: string;
}

export interface GlobalSearchResults {
  students: GlobalStudentResult[];
  personnel: GlobalPersonnelResult[];
  references: GlobalReferenceResult[];
}

@Injectable({ providedIn: 'root' })
export class GlobalSearchService {
  constructor(
    private http: HttpClient,
    private auth: AuthenticationService,
    private personnelService: PersonnelService,
    private referentielService: ReferentielCrudService
  ) {
  }

  search(term: string): Observable<GlobalSearchResults> {
    const students$ = this.canSearchStudents()
      ? this.http.get<ApiResponse<GlobalStudentResult[]>>(
          `${environment.apiUrl}/inscriptions/recherche-globale`,
          { params: new HttpParams().set('q', term).set('limite', 8) }
        ).pipe(map((response) => response.data ?? []), catchError(() => of([])))
      : of([]);

    const personnel$ = this.auth.hasPermission('PERSONNEL_CONSULTER')
      ? this.personnelService.employes(term).pipe(
          map((items) => items.slice(0, 6) as GlobalPersonnelResult[]),
          catchError(() => of([]))
        )
      : of([]);

    const references$ = this.auth.hasPermission('REFERENTIEL_GERER')
      ? forkJoin([
          this.reference('classes', 'Classe', '/referentiels/classes', term),
          this.reference('matieres', 'Matière', '/referentiels/matieres', term),
          this.reference('salles', 'Salle', '/referentiels/salles', term)
        ]).pipe(map((groups) => groups.flat().slice(0, 9)))
      : of([]);

    return forkJoin({ students: students$, personnel: personnel$, references: references$ });
  }

  private reference(
    path: string,
    type: GlobalReferenceResult['type'],
    route: string,
    term: string
  ): Observable<GlobalReferenceResult[]> {
    return this.referentielService.list(path, {
      page: 1,
      size: 4,
      sortField: 'id',
      sortOrder: 'ASC',
      filter: term
    }).pipe(
      map((page) => page.content.map((item) => ({
        type,
        label: item['libelle'] ?? item['nom'] ?? item['code'],
        code: item['code'] ?? '',
        route
      }))),
      catchError(() => of([]))
    );
  }

  private canSearchStudents(): boolean {
    return ['INSCRIPTION_ELEVE_GERER', 'INSCRIPTION_GERER', 'PAIEMENT_GERER']
      .some((permission) => this.auth.hasPermission(permission));
  }
}
