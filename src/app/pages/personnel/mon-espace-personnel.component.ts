import {CommonModule} from '@angular/common';
import {Component,OnInit} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {forkJoin} from 'rxjs';
import {PersonnelService} from '../../core/services/personnel.service';
@Component({selector:'app-mon-espace-personnel',imports:[CommonModule,FormsModule],templateUrl:'./mon-espace-personnel.component.html'})
export class MonEspacePersonnelComponent implements OnInit{
 conges:any[]=[];soldes:any[]=[];evaluations:any[]=[];form={type:'ANNUEL',dateDebut:'',dateFin:'',motif:''};erreur='';succes='';
 constructor(private service:PersonnelService){}ngOnInit(){this.charger();}
 charger(){forkJoin({conges:this.service.mesConges(),soldes:this.service.mesSoldes(),evaluations:this.service.mesEvaluations()}).subscribe({next:r=>Object.assign(this,r),error:e=>this.erreur=e?.error?.message??'Impossible de charger votre dossier.'});}
 demander(){this.service.demanderMonConge(this.form).subscribe({next:()=>{this.succes='Demande transmise.';this.form={type:'ANNUEL',dateDebut:'',dateFin:'',motif:''};this.charger();},error:e=>this.erreur=e?.error?.message??'Demande refusée.'});}
 annuler(c:any){this.service.annulerMonConge(c.uu_id).subscribe({next:()=>this.charger(),error:e=>this.erreur=e?.error?.message??'Annulation impossible.'});}
 exporter(){this.service.exporterMesDonnees().subscribe({next:d=>{const b=new Blob([JSON.stringify(d,null,2)],{type:'application/json'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download='mes-donnees-sgs.json';a.click();URL.revokeObjectURL(u);},error:e=>this.erreur=e?.error?.message??'Export impossible.'});}
 demanderSuppression(){const motif=window.prompt('Motif de votre demande de suppression :')??'';if(!motif.trim())return;this.service.demanderConfidentialite('SUPPRESSION',motif).subscribe({next:()=>this.succes='Votre demande réglementaire a été enregistrée.',error:e=>this.erreur=e?.error?.message??'Demande impossible.'});}
}
