import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ComponentCardComponent } from '../../common/component-card/component-card.component';
import { ButtonComponent } from '../../ui/button/button.component';
import { LabelComponent } from '../../form/label/label.component';
import { SelectComponent } from '../../form/select/select.component';
import { FileInputComponent } from '../../form/input/file-input.component';
import { BadgeComponent } from '../../ui/badge/badge.component';
import { ModalComponent } from '../../ui/modal/modal.component';
import { InputFieldComponent } from '../../form/input/input-field.component';
import { InscriptionService } from '../../../../core/services/inscription.service';
import { ToastService } from '../../../../core/services/toast.service';
import { AuthenticationService } from '../../../../core/services/authentication.service';
import { ReferentielCrudService } from '../../../../core/services/referentiel-crud.service';
import { DocumentViewerService } from '../../../../core/services/document-viewer.service';
import { SelectOption } from '../../../../core/models/referentiel-crud.models';
import {
  PieceJustificative,
  STATUT_VALIDATION_PIECE_LABELS,
  TYPE_DOCUMENT_LABELS,
  TypeDocument
} from '../../../../core/models/inscription.models';

// Section "Pièces justificatives" d'un dossier élève - autonome (charge/recharge elle-même sa
// liste dès que [inscriptionUuid] change), pour rester réutilisable indépendamment de la mise en
// page du dossier élève qui l'englobe.
@Component({
  selector: 'app-piece-justificative-panel',
  imports: [ComponentCardComponent, ButtonComponent, LabelComponent, SelectComponent, FileInputComponent, BadgeComponent, ModalComponent, InputFieldComponent],
  templateUrl: './piece-justificative-panel.component.html'
})
export class PieceJustificativePanelComponent implements OnChanges {
  @Input({ required: true }) inscriptionUuid!: string;

  pieces: PieceJustificative[] = [];
  loading = false;
  loadError = '';

  selectedType: TypeDocument = 'ACTE_NAISSANCE';
  selectedFile: File | null = null;
  uploading = false;
  uploadError = '';

  deletingUuid: string | null = null;
  validatingUuid: string | null = null;
  viewingUuid: string | null = null;

  // Rejet : motif obligatoire, saisi dans une modale (même pattern que inscription-suivi) -
  // "rejectingPiece" garde la pièce ciblée le temps de la saisie.
  isRejectModalOpen = false;
  rejectingPiece: PieceJustificative | null = null;
  rejectMotif = '';
  rejectError = '';

  typeLabels: Record<string, string> = { ...TYPE_DOCUMENT_LABELS };
  readonly statutLabels = STATUT_VALIDATION_PIECE_LABELS;
  typeOptions: SelectOption[] = [];

  constructor(
    private inscriptionService: InscriptionService,
    private toastService: ToastService,
    private authenticationService: AuthenticationService,
    private referentielCrudService: ReferentielCrudService,
    private documentViewer: DocumentViewerService
  ) {
    this.loadTypeOptions();
  }

  private loadTypeOptions(): void {
    this.referentielCrudService.businessParameterOptions('TYPE_DOCUMENT_INSCRIPTION').subscribe({
      next: (items) => {
        this.typeOptions = items.map((item) => ({ value: item.code, label: item.libelle }));
        this.typeLabels = Object.fromEntries(items.map((item) => [item.code, item.libelle]));
        this.selectedType = this.typeOptions[0]?.value ?? '';
      },
      error: () => {
        this.typeOptions = Object.entries(TYPE_DOCUMENT_LABELS).map(([value, label]) => ({ value, label }));
      }
    });
  }

  // Valider/rejeter une pièce est un acte de contrôle (SADM/ADM) - le secrétariat (SEC) constitue
  // le dossier et peut donc téléverser/supprimer, mais ne s'auto-valide pas lui-même. Même
  // @PreAuthorize côté backend (PieceJustificativeController.valider, class-level SEC/SADM/ADM,
  // mais l'action n'a de sens qu'exercée par l'administration).
  get canValiderOuRejeter(): boolean {
    return this.authenticationService.hasAnyRole(['SADM', 'ADM']);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['inscriptionUuid'] && this.inscriptionUuid) {
      this.load();
    }
  }

  load(): void {
    this.loading = true;
    this.loadError = '';
    this.inscriptionService.getPiecesJustificatives(this.inscriptionUuid).subscribe({
      next: (pieces) => {
        this.pieces = pieces;
        this.loading = false;
      },
      error: (err) => {
        this.pieces = [];
        this.loading = false;
        this.loadError = 'Impossible de charger les pièces justificatives.';
        this.toastService.error(err?.error?.message || this.loadError, 'Chargement impossible');
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] ?? null;
  }

  badgeColor(statut: PieceJustificative['statutValidation']): 'success' | 'error' | 'warning' {
    if (statut === 'VALIDE') return 'success';
    if (statut === 'REJETE') return 'error';
    return 'warning';
  }

  upload(): void {
    if (!this.selectedFile) {
      this.uploadError = 'Choisissez un fichier.';
      return;
    }

    this.uploading = true;
    this.uploadError = '';
    this.inscriptionService.uploaderFichier(this.selectedFile, 'pieces-justificatives').subscribe({
      next: (uploadResponse) => {
        this.inscriptionService
          .creerPieceJustificative({ inscriptionUuid: this.inscriptionUuid, type: this.selectedType, fichierId: uploadResponse.id })
          .subscribe({
            next: () => {
              this.uploading = false;
              this.selectedFile = null;
              this.toastService.success('Pièce justificative envoyée avec succès.');
              this.load();
            },
            error: (err) => {
              this.uploading = false;
              this.uploadError = err?.error?.message || "Échec de l'enregistrement de la pièce.";
              this.toastService.error(this.uploadError, "Échec de l'enregistrement");
            }
          });
      },
      error: (err) => {
        this.uploading = false;
        this.uploadError = err?.error?.message || "Échec de l'envoi du fichier.";
        this.toastService.error(this.uploadError, "Échec de l'envoi");
      }
    });
  }

  remove(piece: PieceJustificative): void {
    this.deletingUuid = piece.uuid;
    this.inscriptionService.supprimerPieceJustificative(piece.uuid).subscribe({
      next: () => {
        this.deletingUuid = null;
        this.toastService.success('Pièce justificative supprimée avec succès.');
        this.load();
      },
      error: (err) => {
        this.deletingUuid = null;
        this.toastService.error(err?.error?.message || 'Suppression impossible.');
      }
    });
  }

  visualiser(piece: PieceJustificative): void {
    this.viewingUuid = piece.uuid;
    this.inscriptionService.telechargerFichier(piece.fichierUuid).subscribe({
      next: (blob) => {
        this.viewingUuid = null;
        const label = this.typeLabels[piece.type] || 'Pièce justificative';
        this.documentViewer.open(blob, label, this.fileName(label, piece.fichierNom, blob.type));
      },
      error: (err) => {
        this.viewingUuid = null;
        this.toastService.error(err?.error?.message || 'Impossible de charger cette pièce.', 'Visualisation impossible');
      }
    });
  }

  private fileName(label: string, storedFileName: string, mimeType: string): string {
    const base = label.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9_-]+/g, '-').toLowerCase();
    const storedExtension = storedFileName?.match(/\.[A-Za-z0-9]{2,5}$/)?.[0]?.toLowerCase() ?? '';
    const extension = storedExtension || (mimeType.includes('pdf') ? '.pdf' : '');
    return `${base || 'piece-justificative'}${extension}`;
  }

  valider(piece: PieceJustificative): void {
    this.validatingUuid = piece.uuid;
    this.inscriptionService.validerPieceJustificative(piece.uuid, { statut: 'VALIDE', commentaireRejet: null }).subscribe({
      next: () => {
        this.validatingUuid = null;
        this.toastService.success('Pièce justificative validée avec succès.');
        this.load();
      },
      error: (err) => {
        this.validatingUuid = null;
        this.toastService.error(err?.error?.message || 'Validation impossible.');
      }
    });
  }

  openRejectModal(piece: PieceJustificative): void {
    this.rejectingPiece = piece;
    this.rejectMotif = '';
    this.rejectError = '';
    this.isRejectModalOpen = true;
  }

  closeRejectModal(): void {
    this.isRejectModalOpen = false;
    this.rejectingPiece = null;
  }

  confirmReject(): void {
    if (!this.rejectMotif.trim()) {
      this.rejectError = 'Le motif de rejet est obligatoire.';
      return;
    }
    const piece = this.rejectingPiece!;
    this.validatingUuid = piece.uuid;
    this.inscriptionService.validerPieceJustificative(piece.uuid, { statut: 'REJETE', commentaireRejet: this.rejectMotif.trim() }).subscribe({
      next: () => {
        this.validatingUuid = null;
        this.toastService.success('Pièce justificative rejetée.');
        this.closeRejectModal();
        this.load();
      },
      error: (err) => {
        this.validatingUuid = null;
        this.rejectError = err?.error?.message || 'Rejet impossible.';
        this.toastService.error(this.rejectError);
      }
    });
  }
}
