
import { Component, Input, OnChanges } from '@angular/core';
import { NgApexchartsModule } from 'ng-apexcharts';

import {
  ApexAxisChartSeries,
  ApexChart,
  ApexDataLabels,
  ApexFill,
  ApexGrid,
  ApexLegend,
  ApexMarkers,
  ApexStroke,
  ApexTooltip,
  ApexXAxis,
  ApexYAxis,
} from 'ng-apexcharts';
import { StatistiqueClasse } from '../../../../core/models/inscription.models';

@Component({
  selector: 'app-statics-chart',
  imports: [NgApexchartsModule],
  templateUrl: './statics-chart.component.html',
})
export class StatisticsChartComponent implements OnChanges {
  @Input() classes: StatistiqueClasse[] = [];

  public series: ApexAxisChartSeries = [
    {
      name: 'Effectif',
      data: [],
    },
    {
      name: 'Capacité',
      data: [],
    },
  ];

  public chart: ApexChart = {
    fontFamily: 'Outfit, sans-serif',
    height: 310,
    type: 'area',
    toolbar: { show: false },
    animations: { enabled: false },
  };

  public colors: string[] = ['#465FFF', '#9CB9FF'];

  public stroke: ApexStroke = {
    curve: 'straight',
    width: [2, 2],
  };

  public fill: ApexFill = {
    type: 'gradient',
    gradient: {
      opacityFrom: 0.55,
      opacityTo: 0,
    },
  };

  public markers: ApexMarkers = {
    size: 0,
    strokeColors: '#fff',
    strokeWidth: 2,
    hover: { size: 6 },
  };

  public grid: ApexGrid = {
    xaxis: { lines: { show: false } },
    yaxis: { lines: { show: true } },
  };

  public dataLabels: ApexDataLabels = { enabled: false };

  public tooltip: ApexTooltip = {
    enabled: true,
    y: { formatter: (value: number) => `${value} élève(s)` },
  };

  public xaxis: ApexXAxis = {
    type: 'category',
    categories: [],
    axisBorder: { show: false },
    axisTicks: { show: false },
    tooltip: { enabled: false },
  };

  public yaxis: ApexYAxis = {
    labels: {
      style: {
        fontSize: '12px',
        colors: ['#6B7280'],
      },
    },
    title: {
      text: '',
      style: { fontSize: '0px' },
    },
  };

  public legend: ApexLegend = {
    show: true,
    position: 'top',
    horizontalAlign: 'left',
  };

  ngOnChanges(): void {
    this.series = [
      { name: 'Effectif', data: this.classes.map((item) => Number(item.effectif ?? 0)) },
      { name: 'Capacité', data: this.classes.map((item) => item.capaciteMax ?? 0) }
    ];
    this.xaxis = {
      ...this.xaxis,
      categories: this.classes.map((item) => item.classeCode || item.classeLibelle)
    };
  }

  get hasData(): boolean {
    return this.classes.length > 0;
  }
}
