import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/audit.models';
@Injectable({providedIn:'root'})
export class PortailService {
 private url=`${environment.apiUrl}/portail`;constructor(private http:HttpClient){}
 eleves(){return this.http.get<ApiResponse<any[]>>(`${this.url}/eleves`).pipe(map(r=>r.data));}
 synthese(u:string){return this.http.get<ApiResponse<any>>(`${this.url}/eleves/${u}/synthese`).pipe(map(r=>r.data));}
 notes(u:string){return this.http.get<ApiResponse<any[]>>(`${this.url}/eleves/${u}/notes`).pipe(map(r=>r.data));}
 paiements(u:string){return this.http.get<ApiResponse<any[]>>(`${this.url}/eleves/${u}/paiements`).pipe(map(r=>r.data));}
 emploiDuTemps(u:string){return this.http.get<ApiResponse<any[]>>(`${this.url}/eleves/${u}/emploi-du-temps`).pipe(map(r=>r.data));}
 absences(u:string){return this.http.get<ApiResponse<any[]>>(`${this.url}/eleves/${u}/absences`).pipe(map(r=>r.data));}
 bulletins(u:string){return this.http.get<ApiResponse<any[]>>(`${this.url}/eleves/${u}/bulletins`).pipe(map(r=>r.data));}
 telechargerBulletin(e:string,b:string){return this.http.get(`${this.url}/eleves/${e}/bulletins/${b}.pdf`,{responseType:'blob'});}
}
