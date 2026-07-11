import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageBreadcrumbComponent } from '../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { ComponentCardComponent } from '../../../shared/components/common/component-card/component-card.component';
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';
import { ArchivedBulletin, ReportService } from '../../../core/services/report.service';
import { ToastService } from '../../../core/services/toast.service';
import { downloadBlob } from '../../../core/helpers/download.helpers';

@Component({
  selector: 'app-bulletins-parent',
  imports: [
    CommonModule,
    PageBreadcrumbComponent,
    ComponentCardComponent,
    ButtonComponent
  ],
  templateUrl: './bulletins-parent.component.html'
})
export class BulletinsParentComponent implements OnInit {
  bulletins: ArchivedBulletin[] = [];
  loading = false;
  error = '';

  constructor(
    private reportService: ReportService,
    private toastService: ToastService
  ) {
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.reportService.listerBulletinsParents().subscribe({
      next: (bulletins) => {
        this.bulletins = bulletins;
        this.loading = false;
      },
      error: (err) => {
        this.bulletins = [];
        this.loading = false;
        this.error = err?.error?.message || 'Impossible de charger les bulletins.';
        this.toastService.error(this.error, 'Chargement impossible');
      }
    });
  }

  download(bulletin: ArchivedBulletin): void {
    this.reportService.telechargerBulletinArchive(bulletin.uuid).subscribe({
      next: (blob) => downloadBlob(blob, `bulletin-${bulletin.eleveNomComplet}-${bulletin.periodeLibelle}.pdf`.replace(/[^A-Za-z0-9._-]/g, '-')),
      error: () => this.toastService.error('Téléchargement du bulletin impossible.', 'Téléchargement impossible')
    });
  }
}
