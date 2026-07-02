"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import UserForm from "./UserForm";
import { User } from "../types/user";
import { useRoles } from "@/rbac/hooks";
import { useBranches } from "../hooks/useBranches";
import { useUpdateUser } from "../hooks/useUpdateUser";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
}

export default function EditUserSheet({ open, onOpenChange, user }: Props) {
  const { data: roles = [] } = useRoles();

  const { data: branches = [] } = useBranches();

  const updateMutation = useUpdateUser();

  if (!user) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-150 overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit User</SheetTitle>
        </SheetHeader>

        <div className="mt-6">
          <UserForm
            mode="edit"
            roles={roles}
            branches={branches}
            isLoading={updateMutation.isPending}
            defaultValues={{
              name: user.name,
              email: user.email,
              branchIds: user.branches.map((branch) => branch.id) || [],
              roleId: user.role.id,
            }}
            onSubmit={(values) => {
              const payload = {
                ...values,
              };

              if (!payload.password?.trim()) {
                delete payload.password;
              }

              updateMutation.mutate(
                {
                  id: user.id,
                  payload,
                },
                {
                  onSuccess: () => {
                    onOpenChange(false);
                  },
                },
              );
            }}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
