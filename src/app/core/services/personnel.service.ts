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
 decider(uuid:string,statut:string,commentaire=''){let params=new HttpParams().set('statut',statut);if(commentaire.trim())params=params.set('commentaire',commentaire.trim());return this.http.post(`${this.url}/conges/${uuid}/decision`,null,{params});}
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
 statistiques(annee?:number,categorie?:string){let params=new HttpParams();if(annee)params=params.set('annee',annee);if(categorie)params=params.set('categorie',categorie);return this.http.get<ApiResponse<StatistiquesRh>>(`${this.url}/statistiques`,{params}).pipe(map(r=>r.data));}
 tauxPresence(){return this.http.get<ApiResponse<any[]>>(`${this.url}/statistiques/presence`).pipe(map(r=>r.data));}
 mesConges(){return this.http.get<ApiResponse<any[]>>(`${this.url}/moi/conges`).pipe(map(r=>r.data));}
 mesSoldes(){return this.http.get<ApiResponse<any[]>>(`${this.url}/moi/soldes`).pipe(map(r=>r.data));}
 demanderMonConge(v:{type:string;dateDebut:string;dateFin:string;motif:string}){return this.http.post(`${this.url}/moi/conges`,v);}
 annulerMonConge(uuid:string){return this.http.delete(`${this.url}/moi/conges/${uuid}`);}
 mesEvaluations(){return this.http.get<ApiResponse<any[]>>(`${this.url}/moi/evaluations`).pipe(map(r=>r.data.map(e=>({...e,criteres:typeof e.criteres==='string'?JSON.parse(e.criteres):e.criteres??[]}))));}
 exporterMesDonnees(){return this.http.get<ApiResponse<any>>(`${this.url}/moi/donnees-personnelles`).pipe(map(r=>r.data));}
 demanderConfidentialite(type:string,motif=''){return this.http.post(`${this.url}/moi/demandes-confidentialite`,null,{params:{type,motif}});}
 grillesEvaluation(){return this.http.get<ApiResponse<any[]>>(`${this.url}/evaluations/grilles`).pipe(map(r=>r.data));}
 evaluerDetaille(v:any){return this.http.post(`${this.url}/evaluations/detaillees`,v);}
}
