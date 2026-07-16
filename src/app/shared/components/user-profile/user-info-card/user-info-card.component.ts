import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { MonProfil, MonProfilRequest } from '../../../../core/models/auth.models';
import { InputFieldComponent } from '../../form/input/input-field.component';
import { LabelComponent } from '../../form/label/label.component';
import { ButtonComponent } from '../../ui/button/button.component';
import { ModalComponent } from '../../ui/modal/modal.component';

@Component({
  selector: 'app-user-info-card',
  imports: [InputFieldComponent, ButtonComponent, LabelComponent, ModalComponent],
  templateUrl: './user-info-card.component.html',
  styles: ``
})
export class UserInfoCardComponent implements OnChanges {
  @Input() profile: MonProfil | null = null;
  @Input() saving = false;
  @Output() save = new EventEmitter<MonProfilRequest>();

  isOpen = false;
  validationError = '';
  form: MonProfilRequest = this.emptyForm();

  ngOnChanges(): void {
    if (!this.isOpen) this.resetForm();
  }

  openModal(): void {
    this.resetForm();
    this.isOpen = true;
  }

  closeModal(): void {
    if (this.saving) return;
    this.isOpen = false;
    this.validationError = '';
  }

  submit(): void {
    const payload: MonProfilRequest = {
      firstName: this.form.firstName.trim(),
      lastName: this.form.lastName.trim(),
      email: this.form.email.trim().toLowerCase(),
      phone: this.form.phone?.trim() || null
    };

    if (!payload.firstName || !payload.lastName || !payload.email) {
      this.validationError = 'Le prénom, le nom et l’adresse e-mail sont obligatoires.';
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
      this.validationError = 'Veuillez saisir une adresse e-mail valide.';
      return;
    }

    this.validationError = '';
    this.save.emit(payload);
  }

  editionTerminee(): void {
    this.isOpen = false;
    this.validationError = '';
  }

  private resetForm(): void {
    this.form = {
      firstName: this.profile?.firstName ?? '',
      lastName: this.profile?.lastName ?? '',
      email: this.profile?.email ?? '',
      phone: this.profile?.phone ?? null
    };
  }

  private emptyForm(): MonProfilRequest {
    return { firstName: '', lastName: '', email: '', phone: null };
  }
}
