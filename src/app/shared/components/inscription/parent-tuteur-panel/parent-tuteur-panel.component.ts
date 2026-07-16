import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ComponentCardComponent } from '../../common/component-card/component-card.component';
import { ButtonComponent } from '../../ui/button/button.component';
import { ModalComponent } from '../../ui/modal/modal.component';
import { InputFieldComponent } from '../../form/input/input-field.component';
import { LabelComponent } from '../../form/label/label.component';
import { SelectComponent } from '../../form/select/select.component';
import { CheckboxComponent } from '../../form/input/checkbox.component';
import { ConfirmDialogComponent } from '../../referentiel/confirm-dialog/confirm-dialog.component';
import { InscriptionService } from '../../../../core/services/inscription.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ReferentielCrudService } from '../../../../core/services/referentiel-crud.service';
import { SelectOption } from '../../../../core/models/referentiel-crud.models';
import { EleveParent, ParentTuteurRequest, TYPE_RELATION_LABELS, TypeRelation } from '../../../../core/models/inscription.models';

interface AttachFormModel extends ParentTuteurRequest {
  typeRelation: TypeRelation;
  contactPrincipal: boolean;
}

function emptyForm(): AttachFormModel {
  return { nom: '', prenom: '', telephone: '', email: '', profession: '', adresse: '', typeRelation: 'PERE', contactPrincipal: false };
}

// Section "Parents / tuteurs" d'un dossier élève - rattache un parent existant (retrouvé par
// téléphone côté backend, cf. ParentTuteurService.findExistingOrCreate) ou en crée un nouveau,
// dans un seul et même formulaire : pas besoin d'une étape de recherche séparée, le backend gère
// déjà la déduplication par téléphone.
@Component({
  selector: 'app-parent-tuteur-panel',
  imports: [ComponentCardComponent, ButtonComponent, ModalComponent, InputFieldComponent, LabelComponent, SelectComponent, CheckboxComponent, ConfirmDialogComponent],
  templateUrl: './parent-tuteur-panel.component.html'
})
export class ParentTuteurPanelComponent implements OnChanges {
  @Input({ required: true }) eleveUuid!: string;

  parents: EleveParent[] = [];
  loading = false;
  loadError = '';

  typeRelationLabels: Record<string, string> = { ...TYPE_RELATION_LABELS };
  typeRelationOptions: SelectOption[] = [];

  isFormOpen = false;
  formModel: AttachFormModel = emptyForm();
  formError = '';
  saving = false;

  isConfirmOpen = false;
  parentPendingDetach: EleveParent | null = null;
  detachError = '';
  detaching = false;

  constructor(
    private inscriptionService: InscriptionService,
    private toastService: ToastService,
    private referentielCrudService: ReferentielCrudService
  ) {
    this.referentielCrudService.businessParameterOptions('TYPE_RELATION').subscribe({
      next: (items) => {
        this.typeRelationOptions = items.map((item) => ({ value: item.code, label: item.libelle }));
        this.typeRelationLabels = Object.fromEntries(items.map((item) => [item.code, item.libelle]));
      },
      error: () => {
        this.typeRelationOptions = Object.entries(TYPE_RELATION_LABELS).map(([value, label]) => ({ value, label }));
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['eleveUuid'] && this.eleveUuid) {
      this.load();
    }
  }

  load(): void {
    this.loading = true;
    this.loadError = '';
    this.inscriptionService.getParents(this.eleveUuid).subscribe({
      next: (parents) => {
        this.parents = parents;
        this.loading = false;
      },
      error: (err) => {
        this.parents = [];
        this.loading = false;
        this.loadError = 'Impossible de charger les parents/tuteurs.';
        this.toastService.error(err?.error?.message || this.loadError, 'Chargement impossible');
      }
    });
  }

  openAttach(): void {
    this.formModel = emptyForm();
    this.formError = '';
    this.isFormOpen = true;
  }

  closeForm(): void {
    this.isFormOpen = false;
  }

  updateField(key: keyof AttachFormModel, value: unknown): void {
    this.formModel = { ...this.formModel, [key]: value };
  }

  attach(): void {
    if (!this.formModel.nom || !this.formModel.prenom || !this.formModel.telephone) {
      this.formError = 'Nom, prénom et téléphone sont obligatoires.';
      return;
    }

    this.saving = true;
    this.formError = '';
    const { typeRelation, contactPrincipal, ...parentPayload } = this.formModel;

    this.inscriptionService.creerOuRecupererParent(parentPayload).subscribe({
      next: (parent) => {
        this.inscriptionService.attacherParent(this.eleveUuid, { parentTuteurUuid: parent.uuid, typeRelation, contactPrincipal }).subscribe({
          next: () => {
            this.saving = false;
            this.isFormOpen = false;
            this.toastService.success('Parent/tuteur rattaché avec succès.');
            this.load();
          },
          error: (err) => {
            this.saving = false;
            this.formError = err?.error?.message || 'Échec du rattachement.';
            this.toastService.error(this.formError, 'Échec du rattachement');
          }
        });
      },
      error: (err) => {
        this.saving = false;
        this.formError = err?.error?.message || "Échec de l'enregistrement du parent/tuteur.";
        this.toastService.error(this.formError, "Échec de l'enregistrement");
      }
    });
  }

  askDetach(parent: EleveParent): void {
    this.parentPendingDetach = parent;
    this.detachError = '';
    this.isConfirmOpen = true;
  }

  cancelDetach(): void {
    this.isConfirmOpen = false;
    this.parentPendingDetach = null;
  }

  confirmDetach(): void {
    if (!this.parentPendingDetach) return;
    this.detaching = true;
    this.detachError = '';
    this.inscriptionService.detacherParent(this.eleveUuid, this.parentPendingDetach.parentTuteurUuid).subscribe({
      next: () => {
        this.detaching = false;
        this.isConfirmOpen = false;
        this.parentPendingDetach = null;
        this.toastService.success('Parent/tuteur détaché avec succès.');
        this.load();
      },
      error: (err) => {
        this.detaching = false;
        this.detachError = err?.error?.message || 'Détachement impossible.';
        this.toastService.error(this.detachError, 'Échec du détachement');
      }
    });
  }
}
