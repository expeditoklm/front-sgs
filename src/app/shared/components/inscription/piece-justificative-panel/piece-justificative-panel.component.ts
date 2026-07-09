import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ComponentCardComponent } from '../../common/component-card/component-card.component';
import { ButtonComponent } from '../../ui/button/button.component';
import { LabelComponent } from '../../form/label/label.component';
import { SelectComponent } from '../../form/select/select.component';
import { FileInputComponent } from '../../form/input/file-input.component';
import { BadgeComponent } from '../../ui/badge/badge.component';
import { InscriptionService } from '../../../../core/services/inscription.service';
import { ToastService } from '../../../../core/services/toast.service';
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
  imports: [ComponentCardComponent, ButtonComponent, LabelComponent, SelectComponent, FileInputComponent, BadgeComponent],
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

  readonly typeLabels = TYPE_DOCUMENT_LABELS;
  readonly statutLabels = STATUT_VALIDATION_PIECE_LABELS;
  readonly typeOptions: SelectOption[] = Object.entries(TYPE_DOCUMENT_LABELS).map(([value, label]) => ({ value, label }));

  constructor(private inscriptionService: InscriptionService, private toastService: ToastService) {
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
}
