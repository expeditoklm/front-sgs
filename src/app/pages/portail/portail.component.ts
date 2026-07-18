import { CommonModule } from '@angular/common';
import { Component,OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin, map } from 'rxjs';
import { PortailService } from '../../core/services/portail.service';
import { PaginationComponent } from '../../shared/components/ui/pagination/pagination.component';
import { PaginatePipe } from '../../shared/pipes/paginate.pipe';
import { SelectComponent } from '../../shared/components/form/select/select.component';
import { DocumentViewerService } from '../../core/services/document-viewer.service';
import { ToastService } from '../../core/services/toast.service';
@Component({selector:'app-portail',standalone:true,imports:[CommonModule,FormsModule,PaginationComponent,PaginatePipe,SelectComponent],templateUrl:'./portail.component.html',host:{class:'sgs-dark-view block'}})
export class PortailComponent implements OnInit {
 eleves:any[]=[];eleveUuid='';synthese:any={};notes:any[]=[];paiements:any[]=[];edt:any[]=[];absences:any[]=[];bulletins:any[]=[];onglet:'notes'|'edt'|'absences'|'paiements'|'bulletins'='notes';chargement=false;
 pagination:Record<string,{page:number;size:number}>={notes:{page:1,size:10},edt:{page:1,size:10},absences:{page:1,size:10},paiements:{page:1,size:10},bulletins:{page:1,size:10}};
 pageDe(cle:string){return this.pagination[cle].page;}
 tailleDe(cle:string){return this.pagination[cle].size;}
 totalPages(liste:unknown[],cle:string){return Math.max(1,Math.ceil(liste.length/this.tailleDe(cle)));}
 changerPage(cle:string,page:number,liste:unknown[]){this.pagination[cle].page=Math.min(Math.max(page,1),this.totalPages(liste,cle));}
 changerTaille(cle:string,size:number){this.pagination[cle]={page:1,size};}
 changerOnglet(onglet:'notes'|'edt'|'absences'|'paiements'|'bulletins'){this.onglet=onglet;}
 get eleveOptions(){return this.eleves.map(e=>({value:e.uu_id,label:`${e.elv_prenom??''} ${e.elv_nom??''} · ${e.classe??''}`.trim()}));}
 readonly rechercherEleves=(term:string,limit:number)=>this.portail.rechercherEleves(term,limit).pipe(map(items=>items.map(e=>({value:e.uu_id,label:`${e.elv_prenom??''} ${e.elv_nom??''} · ${e.classe??''}`.trim()}))));
 constructor(private portail:PortailService,private documentViewer:DocumentViewerService,private toast:ToastService){}ngOnInit(){this.portail.eleves().subscribe({next:r=>{this.eleves=r;this.eleveUuid=r[0]?.uu_id??'';if(this.eleveUuid)this.charger();},error:e=>this.toast.error(this.message(e),'Chargement impossible')});}
 charger(){if(!this.eleveUuid)return;this.chargement=true;forkJoin({synthese:this.portail.synthese(this.eleveUuid),notes:this.portail.notes(this.eleveUuid),paiements:this.portail.paiements(this.eleveUuid),edt:this.portail.emploiDuTemps(this.eleveUuid),absences:this.portail.absences(this.eleveUuid),bulletins:this.portail.bulletins(this.eleveUuid)}).subscribe({next:r=>{Object.assign(this,r);Object.values(this.pagination).forEach(p=>p.page=1);this.chargement=false;},error:e=>{this.toast.error(this.message(e),'Chargement impossible');this.chargement=false;}});}
 telecharger(b:any){this.portail.telechargerBulletin(this.eleveUuid,b.uu_id).subscribe({next:blob=>this.documentViewer.open(blob,b.perio_libelle||'Bulletin scolaire','bulletin.pdf'),error:e=>this.toast.error(this.message(e),'Téléchargement impossible')});}
 private message(e:any){return e?.error?.message??'Impossible de charger le portail.';}
}
