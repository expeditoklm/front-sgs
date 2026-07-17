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
import { ReportService } from '../../../core/services/report.service';
import { ToastService } from '../../../core/services/toast.service';
import { DocumentViewerService } from '../../../core/services/document-viewer.service';
import { AuthenticationService } from '../../../core/services/authentication.service';
import { SelectOption } from '../../../core/models/referentiel-crud.models';
import {
  Eleve,
  EleveRequest,
  Inscription,
  InscriptionRequest,
  MODE_PAIEMENT_LABELS,
  ModePaiement,
  PaiementRequest,
  TYPE_INSCRIPTION_LABELS,
  STATUT_INSCRIPTION_LABELS,
  TypeInscription,
  TransfertClasse
} from '../../../core/models/inscription.models';

type DossierTab = 'infos' | 'pieces' | 'parents';

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

  sexeOptions: SelectOption[] = [
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
  typeInscriptionOptions: SelectOption[] = [];
  generatingCertificat = false;
  classeRows: Array<{ id: number; libelle: string; niveauCode: string; anneeScolaireCode: string }> = [];

  // --- Correction d'un dossier rejeté ---
  isResoumissionOpen = false;
  resubmitting = false;
  resoumissionError = '';

  // --- Transfert de classe ---
  isTransfertFormOpen = false;
  transfertClasseDestinationId: number | null = null;
  transfertMotif = '';
  transfertError = '';
  transferring = false;
  isHistoriqueTransfertsOpen = false;
  historiqueTransferts: TransfertClasse[] = [];
  loadingHistoriqueTransferts = false;
  historiqueTransfertsError = '';

  // --- Paiement ---
  // Il n'existait jusqu'ici AUCUN moyen d'enregistrer un paiement depuis l'UI : "Suivi des
  // paiements" ne fait que lister/filtrer/confirmer des paiements déjà créés. Formulaire ajouté
  // ici (comme "Nouvelle inscription"), rattaché à l'inscription sélectionnée.
  isPaiementFormOpen = false;
  paiementModel: Partial<PaiementRequest> = {};
  paiementError = '';
  savingPaiement = false;
  modePaiementOptions: SelectOption[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private inscriptionService: InscriptionService,
    private referentielCrudService: ReferentielCrudService,
    private reportService: ReportService,
    private toastService: ToastService,
    private documentViewer: DocumentViewerService,
    private authenticationService: AuthenticationService
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
        const requestedInscriptionUuid = this.route.snapshot.queryParamMap.get('inscription');
        this.selectedInscription = inscriptions.find((item) => item.uuid === requestedInscriptionUuid)
          ?? inscriptions[0]
          ?? null;
        if (this.route.snapshot.queryParamMap.get('action') === 'transfert') {
          if (this.canTransfererClasse) {
            this.openTransfertClasse();
          } else {
            this.toastService.error(
              "Le transfert exige une inscription validée et un profil ADM ou SADM.",
              'Transfert indisponible'
            );
          }
          this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { action: null },
            queryParamsHandling: 'merge',
            replaceUrl: true
          });
        }
      },
      error: () => (this.inscriptions = [])
    });
  }

  private loadReferentielOptions(): void {
    this.referentielCrudService.businessParameterOptions('SEXE').subscribe({
      next: (items) => (this.sexeOptions = items.map((item) => ({ value: item.code, label: item.libelle })))
    });
    this.referentielCrudService.businessParameterOptions('TYPE_INSCRIPTION').subscribe({
      next: (items) => (this.typeInscriptionOptions = items.map((item) => ({ value: item.code, label: item.libelle }))),
      error: () => (this.typeInscriptionOptions = Object.entries(TYPE_INSCRIPTION_LABELS).map(([value, label]) => ({ value, label })))
    });
    this.referentielCrudService.businessParameterOptions('MODE_PAIEMENT').subscribe({
      next: (items) => (this.modePaiementOptions = items.map((item) => ({ value: item.code, label: item.libelle }))),
      error: () => (this.modePaiementOptions = Object.entries(MODE_PAIEMENT_LABELS).map(([value, label]) => ({ value, label })))
    });
    this.referentielCrudService
      .list('classes', { page: 1, size: 200, sortField: 'id', sortOrder: 'ASC', filter: '' })
      .subscribe({
        next: (page) => {
          this.classeRows = page.content.map((item) => ({
            id: Number(item['id']),
            libelle: String(item['libelle']),
            niveauCode: String(item['niveauCode']),
            anneeScolaireCode: String(item['anneeScolaireCode'])
          }));
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

  telechargerCertificat(): void {
    if (!this.selectedInscription) return;
    this.generatingCertificat = true;
    this.reportService.genererCertificatInscription(this.selectedInscription.uuid).subscribe({
      next: (blob) => {
        this.generatingCertificat = false;
        const code = this.selectedInscription!.code || this.selectedInscription!.uuid;
        this.documentViewer.open(blob, `Certificat d'inscription ${code}`, `certificat-inscription-${code}.pdf`);
      },
      error: (err) => {
        this.generatingCertificat = false;
        this.toastService.error(err?.error?.message || 'Échec de la génération du certificat.');
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

  get canTransfererClasse(): boolean {
    return this.selectedInscription?.statut === 'VALIDEE'
      && this.authenticationService.hasAnyRole(['SADM', 'ADM']);
  }

  get canResoumettreCorrection(): boolean {
    return this.selectedInscription?.statut === 'REJETEE'
      && this.authenticationService.hasAnyRole(['SEC', 'SADM', 'ADM']);
  }

  get isCorrectionResoumise(): boolean {
    return this.selectedInscription?.statut === 'EN_ATTENTE'
      && this.selectedInscription.statutPrecedentDerniereTransition === 'REJETEE';
  }

  openResoumission(): void {
    if (!this.canResoumettreCorrection) return;
    this.resoumissionError = '';
    this.isResoumissionOpen = true;
  }

  closeResoumission(): void {
    if (this.resubmitting) return;
    this.isResoumissionOpen = false;
  }

  confirmerResoumission(): void {
    if (!this.selectedInscription || !this.canResoumettreCorrection) return;
    this.resubmitting = true;
    this.resoumissionError = '';
    this.inscriptionService
      .transition(this.selectedInscription.uuid, 'EN_ATTENTE', 'Dossier corrigé et resoumis pour validation')
      .subscribe({
        next: (inscription) => {
          this.resubmitting = false;
          this.isResoumissionOpen = false;
          this.inscriptions = this.inscriptions.map((item) => item.uuid === inscription.uuid ? inscription : item);
          this.selectedInscription = inscription;
          this.toastService.success("Le dossier corrigé a été resoumis à l'administration.");
        },
        error: (err) => {
          this.resubmitting = false;
          this.resoumissionError = err?.error?.message || err?.error?.details || 'La resoumission du dossier a échoué.';
          this.toastService.error(this.resoumissionError, 'Resoumission impossible');
        }
      });
  }

  get transfertClasseOptions(): SelectOption[] {
    if (!this.selectedInscription) return [];
    const anneeCode = this.anneeScolaireOptions.find(
      (option) => option.value === String(this.selectedInscription!.anneeScolaireId)
    )?.label;
    return this.classeRows
      .filter((classe) => classe.id !== this.selectedInscription!.classeId)
      .filter((classe) => !anneeCode || classe.anneeScolaireCode === anneeCode)
      .map((classe) => ({ value: String(classe.id), label: classe.libelle }));
  }

  classeLabel(classeId: number): string {
    return this.classeRows.find((classe) => classe.id === classeId)?.libelle || `Classe #${classeId}`;
  }

  niveauCode(classeId: number): string | null {
    return this.classeRows.find((classe) => classe.id === classeId)?.niveauCode ?? null;
  }

  openTransfertClasse(): void {
    if (!this.canTransfererClasse) return;
    this.transfertClasseDestinationId = null;
    this.transfertMotif = '';
    this.transfertError = '';
    this.isTransfertFormOpen = true;
  }

  closeTransfertClasse(): void {
    if (this.transferring) return;
    this.isTransfertFormOpen = false;
  }

  confirmerTransfertClasse(): void {
    if (!this.selectedInscription || !this.transfertClasseDestinationId || !this.transfertMotif.trim()) {
      this.transfertError = 'La classe de destination et le motif sont obligatoires.';
      return;
    }
    this.transferring = true;
    this.transfertError = '';
    this.inscriptionService.transfererClasse(this.selectedInscription.uuid, {
      classeDestinationId: this.transfertClasseDestinationId,
      motif: this.transfertMotif.trim()
    }).subscribe({
      next: (inscription) => {
        this.transferring = false;
        this.isTransfertFormOpen = false;
        this.inscriptions = this.inscriptions.map((item) => item.uuid === inscription.uuid ? inscription : item);
        this.selectedInscription = inscription;
        this.toastService.success(`Élève transféré vers ${this.classeLabel(inscription.classeId)}.`);
      },
      error: (err) => {
        this.transferring = false;
        this.transfertError = err?.error?.message || err?.error?.details || 'Échec du transfert de classe.';
        this.toastService.error(this.transfertError, 'Transfert impossible');
      }
    });
  }

  openHistoriqueTransferts(): void {
    if (!this.selectedInscription) return;
    this.isHistoriqueTransfertsOpen = true;
    this.loadingHistoriqueTransferts = true;
    this.historiqueTransfertsError = '';
    this.historiqueTransferts = [];
    this.inscriptionService.historiqueTransferts(this.selectedInscription.uuid).subscribe({
      next: (historique) => {
        this.historiqueTransferts = historique;
        this.loadingHistoriqueTransferts = false;
      },
      error: (err) => {
        this.loadingHistoriqueTransferts = false;
        this.historiqueTransfertsError = err?.error?.message || err?.error?.details || "Impossible de charger l'historique des transferts.";
      }
    });
  }

  closeHistoriqueTransferts(): void {
    this.isHistoriqueTransfertsOpen = false;
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

  openCreatePaiement(): void {
    if (!this.selectedInscription) return;
    this.paiementModel = { inscriptionUuid: this.selectedInscription.uuid, mode: 'ESPECES' as ModePaiement };
    this.paiementError = '';
    this.isPaiementFormOpen = true;
  }

  closePaiementForm(): void {
    this.isPaiementFormOpen = false;
  }

  updatePaiementField(key: keyof PaiementRequest, value: unknown): void {
    this.paiementModel = { ...this.paiementModel, [key]: value };
  }

  savePaiement(): void {
    if (!this.selectedInscription) return;
    const { montant, mode } = this.paiementModel;
    if (!montant || montant <= 0 || !mode) {
      this.paiementError = 'Montant et mode de paiement sont obligatoires.';
      return;
    }

    this.savingPaiement = true;
    this.paiementError = '';
    this.inscriptionService
      .creerPaiement({
        inscriptionUuid: this.selectedInscription.uuid,
        montant: +montant,
        mode,
        referenceExterne: this.paiementModel.referenceExterne || null
      })
      .subscribe({
        next: (paiement) => {
          // Un paiement en espèces est reçu sur-le-champ par le secrétariat - le confirmer tout de
          // suite évite un aller-retour inutile par "Suivi des paiements" (mobile money/virement/
          // chèque, eux, attendent une confirmation externe - webhook opérateur ou relevé bancaire -
          // donc restent EN_ATTENTE, cf. PaiementService.confirmer).
          if (mode === 'ESPECES') {
            this.inscriptionService.confirmerPaiement(paiement.uuid).subscribe({
              next: () => {
                this.savingPaiement = false;
                this.isPaiementFormOpen = false;
                this.toastService.success('Paiement enregistré et confirmé avec succès.');
              },
              error: (err) => {
                this.savingPaiement = false;
                this.isPaiementFormOpen = false;
                this.toastService.error(
                  err?.error?.message || 'Paiement enregistré, mais échec de la confirmation automatique - à confirmer depuis Suivi des paiements.'
                );
              }
            });
          } else {
            this.savingPaiement = false;
            this.isPaiementFormOpen = false;
            this.toastService.success('Paiement enregistré avec succès - à confirmer depuis Suivi des paiements dès réception.');
          }
        },
        error: (err) => {
          this.savingPaiement = false;
          this.paiementError = err?.error?.message || "Échec de l'enregistrement du paiement.";
          this.toastService.error(this.paiementError, "Échec de l'enregistrement");
        }
      });
  }
}
