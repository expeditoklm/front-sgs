import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProvisioningJob, SaaSPlan, Subscription, Tenant } from '../../../core/models/saas.models';
import { SaasService } from '../../../core/services/saas.service';
import { TenantContextService } from '../../../core/services/tenant-context.service';
import { ToastService } from '../../../core/services/toast.service';
import { ModalComponent } from '../../../shared/components/ui/modal/modal.component';

@Component({
  selector: 'app-saas-schools', standalone: true, imports: [CommonModule, FormsModule, ModalComponent],
  host: { class: 'sgs-dark-view block' },
  template: `
  <div class="mx-auto max-w-7xl space-y-5">
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div><p class="text-sm font-medium text-brand-500">Console SaaS</p><h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Écoles clientes</h1>
      <p class="text-sm text-gray-500 dark:text-gray-400">Validez les demandes publiques puis suivez l’activation des écoles.</p></div>
      <button (click)="showForm=!showForm" class="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white">Nouvelle école</button>
    </header>

    @if(showForm){<form (ngSubmit)="create()" class="grid gap-3 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:grid-cols-4">
      <input [(ngModel)]="draft.code" name="code" required placeholder="Code" class="h-11 rounded-lg border border-gray-300 bg-transparent px-3 dark:border-gray-700 dark:text-white">
      <input [(ngModel)]="draft.name" name="name" required placeholder="Nom de l'école" class="h-11 rounded-lg border border-gray-300 bg-transparent px-3 dark:border-gray-700 dark:text-white">
      <input [(ngModel)]="draft.email" name="email" type="email" required placeholder="E-mail" class="h-11 rounded-lg border border-gray-300 bg-transparent px-3 dark:border-gray-700 dark:text-white">
      <button [disabled]="saving" class="h-11 rounded-lg bg-brand-500 px-4 text-white disabled:opacity-50">{{saving?'Création…':'Créer'}}</button>
    </form>}

    <section class="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div class="overflow-x-auto"><table class="w-full text-left text-sm"><thead class="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-white/[0.04] dark:text-gray-400"><tr><th class="p-4">École</th><th class="p-4">Code</th><th class="p-4">Statut</th><th class="p-4">Actions</th></tr></thead>
      <tbody><tr *ngFor="let tenant of tenants" class="border-t border-gray-200 dark:border-gray-800"><td class="p-4 font-medium text-gray-900 dark:text-white">{{tenant.name}}<div class="text-xs font-normal text-gray-500">{{tenant.founderName||'Fondateur non renseigné'}} · {{tenant.email||'—'}}<span *ngIf="tenant.contactPhone"> · {{tenant.contactPhone}}</span></div></td><td class="p-4 dark:text-gray-300">{{tenant.code}}</td><td class="p-4"><span class="rounded-full px-2.5 py-1 text-xs font-medium" [ngClass]="statusClass(tenant.status)">{{statusLabel(tenant.status)}}</span></td><td class="p-4"><div class="flex flex-wrap gap-2"><button *ngIf="tenant.status==='PENDING_REVIEW'" (click)="approve(tenant)" [disabled]="reviewLoadingId===tenant.id" class="rounded-lg bg-success-600 px-3 py-2 text-white disabled:opacity-50">{{reviewLoadingId===tenant.id?'Activation…':'Approuver et activer'}}</button><button *ngIf="tenant.status==='PENDING_REVIEW'" (click)="reject(tenant)" [disabled]="reviewLoadingId===tenant.id" class="rounded-lg border border-error-300 px-3 py-2 text-error-600">Rejeter</button><button (click)="selectTenant(tenant)" class="rounded-lg border px-3 py-2 dark:border-gray-700 dark:text-gray-200" [class.border-brand-500]="selected?.id===tenant.id">{{selected?.id===tenant.id?'Configuration ouverte':'Détails'}}</button><button *ngIf="tenant.status==='ACTIVE'" (click)="administer(tenant)" class="rounded-lg bg-brand-500 px-3 py-2 text-white">Administrer</button><button *ngIf="tenant.status==='ACTIVE'" (click)="sendInvitation(tenant)" [disabled]="invitationLoadingId===tenant.id" class="rounded-lg border px-3 py-2 dark:border-gray-700 dark:text-gray-200 disabled:opacity-50">{{invitationLoadingId===tenant.id?'Envoi…':'Renvoyer l’invitation'}}</button></div></td></tr></tbody></table></div>
      @if(loading){<p class="p-8 text-center text-sm text-gray-500">Chargement…</p>} @else if(!tenants.length){<p class="p-8 text-center text-sm text-gray-500">Aucune école.</p>}
    </section>

    @if(selected){<section class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
      <div class="flex flex-wrap items-start justify-between gap-3"><div><p class="text-xs font-semibold uppercase text-brand-500">Mise en service</p><h2 class="text-xl font-semibold text-gray-900 dark:text-white">{{selected.name}}</h2><p class="text-sm text-gray-500">1. Plan et abonnement · 2. Provisionnement · 3. Activation</p></div><button (click)="refreshDetails()" [disabled]="detailsLoading" class="rounded-lg border px-3 py-2 text-sm dark:border-gray-700 dark:text-gray-200">{{detailsLoading?'Actualisation…':'Actualiser'}}</button></div>

      <div class="mt-5 grid gap-5 lg:grid-cols-2">
        <div class="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
          <h3 class="font-semibold text-gray-900 dark:text-white">1. Plan tarifaire</h3>
          @if(currentSubscription){<div class="mt-3 rounded-lg bg-success-50 p-3 text-sm text-success-700 dark:bg-success-500/10 dark:text-success-300"><strong>Abonnement {{currentSubscription.status}}</strong><br>Plan : {{planName(currentSubscription.planId)}} · depuis le {{currentSubscription.startsAt|date:'dd/MM/yyyy'}}</div>}
          @else {<div class="mt-3 space-y-3"><label class="block text-sm font-medium dark:text-gray-300">Plan à attribuer</label><select [(ngModel)]="selectedPlanId" class="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-3 dark:border-gray-700 dark:bg-gray-900 dark:text-white"><option value="">Choisir un plan</option><option *ngFor="let plan of plans" [value]="plan.id">{{plan.name}} — {{plan.monthlyPrice|number:'1.0-0'}} {{plan.currency}}/mois</option></select>
          <button (click)="createSubscription()" [disabled]="!selectedPlanId||actionLoading" class="w-full rounded-lg bg-brand-500 px-4 py-2.5 text-white disabled:opacity-50">Créer l'abonnement</button></div>}
        </div>

        <div class="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
          <h3 class="font-semibold text-gray-900 dark:text-white">2. Base de données de l'école</h3>
          @if(latestJob){<div class="mt-3"><div class="flex items-center justify-between text-sm"><span class="font-medium dark:text-gray-200">{{jobLabel(latestJob.status)}}</span><span class="text-gray-500">Tentative {{latestJob.attemptCount}}</span></div><div class="mt-2 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800"><div class="h-full rounded-full bg-brand-500 transition-all" [style.width.%]="jobProgress(latestJob.status)"></div></div>
          @if(latestJob.errorMessage){<p class="mt-3 rounded-lg bg-error-50 p-3 text-sm text-error-700 dark:bg-error-500/10 dark:text-error-300">{{latestJob.errorMessage}}</p>}</div>}
          @else {<p class="mt-3 text-sm text-gray-500">Aucun provisionnement lancé.</p>}
          <button (click)="provision()" [disabled]="!currentSubscription||actionLoading||isRunning()" class="mt-4 w-full rounded-lg bg-brand-500 px-4 py-2.5 text-white disabled:cursor-not-allowed disabled:opacity-50">{{provisionButtonLabel()}}</button>
          @if(!currentSubscription){<p class="mt-2 text-xs text-warning-600">Créez d'abord un abonnement.</p>}
        </div>
      </div>
    </section>}
  </div>

  <app-modal [isOpen]="!!rejectTenant" (close)="closeRejectModal()" className="max-w-lg p-0">
    <div class="p-6 sm:p-8">
      <div class="flex h-12 w-12 items-center justify-center rounded-full bg-error-50 text-xl font-bold text-error-600 dark:bg-error-500/10">!</div>
      <h2 class="mt-5 text-2xl font-semibold text-gray-900 dark:text-white">Rejeter la demande</h2>
      <p class="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
        Indiquez clairement pourquoi la demande de <strong class="text-gray-700 dark:text-gray-200">{{rejectTenant?.name}}</strong> ne peut pas être validée. Ce motif sera envoyé au fondateur.
      </p>
      <label class="mt-6 block">
        <span class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Motif du rejet *</span>
        <textarea [(ngModel)]="rejectionReason" rows="4" maxlength="500" autofocus
          placeholder="Ex. Les informations légales de l’établissement doivent être complétées…"
          class="w-full rounded-xl border border-gray-300 bg-transparent px-3.5 py-3 text-sm text-gray-900 outline-none focus:border-error-400 focus:ring-3 focus:ring-error-500/10 dark:border-gray-700 dark:text-white"></textarea>
        <span class="mt-1 block text-right text-xs text-gray-400">{{rejectionReason.length}} / 500</span>
      </label>
      <div class="mt-7 flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 dark:border-gray-800 sm:flex-row sm:justify-end">
        <button type="button" (click)="closeRejectModal()" [disabled]="!!reviewLoadingId" class="h-11 rounded-xl border border-gray-300 px-5 text-sm font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-300">Annuler</button>
        <button type="button" (click)="confirmReject()" [disabled]="!rejectionReason.trim() || !!reviewLoadingId" class="h-11 rounded-xl bg-error-600 px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{{reviewLoadingId ? 'Envoi…' : 'Rejeter et notifier'}}</button>
      </div>
    </div>
  </app-modal>`
})
export class SaasSchoolsComponent implements OnInit, OnDestroy {
  tenants: Tenant[]=[]; plans:SaaSPlan[]=[]; subscriptions:Subscription[]=[]; jobs:ProvisioningJob[]=[];
  selected:Tenant|null=null; selectedPlanId=''; loading=true; detailsLoading=false; saving=false; actionLoading=false; showForm=false; error=''; invitationLoadingId:string|null=null;reviewLoadingId:string|null=null;rejectTenant:Tenant|null=null;rejectionReason='';
  draft: Partial<Tenant>={code:'',name:'',email:''}; private pollId?:ReturnType<typeof setInterval>;
  constructor(private api:SaasService, public context:TenantContextService, private toast:ToastService, private router:Router){}
  ngOnInit(){this.load();this.api.plans().subscribe({next:v=>this.plans=v,error:()=>{}});}
  ngOnDestroy(){this.stopPolling();}
  get currentSubscription(){return this.subscriptions.find(s=>s.status==='ACTIVE'||s.status==='TRIAL')||this.subscriptions[0]||null;}
  get latestJob(){return this.jobs[0]||null;}
  get pendingCount(){return this.tenants.filter(t=>t.status==='PENDING_REVIEW').length;}
  load(){this.loading=true;this.api.tenants().subscribe({next:v=>{this.tenants=v;this.loading=false},error:e=>{this.notifyError(e,'Chargement impossible.','Chargement impossible');this.loading=false}})}
  create(){if(!this.draft.code?.trim()||!this.draft.name?.trim()||!this.draft.email?.trim()){this.toast.warning('Renseignez le code, le nom et l’adresse e-mail de l’école.','Formulaire incomplet');return;}this.saving=true;this.error='';this.api.createTenant(this.draft).subscribe({next:t=>{this.tenants=[t,...this.tenants];this.draft={code:'',name:'',email:''};this.showForm=false;this.saving=false;this.toast.success(`L’école « ${t.name} » a été créée.`,'École créée');this.selectTenant(t)},error:e=>{this.notifyError(e,'Création impossible.','Création impossible');this.saving=false}})}
  selectTenant(t:Tenant){this.selected=t;this.selectedPlanId='';this.stopPolling();this.refreshDetails();}
  administer(t:Tenant){this.context.select(t);this.router.navigateByUrl('/app');}
  sendInvitation(t:Tenant){this.invitationLoadingId=t.id;this.api.sendAdministratorInvitation(t.id).subscribe({next:()=>{this.invitationLoadingId=null;this.toast.success(`Un lien de réinitialisation a été envoyé à ${t.email}.`,'Invitation envoyée')},error:e=>{this.invitationLoadingId=null;this.notifyError(e,'Invitation impossible.','Invitation non envoyée')}})}
  approve(t:Tenant){this.reviewLoadingId=t.id;this.api.approveSchool(t.id).subscribe({next:j=>{this.reviewLoadingId=null;this.toast.success(`L’activation de « ${t.name} » est lancée.`,'École approuvée');this.load();this.selectTenant({...t,status:'PROVISIONING'});this.jobs=[j];this.managePolling()},error:e=>{this.reviewLoadingId=null;this.notifyError(e,'Validation impossible.','École non activée')}})}
  reject(t:Tenant){this.rejectTenant=t;this.rejectionReason='';}
  closeRejectModal(){if(!this.reviewLoadingId){this.rejectTenant=null;this.rejectionReason='';}}
  confirmReject(){const tenant=this.rejectTenant,reason=this.rejectionReason.trim();if(!tenant||!reason)return;this.reviewLoadingId=tenant.id;this.api.rejectSchool(tenant.id,reason).subscribe({next:updated=>{this.reviewLoadingId=null;this.rejectTenant=null;this.rejectionReason='';this.tenants=this.tenants.map(x=>x.id===updated.id?updated:x);this.toast.info(`La demande de « ${tenant.name} » a été rejetée et le fondateur a été notifié.`,'Demande traitée')},error:e=>{this.reviewLoadingId=null;this.notifyError(e,'Rejet impossible.','Action impossible')}})}
  refreshDetails(){if(!this.selected)return;this.detailsLoading=true;const id=this.selected.id;let pending=2;const done=()=>{if(--pending===0){this.detailsLoading=false;this.syncTenant();}};this.api.subscriptions(id).subscribe({next:v=>{this.subscriptions=v;done()},error:e=>{this.notifyError(e,'Abonnements indisponibles.','Chargement impossible');done()}});this.api.provisioningJobs(id).subscribe({next:v=>{this.jobs=v;done();this.managePolling()},error:e=>{this.notifyError(e,'Historique indisponible.','Chargement impossible');done()}})}
  createSubscription(){if(!this.selected||!this.selectedPlanId)return;this.actionLoading=true;this.error='';this.api.subscribe({tenantId:this.selected.id,planId:this.selectedPlanId,status:'ACTIVE',startsAt:new Date().toISOString()}).subscribe({next:s=>{this.subscriptions=[s,...this.subscriptions];this.actionLoading=false;this.toast.success('L’abonnement de l’école est actif.','Abonnement créé')},error:e=>{this.notifyError(e,'Création de l’abonnement impossible.','Création impossible');this.actionLoading=false}})}
  provision(){if(!this.selected||!this.currentSubscription)return;this.actionLoading=true;this.error='';this.api.provision(this.selected.id).subscribe({next:j=>{this.jobs=[j,...this.jobs.filter(x=>x.id!==j.id)];this.actionLoading=false;this.toast.info('Le provisionnement de la base a démarré.','Provisionnement lancé');this.managePolling();this.load()},error:e=>{this.notifyError(e,'Provisionnement impossible.','Provisionnement impossible');this.actionLoading=false;this.refreshDetails()}})}
  isRunning(){return !!this.latestJob&&!['ACTIVE','FAILED'].includes(this.latestJob.status);}
  managePolling(){if(this.isRunning()&&!this.pollId)this.pollId=setInterval(()=>this.refreshDetails(),3000);else if(!this.isRunning())this.stopPolling();}
  stopPolling(){if(this.pollId){clearInterval(this.pollId);this.pollId=undefined;}}
  syncTenant(){const updated=this.tenants.find(t=>t.id===this.selected?.id);if(updated)this.selected=updated;}
  planName(id:string){return this.plans.find(p=>p.id===id)?.name||id;}
  jobProgress(s:ProvisioningJob['status']){return {PENDING:5,DB_CREATING:25,MIGRATING:55,SEEDING:80,ACTIVE:100,FAILED:100}[s];}
  jobLabel(s:ProvisioningJob['status']){return {PENDING:'En attente',DB_CREATING:'Création de la base',MIGRATING:'Application des migrations',SEEDING:'Initialisation des données',ACTIVE:'École active',FAILED:'Échec du provisionnement'}[s];}
  statusLabel(s:Tenant['status']){return {DRAFT:'Brouillon',PENDING_REVIEW:'En attente',PROVISIONING:'Provisionnement',ACTIVE:'Active',SUSPENDED:'Suspendue',REJECTED:'Rejetée',FAILED:'Échec'}[s];}
  statusClass(s:Tenant['status']){return s==='ACTIVE'?'bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-300':s==='FAILED'||s==='REJECTED'?'bg-error-50 text-error-700 dark:bg-error-500/10 dark:text-error-300':s==='PENDING_REVIEW'?'bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-300':s==='PROVISIONING'?'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300':'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';}
  provisionButtonLabel(){if(this.actionLoading)return 'Traitement…';if(this.isRunning())return 'Provisionnement en cours…';if(this.latestJob?.status==='ACTIVE')return 'Provisionnement terminé';if(this.latestJob?.status==='FAILED')return 'Relancer le provisionnement';return 'Créer et initialiser la base';}
  private message(e:any,fallback:string){return e?.error?.message||e?.error?.details||fallback;}
  private notifyError(e:any,fallback:string,title:string){const detail=e?.error?.errors?.[0]?.detail||this.message(e,fallback);this.error='';this.toast.error(detail,title);}
}
