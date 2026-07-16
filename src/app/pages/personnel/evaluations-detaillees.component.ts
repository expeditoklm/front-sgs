import {CommonModule} from '@angular/common';
import {Component, OnInit} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {forkJoin, map} from 'rxjs';
import {Employe} from '../../core/models/personnel.models';
import {PersonnelService} from '../../core/services/personnel.service';
import {PaginationComponent} from '../../shared/components/ui/pagination/pagination.component';
import {PaginatePipe} from '../../shared/pipes/paginate.pipe';
import {SelectComponent} from '../../shared/components/form/select/select.component';

interface CritereEvaluation {
  id:number;
  code:string;
  libelle:string;
  coefficient:number;
}

interface GrilleEvaluation {
  id:number;
  code:string;
  libelle:string;
  criteres:CritereEvaluation[];
}

@Component({
  selector:'app-evaluations-detaillees',
  standalone:true,
  imports:[CommonModule,FormsModule,PaginationComponent,PaginatePipe,SelectComponent],
  templateUrl:'./evaluations-detaillees.component.html',
  host:{class:'sgs-dark-view block'}
})
export class EvaluationsDetailleesComponent implements OnInit {
  employes:Employe[]=[];
  grilles:GrilleEvaluation[]=[];
  brouillons:any[]=[];
  brouillonUuid:string|null=null;
  employeUuid='';
  grilleId:number|null=null;
  trimestre=1;
  date=new Date().toISOString().slice(0,10);
  objectifs='';
  appreciation='';
  notes:Record<number,number|null>={};
  erreur='';
  succes='';
  enregistrement=false;
  pageBrouillons=1;
  tailleBrouillons=10;
  readonly trimestreOptions=[1,2,3].map(value=>({value,label:`Trimestre ${value}`}));

  get employeOptions(){return this.employes.map(e=>({value:e.uuid,label:`${e.prenom} ${e.nom} · ${e.matricule}`}));}
  get grilleOptions(){return this.grilles.map(g=>({value:g.id,label:g.libelle}));}
  readonly rechercherEmployes=(term:string,limit:number)=>this.service.employes(term).pipe(map(items=>items.slice(0,limit).map(e=>({value:e.uuid,label:`${e.prenom} ${e.nom} · ${e.matricule}`}))));

  get totalPagesBrouillons(){return Math.max(1,Math.ceil(this.brouillons.length/this.tailleBrouillons));}
  changerPageBrouillons(page:number){this.pageBrouillons=Math.min(Math.max(page,1),this.totalPagesBrouillons);}
  changerTailleBrouillons(taille:number){this.tailleBrouillons=taille;this.pageBrouillons=1;}

  constructor(private service:PersonnelService){}

  ngOnInit(){
    forkJoin({
      employes:this.service.employes(),
      lignes:this.service.grillesEvaluation(),
      evaluations:this.service.evaluations()
    }).subscribe({
      next:r=>{
        this.employes=r.employes.filter(e=>e.actif);
        this.grilles=this.regrouper(r.lignes);
        this.brouillons=this.filtrerBrouillons(r.evaluations);
        if(this.grilles.length){this.grilleId=this.grilles[0].id;this.initialiserNotes();}
      },
      error:e=>this.erreur=this.message(e)
    });
  }

  get grilleSelectionnee(){return this.grilles.find(g=>g.id===Number(this.grilleId));}

  initialiserNotes(){
    this.notes={};
    for(const critere of this.grilleSelectionnee?.criteres??[])this.notes[critere.id]=null;
  }

  moyenne(){
    const criteres=this.grilleSelectionnee?.criteres??[];
    const totalCoef=criteres.reduce((s,c)=>s+c.coefficient,0);
    if(!criteres.length||!totalCoef||criteres.some(c=>this.notes[c.id]===null||this.notes[c.id]===undefined))return null;
    return criteres.reduce((s,c)=>s+Number(this.notes[c.id])*c.coefficient,0)/totalCoef;
  }

  enregistrer(valider:boolean){
    this.erreur='';this.succes='';
    if(!this.employeUuid||!this.grilleId){this.erreur='Sélectionnez un collaborateur et une grille.';return;}
    const criteres=this.grilleSelectionnee?.criteres??[];
    if(criteres.some(c=>this.notes[c.id]===null||Number(this.notes[c.id])<0||Number(this.notes[c.id])>20)){
      this.erreur='Toutes les notes sont obligatoires et doivent être comprises entre 0 et 20.';return;
    }
    const notes=Object.fromEntries(criteres.map(c=>[String(c.id),Number(this.notes[c.id])]));
    const payload={employeUuid:this.employeUuid,grilleId:Number(this.grilleId),trimestre:this.trimestre,date:this.date,objectifs:this.objectifs,appreciation:this.appreciation,notes,valider};
    const modification=!!this.brouillonUuid;
    const requete=this.brouillonUuid
      ?this.service.modifierEvaluationDetaillee(this.brouillonUuid,payload)
      :this.service.evaluerDetaille(payload);
    this.enregistrement=true;
    requete.subscribe({
      next:()=>{
        this.succes=valider?'Évaluation validée.':modification?'Brouillon mis à jour.':'Brouillon enregistré.';
        this.enregistrement=false;
        this.reinitialiser();
        this.chargerBrouillons();
      },
      error:e=>{this.erreur=this.message(e);this.enregistrement=false;}
    });
  }

  reprendre(uuid:string){
    this.erreur='';this.succes='';
    this.service.evaluationDetaillee(uuid).subscribe({
      next:e=>{
        if(e.statut!=='BROUILLON'){
          this.erreur='Cette évaluation a déjà été validée.';
          this.chargerBrouillons();
          return;
        }
        this.brouillonUuid=e.uuid;
        this.employeUuid=e.employeUuid;
        this.grilleId=Number(e.grilleId);
        this.trimestre=Number(e.trimestre);
        this.date=String(e.date);
        this.objectifs=e.objectifs??'';
        this.appreciation=e.appreciation??'';
        this.initialiserNotes();
        for(const [critereId,note] of Object.entries(e.notes??{}))this.notes[Number(critereId)]=Number(note);
        window.scrollTo({top:0,behavior:'smooth'});
      },
      error:e=>this.erreur=this.message(e)
    });
  }

  annulerReprise(){this.reinitialiser();}

  private chargerBrouillons(){
    this.service.evaluations().subscribe({
      next:evaluations=>{this.brouillons=this.filtrerBrouillons(evaluations);this.pageBrouillons=1;},
      error:e=>this.erreur=this.message(e)
    });
  }

  private filtrerBrouillons(evaluations:any[]){
    return evaluations.filter(e=>e.eva_statut==='BROUILLON'&&e.eva_grille_id);
  }

  private reinitialiser(){
    this.brouillonUuid=null;
    this.employeUuid='';
    this.trimestre=1;
    this.date=new Date().toISOString().slice(0,10);
    this.objectifs='';
    this.appreciation='';
    this.initialiserNotes();
  }

  private regrouper(lignes:any[]):GrilleEvaluation[]{
    const grilles=new Map<number,GrilleEvaluation>();
    for(const ligne of lignes){
      const id=Number(ligne.id);
      if(!grilles.has(id))grilles.set(id,{id,code:ligne.gri_code,libelle:ligne.gri_libelle,criteres:[]});
      if(ligne.critere_id)grilles.get(id)!.criteres.push({id:Number(ligne.critere_id),code:ligne.cri_code,libelle:ligne.cri_libelle,coefficient:Number(ligne.cri_coefficient)});
    }
    return [...grilles.values()];
  }

  private message(e:any){return e?.error?.errors?.[0]?.detail??e?.error?.details??e?.error?.message??'Une erreur est survenue.';}
}
