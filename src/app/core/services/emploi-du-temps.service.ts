import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/audit.models';
import { AbsenceCours, AbsencePayload, CoursPayload, CoursPlanifie, DisponibiliteEnseignant, DisponibilitePayload, EleveCoursOption, EmploiDuTempsOptions, IndisponibiliteSalle, PlageHoraire, Remplacement, RemplacementPayload, StatutPublication, SuggestionConflit } from '../models/emploi-du-temps.models';

@Injectable({providedIn:'root'})
export class EmploiDuTempsService {
  private readonly url=`${environment.apiUrl}/emplois-du-temps`;
  constructor(private http:HttpClient){}
  options():Observable<EmploiDuTempsOptions>{return this.http.get<ApiResponse<EmploiDuTempsOptions>>(`${this.url}/options`).pipe(map(r=>r.data));}
  lister(anneeScolaireId:number,classeId?:number,enseignantId?:number,salleId?:number):Observable<CoursPlanifie[]> { let p=new HttpParams().set('anneeScolaireId',anneeScolaireId); if(classeId)p=p.set('classeId',classeId);if(enseignantId)p=p.set('enseignantId',enseignantId);if(salleId)p=p.set('salleId',salleId);return this.http.get<ApiResponse<CoursPlanifie[]>>(`${this.url}/creneaux`,{params:p}).pipe(map(r=>r.data)); }
  creer(v:CoursPayload){return this.http.post<ApiResponse<unknown>>(this.url,v);}
  modifier(uuid:string,v:CoursPayload){return this.http.put<ApiResponse<unknown>>(`${this.url}/${uuid}`,v);}
  annuler(uuid:string){return this.http.delete(`${this.url}/${uuid}`);}
  publier(annee:number){return this.http.post<ApiResponse<Record<string,unknown>>>(`${this.url}/publier`,null,{params:{anneeScolaireId:annee}}).pipe(map(r=>r.data));}
  statutPublication(annee:number){return this.http.get<ApiResponse<StatutPublication>>(`${this.url}/publication`,{params:{anneeScolaireId:annee}}).pipe(map(r=>r.data));}
  disponibilites(enseignantId?:number){let p=new HttpParams();if(enseignantId)p=p.set('enseignantId',enseignantId);return this.http.get<ApiResponse<DisponibiliteEnseignant[]>>(`${this.url}/disponibilites`,{params:p}).pipe(map(r=>r.data));}
  enregistrerDisponibilite(v:DisponibilitePayload){return this.http.post(`${this.url}/disponibilites`,v);}
  supprimerDisponibilite(uuid:string){return this.http.delete(`${this.url}/disponibilites/${uuid}`);}
  remplacements(annee?:number){let p=new HttpParams();if(annee)p=p.set('anneeScolaireId',annee);return this.http.get<ApiResponse<Remplacement[]>>(`${this.url}/remplacements`,{params:p}).pipe(map(r=>r.data));}
  remplacer(coursUuid:string,v:RemplacementPayload){return this.http.post(`${this.url}/${coursUuid}/remplacements`,v);}
  annulerRemplacement(uuid:string){return this.http.delete(`${this.url}/remplacements/${uuid}`);}
  absences(coursUuid?:string){let p=new HttpParams();if(coursUuid)p=p.set('coursUuid',coursUuid);return this.http.get<ApiResponse<AbsenceCours[]>>(`${this.url}/absences`,{params:p}).pipe(map(r=>r.data));}
  elevesDuCours(coursUuid:string){return this.http.get<ApiResponse<EleveCoursOption[]>>(`${this.url}/${coursUuid}/eleves`).pipe(map(r=>r.data));}
  saisirAbsence(coursUuid:string,v:AbsencePayload){return this.http.post(`${this.url}/${coursUuid}/absences`,v);}
  justifierAbsence(uuid:string,motif?:string){let p=new HttpParams();if(motif)p=p.set('motif',motif);return this.http.patch(`${this.url}/absences/${uuid}/justifier`,null,{params:p});}
  suggestions(v:CoursPayload){return this.http.post<ApiResponse<SuggestionConflit[]>>(`${this.url}/conflits/suggestions`,v).pipe(map(r=>r.data));}
  journal(){return this.http.get<ApiResponse<Record<string,unknown>[]>>(`${this.url}/journal`).pipe(map(r=>r.data));}
  exporterPdf(anneeScolaireId:number,classeId?:number,enseignantId?:number,salleId?:number){let p=new HttpParams().set('anneeScolaireId',anneeScolaireId);if(classeId)p=p.set('classeId',classeId);if(enseignantId)p=p.set('enseignantId',enseignantId);if(salleId)p=p.set('salleId',salleId);return this.http.get(`${this.url}/export.pdf`,{params:p,responseType:'blob'});}
  plages(){return this.http.get<ApiResponse<PlageHoraire[]>>(`${this.url}/plages-horaires`).pipe(map(r=>r.data));}
  enregistrerPlage(v:any,uuid?:string){return uuid?this.http.put(`${this.url}/plages-horaires/${uuid}`,v):this.http.post(`${this.url}/plages-horaires`,v);}
  indisponibilitesSalles(){return this.http.get<ApiResponse<IndisponibiliteSalle[]>>(`${this.url}/indisponibilites-salles`).pipe(map(r=>r.data));}
  enregistrerIndisponibiliteSalle(v:any){return this.http.post(`${this.url}/indisponibilites-salles`,v);}
  supprimerIndisponibiliteSalle(uuid:string){return this.http.delete(`${this.url}/indisponibilites-salles/${uuid}`);}
}
