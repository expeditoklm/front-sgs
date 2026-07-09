import { Component } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LabelComponent } from '../../form/label/label.component';
import { InputFieldComponent } from '../../form/input/input-field.component';
import { ButtonComponent } from '../../ui/button/button.component';
import { AuthenticationService } from '../../../../core/services/authentication.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-reset-password-form',
  imports: [FormsModule, RouterModule, LabelComponent, InputFieldComponent, ButtonComponent],
  templateUrl: './reset-password-form.component.html',
  styles: ``
})
export class ResetPasswordFormComponent {
  token: string | null = null;
  isSubmitting = false;
  requestSent = false;

  login = '';
  newPassword = '';
  confirmPassword = '';
  errorMessage = '';

  constructor(
    private authService: AuthenticationService,
    private toastService: ToastService,
    private router: Router,
    route: ActivatedRoute
  ) {
    this.token = route.snapshot.queryParamMap.get('token');
  }

  onRequestReset(): void {
    if (!this.login.trim()) {
      return;
    }
    this.errorMessage = '';
    this.isSubmitting = true;
    this.authService.forgotPassword$(this.login).subscribe(() => {
      this.isSubmitting = false;
      this.requestSent = true;
    });
  }

  onConfirmReset(): void {
    if (!this.token) {
      return;
    }
    if (this.newPassword.length < 8) {
      this.errorMessage = 'Le mot de passe doit contenir au moins 8 caractères.';
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'Les mots de passe ne correspondent pas.';
      return;
    }

    this.errorMessage = '';
    this.isSubmitting = true;
    this.authService.resetPasswordConfirm$(this.token, this.newPassword).subscribe((success) => {
      this.isSubmitting = false;
      if (!success) {
        this.errorMessage = 'Ce lien de réinitialisation est invalide ou a expiré.';
        return;
      }
      this.toastService.success('Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.', 'Mot de passe réinitialisé');
      this.router.navigateByUrl('/signin');
    });
  }
}
