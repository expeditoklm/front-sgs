import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PageBreadcrumbComponent } from '../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { ComponentCardComponent } from '../../../shared/components/common/component-card/component-card.component';
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';
import { LabelComponent } from '../../../shared/components/form/label/label.component';
import { SelectComponent } from '../../../shared/components/form/select/select.component';
import { InputFieldComponent } from '../../../shared/components/form/input/input-field.component';
import { BadgeComponent } from '../../../shared/components/ui/badge/badge.component';
import { InscriptionService } from '../../../core/services/inscription.service';
import { ToastService } from '../../../core/services/toast.service';
import { downloadBlob } from '../../../core/helpers/download.helpers';
import { MetaResponse } from '../../../core/models/audit.models';
import { SelectOption } from '../../../core/models/referentiel-crud.models';
import {
  FilterCriteria,
  MODE_PAIEMENT_LABELS,
  Paiement,
  STATUT_PAIEMENT_LABELS,
  StatutPaiement
} from '../../../core/models/inscription.models';

@Component({
  selector: 'app-paiement-suivi',
  imports: [
    PageBreadcrumbComponent,
    ComponentCardComponent,
    ButtonComponent,
    LabelComponent,
    SelectComponent,
    InputFieldComponent,
    BadgeComponent
  ],
  templateUrl: './paiement-suivi.component.html'
})
export class PaiementSuiviComponent implements OnInit {
  rows: Paiement[] = [];
  meta: MetaResponse | null = null;
  page = 1;
  loading = false;
  listError = '';

  statutFilter = '';
  modeFilter = '';
  dateDebut = '';
  dateFin = '';

  confirmingUuid: string | null = null;
  downloadingUuid: string | null = null;

  readonly statutLabels = STATUT_PAIEMENT_LABELS;
  readonly modeLabels = MODE_PAIEMENT_LABELS;
  readonly statutOptions: SelectOption[] = Object.entries(STATUT_PAIEMENT_LABELS).map(([value, label]) => ({ value, label }));
  readonly modeOptions: SelectOption[] = Object.entries(MODE_PAIEMENT_LABELS).map(([value, label]) => ({ value, label }));

  constructor(
    private router: Router,
    private inscriptionService: InscriptionService,
    private toastService: ToastService
  ) {
  }

  ngOnInit(): void {
    this.load();
  }

  private buildFilters(): FilterCriteria[] {
    const filters: FilterCriteria[] = [];
    if (this.statutFilter) filters.push({ field: 'statut', condition: 'eq', value: this.statutFilter });
    if (this.modeFilter) filters.push({ field: 'mode', condition: 'eq', value: this.modeFilter });
    // datePaiement est un LocalDateTime comparé comme chaîne côté backend (cf.
    // FilterSpecification.applyFilters, GTE/LTE) - une date seule ("2026-01-31") est
    // lexicographiquement INFÉRIEURE à tout horodatage de ce même jour ("2026-01-31T14:00"),
    // donc une borne de fin en LTE exclurait la journée entière sans l'heure de fin de journée.
    if (this.dateDebut) filters.push({ field: 'datePaiement', condition: 'gte', value: `${this.dateDebut}T00:00:00` });
    if (this.dateFin) filters.push({ field: 'datePaiement', condition: 'lte', value: `${this.dateFin}T23:59:59` });
    return filters;
  }

  load(): void {
    this.loading = true;
    this.listError = '';
    this.inscriptionService
      .filterPaiements(this.buildFilters(), { page: this.page, size: 10, sortField: 'id', sortOrder: 'DESC', filter: '' })
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
          this.listError = 'Impossible de charger les paiements.';
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
    this.modeFilter = '';
    this.dateDebut = '';
    this.dateFin = '';
    this.search();
  }

  goToPage(page: number): void {
    if (page < 1 || (this.meta && page > this.meta.totalPages)) {
      return;
    }
    this.page = page;
    this.load();
  }

  formatDate(datePaiement: string): string {
    return datePaiement.slice(0, 16).replace('T', ' ');
  }

  badgeColor(statut: StatutPaiement): 'success' | 'error' | 'warning' | 'light' {
    if (statut === 'CONFIRME') return 'success';
    if (statut === 'ECHOUE') return 'error';
    if (statut === 'EN_ATTENTE') return 'warning';
    return 'light';
  }

  openDossier(row: Paiement): void {
    this.router.navigate(['/inscriptions/eleves', row.eleveUuid]);
  }

  confirmer(row: Paiement): void {
    this.confirmingUuid = row.uuid;
    this.inscriptionService.confirmerPaiement(row.uuid).subscribe({
      next: () => {
        this.confirmingUuid = null;
        this.toastService.success('Paiement confirmé avec succès.');
        this.load();
      },
      error: (err) => {
        this.confirmingUuid = null;
        this.toastService.error(err?.error?.message || 'Échec de la confirmation.', "Échec de l'opération");
      }
    });
  }

  telechargerRecu(row: Paiement): void {
    this.downloadingUuid = row.uuid;
    this.inscriptionService.telechargerRecu(row.uuid).subscribe({
      next: (blob) => {
        this.downloadingUuid = null;
        downloadBlob(blob, `recu-${row.numeroRecu ?? row.uuid}.pdf`);
      },
      error: (err) => {
        this.downloadingUuid = null;
        this.toastService.error(err?.error?.message || 'Échec du téléchargement du reçu.');
      }
    });
  }
}
