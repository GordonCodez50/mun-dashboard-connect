
export type UserRole = 'delegate' | 'chair' | 'admin' | 'logistics' | 'admin-rt' | 'member-hcc' | 'member-fcc' | 'not-specified';

export type User = {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  council?: string; // For chairs
  email?: string;
  createdAt: Date;
  lastLogin?: Date;
  hasCompletedTour?: boolean; // Tour completion status
  room_no?: string; // Room assignment
  floor_no?: string; // Floor assignment
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
