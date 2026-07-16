export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface UserSummary {
  email: string;
  firstName: string;
  lastName: string;
}

export interface ProfileOption {
  code: string;
  libelle: string;
}

export interface User {
  login: string;
  email: string;
  firstName: string;
  lastName: string;
  profilCode: string;
  profilLibelle: string;
}

export interface MonProfil {
  id: number;
  uuid: string;
  code: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  phone: string | null;
  actif: boolean;
  profilCode: string;
  profilLibelle: string;
  keycloakId: string | null;
}

export interface MonProfilRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
}
