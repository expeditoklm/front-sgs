import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { PageBreadcrumbComponent } from '../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { ComponentCardComponent } from '../../../shared/components/common/component-card/component-card.component';
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';
import { BadgeComponent } from '../../../shared/components/ui/badge/badge.component';
import { InputFieldComponent } from '../../../shared/components/form/input/input-field.component';
import { CheckboxComponent } from '../../../shared/components/form/input/checkbox.component';
import { PedagogieService } from '../../../core/services/pedagogie.service';
import { InscriptionService } from '../../../core/services/inscription.service';
import { AuthenticationService } from '../../../core/services/authentication.service';
import { PaginationComponent } from '../../../shared/components/ui/pagination/pagination.component';
import { PaginatePipe } from '../../../shared/pipes/paginate.pipe';
import { ToastService } from '../../../core/services/toast.service';
import { ReferentielCrudService } from '../../../core/services/referentiel-crud.service';
import { Evaluation, NoteLotItem, STATUT_EVALUATION_LABELS, TYPE_EVALUATION_LABELS } from '../../../core/models/pedagogie.models';

// Une ligne de la grille = un élève de la classe (roster récupéré via
// InscriptionService.filterInscriptions, filtré sur classeId + statut VALIDEE - même pattern que
// DeliberationWorkflowService.recupererInscriptionsValideesDeLaClasse côté backend), pré-remplie
// avec sa note existante le cas échéant (cf. PedagogieService.getNotesByEvaluation).
interface GridRow {
  inscriptionUuid: string;
  inscriptionId: number;
  eleveNomComplet: string;
  valeur: number | null;
  absent: boolean;
  appreciation: string;
  erreur?: string;
}

@Component({
  selector: 'app-saisie-notes',
  imports: [
    PageBreadcrumbComponent,
    ComponentCardComponent,
    ButtonComponent,
    BadgeComponent,
    InputFieldComponent,
    CheckboxComponent,
    PaginationComponent,
    PaginatePipe
  ],
  templateUrl: './saisie-notes.component.html',
  host: { class: 'sgs-dark-view block' }
})
export class SaisieNotesComponent implements OnInit {
  page = 1;
  pageSize = 10;
  get totalPages(): number { return Math.max(1, Math.ceil(this.rows.length / this.pageSize)); }
  changePage(page: number): void { this.page = Math.min(Math.max(page, 1), this.totalPages); }
  changePageSize(pageSize: number): void { this.pageSize = pageSize; this.page = 1; }
  evaluation: Evaluation | null = null;
  rows: GridRow[] = [];
  loading = false;
  loadError = '';
  saving = false;
  publishing = false;

  readonly statutLabels = STATUT_EVALUATION_LABELS;
  typeLabels: Record<string, string> = { ...TYPE_EVALUATION_LABELS };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private pedagogieService: PedagogieService,
    private inscriptionService: InscriptionService,
    private referentielCrudService: ReferentielCrudService,
    public authService: AuthenticationService,
    private toastService: ToastService
  ) {
  }

  ngOnInit(): void {
    this.referentielCrudService.businessParameterOptions('TYPE_EVALUATION').subscribe({
      next: (items) => (this.typeLabels = Object.fromEntries(items.map((item) => [item.code, item.libelle])))
    });
    const uuid = this.route.snapshot.paramMap.get('uuid');
    if (!uuid) {
      this.router.navigate(['/pedagogie/evaluations']);
      return;
    }
    this.load(uuid);
  }

  // Une évaluation publiée reste modifiable seulement par SADM/ADM (correction a posteriori, cf.
  // NoteService.update côté backend) - un ENS ne peut plus saisir/corriger une fois publiée.
  get gridEditable(): boolean {
    return this.evaluation?.statut === 'BROUILLON' || this.authService.hasAnyRole(['SADM', 'ADM']);
  }

  get canPublier(): boolean {
    return this.evaluation?.statut === 'BROUILLON';
  }

  private load(evaluationUuid: string): void {
    this.loading = true;
    this.loadError = '';
    this.pedagogieService.getEvaluation(evaluationUuid).subscribe({
      next: (evaluation) => {
        this.evaluation = evaluation;
        this.loadRoster(evaluation);
      },
      error: (err) => {
        this.loading = false;
        this.loadError = 'Impossible de charger cette évaluation.';
        this.toastService.error(err?.error?.message || this.loadError, 'Chargement impossible');
      }
    });
  }

  private loadRoster(evaluation: Evaluation): void {
    forkJoin({
      inscriptions: this.inscriptionService.filterInscriptions(
        [
          { field: 'classeId', condition: 'eq', value: evaluation.classeId },
          { field: 'statut', condition: 'eq', value: 'VALIDEE' }
        ],
        { page: 1, size: 1000, sortField: 'id', sortOrder: 'ASC', filter: '' }
      ),
      notes: this.pedagogieService.getNotesByEvaluation(evaluation.uuid)
    }).subscribe({
      next: ({ inscriptions, notes }) => {
        this.rows = inscriptions.content.map((inscription) => {
          const note = notes.find((n) => n.inscriptionId === inscription.id);
          return {
            inscriptionUuid: inscription.uuid,
            inscriptionId: inscription.id,
            eleveNomComplet: inscription.eleveNomComplet,
            valeur: note?.valeur ?? null,
            absent: note?.absent ?? false,
            appreciation: note?.appreciation ?? ''
          };
        });
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.loadError = "Impossible de charger l'effectif de la classe.";
        this.toastService.error(err?.error?.message || this.loadError, 'Chargement impossible');
      }
    });
  }

  setValeur(row: GridRow, value: string | number): void {
    row.valeur = value === '' ? null : +value;
  }

  setAbsent(row: GridRow, absent: boolean): void {
    row.absent = absent;
    if (absent) {
      row.valeur = null;
    }
  }

  setAppreciation(row: GridRow, value: string): void {
    row.appreciation = value;
  }

  enregistrer(): void {
    if (!this.evaluation) return;

    this.saving = true;
    this.rows.forEach((row) => (row.erreur = undefined));

    const notes: NoteLotItem[] = this.rows.map((row) => ({
      inscriptionUuid: row.inscriptionUuid,
      valeur: row.absent ? null : row.valeur,
      absent: row.absent,
      appreciation: row.appreciation || null
    }));

    this.pedagogieService.saisirNotesEnLot({ evaluationUuid: this.evaluation.uuid, notes }).subscribe({
      next: (response) => {
        this.saving = false;
        response.erreurs.forEach((erreur) => {
          const row = this.rows.find((r) => r.inscriptionUuid === erreur.inscriptionUuid);
          if (row) {
            row.erreur = erreur.message;
          }
        });
        if (response.erreurs.length === 0) {
          this.toastService.success(`${response.enregistrees}/${response.total} note(s) enregistrée(s) avec succès.`);
        } else {
          this.toastService.warning(
            `${response.enregistrees}/${response.total} note(s) enregistrée(s) - ${response.erreurs.length} ligne(s) en erreur (voir le détail sous chaque ligne concernée).`,
            'Enregistrement partiel'
          );
        }
      },
      error: (err) => {
        this.saving = false;
        this.toastService.error(err?.error?.message || "Échec de l'enregistrement des notes.", "Échec de l'enregistrement");
      }
    });
  }

  publier(): void {
    if (!this.evaluation) return;
    this.publishing = true;
    this.pedagogieService.publierEvaluation(this.evaluation.uuid).subscribe({
      next: (evaluation) => {
        this.evaluation = evaluation;
        this.publishing = false;
        this.toastService.success('Évaluation publiée avec succès - les moyennes ont été recalculées.');
      },
      error: (err) => {
        this.publishing = false;
        this.toastService.error(err?.error?.message || 'Échec de la publication.', "Échec de l'opération");
      }
    });
  }

  retour(): void {
    this.router.navigate(['/pedagogie/evaluations']);
  }
}
