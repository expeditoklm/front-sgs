import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
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
import {
  Evaluation,
  NoteCorrection,
  NoteLotItem,
  STATUT_EVALUATION_LABELS,
  TYPE_EVALUATION_LABELS
} from '../../../core/models/pedagogie.models';

interface GridRow {
  inscriptionUuid: string;
  inscriptionId: number;
  noteUuid: string | null;
  eleveNomComplet: string;
  valeur: number | null;
  absent: boolean;
  appreciation: string;
  valeurInitiale: number | null;
  absentInitial: boolean;
  appreciationInitiale: string;
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
  evaluation: Evaluation | null = null;
  rows: GridRow[] = [];
  corrections: NoteCorrection[] = [];
  motifCorrection = '';
  decisionComments: Record<string, string> = {};
  loading = false;
  loadError = '';
  saving = false;
  publishing = false;
  processingCorrectionUuid: string | null = null;

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

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.rows.length / this.pageSize));
  }

  get isAdministration(): boolean {
    return this.authService.hasAnyRole(['SADM', 'ADM']);
  }

  get gridEditable(): boolean {
    return this.evaluation?.statut === 'BROUILLON'
      || (this.evaluation?.statut === 'PUBLIEE' && this.isAdministration);
  }

  get canPublier(): boolean {
    return this.evaluation?.statut === 'BROUILLON';
  }

  get isPublished(): boolean {
    return this.evaluation?.statut === 'PUBLIEE';
  }

  get pendingCorrections(): number {
    return this.corrections.filter((correction) => correction.statut === 'EN_ATTENTE').length;
  }

  changePage(page: number): void {
    this.page = Math.min(Math.max(page, 1), this.totalPages);
  }

  changePageSize(pageSize: number): void {
    this.pageSize = pageSize;
    this.page = 1;
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
      notes: this.pedagogieService.getNotesByEvaluation(evaluation.uuid),
      corrections: evaluation.statut === 'PUBLIEE'
        ? this.pedagogieService.getNoteCorrections(evaluation.uuid)
        : of([])
    }).subscribe({
      next: ({ inscriptions, notes, corrections }) => {
        this.rows = inscriptions.content.map((inscription) => {
          const note = notes.find((item) => item.inscriptionId === inscription.id);
          const valeur = note?.valeur ?? null;
          const absent = note?.absent ?? false;
          const appreciation = note?.appreciation ?? '';
          return {
            inscriptionUuid: inscription.uuid,
            inscriptionId: inscription.id,
            noteUuid: note?.uuid ?? null,
            eleveNomComplet: inscription.eleveNomComplet,
            valeur,
            absent,
            appreciation,
            valeurInitiale: valeur,
            absentInitial: absent,
            appreciationInitiale: appreciation
          };
        });
        this.corrections = corrections;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.loadError = "Impossible de charger l'effectif ou les demandes de correction.";
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
    if (this.isPublished) {
      this.demanderCorrection();
      return;
    }

    this.saving = true;
    this.rows.forEach((row) => (row.erreur = undefined));
    this.pedagogieService.saisirNotesEnLot({
      evaluationUuid: this.evaluation.uuid,
      notes: this.rows.map((row) => this.toNoteLotItem(row))
    }).subscribe({
      next: (response) => {
        this.saving = false;
        response.erreurs.forEach((erreur) => {
          const row = this.rows.find((item) => item.inscriptionUuid === erreur.inscriptionUuid);
          if (row) row.erreur = erreur.message;
        });
        if (response.erreurs.length === 0) {
          this.toastService.success(`${response.enregistrees}/${response.total} note(s) enregistrée(s) avec succès.`);
          this.loadRoster(this.evaluation!);
        } else {
          this.toastService.warning(
            `${response.enregistrees}/${response.total} note(s) enregistrée(s) - ${response.erreurs.length} ligne(s) en erreur.`,
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

  private demanderCorrection(): void {
    if (!this.evaluation) return;
    const motif = this.motifCorrection.trim();
    if (!motif) {
      this.toastService.warning('Expliquez la raison de la correction avant de la soumettre.', 'Motif obligatoire');
      return;
    }

    const changedRows = this.rows.filter((row) => this.rowChanged(row));
    if (changedRows.length === 0) {
      this.toastService.warning('Aucune note publiée n’a été modifiée.');
      return;
    }

    this.saving = true;
    this.pedagogieService.demanderCorrectionNotes({
      evaluationUuid: this.evaluation.uuid,
      motif,
      notes: changedRows.map((row) => this.toNoteLotItem(row))
    }).subscribe({
      next: (created) => {
        this.saving = false;
        this.motifCorrection = '';
        this.toastService.success(
          `${created.length} demande(s) transmise(s) à l’enseignant. Les notes officielles restent inchangées jusqu’à son approbation.`
        );
        this.loadRoster(this.evaluation!);
      },
      error: (err) => {
        this.saving = false;
        this.toastService.error(err?.error?.message || 'Impossible de soumettre la demande.', 'Demande non transmise');
      }
    });
  }

  approuver(correction: NoteCorrection): void {
    this.decider(correction, true);
  }

  rejeter(correction: NoteCorrection): void {
    this.decider(correction, false);
  }

  private decider(correction: NoteCorrection, approuver: boolean): void {
    if (!this.evaluation || correction.statut !== 'EN_ATTENTE') return;
    this.processingCorrectionUuid = correction.uuid;
    const commentaire = this.decisionComments[correction.uuid]?.trim() || null;
    const request = approuver
      ? this.pedagogieService.approuverCorrectionNote(correction.uuid, commentaire)
      : this.pedagogieService.rejeterCorrectionNote(correction.uuid, commentaire);

    request.subscribe({
      next: () => {
        this.processingCorrectionUuid = null;
        this.toastService.success(
          approuver
            ? 'Correction approuvée : la note officielle et les moyennes ont été mises à jour.'
            : 'Correction rejetée : la note officielle reste inchangée.'
        );
        this.loadRoster(this.evaluation!);
      },
      error: (err) => {
        this.processingCorrectionUuid = null;
        this.toastService.error(err?.error?.message || 'Impossible de traiter cette demande.', 'Décision non enregistrée');
      }
    });
  }

  studentName(inscriptionId: number): string {
    return this.rows.find((row) => row.inscriptionId === inscriptionId)?.eleveNomComplet
      || `Inscription ${inscriptionId}`;
  }

  correctionValue(value: number | null, absent: boolean): string {
    return absent ? 'Absent(e)' : value == null ? 'Non noté(e)' : `${value}/${this.evaluation?.bareme ?? 20}`;
  }

  statusLabel(status: NoteCorrection['statut']): string {
    return {
      EN_ATTENTE: 'En attente de l’enseignant',
      APPROUVEE: 'Approuvée',
      REJETEE: 'Rejetée'
    }[status];
  }

  private rowChanged(row: GridRow): boolean {
    return row.valeur !== row.valeurInitiale
      || row.absent !== row.absentInitial
      || row.appreciation.trim() !== row.appreciationInitiale.trim();
  }

  private toNoteLotItem(row: GridRow): NoteLotItem {
    return {
      inscriptionUuid: row.inscriptionUuid,
      valeur: row.absent ? null : row.valeur,
      absent: row.absent,
      appreciation: row.appreciation.trim() || null
    };
  }

  publier(): void {
    if (!this.evaluation) return;
    this.publishing = true;
    this.pedagogieService.publierEvaluation(this.evaluation.uuid).subscribe({
      next: (evaluation) => {
        this.evaluation = evaluation;
        this.publishing = false;
        this.toastService.success('Évaluation publiée avec succès - les moyennes ont été recalculées.');
        this.loadRoster(evaluation);
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
