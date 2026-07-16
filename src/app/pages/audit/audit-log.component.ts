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
import { PaginationComponent } from '../../shared/components/ui/pagination/pagination.component';
import { AuditService } from '../../core/services/audit.service';
import { ToastService } from '../../core/services/toast.service';
import {
  AuditActionType,
  AuditLogFilters,
  AuditRevision,
  emptyAuditLogFilters,
  formatFieldValue,
  humanizeKey,
  MetaResponse,
  REFERENTIEL_ENTITIES,
  ReferentielEntityDescriptor
} from '../../core/models/audit.models';

const ACTION_TYPE_OPTIONS: Option[] = [
  { value: '', label: 'Toutes les actions' },
  { value: 'ADD', label: 'Création' },
  { value: 'MOD', label: 'Modification' },
  { value: 'DEL', label: 'Suppression' }
];

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
    SelectComponent,
    PaginationComponent
  ],
  templateUrl: './audit-log.component.html',
  styles: ``
})
export class AuditLogComponent implements OnInit {

  entities: Option[] = REFERENTIEL_ENTITIES.map((e) => ({ value: e.key, label: e.label }));
  actionTypeOptions = ACTION_TYPE_OPTIONS;
  selectedEntityKey = REFERENTIEL_ENTITIES[0].key;

  filters: AuditLogFilters = emptyAuditLogFilters();
  page = 1;
  pageSize = 15;

  logs: AuditRevision[] = [];
  meta: MetaResponse | null = null;
  loading = false;
  loadError = '';
  exporting = false;

  selectedLog: AuditRevision | null = null;
  isDetailsModalOpen = false;

  constructor(private auditService: AuditService, private toastService: ToastService) {
  }

  ngOnInit(): void {
    this.load();
  }

  get selectedEntity(): ReferentielEntityDescriptor {
    return REFERENTIEL_ENTITIES.find((e) => e.key === this.selectedEntityKey)!;
  }

  onEntityChange(key: string): void {
    this.selectedEntityKey = key;
    this.page = 1;
    this.load();
  }

  onActionTypeChange(value: string): void {
    this.filters.actionType = value as AuditActionType | '';
  }

  search(): void {
    this.page = 1;
    this.load();
  }

  resetFilters(): void {
    this.filters = emptyAuditLogFilters();
    this.page = 1;
    this.load();
  }

  goToPage(page: number): void {
    if (page < 1 || (this.meta && page > this.meta.totalPages)) {
      return;
    }
    this.page = page;
    this.load();
  }

  changePageSize(pageSize: number): void {
    this.pageSize = pageSize;
    this.page = 1;
    this.load();
  }

  load(): void {
    this.loading = true;
    this.loadError = '';
    this.auditService.getAuditLogs(this.selectedEntity.path, this.filters, this.page, this.pageSize).subscribe({
      next: (result) => {
        this.logs = result.content;
        this.meta = result.meta;
        this.loading = false;
      },
      error: (err) => {
        this.logs = [];
        this.meta = null;
        this.loading = false;
        this.loadError = 'Impossible de charger le journal. Vérifiez que vous avez les droits nécessaires.';
        this.toastService.error(err?.error?.message || this.loadError, 'Chargement impossible');
      }
    });
  }

  viewDetails(log: AuditRevision): void {
    this.selectedLog = log;
    this.isDetailsModalOpen = true;
  }

  closeDetails(): void {
    this.isDetailsModalOpen = false;
    this.selectedLog = null;
  }

  exportCsv(): void {
    this.exporting = true;
    // Récupère tout ce qui correspond aux filtres actuels (au-delà de la page affichée), sans
    // ajouter d'endpoint dédié côté backend - une taille de page généreuse suffit à l'échelle
    // d'un outil d'administration.
    this.auditService.getAuditLogs(this.selectedEntity.path, this.filters, 1, 1000).subscribe({
      next: (result) => {
        this.exporting = false;
        if (result.content.length === 0) {
          this.toastService.warning("Aucune ligne à exporter pour ces filtres.");
          return;
        }
        this.downloadCsv(result.content);
        this.toastService.success(`${result.content.length} ligne(s) exportée(s).`);
      },
      error: (err) => {
        this.exporting = false;
        this.toastService.error(err?.error?.message || "Échec de l'export.", "Échec de l'export");
      }
    });
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

  private downloadCsv(rows: AuditRevision[]): void {
    const headers = ['Révision', 'Date', 'Action', 'Opérateur', 'Email', 'Profil', 'Données'];
    const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const lines = rows.map((row) => [
      row.revision,
      row.date,
      this.actionLabel(row.actionType),
      row.operateurNom ?? '',
      row.operateurEmail ?? '',
      row.operateurProfil ?? '',
      JSON.stringify(row.data ?? {})
    ].map(escape).join(';'));

    const csvContent = [headers.map(escape).join(';'), ...lines].join('\r\n');
    // BOM UTF-8 pour qu'Excel (très répandu ici) affiche correctement les accents.
    const blob = new Blob(['﻿' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `journal-audit-${this.selectedEntity.key}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }
}
