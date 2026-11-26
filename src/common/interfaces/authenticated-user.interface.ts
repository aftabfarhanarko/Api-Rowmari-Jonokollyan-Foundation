import { RoleName } from '../constants';

export interface AuthenticatedUser {
  id: string;
  email: string;
  phone: string;
  fullName: string;
  avatarUrl?: string | null;
  roles: (RoleName | string)[];
  permissions: string[];
}
