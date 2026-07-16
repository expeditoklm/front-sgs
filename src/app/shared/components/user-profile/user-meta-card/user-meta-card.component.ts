import { Component, Input } from '@angular/core';
import { MonProfil } from '../../../../core/models/auth.models';

@Component({
  selector: 'app-user-meta-card',
  imports: [],
  templateUrl: './user-meta-card.component.html',
  styles: ``
})
export class UserMetaCardComponent {
  @Input() profile: MonProfil | null = null;

  get initials(): string {
    const firstName = this.profile?.firstName?.trim().charAt(0) ?? '';
    const lastName = this.profile?.lastName?.trim().charAt(0) ?? '';
    return `${firstName}${lastName}`.toUpperCase() || '?';
  }
}
