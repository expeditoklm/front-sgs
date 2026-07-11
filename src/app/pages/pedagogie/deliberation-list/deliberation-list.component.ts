import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PageBreadcrumbComponent } from '../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { ComponentCardComponent } from '../../../shared/components/common/component-card/component-card.component';
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';
import { ModalComponent } from '../../../shared/components/ui/modal/modal.component';
import { LabelComponent } from '../../../shared/components/form/label/label.component';
import { SelectComponent } from '../../../shared/components/form/select/select.component';
import { CheckboxComponent } from '../../../shared/components/form/input/checkbox.component';
import { BadgeComponent } from '../../../shared/components/ui/badge/badge.component';
import { ConfirmDialogComponent } from '../../../shared/components/referentiel/confirm-dialog/confirm-dialog.component';
import { PedagogieService } from '../../../core/services/pedagogie.service';
import { ReferentielCrudService } from '../../../core/services/referentiel-crud.service';
import { ToastService } from '../../../core/services/toast.service';
import { MetaResponse } from '../../../core/models/audit.models';
import { SelectOption } from '../../../core/models/referentiel-crud.models';
import { FilterCriteria } from '../../../core/models/inscription.models';
import { Deliberation, DeliberationRequest, STATUT_DELIBERATION_LABELS, StatutDeliberation } from '../../../core/models/pedagogie.models';

function emptyDeliberationRequest(): Partial<DeliberationRequest> {
  return { periodeId: null, presidentId: null };
}

@Component({
  selector: 'app-deliberation-list',
  imports: [
    PageBreadcrumbComponent,
    ComponentCardComponent,
    ButtonComponent,
    ModalComponent,
    LabelComponent,
    SelectComponent,
    CheckboxComponent,
    BadgeComponent,
    ConfirmDialogComponent
  ],
  templateUrl: './deliberation-list.component.html'
})
export class DeliberationListComponent implements OnInit {
  rows: Deliberation[] = [];
  meta: MetaResponse | null = null;
  page = 1;
  loading = false;
  listError = '';

  classeFilter = '';
  statutFilter = '';

  classeOptions: SelectOption[] = [];
  periodeOptions: SelectOption[] = [];
  presidentOptions: SelectOption[] = [];
  classeLabels: Record<number, string> = {};
  periodeLabels: Record<number, string> = {};

  readonly statutLabels = STATUT_DELIBERATION_LABELS;
  readonly statutOptions: SelectOption[] = Object.entries(STATUT_DELIBERATION_LABELS).map(([value, label]) => ({ value, label }));

  isFormOpen = false;
  formModel: Partial<DeliberationRequest> = emptyDeliberationRequest();
  finDAnnee = false;
  formError = '';
  saving = false;

  isConfirmClotureOpen = false;
  rowPendingCloture: Deliberation | null = null;
  clotureError = '';
  cloturing = false;

  ouvrantUuid: string | null = null;

  constructor(
    private router: Router,
    private pedagogieService: PedagogieService,
    private referentielCrudService: ReferentielCrudService,
    private toastService: ToastService
  ) {
  }

  ngOnInit(): void {
    this.load();
    this.loadReferentielOptions();
  }

  private loadReferentielOptions(): void {
    this.referentielCrudService
      .list('classes', { page: 1, size: 200, sortField: 'id', sortOrder: 'ASC', filter: '' })
      .subscribe({
        next: (page) => {
          this.classeOptions = page.content.map((item) => ({ value: String(item['id']), label: `${item['libelle']} (${item['anneeScolaireCode']})` }));
          this.classeLabels = Object.fromEntries(page.content.map((item) => [item['id'], item['libelle']]));
        },
        error: () => (this.classeOptions = [])
      });
    this.referentielCrudService
      .list('periodes', { page: 1, size: 200, sortField: 'ordre', sortOrder: 'ASC', filter: '' })
      .subscribe({
        next: (page) => {
          this.periodeOptions = page.content.map((item) => ({ value: String(item['id']), label: `${item['libelle']} (${item['anneeScolaireCode']})` }));
          this.periodeLabels = Object.fromEntries(page.content.map((item) => [item['id'], item['libelle']]));
        },
        error: () => (this.periodeOptions = [])
      });
    this.referentielCrudService
      .list('utilisateurs', { page: 1, size: 200, sortField: 'id', sortOrder: 'ASC', filter: '' })
      .subscribe({
        next: (page) => (this.presidentOptions = page.content.map((item) => ({ value: String(item['id']), label: `${item['firstName']} ${item['lastName']}` }))),
        error: () => (this.presidentOptions = [])
      });
  }

  private buildFilters(): FilterCriteria[] {
    const filters: FilterCriteria[] = [];
    if (this.classeFilter) filters.push({ field: 'classeId', condition: 'eq', value: +this.classeFilter });
    if (this.statutFilter) filters.push({ field: 'statut', condition: 'eq', value: this.statutFilter });
    return filters;
  }

  load(): void {
    this.loading = true;
    this.listError = '';
    this.pedagogieService
      .filterDeliberations(this.buildFilters(), { page: this.page, size: 10, sortField: 'id', sortOrder: 'DESC', filter: '' })
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
          this.listError = 'Impossible de charger les délibérations.';
          this.toastService.error(err?.error?.message || this.listError, 'Chargement impossible');
        }
      });
  }

  search(): void {
    this.page = 1;
    this.load();
  }

  resetFilters(): void {
    this.classeFilter = '';
    this.statutFilter = '';
    this.search();
  }

  goToPage(page: number): void {
    if (page < 1 || (this.meta && page > this.meta.totalPages)) {
      return;
    }
    this.page = page;
    this.load();
  }

  classeLabel(classeId: number): string {
    return this.classeLabels[classeId] ?? `#${classeId}`;
  }

  periodeLabel(periodeId: number | null): string {
    if (periodeId == null) return "Fin d'année";
    return this.periodeLabels[periodeId] ?? `#${periodeId}`;
  }

  badgeColor(statut: StatutDeliberation): 'success' | 'warning' | 'light' {
    if (statut === 'CLOTUREE') return 'success';
    if (statut === 'EN_COURS') return 'warning';
    return 'light';
  }

  openCreate(): void {
    this.formModel = emptyDeliberationRequest();
    this.finDAnnee = false;
    this.formError = '';
    this.isFormOpen = true;
  }

  closeForm(): void {
    this.isFormOpen = false;
  }

  updateField(key: keyof DeliberationRequest, value: unknown): void {
    this.formModel = { ...this.formModel, [key]: value };
  }

  toggleFinDAnnee(checked: boolean): void {
    this.finDAnnee = checked;
    if (checked) {
      this.updateField('periodeId', null);
    }
  }

  save(): void {
    const { classeId, presidentId } = this.formModel;
    if (!classeId || (!this.finDAnnee && !this.formModel.periodeId)) {
      this.formError = 'Classe et période sont obligatoires (sauf délibération de fin d\'année).';
      return;
    }

    this.saving = true;
    this.formError = '';
    const payload: DeliberationRequest = {
      classeId: +classeId,
      periodeId: this.finDAnnee ? null : +(this.formModel.periodeId as number),
      presidentId: presidentId ? +presidentId : null
    };

    this.pedagogieService.creerDeliberation(payload).subscribe({
      next: () => {
        this.saving = false;
        this.isFormOpen = false;
        this.toastService.success('Délibération créée avec succès.');
        this.load();
      },
      error: (err) => {
        this.saving = false;
        this.formError = err?.error?.message || "Une erreur est survenue lors de l'enregistrement.";
        this.toastService.error(this.formError, "Échec de l'enregistrement");
      }
    });
  }

  canOuvrir(row: Deliberation): boolean {
    return row.statut === 'PLANIFIEE';
  }

  canCloturer(row: Deliberation): boolean {
    return row.statut === 'EN_COURS';
  }

  ouvrir(row: Deliberation): void {
    this.ouvrantUuid = row.uuid;
    this.pedagogieService.ouvrirDeliberation(row.uuid).subscribe({
      next: () => {
        this.ouvrantUuid = null;
        this.toastService.success('Délibération ouverte avec succès.');
        this.load();
      },
      error: (err) => {
        this.ouvrantUuid = null;
        this.toastService.error(err?.error?.message || "Échec de l'ouverture.", "Échec de l'opération");
      }
    });
  }

  askCloturer(row: Deliberation): void {
    this.rowPendingCloture = row;
    this.clotureError = '';
    this.isConfirmClotureOpen = true;
  }

  cancelCloture(): void {
    this.isConfirmClotureOpen = false;
    this.rowPendingCloture = null;
  }

  confirmCloture(): void {
    if (!this.rowPendingCloture) return;
    this.cloturing = true;
    this.clotureError = '';
    this.pedagogieService.cloturerDeliberation(this.rowPendingCloture.uuid).subscribe({
      next: () => {
        this.cloturing = false;
        this.isConfirmClotureOpen = false;
        this.rowPendingCloture = null;
        this.toastService.success('Délibération clôturée avec succès.');
        this.load();
      },
      error: (err) => {
        this.cloturing = false;
        this.clotureError = err?.error?.message || 'Échec de la clôture.';
        this.toastService.error(this.clotureError, "Échec de l'opération");
      }
    });
  }

  ouvrirDetail(row: Deliberation): void {
    this.router.navigate(['/pedagogie/deliberations', row.uuid]);
  }
}
