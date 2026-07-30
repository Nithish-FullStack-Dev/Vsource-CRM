"use client";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

import { getUserColumns } from "./UserColumns";
import { User } from "../types/user";
import { useAuth } from "@/store";

interface Props {
  users: User[];
  onView: (user: User) => void;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  meta: {
    page: number;
    totalPages: number;
    total: number;
    limit: number;
  };
  page: number;
  onPageChange: (page: number) => void;
}

export default function UserTable({
  users,
  onView,
  onEdit,
  onDelete,
  meta,
  page,
  onPageChange,
}: Props) {
  const { canUpdate } = useAuth();

  const columns = getUserColumns({
    onView,
    onEdit,
    canUpdate,
  });

  const table = useReactTable({
    data: users,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const rows = table.getRowModel().rows;
  const flatHeaders = table.getFlatHeaders();

  const startItem = meta.total === 0 ? 0 : (meta.page - 1) * meta.limit + 1;

  const endItem = Math.min(meta.page * meta.limit, meta.total);

  const getColumnHeader = (columnId: string) => {
    const header = flatHeaders.find(
      (currentHeader) => currentHeader.column.id === columnId,
    );

    if (!header || header.isPlaceholder) {
      return columnId;
    }

    return flexRender(header.column.columnDef.header, header.getContext());
  };

  const renderPagination = () => (
    <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-0.5">
        <p className="text-sm text-muted-foreground">
          Showing {startItem}–{endItem} of {meta.total} users
        </p>

        <p className="text-xs text-muted-foreground">
          Page {meta.page} of {Math.max(meta.totalPages, 1)}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:flex">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </Button>

        <Button
          variant="outline"
          size="sm"
          disabled={page >= meta.totalPages || meta.totalPages === 0}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );

  return (
    <div className="overflow-hidden rounded-xl border bg-background">
      <div className="hidden md:block">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>

            <TableBody>
              {rows.length ? (
                rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-32 text-center text-muted-foreground"
                  >
                    No users found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {renderPagination()}
      </div>

      <div className="md:hidden">
        {rows.length ? (
          <div className="space-y-4 p-3">
            {rows.map((row, rowIndex) => {
              const visibleCells = row.getVisibleCells();

              const actionCells = visibleCells.filter(
                (cell) =>
                  cell.column.id.toLowerCase() === "actions" ||
                  cell.column.id.toLowerCase() === "action",
              );

              const dataCells = visibleCells.filter(
                (cell) =>
                  cell.column.id.toLowerCase() !== "actions" &&
                  cell.column.id.toLowerCase() !== "action",
              );

              const primaryCell = dataCells[0];
              const detailCells = dataCells.slice(1);

              return (
                <Card key={row.id} className="overflow-hidden shadow-sm">
                  <CardHeader className="space-y-2 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      User {(page - 1) * meta.limit + rowIndex + 1}
                    </p>

                    <div className="break-words text-base font-semibold">
                      {primaryCell
                        ? flexRender(
                            primaryCell.column.columnDef.cell,
                            primaryCell.getContext(),
                          )
                        : `User ${(page - 1) * meta.limit + rowIndex + 1}`}
                    </div>
                  </CardHeader>

                  {detailCells.length > 0 && <Separator />}

                  <CardContent className="p-0">
                    <div className="divide-y">
                      {detailCells.map((cell) => (
                        <div
                          key={cell.id}
                          className="grid grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] items-start gap-3 px-4 py-3"
                        >
                          <div className="break-words text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            {getColumnHeader(cell.column.id)}
                          </div>

                          <div className="min-w-0 break-words text-right text-sm font-medium">
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>

                  {actionCells.length > 0 && (
                    <>
                      <Separator />

                      <CardFooter className="flex flex-wrap items-center justify-end gap-2 p-4">
                        {actionCells.map((cell) => (
                          <div key={cell.id}>
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </div>
                        ))}
                      </CardFooter>
                    </>
                  )}
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="flex h-40 items-center justify-center px-4 text-center text-sm text-muted-foreground">
            No users found
          </div>
        )}

        {renderPagination()}
      </div>
    </div>
  );
}
