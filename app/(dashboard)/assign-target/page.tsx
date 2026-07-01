"use client";

import { useCallback, useMemo, useState } from "react";
import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowUpDown,
  CheckCircle2,
  ListPlus,
  Loader2,
  RefreshCcw,
  Search,
  Target,
  UserRoundCheck,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Branch,
  CounsellorPerformance,
  PerformanceResponse,
  PerformanceSummary,
  TargetDialogCounsellor,
} from "@/types/counsellor-performance";
import {
  useBranchPerformance,
  usePerformance,
} from "@/hooks/assign-target/usePerformance";
import {
  formatDate,
  getCurrentIstPeriod,
  getErrorMessage,
  getPerformanceStatus,
  updateMonthlyTarget,
  updateTargetInCachedReport,
} from "@/services/performance/performance";

const MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

export default function CounsellorPerformancePage() {
  const queryClient = useQueryClient();

  const currentIstPeriod = useMemo(() => getCurrentIstPeriod(), []);

  const [year, setYear] = useState(currentIstPeriod.year);

  const [month, setMonth] = useState(currentIstPeriod.month);

  const [branchId, setBranchId] = useState("all");
  const [search, setSearch] = useState("");

  const [sorting, setSorting] = useState<SortingState>([
    {
      id: "completionPercentage",
      desc: true,
    },
  ]);

  const [targetDialogCounsellor, setTargetDialogCounsellor] =
    useState<TargetDialogCounsellor | null>(null);

  const [targetInput, setTargetInput] = useState("");

  const allPerformanceQuery = usePerformance(year, month);

  const branchPerformanceQuery = useBranchPerformance(year, month, branchId);

  const activeQuery =
    branchId === "all" ? allPerformanceQuery : branchPerformanceQuery;

  const performanceData = activeQuery.data ?? null;

  const branches = useMemo(() => {
    const branchMap = new Map<string, Branch>();

    const counsellors = Array.isArray(allPerformanceQuery.data?.counsellors)
      ? allPerformanceQuery.data.counsellors
      : [];

    counsellors.forEach((counsellor) => {
      const counsellorBranches = Array.isArray(counsellor?.branches)
        ? counsellor.branches
        : [];

      counsellorBranches.forEach((branch) => {
        if (!branch?.id) {
          return;
        }

        branchMap.set(branch.id, {
          id: branch.id,
          name: branch.name || "Unnamed branch",
        });
      });
    });

    return Array.from(branchMap.values()).sort((first, second) =>
      first.name.localeCompare(second.name),
    );
  }, [allPerformanceQuery.data]);

  const filteredCounsellors = useMemo(() => {
    const counsellors = Array.isArray(performanceData?.counsellors)
      ? performanceData.counsellors
      : [];

    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return counsellors;
    }

    return counsellors.filter((counsellor) => {
      const branchNames = Array.isArray(counsellor?.branches)
        ? counsellor.branches.map((branch) => branch?.name ?? "").join(" ")
        : "";

      const searchableText = [
        counsellor?.name ?? "",
        counsellor?.email ?? "",
        branchNames,
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedSearch);
    });
  }, [performanceData, search]);

  const openTargetDialog = useCallback((counsellor: CounsellorPerformance) => {
    setTargetDialogCounsellor({
      id: counsellor.id,
      name: counsellor.name || "Unnamed counsellor",
      target: counsellor.target ?? 0,
    });

    setTargetInput(String(counsellor.target ?? 0));
  }, []);

  const closeTargetDialog = useCallback(() => {
    setTargetDialogCounsellor(null);
    setTargetInput("");
  }, []);

  const updateTargetMutation = useMutation({
    mutationFn: updateMonthlyTarget,
    onSuccess: (_, variables) => {
      queryClient.setQueriesData<PerformanceResponse>(
        {
          queryKey: ["counsellor-performance", variables.year, variables.month],
        },
        (oldData) => {
          if (!oldData || !Array.isArray(oldData.counsellors)) {
            return oldData;
          }

          return updateTargetInCachedReport(
            oldData,
            variables.counsellorId,
            variables.target,
          );
        },
      );

      closeTargetDialog();

      toast.success("Monthly target updated successfully");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const handleSaveTarget = () => {
    if (!targetDialogCounsellor?.id || updateTargetMutation.isPending) {
      return;
    }

    const parsedTarget = Number(targetInput);

    if (!Number.isInteger(parsedTarget) || parsedTarget < 0) {
      toast.error("Target must be a non-negative whole number");
      return;
    }

    updateTargetMutation.mutate({
      counsellorId: targetDialogCounsellor.id,
      year,
      month,
      target: parsedTarget,
    });
  };

  const columns = useMemo<ColumnDef<CounsellorPerformance>[]>(
    () => [
      {
        id: "rank",
        header: "#",
        enableSorting: false,
        cell: ({ row }) => (
          <span className="font-medium text-muted-foreground">
            {row.index + 1}
          </span>
        ),
      },
      {
        accessorKey: "name",
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="-ml-3"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Counsellor
            <ArrowUpDown className="ml-2 size-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const counsellor = row.original;

          return (
            <div className="min-w-52.5">
              <p className="font-medium">
                {counsellor?.name || "Unnamed counsellor"}
              </p>

              <p className="text-xs text-muted-foreground">
                {counsellor?.email || "Email not available"}
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Joined {formatDate(counsellor?.joinedAt)}
              </p>
            </div>
          );
        },
      },
      {
        id: "branches",
        header: "Branches",
        enableSorting: false,
        cell: ({ row }) => {
          const counsellorBranches = Array.isArray(row.original?.branches)
            ? row.original.branches
            : [];

          if (!counsellorBranches.length) {
            return (
              <span className="text-sm text-muted-foreground">
                Not assigned
              </span>
            );
          }

          return (
            <div className="flex min-w-37.5 flex-wrap gap-1">
              {counsellorBranches.map((branch) => (
                <Badge key={branch.id} variant="outline">
                  {branch.name || "Unnamed branch"}
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
            variant="ghost"
            className="-ml-3"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Target
            <ArrowUpDown className="ml-2 size-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="font-semibold">{row.original?.target ?? 0}</span>
        ),
      },
      {
        accessorKey: "leadsCreated",
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="-ml-3"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Leads Added
            <ArrowUpDown className="ml-2 size-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="font-medium">{row.original?.leadsCreated ?? 0}</span>
        ),
      },
      {
        accessorKey: "achieved",
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="-ml-3"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            University App
            <ArrowUpDown className="ml-2 size-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="font-semibold">{row.original?.achieved ?? 0}</span>
        ),
      },
      {
        accessorKey: "completionPercentage",
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="-ml-3"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Performance
            <ArrowUpDown className="ml-2 size-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const percentage = Math.max(
            row.original?.completionPercentage ?? 0,
            0,
          );

          return (
            <div className="min-w-47.5 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium">{percentage}%</span>

                {row.original?.targetAchieved && (
                  <CheckCircle2 className="size-4 text-emerald-600" />
                )}
              </div>

              <Progress value={Math.min(percentage, 100)} className="h-2" />
            </div>
          );
        },
      },
      {
        id: "status",
        header: "Status",
        enableSorting: false,
        cell: ({ row }) => {
          const status = getPerformanceStatus(row.original);

          return <Badge variant={status.variant}>{status.label}</Badge>;
        },
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => openTargetDialog(row.original)}
          >
            <Target className="mr-2 size-4" />
            Set target
          </Button>
        ),
      },
    ],
    [openTargetDialog],
  );

  const table = useReactTable({
    data: filteredCounsellors,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const summary: PerformanceSummary = performanceData?.summary ?? {
    totalTarget: 0,
    totalAchieved: 0,
    totalLeadsCreated: 0,
    completionPercentage: 0,
  };

  const selectedMonth =
    MONTHS.find((item) => item.value === month)?.label ?? "Selected month";

  const yearOptions = useMemo(() => {
    const years = Array.from(
      {
        length: 6,
      },
      (_, index) => currentIstPeriod.year - 4 + index,
    );

    if (!years.includes(year)) {
      years.push(year);
    }

    return years.sort((first, second) => second - first);
  }, [currentIstPeriod.year, year]);

  const summaryCards = [
    {
      title: "Total Counsellors",
      value: Array.isArray(performanceData?.counsellors)
        ? performanceData.counsellors.length
        : 0,
      description: "Counsellors in selected report",
      icon: Users,
    },
    {
      title: "Total Target",
      value: summary.totalTarget ?? 0,
      description: `${selectedMonth} ${year} assigned target`,
      icon: Target,
    },
    {
      title: "Total Achieved",
      value: summary.totalAchieved ?? 0,
      description: "University applications in selected month",
      icon: UserRoundCheck,
    },
    {
      title: "Total Leads Added",
      value: summary.totalLeadsCreated ?? 0,
      description: "Leads created in selected month",
      icon: ListPlus,
    },
  ];

  const isInitialLoading = activeQuery.isPending && !performanceData;

  const isRefreshing = activeQuery.isFetching && Boolean(performanceData);

  const tableRows = table.getRowModel()?.rows ?? [];

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              Assign Target
            </h1>

            {isRefreshing && (
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            )}
          </div>

          <p className="mt-1 text-sm text-muted-foreground">
            View monthly targets, university applications and leads added by
            each counsellor.
          </p>
        </div>

        <Button
          variant="outline"
          disabled={activeQuery.isFetching}
          onClick={() => void activeQuery.refetch()}
        >
          {activeQuery.isFetching ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <RefreshCcw className="mr-2 size-4" />
          )}
          Refresh
        </Button>
      </div>

      {activeQuery.isError && (
        <Card className="border-destructive">
          <CardContent className="flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium text-destructive">
                Unable to load counsellor performance
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                {getErrorMessage(activeQuery.error)}
              </p>
            </div>

            <Button
              variant="outline"
              onClick={() => void activeQuery.refetch()}
            >
              Try again
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((item) => {
          const Icon = item.icon;

          return (
            <Card key={item.title}>
              <CardContent className="flex items-start justify-between p-5">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {item.title}
                  </p>

                  {isInitialLoading ? (
                    <Skeleton className="mt-3 h-8 w-20" />
                  ) : (
                    <p className="mt-2 text-3xl font-bold">{item.value ?? 0}</p>
                  )}

                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.description}
                  </p>
                </div>

                <div className="rounded-lg border bg-muted/50 p-3">
                  <Icon className="size-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Report Filters</CardTitle>

          <CardDescription>
            Select a month, year, or branch to view the required performance
            report.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="performance-month">Month</Label>

              <Select
                value={String(month)}
                onValueChange={(value) => setMonth(Number(value))}
              >
                <SelectTrigger id="performance-month">
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>

                <SelectContent>
                  {MONTHS.map((item) => (
                    <SelectItem key={item.value} value={String(item.value)}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="performance-year">Year</Label>

              <Select
                value={String(year)}
                onValueChange={(value) => setYear(Number(value))}
              >
                <SelectTrigger id="performance-year">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>

                <SelectContent>
                  {yearOptions.map((yearOption) => (
                    <SelectItem key={yearOption} value={String(yearOption)}>
                      {yearOption}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="performance-branch">Branch</Label>

              <Select value={branchId} onValueChange={setBranchId}>
                <SelectTrigger id="performance-branch">
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="all">All branches</SelectItem>

                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="counsellor-search">Search</Label>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                <Input
                  id="counsellor-search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Name, email or branch"
                  className="pl-9"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Performance Ranking</CardTitle>

          <CardDescription>
            Showing performance for {selectedMonth} {year}
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
                {isInitialLoading ? (
                  Array.from({
                    length: 5,
                  }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell colSpan={9}>
                        <Skeleton className="h-12 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : activeQuery.isError && !performanceData ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-32 text-center">
                      <p className="font-medium text-destructive">
                        Performance data could not be loaded
                      </p>

                      <p className="mt-1 text-sm text-muted-foreground">
                        Please refresh or try again.
                      </p>
                    </TableCell>
                  </TableRow>
                ) : tableRows.length > 0 ? (
                  tableRows.map((row) => (
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
                    <TableCell colSpan={9} className="h-32 text-center">
                      <p className="font-medium">No counsellors found</p>

                      <p className="mt-1 text-sm text-muted-foreground">
                        No counsellor records match the selected filters.
                      </p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(targetDialogCounsellor)}
        onOpenChange={(open) => {
          if (!open && !updateTargetMutation.isPending) {
            closeTargetDialog();
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Set Monthly Target</DialogTitle>

            <DialogDescription>
              Set the target for{" "}
              <strong>
                {targetDialogCounsellor?.name ?? "selected counsellor"}
              </strong>{" "}
              for {selectedMonth} {year}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-3">
            <Label htmlFor="monthly-target">Student target</Label>

            <Input
              id="monthly-target"
              type="number"
              min={0}
              step={1}
              value={targetInput}
              onChange={(event) => setTargetInput(event.target.value)}
              placeholder="Enter monthly target"
              disabled={updateTargetMutation.isPending}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleSaveTarget();
                }
              }}
            />

            <p className="text-xs text-muted-foreground">
              Enter zero when no target is assigned for this month.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={updateTargetMutation.isPending}
              onClick={closeTargetDialog}
            >
              Cancel
            </Button>

            <Button
              type="button"
              disabled={updateTargetMutation.isPending}
              onClick={handleSaveTarget}
            >
              {updateTargetMutation.isPending && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}
              Save target
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
