import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PersonnelService } from '../../../core/services/personnel.service';
import { CritereEvaluationConfig, GrilleEvaluationConfig, GrilleEvaluationPayload } from '../../../core/models/personnel.models';
import { ToastService } from '../../../core/services/toast.service';
import { PageBreadcrumbComponent } from '../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { ModalComponent } from '../../../shared/components/ui/modal/modal.component';
import { PaginationComponent } from '../../../shared/components/ui/pagination/pagination.component';
import { ConfirmDialogComponent } from '../../../shared/components/referentiel/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-grilles-evaluation',
  imports: [CommonModule, FormsModule, PageBreadcrumbComponent, ModalComponent, PaginationComponent, ConfirmDialogComponent],
  templateUrl: './grilles-evaluation.component.html'
})
export class GrillesEvaluationComponent implements OnInit {
  grilles: GrilleEvaluationConfig[] = [];
  recherche = '';
  chargement = false;
  page = 1;
  taillePage = 5;

  formulaireOuvert = false;
  grilleUuid: string | undefined;
  modele: GrilleEvaluationPayload = this.modeleVide();
  erreurFormulaire = '';
  confirmationOuverte = false;
  confirmationTitre = '';
  confirmationMessage = '';
  confirmationErreur = '';
  traitement = false;
  actionConfirmee: (() => void) | null = null;

  constructor(private personnel: PersonnelService, private toast: ToastService) {}

  ngOnInit(): void { this.charger(); }

  get filtrees(): GrilleEvaluationConfig[] {
    const q = this.recherche.trim().toLowerCase();
    return q ? this.grilles.filter(g => `${g.code} ${g.libelle}`.toLowerCase().includes(q)) : this.grilles;
  }

  get totalPages(): number { return Math.max(1, Math.ceil(this.filtrees.length / this.taillePage)); }
  get pageCourante(): GrilleEvaluationConfig[] {
    const pageValide = Math.min(this.page, this.totalPages);
    const debut = (pageValide - 1) * this.taillePage;
    return this.filtrees.slice(debut, debut + this.taillePage);
  }

  coefficientTotal(grille: GrilleEvaluationConfig): number {
    return grille.criteres.reduce((total, critere) => total + Number(critere.coefficient || 0), 0);
  }

  charger(): void {
    this.chargement = true;
    this.personnel.grillesEvaluationAdministration().subscribe({
      next: grilles => { this.grilles = grilles; this.chargement = false; },
      error: err => { this.chargement = false; this.toast.error(err?.error?.message || 'Impossible de charger les grilles d’évaluation.', 'Chargement impossible'); }
    });
  }

  nouvelle(): void {
    this.grilleUuid = undefined;
    this.modele = this.modeleVide();
    this.erreurFormulaire = '';
    this.formulaireOuvert = true;
  }

  modifier(grille: GrilleEvaluationConfig): void {
    this.grilleUuid = grille.uuid;
    this.modele = {
      code: grille.code,
      libelle: grille.libelle,
      criteres: grille.criteres.map(c => ({ ...c }))
    };
    this.erreurFormulaire = '';
    this.formulaireOuvert = true;
  }

  ajouterCritere(): void {
    const prochain = this.modele.criteres.length ? Math.max(...this.modele.criteres.map(c => Number(c.ordre) || 0)) + 1 : 1;
    this.modele.criteres.push({ code: '', libelle: '', coefficient: 1, ordre: prochain });
  }

  retirerCritere(index: number): void {
    if (this.modele.criteres.length === 1) { this.erreurFormulaire = 'Une grille doit conserver au moins un critère.'; return; }
    this.modele.criteres.splice(index, 1);
  }

  demanderEnregistrement(): void {
    this.erreurFormulaire = this.valider();
    if (this.erreurFormulaire) return;
    this.ouvrirConfirmation(
      this.grilleUuid ? 'Confirmer la modification' : 'Confirmer la création',
      `Voulez-vous enregistrer la grille « ${this.modele.libelle.trim()} » et ses ${this.modele.criteres.length} critère(s) ?`,
      () => this.enregistrer()
    );
  }

  demanderEtat(grille: GrilleEvaluationConfig): void {
    this.ouvrirConfirmation(
      grille.actif ? 'Désactiver la grille' : 'Réactiver la grille',
      grille.actif
        ? `La grille « ${grille.libelle} » ne sera plus proposée pour les nouvelles évaluations.`
        : `La grille « ${grille.libelle} » sera de nouveau proposée aux évaluateurs.`,
      () => this.changerEtat(grille)
    );
  }

  confirmer(): void { this.actionConfirmee?.(); }
  annulerConfirmation(): void { if (!this.traitement) { this.confirmationOuverte = false; this.actionConfirmee = null; } }
  allerPage(page: number): void { this.page = page; }
  changerTaille(taille: number): void { this.taillePage = taille; this.page = 1; }
  rechercher(): void { this.page = 1; }

  private enregistrer(): void {
    this.traitement = true;
    const payload: GrilleEvaluationPayload = {
      code: this.modele.code.trim().toUpperCase(),
      libelle: this.modele.libelle.trim(),
      criteres: this.modele.criteres.map(c => ({ ...c, code: c.code.trim().toUpperCase(), libelle: c.libelle.trim(), coefficient: Number(c.coefficient), ordre: Number(c.ordre) }))
    };
    this.personnel.enregistrerGrilleEvaluation(payload, this.grilleUuid).subscribe({
      next: () => { this.traitement = false; this.confirmationOuverte = false; this.formulaireOuvert = false; this.toast.success('Grille d’évaluation enregistrée.'); this.charger(); },
      error: err => { this.traitement = false; this.confirmationErreur = err?.error?.message || 'Enregistrement impossible.'; }
    });
  }

  private changerEtat(grille: GrilleEvaluationConfig): void {
    this.traitement = true;
    this.personnel.changerEtatGrilleEvaluation(grille.uuid).subscribe({
      next: () => { this.traitement = false; this.confirmationOuverte = false; this.toast.success(grille.actif ? 'Grille désactivée.' : 'Grille réactivée.'); this.charger(); },
      error: err => { this.traitement = false; this.confirmationErreur = err?.error?.message || 'Modification impossible.'; }
    });
  }

  private ouvrirConfirmation(titre: string, message: string, action: () => void): void {
    this.confirmationTitre = titre;
    this.confirmationMessage = message;
    this.confirmationErreur = '';
    this.actionConfirmee = action;
    this.confirmationOuverte = true;
  }

  private valider(): string {
    if (!this.modele.code.trim() || !this.modele.libelle.trim()) return 'Le code et le libellé de la grille sont obligatoires.';
    if (!this.modele.criteres.length) return 'Ajoutez au moins un critère.';
    const codes = new Set<string>();
    const ordres = new Set<number>();
    for (const critere of this.modele.criteres) {
      const code = critere.code.trim().toUpperCase();
      const ordre = Number(critere.ordre);
      if (!code || !critere.libelle.trim()) return 'Le code et le libellé de chaque critère sont obligatoires.';
      if (codes.has(code)) return `Le code de critère ${code} est utilisé plusieurs fois.`;
      if (!Number.isInteger(ordre) || ordre < 1 || ordres.has(ordre)) return 'Les ordres doivent être des entiers positifs et uniques.';
      if (!(Number(critere.coefficient) > 0)) return 'Chaque coefficient doit être supérieur à zéro.';
      codes.add(code); ordres.add(ordre);
    }
    return '';
  }

  private modeleVide(): GrilleEvaluationPayload {
    return { code: '', libelle: '', criteres: [{ code: '', libelle: '', coefficient: 1, ordre: 1 }] };
  }
}
