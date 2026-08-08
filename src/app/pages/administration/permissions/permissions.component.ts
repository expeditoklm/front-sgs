import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfirmDialogComponent } from '../../../shared/components/referentiel/confirm-dialog/confirm-dialog.component';
import { PermissionMatrix, PermissionProfile, SystemPermission } from '../../../core/models/permission.models';
import { PermissionService } from '../../../core/services/permission.service';
import { PaginationComponent } from '../../../shared/components/ui/pagination/pagination.component';
import { SelectComponent } from '../../../shared/components/form/select/select.component';
import { ToastService } from '../../../core/services/toast.service';
import { AuthenticationService } from '../../../core/services/authentication.service';

@Component({
  selector: 'app-permissions',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmDialogComponent, PaginationComponent, SelectComponent],
  templateUrl: './permissions.component.html'
})
export class PermissionsComponent implements OnInit {
  matrice: PermissionMatrix = { profils: [], permissions: [], affectations: {} };
  selection: Record<string, Set<string>> = {};
  original = '';
  recherche = '';
  module = '';
  chargement = true;
  sauvegarde = false;
  confirmation = false;
  page = 1;
  pageSize = 10;

  constructor(
    private permissionsService: PermissionService,
    private authService: AuthenticationService,
    private toast: ToastService
  ) {
  }

  ngOnInit(): void {
    this.charger();
  }

  charger(): void {
    this.chargement = true;
    this.permissionsService.charger().subscribe({
      next: matrice => {
        this.matrice = matrice;
        this.selection = Object.fromEntries(
          matrice.profils.map(profil => [profil.code, new Set(matrice.affectations[profil.code] ?? [])])
        );
        this.original = this.signature();
        this.chargement = false;
      },
      error: erreur => {
        this.toast.error(erreur?.error?.message ?? 'Impossible de charger la matrice des permissions.', 'Chargement impossible');
        this.chargement = false;
      }
    });
  }

  get profils(): PermissionProfile[] {
    return this.matrice.profils.filter(profil => profil.actif);
  }

  get profilConnecteCode(): string {
    return this.authService.user()?.profilCode ?? '';
  }

  get estSuperAdmin(): boolean {
    return this.profilConnecteCode === 'SADM';
  }

  get estAdmin(): boolean {
    return this.profilConnecteCode === 'ADM';
  }

  get permissionsModifiables(): Set<string> {
    const user = this.authService.user();
    if (this.estSuperAdmin) {
      return new Set(this.matrice.permissions.map(permission => permission.code));
    }
    if (this.estAdmin) {
      return new Set(user?.permissions ?? []);
    }
    return new Set();
  }

  peutModifierProfil(profil: string): boolean {
    if (this.estSuperAdmin) return true;
    if (this.estAdmin) return profil !== 'SADM';
    return false;
  }

  peutModifierPermission(permission: SystemPermission, profil: string): boolean {
    if (!this.peutModifierProfil(profil)) {
      return false;
    }
    return this.permissionsModifiables.has(permission.code);
  }

  droitsModifiablesPourProfil(profil: string): SystemPermission[] {
    if (!this.peutModifierProfil(profil)) {
      return [];
    }
    if (this.estSuperAdmin) {
      return this.matrice.permissions;
    }
    return this.matrice.permissions.filter(permission => this.permissionsModifiables.has(permission.code));
  }

  get modules(): string[] {
    return [...new Set(this.matrice.permissions.map(permission => permission.module))].filter(Boolean);
  }

  get moduleOptions() {
    return this.modules.map(module => ({ value: module, label: module }));
  }

  get permissionsFiltrees(): SystemPermission[] {
    const terme = this.recherche.trim().toLowerCase();
    return this.matrice.permissions.filter(permission =>
      (!this.module || permission.module === this.module) &&
      (!terme || [permission.libelle, permission.code, permission.path, permission.description]
        .some(value => value?.toLowerCase().includes(terme)))
    );
  }

  get groupes(): Array<{ module: string; permissions: SystemPermission[] }> {
    const groupes = new Map<string, SystemPermission[]>();
    const debut = (this.page - 1) * this.pageSize;
    this.permissionsFiltrees.slice(debut, debut + this.pageSize).forEach(permission => {
      const cle = permission.module || 'Autres';
      groupes.set(cle, [...(groupes.get(cle) ?? []), permission]);
    });
    return [...groupes.entries()].map(([module, permissions]) => ({ module, permissions }));
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.permissionsFiltrees.length / this.pageSize));
  }

  reinitialiserPagination(): void {
    this.page = 1;
  }

  changerPage(page: number): void {
    this.page = Math.min(Math.max(page, 1), this.totalPages);
  }

  changerTaille(pageSize: number): void {
    this.pageSize = pageSize;
    this.page = 1;
  }

  autorise(profil: string, permission: string): boolean {
    return this.selection[profil]?.has(permission) ?? false;
  }

  basculer(profil: string, permission: string): void {
    if (!this.peutModifierProfil(profil) || !this.permissionsModifiables.has(permission)) return;
    const droits = this.selection[profil] ?? new Set<string>();
    droits.has(permission) ? droits.delete(permission) : droits.add(permission);
    this.selection[profil] = new Set(droits);
  }

  basculerProfil(profil: string, activer: boolean): void {
    if (!this.peutModifierProfil(profil)) return;
    this.selection[profil] = activer
      ? new Set(this.droitsModifiablesPourProfil(profil).map(permission => permission.code))
      : new Set();
  }

  basculerModule(module: string, profil: string, activer: boolean): void {
    if (!this.peutModifierProfil(profil)) return;
    const droits = new Set(this.selection[profil] ?? []);
    this.matrice.permissions
      .filter(permission => permission.module === module && this.permissionsModifiables.has(permission.code))
      .forEach(permission => activer ? droits.add(permission.code) : droits.delete(permission.code));
    this.selection[profil] = droits;
  }

  moduleComplet(module: string, profil: string): boolean {
    const permissions = this.matrice.permissions.filter(permission =>
      permission.module === module && this.peutModifierPermission(permission, profil)
    );
    return permissions.length > 0 && permissions.every(permission => this.autorise(profil, permission.code));
  }

  profilComplet(profil: string): boolean {
    const permissions = this.droitsModifiablesPourProfil(profil);
    return permissions.length > 0 && permissions.every(permission => this.autorise(profil, permission.code));
  }

  get modifie(): boolean {
    return !this.chargement && this.signature() !== this.original;
  }

  ouvrirConfirmation(): void {
    if (this.modifie) this.confirmation = true;
  }

  enregistrer(): void {
    this.sauvegarde = true;
    const affectations = Object.fromEntries(
      this.profils.map(profil => {
        const selection = [...(this.selection[profil.code] ?? [])]
          .filter(code => this.estSuperAdmin || this.permissionsModifiables.has(code))
          .sort();
        return [profil.code, selection];
      })
    );
    this.permissionsService.enregistrer(affectations).subscribe({
      next: matrice => {
        this.matrice = matrice;
        this.selection = Object.fromEntries(
          matrice.profils.map(profil => [profil.code, new Set(matrice.affectations[profil.code] ?? [])])
        );
        this.original = this.signature();
        this.toast.success('La matrice des permissions a été enregistrée.');
        this.sauvegarde = false;
        this.confirmation = false;
      },
      error: erreur => {
        this.toast.error(erreur?.error?.message ?? 'La sauvegarde des permissions a échoué.', 'Enregistrement impossible');
        this.sauvegarde = false;
        this.confirmation = false;
      }
    });
  }

  annuler(): void {
    this.selection = Object.fromEntries(
      this.matrice.profils.map(profil => [profil.code, new Set(this.matrice.affectations[profil.code] ?? [])])
    );
  }

  private signature(): string {
    return JSON.stringify(Object.fromEntries(
      Object.entries(this.selection).map(([profil, droits]) => [profil, [...droits].sort()])
    ));
  }
}
