import { Component } from '@angular/core';
import { NgClass } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { LabelComponent } from '../../form/label/label.component';
import { CheckboxComponent } from '../../form/input/checkbox.component';
import { ButtonComponent } from '../../ui/button/button.component';
import { InputFieldComponent } from '../../form/input/input-field.component';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthenticationService } from '../../../../core/services/authentication.service';
import { ProfileOption } from '../../../../core/models/auth.models';

type Step = 'credentials' | 'otp' | 'role';

@Component({
  selector: 'app-signin-form',
  imports: [
    NgClass,
    LabelComponent,
    CheckboxComponent,
    ButtonComponent,
    InputFieldComponent,
    RouterModule,
    FormsModule
],
  templateUrl: './signin-form.component.html',
  styles: ``
})
export class SigninFormComponent {

  step: Step = 'credentials';

  showPassword = false;
  isChecked = false;
  isSubmitting = false;

  login = '';
  password = '';
  otp = '';

  profiles: ProfileOption[] = [];
  selectedProfile: string | null = null;

  errorMessage = '';

  constructor(
    private authService: AuthenticationService,
    private router: Router,
    private route: ActivatedRoute
  ) {
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  onSignIn() {
    this.errorMessage = '';
    this.isSubmitting = true;
    this.authService.login$({ login: this.login, password: this.password }).subscribe((result) => {
      this.isSubmitting = false;
      if (!result.success) {
        this.errorMessage = 'Identifiants incorrects. Merci de réessayer.';
        return;
      }
      this.step = 'otp';
    });
  }

  onValidateOtp() {
    this.errorMessage = '';
    this.isSubmitting = true;
    this.authService.validateOtp$(this.otp).subscribe((result) => {
      this.isSubmitting = false;
      if (!result.success || !result.profiles?.length) {
        this.errorMessage = 'Code de vérification invalide.';
        return;
      }
      this.profiles = result.profiles;
      this.selectedProfile = result.profiles.length === 1 ? result.profiles[0].code : null;
      this.step = 'role';
    });
  }

  onResendOtp() {
    this.errorMessage = '';
    this.authService.resendOtp$().subscribe((success) => {
      if (!success) {
        this.errorMessage = 'Impossible de renvoyer le code, réessayez plus tard.';
      }
    });
  }

  onSelectRole() {
    if (!this.selectedProfile) {
      return;
    }
    const profileLibelle = this.profiles.find((p) => p.code === this.selectedProfile)?.libelle ?? this.selectedProfile;
    this.errorMessage = '';
    this.isSubmitting = true;
    this.authService.selectRole$(this.selectedProfile, profileLibelle).subscribe((success) => {
      this.isSubmitting = false;
      if (!success) {
        this.errorMessage = "Rôle non autorisé ou session expirée. Recommencez la connexion.";
        return;
      }
      const redirectTo = this.route.snapshot.queryParamMap.get('redirectTo') || '/';
      this.router.navigateByUrl(redirectTo);
    });
  }

  backToCredentials() {
    this.step = 'credentials';
    this.otp = '';
    this.errorMessage = '';
  }
}
