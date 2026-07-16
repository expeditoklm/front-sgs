import {CommonModule} from '@angular/common';
import {Component, OnInit} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {forkJoin} from 'rxjs';
import {AuthenticationService} from '../../../core/services/authentication.service';
import {ToastService} from '../../../core/services/toast.service';
import {ModalComponent} from '../../../shared/components/ui/modal/modal.component';
import {PaginationComponent} from '../../../shared/components/ui/pagination/pagination.component';
import {PaginatePipe} from '../../../shared/pipes/paginate.pipe';
import {SelectComponent} from '../../../shared/components/form/select/select.component';

@Component({
  selector: 'app-account-requests',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, PaginationComponent, PaginatePipe, SelectComponent],
  templateUrl: './account-requests.component.html',
  host: {class: 'sgs-dark-view block'}
})
export class AccountRequestsComponent implements OnInit {
  requests: any[] = [];
  roles: Array<{code: string; label: string}> = [];
  status = 'PENDING';
  loading = false;
  processing = false;
  selected: any = null;
  approveOpen = false;
  rejectOpen = false;
  username = '';
  selectedRoles: string[] = [];
  comment = '';
  rejectReason = '';
  error = '';
  page = 1;
  pageSize = 10;
  readonly statusOptions = [
    {value: 'PENDING', label: 'En attente'},
    {value: 'APPROVED', label: 'Approuvées'},
    {value: 'REJECTED', label: 'Refusées'},
    {value: '', label: 'Toutes'},
  ];

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.requests.length / this.pageSize));
  }

  changePage(page: number): void {
    this.page = Math.min(Math.max(page, 1), this.totalPages);
  }

  changePageSize(pageSize: number): void {
    this.pageSize = pageSize;
    this.page = 1;
  }

  constructor(
    private authentication: AuthenticationService,
    private toasts: ToastService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = '';
    forkJoin({
      requests: this.authentication.accountRequests$(this.status || undefined),
      roles: this.authentication.accountRequestRoles$()
    }).subscribe({
      next: result => {
        this.requests = result.requests;
        this.page = 1;
        this.roles = result.roles;
        this.loading = false;
      },
      error: error => {
        this.error = this.message(error);
        this.loading = false;
      }
    });
  }

  openApprove(request: any): void {
    this.selected = request;
    this.username = this.suggestUsername(request.email);
    this.selectedRoles = [];
    this.comment = '';
    this.approveOpen = true;
  }

  openReject(request: any): void {
    this.selected = request;
    this.rejectReason = '';
    this.rejectOpen = true;
  }

  toggleRole(code: string, checked: boolean): void {
    this.selectedRoles = checked
      ? [...new Set([...this.selectedRoles, code])]
      : this.selectedRoles.filter(role => role !== code);
  }

  approve(): void {
    if (!this.selected || !this.selectedRoles.length || !this.username.trim()) return;
    this.processing = true;
    this.authentication.approveAccountRequest$(this.selected.uuid, {
      username: this.username.trim(),
      roleCodes: this.selectedRoles,
      comment: this.comment.trim() || undefined
    }).subscribe({
      next: response => {
        this.processing = false;
        this.approveOpen = false;
        this.toasts.success(response.message, 'Compte créé');
        this.load();
      },
      error: error => {
        this.processing = false;
        this.toasts.error(this.message(error), 'Échec de l’approbation');
      }
    });
  }

  reject(): void {
    if (!this.selected || !this.rejectReason.trim()) return;
    this.processing = true;
    this.authentication.rejectAccountRequest$(this.selected.uuid, this.rejectReason.trim()).subscribe({
      next: response => {
        this.processing = false;
        this.rejectOpen = false;
        this.toasts.success(response.message, 'Demande refusée');
        this.load();
      },
      error: error => {
        this.processing = false;
        this.toasts.error(this.message(error), 'Échec du refus');
      }
    });
  }

  private suggestUsername(email: string): string {
    return String(email ?? '').split('@')[0].toLowerCase().replace(/[^a-z0-9._-]/g, '.');
  }

  private message(error: any): string {
    return error?.error?.details ?? error?.error?.message ?? 'Une erreur est survenue.';
  }
}
