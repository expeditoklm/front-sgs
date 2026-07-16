export interface PermissionProfile {
  code: string;
  libelle: string;
  actif: boolean;
}

export interface SystemPermission {
  id: number;
  uuid: string;
  code: string;
  libelle: string;
  module: string;
  path: string;
  description: string;
  ordre: number;
}

export interface PermissionMatrix {
  profils: PermissionProfile[];
  permissions: SystemPermission[];
  affectations: Record<string, string[]>;
}
