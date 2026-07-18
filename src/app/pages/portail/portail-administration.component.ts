import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin, map } from 'rxjs';
import { PortailService } from '../../core/services/portail.service';
import { PaginationComponent } from '../../shared/components/ui/pagination/pagination.component';
import { PaginatePipe } from '../../shared/pipes/paginate.pipe';
import { SelectComponent } from '../../shared/components/form/select/select.component';
import { ToastService } from '../../core/services/toast.service';

@Component({selector:'app-portail-administration',imports:[CommonModule,FormsModule,PaginationComponent,PaginatePipe,SelectComponent],templateUrl:'./portail-administration.component.html',host:{class:'sgs-dark-view block'}})
export class PortailAdministrationComponent implements OnInit {
 eleves:any[]=[];utilisateurs:any[]=[];rattachements:any[]=[];eleveUuid='';utilisateurUuid='';chargement=false;
 page=1;pageSize=10;
 get totalPages(){return Math.max(1,Math.ceil(this.rattachements.length/this.pageSize));}
 changerPage(page:number){this.page=Math.min(Math.max(page,1),this.totalPages);}
 changerTaille(pageSize:number){this.pageSize=pageSize;this.page=1;}
 get eleveOptions(){return this.eleves.map(e=>({value:e.uu_id,label:`${e.elv_code??''} · ${e.label??''}`}));}
 get utilisateurOptions(){return this.utilisateurs.map(u=>({value:u.uu_id,label:`${u.profil??''} · ${u.label??''} (${u.util_mail??''})`}));}
 readonly rechercherEleves=(term:string,limit:number)=>this.portail.rechercherOptionsAdministration('eleves',term,limit).pipe(map(items=>items.map((e:any)=>({value:e.uu_id,label:`${e.elv_code??''} · ${e.label??''}`}))));
 readonly rechercherUtilisateurs=(term:string,limit:number)=>this.portail.rechercherOptionsAdministration('utilisateurs',term,limit).pipe(map(items=>items.map((u:any)=>({value:u.uu_id,label:`${u.profil??''} · ${u.label??''} (${u.util_mail??''})`}))));
 constructor(private portail:PortailService,private toast:ToastService){}
 ngOnInit(){this.charger();}
 charger(){this.chargement=true;forkJoin({options:this.portail.optionsAdministration(),rattachements:this.portail.rattachements()}).subscribe({next:r=>{this.eleves=r.options.eleves??[];this.utilisateurs=r.options.utilisateurs??[];this.rattachements=r.rattachements;this.page=1;this.chargement=false;},error:e=>{this.toast.error(this.message(e),'Chargement impossible');this.chargement=false;}});}
 rattacher(){if(!this.eleveUuid||!this.utilisateurUuid)return;this.portail.rattacher(this.eleveUuid,this.utilisateurUuid).subscribe({next:()=>{this.toast.success('Compte rattaché avec succès.');this.eleveUuid='';this.utilisateurUuid='';this.charger();},error:e=>this.toast.error(this.message(e),'Rattachement impossible')});}
 changerEtat(r:any){this.portail.changerEtat(r.uu_id,!r.pec_actif).subscribe({next:()=>{this.toast.success('État du rattachement mis à jour.');this.charger();},error:e=>this.toast.error(this.message(e),'Modification impossible')});}
 private message(e:any){return e?.error?.message??e?.error?.errors?.[0]?.message??'Une erreur est survenue.';}
}
