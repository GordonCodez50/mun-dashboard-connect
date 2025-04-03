
export type UserRole = 'chair' | 'admin';

export type User = {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  council?: string; // For chairs
  email?: string;
  createdAt: Date;
  lastLogin?: Date;
};

export type Credentials = {
  username: string;
  password: string;
};

export type UserFormData = {
  username: string;
  password: string;
  name: string;
  role: UserRole;
  council?: string;
  email?: string;
};
