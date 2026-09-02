// crm-frontend-next\app\(dashboard)\universities\page.tsx
"use client";

import { useMemo, useState, useEffect } from "react";
import {
  Plus,
  Search,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

import { PageHeader, PageTransition } from "@/components/common/PageHeader";
import { UniversityCard } from "@/components/universities/university-card";
import { UniversityFormDialog } from "@/components/universities/university-form-dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Badge } from "@/components/ui/badge";

import { useUniversities } from "@/hooks/use-universities";
import { University, UniversityStatus } from "@/types/university";
import { useAuth } from "@/store";
import { MODULES } from "@/lib/module-codes";

export default function UniversitiesPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | UniversityStatus>(
    "all",
  );
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const { canCreate, canUpdate } = useAuth();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(16); // Set default limit to 16 as requested by the user

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUniversity, setEditingUniversity] = useState<University | null>(
    null,
  );
  const [shortlistedIds, setShortlistedIds] = useState<string[]>([]);
  const [tierFilter, setTierFilter] = useState<
    "all" | "T1" | "T2" | "T3" | "T4"
  >("all");

  // Debounce search query to optimize API requests
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to page 1 on new search
    }, 400);

    return () => clearTimeout(handler);
  }, [search]);

  // Fetch universities with server-side pagination, searching, and filtering
  const {
    universities,
    meta,
    isLoading,
    addUniversity,
    updateUniversity,
    deleteUniversity,
  } = useUniversities({
    search: debouncedSearch || undefined,
    status: statusFilter === "all" ? undefined : statusFilter,
    tier: tierFilter === "all" ? undefined : tierFilter,
    countryId: countryFilter === "all" ? undefined : countryFilter,
    page,
    limit,
  });

  // Fetch list of countries dynamically for the filters
  const { data: countriesData } = useQuery({
    queryKey: ["countries"],
    queryFn: async () => {
      const response = await axios.get("/api/countries");
      return response.data.data;
    },
  });
  const countries = (countriesData || []) as {
    id: string;
    name: string;
    code: string;
  }[];

  // Fetch the total number of active universities globally
  const { data: activeCount } = useQuery({
    queryKey: ["universities", "count", "active"],
    queryFn: async () => {
      const response = await axios.get("/api/universities", {
        params: { status: "active", limit: 1 },
      });
      return response.data?.meta?.total ?? 0;
    },
  });

  const handleCreateUniversity = async (data: any) => {
    try {
      await addUniversity(data);
      toast.success("University created successfully");
    } catch {
      toast.error("Failed to create university");
      throw new Error("Failed to create university");
    }
  };

  const handleUpdateUniversity = async (data: any) => {
    if (!editingUniversity) return;

    try {
      await updateUniversity(editingUniversity.id, data);
      toast.success("University updated successfully");
      setEditingUniversity(null);
    } catch {
      toast.error("Failed to update university");
      throw new Error("Failed to update university");
    }
  };

  const handleDeleteUniversity = async (university: University) => {
    const confirmed = window.confirm(
      `Delete ${university.name}? This will also delete all associated courses and scholarships.`,
    );

    if (!confirmed) return;

    try {
      await deleteUniversity(university.id);
      toast.success("University deleted successfully");
    } catch {
      toast.error("Failed to delete university");
    }
  };

  const handleEditUniversity = (university: University) => {
    setEditingUniversity(university);
    setDialogOpen(true);
  };

  const handleShortlist = (university: University) => {
    setShortlistedIds((prev) => {
      const exists = prev.includes(university.id);

      if (exists) {
        toast.success("Removed from shortlist");
        return prev.filter((id) => id !== university.id);
      }

      toast.success("Added to shortlist");
      return [...prev, university.id];
    });
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);

    if (!open) {
      setEditingUniversity(null);
    }
  };

  const handleResetFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setTierFilter("all");
    setCountryFilter("all");
    setPage(1);
  };

  const hasActiveFilters =
    search !== "" ||
    statusFilter !== "all" ||
    tierFilter !== "all" ||
    countryFilter !== "all";
  // Calculate start/end indices for pagination description
  const totalCount = meta?.total ?? 0;
  const totalPages = meta?.totalPages ?? 1;
  const startIndex = totalCount === 0 ? 0 : (page - 1) * limit + 1;
  const endIndex = Math.min(page * limit, totalCount);

  return (
    <PageTransition>
      {canCreate(MODULES.UNIVERSITIES) && (
        <PageHeader
          title="Universities"
          description="Manage global universities, courses, scholarships and admissions."
          actions={
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className="px-3 py-1.5 font-medium rounded-lg"
              >
                {shortlistedIds.length} Shortlisted
              </Badge>

              <Button
                onClick={() => {
                  setEditingUniversity(null);
                  setDialogOpen(true);
                }}
                className="rounded-xl shadow-sm"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add University
              </Button>
            </div>
          }
        />
      )}

      {/* Filter Toolbar Section */}
      <div className="mb-6 flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-sm md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search university name, city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 rounded-xl"
          />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row md:w-auto">
          {/* Country Selector */}
          <div className="w-full sm:w-45">
            <Select
              value={countryFilter}
              onValueChange={(val) => {
                setCountryFilter(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Countries</SelectItem>
                {countries.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status Selector */}
          <div className="w-full sm:w-40">
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value as "all" | UniversityStatus);
                setPage(1);
              }}
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-full sm:w-40">
            <Select
              value={tierFilter}
              onValueChange={(value) => {
                setTierFilter(value as "all" | "T1" | "T2" | "T3" | "T4");
                setPage(1);
              }}
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Tier" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="T1">T1</SelectItem>
                <SelectItem value="T2">T2</SelectItem>
                <SelectItem value="T3">T3</SelectItem>
                <SelectItem value="T4">T4</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* Reset Filters Trigger */}
          {hasActiveFilters && (
            <Button
              variant="outline"
              onClick={handleResetFilters}
              className="rounded-xl px-3 hover:bg-secondary/50"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Main Grid display / Loading states */}
      {isLoading ? (
        <div className="flex h-100 flex-col items-center justify-center rounded-2xl border border-dashed bg-card/50">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <h3 className="mt-4 text-lg font-semibold">
            Loading Universities...
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Retrieving database records
          </p>
        </div>
      ) : universities.length === 0 ? (
        <div className="flex h-100 flex-col items-center justify-center rounded-2xl border border-dashed bg-card/50 px-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/50 mb-4">
            <SlidersHorizontal className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">No Universities Found</h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm">
            We couldn't find any universities matching your current search
            parameters. Try adjusting filters or create a new entry.
          </p>
          {hasActiveFilters && (
            <Button
              variant="outline"
              onClick={handleResetFilters}
              className="mt-4 rounded-xl"
            >
              Reset Filters
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {universities.map((university: University) => (
              <UniversityCard
                key={university.id}
                university={university}
                shortlisted={shortlistedIds.includes(university.id)}
                onShortlist={handleShortlist}
                onEdit={handleEditUniversity}
                onDelete={handleDeleteUniversity}
              />
            ))}
          </div>

          {/* Pagination Controls Section */}
          <div className="mt-8 flex flex-col gap-4 border-t pt-5 sm:flex-row sm:items-center sm:justify-between text-sm text-muted-foreground">
            <div className="text-center sm:text-left flex items-center justify-center sm:justify-start gap-2">
              <span>
                Showing{" "}
                <span className="font-semibold text-foreground">
                  {startIndex}
                </span>{" "}
                to{" "}
                <span className="font-semibold text-foreground">
                  {endIndex}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-foreground">
                  {totalCount}
                </span>{" "}
                results
              </span>
              <span className="text-border">|</span>
              <div className="flex items-center gap-1.5">
                <span>Show</span>
                <Select
                  value={String(limit)}
                  onValueChange={(val) => {
                    setLimit(Number(val));
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="h-7 w-17.5 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="8">8</SelectItem>
                    <SelectItem value="12">12</SelectItem>
                    <SelectItem value="16">16</SelectItem>
                    <SelectItem value="24">24</SelectItem>
                    <SelectItem value="32">32</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-xl select-none"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary/30 font-medium text-foreground text-sm">
                Page {page} of {totalPages}
              </div>

              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-xl select-none"
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Creation / Update Form Overlay Dialog */}
      <UniversityFormDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        university={editingUniversity}
        onSubmit={
          editingUniversity ? handleUpdateUniversity : handleCreateUniversity
        }
      />
    </PageTransition>
  );
}
