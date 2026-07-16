import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PageBreadcrumbComponent } from '../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { ComponentCardComponent } from '../../../shared/components/common/component-card/component-card.component';
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';
import { ModalComponent } from '../../../shared/components/ui/modal/modal.component';
import { InputFieldComponent } from '../../../shared/components/form/input/input-field.component';
import { LabelComponent } from '../../../shared/components/form/label/label.component';
import { SelectComponent } from '../../../shared/components/form/select/select.component';
import { BadgeComponent } from '../../../shared/components/ui/badge/badge.component';
import { ConfirmDialogComponent } from '../../../shared/components/referentiel/confirm-dialog/confirm-dialog.component';
import { PaginationComponent } from '../../../shared/components/ui/pagination/pagination.component';
import { PedagogieService } from '../../../core/services/pedagogie.service';
import { ReferentielCrudService } from '../../../core/services/referentiel-crud.service';
import { AuthenticationService } from '../../../core/services/authentication.service';
import { ToastService } from '../../../core/services/toast.service';
import { MetaResponse } from '../../../core/models/audit.models';
import { SelectOption } from '../../../core/models/referentiel-crud.models';
import { FilterCriteria } from '../../../core/models/inscription.models';
import {
  Evaluation,
  EvaluationRequest,
  STATUT_EVALUATION_LABELS,
  TYPE_EVALUATION_LABELS,
  TypeEvaluation
} from '../../../core/models/pedagogie.models';

function emptyEvaluationRequest(): Partial<EvaluationRequest> {
  return { type: 'DEVOIR' as TypeEvaluation, coefficient: 1, bareme: 20 };
}

@Component({
  selector: 'app-evaluation-list',
  imports: [
    PageBreadcrumbComponent,
    ComponentCardComponent,
    ButtonComponent,
    ModalComponent,
    InputFieldComponent,
    LabelComponent,
    SelectComponent,
    BadgeComponent,
    ConfirmDialogComponent,
    PaginationComponent
  ],
  templateUrl: './evaluation-list.component.html',
  host: { class: 'sgs-dark-view block' }
})
export class EvaluationListComponent implements OnInit {
  rows: Evaluation[] = [];
  meta: MetaResponse | null = null;
  page = 1;
  pageSize = 10;
  loading = false;
  listError = '';

  classeFilter = '';
  matiereFilter = '';
  periodeFilter = '';
  statutFilter = '';

  classeOptions: SelectOption[] = [];
  matiereOptions: SelectOption[] = [];
  periodeOptions: SelectOption[] = [];
  anneeScolaireOptions: SelectOption[] = [];

  classeLabels: Record<number, string> = {};
  matiereLabels: Record<number, string> = {};
  periodeLabels: Record<number, string> = {};

  readonly statutLabels = STATUT_EVALUATION_LABELS;
  typeLabels: Record<string, string> = { ...TYPE_EVALUATION_LABELS };
  readonly statutOptions: SelectOption[] = Object.entries(STATUT_EVALUATION_LABELS).map(([value, label]) => ({ value, label }));
  typeOptions: SelectOption[] = [];

  isFormOpen = false;
  isEditMode = false;
  editingUuid: string | null = null;
  formModel: Partial<EvaluationRequest> = emptyEvaluationRequest();
  formError = '';
  saving = false;

  isConfirmOpen = false;
  rowPendingDelete: Evaluation | null = null;
  deleteError = '';
  deleting = false;

  publishingUuid: string | null = null;

  constructor(
    private router: Router,
    private pedagogieService: PedagogieService,
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
    this.referentielCrudService.businessParameterOptions('TYPE_EVALUATION').subscribe({
      next: (items) => {
        this.typeOptions = items.map((item) => ({ value: item.code, label: item.libelle }));
        this.typeLabels = Object.fromEntries(items.map((item) => [item.code, item.libelle]));
        if (!this.formModel.type) this.formModel.type = this.typeOptions[0]?.value;
      },
      error: () => {
        this.typeOptions = Object.entries(TYPE_EVALUATION_LABELS).map(([value, label]) => ({ value, label }));
      }
    });
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
      .list('matieres', { page: 1, size: 200, sortField: 'id', sortOrder: 'ASC', filter: '' })
      .subscribe({
        next: (page) => {
          this.matiereOptions = page.content.map((item) => ({ value: String(item['id']), label: String(item['libelle']) }));
          this.matiereLabels = Object.fromEntries(page.content.map((item) => [item['id'], item['libelle']]));
        },
        error: () => (this.matiereOptions = [])
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
      .list('annees-scolaires', { page: 1, size: 200, sortField: 'id', sortOrder: 'DESC', filter: '' })
      .subscribe({
        next: (page) => (this.anneeScolaireOptions = page.content.map((item) => ({ value: String(item['id']), label: String(item['code']) }))),
        error: () => (this.anneeScolaireOptions = [])
      });
  }

  private buildFilters(): FilterCriteria[] {
    const filters: FilterCriteria[] = [];
    if (this.classeFilter) filters.push({ field: 'classeId', condition: 'eq', value: +this.classeFilter });
    if (this.matiereFilter) filters.push({ field: 'matiereId', condition: 'eq', value: +this.matiereFilter });
    if (this.periodeFilter) filters.push({ field: 'periodeId', condition: 'eq', value: +this.periodeFilter });
    if (this.statutFilter) filters.push({ field: 'statut', condition: 'eq', value: this.statutFilter });
    return filters;
  }

  load(): void {
    this.loading = true;
    this.listError = '';
    this.pedagogieService
      .filterEvaluations(this.buildFilters(), { page: this.page, size: this.pageSize, sortField: 'id', sortOrder: 'DESC', filter: '' })
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
          this.listError = 'Impossible de charger les évaluations.';
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
    this.matiereFilter = '';
    this.periodeFilter = '';
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

  changePageSize(pageSize: number): void {
    this.pageSize = pageSize;
    this.page = 1;
    this.load();
  }

  classeLabel(classeId: number): string {
    return this.classeLabels[classeId] ?? `#${classeId}`;
  }

  matiereLabel(matiereId: number): string {
    return this.matiereLabels[matiereId] ?? `#${matiereId}`;
  }

  periodeLabel(periodeId: number): string {
    return this.periodeLabels[periodeId] ?? `#${periodeId}`;
  }

  badgeColor(statut: string): 'success' | 'light' {
    return statut === 'PUBLIEE' ? 'success' : 'light';
  }

  openCreate(): void {
    this.isEditMode = false;
    this.editingUuid = null;
    this.formModel = emptyEvaluationRequest();
    this.formError = '';
    this.isFormOpen = true;
  }

  openEdit(row: Evaluation): void {
    this.isEditMode = true;
    this.editingUuid = row.uuid;
    this.formModel = {
      classeId: row.classeId,
      matiereId: row.matiereId,
      periodeId: row.periodeId,
      anneeScolaireId: row.anneeScolaireId,
      type: row.type,
      libelle: row.libelle,
      date: row.date,
      coefficient: row.coefficient,
      bareme: row.bareme
    };
    this.formError = '';
    this.isFormOpen = true;
  }

  closeForm(): void {
    this.isFormOpen = false;
  }

  updateField(key: keyof EvaluationRequest, value: unknown): void {
    this.formModel = { ...this.formModel, [key]: value };
  }

  // Une évaluation publiée a déjà déclenché un recalcul de moyennes visible aux élèves/parents -
  // ses paramètres structurants (classe/matière/période/année) ne sont plus modifiables une fois
  // publiée, cf. StatutEvaluation côté backend. On bloque donc l'édition ici aussi (défense en
  // profondeur, en plus du contrôle serveur).
  canEdit(row: Evaluation): boolean {
    return row.statut === 'BROUILLON';
  }

  canPublier(row: Evaluation): boolean {
    return row.statut === 'BROUILLON';
  }

  save(): void {
    const { classeId, matiereId, periodeId, anneeScolaireId, type, libelle, date, coefficient, bareme } = this.formModel;
    if (!classeId || !matiereId || !periodeId || !anneeScolaireId || !type || !libelle || !date || !coefficient || !bareme) {
      this.formError = 'Tous les champs sont obligatoires.';
      return;
    }

    this.saving = true;
    this.formError = '';
    const payload: EvaluationRequest = {
      classeId: +classeId,
      matiereId: +matiereId,
      periodeId: +periodeId,
      anneeScolaireId: +anneeScolaireId,
      type,
      libelle,
      date,
      coefficient: +coefficient,
      bareme: +bareme
    };

    const request$ = this.isEditMode
      ? this.pedagogieService.updateEvaluation(this.editingUuid!, payload)
      : this.pedagogieService.createEvaluation(payload);

    request$.subscribe({
      next: () => {
        this.saving = false;
        this.isFormOpen = false;
        this.toastService.success(this.isEditMode ? 'Évaluation modifiée avec succès.' : 'Évaluation créée avec succès.');
        this.load();
      },
      error: (err) => {
        this.saving = false;
        this.formError = err?.error?.message || "Une erreur est survenue lors de l'enregistrement.";
        this.toastService.error(this.formError, "Échec de l'enregistrement");
      }
    });
  }

  publier(row: Evaluation): void {
    this.publishingUuid = row.uuid;
    this.pedagogieService.publierEvaluation(row.uuid).subscribe({
      next: () => {
        this.publishingUuid = null;
        this.toastService.success('Évaluation publiée avec succès - les moyennes ont été recalculées.');
        this.load();
      },
      error: (err) => {
        this.publishingUuid = null;
        this.toastService.error(err?.error?.message || "Échec de la publication.", "Échec de l'opération");
      }
    });
  }

  saisirNotes(row: Evaluation): void {
    this.router.navigate(['/pedagogie/evaluations', row.uuid, 'notes']);
  }

  askDelete(row: Evaluation): void {
    this.rowPendingDelete = row;
    this.deleteError = '';
    this.isConfirmOpen = true;
  }

  cancelDelete(): void {
    this.isConfirmOpen = false;
    this.rowPendingDelete = null;
  }

  confirmDelete(): void {
    if (!this.rowPendingDelete) {
      return;
    }
    this.deleting = true;
    this.deleteError = '';
    this.pedagogieService.deleteEvaluation(this.rowPendingDelete.uuid).subscribe({
      next: () => {
        this.deleting = false;
        this.isConfirmOpen = false;
        this.rowPendingDelete = null;
        this.toastService.success('Évaluation supprimée avec succès.');
        this.load();
      },
      error: (err) => {
        this.deleting = false;
        this.deleteError = err?.error?.message || 'Suppression impossible.';
        this.toastService.error(this.deleteError, 'Échec de la suppression');
      }
    });
  }
}
