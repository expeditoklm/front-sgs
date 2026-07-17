import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PageBreadcrumbComponent } from '../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { ComponentCardComponent } from '../../../shared/components/common/component-card/component-card.component';
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';
import { ModalComponent } from '../../../shared/components/ui/modal/modal.component';
import { LabelComponent } from '../../../shared/components/form/label/label.component';
import { SelectComponent } from '../../../shared/components/form/select/select.component';
import { InputFieldComponent } from '../../../shared/components/form/input/input-field.component';
import { BadgeComponent } from '../../../shared/components/ui/badge/badge.component';
import { PaginationComponent } from '../../../shared/components/ui/pagination/pagination.component';
import { InscriptionService } from '../../../core/services/inscription.service';
import { ReferentielCrudService } from '../../../core/services/referentiel-crud.service';
import { AuthenticationService } from '../../../core/services/authentication.service';
import { ToastService } from '../../../core/services/toast.service';
import { MetaResponse } from '../../../core/models/audit.models';
import { SelectOption } from '../../../core/models/referentiel-crud.models';
import {
  FilterCriteria,
  Inscription,
  STATUT_INSCRIPTION_LABELS,
  StatutInscription,
  TYPE_INSCRIPTION_LABELS,
  TypeInscription
} from '../../../core/models/inscription.models';

// Cible de transition demandée depuis une ligne du tableau - certaines cibles exigent un motif
// (cf. InscriptionWorkflowService.MOTIF_OBLIGATOIRE côté backend : REJETEE/ANNULEE).
const CIBLES_AVEC_MOTIF: StatutInscription[] = ['REJETEE', 'ANNULEE'];

@Component({
  selector: 'app-inscription-suivi',
  imports: [
    PageBreadcrumbComponent,
    ComponentCardComponent,
    ButtonComponent,
    ModalComponent,
    LabelComponent,
    SelectComponent,
    InputFieldComponent,
    BadgeComponent,
    PaginationComponent
  ],
  templateUrl: './inscription-suivi.component.html'
})
export class InscriptionSuiviComponent implements OnInit {
  rows: Inscription[] = [];
  meta: MetaResponse | null = null;
  page = 1;
  pageSize = 10;
  loading = false;
  listError = '';

  statutFilter = '';
  typeFilter = '';
  classeFilter = '';
  anneeScolaireFilter = '';

  classeLabels: Record<number, string> = {};
  classeOptions: SelectOption[] = [];
  anneeScolaireOptions: SelectOption[] = [];

  readonly statutLabels = STATUT_INSCRIPTION_LABELS;
  typeLabels: Record<string, string> = { ...TYPE_INSCRIPTION_LABELS };
  readonly statutOptions: SelectOption[] = Object.entries(STATUT_INSCRIPTION_LABELS).map(([value, label]) => ({ value, label }));
  typeOptions: SelectOption[] = [];

  isMotifOpen = false;
  motifValue = '';
  motifError = '';
  applyingTransition = false;
  private pendingTransition: { inscription: Inscription; cible: StatutInscription } | null = null;

  constructor(
    private router: Router,
    private inscriptionService: InscriptionService,
    private referentielCrudService: ReferentielCrudService,
    public authService: AuthenticationService,
    private toastService: ToastService
  ) {
  }

  ngOnInit(): void {
    this.load();
    this.loadReferentielOptions();
  }

  private loadReferentielOptions(): void {
    this.referentielCrudService.businessParameterOptions('TYPE_INSCRIPTION').subscribe({
      next: (items) => {
        this.typeOptions = items.map((item) => ({ value: item.code, label: item.libelle }));
        this.typeLabels = Object.fromEntries(items.map((item) => [item.code, item.libelle]));
      },
      error: () => {
        this.typeOptions = Object.entries(TYPE_INSCRIPTION_LABELS).map(([value, label]) => ({ value, label }));
      }
    });
    this.referentielCrudService
      .list('classes', { page: 1, size: 200, sortField: 'id', sortOrder: 'ASC', filter: '' })
      .subscribe({
        next: (page) => {
          this.classeOptions = page.content.map((item) => ({ value: String(item['id']), label: String(item['libelle']) }));
          this.classeLabels = Object.fromEntries(page.content.map((item) => [item['id'], item['libelle']]));
        },
        error: () => (this.classeOptions = [])
      });
    this.referentielCrudService
      .list('annees-scolaires', { page: 1, size: 200, sortField: 'id', sortOrder: 'DESC', filter: '' })
      .subscribe({
        next: (page) => (this.anneeScolaireOptions = page.content.map((item) => ({ value: String(item['id']), label: String(item['code']) }))),
        error: () => (this.anneeScolaireOptions = [])
      });
  }

  private buildFilters(): FilterCriteria[] {
    const filters: FilterCriteria[] = [];
    if (this.statutFilter) filters.push({ field: 'statut', condition: 'eq', value: this.statutFilter });
    if (this.typeFilter) filters.push({ field: 'type', condition: 'eq', value: this.typeFilter });
    if (this.classeFilter) filters.push({ field: 'classeId', condition: 'eq', value: +this.classeFilter });
    if (this.anneeScolaireFilter) filters.push({ field: 'anneeScolaireId', condition: 'eq', value: +this.anneeScolaireFilter });
    return filters;
  }

  load(): void {
    this.loading = true;
    this.listError = '';
    this.inscriptionService
      .filterInscriptions(this.buildFilters(), { page: this.page, size: this.pageSize, sortField: 'id', sortOrder: 'DESC', filter: '' })
      .subscribe({
        next: (result) => {
          this.rows = result.content;
          this.meta = result.meta;
          this.loading = false;
        },
        error: (err) => {
          this.rows = [];
          this.meta = null;
          this.loading = false;
          this.listError = 'Impossible de charger les inscriptions.';
          this.toastService.error(err?.error?.message || this.listError, 'Chargement impossible');
        }
      });
  }

  search(): void {
    this.page = 1;
    this.load();
  }

  resetFilters(): void {
    this.statutFilter = '';
    this.typeFilter = '';
    this.classeFilter = '';
    this.anneeScolaireFilter = '';
    this.search();
  }

  goToPage(page: number): void {
    if (page < 1 || (this.meta && page > this.meta.totalPages)) {
      return;
    }
    this.page = page;
    this.load();
  }

  changePageSize(pageSize: number): void {
    this.pageSize = pageSize;
    this.page = 1;
    this.load();
  }

  classeLabel(classeId: number): string {
    return this.classeLabels[classeId] ?? `#${classeId}`;
  }

  openDossier(row: Inscription, action?: 'transfert'): void {
    this.router.navigate(['/inscriptions/eleves', row.eleveUuid], {
      queryParams: {
        inscription: row.uuid,
        action: action ?? null
      }
    });
  }

  badgeColor(statut: StatutInscription): 'success' | 'error' | 'warning' | 'light' {
    if (statut === 'VALIDEE') return 'success';
    if (statut === 'REJETEE' || statut === 'ANNULEE') return 'error';
    if (statut === 'EN_ATTENTE') return 'warning';
    return 'light';
  }

  // Boutons affichés selon le statut courant ET le rôle - reflète exactement
  // InscriptionWorkflowService.TRANSITIONS_AUTORISEES + verifierAutorisationRole côté backend :
  // SEC ne peut viser que EN_ATTENTE (soumission), le reste est réservé à SADM/ADM.
  canSubmit(row: Inscription): boolean {
    return row.statut === 'NOUVELLE' && this.authService.hasAnyRole(['SEC', 'SADM', 'ADM']);
  }

  canValidateOrReject(row: Inscription): boolean {
    return row.statut === 'EN_ATTENTE' && this.authService.hasAnyRole(['SADM', 'ADM']);
  }

  canCancel(row: Inscription): boolean {
    return row.statut === 'VALIDEE' && this.authService.hasAnyRole(['SADM', 'ADM']);
  }

  canTransfer(row: Inscription): boolean {
    return row.statut === 'VALIDEE' && this.authService.hasAnyRole(['SADM', 'ADM']);
  }

  canCorrect(row: Inscription): boolean {
    return row.statut === 'REJETEE' && this.authService.hasAnyRole(['SEC', 'SADM', 'ADM']);
  }

  isCorrectedAndResubmitted(row: Inscription): boolean {
    return row.statut === 'EN_ATTENTE' && row.statutPrecedentDerniereTransition === 'REJETEE';
  }

  formatDateTime(value: string | null | undefined): string {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(date);
  }

  applyTransition(row: Inscription, cible: StatutInscription): void {
    if (CIBLES_AVEC_MOTIF.includes(cible)) {
      this.pendingTransition = { inscription: row, cible };
      this.motifValue = '';
      this.motifError = '';
      this.isMotifOpen = true;
      return;
    }
    this.executeTransition(row, cible);
  }

  closeMotifModal(): void {
    this.isMotifOpen = false;
    this.pendingTransition = null;
  }

  confirmMotifTransition(): void {
    if (!this.pendingTransition) return;
    if (!this.motifValue.trim()) {
      this.motifError = 'Le motif est obligatoire pour cette transition.';
      return;
    }
    this.executeTransition(this.pendingTransition.inscription, this.pendingTransition.cible, this.motifValue);
    this.isMotifOpen = false;
    this.pendingTransition = null;
  }

  private executeTransition(row: Inscription, cible: StatutInscription, motif?: string): void {
    this.applyingTransition = true;
    this.inscriptionService.transition(row.uuid, cible, motif).subscribe({
      next: () => {
        this.applyingTransition = false;
        this.toastService.success('Transition appliquée avec succès.');
        this.load();
      },
      error: (err) => {
        this.applyingTransition = false;
        this.toastService.error(err?.error?.message || 'Échec de la transition.', "Échec de l'opération");
      }
    });
  }
}
