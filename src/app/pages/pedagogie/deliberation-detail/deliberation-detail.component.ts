import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { PageBreadcrumbComponent } from '../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { ComponentCardComponent } from '../../../shared/components/common/component-card/component-card.component';
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';
import { BadgeComponent } from '../../../shared/components/ui/badge/badge.component';
import { InputFieldComponent } from '../../../shared/components/form/input/input-field.component';
import { SelectComponent } from '../../../shared/components/form/select/select.component';
import { ConfirmDialogComponent } from '../../../shared/components/referentiel/confirm-dialog/confirm-dialog.component';
import { PedagogieService } from '../../../core/services/pedagogie.service';
import { InscriptionService } from '../../../core/services/inscription.service';
import { ToastService } from '../../../core/services/toast.service';
import { SelectOption } from '../../../core/models/referentiel-crud.models';
import {
  DECISION_DELIBERATION_LABELS,
  Deliberation,
  DeliberationDecision,
  DecisionDeliberation,
  MENTION_DELIBERATION_LABELS,
  MentionDeliberation,
  STATUT_DELIBERATION_LABELS
} from '../../../core/models/pedagogie.models';

// Une ligne éditable de la grille du jury - copie de travail de la DeliberationDecision reçue,
// jamais mutée directement sur l'objet API (permet d'annuler visuellement en rechargeant).
interface LigneDecision {
  decision: DeliberationDecision;
  eleveNomComplet: string;
  decisionChoisie: DecisionDeliberation | '';
  mentionChoisie: MentionDeliberation | '';
  observation: string;
  moyenneAjustee: number | null;
  motifAjustement: string;
  saving: boolean;
  erreur: string;
}

// Session de délibération (SADM/ADM uniquement, cf. roleGuard + DeliberationController) :
// affichage des moyennes, confirmation/override des décisions suggérées, ajustement manuel de
// moyenne avec motif obligatoire, clôture définitive. Toute la grille est VERROUILLÉE si la
// délibération n'est pas EN_COURS - même règle que le backend
// (DeliberationWorkflowService.confirmerDecision rejette hors EN_COURS), dupliquée ici pour que
// l'interface reflète l'état au lieu de laisser l'utilisateur découvrir l'erreur à l'enregistrement.
@Component({
  selector: 'app-deliberation-detail',
  imports: [
    PageBreadcrumbComponent,
    ComponentCardComponent,
    ButtonComponent,
    BadgeComponent,
    InputFieldComponent,
    SelectComponent,
    ConfirmDialogComponent
  ],
  templateUrl: './deliberation-detail.component.html'
})
export class DeliberationDetailComponent implements OnInit {
  deliberation: Deliberation | null = null;
  lignes: LigneDecision[] = [];
  loading = false;
  loadError = '';

  isConfirmClotureOpen = false;
  clotureError = '';
  cloturing = false;
  opening = false;

  readonly statutLabels = STATUT_DELIBERATION_LABELS;
  readonly decisionLabels = DECISION_DELIBERATION_LABELS;
  readonly mentionLabels = MENTION_DELIBERATION_LABELS;
  readonly decisionOptions: SelectOption[] = Object.entries(DECISION_DELIBERATION_LABELS).map(([value, label]) => ({ value, label }));
  readonly mentionOptions: SelectOption[] = Object.entries(MENTION_DELIBERATION_LABELS).map(([value, label]) => ({ value, label }));

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private pedagogieService: PedagogieService,
    private inscriptionService: InscriptionService,
    private toastService: ToastService
  ) {
  }

  ngOnInit(): void {
    const uuid = this.route.snapshot.paramMap.get('uuid');
    if (!uuid) {
      this.router.navigate(['/pedagogie/deliberations']);
      return;
    }
    this.load(uuid);
  }

  get estModifiable(): boolean {
    return this.deliberation?.statut === 'EN_COURS';
  }

  get estFinDAnnee(): boolean {
    return this.deliberation?.periodeId == null;
  }

  badgeColor(): 'success' | 'warning' | 'light' {
    if (this.deliberation?.statut === 'CLOTUREE') return 'success';
    if (this.deliberation?.statut === 'EN_COURS') return 'warning';
    return 'light';
  }

  private load(uuid: string): void {
    this.loading = true;
    this.loadError = '';
    this.pedagogieService.getDeliberation(uuid).subscribe({
      next: (deliberation) => {
        this.deliberation = deliberation;
        if (deliberation.statut === 'PLANIFIEE') {
          // Pas encore de décisions (elles sont créées à l'ouverture, cf.
          // DeliberationWorkflowService.ouvrir) - rien d'autre à charger.
          this.lignes = [];
          this.loading = false;
          return;
        }
        this.loadDecisions(deliberation);
      },
      error: (err) => {
        this.loading = false;
        this.loadError = 'Impossible de charger cette délibération.';
        this.toastService.error(err?.error?.message || this.loadError, 'Chargement impossible');
      }
    });
  }

  private loadDecisions(deliberation: Deliberation): void {
    forkJoin({
      decisions: this.pedagogieService.getDecisions(deliberation.uuid),
      inscriptions: this.inscriptionService.filterInscriptions(
        [
          { field: 'classeId', condition: 'eq', value: deliberation.classeId },
          { field: 'statut', condition: 'eq', value: 'VALIDEE' }
        ],
        { page: 1, size: 1000, sortField: 'id', sortOrder: 'ASC', filter: '' }
      )
    }).subscribe({
      next: ({ decisions, inscriptions }) => {
        this.lignes = decisions.map((decision) => ({
          decision,
          eleveNomComplet: inscriptions.content.find((i) => i.id === decision.inscriptionId)?.eleveNomComplet ?? `#${decision.inscriptionId}`,
          decisionChoisie: decision.decision ?? decision.decisionSuggeree ?? '',
          mentionChoisie: decision.mention ?? '',
          observation: decision.observation ?? '',
          moyenneAjustee: decision.moyenneAjustee,
          motifAjustement: decision.motifAjustement ?? '',
          saving: false,
          erreur: ''
        }));
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.loadError = 'Impossible de charger les décisions.';
        this.toastService.error(err?.error?.message || this.loadError, 'Chargement impossible');
      }
    });
  }

  ouvrir(): void {
    if (!this.deliberation) return;
    this.opening = true;
    this.pedagogieService.ouvrirDeliberation(this.deliberation.uuid).subscribe({
      next: () => {
        this.opening = false;
        this.toastService.success('Délibération ouverte avec succès.');
        this.load(this.deliberation!.uuid);
      },
      error: (err) => {
        this.opening = false;
        this.toastService.error(err?.error?.message || "Échec de l'ouverture.", "Échec de l'opération");
      }
    });
  }

  enregistrer(ligne: LigneDecision): void {
    if (!this.estModifiable) return;
    if (ligne.moyenneAjustee != null && !ligne.motifAjustement.trim()) {
      ligne.erreur = 'Un motif est obligatoire pour ajuster manuellement la moyenne.';
      return;
    }
    if (this.estFinDAnnee && !ligne.decisionChoisie) {
      ligne.erreur = "La décision est obligatoire pour une délibération de fin d'année.";
      return;
    }

    ligne.saving = true;
    ligne.erreur = '';
    this.pedagogieService
      .confirmerDecision(ligne.decision.uuid, {
        decision: ligne.decisionChoisie || null,
        mention: ligne.mentionChoisie || null,
        observation: ligne.observation.trim() || null,
        moyenneAjustee: ligne.moyenneAjustee,
        motifAjustement: ligne.moyenneAjustee != null ? ligne.motifAjustement.trim() : null
      })
      .subscribe({
        next: (decision) => {
          ligne.decision = decision;
          ligne.saving = false;
          this.toastService.success(`Décision enregistrée pour ${ligne.eleveNomComplet}.`);
        },
        error: (err) => {
          ligne.saving = false;
          ligne.erreur = err?.error?.message || "Échec de l'enregistrement de la décision.";
          this.toastService.error(ligne.erreur, "Échec de l'enregistrement");
        }
      });
  }

  setMoyenneAjustee(ligne: LigneDecision, value: string | number): void {
    ligne.moyenneAjustee = value === '' ? null : +value;
    if (ligne.moyenneAjustee == null) {
      ligne.motifAjustement = '';
    }
  }

  askCloturer(): void {
    this.clotureError = '';
    this.isConfirmClotureOpen = true;
  }

  cancelCloture(): void {
    this.isConfirmClotureOpen = false;
  }

  confirmCloture(): void {
    if (!this.deliberation) return;
    this.cloturing = true;
    this.clotureError = '';
    this.pedagogieService.cloturerDeliberation(this.deliberation.uuid).subscribe({
      next: (deliberation) => {
        this.cloturing = false;
        this.isConfirmClotureOpen = false;
        this.deliberation = deliberation;
        this.toastService.success('Délibération clôturée avec succès - les décisions sont désormais verrouillées.');
      },
      error: (err) => {
        this.cloturing = false;
        this.clotureError = err?.error?.message || 'Échec de la clôture.';
        this.toastService.error(this.clotureError, "Échec de l'opération");
      }
    });
  }

  retour(): void {
    this.router.navigate(['/pedagogie/deliberations']);
  }
}
