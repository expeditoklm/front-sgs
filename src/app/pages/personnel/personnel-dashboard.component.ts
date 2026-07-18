import { CommonModule } from '@angular/common';
import { Component,OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ModalComponent } from '../../shared/components/ui/modal/modal.component';
import { PaginationComponent } from '../../shared/components/ui/pagination/pagination.component';
import { PaginatePipe } from '../../shared/pipes/paginate.pipe';
import { Affectation,Conge,Contrat,Employe,EmployePayload,EvaluationRh,RhDashboard,RhOptions,SoldeConge,StatistiquesRh } from '../../core/models/personnel.models';
import { PersonnelService } from '../../core/services/personnel.service';
import { SelectComponent } from '../../shared/components/form/select/select.component';
import { map } from 'rxjs';
import { ToastService } from '../../core/services/toast.service';

@Component({selector:'app-personnel-dashboard',standalone:true,imports:[CommonModule,FormsModule,ModalComponent,PaginationComponent,PaginatePipe,SelectComponent],templateUrl:'./personnel-dashboard.component.html',host:{class:'sgs-dark-view block'}})
export class PersonnelDashboardComponent implements OnInit {
 stats:RhDashboard={effectif_actif:0,enseignants:0,contrats_actifs:0,conges_en_attente:0};statistiques:StatistiquesRh={categories:[],contrats:[],chargeEnseignants:[],presence:[],evaluations:[]};options:RhOptions={annees:[],matieres:[],niveaux:[],classes:[],utilisateurs:[]};
 employes:Employe[]=[];conges:Conge[]=[];contrats:Contrat[]=[];affectations:Affectation[]=[];soldes:SoldeConge[]=[];evaluations:EvaluationRh[]=[];
 tauxPresence:any[]=[];
 pageConges=1;
 taillePageConges=10;
 readonly taillesPageConges=[10,20,50];
 pagination:Record<string,{page:number;size:number}>={equipe:{page:1,size:10},contrats:{page:1,size:10},conges:{page:1,size:10},soldes:{page:1,size:10},affectations:{page:1,size:10},evaluations:{page:1,size:10}};
 filtreAnnee?:number;filtreCategorie='';readonly anneesStatistiques=Array.from({length:6},(_,i)=>new Date().getFullYear()-i);
 recherche='';onglet:'equipe'|'contrats'|'conges'|'affectations'|'evaluations'|'statistiques'='equipe';modalEmploye=false;modalConge=false;modalContrat=false;modalClotureContrat=false;modalAffectation=false;modalSolde=false;modalEvaluation=false;selection?:Employe;selectionContrat?:Contrat;selectionSolde?:SoldeConge;contratACloturer?:Contrat;motifCloture='';erreur='';
 recherches:Record<'contrats'|'conges'|'affectations'|'evaluations',string>={contrats:'',conges:'',affectations:'',evaluations:''};
 private recherchesAppliquees:Record<'contrats'|'conges'|'affectations'|'evaluations',string>={contrats:'',conges:'',affectations:'',evaluations:''};
 form:EmployePayload=this.vide();conge={employeUuid:'',type:'ANNUEL',dateDebut:'',dateFin:'',motif:''};contrat={employeUuid:'',type:'CDI',dateDebut:'',dateFin:'',remuneration:null as number|null};
 affectation={employeUuid:'',anneeId:0,matiereId:null as number|null,niveauId:null as number|null,classeId:null as number|null,heuresHebdo:0,dateDebut:'',dateFin:''};
 solde={employeUuid:'',annee:new Date().getFullYear(),type:'ANNUEL',joursAcquis:30,joursReportes:0};
 evaluation={employeUuid:'',date:new Date().toISOString().slice(0,10),periode:'Année '+new Date().getFullYear(),note:10,objectifs:'',appreciation:''};
 readonly categorieOptions=['ENSEIGNANT','SURVEILLANT','ADMINISTRATIF','DIRECTION'].map(value=>({value,label:value}));
 readonly typeCongeOptions=['ANNUEL','MALADIE','MATERNITE','FORMATION'].map(value=>({value,label:value}));
 readonly typeContratOptions=['CDI','CDD','VACATAIRE'].map(value=>({value,label:value}));
 get employeOptions(){return this.employes.map(e=>({value:e.uuid,label:`${e.prenom} ${e.nom} · ${e.matricule}`}));}
 get utilisateurOptions(){return [{value:null,label:'Association automatique par e-mail'},...this.options.utilisateurs.map(o=>({value:o.id,label:o.label}))];}
 get anneeOptions(){return this.options.annees.map(o=>({value:o.id,label:o.label}));}
 get matiereOptions(){return [{value:null,label:'Aucune'},...this.options.matieres.map(o=>({value:o.id,label:o.label}))];}
 get niveauOptions(){return [{value:null,label:'Aucun'},...this.options.niveaux.map(o=>({value:o.id,label:o.label}))];}
 get classeOptions(){return [{value:null,label:'Aucune'},...this.options.classes.map(o=>({value:o.id,label:o.label}))];}
 get anneeStatistiqueOptions(){return [{value:undefined,label:'Toutes les années'},...this.options.annees.map(o=>({value:o.id,label:o.label}))];}
 readonly rechercherEmployesSelect=(term:string,limit:number)=>this.service.employes(term).pipe(map(items=>items.slice(0,limit).map(e=>({value:e.uuid,label:`${e.prenom} ${e.nom} · ${e.matricule}`}))));
 constructor(private service:PersonnelService,private toast:ToastService){}ngOnInit(){this.charger();}
 charger(){forkJoin({stats:this.service.dashboard(),employes:this.service.employes(this.recherche),conges:this.service.conges(),contrats:this.service.contrats(),options:this.service.options(),affectations:this.service.affectations(),soldes:this.service.soldes(),evaluations:this.service.evaluations(),statistiques:this.service.statistiques(),tauxPresence:this.service.tauxPresence()}).subscribe({next:r=>{Object.assign(this,r);this.normaliserPageConges();},error:e=>this.echec(e,'Chargement impossible')});}
 rechercher(){this.pagination['equipe'].page=1;this.service.employes(this.recherche).subscribe(v=>this.employes=v);}
 rechercherDans(cle:'contrats'|'conges'|'affectations'|'evaluations'){
  this.recherchesAppliquees[cle]=this.normaliser(this.recherches[cle]);
  this.pagination[cle].page=1;
  if(cle==='conges')this.pagination['soldes'].page=1;
 }
 get contratsFiltres(){const q=this.recherchesAppliquees.contrats;return this.filtrer(this.contrats,q,c=>[c.employe,c.con_type,c.con_date_debut,c.con_date_fin,c.con_actif?'actif':'clos']);}
 get congesFiltres(){const q=this.recherchesAppliquees.conges;return this.filtrer(this.conges,q,c=>[c.employe,c.cng_type,c.cng_statut,c.cng_motif,c.cng_commentaire,c.cng_date_debut,c.cng_date_fin]);}
 get soldesFiltres(){const q=this.recherchesAppliquees.conges;return this.filtrer(this.soldes,q,s=>[s.employe,s.sol_annee,s.sol_type,s.solde]);}
 get affectationsFiltrees(){const q=this.recherchesAppliquees.affectations;return this.filtrer(this.affectations,q,a=>[a.employe,a.annee,a.matiere,a.niveau,a.classe,a.aff_heures_hebdo]);}
 get evaluationsFiltrees(){const q=this.recherchesAppliquees.evaluations;return this.filtrer(this.evaluations,q,e=>[e.employe,e.eva_date,e.eva_periode,e.eva_note,e.eva_appreciation,e.eva_evaluateur]);}
 filtrerStatistiques(){this.service.statistiques(this.filtreAnnee,this.filtreCategorie).subscribe({next:v=>this.statistiques=v,error:e=>this.echec(e,'Chargement impossible')});}
 largeur(v:any,liste:any[],champ:string){const max=Math.max(...liste.map(x=>Number(x[champ])||0),1);return Math.round((Number(v)||0)*100/max);}
 dateValue(value:unknown):string|number|Date|null{return typeof value==='string'||typeof value==='number'||value instanceof Date?value:null;}
 noteWidth(value:unknown):number{return Math.max(0,Math.min(100,(Number(value)||0)*5));}
 get totalPagesConges(){return Math.max(1,Math.ceil(this.conges.length/this.taillePageConges));}
 get congesPagines(){const debut=(this.pageConges-1)*this.taillePageConges;return this.conges.slice(debut,debut+this.taillePageConges);}
 get debutConges(){return this.conges.length?(this.pageConges-1)*this.taillePageConges+1:0;}
 get finConges(){return Math.min(this.pageConges*this.taillePageConges,this.conges.length);}
 get pagesConges(){
  const total=this.totalPagesConges;
  const debut=Math.max(1,Math.min(this.pageConges-2,total-4));
  const fin=Math.min(total,debut+4);
  return Array.from({length:fin-debut+1},(_,i)=>debut+i);
 }
 changerPageConges(page:number){this.pageConges=Math.min(Math.max(page,1),this.totalPagesConges);}
 changerTaillePageConges(){this.pageConges=1;}
 pageDe(cle:string){return this.pagination[cle]?.page??1;}
 tailleDe(cle:string){return this.pagination[cle]?.size??10;}
 totalPages(liste:unknown[],cle:string){return Math.max(1,Math.ceil(liste.length/this.tailleDe(cle)));}
 changerPage(cle:string,page:number,liste:unknown[]){this.pagination[cle].page=Math.min(Math.max(page,1),this.totalPages(liste,cle));}
 changerTaille(cle:string,taille:number){this.pagination[cle]={page:1,size:taille};}
 ouvrirSolde(s?:SoldeConge){
  this.selectionSolde=s;
  this.erreur='';
  this.solde=s?{
   employeUuid:s.employe_uuid,
   annee:s.sol_annee,
   type:s.sol_type,
   joursAcquis:Number(s.sol_jours_acquis),
   joursReportes:Number(s.sol_jours_reportes)
  }:{employeUuid:'',annee:new Date().getFullYear(),type:'ANNUEL',joursAcquis:30,joursReportes:0};
  this.modalSolde=true;
 }
 fermerSolde(){this.modalSolde=false;this.selectionSolde=undefined;}
 ouvrirConge(){this.erreur='';this.conge={employeUuid:'',type:'ANNUEL',dateDebut:'',dateFin:'',motif:''};this.modalConge=true;}
 ouvrir(e?:Employe){this.selection=e;this.form=e?{nom:e.nom,prenom:e.prenom,email:e.email,telephone:e.telephone??'',categorie:e.categorie,specialite:e.specialite??'',dateEmbauche:e.dateEmbauche,utilisateurId:e.utilisateurId??null}:this.vide();this.modalEmploye=true;}
 enregistrer(){this.service.enregistrer(this.form,this.selection?.uuid).subscribe({next:()=>{this.modalEmploye=false;this.ok(this.selection?'Dossier mis à jour.':'Collaborateur ajouté.');},error:e=>this.echec(e,'Enregistrement impossible')});}
 etat(e:Employe){this.service.changerEtat(e.uuid).subscribe({next:()=>{this.ok(e.actif?'Collaborateur désactivé.':'Collaborateur réactivé.');},error:x=>this.echec(x,'Modification impossible')});}
 demander(){
  this.erreur='';
  if(!this.conge.employeUuid){this.erreur='Choisissez un collaborateur.';return;}
  if(!this.conge.dateDebut||!this.conge.dateFin){this.erreur='Renseignez les dates de début et de fin.';return;}
  if(this.conge.dateFin<this.conge.dateDebut){this.erreur='La date de fin ne peut pas précéder la date de début.';return;}
  this.service.demanderConge(this.conge).subscribe({
   next:()=>{
    this.modalConge=false;
    this.conge={employeUuid:'',type:'ANNUEL',dateDebut:'',dateFin:'',motif:''};
    this.ok('Demande de congé enregistrée.');
   },
   error:e=>this.echec(e,'Demande impossible')
  });
 }
 ouvrirContrat(c?:Contrat){this.selectionContrat=c;this.contrat=c?{employeUuid:c.employe_uuid,type:c.con_type,dateDebut:c.con_date_debut.slice(0,10),dateFin:c.con_date_fin?.slice(0,10)??'',remuneration:c.con_remuneration??null}:{employeUuid:'',type:'CDI',dateDebut:'',dateFin:'',remuneration:null};this.modalContrat=true;}
 creerContrat(){const v={...this.contrat,dateFin:this.contrat.dateFin||null};const req=this.selectionContrat?this.service.modifierContrat(this.selectionContrat.uu_id,v):this.service.creerContrat(v);req.subscribe({next:()=>{this.modalContrat=false;this.ok(this.selectionContrat?'Contrat modifié.':'Contrat enregistré.');},error:e=>this.echec(e,'Enregistrement impossible')});}
 demanderCloture(c:Contrat){this.contratACloturer=c;this.motifCloture='';this.modalClotureContrat=true;}
 cloturer(){if(!this.contratACloturer||!this.motifCloture.trim())return;this.service.cloturerContrat(this.contratACloturer.uu_id,this.motifCloture.trim()).subscribe({next:()=>{this.modalClotureContrat=false;this.ok('Contrat clôturé.');},error:e=>this.echec(e,'Clôture impossible')});}
 decider(c:Conge,s:string){const commentaire=s==='REJETE'?(window.prompt('Motif obligatoire du refus :')??''):'';if(s==='REJETE'&&!commentaire.trim())return;this.service.decider(c.uu_id,s,commentaire).subscribe({next:()=>this.ok(s==='APPROUVE'?'Congé approuvé.':'Congé refusé.'),error:e=>this.echec(e,'Décision impossible')});}
 creerAffectation(){const v={...this.affectation,dateFin:this.affectation.dateFin||null};this.service.creerAffectation(v).subscribe({next:()=>{this.modalAffectation=false;this.ok('Affectation enregistrée.');},error:e=>this.echec(e,'Enregistrement impossible')});}
 supprimerAffectation(a:Affectation){this.service.supprimerAffectation(a.uu_id).subscribe({next:()=>this.ok('Affectation supprimée.'),error:e=>this.echec(e,'Suppression impossible')});}
 enregistrerSolde(){
  this.erreur='';
  if(!this.solde.employeUuid){this.erreur='Choisissez un collaborateur.';return;}
  if(!this.solde.annee||!this.solde.type.trim()){this.erreur='Renseignez l\'année et le type de congé.';return;}
  if(this.solde.joursAcquis<0||this.solde.joursReportes<0){this.erreur='Les nombres de jours ne peuvent pas être négatifs.';return;}
  const modification=!!this.selectionSolde;
  this.service.enregistrerSolde(this.solde).subscribe({
   next:()=>{this.fermerSolde();this.ok(modification?'Solde de congé modifié.':'Solde de congé initialisé.');},
   error:e=>this.echec(e,'Enregistrement impossible')
  });
 }
 evaluer(){this.service.evaluer(this.evaluation).subscribe({next:()=>{this.modalEvaluation=false;this.ok('Évaluation enregistrée.');},error:e=>this.echec(e,'Enregistrement impossible')});}
 private normaliserPageConges(){this.pageConges=Math.min(Math.max(this.pageConges,1),this.totalPagesConges);}
 private filtrer<T>(liste:T[],q:string,valeurs:(item:T)=>unknown[]):T[]{return !q?liste:liste.filter(item=>valeurs(item).some(v=>this.normaliser(v).includes(q)));}
 private normaliser(v:unknown):string{return String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase().trim();}
 private ok(m:string){this.erreur='';this.toast.success(m);this.charger();}
 private echec(e:any,titre='Erreur'){this.toast.error(this.message(e),titre);}
 private vide(){return{nom:'',prenom:'',email:'',telephone:'',categorie:'ENSEIGNANT',specialite:'',dateEmbauche:new Date().toISOString().slice(0,10),utilisateurId:null};}
 private message(e:any){return e?.error?.errors?.[0]?.detail??e?.error?.details??e?.error?.message??e?.error?.errors?.[0]?.message??'Une erreur est survenue.';}
}
