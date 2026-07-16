import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ColumnConfig } from '../../../../core/models/referentiel-crud.models';

@Component({
  selector: 'app-entity-table',
  imports: [],
  templateUrl: './entity-table.component.html',
  styles: ``
})
export class EntityTableComponent {
  @Input() columns: ColumnConfig[] = [];
  @Input() rows: Record<string, any>[] = [];
  @Input() loading = false;
  @Input() canManage = true;
  // N'affiche les actions Keycloak (mot de passe/sessions) que sur l'écran Utilisateurs - ces
  // opérations n'ont pas de sens pour les autres référentiels.
  @Input() showUserActions = false;

  @Output() edit = new EventEmitter<Record<string, any>>();
  @Output() remove = new EventEmitter<Record<string, any>>();
  @Output() resetPassword = new EventEmitter<Record<string, any>>();
  @Output() revokeSessions = new EventEmitter<Record<string, any>>();

  trackByUuid(_index: number, row: Record<string, any>): string {
    return row['uuid'];
  }

  formatValue(row: Record<string, any>, column: ColumnConfig): string {
    const value = row[column.key];
    if (value === null || value === undefined || value === '') return '—';
    if (typeof value === 'boolean') return value ? 'Oui' : 'Non';
    if (Array.isArray(value)) {
      if (!value.length) return '—';
      return value.every((item) => ['string', 'number'].includes(typeof item))
        ? value.join(', ')
        : String(value.length);
    }
    return String(value);
  }
}
