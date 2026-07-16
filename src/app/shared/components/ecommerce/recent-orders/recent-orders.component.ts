import { Component, Input } from '@angular/core';
import { BadgeComponent } from '../../ui/badge/badge.component';
import { DatePipe } from '@angular/common';
import { Inscription } from '../../../../core/models/inscription.models';

@Component({
  selector: 'app-recent-orders',
  imports: [
    BadgeComponent,
    DatePipe
],
  templateUrl: './recent-orders.component.html'
})
export class RecentOrdersComponent {
  @Input() inscriptions: Inscription[] = [];

  getBadgeColor(status: string): 'success' | 'warning' | 'error' {
    if (status === 'VALIDEE') return 'success';
    if (status === 'EN_ATTENTE' || status === 'NOUVELLE') return 'warning';
    return 'error';
  }
}
