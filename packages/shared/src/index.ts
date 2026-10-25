export type Role = "owner" | "operator" | "super_admin";

export interface AuthUser {
  id: number;
  username: string;
  role: Role;
  farmId: number | null;
  farmName: string | null;
  isActive: boolean;
}

export interface Farm {
  id: number;
  name: string;
}

export interface Coop {
  id: number;
  farmId: number;
  farmName: string | null;
  name: string;
  operatorIds: number[];
}

export interface ApiError {
  error: string;
}
