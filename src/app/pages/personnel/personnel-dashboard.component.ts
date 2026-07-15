import { CommonModule } from '@angular/common';
import { Component,OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ModalComponent } from '../../shared/components/ui/modal/modal.component';
import { Affectation,Conge,Contrat,Employe,EmployePayload,EvaluationRh,RhDashboard,RhOptions,SoldeConge,StatistiquesRh } from '../../core/models/personnel.models';
import { PersonnelService } from '../../core/services/personnel.service';

@Component({selector:'app-personnel-dashboard',standalone:true,imports:[CommonModule,FormsModule,ModalComponent],templateUrl:'./personnel-dashboard.component.html'})
export class PersonnelDashboardComponent implements OnInit {
 stats:RhDashboard={effectif_actif:0,enseignants:0,contrats_actifs:0,conges_en_attente:0};statistiques:StatistiquesRh={categories:[],chargeEnseignants:[],presence:[],evaluations:[]};options:RhOptions={annees:[],matieres:[],niveaux:[],classes:[]};
 employes:Employe[]=[];conges:Conge[]=[];contrats:Contrat[]=[];affectations:Affectation[]=[];soldes:SoldeConge[]=[];evaluations:EvaluationRh[]=[];
 recherche='';onglet:'equipe'|'contrats'|'conges'|'affectations'|'evaluations'|'statistiques'='equipe';modalEmploye=false;modalConge=false;modalContrat=false;modalAffectation=false;modalSolde=false;modalEvaluation=false;selection?:Employe;erreur='';succes='';
 form:EmployePayload=this.vide();conge={employeUuid:'',type:'ANNUEL',dateDebut:'',dateFin:'',motif:''};contrat={employeUuid:'',type:'CDI',dateDebut:'',dateFin:'',remuneration:null as number|null};
 affectation={employeUuid:'',anneeId:0,matiereId:null as number|null,niveauId:null as number|null,classeId:null as number|null,heuresHebdo:0,dateDebut:'',dateFin:''};
 solde={employeUuid:'',annee:new Date().getFullYear(),type:'ANNUEL',joursAcquis:30,joursReportes:0};
 evaluation={employeUuid:'',date:new Date().toISOString().slice(0,10),periode:'Année '+new Date().getFullYear(),note:10,objectifs:'',appreciation:''};
 constructor(private service:PersonnelService){}ngOnInit(){this.charger();}
 charger(){forkJoin({stats:this.service.dashboard(),employes:this.service.employes(this.recherche),conges:this.service.conges(),contrats:this.service.contrats(),options:this.service.options(),affectations:this.service.affectations(),soldes:this.service.soldes(),evaluations:this.service.evaluations(),statistiques:this.service.statistiques()}).subscribe({next:r=>{Object.assign(this,r);},error:e=>this.erreur=this.message(e)});}
 rechercher(){this.service.employes(this.recherche).subscribe(v=>this.employes=v);}
 ouvrir(e?:Employe){this.selection=e;this.form=e?{nom:e.nom,prenom:e.prenom,email:e.email,telephone:e.telephone??'',categorie:e.categorie,specialite:e.specialite??'',dateEmbauche:e.dateEmbauche}:this.vide();this.modalEmploye=true;}
 enregistrer(){this.service.enregistrer(this.form,this.selection?.uuid).subscribe({next:()=>{this.modalEmploye=false;this.ok(this.selection?'Dossier mis à jour.':'Collaborateur ajouté.');},error:e=>this.erreur=this.message(e)});}
 etat(e:Employe){this.service.changerEtat(e.uuid).subscribe({next:()=>this.charger(),error:x=>this.erreur=this.message(x)});}
 demander(){this.service.demanderConge(this.conge).subscribe({next:()=>{this.modalConge=false;this.ok('Demande de congé enregistrée.');},error:e=>this.erreur=this.message(e)});}
 creerContrat(){this.service.creerContrat({...this.contrat,dateFin:this.contrat.dateFin||null}).subscribe({next:()=>{this.modalContrat=false;this.ok('Contrat enregistré.');},error:e=>this.erreur=this.message(e)});}
 cloturer(c:Contrat){this.service.cloturerContrat(c.uu_id,'Clôture administrative').subscribe({next:()=>this.ok('Contrat clôturé.'),error:e=>this.erreur=this.message(e)});}
 decider(c:Conge,s:string){this.service.decider(c.uu_id,s).subscribe({next:()=>this.charger(),error:e=>this.erreur=this.message(e)});}
 creerAffectation(){const v={...this.affectation,dateFin:this.affectation.dateFin||null};this.service.creerAffectation(v).subscribe({next:()=>{this.modalAffectation=false;this.ok('Affectation enregistrée.');},error:e=>this.erreur=this.message(e)});}
 supprimerAffectation(a:Affectation){this.service.supprimerAffectation(a.uu_id).subscribe({next:()=>this.ok('Affectation supprimée.'),error:e=>this.erreur=this.message(e)});}
 enregistrerSolde(){this.service.enregistrerSolde(this.solde).subscribe({next:()=>{this.modalSolde=false;this.ok('Solde de congé enregistré.');},error:e=>this.erreur=this.message(e)});}
 evaluer(){this.service.evaluer(this.evaluation).subscribe({next:()=>{this.modalEvaluation=false;this.ok('Évaluation enregistrée.');},error:e=>this.erreur=this.message(e)});}
 private ok(m:string){this.succes=m;this.erreur='';this.charger();}
 private vide(){return{nom:'',prenom:'',email:'',telephone:'',categorie:'ENSEIGNANT',specialite:'',dateEmbauche:new Date().toISOString().slice(0,10)};}
 private message(e:any){return e?.error?.message??'Une erreur est survenue.';}
}
