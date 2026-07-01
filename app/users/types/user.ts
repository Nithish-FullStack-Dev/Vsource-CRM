import { ModulePermission } from "@/rbac/types";

export interface Role {
  id: string;
  name: string;
  modulePermissions?: ModulePermission[];
}

export interface Branch {
  id: string;
  name: string;
}

export interface User {
  id: string;

  name: string;
  email: string;

  createdAt: string;
  updatedAt: string;

  branches: Branch[];

  role: Role;

  target?: number | null;
}
