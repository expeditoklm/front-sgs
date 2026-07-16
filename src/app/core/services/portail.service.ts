import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/audit.models';
@Injectable({providedIn:'root'})
export class PortailService {
 private url=`${environment.apiUrl}/portail`;constructor(private http:HttpClient){}
 eleves(){return this.http.get<ApiResponse<any[]>>(`${this.url}/eleves`).pipe(map(r=>r.data));}
 rechercherEleves(recherche:string,limit=10){const terme=this.normaliser(recherche);return this.eleves().pipe(map(items=>items.filter(item=>this.normaliser(`${item.elv_prenom??''} ${item.elv_nom??''} ${item.classe??''}`).includes(terme)).slice(0,limit)));}
 synthese(u:string){return this.http.get<ApiResponse<any>>(`${this.url}/eleves/${u}/synthese`).pipe(map(r=>r.data));}
 notes(u:string){return this.http.get<ApiResponse<any[]>>(`${this.url}/eleves/${u}/notes`).pipe(map(r=>r.data));}
 paiements(u:string){return this.http.get<ApiResponse<any[]>>(`${this.url}/eleves/${u}/paiements`).pipe(map(r=>r.data));}
 emploiDuTemps(u:string){return this.http.get<ApiResponse<any[]>>(`${this.url}/eleves/${u}/emploi-du-temps`).pipe(map(r=>r.data));}
 absences(u:string){return this.http.get<ApiResponse<any[]>>(`${this.url}/eleves/${u}/absences`).pipe(map(r=>r.data));}
 bulletins(u:string){return this.http.get<ApiResponse<any[]>>(`${this.url}/eleves/${u}/bulletins`).pipe(map(r=>r.data));}
 telechargerBulletin(e:string,b:string){return this.http.get(`${this.url}/eleves/${e}/bulletins/${b}.pdf`,{responseType:'blob'});}
 optionsAdministration(){return this.http.get<ApiResponse<any>>(`${this.url}/administration/options`).pipe(map(r=>r.data));}
 rechercherOptionsAdministration(type:'eleves'|'utilisateurs',recherche:string,limit=10){const terme=this.normaliser(recherche);return this.optionsAdministration().pipe(map(options=>(options[type]??[]).filter((item:any)=>this.normaliser(Object.values(item).join(' ')).includes(terme)).slice(0,limit)));}
 rattachements(){return this.http.get<ApiResponse<any[]>>(`${this.url}/administration/rattachements`).pipe(map(r=>r.data));}
 rattacher(eleveUuid:string,utilisateurUuid:string){return this.http.post(`${this.url}/administration/rattachements`,{eleveUuid,utilisateurUuid});}
 changerEtat(uuid:string,actif:boolean){return this.http.patch(`${this.url}/administration/rattachements/${uuid}`,null,{params:{actif}});}
 private normaliser(value:string){return String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();}
}
