import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FullCalendarComponent, FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, DateSelectArg, EventClickArg, EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { ModalComponent } from '../../shared/components/ui/modal/modal.component';
import { AbsenceCours, AbsencePayload, CoursPayload, CoursPlanifie, DisponibiliteEnseignant, DisponibilitePayload, JourSemaine, OptionRef, Remplacement, RemplacementPayload, SuggestionConflit } from '../../core/models/emploi-du-temps.models';
import { EmploiDuTempsService } from '../../core/services/emploi-du-temps.service';

@Component({selector:'app-calender',imports:[CommonModule,FormsModule,FullCalendarModule,ModalComponent],templateUrl:'./calender.component.html'})
export class CalenderComponent implements OnInit {
 @ViewChild('calendar') calendar!:FullCalendarComponent;
 cours:CoursPlanifie[]=[];tousLesCours:CoursPlanifie[]=[];annees:OptionRef[]=[];classes:OptionRef[]=[];matieres:OptionRef[]=[];enseignants:OptionRef[]=[];salles:OptionRef[]=[];
 disponibilites:DisponibiliteEnseignant[]=[];remplacements:Remplacement[]=[];absences:AbsenceCours[]=[];journal:Record<string,unknown>[]=[];suggestions:SuggestionConflit[]=[];
 anneeId=0;classeFiltre=0;enseignantFiltre=0;salleFiltre=0;chargement=false;erreur='';succes='';isOpen=false;selection?:CoursPlanifie;
 vue:'calendrier'|'remplacements'|'disponibilites'|'absences'|'journal'='calendrier';modalRemplacement=false;modalDisponibilite=false;modalAbsence=false;
 publication='Non publié';form:CoursPayload=this.formVide();
 remplacement:RemplacementPayload={enseignantRemplacantId:0,date:'',motif:''};
 disponibilite:DisponibilitePayload={enseignantId:0,jour:'MONDAY',heureDebut:'08:00',heureFin:'18:00',disponible:false,motif:''};
 absence:AbsencePayload={date:'',type:'ELEVE',nomPersonne:'',justifiee:false,motif:''};
 readonly jours:{value:JourSemaine;label:string}[]=[['MONDAY','Lundi'],['TUESDAY','Mardi'],['WEDNESDAY','Mercredi'],['THURSDAY','Jeudi'],['FRIDAY','Vendredi'],['SATURDAY','Samedi']].map(x=>({value:x[0] as JourSemaine,label:x[1]}));
 calendarOptions:CalendarOptions={plugins:[dayGridPlugin,timeGridPlugin,interactionPlugin],initialView:'timeGridWeek',locale:'fr',firstDay:1,weekends:true,allDaySlot:false,slotMinTime:'07:00:00',slotMaxTime:'20:00:00',slotDuration:'00:30:00',height:'auto',editable:true,selectable:true,nowIndicator:true,headerToolbar:{left:'prev,next today',center:'title',right:'timeGridWeek,timeGridDay,dayGridMonth'},buttonText:{today:"Aujourd'hui",week:'Semaine',day:'Jour',month:'Mois'},select:i=>this.selectionnerPlage(i),eventClick:i=>this.editer(i),eventDrop:i=>this.deplacer(i),eventResize:i=>this.deplacer(i),events:[]};
 constructor(private edt:EmploiDuTempsService){}
 ngOnInit(){this.chargerDepuisServeur();}
 get publies(){return this.cours.filter(c=>c.statut==='PUBLIE').length;}
 get volume(){return this.cours.reduce((s,c)=>s+(this.minutes(c.heureFin)-this.minutes(c.heureDebut))/60,0);}
 get conflits(){return this.suggestions.length;}

 charger(){
  this.erreur='';
  this.cours=this.tousLesCours.filter(c=>c.anneeScolaireId===this.anneeId&&(!this.classeFiltre||c.classeId===this.classeFiltre)&&(!this.enseignantFiltre||c.enseignantId===this.enseignantFiltre)&&(!this.salleFiltre||c.salleId===this.salleFiltre));
  const events=this.cours.map(c=>this.event(c));const api=this.calendar?.getApi();
  if(api){api.removeAllEvents();api.addEventSource(events);}else this.calendarOptions={...this.calendarOptions,events};
  this.chargerAnnexes();
 }
 chargerDepuisServeur(){this.chargement=true;this.edt.options().subscribe({next:r=>{this.annees=r.annees;this.classes=r.classes;this.matieres=r.matieres;this.enseignants=r.enseignants;this.salles=r.salles;this.tousLesCours=r.cours??[];this.anneeId=this.anneeId||this.annees[0]?.id||0;this.chargement=false;this.charger();},error:e=>{this.erreur=this.message(e);this.chargement=false;}});}
 chargerAnnexes(){if(!this.anneeId)return;this.edt.statutPublication(this.anneeId).subscribe({next:r=>this.publication=r.publie?`Publié · version ${(r.publicationActive as any)?.pub_version??''}`:'Non publié'});this.edt.remplacements(this.anneeId).subscribe({next:r=>this.remplacements=r});this.edt.disponibilites(this.enseignantFiltre||undefined).subscribe({next:r=>this.disponibilites=r});this.edt.absences().subscribe({next:r=>this.absences=r});if(this.vue==='journal')this.edt.journal().subscribe({next:r=>this.journal=r});}
 changerVue(v:'calendrier'|'remplacements'|'disponibilites'|'absences'|'journal'){this.vue=v;this.chargerAnnexes();}
 ouvrir(){this.selection=undefined;this.suggestions=[];this.form={...this.formVide(),anneeScolaireId:this.anneeId};this.isOpen=true;}
 selectionnerPlage(i:DateSelectArg){this.ouvrir();this.form.jour=this.jour(i.start.getDay());this.form.heureDebut=this.horaire(i.start);this.form.heureFin=this.horaire(i.end);}
 editer(i:EventClickArg){const c=this.cours.find(x=>x.uuid===i.event.id);if(c){this.selection=c;this.suggestions=[];this.form={anneeScolaireId:c.anneeScolaireId,classeId:c.classeId,matiereId:c.matiereId,enseignantId:c.enseignantId,salleId:c.salleId,jour:c.jour,heureDebut:c.heureDebut.slice(0,5),heureFin:c.heureFin.slice(0,5),dateException:c.dateException??null,couleur:c.couleur,notes:c.notes};this.isOpen=true;}}
 enregistrer(){this.erreur='';this.suggestions=[];const req=this.selection?this.edt.modifier(this.selection.uuid,this.form):this.edt.creer(this.form);req.subscribe({next:()=>{this.isOpen=false;this.succes=this.selection?'Créneau mis à jour.':'Créneau ajouté sans conflit.';this.chargerDepuisServeur();},error:e=>{this.erreur=this.message(e);if(this.erreur.toLowerCase().includes('conflit'))this.edt.suggestions(this.form).subscribe({next:r=>this.suggestions=r});}});}
 appliquer(s:SuggestionConflit){this.form={...this.form,salleId:s.salleId,enseignantId:s.enseignantId,jour:s.jour,heureDebut:s.heureDebut.slice(0,5),heureFin:s.heureFin.slice(0,5)};this.suggestions=[];}
 annuler(){if(!this.selection)return;this.edt.annuler(this.selection.uuid).subscribe({next:()=>{this.isOpen=false;this.succes='Créneau annulé.';this.chargerDepuisServeur();},error:e=>this.erreur=this.message(e)});}
 publier(){this.edt.publier(this.anneeId).subscribe({next:r=>{this.succes=`Emploi du temps publié, version ${r['version']}.`;this.chargerDepuisServeur();},error:e=>this.erreur=this.message(e)});}
 exporter(){this.edt.exporterPdf(this.anneeId,this.classeFiltre||undefined,this.enseignantFiltre||undefined,this.salleFiltre||undefined).subscribe({next:b=>{const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download='emploi-du-temps.pdf';a.click();URL.revokeObjectURL(u);},error:e=>this.erreur=this.message(e)});}
 ouvrirRemplacement(){if(!this.selection)return;this.remplacement={enseignantRemplacantId:0,date:'',motif:''};this.modalRemplacement=true;}
 enregistrerRemplacement(){if(!this.selection)return;this.edt.remplacer(this.selection.uuid,this.remplacement).subscribe({next:()=>{this.modalRemplacement=false;this.isOpen=false;this.succes='Remplacement planifié.';this.chargerAnnexes();},error:e=>this.erreur=this.message(e)});}
 supprimerRemplacement(uuid:string){this.edt.annulerRemplacement(uuid).subscribe({next:()=>this.chargerAnnexes(),error:e=>this.erreur=this.message(e)});}
 ouvrirDisponibilite(){this.disponibilite={enseignantId:this.enseignantFiltre||0,jour:'MONDAY',heureDebut:'08:00',heureFin:'18:00',disponible:false,motif:''};this.modalDisponibilite=true;}
 enregistrerDisponibilite(){this.edt.enregistrerDisponibilite(this.disponibilite).subscribe({next:()=>{this.modalDisponibilite=false;this.succes='Disponibilité enregistrée.';this.chargerAnnexes();},error:e=>this.erreur=this.message(e)});}
 supprimerDisponibilite(uuid:string){this.edt.supprimerDisponibilite(uuid).subscribe({next:()=>this.chargerAnnexes(),error:e=>this.erreur=this.message(e)});}
 ouvrirAbsence(){if(!this.selection)return;this.absence={date:'',type:'ELEVE',nomPersonne:'',justifiee:false,motif:''};this.modalAbsence=true;}
 enregistrerAbsence(){if(!this.selection)return;this.edt.saisirAbsence(this.selection.uuid,this.absence).subscribe({next:()=>{this.modalAbsence=false;this.isOpen=false;this.succes='Absence enregistrée.';this.chargerAnnexes();},error:e=>this.erreur=this.message(e)});}
 justifier(a:AbsenceCours){this.edt.justifierAbsence(a.uu_id,a.abs_motif).subscribe({next:()=>this.chargerAnnexes(),error:e=>this.erreur=this.message(e)});}
 deplacer(i:any){const c=this.cours.find(x=>x.uuid===i.event.id);if(!c||!i.event.start||!i.event.end){i.revert();return;}const p:CoursPayload={anneeScolaireId:c.anneeScolaireId,classeId:c.classeId,matiereId:c.matiereId,enseignantId:c.enseignantId,salleId:c.salleId,jour:this.jour(i.event.start.getDay()),heureDebut:this.horaire(i.event.start),heureFin:this.horaire(i.event.end),couleur:c.couleur,notes:c.notes};this.edt.modifier(c.uuid,p).subscribe({next:()=>this.chargerDepuisServeur(),error:e=>{i.revert();this.erreur=this.message(e);}});}
 private event(c:CoursPlanifie):EventInput{return{id:c.uuid,title:`${c.matiere} · ${c.classe}\n${c.enseignant} · ${c.salle}`,daysOfWeek:[this.indice(c.jour)],startTime:c.heureDebut,endTime:c.heureFin,backgroundColor:c.couleur||'#465fff',borderColor:c.couleur||'#465fff',extendedProps:{statut:c.statut}};}
 private formVide():CoursPayload{return{anneeScolaireId:0,classeId:0,matiereId:0,enseignantId:0,salleId:0,jour:'MONDAY',heureDebut:'08:00',heureFin:'09:00',couleur:'#465fff',notes:''};}
 private indice(j:JourSemaine){return this.jours.findIndex(x=>x.value===j)+1;}private jour(n:number){return (['MONDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'][n]??'MONDAY') as JourSemaine;}
 private horaire(d:Date){return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;}private minutes(s:string){const[a,b]=s.split(':').map(Number);return a*60+b;}
 private message(e:any){return e?.error?.message??e?.error?.errors?.[0]?.message??'Une erreur est survenue.';}
}
