import { Component, OnInit } from '@angular/core';
import { DropdownComponent } from '../../ui/dropdown/dropdown.component';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DropdownItemTwoComponent } from '../../ui/dropdown/dropdown-item/dropdown-item.component-two';
import { AuthenticationService } from '../../../../core/services/authentication.service';
import { ProfileService } from '../../../../core/services/profile.service';
import { ProfileOption } from '../../../../core/models/auth.models';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-user-dropdown',
  templateUrl: './user-dropdown.component.html',
  imports:[CommonModule,RouterModule,DropdownComponent,DropdownItemTwoComponent]
})
export class UserDropdownComponent implements OnInit {
  isOpen = false;
  profiles: ProfileOption[] = [];
  isLoadingProfiles = false;
  switchingProfile: string | null = null;

  constructor(
    public authService: AuthenticationService,
    private profileService: ProfileService,
    private toastService: ToastService
  ) {
  }

  ngOnInit(): void {
    this.profileService.consulter().subscribe({
      next: (profile) => this.authService.synchroniserProfil(profile),
      error: () => undefined
    });
    this.loadProfiles();
  }

  get initials(): string {
    const user = this.authService.user();
    const firstName = user?.firstName?.trim().charAt(0) ?? '';
    const lastName = user?.lastName?.trim().charAt(0) ?? '';
    return `${firstName}${lastName}`.toUpperCase() || '?';
  }

  toggleDropdown() {
    this.isOpen = !this.isOpen;
  }

  closeDropdown() {
    this.isOpen = false;
  }

  onSignOut() {
    this.closeDropdown();
    this.authService.logout();
  }

  switchProfile(profile: ProfileOption): void {
    if (profile.code === this.authService.currentProfile || this.switchingProfile) return;

    this.switchingProfile = profile.code;
    this.authService.switchProfile$(profile).subscribe((success) => {
      if (!success) {
        this.switchingProfile = null;
        this.toastService.error("Ce profil n'est plus autorisé pour votre compte.", 'Basculement impossible');
        return;
      }

      this.closeDropdown();
      // Un rechargement de l'application reconstruit immédiatement le menu, les gardes et le
      // tableau de bord du nouveau profil. Les jetons restent présents : aucune déconnexion.
      window.location.assign('/');
    });
  }

  profileInitials(profile: ProfileOption): string {
    return profile.code.slice(0, 2).toUpperCase();
  }

  private loadProfiles(): void {
    this.isLoadingProfiles = true;
    this.authService.availableProfiles$().subscribe({
      next: (profiles) => {
        this.profiles = profiles;
        this.isLoadingProfiles = false;
      },
      error: () => {
        this.profiles = this.authService.user()?.profiles ?? [];
        this.isLoadingProfiles = false;
      }
    });
  }
}
