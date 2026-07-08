export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface User {
  id: string;
  uuid: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  profilCode: string;
  profilLibelle: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  user: User;
}
