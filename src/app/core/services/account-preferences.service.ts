import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AccountPreferencesService {
  private readonly notificationAnimationKey = 'sgs_notification_animation';

  notificationAnimationEnabled = signal(
    localStorage.getItem(this.notificationAnimationKey) !== 'false'
  );

  setNotificationAnimation(enabled: boolean): void {
    localStorage.setItem(this.notificationAnimationKey, String(enabled));
    this.notificationAnimationEnabled.set(enabled);
  }
}
