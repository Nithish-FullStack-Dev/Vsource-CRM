"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { AppModule, Role } from "../types";
import { useUpdatePermissions } from "../hooks/useUpdatePermissions";
import { permissionsChanged } from "../utils/permission-utils";

interface Props {
  role: Role | null;
  modules: AppModule[];
  onBack: () => void;
}

type PermissionRow = {
  moduleId: string;
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
};

export default function PermissionMatrix({ role, modules, onBack }: Props) {
  const [rows, setRows] = useState<PermissionRow[]>([]);
  const mutation = useUpdatePermissions();

  useEffect(() => {
    if (!role) {
      setRows([]);
      return;
    }

    const mapped = modules.map((module) => {
      const existing = (role.modulePermissions || []).find(
        (p) => p.moduleId === module.id,
      );

      return {
        moduleId: module.id,
        canCreate: existing?.canCreate ?? false,
        canRead: existing?.canRead ?? false,
        canUpdate: existing?.canUpdate ?? false,
        canDelete: existing?.canDelete ?? false,
      };
    });

    setRows(mapped);
  }, [role, modules]);

  const updatePermission = (
    moduleId: string,
    field: "canCreate" | "canRead" | "canUpdate" | "canDelete",
    value: boolean,
  ) => {
    setRows((prev) =>
      prev.map((row) =>
        row.moduleId === moduleId
          ? {
              ...row,
              [field]: value,
            }
          : row,
      ),
    );
  };

  const hasChanges = useMemo(() => {
    if (!role) return false;

    const original = modules.map((module) => {
      const existing = (role.modulePermissions || []).find(
        (permission) => permission.moduleId === module.id,
      );

      return {
        moduleId: module.id,
        canCreate: existing?.canCreate ?? false,
        canRead: existing?.canRead ?? false,
        canUpdate: existing?.canUpdate ?? false,
        canDelete: existing?.canDelete ?? false,
      };
    });

    return permissionsChanged(original, rows);
  }, [role, rows, modules]);

  if (!role) {
    return (
      <div className="hidden lg:flex h-full items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500 dark:border-slate-800 dark:bg-slate-900/50">
        Select a role from the sidebar to manage permissions.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mobile Back Button & Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="lg:hidden h-9 w-9 rounded-xl shrink-0"
            onClick={onBack}
            aria-label="Back to roles"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-800 dark:text-white">
              {role.name}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              {role.description}
            </p>
          </div>
        </div>

        <Button
          disabled={mutation.isPending || !hasChanges || rows.length === 0}
          onClick={() =>
            mutation.mutate({
              roleId: role.id,
              permissions: rows,
            })
          }
          className="w-full sm:w-auto rounded-xl font-black"
        >
          {mutation.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Save Changes
        </Button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-950">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[160px]">Module</TableHead>
                <TableHead className="text-center w-[80px]">Create</TableHead>
                <TableHead className="text-center w-[80px]">Read</TableHead>
                <TableHead className="text-center w-[80px]">Update</TableHead>
                <TableHead className="text-center w-[80px]">Delete</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {modules.map((module) => {
                const permission = rows.find((x) => x.moduleId === module.id);

                if (!permission) return null;

                return (
                  <TableRow key={module.id}>
                    <TableCell className="font-semibold text-slate-700 dark:text-slate-200">
                      {module.name}
                    </TableCell>

                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <Switch
                          checked={permission.canCreate}
                          onCheckedChange={(value) =>
                            updatePermission(module.id, "canCreate", value)
                          }
                        />
                      </div>
                    </TableCell>

                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <Switch
                          checked={permission.canRead}
                          onCheckedChange={(value) =>
                            updatePermission(module.id, "canRead", value)
                          }
                        />
                      </div>
                    </TableCell>

                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <Switch
                          checked={permission.canUpdate}
                          onCheckedChange={(value) =>
                            updatePermission(module.id, "canUpdate", value)
                          }
                        />
                      </div>
                    </TableCell>

                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <Switch
                          checked={permission.canDelete}
                          onCheckedChange={(value) =>
                            updatePermission(module.id, "canDelete", value)
                          }
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
