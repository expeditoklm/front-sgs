import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/audit.models';
import { Affectation,Conge,Contrat,Employe,EmployePayload,EvaluationRh,RhDashboard,RhOptions,SoldeConge,StatistiquesRh } from '../models/personnel.models';
@Injectable({providedIn:'root'}) export class PersonnelService {
 private url=`${environment.apiUrl}/personnel`;constructor(private http:HttpClient){}
 dashboard(){return this.http.get<ApiResponse<RhDashboard>>(`${this.url}/tableau-de-bord`).pipe(map(r=>r.data));}
 employes(recherche=''){return this.http.get<ApiResponse<Employe[]>>(`${this.url}/employes`,{params:{recherche}}).pipe(map(r=>r.data));}
 enregistrer(v:EmployePayload,uuid?:string){return uuid?this.http.put(`${this.url}/employes/${uuid}`,v):this.http.post(`${this.url}/employes`,v);}
 changerEtat(uuid:string){return this.http.patch(`${this.url}/employes/${uuid}/etat`,null);}
 contrats(){return this.http.get<ApiResponse<Contrat[]>>(`${this.url}/contrats`).pipe(map(r=>r.data));}
 creerContrat(v:{employeUuid:string;type:string;dateDebut:string;dateFin:string|null;remuneration:number|null}){return this.http.post(`${this.url}/contrats`,v);}
 conges(){return this.http.get<ApiResponse<Conge[]>>(`${this.url}/conges`).pipe(map(r=>r.data));}
 demanderConge(v:{employeUuid:string;type:string;dateDebut:string;dateFin:string;motif:string}){return this.http.post(`${this.url}/conges`,v);}
 decider(uuid:string,statut:string){return this.http.post(`${this.url}/conges/${uuid}/decision`,null,{params:new HttpParams().set('statut',statut)});}
 options(){return this.http.get<ApiResponse<RhOptions>>(`${this.url}/options`).pipe(map(r=>r.data));}
 affectations(){return this.http.get<ApiResponse<Affectation[]>>(`${this.url}/affectations`).pipe(map(r=>r.data));}
 creerAffectation(v:{employeUuid:string;anneeId:number;matiereId:number|null;niveauId:number|null;classeId:number|null;heuresHebdo:number;dateDebut:string;dateFin:string|null}){return this.http.post(`${this.url}/affectations`,v);}
 supprimerAffectation(uuid:string){return this.http.delete(`${this.url}/affectations/${uuid}`);}
 soldes(){return this.http.get<ApiResponse<SoldeConge[]>>(`${this.url}/soldes-conges`).pipe(map(r=>r.data));}
 enregistrerSolde(v:{employeUuid:string;annee:number;type:string;joursAcquis:number;joursReportes:number}){return this.http.post(`${this.url}/soldes-conges`,v);}
 modifierContrat(uuid:string,v:{employeUuid:string;type:string;dateDebut:string;dateFin:string|null;remuneration:number|null}){return this.http.put(`${this.url}/contrats/${uuid}`,v);}
 cloturerContrat(uuid:string,motif=''){return this.http.patch(`${this.url}/contrats/${uuid}/cloturer`,null,{params:{motif}});}
 evaluations(){return this.http.get<ApiResponse<EvaluationRh[]>>(`${this.url}/evaluations`).pipe(map(r=>r.data));}
 evaluer(v:{employeUuid:string;date:string;periode:string;note:number;objectifs:string;appreciation:string}){return this.http.post(`${this.url}/evaluations`,v);}
 statistiques(){return this.http.get<ApiResponse<StatistiquesRh>>(`${this.url}/statistiques`).pipe(map(r=>r.data));}
}
