import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
  ActionNotification,
  ActionNotificationService
} from '../../../../core/services/action-notification.service';
import { DropdownComponent } from '../../ui/dropdown/dropdown.component';
import { AccountPreferencesService } from '../../../../core/services/account-preferences.service';

@Component({
  selector: 'app-notification-dropdown',
  templateUrl: './notification-dropdown.component.html',
  imports: [CommonModule, DropdownComponent]
})
export class NotificationDropdownComponent implements OnInit {
  isOpen = false;
  loading = true;
  notifying = false;
  notifications: ActionNotification[] = [];

  constructor(
    private notificationService: ActionNotificationService,
    public preferences: AccountPreferencesService,
    private router: Router
  ) {
  }

  ngOnInit(): void {
    this.charger();
  }

  get total(): number {
    return this.notifications.reduce((sum, notification) => sum + notification.count, 0);
  }

  get badge(): string {
    return this.total > 99 ? '99+' : String(this.total);
  }

  get shouldAnimate(): boolean {
    return this.notifying && this.preferences.notificationAnimationEnabled();
  }

  toggleDropdown(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) this.notifying = false;
  }

  closeDropdown(): void {
    this.isOpen = false;
  }

  charger(): void {
    this.loading = true;
    this.notificationService.charger().subscribe({
      next: (notifications) => {
        this.notifications = notifications;
        this.notifying = notifications.length > 0 &&
          this.preferences.notificationAnimationEnabled() &&
          !this.isOpen;
        this.loading = false;
      },
      error: () => {
        this.notifications = [];
        this.notifying = false;
        this.loading = false;
      }
    });
  }

  ouvrir(notification: ActionNotification): void {
    this.closeDropdown();
    void this.router.navigateByUrl(notification.route);
  }
}
