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

  @Output() edit = new EventEmitter<Record<string, any>>();
  @Output() remove = new EventEmitter<Record<string, any>>();

  trackByUuid(_index: number, row: Record<string, any>): string {
    return row['uuid'];
  }

  formatValue(row: Record<string, any>, column: ColumnConfig): string {
    const value = row[column.key];
    if (value === null || value === undefined || value === '') return '—';
    if (typeof value === 'boolean') return value ? 'Oui' : 'Non';
    if (Array.isArray(value)) return value.length ? String(value.length) : '—';
    return String(value);
  }
}
