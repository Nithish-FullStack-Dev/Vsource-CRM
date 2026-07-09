"use client";

import { useMemo } from "react";
import { ArrowUpDown, CheckCircle2, Target } from "lucide-react";
import type {
  CellContext,
  ColumnDef,
  OnChangeFn,
  SortingState,
} from "@tanstack/react-table";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatDate,
  getPerformanceStatus,
} from "@/services/performance/performance";
import { MODULES } from "@/lib/module-codes";
import type { CounsellorPerformance } from "@/types/counsellor-performance";

type PerformanceTableProps = {
  data: CounsellorPerformance[];
  periodLabel: string;
  intakeName: string;
  sorting: SortingState;
  isLoading: boolean;
  isError: boolean;
  onSortingChange: OnChangeFn<SortingState>;
  onSetTarget: (counsellor: CounsellorPerformance) => void;
  canUpdate: (moduleCode: string) => boolean;
};

export function PerformanceTable({
  data,
  periodLabel,
  intakeName,
  sorting,
  isLoading,
  isError,
  onSortingChange,
  onSetTarget,
  canUpdate,
}: PerformanceTableProps) {
  const canSetTarget = canUpdate(MODULES.ASSIGN_TARGET);

  const columns = useMemo<ColumnDef<CounsellorPerformance>[]>(
    () => [
      {
        id: "rank",
        header: "#",
        enableSorting: false,
        cell: ({ row }: CellContext<CounsellorPerformance, unknown>) => (
          <span className="font-medium text-muted-foreground">
            {row.index + 1}
          </span>
        ),
      },
      {
        accessorKey: "name",
        header: ({ column }) => (
          <Button
            type="button"
            variant="ghost"
            className="-ml-3"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Counsellor
            <ArrowUpDown className="ml-2 size-4" />
          </Button>
        ),
        cell: ({ row }: CellContext<CounsellorPerformance, unknown>) => (
          <div className="min-w-52">
            <p className="font-medium">{row.original.name}</p>

            <p className="text-xs text-muted-foreground">
              {row.original.email}
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              Joined {formatDate(row.original.joinedAt)}
            </p>
          </div>
        ),
      },
      {
        id: "branches",
        header: "Branches",
        enableSorting: false,
        cell: ({ row }: CellContext<CounsellorPerformance, unknown>) => {
          if (!row.original.branches.length) {
            return (
              <span className="text-sm text-muted-foreground">
                Not assigned
              </span>
            );
          }

          return (
            <div className="flex min-w-36 flex-wrap gap-1">
              {row.original.branches.map((branch) => (
                <Badge key={branch.id} variant="outline">
                  {branch.name}
                </Badge>
              ))}
            </div>
          );
        },
      },
      {
        accessorKey: "target",
        header: ({ column }) => (
          <Button
            type="button"
            variant="ghost"
            className="-ml-3"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Intake Target
            <ArrowUpDown className="ml-2 size-4" />
          </Button>
        ),
        cell: ({ row }: CellContext<CounsellorPerformance, unknown>) => (
          <span className="font-semibold">{row.original.target}</span>
        ),
      },
      {
        accessorKey: "applicationsCreated",
        header: ({ column }) => (
          <Button
            type="button"
            variant="ghost"
            className="-ml-3"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Applications Added
            <ArrowUpDown className="ml-2 size-4" />
          </Button>
        ),
        cell: ({ row }: CellContext<CounsellorPerformance, unknown>) => (
          <span className="font-medium">
            {row.original.applicationsCreated}
          </span>
        ),
      },
      {
        accessorKey: "achieved",
        header: ({ column }) => (
          <Button
            type="button"
            variant="ghost"
            className="-ml-3"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Achieved
            <ArrowUpDown className="ml-2 size-4" />
          </Button>
        ),
        cell: ({ row }: CellContext<CounsellorPerformance, unknown>) => (
          <span className="font-semibold">{row.original.achieved}</span>
        ),
      },
      {
        accessorKey: "completionPercentage",
        header: ({ column }) => (
          <Button
            type="button"
            variant="ghost"
            className="-ml-3"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Performance
            <ArrowUpDown className="ml-2 size-4" />
          </Button>
        ),
        cell: ({ row }: CellContext<CounsellorPerformance, unknown>) => (
          <div className="min-w-48 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium">
                {row.original.completionPercentage}%
              </span>

              {row.original.targetAchieved && (
                <CheckCircle2 className="size-4 text-emerald-600" />
              )}
            </div>

            <Progress
              value={Math.min(row.original.completionPercentage, 100)}
              className="h-2"
            />
          </div>
        ),
      },
      {
        id: "status",
        header: "Status",
        enableSorting: false,
        cell: ({ row }: CellContext<CounsellorPerformance, unknown>) => {
          const status = getPerformanceStatus(row.original);

          return <Badge variant={status.variant}>{status.label}</Badge>;
        },
      },
      ...(canSetTarget
        ? [
            {
              id: "actions",
              header: "",
              enableSorting: false,
              cell: ({ row }: CellContext<CounsellorPerformance, unknown>) => (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onSetTarget(row.original)}
                >
                  <Target className="mr-2 size-4" />
                  Set Target
                </Button>
              ),
            } satisfies ColumnDef<CounsellorPerformance>,
          ]
        : []),
    ],
    [canSetTarget, onSetTarget],
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
    onSortingChange,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
  });

  const isNoActiveIntake = intakeName === "No active intake";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Ranking</CardTitle>

        <CardDescription>
          Showing {intakeName} performance for {periodLabel}
        </CardDescription>
      </CardHeader>

      <CardContent className="p-0">
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
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell colSpan={columns.length}>
                      <Skeleton className="h-12 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : isError ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-32 text-center"
                  >
                    <p className="font-medium text-destructive">
                      Performance data could not be loaded
                    </p>

                    <p className="mt-1 text-sm text-muted-foreground">
                      Please refresh or try again.
                    </p>
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row) => (
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
                    className="h-32 text-center"
                  >
                    <p className="font-medium">
                      {isNoActiveIntake
                        ? "No active intake found"
                        : "No data found"}
                    </p>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {isNoActiveIntake
                        ? "Create or activate an intake to start assigning counsellor targets."
                        : "No counsellor performance records match the selected filters."}
                    </p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
