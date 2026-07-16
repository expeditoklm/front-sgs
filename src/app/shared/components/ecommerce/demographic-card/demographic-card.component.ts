import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges } from '@angular/core';
import { DropdownComponent } from '../../ui/dropdown/dropdown.component';
import { DropdownItemComponent } from '../../ui/dropdown/dropdown-item/dropdown-item.component';
import { ApexChart, ApexLegend, ApexNonAxisChartSeries, NgApexchartsModule } from 'ng-apexcharts';
import { StatistiqueSexe } from '../../../../core/models/inscription.models';

@Component({
  selector: 'app-demographic-card',
  imports: [
    CommonModule,
    NgApexchartsModule,
    DropdownComponent,
    DropdownItemComponent,
  ],
  templateUrl: './demographic-card.component.html',
})
export class DemographicCardComponent implements OnChanges {
  @Input() repartition: StatistiqueSexe[] = [];

  series: ApexNonAxisChartSeries = [];
  labels: string[] = [];
  readonly chart: ApexChart = { type: 'donut', height: 245 };
  readonly colors = ['#465fff', '#f97066'];
  readonly legend: ApexLegend = { position: 'bottom', fontFamily: 'Outfit' };
  isOpen = false;

  toggleDropdown() {
    this.isOpen = !this.isOpen;
  }

  closeDropdown() {
    this.isOpen = false;
  }

  ngOnChanges(): void {
    this.series = this.repartition.map((item) => item.effectif);
    this.labels = this.repartition.map((item) => item.sexe === 'M' ? 'Garçons' : 'Filles');
  }

  get total(): number {
    return this.repartition.reduce((total, item) => total + item.effectif, 0);
  }

  pourcentage(effectif: number): number {
    return this.total ? Math.round((effectif * 1000) / this.total) / 10 : 0;
  }
}
