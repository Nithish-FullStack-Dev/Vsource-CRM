// app/config/navigation.ts

import {
  Users,
  UserCog,
  ShieldCheck,
  Settings2,
  MapPin,
  LayoutDashboard,
  Building2,
  GraduationCap,
  BarChart3,
  TargetIcon,
  Banknote,
} from "lucide-react";

export const navigationItems = [
  {
    moduleCode: "DASHBOARD",
    to: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    moduleCode: "MASTER_LEADS",
    to: "/leads",
    label: "MASTER Walkins",
    icon: Users,
  },
  {
    moduleCode: "MBBS_Walkin",
    to: "/mbbs-leads",
    label: "MBBS Walkins",
    icon: Users,
  },
  {
    moduleCode: "STUDENT_PROFILES",
    to: "/student-profiles",
    label: "Visa Applications",
    icon: GraduationCap,
  },
  {
    moduleCode: "LOAN_APPLICATION",
    to: "/loan-application",
    label: "Loan Application",
    icon: Banknote,
  },
  {
    moduleCode: "APPLICATIONS",
    to: "/master-tracker",
    label: "Master Tracker",
    icon: GraduationCap,
  },
  {
    moduleCode: "PERFORMANCES",
    to: "/performances",
    label: "Performance",
    icon: GraduationCap,
  },
  {
    moduleCode: "BRANCHES",
    to: "/branches",
    label: "Branches",
    icon: MapPin,
  },
  {
    moduleCode: "ASSIGN_TARGET",
    to: "/assign-target",
    label: "Assign Target",
    icon: TargetIcon,
  },
  {
    moduleCode: "UNIVERSITIES",
    to: "/universities",
    label: "Abroad Universities",
    icon: Building2,
  },
  {
    moduleCode: "MASTER_SETTINGS",
    to: "/master-settings",
    label: "Master Settings",
    icon: Settings2,
  },
  {
    moduleCode: "ROLES",
    to: "/roles",
    label: "Roles & Permissions",
    icon: ShieldCheck,
  },
  {
    moduleCode: "USERS",
    to: "/users",
    label: "User Management",
    icon: UserCog,
  },
] as const;

export const routeConfig = [
  {
    moduleCode: "DASHBOARD",
    routes: [
      {
        path: "/dashboard",
        permission: "canRead",
      },
    ],
  },

  {
    moduleCode: "MASTER_LEADS",
    routes: [
      {
        path: "/leads/add",
        permission: "canCreate",
      },
      {
        path: "/leads/all",
        permission: "canRead",
      },
    ],
  },

  {
    moduleCode: "MBBS_Walkin",
    routes: [
      {
        path: "/mbbs-leads/add",
        permission: "canCreate",
      },
      {
        path: "/mbbs-leads/all",
        permission: "canRead",
      },
    ],
  },

  {
    moduleCode: "STUDENT_PROFILES",
    routes: [
      {
        path: "/student-profiles",
        permission: "canRead",
      },
    ],
  },

  {
    moduleCode: "APPLICATIONS",
    routes: [
      {
        path: "/applications",
        permission: "canRead",
      },
    ],
  },

  {
    moduleCode: "PERFORMANCES",
    routes: [
      {
        path: "/performances",
        permission: "canRead",
      },
    ],
  },

  {
    moduleCode: "BRANCHES",
    routes: [
      {
        path: "/branches",
        permission: "canRead",
      },
    ],
  },

  {
    moduleCode: "UNIVERSITIES",
    routes: [
      {
        path: "/universities",
        permission: "canRead",
      },
    ],
  },

  {
    moduleCode: "MASTER_SETTINGS",
    routes: [
      {
        path: "/master-settings",
        permission: "canRead",
      },
    ],
  },

  {
    moduleCode: "ROLES",
    routes: [
      {
        path: "/roles",
        permission: "canRead",
      },
    ],
  },

  {
    moduleCode: "USERS",
    routes: [
      {
        path: "/users",
        permission: "canRead",
      },
    ],
  },
] as const;
