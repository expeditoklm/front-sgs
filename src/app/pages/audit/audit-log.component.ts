import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { ComponentCardComponent } from '../../shared/components/common/component-card/component-card.component';
import { ButtonComponent } from '../../shared/components/ui/button/button.component';
import { BadgeComponent } from '../../shared/components/ui/badge/badge.component';
import { ModalComponent } from '../../shared/components/ui/modal/modal.component';
import { LabelComponent } from '../../shared/components/form/label/label.component';
import { InputFieldComponent } from '../../shared/components/form/input/input-field.component';
import { SelectComponent, Option } from '../../shared/components/form/select/select.component';
import { AuditService } from '../../core/services/audit.service';
import {
  AuditActionType,
  AuditRevision,
  formatFieldValue,
  humanizeKey,
  MetaResponse,
  recordLabel,
  REFERENTIEL_ENTITIES,
  ReferentielEntityDescriptor,
  ReferentielRecord
} from '../../core/models/audit.models';

@Component({
  selector: 'app-audit-log',
  imports: [
    CommonModule,
    FormsModule,
    PageBreadcrumbComponent,
    ComponentCardComponent,
    ButtonComponent,
    BadgeComponent,
    ModalComponent,
    LabelComponent,
    InputFieldComponent,
    SelectComponent
  ],
  templateUrl: './audit-log.component.html',
  styles: ``
})
export class AuditLogComponent implements OnInit {

  entities: Option[] = REFERENTIEL_ENTITIES.map((e) => ({ value: e.key, label: e.label }));
  selectedEntityKey = REFERENTIEL_ENTITIES[0].key;
  filterText = '';
  page = 1;

  records: ReferentielRecord[] = [];
  meta: MetaResponse | null = null;
  loadingRecords = false;
  recordsError = '';

  selectedRecord: ReferentielRecord | null = null;
  history: AuditRevision[] = [];
  loadingHistory = false;
  historyError = '';
  isHistoryModalOpen = false;

  constructor(private auditService: AuditService) {
  }

  ngOnInit(): void {
    this.loadRecords();
  }

  get selectedEntity(): ReferentielEntityDescriptor {
    return REFERENTIEL_ENTITIES.find((e) => e.key === this.selectedEntityKey)!;
  }

  onEntityChange(key: string): void {
    this.selectedEntityKey = key;
    this.page = 1;
    this.filterText = '';
    this.loadRecords();
  }

  search(): void {
    this.page = 1;
    this.loadRecords();
  }

  goToPage(page: number): void {
    if (page < 1 || (this.meta && page > this.meta.totalPages)) {
      return;
    }
    this.page = page;
    this.loadRecords();
  }

  loadRecords(): void {
    this.loadingRecords = true;
    this.recordsError = '';
    this.auditService.listRecords(this.selectedEntity.path, this.filterText, this.page).subscribe({
      next: (page) => {
        this.records = page.content;
        this.meta = page.meta;
        this.loadingRecords = false;
      },
      error: () => {
        this.records = [];
        this.meta = null;
        this.recordsError = 'Impossible de charger la liste. Vérifiez que vous avez les droits nécessaires.';
        this.loadingRecords = false;
      }
    });
  }

  viewHistory(record: ReferentielRecord): void {
    this.selectedRecord = record;
    this.isHistoryModalOpen = true;
    this.loadingHistory = true;
    this.historyError = '';
    this.history = [];

    this.auditService.getHistory(this.selectedEntity.path, record['id'] as number).subscribe({
      next: (history) => {
        this.history = history;
        this.loadingHistory = false;
      },
      error: () => {
        this.historyError = "Impossible de charger l'historique de cet enregistrement.";
        this.loadingHistory = false;
      }
    });
  }

  closeHistory(): void {
    this.isHistoryModalOpen = false;
    this.selectedRecord = null;
    this.history = [];
  }

  recordLabel(record: Record<string, any>): string {
    return recordLabel(record);
  }

  actionBadgeColor(actionType: AuditActionType): 'success' | 'warning' | 'error' {
    if (actionType === 'ADD') return 'success';
    if (actionType === 'DEL') return 'error';
    return 'warning';
  }

  actionLabel(actionType: AuditActionType): string {
    return { ADD: 'Création', MOD: 'Modification', DEL: 'Suppression' }[actionType] ?? actionType;
  }

  dataEntries(data: Record<string, unknown> | null): { key: string; label: string; value: string }[] {
    if (!data) return [];
    return Object.entries(data)
      .filter(([key]) => key !== 'id' && key !== 'uuid')
      .map(([key, value]) => ({ key, label: humanizeKey(key), value: formatFieldValue(value) }));
  }
}
