import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { ComponentCardComponent } from '../../shared/components/common/component-card/component-card.component';
import { ButtonComponent } from '../../shared/components/ui/button/button.component';
import { ModalComponent } from '../../shared/components/ui/modal/modal.component';
import { InputFieldComponent } from '../../shared/components/form/input/input-field.component';
import { EntityTableComponent } from '../../shared/components/referentiel/entity-table/entity-table.component';
import { EntityFormComponent } from '../../shared/components/referentiel/entity-form/entity-form.component';
import { ConfirmDialogComponent } from '../../shared/components/referentiel/confirm-dialog/confirm-dialog.component';
import { EntityDefinition } from '../../core/models/referentiel-crud.models';
import { MetaResponse } from '../../core/models/audit.models';
import { ReferentielCrudService } from '../../core/services/referentiel-crud.service';

@Component({
  selector: 'app-referentiel-page',
  imports: [
    PageBreadcrumbComponent,
    ComponentCardComponent,
    ButtonComponent,
    ModalComponent,
    InputFieldComponent,
    EntityTableComponent,
    EntityFormComponent,
    ConfirmDialogComponent
  ],
  templateUrl: './referentiel-page.component.html',
  styles: ``
})
export class ReferentielPageComponent implements OnInit {
  entity!: EntityDefinition;

  rows: Record<string, any>[] = [];
  meta: MetaResponse | null = null;
  page = 1;
  filterText = '';
  loading = false;
  listError = '';

  isFormOpen = false;
  isEditMode = false;
  editingUuid: string | null = null;
  formModel: Record<string, any> = {};
  formError = '';
  saving = false;

  isConfirmOpen = false;
  rowPendingDelete: Record<string, any> | null = null;
  deleteError = '';
  deleting = false;

  constructor(private route: ActivatedRoute, private crudService: ReferentielCrudService) {
  }

  ngOnInit(): void {
    this.entity = this.route.snapshot.data['entity'];
    this.load();
  }

  load(): void {
    this.loading = true;
    this.listError = '';
    this.crudService
      .list(this.entity.path, { page: this.page, size: 10, sortField: 'id', sortOrder: 'DESC', filter: this.filterText })
      .subscribe({
        next: (result) => {
          this.rows = result.content;
          this.meta = result.meta;
          this.loading = false;
        },
        error: () => {
          this.rows = [];
          this.meta = null;
          this.listError = 'Impossible de charger la liste. Vérifiez que vous avez les droits nécessaires.';
          this.loading = false;
        }
      });
  }

  search(): void {
    this.page = 1;
    this.load();
  }

  goToPage(page: number): void {
    if (page < 1 || (this.meta && page > this.meta.totalPages)) {
      return;
    }
    this.page = page;
    this.load();
  }

  openCreate(): void {
    this.isEditMode = false;
    this.editingUuid = null;
    this.formModel = this.buildDefaultModel();
    this.formError = '';
    this.isFormOpen = true;
  }

  openEdit(row: Record<string, any>): void {
    this.isEditMode = true;
    this.editingUuid = row['uuid'];
    this.formModel = this.buildEditModel(row);
    this.formError = '';
    this.isFormOpen = true;
  }

  closeForm(): void {
    this.isFormOpen = false;
  }

  onModelChange(model: Record<string, any>): void {
    this.formModel = model;
  }

  save(): void {
    this.saving = true;
    this.formError = '';

    const request$ = this.isEditMode
      ? this.crudService.update(this.entity.path, this.editingUuid!, this.formModel)
      : this.crudService.create(this.entity.path, this.formModel);

    request$.subscribe({
      next: () => {
        this.saving = false;
        this.isFormOpen = false;
        this.load();
      },
      error: (err) => {
        this.saving = false;
        this.formError = err?.error?.message || "Une erreur est survenue lors de l'enregistrement.";
      }
    });
  }

  askDelete(row: Record<string, any>): void {
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

    this.crudService.remove(this.entity.path, this.rowPendingDelete['uuid']).subscribe({
      next: () => {
        this.deleting = false;
        this.isConfirmOpen = false;
        this.rowPendingDelete = null;
        this.load();
      },
      error: (err) => {
        this.deleting = false;
        this.deleteError = err?.error?.message || 'Suppression impossible.';
      }
    });
  }

  private buildDefaultModel(): Record<string, any> {
    const model: Record<string, any> = {};
    this.entity.fields.forEach((field) => {
      model[field.key] = field.type === 'multiselect' ? [] : field.type === 'checkbox' ? false : null;
    });
    return model;
  }

  private buildEditModel(row: Record<string, any>): Record<string, any> {
    const model: Record<string, any> = {};
    this.entity.fields.forEach((field) => {
      // Profil.droits arrive du backend comme une liste d'objets {code, libelle, ...}, pas de
      // simples codes - le formulaire (multiselect) attend un tableau de codes.
      if (this.entity.key === 'profils' && field.key === 'droits') {
        model[field.key] = (row['droits'] ?? []).map((droit: any) => droit.code);
      } else {
        model[field.key] = row[field.key];
      }
    });
    return model;
  }
}
