import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfirmDialogComponent } from '../../../shared/components/referentiel/confirm-dialog/confirm-dialog.component';
import { PermissionMatrix, PermissionProfile, SystemPermission } from '../../../core/models/permission.models';
import { PermissionService } from '../../../core/services/permission.service';
import { PaginationComponent } from '../../../shared/components/ui/pagination/pagination.component';
import { SelectComponent } from '../../../shared/components/form/select/select.component';

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
  erreur = '';
  succes = '';
  page = 1;
  pageSize = 10;

  constructor(private permissionsService: PermissionService) {
  }

  ngOnInit(): void {
    this.charger();
  }

  charger(): void {
    this.chargement = true;
    this.erreur = '';
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
        this.erreur = erreur?.error?.message ?? 'Impossible de charger la matrice des permissions.';
        this.chargement = false;
      }
    });
  }

  get profils(): PermissionProfile[] {
    return this.matrice.profils.filter(profil => profil.actif);
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
    if (profil === 'SADM') return;
    const droits = this.selection[profil] ?? new Set<string>();
    droits.has(permission) ? droits.delete(permission) : droits.add(permission);
    this.selection[profil] = new Set(droits);
    this.succes = '';
  }

  basculerProfil(profil: string, activer: boolean): void {
    if (profil === 'SADM') return;
    this.selection[profil] = activer
      ? new Set(this.permissionsFiltrees.map(permission => permission.code))
      : new Set();
  }

  basculerModule(module: string, profil: string, activer: boolean): void {
    if (profil === 'SADM') return;
    const droits = new Set(this.selection[profil] ?? []);
    this.matrice.permissions.filter(permission => permission.module === module)
      .forEach(permission => activer ? droits.add(permission.code) : droits.delete(permission.code));
    this.selection[profil] = droits;
  }

  moduleComplet(module: string, profil: string): boolean {
    const permissions = this.matrice.permissions.filter(permission => permission.module === module);
    return permissions.length > 0 && permissions.every(permission => this.autorise(profil, permission.code));
  }

  profilComplet(profil: string): boolean {
    return this.matrice.permissions.length > 0 &&
      this.matrice.permissions.every(permission => this.autorise(profil, permission.code));
  }

  get modifie(): boolean {
    return !this.chargement && this.signature() !== this.original;
  }

  ouvrirConfirmation(): void {
    if (this.modifie) this.confirmation = true;
  }

  enregistrer(): void {
    this.sauvegarde = true;
    this.erreur = '';
    const affectations = Object.fromEntries(
      this.profils.map(profil => [profil.code, [...(this.selection[profil.code] ?? [])].sort()])
    );
    this.permissionsService.enregistrer(affectations).subscribe({
      next: matrice => {
        this.matrice = matrice;
        this.selection = Object.fromEntries(
          matrice.profils.map(profil => [profil.code, new Set(matrice.affectations[profil.code] ?? [])])
        );
        this.original = this.signature();
        this.succes = 'La matrice des permissions a été enregistrée.';
        this.sauvegarde = false;
        this.confirmation = false;
      },
      error: erreur => {
        this.erreur = erreur?.error?.message ?? 'La sauvegarde des permissions a échoué.';
        this.sauvegarde = false;
        this.confirmation = false;
      }
    });
  }

  annuler(): void {
    this.selection = Object.fromEntries(
      this.matrice.profils.map(profil => [profil.code, new Set(this.matrice.affectations[profil.code] ?? [])])
    );
    this.succes = '';
  }

  private signature(): string {
    return JSON.stringify(Object.fromEntries(
      Object.entries(this.selection).map(([profil, droits]) => [profil, [...droits].sort()])
    ));
  }
}
