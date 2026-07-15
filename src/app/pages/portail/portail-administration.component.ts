import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { PortailService } from '../../core/services/portail.service';

@Component({selector:'app-portail-administration',imports:[CommonModule,FormsModule],templateUrl:'./portail-administration.component.html'})
export class PortailAdministrationComponent implements OnInit {
 eleves:any[]=[];utilisateurs:any[]=[];rattachements:any[]=[];eleveUuid='';utilisateurUuid='';chargement=false;erreur='';succes='';
 constructor(private portail:PortailService){}
 ngOnInit(){this.charger();}
 charger(){this.chargement=true;forkJoin({options:this.portail.optionsAdministration(),rattachements:this.portail.rattachements()}).subscribe({next:r=>{this.eleves=r.options.eleves??[];this.utilisateurs=r.options.utilisateurs??[];this.rattachements=r.rattachements;this.chargement=false;},error:e=>{this.erreur=this.message(e);this.chargement=false;}});}
 rattacher(){if(!this.eleveUuid||!this.utilisateurUuid)return;this.portail.rattacher(this.eleveUuid,this.utilisateurUuid).subscribe({next:()=>{this.succes='Compte rattaché avec succès.';this.eleveUuid='';this.utilisateurUuid='';this.charger();},error:e=>this.erreur=this.message(e)});}
 changerEtat(r:any){this.portail.changerEtat(r.uu_id,!r.pec_actif).subscribe({next:()=>this.charger(),error:e=>this.erreur=this.message(e)});}
 private message(e:any){return e?.error?.message??e?.error?.errors?.[0]?.message??'Une erreur est survenue.';}
}
