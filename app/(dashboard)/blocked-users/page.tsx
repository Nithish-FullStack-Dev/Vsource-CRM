"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/store";
import { useBlockedUsers } from "@/users/hooks/useBlockedUsers";
import { useUnblockUser } from "@/users/hooks/useUnblockUser";
import { ROLES } from "@/lib/roles";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function BlockedUsersPage() {
  const router = useRouter();
  const { user: currentUser, isHydrating } = useAuth();
  const [page, setPage] = useState(1);
  const limit = 10;

  const isSuperAdmin = currentUser?.role?.name === ROLES.SUPER_ADMIN;

  useEffect(() => {
    if (!isHydrating && !isSuperAdmin) {
      router.replace("/unauthorized");
    }
  }, [isHydrating, isSuperAdmin, router]);

  const { data, isLoading } = useBlockedUsers({ page, limit });
  const unblockMutation = useUnblockUser();

  const handleUnblock = (userId: string, name: string) => {
    unblockMutation.mutate(userId, {
      onSuccess: () => {
        toast.success(`${name} has been unblocked.`);
      },
      onError: () => {
        toast.error("Failed to unblock user.");
      },
    });
  };

  if (isHydrating || !isSuperAdmin) {
    return null;
  }

  if (isLoading) {
    return <div>Loading blocked users...</div>;
  }

  const users = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Blocked Users</h1>
        <p className="text-muted-foreground">
          Accounts locked after 3 failed login attempts. Only Super Admin can
          unblock them.
        </p>
      </div>

      <div className="rounded-xl border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Failed Attempts</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length ? (
              users.map((u: any) => (
                <TableRow key={u.id}>
                  <TableCell>{u.name}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{u.role?.name ?? "-"}</TableCell>
                  <TableCell>{u.failedLoginAttempts}</TableCell>
                  <TableCell>
                    <Badge variant="destructive">Blocked</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      onClick={() => handleUnblock(u.id, u.name)}
                      disabled={unblockMutation.isPending}
                    >
                      Unblock
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  No blocked users
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {meta && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <p className="text-sm text-muted-foreground">
              Showing page {meta.page} of {meta.totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}