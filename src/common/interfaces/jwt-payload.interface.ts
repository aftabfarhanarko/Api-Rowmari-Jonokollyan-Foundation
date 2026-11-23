export interface JwtPayload {
  sub: string;
  email: string;
  phone: string;
  roles: string[];
  permissions: string[];
  iat?: number;
  exp?: number;
}
