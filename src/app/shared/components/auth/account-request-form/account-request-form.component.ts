import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LabelComponent } from '../../form/label/label.component';
import { InputFieldComponent } from '../../form/input/input-field.component';
import { ButtonComponent } from '../../ui/button/button.component';
import { AuthenticationService } from '../../../../core/services/authentication.service';
import { ToastService } from '../../../../core/services/toast.service';

// SGS n'a pas d'auto-inscription : les comptes sont provisionnés par un SADM/ADM (écran
// Utilisateurs). Ce formulaire soumet une demande transmise par email à l'administration,
// à valider manuellement - pas une création de compte immédiate.
@Component({
  selector: 'app-account-request-form',
  imports: [
    LabelComponent,
    InputFieldComponent,
    ButtonComponent,
    RouterModule,
    FormsModule
  ],
  templateUrl: './account-request-form.component.html',
  styles: ``
})
export class AccountRequestFormComponent {
  nom = '';
  prenom = '';
  email = '';
  telephone = '';
  etablissement = '';
  message = '';

  isSubmitting = false;
  requestSent = false;
  errorMessage = '';

  constructor(
    private authService: AuthenticationService,
    private toastService: ToastService
  ) {
  }

  onSubmit(): void {
    if (!this.nom.trim() || !this.prenom.trim() || !this.email.trim() || !this.etablissement.trim()) {
      this.errorMessage = 'Merci de renseigner les champs obligatoires.';
      return;
    }

    this.errorMessage = '';
    this.isSubmitting = true;
    this.authService
      .requestAccount$({
        nom: this.nom,
        prenom: this.prenom,
        email: this.email,
        telephone: this.telephone || undefined,
        etablissement: this.etablissement,
        message: this.message || undefined
      })
      .subscribe((success) => {
        this.isSubmitting = false;
        if (!success) {
          this.toastService.error("Impossible d'envoyer votre demande pour le moment, réessayez plus tard.");
          return;
        }
        this.requestSent = true;
        this.toastService.success('Un administrateur traitera votre demande prochainement.', 'Demande envoyée');
      });
  }
}
