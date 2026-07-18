import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Observable, catchError, forkJoin, map, of } from 'rxjs';
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
import { PageResponse } from '../../../core/models/audit.models';
import { AuthenticationService } from '../../../core/services/authentication.service';
import { PortailService } from '../../../core/services/portail.service';
import { SelectComponent } from '../../../shared/components/form/select/select.component';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-ecommerce',
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    EcommerceMetricsComponent,
    MonthlySalesChartComponent,
    MonthlyTargetComponent,
    StatisticsChartComponent,
    DemographicCardComponent,
    RecentOrdersComponent,
    SelectComponent,
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
  accueilFamille = false;
  elevesFamille: any[] = [];
  eleveFamilleUuid = '';
  syntheseFamille: any = {};
  notesRecentesFamille: any[] = [];
  prochainsCoursFamille: any[] = [];

  get eleveFamilleOptions() {
    return this.elevesFamille.map(eleve => ({
      value: eleve.uu_id,
      label: `${eleve.elv_prenom ?? ''} ${eleve.elv_nom ?? ''} · ${eleve.classe ?? ''}`.trim()
    }));
  }

  readonly rechercherElevesFamille = (term: string, limit: number) =>
    this.portail.rechercherEleves(term, limit).pipe(map(items => items.map(eleve => ({
      value: eleve.uu_id,
      label: `${eleve.elv_prenom ?? ''} ${eleve.elv_nom ?? ''} · ${eleve.classe ?? ''}`.trim()
    }))));

  constructor(
    private inscriptions: InscriptionService,
    private personnelService: PersonnelService,
    private authentication: AuthenticationService,
    private portail: PortailService,
    private toast: ToastService
  ) {
  }

  ngOnInit(): void {
    this.accueilFamille = this.authentication.hasAnyRole(['PAR', 'ELV']);
    if (this.accueilFamille) {
      this.chargerElevesFamille();
      return;
    }

    const fallback = <T>(source: Observable<T>, value: T): Observable<T> => source.pipe(catchError(() => {
      this.donneesPartielles = true;
      return of(value);
    }));

    const inscriptionsVides: PageResponse<Inscription> = { content: [], meta: null };

    forkJoin({
      classes: fallback(this.inscriptions.statistiquesParClasse(), [] as StatistiqueClasse[]),
      niveaux: fallback(this.inscriptions.statistiquesParNiveau(), [] as StatistiqueNiveau[]),
      sexes: fallback(this.inscriptions.statistiquesParSexe(), [] as StatistiqueSexe[]),
      inscriptions: fallback(
        this.inscriptions.filterInscriptions([], {
          page: 1,
          size: 5,
          sortField: 'dateInscription',
          sortOrder: 'DESC',
          filter: ''
        }),
        inscriptionsVides
      ),
      personnel: fallback(this.personnelService.dashboard(), this.personnel)
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
        if (this.donneesPartielles) this.toast.warning('Certaines informations du tableau de bord ne sont momentanément pas disponibles.');
      },
      error: () => {
        this.donneesPartielles = true;
        this.chargement = false;
        this.toast.error('Impossible de charger le tableau de bord.', 'Chargement impossible');
      }
    });
  }

  chargerElevesFamille(): void {
    this.chargement = true;
    this.portail.eleves().subscribe({
      next: (eleves) => {
        this.elevesFamille = eleves ?? [];
        this.eleveFamilleUuid = this.elevesFamille[0]?.uu_id ?? '';
        if (this.eleveFamilleUuid) {
          this.chargerAccueilFamille();
        } else {
          this.chargement = false;
        }
      },
      error: (erreur) => {
        this.toast.error(this.messagePortail(erreur), 'Chargement impossible');
        this.chargement = false;
      }
    });
  }

  chargerAccueilFamille(): void {
    if (!this.eleveFamilleUuid) return;
    this.chargement = true;
    forkJoin({
      synthese: this.portail.synthese(this.eleveFamilleUuid),
      notes: this.portail.notes(this.eleveFamilleUuid),
      emploiDuTemps: this.portail.emploiDuTemps(this.eleveFamilleUuid)
    }).subscribe({
      next: (resultat) => {
        this.syntheseFamille = resultat.synthese ?? {};
        this.notesRecentesFamille = (resultat.notes ?? []).slice(0, 5);
        this.prochainsCoursFamille = (resultat.emploiDuTemps ?? []).slice(0, 5);
        this.chargement = false;
      },
      error: (erreur) => {
        this.toast.error(this.messagePortail(erreur), 'Chargement impossible');
        this.chargement = false;
      }
    });
  }

  private messagePortail(erreur: any): string {
    return erreur?.error?.message ?? 'Impossible de charger les informations de votre famille.';
  }

  get moyenneFamille(): number | string {
    return this.syntheseFamille?.moyenneGenerale?.[0]?.mg_valeur ?? '—';
  }

  get rangFamille(): number | string {
    return this.syntheseFamille?.moyenneGenerale?.[0]?.mg_rang_classe ?? '—';
  }

  get resteAPayerFamille(): number {
    const paiements = this.syntheseFamille?.paiements ?? {};
    return Number(paiements.montant_du ?? 0) - Number(paiements.montant_paye ?? 0);
  }

  get tauxRemplissage(): number {
    if (!this.totalCapacite) return 0;
    return Math.min(100, Math.round((this.totalEffectif * 1000) / this.totalCapacite) / 10);
  }
}
