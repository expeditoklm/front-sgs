import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { SaaSPlan } from '../../../core/models/saas.models';
import { SaasService } from '../../../core/services/saas.service';
import { ToastService } from '../../../core/services/toast.service';
import { ModalComponent } from '../../../shared/components/ui/modal/modal.component';

@Component({
  selector: 'app-saas-plans',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  host: { class: 'sgs-dark-view block' },
  template: `
    <div class="mx-auto max-w-7xl space-y-6">
      <header class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p class="text-sm font-semibold text-brand-500">Console SaaS</p>
          <h1 class="mt-1 text-2xl font-bold text-gray-900 dark:text-white">Plans tarifaires</h1>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Configurez les offres, leurs tarifs et les limites proposées aux écoles.
          </p>
        </div>
        <button type="button" (click)="openForm()"
          class="inline-flex h-11 items-center gap-2 rounded-xl bg-brand-500 px-5 text-sm font-semibold text-white shadow-theme-xs transition hover:bg-brand-600">
          <span class="text-xl leading-none">+</span> Nouveau plan
        </button>
      </header>

      <section class="grid gap-4 sm:grid-cols-3">
        <div class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <p class="text-sm text-gray-500 dark:text-gray-400">Plans disponibles</p>
          <p class="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{{ plans.length }}</p>
        </div>
        <div class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <p class="text-sm text-gray-500 dark:text-gray-400">Plans actifs</p>
          <p class="mt-2 text-3xl font-bold text-success-600">{{ activeCount }}</p>
        </div>
        <div class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <p class="text-sm text-gray-500 dark:text-gray-400">Devise par défaut</p>
          <p class="mt-2 text-3xl font-bold text-gray-900 dark:text-white">FCFA</p>
        </div>
      </section>

      @if (loading) {
        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div *ngFor="let item of [1,2,3]" class="h-64 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800"></div>
        </div>
      } @else if (!plans.length) {
        <section class="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center dark:border-gray-700 dark:bg-white/[0.03]">
          <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-2xl text-brand-500 dark:bg-brand-500/10">₣</div>
          <h2 class="mt-4 text-lg font-semibold text-gray-900 dark:text-white">Aucun plan tarifaire</h2>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Créez votre première offre pour commencer à abonner des écoles.</p>
          <button type="button" (click)="openForm()" class="mt-5 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white">Créer un plan</button>
        </section>
      } @else {
        <section class="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <article *ngFor="let plan of plans"
            class="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-xs transition hover:-translate-y-0.5 hover:shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03]">
            <div class="absolute inset-x-0 top-0 h-1 bg-brand-500"></div>
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="text-xs font-bold uppercase tracking-wider text-brand-500">{{ plan.code }}</p>
                <h2 class="mt-1 text-xl font-bold text-gray-900 dark:text-white">{{ plan.name }}</h2>
              </div>
              <span class="rounded-full px-2.5 py-1 text-xs font-semibold"
                [ngClass]="plan.active ? 'bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'">
                {{ plan.active ? 'Actif' : 'Inactif' }}
              </span>
            </div>
            <p class="mt-3 min-h-10 text-sm text-gray-500 dark:text-gray-400">{{ plan.description || 'Offre SGS pour établissement scolaire.' }}</p>
            <div class="mt-5 border-y border-gray-100 py-5 dark:border-gray-800">
              <span class="text-3xl font-bold text-gray-900 dark:text-white">{{ plan.monthlyPrice | number:'1.0-0' }}</span>
              <span class="ml-1 text-sm text-gray-500 dark:text-gray-400">{{ plan.currency }}/mois</span>
            </div>
            <div class="mt-5 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <span class="text-brand-500">●</span>
              {{ plan.maxUsers ? (plan.maxUsers + ' utilisateurs maximum') : 'Utilisateurs illimités' }}
            </div>
            @if (plan.features.length) {
              <ul class="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li *ngFor="let feature of plan.features" class="flex gap-2"><span class="font-bold text-success-500">✓</span>{{ feature }}</li>
              </ul>
            }
            <button type="button" (click)="openEditForm(plan)"
              class="mt-5 inline-flex h-10 w-full items-center justify-center rounded-xl border border-brand-200 px-4 text-sm font-semibold text-brand-600 transition hover:bg-brand-50 dark:border-brand-500/30 dark:text-brand-300 dark:hover:bg-brand-500/10">
              Modifier le plan
            </button>
          </article>
        </section>
      }
    </div>

    <app-modal [isOpen]="showForm" (close)="closeForm()" className="max-w-2xl p-0">
      <form #planForm="ngForm" (ngSubmit)="save(planForm)" class="max-h-[90vh] overflow-y-auto p-6 sm:p-8">
        <div class="pr-12">
          <p class="text-xs font-bold uppercase tracking-wider text-brand-500">{{ editingPlanId ? 'Modification' : 'Nouvelle offre' }}</p>
          <h2 class="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{{ editingPlanId ? 'Modifier le plan tarifaire' : 'Créer un plan tarifaire' }}</h2>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Les champs marqués d’un astérisque sont obligatoires.</p>
        </div>

        <div class="mt-7 grid gap-5 sm:grid-cols-2">
          <label class="block">
            <span class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Code du plan *</span>
            <input [(ngModel)]="draft.code" (ngModelChange)="normalizeCode($event)" name="code"
              required minlength="2" maxlength="40" pattern="[A-Z0-9_]{2,40}"
              [readonly]="!!editingPlanId"
              placeholder="Ex. PREMIUM" class="h-11 w-full rounded-xl border border-gray-300 bg-transparent px-3.5 text-sm uppercase text-gray-900 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white">
            @if (planForm.submitted && planForm.controls['code']?.invalid) {
              <span class="mt-1 block text-xs text-error-500">Utilisez 2 à 40 lettres majuscules, chiffres ou caractères _.</span>
            }
            <span class="mt-1 block text-xs text-gray-400">Identifiant technique unique, sans espace.</span>
          </label>
          <label class="block">
            <span class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Nom commercial *</span>
            <input [(ngModel)]="draft.name" name="name" required maxlength="80"
              placeholder="Ex. Premium" class="h-11 w-full rounded-xl border border-gray-300 bg-transparent px-3.5 text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white">
            @if (planForm.submitted && planForm.controls['name']?.invalid) {
              <span class="mt-1 block text-xs text-error-500">Le nom du plan est obligatoire.</span>
            }
          </label>
          <label class="block">
            <span class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Prix mensuel *</span>
            <div class="relative">
              <input [(ngModel)]="draft.monthlyPrice" name="price" required type="number" min="0"
                class="h-11 w-full rounded-xl border border-gray-300 bg-transparent px-3.5 pr-20 text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white">
              <span class="absolute right-3 top-3 text-xs font-semibold text-gray-400">FCFA</span>
            </div>
          </label>
          <label class="block">
            <span class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre maximal d’utilisateurs *</span>
            <input [(ngModel)]="draft.maxUsers" name="users" required type="number" min="1"
              class="h-11 w-full rounded-xl border border-gray-300 bg-transparent px-3.5 text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white">
            <span class="mt-1 block text-xs text-gray-400">Comptes autorisés pour l’école.</span>
          </label>
        </div>
        <label class="mt-5 block">
          <span class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Description</span>
          <textarea [(ngModel)]="draft.description" name="description" rows="3" maxlength="300"
            placeholder="Décrivez brièvement à qui s’adresse cette offre…"
            class="w-full rounded-xl border border-gray-300 bg-transparent px-3.5 py-3 text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white"></textarea>
        </label>
        <label class="mt-5 flex items-center gap-3 rounded-xl border border-gray-200 p-4 dark:border-gray-700">
          <input [(ngModel)]="draft.active" name="active" type="checkbox"
            class="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500">
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Plan actif et disponible pour les abonnements</span>
        </label>
        <label class="mt-5 block">
          <span class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Fonctionnalités incluses</span>
          <textarea [(ngModel)]="featuresText" name="features" rows="3"
            placeholder="Une fonctionnalité par ligne"
            class="w-full rounded-xl border border-gray-300 bg-transparent px-3.5 py-3 text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white"></textarea>
          <span class="mt-1 block text-xs text-gray-400">Chaque ligne apparaîtra comme un avantage sur la carte du plan.</span>
        </label>

        <div class="mt-8 flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 dark:border-gray-800 sm:flex-row sm:justify-end">
          <button type="button" (click)="closeForm()" class="h-11 rounded-xl border border-gray-300 px-5 text-sm font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-300">Annuler</button>
          <button type="submit" [disabled]="saving" class="h-11 rounded-xl bg-brand-500 px-6 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
            {{ saving ? 'Enregistrement…' : (editingPlanId ? 'Enregistrer les modifications' : 'Créer le plan') }}
          </button>
        </div>
      </form>
    </app-modal>
  `
})
export class SaasPlansComponent implements OnInit {
  plans: SaaSPlan[] = [];
  loading = true;
  saving = false;
  showForm = false;
  editingPlanId: string | null = null;
  featuresText = '';
  draft: Partial<SaaSPlan> = this.emptyDraft();

  constructor(
    private api: SaasService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  get activeCount(): number {
    return this.plans.filter((plan) => plan.active).length;
  }

  openForm(): void {
    this.editingPlanId = null;
    this.draft = this.emptyDraft();
    this.featuresText = '';
    this.showForm = true;
  }

  openEditForm(plan: SaaSPlan): void {
    this.editingPlanId = plan.id || plan.uuid;
    this.draft = { ...plan, features: [...(plan.features ?? [])] };
    this.featuresText = (plan.features ?? []).join('\n');
    this.showForm = true;
  }

  closeForm(): void {
    if (!this.saving) this.showForm = false;
  }

  save(form: NgForm): void {
    this.draft.code = this.cleanCode(this.draft.code);
    if (form.invalid) {
      form.control.markAllAsTouched();
      this.toast.warning('Veuillez renseigner correctement tous les champs obligatoires.', 'Formulaire incomplet');
      return;
    }
    this.saving = true;
    this.draft.features = this.featuresText.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
    const request = this.editingPlanId
      ? this.api.updatePlan(this.editingPlanId, this.draft)
      : this.api.createPlan(this.draft);
    request.subscribe({
      next: (plan) => {
        const wasEditing = !!this.editingPlanId;
        this.plans = wasEditing
          ? this.plans.map((item) => (item.id === plan.id || item.uuid === plan.uuid) ? plan : item)
          : [plan, ...this.plans];
        this.saving = false;
        this.showForm = false;
        this.editingPlanId = null;
        this.toast.success(
          `Le plan « ${plan.name} » a été ${wasEditing ? 'modifié' : 'créé'}.`,
          wasEditing ? 'Plan modifié' : 'Plan créé'
        );
      },
      error: (error) => {
        this.saving = false;
        const wasEditing = !!this.editingPlanId;
        this.toast.error(
          this.errorMessage(error, `La ${wasEditing ? 'modification' : 'création'} du plan a échoué.`),
          wasEditing ? 'Modification impossible' : 'Création impossible'
        );
      }
    });
  }

  normalizeCode(value: string): void {
    this.draft.code = this.cleanCode(value);
  }

  private load(): void {
    this.loading = true;
    this.api.plans().subscribe({
      next: (plans) => {
        this.plans = plans;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.toast.error(this.errorMessage(error, 'Impossible de charger les plans tarifaires.'), 'Chargement impossible');
      }
    });
  }

  private emptyDraft(): Partial<SaaSPlan> {
    return { code: '', name: '', description: '', monthlyPrice: 0, currency: 'XOF', maxUsers: 50, active: true, features: [] };
  }

  private cleanCode(value: string | undefined): string {
    return (value ?? '')
      .toUpperCase()
      .replace(/[\s-]+/g, '_')
      .replace(/[^A-Z0-9_]/g, '')
      .replace(/^_+|_+$/g, '');
  }

  private errorMessage(error: any, fallback: string): string {
    return error?.error?.errors?.[0]?.detail
      || error?.error?.message
      || error?.error?.details
      || error?.message
      || fallback;
  }
}
