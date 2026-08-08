import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LabelComponent } from '../../form/label/label.component';
import { InputFieldComponent } from '../../form/input/input-field.component';
import { ButtonComponent } from '../../ui/button/button.component';
import { AuthenticationService } from '../../../../core/services/authentication.service';
import { ToastService } from '../../../../core/services/toast.service';
import { SelectComponent } from '../../form/select/select.component';
import { SaasService } from '../../../../core/services/saas.service';
import { Tenant } from '../../../../core/models/saas.models';

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
    FormsModule,
    SelectComponent
  ],
  templateUrl: './account-request-form.component.html',
  styles: ``
})
export class AccountRequestFormComponent implements OnInit {
  nom = '';
  prenom = '';
  email = '';
  telephone = '';
  tenantId: string | null = null;
  tenants: Tenant[] = [];
  loadingTenants = true;
  message = '';

  isSubmitting = false;
  requestSent = false;
  errorMessage = '';

  constructor(
    private authService: AuthenticationService,
    private toastService: ToastService,
    private saasService: SaasService
  ) {
  }

  get tenantOptions() {
    return this.tenants.map(tenant => ({ value: tenant.id, label: tenant.name }));
  }

  ngOnInit(): void {
    this.saasService.publicTenants().subscribe({
      next: tenants => {
        this.tenants = tenants;
        this.loadingTenants = false;
        if (tenants.length === 1) this.tenantId = tenants[0].id;
      },
      error: () => {
        this.loadingTenants = false;
        this.errorMessage = 'Impossible de charger les écoles disponibles.';
      }
    });
  }

  onSubmit(): void {
    const tenant = this.tenants.find(item => item.id === this.tenantId);
    if (!this.nom.trim() || !this.prenom.trim() || !this.email.trim() || !tenant) {
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
        tenantId: tenant.id,
        etablissement: tenant.name,
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
