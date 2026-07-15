import { CommonModule } from '@angular/common';
import { Component,OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { PortailService } from '../../core/services/portail.service';
@Component({selector:'app-portail',standalone:true,imports:[CommonModule,FormsModule],templateUrl:'./portail.component.html'})
export class PortailComponent implements OnInit {
 eleves:any[]=[];eleveUuid='';synthese:any={};notes:any[]=[];paiements:any[]=[];edt:any[]=[];absences:any[]=[];bulletins:any[]=[];onglet:'notes'|'edt'|'absences'|'paiements'|'bulletins'='notes';chargement=false;erreur='';
 constructor(private portail:PortailService){}ngOnInit(){this.portail.eleves().subscribe({next:r=>{this.eleves=r;this.eleveUuid=r[0]?.uu_id??'';if(this.eleveUuid)this.charger();},error:e=>this.erreur=this.message(e)});}
 charger(){if(!this.eleveUuid)return;this.chargement=true;forkJoin({synthese:this.portail.synthese(this.eleveUuid),notes:this.portail.notes(this.eleveUuid),paiements:this.portail.paiements(this.eleveUuid),edt:this.portail.emploiDuTemps(this.eleveUuid),absences:this.portail.absences(this.eleveUuid),bulletins:this.portail.bulletins(this.eleveUuid)}).subscribe({next:r=>{Object.assign(this,r);this.chargement=false;},error:e=>{this.erreur=this.message(e);this.chargement=false;}});}
 telecharger(b:any){this.portail.telechargerBulletin(this.eleveUuid,b.uu_id).subscribe({next:blob=>{const u=URL.createObjectURL(blob);const a=document.createElement('a');a.href=u;a.download='bulletin.pdf';a.click();URL.revokeObjectURL(u);},error:e=>this.erreur=this.message(e)});}
 private message(e:any){return e?.error?.message??'Impossible de charger le portail.';}
}
