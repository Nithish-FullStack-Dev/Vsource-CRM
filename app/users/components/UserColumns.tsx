"use client";

import { ColumnDef } from "@tanstack/react-table";

import { MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User } from "../types/user";
import { Badge } from "@/components/ui/badge";
import { MODULES } from "@/lib/module-codes";

interface Props {
  onView: (user: User) => void;
  onEdit: (user: User) => void;
  canUpdate: (moduleCode: string) => boolean;
}

export const getUserColumns = ({
  onView,
  onEdit,
  canUpdate,
}: Props): ColumnDef<User>[] => [
  {
    accessorKey: "name",
    header: "Name",
  },

  {
    accessorKey: "email",
    header: "Email",
  },

  {
    id: "roles",
    header: "Roles",
    cell: ({ row }) => {
      const roles = row.original.role?.name ?? "-";

      return <span className="text-sm">{roles}</span>;
    },
  },

  {
    id: "branches",
    header: "Branches",
    cell: ({ row }) => {
      const branches = row.original.branches ?? [];

      if (!branches.length) {
        return "-";
      }

      return (
        <div className="flex flex-wrap gap-1">
          {branches.map((branch, idx) => (
            <Badge key={branch.id || idx} variant="secondary">
              {branch.name}{" "}
            </Badge>
          ))}
        </div>
      );
    },
  },

  {
    id: "status",
    header: "Status",
    cell: ({ row }) => {
      const isBlocked = row.original.isBlocked;

      return isBlocked ? (
        <Badge variant="destructive">Blocked</Badge>
      ) : (
        <Badge variant="secondary">Active</Badge>
      );
    },
  },

  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => {
      return new Date(row.original.createdAt).toLocaleDateString();
    },
  },

  {
    id: "actions",
    cell: ({ row }) => {
      const user = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onView(user)}>
              View
            </DropdownMenuItem>

            {canUpdate(MODULES.USERS) && (
              <DropdownMenuItem onClick={() => onEdit(user)}>
                Edit
              </DropdownMenuItem>
            )}

            {/* <DropdownMenuItem
              className="text-red-500"
              onClick={() => onDelete(user)}
            >
              Delete
            </DropdownMenuItem> */}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];