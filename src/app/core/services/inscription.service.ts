import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PageResponse } from '../models/audit.models';
import { ListCriteria } from './referentiel-crud.service';
import {
  Eleve,
  EleveParent,
  EleveParentRequest,
  EleveRequest,
  FilterCriteria,
  Inscription,
  InscriptionRequest,
  Paiement,
  ParentTuteur,
  ParentTuteurRequest,
  PieceJustificative,
  PieceJustificativeRequest,
  StatistiqueClasse,
  StatistiqueNiveau,
  StatistiqueSexe,
  StatutInscription,
  UploadResponse
} from '../models/inscription.models';

// Regroupe les appels du module Inscription des Élèves - un seul service plutôt qu'un par
// sous-ressource (Eleve/ParentTuteur/PieceJustificative), puisqu'ils sont presque toujours utilisés
// ensemble depuis la même page "dossier élève".
@Injectable({ providedIn: 'root' })
export class InscriptionService {
  private base = `${environment.apiUrl}/inscriptions`;
  private storageEndpoint = `${environment.apiUrl}/storage`;

  constructor(private http: HttpClient) {
  }

  // --- Élèves ---------------------------------------------------------

  listEleves(criteria: ListCriteria): Observable<PageResponse<Eleve>> {
    let params = new HttpParams()
      .set('page', criteria.page)
      .set('size', criteria.size)
      .set('sortField', criteria.sortField)
      .set('sortOrder', criteria.sortOrder);
    if (criteria.filter) {
      params = params.set('filter', criteria.filter);
    }
    return this.http
      .get<ApiResponse<PageResponse<Eleve>>>(`${this.base}/eleves`, { params })
      .pipe(map((response) => response.data));
  }

  getEleve(uuid: string): Observable<Eleve> {
    return this.http
      .get<ApiResponse<Eleve>>(`${this.base}/eleves/${uuid}`)
      .pipe(map((response) => response.data));
  }

  createEleve(payload: EleveRequest): Observable<Eleve> {
    return this.http
      .post<ApiResponse<Eleve>>(`${this.base}/eleves`, payload)
      .pipe(map((response) => response.data));
  }

  updateEleve(uuid: string, payload: EleveRequest): Observable<Eleve> {
    return this.http
      .put<ApiResponse<Eleve>>(`${this.base}/eleves/${uuid}`, payload)
      .pipe(map((response) => response.data));
  }

  deleteEleve(uuid: string): Observable<boolean> {
    return this.http
      .delete<ApiResponse<boolean>>(`${this.base}/eleves/${uuid}`)
      .pipe(map((response) => response.data));
  }

  // --- Inscriptions d'un élève ------------------------------------------

  listInscriptionsByEleve(eleveUuid: string): Observable<Inscription[]> {
    return this.http
      .get<ApiResponse<Inscription[]>>(`${this.base}/inscriptions/find`, {
        params: new HttpParams().set('eleveUuid', eleveUuid)
      })
      .pipe(map((response) => response.data));
  }

  createInscription(payload: InscriptionRequest): Observable<Inscription> {
    return this.http
      .post<ApiResponse<Inscription>>(`${this.base}/inscriptions`, payload)
      .pipe(map((response) => response.data));
  }

  // Suivi des inscriptions (tableau paginé/filtrable) - passe par le endpoint générique
  // POST .../filter (cf. bj.sgs.core.MasterController.filter / FilterSpecification), pas de
  // endpoint dédié côté backend : les critères (statut, type, classe, texte élève...) sont
  // exprimés comme une liste de FilterCriteria, "field" acceptant un chemin pointé pour les
  // relations (ex. "eleve.nom").
  filterInscriptions(filters: FilterCriteria[], criteria: ListCriteria): Observable<PageResponse<Inscription>> {
    return this.http
      .post<ApiResponse<PageResponse<Inscription>>>(`${this.base}/inscriptions/filter`, filters, {
        params: this.paginationParams(criteria)
      })
      .pipe(map((response) => response.data));
  }

  transition(uuid: string, statutCible: StatutInscription, motif?: string): Observable<Inscription> {
    return this.http
      .post<ApiResponse<Inscription>>(`${this.base}/inscriptions/${uuid}/transition`, { statutCible, motif })
      .pipe(map((response) => response.data));
  }

  // --- Parents/tuteurs rattachés à un élève ---------------------------

  getParents(eleveUuid: string): Observable<EleveParent[]> {
    return this.http
      .get<ApiResponse<EleveParent[]>>(`${this.base}/eleves/${eleveUuid}/parents`)
      .pipe(map((response) => response.data));
  }

  attacherParent(eleveUuid: string, payload: EleveParentRequest): Observable<EleveParent> {
    return this.http
      .post<ApiResponse<EleveParent>>(`${this.base}/eleves/${eleveUuid}/parents`, payload)
      .pipe(map((response) => response.data));
  }

  detacherParent(eleveUuid: string, parentTuteurUuid: string): Observable<boolean> {
    return this.http
      .delete<ApiResponse<boolean>>(`${this.base}/eleves/${eleveUuid}/parents/${parentTuteurUuid}`)
      .pipe(map((response) => response.data));
  }

  // --- ParentTuteur (référentiel des parents, recherche/création) -----

  rechercherParentParTelephone(telephone: string): Observable<PageResponse<ParentTuteur>> {
    return this.http
      .get<ApiResponse<PageResponse<ParentTuteur>>>(`${this.base}/parents-tuteurs`, {
        params: new HttpParams()
          .set('page', 1)
          .set('size', 5)
          .set('sortField', 'id')
          .set('sortOrder', 'DESC')
          .set('filter', telephone)
      })
      .pipe(map((response) => response.data));
  }

  // findExistingOrCreate côté backend : si le téléphone existe déjà, renvoie le ParentTuteur
  // existant sans doublon plutôt que de lever une erreur d'unicité.
  creerOuRecupererParent(payload: ParentTuteurRequest): Observable<ParentTuteur> {
    return this.http
      .post<ApiResponse<ParentTuteur>>(`${this.base}/parents-tuteurs`, payload)
      .pipe(map((response) => response.data));
  }

  // --- Pièces justificatives -------------------------------------------

  getPiecesJustificatives(inscriptionUuid: string): Observable<PieceJustificative[]> {
    return this.http
      .get<ApiResponse<PieceJustificative[]>>(`${this.base}/pieces-justificatives/find`, {
        params: new HttpParams().set('inscriptionUuid', inscriptionUuid)
      })
      .pipe(map((response) => response.data));
  }

  creerPieceJustificative(payload: PieceJustificativeRequest): Observable<PieceJustificative> {
    return this.http
      .post<ApiResponse<PieceJustificative>>(`${this.base}/pieces-justificatives`, payload)
      .pipe(map((response) => response.data));
  }

  supprimerPieceJustificative(uuid: string): Observable<boolean> {
    return this.http
      .delete<ApiResponse<boolean>>(`${this.base}/pieces-justificatives/${uuid}`)
      .pipe(map((response) => response.data));
  }

  // --- Upload de fichier (service-referentiel/StorageController) -------
  // Réponse non enveloppée dans ApiResponse (cf. UploadResponse) - contrairement à tous les autres
  // appels de ce service.
  uploaderFichier(file: File, directory = 'inscriptions'): Observable<UploadResponse> {
    const formData = new FormData();
    formData.append('directory', directory);
    formData.append('file', file);
    return this.http.post<UploadResponse>(`${this.storageEndpoint}/upload`, formData);
  }

  // --- Suivi des paiements ----------------------------------------------

  filterPaiements(filters: FilterCriteria[], criteria: ListCriteria): Observable<PageResponse<Paiement>> {
    return this.http
      .post<ApiResponse<PageResponse<Paiement>>>(`${this.base}/paiements/filter`, filters, {
        params: this.paginationParams(criteria)
      })
      .pipe(map((response) => response.data));
  }

  confirmerPaiement(uuid: string): Observable<Paiement> {
    return this.http
      .post<ApiResponse<Paiement>>(`${this.base}/paiements/${uuid}/confirmer`, {})
      .pipe(map((response) => response.data));
  }

  // Le reçu est un vrai flux PDF (application/pdf), pas enveloppé dans ApiResponse - cf.
  // PaiementController.telechargerRecu.
  telechargerRecu(uuid: string): Observable<Blob> {
    return this.http.get(`${this.base}/paiements/${uuid}/recu`, { responseType: 'blob' });
  }

  // --- Statistiques d'inscription (tableau de bord) ----------------------

  statistiquesParClasse(anneeScolaireId?: number): Observable<StatistiqueClasse[]> {
    return this.http
      .get<ApiResponse<StatistiqueClasse[]>>(`${this.base}/statistiques/par-classe`, {
        params: this.optionalAnneeScolaireParams(anneeScolaireId)
      })
      .pipe(map((response) => response.data));
  }

  statistiquesParNiveau(anneeScolaireId?: number): Observable<StatistiqueNiveau[]> {
    return this.http
      .get<ApiResponse<StatistiqueNiveau[]>>(`${this.base}/statistiques/par-niveau`, {
        params: this.optionalAnneeScolaireParams(anneeScolaireId)
      })
      .pipe(map((response) => response.data));
  }

  statistiquesParSexe(anneeScolaireId?: number): Observable<StatistiqueSexe[]> {
    return this.http
      .get<ApiResponse<StatistiqueSexe[]>>(`${this.base}/statistiques/par-sexe`, {
        params: this.optionalAnneeScolaireParams(anneeScolaireId)
      })
      .pipe(map((response) => response.data));
  }

  private optionalAnneeScolaireParams(anneeScolaireId?: number): HttpParams {
    return anneeScolaireId ? new HttpParams().set('anneeScolaireId', anneeScolaireId) : new HttpParams();
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
