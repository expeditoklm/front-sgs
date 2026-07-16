
import { Component, OnInit, ViewChild } from '@angular/core';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { UserMetaCardComponent } from '../../shared/components/user-profile/user-meta-card/user-meta-card.component';
import { UserInfoCardComponent } from '../../shared/components/user-profile/user-info-card/user-info-card.component';
import { MonProfil, MonProfilRequest } from '../../core/models/auth.models';
import { ProfileService } from '../../core/services/profile.service';
import { AuthenticationService } from '../../core/services/authentication.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-profile',
  imports: [
    PageBreadcrumbComponent,
    UserMetaCardComponent,
    UserInfoCardComponent
],
  templateUrl: './profile.component.html',
  styles: ``
})
export class ProfileComponent implements OnInit {
  @ViewChild(UserInfoCardComponent) infoCard?: UserInfoCardComponent;

  profile: MonProfil | null = null;
  loading = true;
  saving = false;
  loadError = '';

  constructor(
    private profileService: ProfileService,
    private authenticationService: AuthenticationService,
    private toastService: ToastService
  ) {
  }

  ngOnInit(): void {
    this.charger();
  }

  charger(): void {
    this.loading = true;
    this.loadError = '';
    this.profileService.consulter().subscribe({
      next: (profile) => {
        this.profile = profile;
        this.authenticationService.synchroniserProfil(profile);
        this.loading = false;
      },
      error: (error) => {
        this.loadError = error?.error?.message || 'Impossible de charger votre profil.';
        this.loading = false;
      }
    });
  }

  enregistrer(payload: MonProfilRequest): void {
    if (this.saving) return;
    this.saving = true;
    this.profileService.modifier(payload).subscribe({
      next: (profile) => {
        this.profile = profile;
        this.authenticationService.synchroniserProfil(profile);
        this.saving = false;
        this.infoCard?.editionTerminee();
        this.toastService.success('Vos informations ont été mises à jour.');
      },
      error: (error) => {
        this.saving = false;
        this.toastService.error(
          error?.error?.message || 'La mise à jour du profil a échoué.',
          'Mise à jour impossible'
        );
      }
    });
  }
}
