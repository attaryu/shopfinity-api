export interface User {
  id: string;
  email: string;
  fullname: string;
  password: string;
  role: 'USER' | 'ADMIN';
  refreshToken?: string | null;
}
