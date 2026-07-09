import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PageBreadcrumbComponent } from '../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { ComponentCardComponent } from '../../../shared/components/common/component-card/component-card.component';
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';
import { InputFieldComponent } from '../../../shared/components/form/input/input-field.component';
import { LabelComponent } from '../../../shared/components/form/label/label.component';
import { SelectComponent } from '../../../shared/components/form/select/select.component';
import { FileInputComponent } from '../../../shared/components/form/input/file-input.component';
import { ModalComponent } from '../../../shared/components/ui/modal/modal.component';
import { PieceJustificativePanelComponent } from '../../../shared/components/inscription/piece-justificative-panel/piece-justificative-panel.component';
import { ParentTuteurPanelComponent } from '../../../shared/components/inscription/parent-tuteur-panel/parent-tuteur-panel.component';
import { InscriptionService } from '../../../core/services/inscription.service';
import { ReferentielCrudService } from '../../../core/services/referentiel-crud.service';
import { ToastService } from '../../../core/services/toast.service';
import { SelectOption } from '../../../core/models/referentiel-crud.models';
import {
  Eleve,
  EleveRequest,
  Inscription,
  InscriptionRequest,
  TYPE_INSCRIPTION_LABELS,
  STATUT_INSCRIPTION_LABELS,
  TypeInscription
} from '../../../core/models/inscription.models';

type DossierTab = 'infos' | 'pieces' | 'parents';

function typeInscriptionOptions(): SelectOption[] {
  return Object.entries(TYPE_INSCRIPTION_LABELS).map(([value, label]) => ({ value, label }));
}

@Component({
  selector: 'app-eleve-dossier',
  imports: [
    PageBreadcrumbComponent,
    ComponentCardComponent,
    ButtonComponent,
    InputFieldComponent,
    LabelComponent,
    SelectComponent,
    FileInputComponent,
    ModalComponent,
    PieceJustificativePanelComponent,
    ParentTuteurPanelComponent
  ],
  templateUrl: './eleve-dossier.component.html'
})
export class EleveDossierComponent implements OnInit {
  eleve: Eleve | null = null;
  loading = false;
  loadError = '';
  activeTab: DossierTab = 'infos';

  // --- Infos ---
  infosModel: EleveRequest = { nom: '', prenom: '', dateNaissance: '', sexe: 'M' };
  infosError = '';
  savingInfos = false;
  uploadingPhoto = false;

  readonly sexeOptions: SelectOption[] = [
    { value: 'M', label: 'Masculin' },
    { value: 'F', label: 'Féminin' }
  ];

  // --- Inscriptions ---
  inscriptions: Inscription[] = [];
  selectedInscription: Inscription | null = null;
  readonly statutLabels = STATUT_INSCRIPTION_LABELS;

  isInscriptionFormOpen = false;
  inscriptionModel: Partial<InscriptionRequest> = {};
  inscriptionError = '';
  savingInscription = false;
  classeOptions: SelectOption[] = [];
  anneeScolaireOptions: SelectOption[] = [];
  readonly typeInscriptionOptions = typeInscriptionOptions();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private inscriptionService: InscriptionService,
    private referentielCrudService: ReferentielCrudService,
    private toastService: ToastService
  ) {
  }

  ngOnInit(): void {
    const uuid = this.route.snapshot.paramMap.get('uuid');
    if (!uuid) {
      this.router.navigate(['/inscriptions/eleves']);
      return;
    }
    this.load(uuid);
    this.loadReferentielOptions();
  }

  private load(uuid: string): void {
    this.loading = true;
    this.loadError = '';
    this.inscriptionService.getEleve(uuid).subscribe({
      next: (eleve) => {
        this.eleve = eleve;
        this.infosModel = {
          nom: eleve.nom,
          prenom: eleve.prenom,
          dateNaissance: eleve.dateNaissance,
          lieuNaissance: eleve.lieuNaissance,
          sexe: eleve.sexe,
          photoFichierId: eleve.photoFichierId
        };
        this.loading = false;
        this.loadInscriptions(uuid);
      },
      error: (err) => {
        this.loading = false;
        this.loadError = "Impossible de charger ce dossier élève.";
        this.toastService.error(err?.error?.message || this.loadError, 'Chargement impossible');
      }
    });
  }

  private loadInscriptions(eleveUuid: string): void {
    this.inscriptionService.listInscriptionsByEleve(eleveUuid).subscribe({
      next: (inscriptions) => {
        this.inscriptions = inscriptions;
        this.selectedInscription = inscriptions[0] ?? null;
      },
      error: () => (this.inscriptions = [])
    });
  }

  private loadReferentielOptions(): void {
    this.referentielCrudService
      .list('classes', { page: 1, size: 200, sortField: 'id', sortOrder: 'ASC', filter: '' })
      .subscribe({
        next: (page) => {
          this.classeOptions = page.content.map((item) => ({ value: String(item['id']), label: `${item['libelle']} (${item['anneeScolaireCode']})` }));
        },
        error: () => (this.classeOptions = [])
      });
    this.referentielCrudService
      .list('annees-scolaires', { page: 1, size: 200, sortField: 'id', sortOrder: 'DESC', filter: '' })
      .subscribe({
        next: (page) => {
          this.anneeScolaireOptions = page.content.map((item) => ({ value: String(item['id']), label: String(item['code']) }));
        },
        error: () => (this.anneeScolaireOptions = [])
      });
  }

  selectTab(tab: DossierTab): void {
    this.activeTab = tab;
  }

  goToList(): void {
    this.router.navigate(['/inscriptions/eleves']);
  }

  selectInscription(uuid: string): void {
    this.selectedInscription = this.inscriptions.find((i) => i.uuid === uuid) ?? null;
  }

  updateInfoField(key: keyof EleveRequest, value: unknown): void {
    this.infosModel = { ...this.infosModel, [key]: value };
  }

  saveInfos(): void {
    if (!this.eleve) return;
    this.savingInfos = true;
    this.infosError = '';
    this.inscriptionService.updateEleve(this.eleve.uuid, this.infosModel).subscribe({
      next: (eleve) => {
        this.eleve = eleve;
        this.savingInfos = false;
        this.toastService.success('Fiche élève mise à jour avec succès.');
      },
      error: (err) => {
        this.savingInfos = false;
        this.infosError = err?.error?.message || 'Échec de la mise à jour.';
        this.toastService.error(this.infosError, "Échec de l'enregistrement");
      }
    });
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !this.eleve) return;

    this.uploadingPhoto = true;
    this.inscriptionService.uploaderFichier(file, 'eleves').subscribe({
      next: (upload) => {
        this.updateInfoField('photoFichierId', upload.id);
        this.uploadingPhoto = false;
        this.toastService.success('Photo envoyée avec succès. Cliquez sur Enregistrer pour la rattacher à la fiche.');
      },
      error: (err) => {
        this.uploadingPhoto = false;
        this.toastService.error(err?.error?.message || "Échec de l'envoi de la photo.");
      }
    });
  }

  openCreateInscription(): void {
    if (!this.eleve) return;
    this.inscriptionModel = { eleveUuid: this.eleve.uuid, type: 'PREMIERE_INSCRIPTION' as TypeInscription };
    this.inscriptionError = '';
    this.isInscriptionFormOpen = true;
  }

  closeInscriptionForm(): void {
    this.isInscriptionFormOpen = false;
  }

  updateInscriptionField(key: keyof InscriptionRequest, value: unknown): void {
    this.inscriptionModel = { ...this.inscriptionModel, [key]: value };
  }

  saveInscription(): void {
    if (!this.eleve) return;
    const { classeId, anneeScolaireId, type, montantDu } = this.inscriptionModel;
    if (!classeId || !anneeScolaireId || !type || montantDu === undefined || montantDu === null) {
      this.inscriptionError = 'Classe, année scolaire, type et montant dû sont obligatoires.';
      return;
    }

    this.savingInscription = true;
    this.inscriptionError = '';
    this.inscriptionService
      .createInscription({ eleveUuid: this.eleve.uuid, classeId: +classeId, anneeScolaireId: +anneeScolaireId, type, montantDu: +montantDu })
      .subscribe({
        next: () => {
          this.savingInscription = false;
          this.isInscriptionFormOpen = false;
          this.toastService.success('Inscription créée avec succès.');
          this.loadInscriptions(this.eleve!.uuid);
        },
        error: (err) => {
          this.savingInscription = false;
          this.inscriptionError = err?.error?.message || "Échec de la création de l'inscription.";
          this.toastService.error(this.inscriptionError, "Échec de l'enregistrement");
        }
      });
  }
}
