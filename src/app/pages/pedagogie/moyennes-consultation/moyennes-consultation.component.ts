import { Component, OnInit } from '@angular/core';
import { PageBreadcrumbComponent } from '../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { ComponentCardComponent } from '../../../shared/components/common/component-card/component-card.component';
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';
import { LabelComponent } from '../../../shared/components/form/label/label.component';
import { SelectComponent } from '../../../shared/components/form/select/select.component';
import { PedagogieService } from '../../../core/services/pedagogie.service';
import { InscriptionService } from '../../../core/services/inscription.service';
import { ReferentielCrudService } from '../../../core/services/referentiel-crud.service';
import { ToastService } from '../../../core/services/toast.service';
import { SelectOption } from '../../../core/models/referentiel-crud.models';
import { Inscription } from '../../../core/models/inscription.models';
import { MoyenneGenerale, MoyenneMatiere } from '../../../core/models/pedagogie.models';
import { PaginationComponent } from '../../../shared/components/ui/pagination/pagination.component';
import { PaginatePipe } from '../../../shared/pipes/paginate.pipe';

type ConsultationTab = 'eleve' | 'classe';

interface LigneClasse {
  inscriptionId: number;
  eleveNomComplet: string;
  valeur: number;
  rangClasse: number | null;
}

// Consultation en lecture seule des notes/moyennes - ouverte à tous les rôles pédagogie
// (ENS/SEC/SADM/ADM/PAR/ELV, cf. MoyenneController @PreAuthorize). PAR/ELV ne devraient voir que
// leurs propres enfants/eux-mêmes - restriction fine par ressource non câblée côté backend
// (lacune transverse déjà documentée dans MODULE_PEDAGOGIE.md section 8), donc pas davantage
// gérée ici : le filtre élève reste un simple select sur tout l'effectif de la classe.
@Component({
  selector: 'app-moyennes-consultation',
  imports: [
    PageBreadcrumbComponent,
    ComponentCardComponent,
    ButtonComponent,
    LabelComponent,
    SelectComponent,
    PaginationComponent,
    PaginatePipe
  ],
  templateUrl: './moyennes-consultation.component.html',
  host: { class: 'sgs-dark-view block' }
})
export class MoyennesConsultationComponent implements OnInit {
  pageMatieres = 1;
  pagePalmares = 1;
  pageSize = 10;
  totalPages(liste: unknown[]): number { return Math.max(1, Math.ceil(liste.length / this.pageSize)); }
  changePage(type: 'matieres' | 'palmares', page: number, liste: unknown[]): void {
    const value = Math.min(Math.max(page, 1), this.totalPages(liste));
    type === 'matieres' ? this.pageMatieres = value : this.pagePalmares = value;
  }
  changePageSize(pageSize: number): void { this.pageSize = pageSize; this.pageMatieres = 1; this.pagePalmares = 1; }
  activeTab: ConsultationTab = 'eleve';

  classeOptions: SelectOption[] = [];
  periodeOptions: SelectOption[] = [];
  eleveOptions: SelectOption[] = [];
  matiereLabels: Record<number, string> = {};

  classeId = '';
  periodeId = '';
  inscriptionId = '';

  private roster: Inscription[] = [];
  private loadingRoster = false;

  // --- Onglet "par élève" ---
  moyennesMatiere: MoyenneMatiere[] = [];
  moyenneGenerale: MoyenneGenerale | null = null;
  loadingEleve = false;
  eleveError = '';
  rechercheEleveEffectuee = false;

  // --- Onglet "par classe" ---
  palmares: LigneClasse[] = [];
  loadingClasse = false;
  classeError = '';
  rechercheClasseEffectuee = false;

  constructor(
    private pedagogieService: PedagogieService,
    private inscriptionService: InscriptionService,
    private referentielCrudService: ReferentielCrudService,
    private toastService: ToastService
  ) {
  }

  ngOnInit(): void {
    this.referentielCrudService
      .list('classes', { page: 1, size: 200, sortField: 'id', sortOrder: 'ASC', filter: '' })
      .subscribe({
        next: (page) => (this.classeOptions = page.content.map((item) => ({ value: String(item['id']), label: `${item['libelle']} (${item['anneeScolaireCode']})` }))),
        error: () => (this.classeOptions = [])
      });
    this.referentielCrudService
      .list('periodes', { page: 1, size: 200, sortField: 'ordre', sortOrder: 'ASC', filter: '' })
      .subscribe({
        next: (page) => (this.periodeOptions = page.content.map((item) => ({ value: String(item['id']), label: `${item['libelle']} (${item['anneeScolaireCode']})` }))),
        error: () => (this.periodeOptions = [])
      });
    this.referentielCrudService
      .list('matieres', { page: 1, size: 200, sortField: 'id', sortOrder: 'ASC', filter: '' })
      .subscribe({
        next: (page) => (this.matiereLabels = Object.fromEntries(page.content.map((item) => [item['id'], item['libelle']]))),
        error: () => (this.matiereLabels = {})
      });
  }

  selectTab(tab: ConsultationTab): void {
    this.activeTab = tab;
  }

  matiereLabel(matiereId: number): string {
    return this.matiereLabels[matiereId] ?? `#${matiereId}`;
  }

  onClasseChange(value: string): void {
    this.classeId = value;
    this.inscriptionId = '';
    this.eleveOptions = [];
    this.roster = [];
    if (!this.classeId) return;

    this.loadingRoster = true;
    this.inscriptionService
      .filterInscriptions(
        [
          { field: 'classeId', condition: 'eq', value: +this.classeId },
          { field: 'statut', condition: 'eq', value: 'VALIDEE' }
        ],
        { page: 1, size: 1000, sortField: 'id', sortOrder: 'ASC', filter: '' }
      )
      .subscribe({
        next: (page) => {
          this.roster = page.content;
          this.eleveOptions = page.content.map((i) => ({ value: String(i.id), label: i.eleveNomComplet }));
          this.loadingRoster = false;
        },
        error: () => {
          this.roster = [];
          this.eleveOptions = [];
          this.loadingRoster = false;
        }
      });
  }

  rechercherEleve(): void {
    if (!this.inscriptionId || !this.periodeId) {
      this.eleveError = 'Classe, élève et période sont obligatoires.';
      return;
    }

    this.loadingEleve = true;
    this.eleveError = '';
    this.rechercheEleveEffectuee = true;
    const inscriptionId = +this.inscriptionId;
    const periodeId = +this.periodeId;

    this.pedagogieService.getMoyennesMatiere(inscriptionId, periodeId).subscribe({
      next: (moyennes) => {
        this.moyennesMatiere = moyennes;
        this.loadingEleve = false;
      },
      error: (err) => {
        this.moyennesMatiere = [];
        this.loadingEleve = false;
        this.eleveError = err?.error?.message || 'Impossible de charger les moyennes par matière.';
        this.toastService.error(this.eleveError, 'Chargement impossible');
      }
    });

    this.pedagogieService.getMoyenneGenerale(inscriptionId, periodeId).subscribe({
      next: (moyenne) => (this.moyenneGenerale = moyenne),
      error: () => (this.moyenneGenerale = null)
    });
  }

  rechercherClasse(): void {
    if (!this.classeId || !this.periodeId) {
      this.classeError = 'Classe et période sont obligatoires.';
      return;
    }

    this.loadingClasse = true;
    this.classeError = '';
    this.rechercheClasseEffectuee = true;
    const classeId = +this.classeId;
    const periodeId = +this.periodeId;

    // Le palmarès (backend) ne renvoie que inscriptionId/valeur/rang - le nom de l'élève est
    // résolu ici depuis le roster déjà chargé par onClasseChange, même pattern que la grille de
    // saisie des notes (fusion côté frontend plutôt qu'un enrichissement côté backend).
    this.pedagogieService.getMoyennesGeneralesClasse(classeId, periodeId).subscribe({
      next: (moyennes) => {
        this.palmares = moyennes.map((m) => ({
          inscriptionId: m.inscriptionId,
          eleveNomComplet: this.roster.find((i) => i.id === m.inscriptionId)?.eleveNomComplet ?? `#${m.inscriptionId}`,
          valeur: m.valeur,
          rangClasse: m.rangClasse
        }));
        this.loadingClasse = false;
      },
      error: (err) => {
        this.palmares = [];
        this.loadingClasse = false;
        this.classeError = err?.error?.message || 'Impossible de charger le palmarès de la classe.';
        this.toastService.error(this.classeError, 'Chargement impossible');
      }
    });
  }
}
