"use client";

import { cn } from "@/lib/utils";
import { Role } from "../types";

interface Props {
  roles: Role[];
  selectedRole: Role | null;
  onSelect: (role: Role) => void;
}

export default function RoleSidebar({ roles = [], selectedRole, onSelect }: Props) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-950">
      <div className="border-b border-slate-100 p-4 dark:border-slate-800">
        <h3 className="text-sm font-black uppercase tracking-wider text-slate-500">
          Roles & Permissions
        </h3>
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {roles?.map((role) => (
          <button
            key={role.id}
            type="button"
            onClick={() => onSelect(role)}
            className={cn(
              "w-full p-4 text-left transition hover:bg-slate-50 dark:hover:bg-slate-900/50",
              selectedRole?.id === role.id && "bg-slate-100 dark:bg-slate-900",
            )}
          >
            <p className="text-sm font-black text-slate-800 dark:text-slate-100">{role.name}</p>
            <p className="mt-0.5 text-xs text-slate-500 line-clamp-1">{role.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}