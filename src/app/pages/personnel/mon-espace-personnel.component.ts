import {CommonModule} from '@angular/common';
import {Component,OnInit} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {forkJoin} from 'rxjs';
import {PersonnelService} from '../../core/services/personnel.service';
import {PaginationComponent} from '../../shared/components/ui/pagination/pagination.component';
import {PaginatePipe} from '../../shared/pipes/paginate.pipe';
import {SelectComponent} from '../../shared/components/form/select/select.component';
@Component({selector:'app-mon-espace-personnel',imports:[CommonModule,FormsModule,PaginationComponent,PaginatePipe,SelectComponent],templateUrl:'./mon-espace-personnel.component.html',host:{class:'sgs-dark-view block'}})
export class MonEspacePersonnelComponent implements OnInit{
 conges:any[]=[];soldes:any[]=[];evaluations:any[]=[];form={type:'ANNUEL',dateDebut:'',dateFin:'',motif:''};erreur='';succes='';dossierDisponible=true;
 pagination:Record<string,{page:number;size:number}>={conges:{page:1,size:10},evaluations:{page:1,size:10}};
 readonly typeCongeOptions=['ANNUEL','MALADIE','MATERNITE','FORMATION'].map(value=>({value,label:value}));
 pageDe(cle:string){return this.pagination[cle].page;}tailleDe(cle:string){return this.pagination[cle].size;}
 totalPages(liste:unknown[],cle:string){return Math.max(1,Math.ceil(liste.length/this.tailleDe(cle)));}
 changerPage(cle:string,page:number,liste:unknown[]){this.pagination[cle].page=Math.min(Math.max(page,1),this.totalPages(liste,cle));}
 changerTaille(cle:string,size:number){this.pagination[cle]={page:1,size};}
 constructor(private service:PersonnelService){}ngOnInit(){this.charger();}
 charger(){this.erreur='';this.dossierDisponible=true;forkJoin({conges:this.service.mesConges(),soldes:this.service.mesSoldes(),evaluations:this.service.mesEvaluations()}).subscribe({next:r=>Object.assign(this,r),error:e=>{this.erreur=this.message(e,'Impossible de charger votre dossier.');this.dossierDisponible=!this.erreur.includes('Aucun dossier employ');}});}
 demander(){
  this.erreur='';this.succes='';
  if(!this.form.dateDebut||!this.form.dateFin){this.erreur='Renseignez les dates de début et de fin.';return;}
  if(this.form.dateFin<this.form.dateDebut){this.erreur='La date de fin ne peut pas précéder la date de début.';return;}
  this.service.demanderMonConge(this.form).subscribe({
   next:()=>{this.succes='Demande transmise.';this.form={type:'ANNUEL',dateDebut:'',dateFin:'',motif:''};this.charger();},
   error:e=>this.erreur=this.message(e,'Demande refusée.')
  });
 }
 annuler(c:any){this.service.annulerMonConge(c.uu_id).subscribe({next:()=>this.charger(),error:e=>this.erreur=this.message(e,'Annulation impossible.')});}
 exporter(){this.service.exporterMesDonnees().subscribe({next:d=>{const b=new Blob([JSON.stringify(d,null,2)],{type:'application/json'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download='mes-donnees-sgs.json';a.click();URL.revokeObjectURL(u);},error:e=>this.erreur=this.message(e,'Export impossible.')});}
 demanderSuppression(){const motif=window.prompt('Motif de votre demande de suppression :')??'';if(!motif.trim())return;this.service.demanderConfidentialite('SUPPRESSION',motif).subscribe({next:()=>this.succes='Votre demande réglementaire a été enregistrée.',error:e=>this.erreur=this.message(e,'Demande impossible.')});}
 private message(error:any,fallback:string):string{
  const body=error?.error;
  if(typeof body==='string'&&body.trim())return body;
  return body?.errors?.[0]?.detail
    ??body?.errors?.[0]?.message
    ??body?.details
    ??body?.message
    ??error?.message
    ??fallback;
 }
}
