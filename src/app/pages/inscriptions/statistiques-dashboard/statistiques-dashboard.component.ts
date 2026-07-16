import { Component, OnInit } from '@angular/core';
import { NgApexchartsModule, ApexAxisChartSeries, ApexChart, ApexDataLabels, ApexPlotOptions, ApexStroke, ApexXAxis, ApexYAxis, ApexLegend, ApexGrid, ApexFill, ApexTooltip, ApexNonAxisChartSeries, ApexResponsive } from 'ng-apexcharts';
import { PageBreadcrumbComponent } from '../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { ComponentCardComponent } from '../../../shared/components/common/component-card/component-card.component';
import { LabelComponent } from '../../../shared/components/form/label/label.component';
import { SelectComponent } from '../../../shared/components/form/select/select.component';
import { InscriptionService } from '../../../core/services/inscription.service';
import { ReferentielCrudService } from '../../../core/services/referentiel-crud.service';
import { ToastService } from '../../../core/services/toast.service';
import { SelectOption } from '../../../core/models/referentiel-crud.models';
import { StatistiqueClasse, StatistiqueNiveau, StatistiqueSexe } from '../../../core/models/inscription.models';
import { PaginationComponent } from '../../../shared/components/ui/pagination/pagination.component';
import { PaginatePipe } from '../../../shared/pipes/paginate.pipe';

@Component({
  selector: 'app-statistiques-dashboard',
  imports: [NgApexchartsModule, PageBreadcrumbComponent, ComponentCardComponent, LabelComponent, SelectComponent, PaginationComponent, PaginatePipe],
  templateUrl: './statistiques-dashboard.component.html'
})
export class StatistiquesDashboardComponent implements OnInit {
  page = 1;
  pageSize = 10;
  get totalPages(): number { return Math.max(1, Math.ceil(this.classeRows.length / this.pageSize)); }
  changePage(page: number): void { this.page = Math.min(Math.max(page, 1), this.totalPages); }
  changePageSize(pageSize: number): void { this.pageSize = pageSize; this.page = 1; }
  loading = false;
  loadError = '';

  anneeScolaireFilter = '';
  anneeScolaireOptions: SelectOption[] = [];

  classeRows: StatistiqueClasse[] = [];
  niveauRows: StatistiqueNiveau[] = [];
  sexeRows: StatistiqueSexe[] = [];

  totalEffectif = 0;
  totalCapacite = 0;

  // --- Graphique "Effectifs par classe" (effectif vs capacité max) ---
  classeSeries: ApexAxisChartSeries = [];
  readonly classeChart: ApexChart = { type: 'bar', height: 320, toolbar: { show: false } };
  readonly classeColors = ['#465fff', '#d0d5dd'];
  readonly classePlotOptions: ApexPlotOptions = { bar: { horizontal: false, columnWidth: '55%', borderRadius: 4 } };
  readonly classeDataLabels: ApexDataLabels = { enabled: false };
  readonly classeStroke: ApexStroke = { show: true, width: 2, colors: ['transparent'] };
  classeXaxis: ApexXAxis = { categories: [] };
  readonly classeYaxis: ApexYAxis = { title: { text: 'Élèves' } };
  readonly classeLegend: ApexLegend = { show: true, position: 'top', horizontalAlign: 'left' };
  readonly classeGrid: ApexGrid = { yaxis: { lines: { show: true } } };
  readonly classeFill: ApexFill = { opacity: 1 };
  readonly classeTooltip: ApexTooltip = { y: { formatter: (val: number) => `${val} élève(s)` } };

  // --- Graphique "Effectifs par niveau" ---
  niveauSeries: ApexAxisChartSeries = [];
  readonly niveauChart: ApexChart = { type: 'bar', height: 300, toolbar: { show: false } };
  readonly niveauColors = ['#12b76a'];
  readonly niveauPlotOptions: ApexPlotOptions = { bar: { horizontal: true, borderRadius: 4 } };
  readonly niveauDataLabels: ApexDataLabels = { enabled: true };
  niveauXaxis: ApexXAxis = { categories: [] };

  // --- Graphique "Répartition par sexe" (donut) ---
  sexeSeries: ApexNonAxisChartSeries = [];
  sexeLabels: string[] = [];
  readonly sexeChart: ApexChart = { type: 'donut', height: 300 };
  readonly sexeColors = ['#465fff', '#f97066'];
  readonly sexeResponsive: ApexResponsive[] = [{ breakpoint: 480, options: { chart: { width: 260 } } }];
  readonly sexeLegend: ApexLegend = { position: 'bottom' };

  constructor(
    private inscriptionService: InscriptionService,
    private referentielCrudService: ReferentielCrudService,
    private toastService: ToastService
  ) {
  }

  ngOnInit(): void {
    this.loadAnneesScolaires();
    this.load();
  }

  private loadAnneesScolaires(): void {
    this.referentielCrudService
      .list('annees-scolaires', { page: 1, size: 200, sortField: 'id', sortOrder: 'DESC', filter: '' })
      .subscribe({
        next: (page) => (this.anneeScolaireOptions = page.content.map((item) => ({ value: String(item['id']), label: String(item['code']) }))),
        error: () => (this.anneeScolaireOptions = [])
      });
  }

  applyFilter(): void {
    this.load();
  }

  private load(): void {
    this.loading = true;
    this.loadError = '';
    const anneeScolaireId = this.anneeScolaireFilter ? +this.anneeScolaireFilter : undefined;

    this.inscriptionService.statistiquesParClasse(anneeScolaireId).subscribe({
      next: (rows) => {
        this.classeRows = rows;
        this.totalEffectif = rows.reduce((sum, r) => sum + r.effectif, 0);
        this.totalCapacite = rows.reduce((sum, r) => sum + (r.capaciteMax ?? 0), 0);
        this.classeXaxis = { categories: rows.map((r) => r.classeLibelle) };
        this.classeSeries = [
          { name: 'Effectif', data: rows.map((r) => r.effectif) },
          { name: 'Capacité max', data: rows.map((r) => r.capaciteMax ?? 0) }
        ];
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.loadError = 'Impossible de charger les statistiques par classe.';
        this.toastService.error(err?.error?.message || this.loadError, 'Chargement impossible');
      }
    });

    this.inscriptionService.statistiquesParNiveau(anneeScolaireId).subscribe({
      next: (rows) => {
        this.niveauRows = rows;
        this.niveauXaxis = { categories: rows.map((r) => r.niveauLibelle) };
        this.niveauSeries = [{ name: 'Effectif', data: rows.map((r) => r.effectif) }];
      },
      error: () => (this.niveauRows = [])
    });

    this.inscriptionService.statistiquesParSexe(anneeScolaireId).subscribe({
      next: (rows) => {
        this.sexeRows = rows;
        this.sexeLabels = rows.map((r) => (r.sexe === 'M' ? 'Masculin' : 'Féminin'));
        this.sexeSeries = rows.map((r) => r.effectif);
      },
      error: () => (this.sexeRows = [])
    });
  }

  tauxRemplissageGlobal(): string {
    if (this.totalCapacite === 0) return '—';
    return ((this.totalEffectif * 100) / this.totalCapacite).toFixed(1) + ' %';
  }
}
