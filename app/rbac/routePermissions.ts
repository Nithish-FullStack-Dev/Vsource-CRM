// app/rbac/routePermissions.ts

export const routePermissions: Record<string, string> = {
  "/dashboard": "DASHBOARD",

  "/leads": "MASTER_LEADS",
  "/leads/add": "MASTER_LEADS",
  "/leads/all": "MASTER_LEADS",

  "/mbbs-leads": "MBBS_LEADS",
  "/mbbs-leads/add": "MBBS_LEADS",
  "/mbbs-leads/all": "MBBS_LEADS",

  "/student-profiles": "STUDENT_PROFILES",

  "/applications": "APPLICATIONS",

  "/performances": "PERFORMANCES",

  "/universities": "UNIVERSITIES",

  "/branches": "BRANCHES",

  "/master-settings": "MASTER_SETTINGS",

  "/roles": "ROLES",

  "/users": "USERS",
};

export const moduleLandingRoutes: Record<string, string> = {
  DASHBOARD: "/dashboard",

  MASTER_LEADS: "/leads/add",

  MBBS_Walkin: "/mbbs-leads/add",

  BRANCHES: "/branches",

  MASTER_SETTINGS: "/master-settings",

  ROLES: "/roles",

  USERS: "/users",
};
