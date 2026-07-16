import { Component, OnInit } from '@angular/core';
import { catchError, forkJoin, of } from 'rxjs';
import { EcommerceMetricsComponent } from '../../../shared/components/ecommerce/ecommerce-metrics/ecommerce-metrics.component';
import { MonthlySalesChartComponent } from '../../../shared/components/ecommerce/monthly-sales-chart/monthly-sales-chart.component';
import { MonthlyTargetComponent } from '../../../shared/components/ecommerce/monthly-target/monthly-target.component';
import { StatisticsChartComponent } from '../../../shared/components/ecommerce/statics-chart/statics-chart.component';
import { DemographicCardComponent } from '../../../shared/components/ecommerce/demographic-card/demographic-card.component';
import { RecentOrdersComponent } from '../../../shared/components/ecommerce/recent-orders/recent-orders.component';
import { InscriptionService } from '../../../core/services/inscription.service';
import { PersonnelService } from '../../../core/services/personnel.service';
import { Inscription, StatistiqueClasse, StatistiqueNiveau, StatistiqueSexe } from '../../../core/models/inscription.models';
import { RhDashboard } from '../../../core/models/personnel.models';

@Component({
  selector: 'app-ecommerce',
  imports: [
    EcommerceMetricsComponent,
    MonthlySalesChartComponent,
    MonthlyTargetComponent,
    StatisticsChartComponent,
    DemographicCardComponent,
    RecentOrdersComponent,
  ],
  templateUrl: './ecommerce.component.html',
})
export class EcommerceComponent implements OnInit {
  classes: StatistiqueClasse[] = [];
  niveaux: StatistiqueNiveau[] = [];
  sexes: StatistiqueSexe[] = [];
  inscriptionsRecentes: Inscription[] = [];
  personnel: RhDashboard = { effectif_actif: 0, enseignants: 0, contrats_actifs: 0, conges_en_attente: 0 };
  totalEffectif = 0;
  totalCapacite = 0;
  chargement = true;
  donneesPartielles = false;

  constructor(
    private inscriptions: InscriptionService,
    private personnelService: PersonnelService
  ) {
  }

  ngOnInit(): void {
    const fallback = <T>(value: T) => catchError(() => {
      this.donneesPartielles = true;
      return of(value);
    });

    forkJoin({
      classes: this.inscriptions.statistiquesParClasse().pipe(fallback<StatistiqueClasse[]>([])),
      niveaux: this.inscriptions.statistiquesParNiveau().pipe(fallback<StatistiqueNiveau[]>([])),
      sexes: this.inscriptions.statistiquesParSexe().pipe(fallback<StatistiqueSexe[]>([])),
      inscriptions: this.inscriptions.filterInscriptions([], {
        page: 1,
        size: 5,
        sortField: 'dateInscription',
        sortOrder: 'DESC',
        filter: ''
      }).pipe(fallback({ content: [], meta: null })),
      personnel: this.personnelService.dashboard().pipe(fallback(this.personnel))
    }).subscribe({
      next: (resultat) => {
        this.classes = resultat.classes;
        this.niveaux = resultat.niveaux;
        this.sexes = resultat.sexes;
        this.inscriptionsRecentes = resultat.inscriptions.content;
        this.personnel = resultat.personnel;
        this.totalEffectif = this.classes.reduce((total, item) => total + item.effectif, 0);
        this.totalCapacite = this.classes.reduce((total, item) => total + (item.capaciteMax ?? 0), 0);
        this.chargement = false;
      },
      error: () => {
        this.donneesPartielles = true;
        this.chargement = false;
      }
    });
  }

  get tauxRemplissage(): number {
    if (!this.totalCapacite) return 0;
    return Math.min(100, Math.round((this.totalEffectif * 1000) / this.totalCapacite) / 10);
  }
}
