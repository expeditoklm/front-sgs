import {CommonModule} from '@angular/common';
import {Component, OnInit} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {forkJoin} from 'rxjs';
import {Employe} from '../../core/models/personnel.models';
import {PersonnelService} from '../../core/services/personnel.service';

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
  imports:[CommonModule,FormsModule],
  templateUrl:'./evaluations-detaillees.component.html'
})
export class EvaluationsDetailleesComponent implements OnInit {
  employes:Employe[]=[];
  grilles:GrilleEvaluation[]=[];
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

  constructor(private service:PersonnelService){}

  ngOnInit(){
    forkJoin({employes:this.service.employes(),lignes:this.service.grillesEvaluation()}).subscribe({
      next:r=>{
        this.employes=r.employes.filter(e=>e.actif);
        this.grilles=this.regrouper(r.lignes);
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
    this.enregistrement=true;
    this.service.evaluerDetaille({employeUuid:this.employeUuid,grilleId:Number(this.grilleId),trimestre:this.trimestre,date:this.date,objectifs:this.objectifs,appreciation:this.appreciation,notes,valider}).subscribe({
      next:()=>{this.succes=valider?'Évaluation validée.':'Brouillon enregistré.';this.enregistrement=false;this.initialiserNotes();this.objectifs='';this.appreciation='';},
      error:e=>{this.erreur=this.message(e);this.enregistrement=false;}
    });
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

  private message(e:any){return e?.error?.message??'Une erreur est survenue.';}
}
