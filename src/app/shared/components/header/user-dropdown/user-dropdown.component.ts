import { Component, OnInit } from '@angular/core';
import { DropdownComponent } from '../../ui/dropdown/dropdown.component';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DropdownItemTwoComponent } from '../../ui/dropdown/dropdown-item/dropdown-item.component-two';
import { AuthenticationService } from '../../../../core/services/authentication.service';
import { ProfileService } from '../../../../core/services/profile.service';

@Component({
  selector: 'app-user-dropdown',
  templateUrl: './user-dropdown.component.html',
  imports:[CommonModule,RouterModule,DropdownComponent,DropdownItemTwoComponent]
})
export class UserDropdownComponent implements OnInit {
  isOpen = false;

  constructor(
    public authService: AuthenticationService,
    private profileService: ProfileService
  ) {
  }

  ngOnInit(): void {
    this.profileService.consulter().subscribe({
      next: (profile) => this.authService.synchroniserProfil(profile),
      error: () => undefined
    });
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
}
