"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
  Landmark,
  Loader2,
  Phone,
  Search,
  Trash2,
  UserCheck,
} from "lucide-react";
import { PageHeader, PageTransition } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  APPLICANT_CATEGORIES,
  LOAN_CATEGORIES,
  LOAN_STATUSES,
} from "@/lib/loan-application/constants";
import { useLoanApplications } from "@/hooks/loan-application/useLoanApplications";
import {
  formatINR,
  loanStatusTone,
  StatusBadge,
} from "@/components/loan-application/LoanProfileUI";

import axios from "axios";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { LoanApplication } from "./[id]/_components/types";
import { MODULES } from "@/lib/module-codes";
import { useAuth } from "@/store";

const ALL = "__all__";
const unique = (items: (string | null | undefined)[]) =>
  [...new Set(items.filter((item): item is string => !!item))].sort((a, b) =>
    a.localeCompare(b),
  );
const assignee = (a: LoanApplication) => a.fintechAssigneeName || "";
const bank = (a: LoanApplication) => a.bankApplications?.[0]?.bank?.name ?? "";

const formatFollowUpValue = (
  value: string | Date | null | undefined,
): string => {
  if (!value) return "-";

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

export default function LoanApplicationsPage() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState(ALL);
  const [loan, setLoan] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [user, setUser] = useState(ALL);
  const [b, setB] = useState(ALL);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const { data: rows = [], isLoading, refetch } = useLoanApplications();
  const users = useMemo(() => unique(rows.map(assignee)), [rows]);
  const [deleteApplication, setDeleteApplication] =
    useState<LoanApplication | null>(null);
  const { canDelete } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const banks = useMemo(
    () =>
      unique(
        rows.flatMap((a) =>
          (a.bankApplications ?? []).map((x) => x.bank?.name),
        ),
      ),
    [rows],
  );

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return rows.filter((a) => {
      if (
        s &&
        ![
          a.fullName ?? "",
          a.applicationId ?? "",
          a.mobile ?? "",
          a.email ?? "",
        ].some((v) => v.toLowerCase().includes(s))
      )
        return false;
      if (cat !== ALL && a.applicantCategory !== cat) return false;
      if (loan !== ALL && a.loanCategory !== loan) return false;
      if (status !== ALL && a.loanStatus !== status) return false;
      if (user !== ALL && assignee(a) !== user) return false;
      if (
        b !== ALL &&
        !(a.bankApplications ?? []).some((x) => x.bank?.name === b)
      )
        return false;
      return true;
    });
  }, [rows, q, cat, loan, status, user, b]);

  const handleDeleteApplication = async () => {
    if (!deleteApplication || isDeleting) return;

    try {
      setIsDeleting(true);
      const response = await axios.delete(
        `/api/loan-applications/${deleteApplication.id}`,
      );
      toast.success(
        response.data?.message || "Loan application deleted successfully",
      );
      setDeleteApplication(null);
      await refetch();

      if (paged.length === 1 && page > 1) {
        setPage((currentPage) => Math.max(1, currentPage - 1));
      }
    } catch (error) {
      console.error("Delete loan application error:", error);
      if (axios.isAxiosError(error)) {
        toast.error(
          error.response?.data?.message || "Failed to delete loan application",
        );
      } else {
        toast.error("Failed to delete loan application");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const totals = useMemo(
    () => ({
      total: rows.length,
      newEnq: rows.filter((a) => a.loanStatus === "New Enquiry").length,
      docs: rows.filter((a) => a.loanStatus === "Documents Pending").length,
      review: rows.filter((a) => a.loanStatus === "Under Review").length,
      sanctioned: rows.filter((a) => a.loanStatus === "Sanctioned").length,
      disbursed: rows.filter((a) => a.loanStatus === "Disbursed").length,
      rejected: rows.filter((a) => a.loanStatus === "Rejected").length,
    }),
    [rows],
  );

  const pc = Math.max(1, Math.ceil(filtered.length / perPage));

  const safePage = Math.min(page, pc);

  const startIndex = (safePage - 1) * perPage;
  const endIndex = Math.min(startIndex + perPage, filtered.length);

  const paged = filtered.slice(startIndex, endIndex);
  useEffect(() => {
    if (page > pc) {
      setPage(pc);
    }
  }, [page, pc]);
  const upd = (fn: (v: string) => void) => (v: string) => {
    fn(v);
    setPage(1);
  };

  const clear = () => {
    setQ("");
    setCat(ALL);
    setLoan(ALL);
    setStatus(ALL);
    setUser(ALL);
    setB(ALL);
    setPage(1);
  };
  const getLatestFollowUp = (followUps: LoanApplication["followUps"]) => {
    if (!followUps?.length) return null;

    return [...followUps].sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;

      return dateB - dateA;
    })[0];
  };

  return (
    <PageTransition>
      <div className="mx-auto max-w-[1600px] space-y-4 px-4 pb-12 sm:space-y-6 sm:px-6 lg:px-8">
        <PageHeader
          title="Loan Applications"
          description="Track loan enquiries, bank applications, approvals, disbursements, deposits, and follow-ups."
        />

        {/* Responsive Summary Grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
          {[
            ["Total", totals.total],
            ["New Enquiries", totals.newEnq],
            ["Docs Pending", totals.docs],
            ["Under Review", totals.review],
            ["Sanctioned", totals.sanctioned],
            ["Disbursed", totals.disbursed],
            ["Rejected", totals.rejected],
          ].map(([l, v]) => (
            <div key={l} className="rounded-2xl border bg-card p-4 shadow-sm">
              <div className="text-xs text-muted-foreground">{l}</div>
              <div className="mt-1 text-2xl font-semibold text-foreground">
                {v}
              </div>
            </div>
          ))}
        </div>

        <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          {/* Filters */}
          <div className="border-b p-4">
            <div className="flex flex-col gap-4">
              {/* Search */}
              <div className="w-full">
                <div className="flex h-11 items-center rounded-lg border bg-background px-3">
                  <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />

                  <Input
                    value={q}
                    onChange={(e) => {
                      setQ(e.target.value);
                      setPage(1);
                    }}
                    placeholder="Search name, application ID, mobile, email..."
                    className="h-full border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                  />
                </div>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                <FilterSelect
                  value={cat}
                  onChange={upd(setCat)}
                  placeholder="Applicant Category"
                  options={APPLICANT_CATEGORIES}
                />

                <FilterSelect
                  value={loan}
                  onChange={upd(setLoan)}
                  placeholder="Loan Category"
                  options={LOAN_CATEGORIES}
                />

                <FilterSelect
                  value={status}
                  onChange={upd(setStatus)}
                  placeholder="Status"
                  options={LOAN_STATUSES}
                />

                <FilterSelect
                  value={user}
                  onChange={upd(setUser)}
                  placeholder="Assignee"
                  options={users}
                />

                <FilterSelect
                  value={b}
                  onChange={upd(setB)}
                  placeholder="Bank / NBFC"
                  options={banks}
                />

                <Button
                  variant="outline"
                  onClick={clear}
                  className="h-10 w-full"
                >
                  <Filter className="mr-2 h-4 w-4" />
                  Clear
                </Button>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* MOBILE VIEW: Cards (Shown on screens smaller than `md`)  */}
          {/* ======================================================== */}
          <div className="space-y-3 p-4 md:hidden">
            {isLoading && (
              <div className="py-12 text-center text-sm text-muted-foreground">
                <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin text-primary" />
                Loading loan applications...
              </div>
            )}

            {!isLoading && paged.length === 0 && (
              <div className="py-12 text-center text-sm text-muted-foreground">
                No applications match your filters.
              </div>
            )}

            {!isLoading &&
              paged.map((a) => {
                const latestFollowUp = getLatestFollowUp(a.followUps);

                return (
                  <div
                    key={a.id}
                    className="space-y-3 rounded-xl border bg-background p-4 shadow-sm"
                  >
                    {/* Header: Application ID & Status Badge */}
                    <div className="flex items-center justify-between border-b pb-2">
                      <span className="font-mono text-xs font-semibold text-primary">
                        {a.applicationId}
                      </span>
                      <StatusBadge
                        status={a.loanStatus || "New Enquiry"}
                        className={loanStatusTone(
                          a.loanStatus || "New Enquiry",
                        )}
                      />
                    </div>

                    {/* Applicant Primary Details */}
                    <div>
                      <Link
                        href={`/loan-application/all/${a.id}`}
                        className="text-base font-bold text-foreground transition-colors hover:text-primary"
                      >
                        {a.fullName}
                      </Link>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {a.mobile}
                        </span>
                        {a.email && <span>{a.email}</span>}
                      </div>
                    </div>

                    {/* Metadata Grid (Assignee & Bank) */}
                    <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted/30 p-2 text-xs">
                      <div>
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <UserCheck className="h-3 w-3" /> Assignee:
                        </span>
                        <p className="font-medium text-foreground truncate">
                          {assignee(a as any) || "—"}
                        </p>
                      </div>
                      <div>
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Landmark className="h-3 w-3" /> Bank / NBFC:
                        </span>
                        <p className="font-medium text-foreground truncate">
                          {bank(a as any) || "—"}
                        </p>
                      </div>
                    </div>

                    {/* Amounts Grid */}
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] uppercase text-muted-foreground">
                          Applied
                        </span>
                        <p className="font-semibold text-foreground">
                          {formatINR(a.requiredLoanAmount)}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase text-muted-foreground">
                          Sanctioned
                        </span>
                        <p className="font-semibold text-foreground">
                          {a.sanctionedAmount
                            ? formatINR(Number(a.sanctionedAmount))
                            : "—"}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase text-muted-foreground">
                          Disbursed
                        </span>
                        <p className="font-semibold text-foreground">
                          {a.disbursedAmount
                            ? formatINR(Number(a.disbursedAmount))
                            : "—"}
                        </p>
                      </div>
                    </div>

                    {/* Follow up & Action Buttons */}
                    <div className="flex items-center justify-between border-t pt-2 text-xs">
                      <div className="flex items-start gap-2 text-xs">
                        <Calendar className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />

                        {latestFollowUp ? (
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground">
                              {formatFollowUpValue(latestFollowUp.followUpDate)}
                            </span>

                            {/* <span className="line-clamp-2 text-muted-foreground">
                              {latestFollowUp.note}
                            </span> */}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">
                            No Follow-up
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Link href={`/loan-application/all/${a.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View
                          </Button>
                        </Link>

                        {canDelete(MODULES.LOAN_APPLICATION) && (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 text-destructive transition-colors hover:border-destructive hover:bg-destructive/10 hover:text-destructive"
                            aria-label={`Delete ${a.fullName}`}
                            onClick={() => setDeleteApplication(a as any)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>

          {/* ======================================================== */}
          {/* DESKTOP VIEW: Table (Hidden on mobile, shown on `md+`)   */}
          {/* ======================================================== */}
          <div className="hidden w-full overflow-x-auto md:block">
            <table className="w-full min-w-[1200px] text-sm">
              <thead>
                <tr className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                  {[
                    "Application ID",
                    "Applicant",
                    "Mobile",
                    "Assignee",
                    "Bank / NBFC",
                    "Applied",
                    "Sanctioned",
                    "Disbursed",
                    "Status",
                    "Next FU",
                    "Actions",
                  ].map((h, i) => (
                    <th
                      key={h}
                      className={`whitespace-nowrap px-4 py-3 font-medium ${
                        (i >= 5 && i <= 7) || i === 10
                          ? "text-right"
                          : "text-left"
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr>
                    <td colSpan={11} className="py-14 text-center">
                      <span className="inline-flex items-center text-sm text-muted-foreground">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading loan applications...
                      </span>
                    </td>
                  </tr>
                )}
                {!isLoading &&
                  paged.map((a) => (
                    <tr key={a.id} className="border-t hover:bg-accent/40">
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs">
                        {a.applicationId}
                      </td>
                      <td className="min-w-[180px] whitespace-nowrap px-4 py-3">
                        <Link
                          href={`/loan-application/all/${a.id}`}
                          className="block font-medium text-foreground hover:text-primary"
                        >
                          {a.fullName}
                        </Link>
                        <div className="max-w-[180px] truncate text-xs text-muted-foreground">
                          {a.email || "—"}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {a.mobile}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                        {assignee(a as any) || "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                        {bank(a as any) || "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        {formatINR(a.requiredLoanAmount)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        {a.sanctionedAmount
                          ? formatINR(Number(a.sanctionedAmount))
                          : "—"}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        {a.disbursedAmount
                          ? formatINR(Number(a.disbursedAmount))
                          : "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <StatusBadge
                          status={a.loanStatus || "New Enquiry"}
                          className={loanStatusTone(
                            a.loanStatus || "New Enquiry",
                          )}
                        />
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {(() => {
                          const latestFollowUp = getLatestFollowUp(a.followUps);

                          if (!latestFollowUp) {
                            return (
                              <span className="text-muted-foreground">—</span>
                            );
                          }

                          return (
                            <div className="min-w-[180px]">
                              <div className="font-medium text-foreground">
                                {formatFollowUpValue(
                                  latestFollowUp.followUpDate,
                                )}
                              </div>

                              {/* <div
                                className="truncate text-muted-foreground"
                                title={latestFollowUp.note}
                              >
                                {latestFollowUp.note}
                              </div> */}
                            </div>
                          );
                        })()}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/loan-application/all/${a.id}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 gap-1"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">View</span>
                            </Button>
                          </Link>

                          {canDelete(MODULES.LOAN_APPLICATION) && (
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 text-destructive transition-colors hover:border-destructive hover:bg-destructive/10 hover:text-destructive"
                              aria-label={`Delete ${a.fullName}`}
                              onClick={() => setDeleteApplication(a as any)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                {!isLoading && paged.length === 0 && (
                  <tr>
                    <td
                      colSpan={11}
                      className="py-14 text-center text-sm text-muted-foreground"
                    >
                      No applications match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col items-center gap-4 border-t p-4 text-xs text-muted-foreground sm:flex-row sm:justify-between">
            <div className="text-center sm:text-left">
              {filtered.length === 0 ? (
                "No results"
              ) : (
                <>
                  Showing{" "}
                  <span className="font-medium text-foreground">
                    {startIndex + 1}
                  </span>
                  {"–"}
                  <span className="font-medium text-foreground">
                    {endIndex}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium text-foreground">
                    {filtered.length}
                  </span>{" "}
                  results
                </>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-end">
              <div className="flex items-center gap-2">
                Rows per page:
                <Select
                  value={String(perPage)}
                  onValueChange={(v) => {
                    setPerPage(Number(v));
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="h-8 w-16">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[10, 25, 50, 100].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="w-20 text-center">
                  Page {page} of {pc}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  disabled={page === pc}
                  onClick={() => setPage((p) => Math.min(pc, p + 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AlertDialog
        open={Boolean(deleteApplication)}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setDeleteApplication(null);
          }
        }}
      >
        <AlertDialogContent className="max-w-md rounded-2xl">
          <AlertDialogHeader>
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>

            <AlertDialogTitle className="text-xl">
              Delete loan application?
            </AlertDialogTitle>

            <AlertDialogDescription className="space-y-3 text-sm leading-6">
              <span className="block">
                This action will permanently delete the loan application and
                cannot be undone.
              </span>

              {deleteApplication && (
                <span className="block rounded-xl border bg-muted/40 p-3">
                  <span className="block font-medium text-foreground">
                    {deleteApplication.fullName}
                  </span>

                  <span className="mt-1 block text-xs text-muted-foreground">
                    Application ID: {deleteApplication.applicationId}
                  </span>
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel disabled={isDeleting} className="rounded-xl">
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              type="button"
              disabled={isDeleting}
              onClick={(event) => {
                event.preventDefault();
                void handleDeleteApplication();
              }}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Application
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageTransition>
  );
}

function FilterSelect({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: readonly string[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-10 w-full lg:h-9 lg:min-w-[170px] lg:w-[170px]">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>All {placeholder}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o} value={o}>
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
