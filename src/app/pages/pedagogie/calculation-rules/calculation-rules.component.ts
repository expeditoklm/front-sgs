import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PageBreadcrumbComponent } from '../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { ModalComponent } from '../../../shared/components/ui/modal/modal.component';
import { ConfirmDialogComponent } from '../../../shared/components/referentiel/confirm-dialog/confirm-dialog.component';
import { PaginationComponent } from '../../../shared/components/ui/pagination/pagination.component';
import { ToastService } from '../../../core/services/toast.service';
import { PedagogieService } from '../../../core/services/pedagogie.service';
import {
  CalculationRule,
  CalculationRuleOption,
  CalculationRuleOptions,
  CalculationRulePayload,
  RuleComponent
} from '../../../core/models/pedagogie.models';

@Component({
  selector: 'app-calculation-rules',
  standalone: true,
  imports: [CommonModule, FormsModule, PageBreadcrumbComponent, ModalComponent, ConfirmDialogComponent, PaginationComponent],
  templateUrl: './calculation-rules.component.html'
})
export class CalculationRulesComponent implements OnInit {
  rules: CalculationRule[] = [];
  loading = false;
  search = '';
  page = 1;
  pageSize = 8;
  modalOpen = false;
  editId: number | null = null;
  payload: CalculationRulePayload = {
    rule: {
      code: '',
      libelle: '',
      description: '',
      scopeType: 'ETABLISSEMENT',
      scopeId: null,
      etablissementId: null,
      niveauId: null,
      classeId: null,
      matiereId: null,
      periodeId: null,
      enseignantId: null,
      templateCode: 'DEFAULT_WEIGHTED_EVALUATION',
      configJson: '{"noteScale":20}',
      version: 1,
      statut: 'BROUILLON',
      anneeScolaireId: null,
      dateDebut: null,
      dateFin: null,
      actif: false
    },
    components: [{
      label: 'Moyenne principale',
      method: 'WEIGHTED_AVERAGE',
      weight: 1,
      minNotes: null,
      dropLowest: false,
      onlyBest: false,
      gradeScale: 20,
      sortOrder: 1
    }]
  };
  componentsView: RuleComponent[] = [];
  confirmationOpen = false;
  confirmationTitle = '';
  confirmationMessage = '';
  action: (() => void) | null = null;
  options: CalculationRuleOptions = {
    categories: [],
    etablissements: [],
    annees: [],
    niveaux: [],
    classes: [],
    matieres: [],
    periodes: [],
    enseignants: [],
    teacher: false,
    superAdmin: false
  };

  constructor(private pedagogie: PedagogieService, private toast: ToastService) {}

  ngOnInit(): void {
    this.load();
    this.loadOptions();
  }

  get filtered(): CalculationRule[] {
    const q = this.search.trim().toLowerCase();
    return q ? this.rules.filter(rule => `${rule.code} ${rule.libelle} ${rule.templateCode}`.toLowerCase().includes(q)) : this.rules;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filtered.length / this.pageSize));
  }

  get currentPage(): CalculationRule[] {
    const start = (Math.min(this.page, this.totalPages) - 1) * this.pageSize;
    return this.filtered.slice(start, start + this.pageSize);
  }

  load(): void {
    this.loading = true;
    this.pedagogie.getCalculationRules().subscribe({
      next: (rules) => {
        this.rules = rules;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toast.error('Impossible de charger les règles de calcul.', 'Chargement impossible');
      }
    });
  }

  loadOptions(): void {
    this.pedagogie.getCalculationRuleOptions().subscribe({
      next: (options) => {
        this.options = options;
        if (options.teacher) {
          this.payload.rule.scopeType = 'ENSEIGNANT';
          this.payload.rule.enseignantId = options.enseignants[0]?.id ?? null;
        }
      },
      error: () => this.toast.error('Impossible de charger les listes du formulaire.', 'Chargement impossible')
    });
  }

  openCreate(): void {
    this.editId = null;
    this.payload = this.emptyPayload();
    this.componentsView = [];
    this.modalOpen = true;
  }

  edit(rule: CalculationRule): void {
    this.editId = rule.id;
    this.payload = {
      rule: {
        ...rule
      },
      components: []
    };
    this.pedagogie.getCalculationRuleComponents(rule.id).subscribe({
      next: (components) => {
        this.componentsView = components;
        this.payload.components = components.map(component => ({ ...component }));
        this.modalOpen = true;
      },
      error: () => this.toast.error('Impossible de charger les composants de la règle.', 'Chargement impossible')
    });
  }

  addComponent(): void {
    const next = this.payload.components.length ? Math.max(...this.payload.components.map(c => Number(c.sortOrder) || 0)) + 1 : 1;
    this.payload.components.push({
      label: '',
      method: 'WEIGHTED_AVERAGE',
      weight: 1,
      minNotes: null,
      dropLowest: false,
      onlyBest: false,
      gradeScale: 20,
      sortOrder: next
    });
  }

  onScopeChange(): void {
    const scope = this.payload.rule.scopeType;
    if (scope !== 'ETABLISSEMENT' && scope !== 'COMBINE') this.payload.rule.etablissementId = null;
    if (scope !== 'NIVEAU' && scope !== 'COMBINE') this.payload.rule.niveauId = null;
    if (scope !== 'CLASSE' && scope !== 'ENSEIGNANT' && scope !== 'COMBINE') this.payload.rule.classeId = null;
    if (scope !== 'MATIERE' && scope !== 'ENSEIGNANT' && scope !== 'COMBINE') this.payload.rule.matiereId = null;
    if (scope !== 'PERIODE' && scope !== 'COMBINE') this.payload.rule.periodeId = null;
    if (scope !== 'ENSEIGNANT' && scope !== 'COMBINE') this.payload.rule.enseignantId = null;
    if (scope === 'ENSEIGNANT' && this.options.teacher) {
      this.payload.rule.enseignantId = this.options.enseignants[0]?.id ?? null;
    }
  }

  optionLabel(options: CalculationRuleOption[], id: number | null | undefined): string {
    if (id == null) return '';
    return options.find((option) => Number(option.id) === Number(id))?.label ?? `#${id}`;
  }

  scopeLabel(rule: CalculationRule): string {
    const targets = [
      this.optionLabel(this.options.etablissements, rule.etablissementId),
      this.optionLabel(this.options.niveaux, rule.niveauId),
      this.optionLabel(this.options.classes, rule.classeId),
      this.optionLabel(this.options.matieres, rule.matiereId),
      this.optionLabel(this.options.periodes, rule.periodeId),
      this.optionLabel(this.options.enseignants, rule.enseignantId)
    ].filter(Boolean);
    return targets.length ? `${rule.scopeType} · ${targets.join(' · ')}` : rule.scopeType;
  }

  removeComponent(index: number): void {
    if (this.payload.components.length === 1) return;
    this.payload.components.splice(index, 1);
  }

  confirmSave(): void {
    const error = this.validate();
    if (error) {
      this.toast.error(error, 'Formulaire invalide');
      return;
    }
    this.confirmationTitle = this.editId ? 'Confirmer la modification' : 'Confirmer la création';
    this.confirmationMessage = `Enregistrer la règle "${String(this.payload.rule.libelle).trim()}" ?`;
    this.action = () => this.save();
    this.confirmationOpen = true;
  }

  save(): void {
    this.pedagogie.saveCalculationRule(this.normalizePayload()).subscribe({
      next: () => {
        this.confirmationOpen = false;
        this.modalOpen = false;
        this.toast.success('Règle enregistrée.');
        this.load();
      },
      error: () => this.toast.error('Enregistrement impossible.', 'Erreur')
    });
  }

  activate(rule: CalculationRule): void {
    this.confirmationTitle = 'Activer la règle';
    this.confirmationMessage = `La version ${rule.version} de "${rule.libelle}" deviendra active et les autres seront archivées.`;
    this.action = () => this.doActivate(rule.id);
    this.confirmationOpen = true;
  }

  doActivate(ruleId: number): void {
    this.pedagogie.activateCalculationRule(ruleId).subscribe({
      next: () => {
        this.confirmationOpen = false;
        this.toast.success('Règle activée.');
        this.load();
      },
      error: () => this.toast.error('Activation impossible.', 'Erreur')
    });
  }

  closeConfirmation(): void {
    this.confirmationOpen = false;
    this.action = null;
  }

  private normalizePayload(): CalculationRulePayload {
    return {
      rule: {
        ...this.payload.rule,
        code: String(this.payload.rule.code ?? '').trim().toUpperCase(),
        libelle: String(this.payload.rule.libelle ?? '').trim(),
        description: String(this.payload.rule.description ?? '').trim(),
        templateCode: String(this.payload.rule.templateCode ?? 'DEFAULT_WEIGHTED_EVALUATION').trim().toUpperCase(),
        configJson: String(this.payload.rule.configJson ?? '{}'),
        version: Number(this.payload.rule.version ?? 1)
      },
      components: this.payload.components.map(component => ({
        ...component,
        label: String(component.label ?? '').trim(),
        method: String(component.method ?? '').trim().toUpperCase(),
        weight: component.weight == null ? null : Number(component.weight),
        minNotes: component.minNotes == null ? null : Number(component.minNotes),
        gradeScale: component.gradeScale == null ? null : Number(component.gradeScale),
        sortOrder: Number(component.sortOrder ?? 0)
      }))
    };
  }

  private validate(): string {
    if (!String(this.payload.rule.code ?? '').trim()) return 'Le code est obligatoire.';
    if (!String(this.payload.rule.libelle ?? '').trim()) return 'Le libellé est obligatoire.';
    if (!String(this.payload.rule.templateCode ?? '').trim()) return 'Le modèle est obligatoire.';
    if (!this.payload.components.length) return 'Ajoutez au moins un composant.';
    if (this.payload.rule.scopeType === 'ETABLISSEMENT' && !this.payload.rule.etablissementId) return 'Choisissez un établissement.';
    if (this.payload.rule.scopeType === 'NIVEAU' && !this.payload.rule.niveauId) return 'Choisissez un niveau.';
    if (this.payload.rule.scopeType === 'CLASSE' && !this.payload.rule.classeId) return 'Choisissez une classe.';
    if (this.payload.rule.scopeType === 'MATIERE' && !this.payload.rule.matiereId) return 'Choisissez une matière.';
    if (this.payload.rule.scopeType === 'PERIODE' && !this.payload.rule.periodeId) return 'Choisissez une période.';
    if (this.payload.rule.scopeType === 'ENSEIGNANT'
      && (!this.payload.rule.enseignantId || !this.payload.rule.classeId || !this.payload.rule.matiereId)) {
      return 'Une règle enseignant exige un enseignant, une classe et une matière.';
    }
    if (this.payload.components.some(component => Number(component.weight ?? 0) <= 0)) {
      return 'Chaque poids doit être supérieur à zéro.';
    }
    if (this.payload.components.some(component => component.dropLowest && component.onlyBest)) {
      return 'Un composant ne peut pas supprimer la plus faible note et garder uniquement la meilleure.';
    }
    return '';
  }

  private emptyPayload(): CalculationRulePayload {
    return {
      rule: {
        code: '',
        libelle: '',
        description: '',
        scopeType: this.options.teacher ? 'ENSEIGNANT' : 'ETABLISSEMENT',
        scopeId: null,
        etablissementId: null,
        niveauId: null,
        classeId: null,
        matiereId: null,
        periodeId: null,
        enseignantId: this.options.teacher ? (this.options.enseignants[0]?.id ?? null) : null,
        templateCode: 'DEFAULT_WEIGHTED_EVALUATION',
        configJson: '{"noteScale":20}',
        version: 1,
        statut: 'BROUILLON',
        anneeScolaireId: null,
        dateDebut: null,
        dateFin: null,
        actif: false
      },
      components: [{
        label: 'Moyenne principale',
        method: 'WEIGHTED_AVERAGE',
        weight: 1,
        minNotes: null,
        dropLowest: false,
        onlyBest: false,
        gradeScale: 20,
        sortOrder: 1
      }]
    };
  }
}
