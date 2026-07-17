import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FullCalendarComponent, FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, DateSelectArg, EventClickArg, EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { ModalComponent } from '../../shared/components/ui/modal/modal.component';
import { AbsenceCours, AbsencePayload, CoursPayload, CoursPlanifie, DisponibiliteEnseignant, DisponibilitePayload, EleveCoursOption, IndisponibiliteSalle, JourSemaine, OptionRef, PlageHoraire, Remplacement, RemplacementPayload, SuggestionConflit } from '../../core/models/emploi-du-temps.models';
import { EmploiDuTempsService } from '../../core/services/emploi-du-temps.service';
import { DocumentViewerService } from '../../core/services/document-viewer.service';
import { PaginationComponent } from '../../shared/components/ui/pagination/pagination.component';
import { PaginatePipe } from '../../shared/pipes/paginate.pipe';
import { SelectComponent } from '../../shared/components/form/select/select.component';

@Component({selector:'app-calender',imports:[CommonModule,FormsModule,FullCalendarModule,ModalComponent,PaginationComponent,PaginatePipe,SelectComponent],templateUrl:'./calender.component.html',host:{class:'sgs-dark-view block'}})
export class CalenderComponent implements OnInit {
 @ViewChild('calendar') calendar!:FullCalendarComponent;
 cours:CoursPlanifie[]=[];tousLesCours:CoursPlanifie[]=[];annees:OptionRef[]=[];classes:OptionRef[]=[];matieres:OptionRef[]=[];enseignants:OptionRef[]=[];salles:OptionRef[]=[];
 disponibilites:DisponibiliteEnseignant[]=[];remplacements:Remplacement[]=[];absences:AbsenceCours[]=[];journal:Record<string,unknown>[]=[];suggestions:SuggestionConflit[]=[];
 anneeId=0;classeFiltre=0;enseignantFiltre=0;salleFiltre=0;chargement=false;erreur='';succes='';isOpen=false;selection?:CoursPlanifie;
 vue:'calendrier'|'remplacements'|'disponibilites'|'salles'|'plages'|'absences'|'journal'='calendrier';modalRemplacement=false;modalDisponibilite=false;modalAbsence=false;modalPlage=false;modalSalle=false;
 publication='Non publié';form:CoursPayload=this.formVide();
 remplacement:RemplacementPayload={enseignantRemplacantId:0,date:'',motif:''};
 disponibilite:DisponibilitePayload={enseignantId:0,jour:'MONDAY',heureDebut:'08:00',heureFin:'18:00',disponible:false,motif:''};
 absence:AbsencePayload={date:'',type:'ELEVE',nomPersonne:'',justifiee:false,motif:''};
 elevesCours:EleveCoursOption[]=[];
 plages:PlageHoraire[]=[];indisponibilitesSalles:IndisponibiliteSalle[]=[];
 pagination:Record<string,{page:number;size:number}>={remplacements:{page:1,size:10},disponibilites:{page:1,size:10},salles:{page:1,size:10},plages:{page:1,size:10},absences:{page:1,size:10},journal:{page:1,size:10}};
 pageDe(cle:string){return this.pagination[cle].page;}
 tailleDe(cle:string){return this.pagination[cle].size;}
 totalPages(liste:unknown[],cle:string){return Math.max(1,Math.ceil(liste.length/this.tailleDe(cle)));}
 changerPage(cle:string,page:number,liste:unknown[]){this.pagination[cle].page=Math.min(Math.max(page,1),this.totalPages(liste,cle));}
 changerTaille(cle:string,size:number){this.pagination[cle]={page:1,size};}
 plage={code:'',libelle:'',debut:'07:30',fin:'08:45',ordre:1,active:true};plageUuid?:string;indispoSalle={salleId:0,jour:'MONDAY' as JourSemaine,dateDebut:null as string|null,dateFin:null as string|null,heureDebut:'07:00',heureFin:'18:00',motif:''};
 readonly jours:{value:JourSemaine;label:string}[]=[['MONDAY','Lundi'],['TUESDAY','Mardi'],['WEDNESDAY','Mercredi'],['THURSDAY','Jeudi'],['FRIDAY','Vendredi'],['SATURDAY','Samedi']].map(x=>({value:x[0] as JourSemaine,label:x[1]}));
 get anneeOptions(){return this.annees.map(x=>({value:x.id,label:x.label}));}
 get classeOptions(){return this.classes.map(x=>({value:x.id,label:x.label}));}
 get classeFiltreOptions(){return [{value:0,label:'Toutes'},...this.classeOptions];}
 get matiereOptions(){return this.matieres.map(x=>({value:x.id,label:x.label}));}
 get enseignantOptions(){return this.enseignants.map(x=>({value:x.id,label:x.label}));}
 get enseignantFiltreOptions(){return [{value:0,label:'Tous'},...this.enseignantOptions];}
 get salleOptions(){return this.salles.map(x=>({value:x.id,label:x.label}));}
 get salleFiltreOptions(){return [{value:0,label:'Toutes'},...this.salleOptions];}
 get plageOptions(){return [{value:null,label:'Horaire libre'},...this.plages.map(p=>({value:p.id,label:`${p.pla_ordre} · ${p.pla_libelle} (${p.pla_debut}–${p.pla_fin})${p.pla_active?'':' · inactive'}`,disabled:!p.pla_active}))];}
 get eleveCoursOptions(){return this.elevesCours.map(e=>({value:e.id,label:e.label}));}
 readonly etatDisponibiliteOptions=[{value:true,label:'Disponible'},{value:false,label:'Indisponible'}];
 readonly typeAbsenceOptions=[{value:'ELEVE',label:'Élève'},{value:'ENSEIGNANT',label:'Enseignant'}];
 readonly rechercherAnnees=(term:string,limit:number)=>this.edt.rechercherOptions('annees',term,limit);
 readonly rechercherClasses=(term:string,limit:number)=>this.edt.rechercherOptions('classes',term,limit);
 readonly rechercherMatieres=(term:string,limit:number)=>this.edt.rechercherOptions('matieres',term,limit);
 readonly rechercherEnseignants=(term:string,limit:number)=>this.edt.rechercherOptions('enseignants',term,limit);
 readonly rechercherSalles=(term:string,limit:number)=>this.edt.rechercherOptions('salles',term,limit);
 calendarOptions:CalendarOptions={plugins:[dayGridPlugin,timeGridPlugin,interactionPlugin],initialView:'timeGridWeek',locale:'fr',firstDay:1,weekends:true,allDaySlot:false,slotMinTime:'07:00:00',slotMaxTime:'20:00:00',slotDuration:'00:30:00',height:'auto',editable:true,selectable:true,nowIndicator:true,headerToolbar:{left:'prev,next today',center:'title',right:'timeGridWeek,timeGridDay,dayGridMonth'},buttonText:{today:"Aujourd'hui",week:'Semaine',day:'Jour',month:'Mois'},select:i=>this.selectionnerPlage(i),eventClick:i=>this.editer(i),eventDrop:i=>this.deplacer(i),eventResize:i=>this.deplacer(i),events:[]};
 constructor(private edt:EmploiDuTempsService,private documentViewer:DocumentViewerService){}
 ngOnInit(){this.chargerDepuisServeur();}
 get publies(){return this.cours.filter(c=>c.statut==='PUBLIE').length;}
 get volume(){return this.cours.reduce((s,c)=>s+(this.minutes(c.heureFin)-this.minutes(c.heureDebut))/60,0);}
 get conflits(){return this.suggestions.length;}
 get enseignantValide(){return this.enseignants.some(x=>x.id===Number(this.form.enseignantId));}

 charger(){
  this.erreur='';
  this.cours=this.tousLesCours.filter(c=>c.anneeScolaireId===this.anneeId&&(!this.classeFiltre||c.classeId===this.classeFiltre)&&(!this.enseignantFiltre||c.enseignantId===this.enseignantFiltre)&&(!this.salleFiltre||c.salleId===this.salleFiltre));
  const events=this.cours.map(c=>this.event(c));
  // FullCalendar est détruit par le @if lorsque l'utilisateur ouvre un autre
  // onglet. Conserver les événements dans calendarOptions permet à la nouvelle
  // instance de les retrouver immédiatement lors du retour au calendrier.
  this.calendarOptions={...this.calendarOptions,events};
  this.chargerAnnexes();
 }
 chargerDepuisServeur(){this.chargement=true;this.edt.options().subscribe({next:r=>{this.annees=r.annees;this.classes=r.classes;this.matieres=r.matieres;this.enseignants=r.enseignants;this.salles=r.salles;this.tousLesCours=r.cours??[];this.anneeId=this.anneeId||this.annees[0]?.id||0;this.chargement=false;this.charger();},error:e=>{this.erreur=this.message(e);this.chargement=false;}});}
 chargerAnnexes(){if(!this.anneeId)return;this.edt.statutPublication(this.anneeId).subscribe({next:r=>this.publication=r.publie?`Publié · version ${(r.publicationActive as any)?.pub_version??''}`:'Non publié'});this.edt.remplacements(this.anneeId).subscribe({next:r=>this.remplacements=r});this.edt.disponibilites(this.enseignantFiltre||undefined).subscribe({next:r=>this.disponibilites=r});this.edt.absences().subscribe({next:r=>this.absences=r});this.edt.plages().subscribe({next:r=>this.plages=r});this.edt.indisponibilitesSalles().subscribe({next:r=>this.indisponibilitesSalles=r});if(this.vue==='journal')this.edt.journal().subscribe({next:r=>this.journal=r});}
 changerVue(v:'calendrier'|'remplacements'|'disponibilites'|'salles'|'plages'|'absences'|'journal'){
  this.vue=v;
  this.chargerAnnexes();
  if(v==='calendrier'){
   // Attendre que Angular recrée <full-calendar>, puis recalculer sa largeur.
   // Sans cela, un calendrier recréé dans un conteneur auparavant masqué peut
   // conserver une géométrie vide ou incorrecte.
   setTimeout(()=>this.calendar?.getApi().updateSize());
  }
 }
 ouvrir(){this.selection=undefined;this.suggestions=[];this.form={...this.formVide(),anneeScolaireId:this.anneeId};this.isOpen=true;}
 selectionnerPlage(i:DateSelectArg){this.ouvrir();this.form.jour=this.jour(i.start.getDay());this.form.heureDebut=this.horaire(i.start);this.form.heureFin=this.horaire(i.end);}
 editer(i:EventClickArg){const c=this.cours.find(x=>x.uuid===i.event.id);if(c){this.selection=c;this.suggestions=[];this.form={anneeScolaireId:c.anneeScolaireId,classeId:c.classeId,matiereId:c.matiereId,enseignantId:c.enseignantId,salleId:c.salleId,plageId:c.plageId??null,jour:c.jour,heureDebut:c.heureDebut.slice(0,5),heureFin:c.heureFin.slice(0,5),dateException:c.dateException??null,couleur:c.couleur,notes:c.notes};this.isOpen=true;}}
 enregistrer(){this.erreur='';this.suggestions=[];if(!this.enseignantValide){this.erreur=this.enseignants.length?'Sélectionnez un enseignant affecté avant d’enregistrer.':'Aucun enseignant affecté n’est disponible. Créez d’abord une affectation dans Personnel > Affectations.';return;}const req=this.selection?this.edt.modifier(this.selection.uuid,this.form):this.edt.creer(this.form);req.subscribe({next:()=>{this.isOpen=false;this.succes=this.selection?'Créneau mis à jour.':'Créneau ajouté sans conflit.';this.chargerDepuisServeur();},error:e=>{this.erreur=this.message(e);if(this.erreur.toLowerCase().includes('conflit'))this.edt.suggestions(this.form).subscribe({next:r=>this.suggestions=r});}});}
 appliquer(s:SuggestionConflit){this.form={...this.form,salleId:s.salleId,enseignantId:s.enseignantId,jour:s.jour,heureDebut:s.heureDebut.slice(0,5),heureFin:s.heureFin.slice(0,5)};this.suggestions=[];}
 annuler(){if(!this.selection)return;this.edt.annuler(this.selection.uuid).subscribe({next:()=>{this.isOpen=false;this.succes='Créneau annulé.';this.chargerDepuisServeur();},error:e=>this.erreur=this.message(e)});}
 publier(){this.edt.publier(this.anneeId).subscribe({next:r=>{this.succes=`Emploi du temps publié, version ${r['version']}.`;this.chargerDepuisServeur();},error:e=>this.erreur=this.message(e)});}
 exporter(){
  this.erreur='';
  if(!this.anneeId){this.erreur='Sélectionnez une année scolaire avant l’export.';return;}
  this.edt.exporterPdf(this.anneeId,this.classeFiltre||undefined,this.enseignantFiltre||undefined,this.salleFiltre||undefined).subscribe({
   next:b=>{
    if(!b?.size){this.erreur='Le serveur a généré un fichier PDF vide.';return;}
    this.documentViewer.open(b,'Emploi du temps','emploi-du-temps.pdf');
   },
   error:e=>this.messageBlob(e).then(message=>this.erreur=message)
  });
 }
 ouvrirRemplacement(){if(!this.selection)return;this.remplacement={enseignantRemplacantId:0,date:'',motif:''};this.modalRemplacement=true;}
 enregistrerRemplacement(){if(!this.selection)return;this.edt.remplacer(this.selection.uuid,this.remplacement).subscribe({next:()=>{this.modalRemplacement=false;this.isOpen=false;this.succes='Remplacement planifié.';this.chargerAnnexes();},error:e=>this.erreur=this.message(e)});}
 supprimerRemplacement(uuid:string){this.edt.annulerRemplacement(uuid).subscribe({next:()=>this.chargerAnnexes(),error:e=>this.erreur=this.message(e)});}
 ouvrirDisponibilite(){this.disponibilite={enseignantId:this.enseignantFiltre||0,jour:'MONDAY',heureDebut:'08:00',heureFin:'18:00',disponible:false,motif:''};this.modalDisponibilite=true;}
 enregistrerDisponibilite(){this.edt.enregistrerDisponibilite(this.disponibilite).subscribe({next:()=>{this.modalDisponibilite=false;this.succes='Disponibilité enregistrée.';this.chargerAnnexes();},error:e=>this.erreur=this.message(e)});}
 supprimerDisponibilite(uuid:string){this.edt.supprimerDisponibilite(uuid).subscribe({next:()=>this.chargerAnnexes(),error:e=>this.erreur=this.message(e)});}
 ouvrirPlage(p?:PlageHoraire){this.plageUuid=p?.uu_id;this.plage=p?{code:p.pla_code,libelle:p.pla_libelle,debut:p.pla_debut.slice(0,5),fin:p.pla_fin.slice(0,5),ordre:p.pla_ordre,active:p.pla_active}:{code:'',libelle:'',debut:'07:30',fin:'08:45',ordre:this.plages.length+1,active:true};this.modalPlage=true;}
 enregistrerPlage(){this.edt.enregistrerPlage(this.plage,this.plageUuid).subscribe({next:()=>{this.modalPlage=false;this.chargerAnnexes();},error:e=>this.erreur=this.message(e)});}
 appliquerPlage(){const p=this.plages.find(x=>x.id===Number(this.form.plageId));if(p){this.form.heureDebut=p.pla_debut.slice(0,5);this.form.heureFin=p.pla_fin.slice(0,5);}}
 enregistrerIndispoSalle(){this.edt.enregistrerIndisponibiliteSalle(this.indispoSalle).subscribe({next:()=>{this.modalSalle=false;this.chargerAnnexes();},error:e=>this.erreur=this.message(e)});}
 supprimerIndispoSalle(uuid:string){this.edt.supprimerIndisponibiliteSalle(uuid).subscribe({next:()=>this.chargerAnnexes(),error:e=>this.erreur=this.message(e)});}
 ouvrirAbsence(){if(!this.selection)return;this.elevesCours=[];this.absence={date:'',type:'ELEVE',nomPersonne:'',justifiee:false,motif:''};this.modalAbsence=true;this.edt.elevesDuCours(this.selection.uuid).subscribe({next:r=>this.elevesCours=r,error:e=>this.erreur=this.message(e)});}
 changerTypeAbsence(){if(this.absence.type==='ENSEIGNANT'&&this.selection){this.absence.personneId=this.selection.enseignantId;this.absence.nomPersonne=this.selection.enseignant;}else{this.absence.personneId=undefined;this.absence.nomPersonne='';}}
 choisirEleve(){const e=this.elevesCours.find(x=>x.id===Number(this.absence.personneId));this.absence.nomPersonne=e?.label??'';}
 enregistrerAbsence(){if(!this.selection)return;this.edt.saisirAbsence(this.selection.uuid,this.absence).subscribe({next:()=>{this.modalAbsence=false;this.isOpen=false;this.succes='Absence enregistrée.';this.chargerAnnexes();},error:e=>this.erreur=this.message(e)});}
 justifier(a:AbsenceCours){this.edt.justifierAbsence(a.uu_id,a.abs_motif).subscribe({next:()=>this.chargerAnnexes(),error:e=>this.erreur=this.message(e)});}
 deplacer(i:any){const c=this.cours.find(x=>x.uuid===i.event.id);if(!c||!i.event.start||!i.event.end){i.revert();return;}const p:CoursPayload={anneeScolaireId:c.anneeScolaireId,classeId:c.classeId,matiereId:c.matiereId,enseignantId:c.enseignantId,salleId:c.salleId,plageId:null,jour:this.jour(i.event.start.getDay()),heureDebut:this.horaire(i.event.start),heureFin:this.horaire(i.event.end),couleur:c.couleur,notes:c.notes};this.edt.modifier(c.uuid,p).subscribe({next:()=>this.chargerDepuisServeur(),error:e=>{i.revert();this.erreur=this.message(e);}});}
 private event(c:CoursPlanifie):EventInput{return{id:c.uuid,title:`${c.matiere} · ${c.classe}\n${c.enseignant} · ${c.salle}`,daysOfWeek:[this.indice(c.jour)],startTime:c.heureDebut,endTime:c.heureFin,backgroundColor:c.couleur||'#465fff',borderColor:c.couleur||'#465fff',extendedProps:{statut:c.statut}};}
 private formVide():CoursPayload{return{anneeScolaireId:0,classeId:0,matiereId:0,enseignantId:0,salleId:0,jour:'MONDAY',heureDebut:'08:00',heureFin:'09:00',couleur:'#465fff',notes:''};}
 private indice(j:JourSemaine){return this.jours.findIndex(x=>x.value===j)+1;}private jour(n:number){return (['MONDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'][n]??'MONDAY') as JourSemaine;}
 private horaire(d:Date){return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;}private minutes(s:string){const[a,b]=s.split(':').map(Number);return a*60+b;}
 dateValue(value:unknown):string|number|Date|null{return typeof value==='string'||typeof value==='number'||value instanceof Date?value:null;}
 private async messageBlob(e:any){
  if(e?.error instanceof Blob){
   try{
    const texte=await e.error.text();
    if(texte){
     const corps=JSON.parse(texte);
     return corps?.errors?.[0]?.detail
       ??corps?.details
       ??corps?.message
       ??texte;
    }
   }catch{}
  }
  return this.message(e);
 }
 private message(e:any){return e?.error?.errors?.[0]?.detail??e?.error?.details??e?.error?.message??e?.error?.errors?.[0]?.message??'Une erreur est survenue.';}
}
