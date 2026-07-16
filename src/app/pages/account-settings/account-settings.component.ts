import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthenticationService } from '../../core/services/authentication.service';
import { AccountPreferencesService } from '../../core/services/account-preferences.service';
import { ToastService } from '../../core/services/toast.service';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { ButtonComponent } from '../../shared/components/ui/button/button.component';
import { ThemeService } from '../../shared/services/theme.service';

@Component({
  selector: 'app-account-settings',
  imports: [CommonModule, RouterModule, PageBreadcrumbComponent, ButtonComponent],
  templateUrl: './account-settings.component.html',
  styles: ``
})
export class AccountSettingsComponent {
  readonly theme$;
  sendingResetLink = false;

  constructor(
    public authenticationService: AuthenticationService,
    public preferences: AccountPreferencesService,
    private themeService: ThemeService,
    private toastService: ToastService,
    private router: Router
  ) {
    this.theme$ = this.themeService.theme$;
  }

  setTheme(theme: 'light' | 'dark'): void {
    this.themeService.setTheme(theme);
  }

  setNotificationAnimation(event: Event): void {
    this.preferences.setNotificationAnimation((event.target as HTMLInputElement).checked);
  }

  envoyerLienMotDePasse(): void {
    const login = this.authenticationService.user()?.login;
    if (!login || this.sendingResetLink) return;

    this.sendingResetLink = true;
    this.authenticationService.forgotPassword$(login).subscribe((success) => {
      this.sendingResetLink = false;
      if (success) {
        this.toastService.success(
          'Si votre compte est correctement configuré, le lien apparaîtra dans votre boîte e-mail.',
          'Demande transmise'
        );
      } else {
        this.toastService.error('La demande de réinitialisation n’a pas pu être transmise.');
      }
    });
  }

  seDeconnecter(): void {
    this.authenticationService.logout();
  }

  ouvrirProfil(): void {
    void this.router.navigateByUrl('/profile');
  }
}
