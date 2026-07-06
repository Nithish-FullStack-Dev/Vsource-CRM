// app\(dashboard)\leads\all\page.tsx
"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { PageHeader, PageTransition } from "@/components/common/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Eye,
  CalendarDays,
  Loader2,
} from "lucide-react";
import type { Lead, LeadStatus } from "@/types";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import PageActions from "./pageactions";
import { useAuth } from "@/store";
import { MODULES } from "@/lib/module-codes";
import LeadStatusDialog from "@/components/leads/LeadStatusDialog";
import { LEADS, useLeads } from "@/lib/lead";
import { useLeadSources } from "@/lib/master-settings";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

const statusStyle: Record<LeadStatus, string> = {
  draft:
    "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  new: "bg-info/15 text-info border-info/20",
  contacted: "bg-warning/15 text-warning border-warning/20",
  qualified: "bg-primary/10 text-primary border-primary/20",
  converted: "bg-success/15 text-success border-success/20",
  lost: "bg-muted text-muted-foreground border-border",
};

const statusTabs: Array<LeadStatus | "all"> = [
  "all",
  "draft",
  "new",
  "contacted",
  "qualified",
  "converted",
  "lost",
];

const branchOptions = [
  "Dilsukhnagar Branch",
  "Ameerpet Branch",
  "KPHB - JNTU Branch",
  "Vijayawada Branch",
  "Visakhapatnam Branch",
  "Tirupathi Branch",
  "Bengaluru Branch",
];

const formatDate = (value?: string | Date | null) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-GB");
};

export default function AllLeadsPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<LeadStatus | "all">("all");
  const [branch, setBranch] = useState("all");
  const [source, setSource] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedCounselors, setSelectedCounselors] = useState<string[]>([]);
  const { canCreate, canUpdate, canDelete } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [selected, setSelected] = useState<Lead | null>(null);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  const [followupDate, setFollowupDate] = useState("");
  const [followupNote, setFollowupNote] = useState("");
  const [followupLead, setFollowupLead] = useState<Lead | null>(null);
  const [quickFollowupDate, setQuickFollowupDate] = useState("");
  const [quickFollowupNote, setQuickFollowupNote] = useState("");
  const [isSavingFollowup, setIsSavingFollowup] = useState(false);

  const [editingLeadStatus, setEditingLeadStatus] = useState<Lead | null>(null);
  const [leadIdToDelete, setLeadIdToDelete] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: leads = [], isLoading, refetch: loadLeads } = useLeads();

  const { data: uniqueSources = [], isLoading: resourceLoad } =
    useLeadSources();

  const filteredLeads = useMemo(() => {
    return leads
      .filter((item: Lead) => {
        const normalizedQuery = query.trim().toLowerCase();

        const matchQuery =
          !normalizedQuery ||
          item.studentName?.toLowerCase().includes(normalizedQuery) ||
          item.emailId?.toLowerCase().includes(normalizedQuery) ||
          item.mobileNumber?.includes(normalizedQuery) ||
          item.id?.toLowerCase().includes(normalizedQuery) ||
          item.leadNumber?.toLowerCase().includes(normalizedQuery);

        const matchStatus = status === "all" || item.status === status;
        const matchBranch = branch === "all" || item.branch?.name === branch;
        const matchSource = source === "all" || item.source === source;

        return matchQuery && matchStatus && matchBranch && matchSource;
      })
      .sort(
        (a: Lead, b: Lead) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }, [leads, query, status, branch, source]);

  useEffect(() => {
    setPage(1);
  }, [query, status, branch, source]);

  const pageSize = 10;
  const start = (page - 1) * pageSize;
  const pageLeads = filteredLeads.slice(start, start + pageSize);
  const pageCount = Math.max(1, Math.ceil(filteredLeads.length / pageSize));

  useEffect(() => {
    if (page > pageCount) {
      setPage(pageCount);
    }
  }, [page, pageCount]);

  const executeDeleteLead = async () => {
    if (!leadIdToDelete) return;

    try {
      const response = await fetch(`${API_BASE_URL}/leads/${leadIdToDelete}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Unable to delete lead");
      }

      queryClient.invalidateQueries({
        queryKey: LEADS.all,
      });
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete lead");
    } finally {
      setLeadIdToDelete(null);
    }
  };

  const handleUpdateLead = async (event: FormEvent) => {
    event.preventDefault();

    if (!editingLead) return;

    try {
      setIsUpdating(true);

      const response = await fetch(`${API_BASE_URL}/leads/${editingLead.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...editingLead,
          counselorIds: selectedCounselors,
          followupDate: followupDate || undefined,
          followupNote: followupNote.trim() || undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.message || "Unable to update lead");
      }

      await queryClient.invalidateQueries({
        queryKey: LEADS.all,
      });

      await loadLeads();

      toast.success("Lead updated successfully");

      setEditingLead(null);
      setFollowupDate("");
      setFollowupNote("");
    } catch (error) {
      console.error(error);

      toast.error(
        error instanceof Error ? error.message : "Failed to update lead",
      );
    } finally {
      setIsUpdating(false);
    }
  };
  const openFollowupDialog = (lead: Lead) => {
    setFollowupLead(lead);

    setQuickFollowupDate(
      lead.nextFollowup
        ? new Date(lead.nextFollowup).toISOString().split("T")[0]
        : "",
    );

    setQuickFollowupNote("");
  };
  const handleSaveFollowup = async () => {
    if (!followupLead) return;

    if (!quickFollowupDate) {
      toast.error("Please select next follow-up date");
      return;
    }

    if (!quickFollowupNote.trim()) {
      toast.error("Please enter follow-up note");
      return;
    }

    try {
      setIsSavingFollowup(true);

      const response = await fetch(`${API_BASE_URL}/leads/${followupLead.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          followupDate: quickFollowupDate,
          followupNote: quickFollowupNote.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.message || "Unable to save follow-up");
      }

      await queryClient.invalidateQueries({
        queryKey: LEADS.all,
      });

      await loadLeads();

      toast.success("Follow-up saved successfully");

      setFollowupLead(null);
      setQuickFollowupDate("");
      setQuickFollowupNote("");
    } catch (error) {
      console.error(error);

      toast.error(
        error instanceof Error ? error.message : "Failed to save follow-up",
      );
    } finally {
      setIsSavingFollowup(false);
    }
  };
  return (
    <PageTransition>
      <PageHeader
        title="All Leads"
        description="Manage every enquiry in the CRM with search, filters, export and status-driven navigation."
        actions={
          <div className="flex items-center gap-2">
            {canCreate(MODULES.MASTER_LEADS) && (
              <Button
                size="sm"
                onClick={() => router.push("/leads/add")}
                className="whitespace-nowrap"
              >
                <Plus className="mr-2 size-4" />
                Add Lead
              </Button>
            )}
          </div>
        }
      />

      <Card className="mb-6 min-w-0 border-border shadow-sm">
        <CardContent className="grid min-w-0 gap-4 p-4 sm:p-5 lg:grid-cols-[1.9fr_2.1fr] xl:grid-cols-[1.8fr_2.2fr]">
          <div className="relative flex w-full items-end">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="w-full bg-background pl-10"
                placeholder="Search leads by name, email or ID"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="grid gap-1.5">
              <Label className="text-xs font-semibold tracking-wide text-muted-foreground">
                Status
              </Label>
              <Select
                value={status}
                onValueChange={(value) =>
                  setStatus(value as LeadStatus | "all")
                }
              >
                <SelectTrigger className="w-full bg-background">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Status</SelectLabel>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="qualified">Qualified</SelectItem>
                    <SelectItem value="converted">Converted</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <Label className="text-xs font-semibold tracking-wide text-muted-foreground">
                Branch
              </Label>
              <Select value={branch} onValueChange={setBranch}>
                <SelectTrigger className="w-full bg-background">
                  <SelectValue placeholder="Any branch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Branch</SelectLabel>
                    <SelectItem value="all">All Branches</SelectItem>
                    {branchOptions.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <Label className="text-xs font-semibold tracking-wide text-muted-foreground">
                Source
              </Label>
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger className="w-full bg-background">
                  <SelectValue placeholder="Any source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Source</SelectLabel>
                    <SelectItem value="all">Any</SelectItem>
                    {resourceLoad ? (
                      <SelectItem value="load">Loading...</SelectItem>
                    ) : uniqueSources.length === 0 ? (
                      <SelectItem value="empty" disabled>
                        No lead sources found
                      </SelectItem>
                    ) : (
                      uniqueSources.map(
                        (item: { id: string; name: string }) => (
                          <SelectItem key={item.id} value={item.name}>
                            {item.name}
                          </SelectItem>
                        ),
                      )
                    )}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {statusTabs.map((tab) => (
          <Button
            key={tab}
            variant={tab === status ? "secondary" : "outline"}
            size="sm"
            onClick={() => setStatus(tab)}
            className="whitespace-nowrap transition-all duration-200"
          >
            {tab === "all"
              ? "All Leads"
              : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </Button>
        ))}
      </div>

      <Card className="w-full min-w-0 overflow-hidden border-border shadow-sm">
        <CardContent className="min-w-0 p-0">
          {isLoading ? (
            <div className="space-y-4 p-5">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-12 w-full rounded-xl" />
              ))}
            </div>
          ) : (
            <>
              <div className="divide-y divide-border lg:hidden">
                {pageLeads.length === 0 ? (
                  <div className="bg-background py-12 text-center text-sm text-muted-foreground">
                    No leads match your filters.
                  </div>
                ) : (
                  pageLeads.map((lead: Lead) => (
                    <div
                      key={lead.id || lead.leadNumber}
                      className="space-y-3 bg-card p-4 transition-colors hover:bg-secondary/10"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="rounded bg-secondary/50 px-2 py-0.5 font-mono text-xs font-semibold text-muted-foreground">
                          {lead.leadNumber || "—"}
                        </span>
                        <Badge
                          variant="outline"
                          className={`capitalize tracking-wide font-semibold ${
                            statusStyle[lead.status || "draft"]
                          }`}
                        >
                          {lead.status || "draft"}
                        </Badge>
                      </div>

                      <div>
                        <h4 className="text-base font-semibold text-foreground">
                          {lead.studentName || "—"}
                        </h4>
                        <p className="mt-0.5 flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
                          <span className="shrink-0">
                            {lead.mobileNumber || "—"}
                          </span>
                          {lead.emailId && (
                            <span className="text-border">|</span>
                          )}
                          <span className="min-w-0 truncate">
                            {lead.emailId || ""}
                          </span>
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3 border-t border-border/60 pt-2 text-xs">
                        <div className="min-w-0">
                          <p className="text-[10px] uppercase text-muted-foreground">
                            Source
                          </p>
                          <p className="truncate" title={lead.source || "—"}>
                            {lead.source || "—"}
                          </p>
                        </div>

                        <div className="min-w-0">
                          <p className="text-[10px] uppercase text-muted-foreground">
                            Country
                          </p>
                          <p
                            className="truncate"
                            title={lead.preferredCountry || "—"}
                          >
                            {lead.preferredCountry || "—"}
                          </p>
                        </div>

                        <div className="min-w-0">
                          <p className="text-[10px] uppercase text-muted-foreground">
                            Branch
                          </p>
                          <p
                            className="truncate"
                            title={lead.branch?.name || "—"}
                          >
                            {lead.branch?.name || "—"}
                          </p>
                        </div>

                        <div className="min-w-0">
                          <p className="text-[10px] uppercase text-muted-foreground">
                            Counselor
                          </p>
                          <div className="mt-1 flex min-w-0 flex-col items-start gap-1">
                            {lead.counselors?.length ? (
                              lead.counselors.map((counselor, index) => (
                                <Badge
                                  key={counselor.counselor?.id || index}
                                  className="h-5 max-w-full px-2 text-[10px]"
                                  title={counselor.counselor?.name || ""}
                                >
                                  <span className="truncate">
                                    {counselor.counselor?.name || "—"}
                                    {counselor.isPrimary ? " (Primary)" : ""}
                                  </span>
                                </Badge>
                              ))
                            ) : (
                              <span className="block max-w-full truncate text-xs text-muted-foreground">
                                No counselors assigned
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="col-span-2 min-w-0">
                          <p className="text-[10px] uppercase text-muted-foreground">
                            Email
                          </p>
                          <p className="break-all">{lead.emailId || "—"}</p>
                        </div>

                        <div>
                          <p className="text-[10px] uppercase text-muted-foreground">
                            Created Date
                          </p>
                          <p>{formatDate(lead.createdAt)}</p>
                        </div>

                        <div>
                          <p className="text-[10px] uppercase text-muted-foreground">
                            Next Followup
                          </p>

                          {canUpdate(MODULES.MASTER_LEADS) ? (
                            <button
                              type="button"
                              onClick={() => openFollowupDialog(lead)}
                              className="mt-1 inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
                            >
                              <CalendarDays className="size-3.5" />

                              {formatDate(lead.nextFollowup)}
                            </button>
                          ) : (
                            <p>{formatDate(lead.nextFollowup)}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-1 border-t border-border/60 pt-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-8"
                          onClick={() => setSelected(lead)}
                          aria-label="View lead"
                          title="View lead"
                        >
                          <Eye className="size-4" />
                        </Button>

                        {canUpdate(MODULES.MASTER_LEADS) && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-8"
                            onClick={() => setEditingLead({ ...lead })}
                            aria-label="Edit lead"
                            title="Edit lead"
                          >
                            <Pencil className="size-4" />
                          </Button>
                        )}

                        {canUpdate(MODULES.MASTER_LEADS) && (
                          <Badge
                            className="cursor-pointer"
                            onClick={() => setEditingLeadStatus(lead)}
                          >
                            {lead.status || "draft"}
                          </Badge>
                        )}

                        {canDelete(MODULES.MASTER_LEADS) && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => setLeadIdToDelete(lead.id)}
                            aria-label="Delete lead"
                            title="Delete lead"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="hidden w-full min-w-0 lg:block">
                <table className="w-full table-fixed border-collapse text-[12px] xl:text-[13px]">
                  <colgroup>
                    <col className="w-[5%]" />
                    <col className="w-[8%]" />
                    <col className="w-[8%]" />
                    <col className="w-[12%]" />
                    <col className="w-[6%]" />
                    <col className="w-[9%]" />
                    <col className="w-[15%]" />
                    <col className="w-[7%]" />
                    <col className="w-[7%]" />
                    <col className="w-[8%]" />
                    <col className="w-[8%]" />
                    <col className="w-[7%]" />
                  </colgroup>

                  <thead>
                    <tr className="border-b border-border bg-secondary/30 text-left text-[10px] uppercase leading-4 tracking-[0.08em] text-muted-foreground xl:text-[11px]">
                      <th className="px-2 py-3 font-semibold xl:px-3">
                        <span className="block">S.no</span>
                      </th>
                      <th className="px-2 py-3 font-semibold xl:px-3">
                        <span className="block">Student</span>
                        <span className="block">Name</span>
                      </th>
                      <th className="px-2 py-3 font-semibold xl:px-3">
                        Mobile
                      </th>
                      <th className="px-2 py-3 font-semibold xl:px-3">Email</th>
                      <th className="px-2 py-3 font-semibold xl:px-3">
                        Source
                      </th>
                      <th className="px-2 py-3 font-semibold xl:px-3">
                        Branch
                      </th>
                      <th className="px-2 py-3 font-semibold xl:px-3">
                        Assigned
                      </th>
                      <th className="px-2 py-3 font-semibold xl:px-3">
                        Country
                      </th>
                      <th className="px-2 py-3 font-semibold xl:px-3">
                        Status
                      </th>
                      <th className="px-2 py-3 font-semibold xl:px-3">
                        <span className="block">Created</span>
                        <span className="block">Date</span>
                      </th>
                      <th className="px-2 py-3 font-semibold xl:px-3">
                        <span className="block">Next</span>
                        <span className="block">Followup</span>
                      </th>
                      <th className="px-1 py-3 text-center font-semibold xl:px-2">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {pageLeads.length === 0 ? (
                      <tr>
                        <td
                          colSpan={12}
                          className="bg-background/50 py-12 text-center text-sm text-muted-foreground"
                        >
                          No leads match your filters.
                        </td>
                      </tr>
                    ) : (
                      pageLeads.map((lead: Lead) => (
                        <tr
                          key={lead.id || lead.leadNumber}
                          className="border-b border-border transition-colors last:border-b-0 hover:bg-secondary/40"
                        >
                          <td className="px-2 py-3 align-middle font-medium xl:px-3">
                            <span
                              className="block truncate"
                              title={lead.leadNumber || "—"}
                            >
                              {lead.leadNumber || "—"}
                            </span>
                          </td>

                          <td className="px-2 py-3 align-middle font-medium text-foreground xl:px-3">
                            <span
                              className="block truncate"
                              title={lead.studentName || "—"}
                            >
                              {lead.studentName || "—"}
                            </span>
                          </td>

                          <td className="px-2 py-3 align-middle xl:px-3">
                            <span
                              className="block truncate"
                              title={lead.mobileNumber || "—"}
                            >
                              {lead.mobileNumber || "—"}
                            </span>
                          </td>

                          <td className="px-2 py-3 align-middle text-muted-foreground xl:px-3">
                            <span
                              className="block truncate"
                              title={lead.emailId || "—"}
                            >
                              {lead.emailId || "—"}
                            </span>
                          </td>

                          <td className="px-2 py-3 align-middle xl:px-3">
                            <span
                              className="block truncate"
                              title={lead.source || "—"}
                            >
                              {lead.source || "—"}
                            </span>
                          </td>

                          <td className="px-2 py-3 align-middle xl:px-3">
                            <span
                              className="block truncate"
                              title={lead.branch?.name || "—"}
                            >
                              {lead.branch?.name || "—"}
                            </span>
                          </td>

                          <td className="px-2 py-2.5 align-middle xl:px-3">
                            <div className="flex min-w-0 flex-col items-start gap-1">
                              {lead.counselors?.length ? (
                                lead.counselors.map((counselor, index) => (
                                  <Badge
                                    key={counselor.counselor?.id || index}
                                    className="h-5 max-w-full px-2 text-[10px] font-semibold leading-none"
                                    title={counselor.counselor?.name || ""}
                                  >
                                    <span className="block max-w-full truncate">
                                      {counselor.counselor?.name || "—"}
                                      {counselor.isPrimary ? " (Primary)" : ""}
                                    </span>
                                  </Badge>
                                ))
                              ) : (
                                <span
                                  className="block w-full truncate text-[11px] text-muted-foreground xl:text-xs"
                                  title="No counselors assigned"
                                >
                                  No users assigned
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="px-2 py-3 align-middle xl:px-3">
                            <span
                              className="block truncate"
                              title={lead.preferredCountry || "—"}
                            >
                              {lead.preferredCountry || "—"}
                            </span>
                          </td>

                          <td className="px-2 py-3 align-middle xl:px-3">
                            <button
                              type="button"
                              onClick={() => {
                                if (
                                  canUpdate(MODULES.MASTER_LEADS) &&
                                  lead.status !== "converted"
                                ) {
                                  setEditingLeadStatus(lead);
                                }
                              }}
                              disabled={!canUpdate(MODULES.MASTER_LEADS)}
                              className="max-w-full disabled:cursor-default cursor-pointer"
                            >
                              <Badge
                                variant="outline"
                                className={`h-6 max-w-full whitespace-nowrap px-2 text-[10px] font-semibold capitalize tracking-wide xl:text-[11px] ${
                                  statusStyle[lead.status || "draft"]
                                }`}
                              >
                                <span className="truncate">
                                  {lead.status || "draft"}
                                </span>
                              </Badge>
                            </button>
                          </td>

                          <td className="px-2 py-3 align-middle text-muted-foreground xl:px-3">
                            <span className="block whitespace-nowrap">
                              {formatDate(lead.createdAt)}
                            </span>
                          </td>

                          <td className="px-2 py-3 align-middle xl:px-3">
                            {canUpdate(MODULES.MASTER_LEADS) ? (
                              <button
                                type="button"
                                onClick={() => openFollowupDialog(lead)}
                                className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1 font-medium text-primary transition-colors hover:bg-primary/10 hover:underline"
                                title="Add next follow-up"
                              >
                                <CalendarDays className="size-3.5" />

                                {formatDate(lead.nextFollowup)}
                              </button>
                            ) : (
                              <span className="block whitespace-nowrap">
                                {formatDate(lead.nextFollowup)}
                              </span>
                            )}
                          </td>

                          <td className="px-1 py-2.5 align-middle xl:px-2">
                            <div className="flex items-center justify-center gap-0.5">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="size-7 shrink-0"
                                onClick={() => setSelected(lead)}
                                aria-label="View lead"
                                title="View lead"
                              >
                                <Eye className="size-3.5" />
                              </Button>

                              {canUpdate(MODULES.MASTER_LEADS) && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="size-7 shrink-0"
                                  onClick={() => setEditingLead({ ...lead })}
                                  aria-label="Edit lead"
                                  title="Edit lead"
                                >
                                  <Pencil className="size-3.5" />
                                </Button>
                              )}

                              {canDelete(MODULES.MASTER_LEADS) && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="size-7 shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                  onClick={() => setLeadIdToDelete(lead.id)}
                                  aria-label="Delete lead"
                                  title="Delete lead"
                                >
                                  <Trash2 className="size-3.5" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="mt-4 flex flex-col gap-3 px-1 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <div className="text-center sm:text-left">
          Showing{" "}
          <span className="font-semibold text-foreground">
            {filteredLeads.length === 0 ? 0 : start + 1}
          </span>{" "}
          to{" "}
          <span className="font-semibold text-foreground">
            {Math.min(start + pageSize, filteredLeads.length)}
          </span>{" "}
          of{" "}
          <span className="font-semibold text-foreground">
            {filteredLeads.length}
          </span>{" "}
          result{filteredLeads.length === 1 ? "" : "s"}
        </div>

        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            className="select-none"
          >
            Previous
          </Button>

          <span className="rounded bg-secondary/40 px-2 py-1 text-xs font-medium text-foreground sm:text-sm">
            Page {page} of {pageCount}
          </span>

          <Button
            variant="outline"
            size="sm"
            disabled={page === pageCount}
            onClick={() =>
              setPage((current) => Math.min(pageCount, current + 1))
            }
            className="select-none"
          >
            Next
          </Button>
        </div>
      </div>

      <LeadStatusDialog
        lead={editingLeadStatus}
        open={Boolean(editingLeadStatus)}
        onClose={() => setEditingLeadStatus(null)}
      />
      <Dialog
        open={Boolean(followupLead)}
        onOpenChange={(open) => {
          if (!open && !isSavingFollowup) {
            setFollowupLead(null);
            setQuickFollowupDate("");
            setQuickFollowupNote("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Next Follow-up</DialogTitle>

            <DialogDescription>
              Schedule the next follow-up for{" "}
              <span className="font-medium text-foreground">
                {followupLead?.studentName || "this lead"}
              </span>
              .
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 py-2">
            <div className="grid gap-2">
              <Label htmlFor="quick-followup-date">Next Follow-up Date</Label>

              <Input
                id="quick-followup-date"
                type="date"
                value={quickFollowupDate}
                onChange={(event) => setQuickFollowupDate(event.target.value)}
                disabled={isSavingFollowup}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="quick-followup-note">Follow-up Note</Label>

              <textarea
                id="quick-followup-note"
                value={quickFollowupNote}
                onChange={(event) => setQuickFollowupNote(event.target.value)}
                placeholder="Enter follow-up note..."
                rows={4}
                disabled={isSavingFollowup}
                className="flex min-h-24 w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isSavingFollowup}
              onClick={() => {
                setFollowupLead(null);
                setQuickFollowupDate("");
                setQuickFollowupNote("");
              }}
            >
              Cancel
            </Button>

            <Button
              type="button"
              onClick={handleSaveFollowup}
              disabled={isSavingFollowup}
            >
              {isSavingFollowup ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CalendarDays className="mr-2 size-4" />
                  Save Follow-up
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <PageActions
        selected={selected}
        setSelected={setSelected}
        editingLead={editingLead}
        setEditingLead={setEditingLead}
        leadIdToDelete={leadIdToDelete}
        setLeadIdToDelete={setLeadIdToDelete}
        handleUpdateLead={handleUpdateLead}
        executeDeleteLead={executeDeleteLead}
        branchOptions={branchOptions}
        statusStyle={statusStyle}
        selectedCounselors={selectedCounselors}
        setSelectedCounselors={setSelectedCounselors}
        isUpdating={isUpdating}
        followupDate={followupDate}
        setFollowupDate={setFollowupDate}
        followupNote={followupNote}
        setFollowupNote={setFollowupNote}
      />
    </PageTransition>
  );
}
