import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PageResponse } from '../models/audit.models';
import { ListCriteria } from './referentiel-crud.service';
import { FilterCriteria } from '../models/inscription.models';
import {
  DecisionSuggeree,
  Deliberation,
  DeliberationDecision,
  DeliberationDecisionRequest,
  DeliberationRequest,
  Evaluation,
  EvaluationRequest,
  MoyenneGenerale,
  MoyenneMatiere,
  Note,
  NoteLotRequest,
  NoteLotResponse,
  StatistiqueClassePedagogie,
  StatistiqueMatierePedagogie
} from '../models/pedagogie.models';

// Module "Pédagogie — Notes & Moyennes" - un seul service pour évaluations + notes, puisqu'elles
// sont toujours manipulées ensemble depuis les mêmes écrans (liste des évaluations, grille de
// saisie des notes d'une évaluation), même choix que InscriptionService.
@Injectable({ providedIn: 'root' })
export class PedagogieService {
  private base = `${environment.apiUrl}/pedagogie`;

  constructor(private http: HttpClient) {
  }

  // --- Évaluations -------------------------------------------------------

  filterEvaluations(filters: FilterCriteria[], criteria: ListCriteria): Observable<PageResponse<Evaluation>> {
    return this.http
      .post<ApiResponse<PageResponse<Evaluation>>>(`${this.base}/evaluations/filter`, filters, {
        params: this.paginationParams(criteria)
      })
      .pipe(map((response) => response.data));
  }

  getEvaluation(uuid: string): Observable<Evaluation> {
    return this.http
      .get<ApiResponse<Evaluation>>(`${this.base}/evaluations/${uuid}`)
      .pipe(map((response) => response.data));
  }

  createEvaluation(payload: EvaluationRequest): Observable<Evaluation> {
    return this.http
      .post<ApiResponse<Evaluation>>(`${this.base}/evaluations`, payload)
      .pipe(map((response) => response.data));
  }

  updateEvaluation(uuid: string, payload: EvaluationRequest): Observable<Evaluation> {
    return this.http
      .put<ApiResponse<Evaluation>>(`${this.base}/evaluations/${uuid}`, payload)
      .pipe(map((response) => response.data));
  }

  deleteEvaluation(uuid: string): Observable<boolean> {
    return this.http
      .delete<ApiResponse<boolean>>(`${this.base}/evaluations/${uuid}`)
      .pipe(map((response) => response.data));
  }

  // Remplace le PUT générique pour ce changement de statut précis - jamais de saut direct via un
  // update() générique, cf. EvaluationController.publier côté backend.
  publierEvaluation(uuid: string): Observable<Evaluation> {
    return this.http
      .post<ApiResponse<Evaluation>>(`${this.base}/evaluations/${uuid}/publier`, {})
      .pipe(map((response) => response.data));
  }

  // --- Notes ---------------------------------------------------------------

  // Grille de saisie d'une évaluation - hook générique GET/POST .../find?evaluationUuid=...,
  // cf. NoteController.doFind côté backend.
  getNotesByEvaluation(evaluationUuid: string): Observable<Note[]> {
    return this.http
      .get<ApiResponse<Note[]>>(`${this.base}/notes/find`, {
        params: new HttpParams().set('evaluationUuid', evaluationUuid)
      })
      .pipe(map((response) => response.data));
  }

  // Saisie en lot (grille classe x élèves) - une seule requête plutôt qu'un POST générique par
  // élève, cf. NoteController.saisirEnLot côté backend. Chaque ligne est validée indépendamment :
  // une ligne invalide est rapportée dans NoteLotResponse.erreurs sans bloquer les autres.
  saisirNotesEnLot(payload: NoteLotRequest): Observable<NoteLotResponse> {
    return this.http
      .post<ApiResponse<NoteLotResponse>>(`${this.base}/notes/lot`, payload)
      .pipe(map((response) => response.data));
  }

  // --- Moyennes (lecture seule, tous rôles pédagogie - cf. MoyenneController @PreAuthorize) ------

  getMoyennesMatiere(inscriptionId: number, periodeId: number): Observable<MoyenneMatiere[]> {
    return this.http
      .get<ApiResponse<MoyenneMatiere[]>>(`${this.base}/moyennes/matieres`, {
        params: new HttpParams().set('inscriptionId', inscriptionId).set('periodeId', periodeId)
      })
      .pipe(map((response) => response.data));
  }

  getMoyenneGenerale(inscriptionId: number, periodeId: number): Observable<MoyenneGenerale | null> {
    return this.http
      .get<ApiResponse<MoyenneGenerale | null>>(`${this.base}/moyennes/generale`, {
        params: new HttpParams().set('inscriptionId', inscriptionId).set('periodeId', periodeId)
      })
      .pipe(map((response) => response.data));
  }

  // Palmarès de classe (par opposition à getMoyenneGenerale, "par élève") - une seule requête
  // batchée côté backend, cf. MoyenneCalculationService.getMoyennesGeneralesClasse.
  getMoyennesGeneralesClasse(classeId: number, periodeId: number): Observable<MoyenneGenerale[]> {
    return this.http
      .get<ApiResponse<MoyenneGenerale[]>>(`${this.base}/moyennes/generale/classe`, {
        params: new HttpParams().set('classeId', classeId).set('periodeId', periodeId)
      })
      .pipe(map((response) => response.data));
  }

  // periodeId omis = fin d'année (moyenne annuelle, décision de passage) - cf. MoyenneController.
  getDecisionSuggeree(inscriptionId: number, periodeId: number | null): Observable<DecisionSuggeree> {
    let params = new HttpParams().set('inscriptionId', inscriptionId);
    if (periodeId != null) {
      params = params.set('periodeId', periodeId);
    }
    return this.http
      .get<ApiResponse<DecisionSuggeree>>(`${this.base}/moyennes/decision-suggeree`, { params })
      .pipe(map((response) => response.data));
  }

  // Statistiques agrégées de la classe (tableau de bord) - cf. MoyenneController.statistiquesClasse.
  getStatistiquesClasse(classeId: number, periodeId: number): Observable<StatistiqueClassePedagogie> {
    return this.http
      .get<ApiResponse<StatistiqueClassePedagogie>>(`${this.base}/moyennes/statistiques/classe`, {
        params: new HttpParams().set('classeId', classeId).set('periodeId', periodeId)
      })
      .pipe(map((response) => response.data));
  }

  getStatistiquesParMatiere(classeId: number, periodeId: number): Observable<StatistiqueMatierePedagogie[]> {
    return this.http
      .get<ApiResponse<StatistiqueMatierePedagogie[]>>(`${this.base}/moyennes/statistiques/matieres`, {
        params: new HttpParams().set('classeId', classeId).set('periodeId', periodeId)
      })
      .pipe(map((response) => response.data));
  }

  // --- Délibération (SADM/ADM uniquement - cf. DeliberationController @PreAuthorize) --------------

  filterDeliberations(filters: FilterCriteria[], criteria: ListCriteria): Observable<PageResponse<Deliberation>> {
    return this.http
      .post<ApiResponse<PageResponse<Deliberation>>>(`${this.base}/deliberations/filter`, filters, {
        params: this.paginationParams(criteria)
      })
      .pipe(map((response) => response.data));
  }

  getDeliberation(uuid: string): Observable<Deliberation> {
    return this.http
      .get<ApiResponse<Deliberation>>(`${this.base}/deliberations/${uuid}`)
      .pipe(map((response) => response.data));
  }

  creerDeliberation(payload: DeliberationRequest): Observable<Deliberation> {
    return this.http
      .post<ApiResponse<Deliberation>>(`${this.base}/deliberations`, payload)
      .pipe(map((response) => response.data));
  }

  // PLANIFIEE -> EN_COURS : crée une DeliberationDecision par élève VALIDEE de la classe, avec
  // suggestion automatique - cf. DeliberationWorkflowService.ouvrir.
  ouvrirDeliberation(uuid: string): Observable<Deliberation> {
    return this.http
      .post<ApiResponse<Deliberation>>(`${this.base}/deliberations/${uuid}/ouvrir`, {})
      .pipe(map((response) => response.data));
  }

  // EN_COURS -> CLOTUREE : définitif, jamais l'inverse - cf. DeliberationWorkflowService.cloturer.
  cloturerDeliberation(uuid: string): Observable<Deliberation> {
    return this.http
      .post<ApiResponse<Deliberation>>(`${this.base}/deliberations/${uuid}/cloturer`, {})
      .pipe(map((response) => response.data));
  }

  getDecisions(deliberationUuid: string): Observable<DeliberationDecision[]> {
    return this.http
      .get<ApiResponse<DeliberationDecision[]>>(`${this.base}/deliberations/${deliberationUuid}/decisions`)
      .pipe(map((response) => response.data));
  }

  // Le jury confirme ou modifie une décision - jamais possible si la délibération n'est plus
  // EN_COURS, cf. DeliberationWorkflowService.confirmerDecision (rejeté côté serveur sinon).
  confirmerDecision(decisionUuid: string, payload: DeliberationDecisionRequest): Observable<DeliberationDecision> {
    return this.http
      .put<ApiResponse<DeliberationDecision>>(`${this.base}/deliberations/decisions/${decisionUuid}`, payload)
      .pipe(map((response) => response.data));
  }

  private paginationParams(criteria: ListCriteria): HttpParams {
    let params = new HttpParams()
      .set('page', criteria.page)
      .set('size', criteria.size)
      .set('sortField', criteria.sortField)
      .set('sortOrder', criteria.sortOrder);
    if (criteria.filter) {
      params = params.set('filter', criteria.filter);
    }
    return params;
  }
}
