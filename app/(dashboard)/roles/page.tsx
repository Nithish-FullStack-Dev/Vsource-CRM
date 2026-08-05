// app\(dashboard)\roles\page.tsx
"use client";

import ErrorState from "@/rbac/components/ErrorState";
import PermissionMatrix from "@/rbac/components/PermissionMatrix";
import PermissionMatrixSkeleton from "@/rbac/components/PermissionMatrixSkeleton";
import RoleSidebar from "@/rbac/components/RoleSidebar";
import RoleSidebarSkeleton from "@/rbac/components/RoleSidebarSkeleton";
import { useModules, useRoles } from "@/rbac/hooks";
import { Role } from "@/rbac/types";
import { useEffect, useState } from "react";

export default function RolesPage() {
  const {
    data: roles = [],
    isLoading: rolesLoading,
    isError: rolesError,
  } = useRoles();

  const {
    data: modules = [],
    isLoading: modulesLoading,
    isError: modulesError,
  } = useModules();

  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  useEffect(() => {
    if (!selectedRole || roles.length === 0) return;

    const latestRole = roles.find((role: Role) => role.id === selectedRole.id);

    if (latestRole) {
      setSelectedRole(latestRole);
    }
  }, [roles]);

  if (rolesLoading || modulesLoading) {
    return (
      <div className="grid h-full grid-cols-1 lg:grid-cols-[300px_1fr] gap-4 sm:gap-6 p-4 sm:p-6">
        <RoleSidebarSkeleton />
        <PermissionMatrixSkeleton />
      </div>
    );
  }

  if (rolesError || modulesError) {
    return (
      <div className="p-4 sm:p-6">
        <ErrorState
          title="Failed to load RBAC"
          description="Please refresh and try again."
        />
      </div>
    );
  }

  return (
    <div className="grid h-full grid-cols-1 lg:grid-cols-[300px_1fr] gap-4 sm:gap-6 p-4 sm:p-6">
      {/* Sidebar hidden on mobile when a role is selected */}
      <div className={`${selectedRole ? "hidden lg:block" : "block"}`}>
        <RoleSidebar
          roles={roles}
          selectedRole={selectedRole}
          onSelect={setSelectedRole}
        />
      </div>

      {/* Permission matrix hidden on mobile when no role is selected */}
      <div className={`${!selectedRole ? "hidden lg:block" : "block"}`}>
        <PermissionMatrix
          role={selectedRole}
          modules={modules}
          onBack={() => setSelectedRole(null)}
        />
      </div>
    </div>
  );
}
