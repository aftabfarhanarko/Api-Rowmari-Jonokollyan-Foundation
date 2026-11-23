import { RoleName } from '../constants';

export interface AuthenticatedUser {
  id: string;
  email: string;
  phone: string;
  fullName: string;
  roles: (RoleName | string)[];
  permissions: string[];
}
