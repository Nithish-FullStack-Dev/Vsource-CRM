"use client";

import { Input } from "@/components/ui/input";
import { useDebouncedValue } from "@/hooks/assign-target/useDebouncedValue";
import AddUserSheet from "@/users/components/AddUserSheet";
import DeleteUserDialog from "@/users/components/DeleteUserDialog";
import EditUserSheet from "@/users/components/EditUserSheet";
import UserTable from "@/users/components/UserTable";
import ViewUserSheet from "@/users/components/ViewUserSheet";
import { useUsers } from "@/users/hooks/useUsers";
import { User } from "@/users/types/user";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const limit = 10;

  const debouncedSearch = useDebouncedValue(search);

  const { data, isLoading } = useUsers({
    search: debouncedSearch,
    page,
    limit,
  });

  const [viewOpen, setViewOpen] = useState(false);

  const [editOpen, setEditOpen] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const handleView = (user: User) => {
    setSelectedUser(user);
    setViewOpen(true);
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setEditOpen(true);
  };

  const handleDelete = (user: User) => {
    setSelectedUser(user);
    setDeleteOpen(true);
  };

  if (isLoading) {
    return <div>Loading users...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {/* Heading */}
        <div className="w-full md:w-auto">
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage users and roles</p>
        </div>

        {/* Right Controls */}
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center md:w-auto">
          {/* Search */}
          <div className="relative w-full sm:flex-1 md:w-80 md:flex-none">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Add User Button */}
          <div className="w-full sm:w-auto">
            <AddUserSheet />
          </div>
        </div>
      </div>

      <UserTable
        users={data?.data ?? []}
        meta={data?.meta}
        page={page}
        onPageChange={setPage}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <ViewUserSheet
        open={viewOpen}
        onOpenChange={setViewOpen}
        user={selectedUser}
      />

      <EditUserSheet
        open={editOpen}
        onOpenChange={setEditOpen}
        user={selectedUser}
      />

      <DeleteUserDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        user={selectedUser}
      />
    </div>
  );
}
