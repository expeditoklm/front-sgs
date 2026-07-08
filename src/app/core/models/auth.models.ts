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
