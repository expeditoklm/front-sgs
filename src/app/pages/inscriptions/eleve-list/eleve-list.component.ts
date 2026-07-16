import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PageBreadcrumbComponent } from '../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { ComponentCardComponent } from '../../../shared/components/common/component-card/component-card.component';
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';
import { ModalComponent } from '../../../shared/components/ui/modal/modal.component';
import { InputFieldComponent } from '../../../shared/components/form/input/input-field.component';
import { LabelComponent } from '../../../shared/components/form/label/label.component';
import { SelectComponent } from '../../../shared/components/form/select/select.component';
import { ConfirmDialogComponent } from '../../../shared/components/referentiel/confirm-dialog/confirm-dialog.component';
import { InscriptionService } from '../../../core/services/inscription.service';
import { ReferentielCrudService } from '../../../core/services/referentiel-crud.service';
import { ToastService } from '../../../core/services/toast.service';
import { Eleve, EleveRequest, Sexe } from '../../../core/models/inscription.models';
import { MetaResponse } from '../../../core/models/audit.models';
import { SelectOption } from '../../../core/models/referentiel-crud.models';

function emptyEleveRequest(): EleveRequest {
  return { nom: '', prenom: '', dateNaissance: '', lieuNaissance: '', sexe: 'M' as Sexe, etablissementId: undefined };
}

@Component({
  selector: 'app-eleve-list',
  imports: [
    PageBreadcrumbComponent,
    ComponentCardComponent,
    ButtonComponent,
    ModalComponent,
    InputFieldComponent,
    LabelComponent,
    SelectComponent,
    ConfirmDialogComponent
  ],
  templateUrl: './eleve-list.component.html'
})
export class EleveListComponent implements OnInit {
  rows: Eleve[] = [];
  meta: MetaResponse | null = null;
  page = 1;
  filterText = '';
  loading = false;
  listError = '';

  etablissementOptions: SelectOption[] = [];

  isFormOpen = false;
  formModel: EleveRequest = emptyEleveRequest();
  formError = '';
  saving = false;

  isConfirmOpen = false;
  rowPendingDelete: Eleve | null = null;
  deleteError = '';
  deleting = false;

  sexeOptions: SelectOption[] = [
    { value: 'M', label: 'Masculin' },
    { value: 'F', label: 'Féminin' }
  ];

  constructor(
    private router: Router,
    private inscriptionService: InscriptionService,
    private referentielCrudService: ReferentielCrudService,
    private toastService: ToastService
  ) {
  }

  ngOnInit(): void {
    this.load();
    this.loadEtablissements();
    this.referentielCrudService.businessParameterOptions('SEXE').subscribe({
      next: (items) => (this.sexeOptions = items.map((item) => ({ value: item.code, label: item.libelle })))
    });
  }

  load(): void {
    this.loading = true;
    this.listError = '';
    this.inscriptionService
      .listEleves({ page: this.page, size: 10, sortField: 'id', sortOrder: 'DESC', filter: this.filterText })
      .subscribe({
        next: (result) => {
          this.rows = result.content;
          this.meta = result.meta;
          this.loading = false;
        },
        error: (err) => {
          this.rows = [];
          this.meta = null;
          this.listError = 'Impossible de charger la liste des élèves.';
          this.loading = false;
          this.toastService.error(err?.error?.message || this.listError, 'Chargement impossible');
        }
      });
  }

  private loadEtablissements(): void {
    this.referentielCrudService
      .list('etablissements', { page: 1, size: 200, sortField: 'id', sortOrder: 'ASC', filter: '' })
      .subscribe({
        next: (page) => {
          this.etablissementOptions = page.content.map((item) => ({ value: String(item['id']), label: String(item['nom']) }));
        },
        error: () => (this.etablissementOptions = [])
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
    this.formModel = emptyEleveRequest();
    this.formError = '';
    this.isFormOpen = true;
  }

  closeForm(): void {
    this.isFormOpen = false;
  }

  updateField(key: keyof EleveRequest, value: unknown): void {
    this.formModel = { ...this.formModel, [key]: value };
  }

  save(): void {
    if (!this.formModel.nom || !this.formModel.prenom || !this.formModel.dateNaissance || !this.formModel.etablissementId) {
      this.formError = 'Nom, prénom, date de naissance et établissement sont obligatoires.';
      return;
    }

    this.saving = true;
    this.formError = '';
    this.inscriptionService.createEleve(this.formModel).subscribe({
      next: () => {
        this.saving = false;
        this.isFormOpen = false;
        this.toastService.success("Fiche élève créée avec succès.");
        this.load();
      },
      error: (err) => {
        this.saving = false;
        this.formError = err?.error?.message || "Une erreur est survenue lors de l'enregistrement.";
        this.toastService.error(this.formError, "Échec de l'enregistrement");
      }
    });
  }

  openDossier(row: Eleve): void {
    this.router.navigate(['/inscriptions/eleves', row.uuid]);
  }

  askDelete(row: Eleve): void {
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
    this.inscriptionService.deleteEleve(this.rowPendingDelete.uuid).subscribe({
      next: () => {
        this.deleting = false;
        this.isConfirmOpen = false;
        this.rowPendingDelete = null;
        this.toastService.success('Fiche élève supprimée avec succès.');
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
