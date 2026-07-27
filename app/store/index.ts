// crm-frontend-next\app\store\index.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authService } from "@/services/auth.service";
import { Role } from "@/rbac/types";
import { hasPermission } from "@/hooks/hasPermission";
import { User } from "@/users/types/user";
import { Branch } from "@/lib/branches";

export type ModuleCode =
  | "MASTER_LEADS"
  | "MBBS_LEADS"
  | "BRANCHES"
  | "UNIVERSITIES"
  | "MASTER_SETTINGS"
  | "ROLES"
  | "USERS";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  branches?: Branch[];
}

interface AuthState {
  user: AuthUser | null;

  isAuthenticated: boolean;

  isHydrating: boolean;

  login: (
    email: string,
    password: string,
    deviceFingerprint: string,
  ) => Promise<{
    ok: boolean;
    error?: string;
    attemptsLeft?: number;
    user: User | null;
  }>;

  logout: () => Promise<void>;

  hydrateUser: () => Promise<void>;

  canRead: (moduleCode: string) => boolean;
  canCreate: (moduleCode: string) => boolean;
  canUpdate: (moduleCode: string) => boolean;
  canDelete: (moduleCode: string) => boolean;
}

export const useAuth = create<AuthState>()((set, get) => ({
  user: null,
  isAuthenticated: false,
  isHydrating: true,

  login: async (email, password, deviceFingerprint) => {
    try {
      const data = await authService.login(email, password, deviceFingerprint);

      set({
        user: data.user,
        isAuthenticated: true,
      });

      return { ok: true, user: data.user };
    } catch (error: any) {
      return {
        ok: false,
        error: error?.message ?? "Login failed",
        attemptsLeft: error?.attemptsLeft,
        user: null,
      };
    }
  },

  logout: async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error(error);
    }

    set({
      user: null,
      isAuthenticated: false,
      isHydrating: false,
    });
  },

  canRead: (moduleCode) => {
    const permissions = get().user?.role?.modulePermissions ?? [];

    return hasPermission(permissions, moduleCode, "canRead");
  },

  canCreate: (moduleCode) => {
    const permissions = get().user?.role?.modulePermissions ?? [];

    return hasPermission(permissions, moduleCode, "canCreate");
  },

  canUpdate: (moduleCode) => {
    const permissions = get().user?.role?.modulePermissions ?? [];

    return hasPermission(permissions, moduleCode, "canUpdate");
  },

  canDelete: (moduleCode) => {
    const permissions = get().user?.role?.modulePermissions ?? [];

    return hasPermission(permissions, moduleCode, "canDelete");
  },

  hydrateUser: async () => {
    set({ isHydrating: true });

    try {
      const user = await authService.me();

      if (!user) {
        set({
          user: null,
          isAuthenticated: false,
          isHydrating: false,
        });

        return;
      }

      set({
        user,
        isAuthenticated: true,
        isHydrating: false,
      });
    } catch {
      set({
        user: null,
        isAuthenticated: false,
        isHydrating: false,
      });
    }
  },
}));

interface UiState {
  sidebarCollapsed: boolean;
  darkMode: boolean;
  toggleSidebar: () => void;
  toggleDark: () => void;
  commandOpen: boolean;
  setCommandOpen: (v: boolean) => void;
}

export const useUi = create<UiState>()((set, get) => ({
  sidebarCollapsed: false,
  darkMode: false,

  toggleSidebar: () =>
    set({
      sidebarCollapsed: !get().sidebarCollapsed,
    }),

  toggleDark: () => {
    const v = !get().darkMode;

    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", v);
    }

    set({ darkMode: v });
  },

  commandOpen: false,

  setCommandOpen: (v) =>
    set({
      commandOpen: v,
    }),
}));