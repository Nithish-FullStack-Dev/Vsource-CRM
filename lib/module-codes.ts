// lib/module-codes.ts

export const MODULES = {
  DASHBOARD: "DASHBOARD",
  MASTER_LEADS: "MASTER_LEADS",
  MBBS_LEADS: "MBBS_LEADS",
  STUDENT_PROFILES: "STUDENT_PROFILES",
  APPLICATIONS: "APPLICATIONS",
  PERFORMANCES: "PERFORMANCES",
  BRANCHES: "BRANCHES",
  UNIVERSITIES: "UNIVERSITIES",
  MASTER_SETTINGS: "MASTER_SETTINGS",
  ROLES: "ROLES",
  USERS: "USERS",
  ASSIGN_TARGET: "ASSIGN_TARGET",
} as const;

export const PERMISSIONS = {
  CREATE: "canCreate",
  READ: "canRead",
  UPDATE: "canUpdate",
  DELETE: "canDelete",
} as const;

export type PermissionAction =
  | "canCreate"
  | "canRead"
  | "canUpdate"
  | "canDelete";
