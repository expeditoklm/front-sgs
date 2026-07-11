import { Component, OnInit } from '@angular/core';
import {
  ApexAxisChartSeries,
  ApexChart,
  ApexDataLabels,
  ApexGrid,
  ApexLegend,
  ApexNonAxisChartSeries,
  ApexPlotOptions,
  ApexResponsive,
  ApexStroke,
  ApexTooltip,
  ApexXAxis,
  ApexYAxis,
  NgApexchartsModule
} from 'ng-apexcharts';
import { PageBreadcrumbComponent } from '../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { ComponentCardComponent } from '../../../shared/components/common/component-card/component-card.component';
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';
import { LabelComponent } from '../../../shared/components/form/label/label.component';
import { SelectComponent } from '../../../shared/components/form/select/select.component';
import { PedagogieService } from '../../../core/services/pedagogie.service';
import { ReferentielCrudService } from '../../../core/services/referentiel-crud.service';
import { ToastService } from '../../../core/services/toast.service';
import { SelectOption } from '../../../core/models/referentiel-crud.models';
import { StatistiqueClassePedagogie, StatistiqueMatierePedagogie } from '../../../core/models/pedagogie.models';

// Tableau de bord des résultats d'une classe (min/max/moyenne, taux de réussite) - mêmes
// conventions graphiques que StatistiquesDashboardComponent (inscriptions) : ng-apexcharts,
// palette TailAdmin (#465fff / #12b76a / #f97066), tuiles de synthèse + graphiques + tableau
// détaillé (le tableau sert aussi de vue accessible/textuelle des mêmes chiffres).
// JAMAIS deux unités sur un même graphique (moyenne /20 vs taux %) - deux graphiques séparés.
@Component({
  selector: 'app-statistiques-classe',
  imports: [NgApexchartsModule, PageBreadcrumbComponent, ComponentCardComponent, ButtonComponent, LabelComponent, SelectComponent],
  templateUrl: './statistiques-classe.component.html'
})
export class StatistiquesClasseComponent implements OnInit {
  loading = false;
  loadError = '';
  rechercheEffectuee = false;

  classeId = '';
  periodeId = '';
  classeOptions: SelectOption[] = [];
  periodeOptions: SelectOption[] = [];
  matiereLabels: Record<number, string> = {};

  stats: StatistiqueClassePedagogie | null = null;
  matiereRows: StatistiqueMatierePedagogie[] = [];

  // --- Graphique "Moyenne par matière" (barres verticales, /20) ---
  moyenneSeries: ApexAxisChartSeries = [];
  readonly moyenneChart: ApexChart = { type: 'bar', height: 320, toolbar: { show: false } };
  readonly moyenneColors = ['#465fff'];
  readonly moyennePlotOptions: ApexPlotOptions = { bar: { horizontal: false, columnWidth: '55%', borderRadius: 4 } };
  readonly moyenneDataLabels: ApexDataLabels = { enabled: true };
  readonly moyenneStroke: ApexStroke = { show: true, width: 2, colors: ['transparent'] };
  moyenneXaxis: ApexXAxis = { categories: [] };
  readonly moyenneYaxis: ApexYAxis = { min: 0, max: 20, title: { text: 'Moyenne / 20' } };
  readonly moyenneGrid: ApexGrid = { yaxis: { lines: { show: true } } };
  readonly moyenneTooltip: ApexTooltip = { y: { formatter: (val: number) => `${val} / 20` } };

  // --- Graphique "Taux de réussite par matière" (barres horizontales, %) ---
  tauxSeries: ApexAxisChartSeries = [];
  readonly tauxChart: ApexChart = { type: 'bar', height: 300, toolbar: { show: false } };
  readonly tauxColors = ['#12b76a'];
  readonly tauxPlotOptions: ApexPlotOptions = { bar: { horizontal: true, borderRadius: 4 } };
  readonly tauxDataLabels: ApexDataLabels = { enabled: true, formatter: (val: number) => `${val} %` };
  tauxXaxis: ApexXAxis = { categories: [], max: 100 };
  readonly tauxTooltip: ApexTooltip = { y: { formatter: (val: number) => `${val} %` } };

  // --- Graphique "Réussite / échec" (donut, effectifs) ---
  reussiteSeries: ApexNonAxisChartSeries = [];
  readonly reussiteLabels = ['Moyenne ≥ 10', 'Moyenne < 10'];
  readonly reussiteChart: ApexChart = { type: 'donut', height: 300 };
  readonly reussiteColors = ['#12b76a', '#f97066'];
  readonly reussiteResponsive: ApexResponsive[] = [{ breakpoint: 480, options: { chart: { width: 260 } } }];
  readonly reussiteLegend: ApexLegend = { position: 'bottom' };

  constructor(
    private pedagogieService: PedagogieService,
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

  matiereLabel(matiereId: number): string {
    return this.matiereLabels[matiereId] ?? `#${matiereId}`;
  }

  afficher(): void {
    if (!this.classeId || !this.periodeId) {
      this.loadError = 'Classe et période sont obligatoires.';
      return;
    }

    this.loading = true;
    this.loadError = '';
    this.rechercheEffectuee = true;
    const classeId = +this.classeId;
    const periodeId = +this.periodeId;

    this.pedagogieService.getStatistiquesClasse(classeId, periodeId).subscribe({
      next: (stats) => {
        this.stats = stats;
        if (stats.effectif > 0 && stats.tauxReussite != null) {
          const nbReussite = Math.round((stats.effectif * stats.tauxReussite) / 100);
          this.reussiteSeries = [nbReussite, stats.effectif - nbReussite];
        } else {
          this.reussiteSeries = [];
        }
        this.loading = false;
      },
      error: (err) => {
        this.stats = null;
        this.reussiteSeries = [];
        this.loading = false;
        this.loadError = 'Impossible de charger les statistiques de la classe.';
        this.toastService.error(err?.error?.message || this.loadError, 'Chargement impossible');
      }
    });

    this.pedagogieService.getStatistiquesParMatiere(classeId, periodeId).subscribe({
      next: (rows) => {
        this.matiereRows = rows;
        const categories = rows.map((r) => this.matiereLabel(r.matiereId));
        this.moyenneXaxis = { categories };
        this.moyenneSeries = [{ name: 'Moyenne de classe', data: rows.map((r) => r.moyenne ?? 0) }];
        this.tauxXaxis = { categories, max: 100 };
        this.tauxSeries = [{ name: 'Taux de réussite', data: rows.map((r) => r.tauxReussite ?? 0) }];
      },
      error: () => {
        this.matiereRows = [];
        this.moyenneSeries = [];
        this.tauxSeries = [];
      }
    });
  }
}
