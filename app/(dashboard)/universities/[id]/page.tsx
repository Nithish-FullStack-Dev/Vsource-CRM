// app\(dashboard)\universities\[id]\page.tsx
"use client";

import { useState, type ReactNode } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  ArrowLeft,
  Award,
  BookOpen,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  DollarSign,
  ExternalLink,
  Globe2,
  GraduationCap,
  Loader2,
  MapPin,
  Pencil,
  Trophy,
  Trash2,
  IndianRupee,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { UniversityFormDialog } from "@/components/universities/university-form-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/store";
import { MODULES } from "@/lib/module-codes";
interface Country {
  name?: string | null;
}

interface Course {
  id: string;
  name: string;
  courseCode?: string | null;
  degree?: string | null;
  durationMonths?: number | null;
  annualTuitionFee?: number | string | null;
  currency?: string | null;
  ieltsOverall?: number | string | null;
}

interface Scholarship {
  id: string;
  name: string;
  description?: string | null;
  amount?: number | string | null;
  percentage?: number | string | null;
}

interface UniversityDetails {
  id: string;
  name: string;
  tier?: "T1" | "T2" | "T3" | "T4";
  status?: string | null;
  logo?: string | null;

  city?: string | null;
  state?: string | null;
  country?: Country | null;
  website?: string | null;

  ranking?: number | string | null;
  establishedYear?: number | null;
  applicationFee?: number | string | null;
  currency?: string | null;

  description?: string | null;
  intakeNotes?: string | null;

  address?: string | null;
  postalCode?: string | null;

  courses?: Course[];
  scholarships?: Scholarship[];
}

function useUniversity(id: string) {
  return useQuery<UniversityDetails>({
    queryKey: ["university", id],
    queryFn: async () => {
      const response = await axios.get(`/api/universities/${id}`);
      return response.data.data;
    },
    enabled: Boolean(id),
  });
}

function formatCurrency(
  amount: number | string | null | undefined,
  currencyCode = "USD",
) {
  if (amount === null || amount === undefined || amount === "") {
    return "N/A";
  }

  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount)) {
    return "N/A";
  }

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode.toUpperCase(),
      maximumFractionDigits: 0,
    }).format(numericAmount);
  } catch {
    return `${currencyCode.toUpperCase()} ${numericAmount.toLocaleString()}`;
  }
}

function normalizeWebsiteUrl(website: string) {
  if (/^https?:\/\//i.test(website)) {
    return website;
  }

  return `https://${website}`;
}

function getWebsiteLabel(website: string) {
  return website
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/\/$/, "");
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase();
}
export default function UniversityDetailsPage() {
  const params = useParams();
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);

  const { canUpdate, canDelete } = useAuth();

  const handleDelete = async () => {
    try {
      await axios.delete(`/api/universities/${universityId}`);

      toast.success("University deleted successfully");

      await queryClient.invalidateQueries({
        queryKey: ["universities"],
      });

      window.location.href = "/universities";
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete university");
    }
  };
  const universityId = String(params?.id ?? "");

  const { data: university, isLoading, isError } = useUniversity(universityId);

  if (isLoading) {
    return <PageLoadingState />;
  }

  if (isError || !university) {
    return <PageErrorState />;
  }

  const courses = university.courses ?? [];
  const scholarships = university.scholarships ?? [];

  const status = university.status?.toLowerCase() || "inactive";

  const statusStyles: Record<string, string> = {
    active:
      "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    inactive:
      "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400",
    archived:
      "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-400",
  };
  const tierStyles: Record<string, string> = {
    T1: "border-purple-500/20 bg-purple-500/10 text-purple-700",
    T2: "border-blue-500/20 bg-blue-500/10 text-blue-700",
    T3: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700",
    T4: "border-orange-500/20 bg-orange-500/10 text-orange-700",
  };

  const location = [university.city, university.state, university.country?.name]
    .filter(Boolean)
    .join(", ");

  const applicationFee =
    Number(university.applicationFee) === 0
      ? "Free"
      : formatCurrency(university.applicationFee, university.currency || "USD");

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="mx-auto w-full max-w-360 space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {/* Top navigation */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button
            asChild
            variant="ghost"
            className="w-fit gap-2 px-2 text-muted-foreground hover:text-foreground"
          >
            <Link href="/universities">
              <ArrowLeft className="h-4 w-4" />
              Back to Universities
            </Link>
          </Button>

          <div className="flex w-full gap-2 sm:w-auto">
            {canUpdate(MODULES.UNIVERSITIES) && (
              <Button
                variant="outline"
                className="flex-1 gap-2 rounded-xl bg-background sm:flex-none"
                onClick={() => setEditOpen(true)}
              >
                <Pencil className="h-4 w-4" />
                Edit University
              </Button>
            )}

            <AlertDialog>
              <AlertDialogTrigger asChild>
                {canDelete(MODULES.UNIVERSITIES) && (
                  <Button
                    variant="destructive"
                    className="flex-1 gap-2 rounded-xl sm:flex-none"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                )}
              </AlertDialogTrigger>

              <AlertDialogContent className="rounded-2xl">
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete University</AlertDialogTitle>

                  <AlertDialogDescription>
                    Are you sure you want to delete this university? This action
                    cannot be undone and all related courses and scholarship
                    data will be removed.
                  </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>

                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete University
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* University header */}
        <section className="overflow-hidden rounded-3xl border bg-card shadow-sm">
          <div className="h-2 bg-primary" />

          <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[330px_minmax(0,1fr)] lg:items-stretch lg:p-8">
            <div className="flex min-h-40 items-center justify-center rounded-2xl border bg-white px-8 py-7 shadow-sm">
              {university.logo ? (
                <img
                  src={university.logo}
                  alt={`${university.name} logo`}
                  className="max-h-24 w-full max-w-68.75 object-contain"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-primary text-2xl font-bold text-primary-foreground">
                  {getInitials(university.name)}
                </div>
              )}
            </div>

            <div className="flex min-w-0 flex-col justify-center">
              <div className="mb-3 flex flex-wrap items-center gap-3">
                {university.tier && (
                  <Badge
                    variant="outline"
                    className={`rounded-full px-3 py-1 ${
                      tierStyles[university.tier]
                    }`}
                  >
                    {university.tier}
                  </Badge>
                )}

                <Badge
                  variant="outline"
                  className={`rounded-full px-3 py-1 capitalize ${
                    statusStyles[status] ??
                    "border-border bg-muted text-muted-foreground"
                  }`}
                >
                  {status}
                </Badge>

                <span className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  University Profile
                </span>
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
                {university.name}
              </h1>

              <div className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6">
                {location && (
                  <div className="flex min-w-0 items-center gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <MapPin className="h-4 w-4" />
                    </div>

                    <span>{location}</span>
                  </div>
                )}

                {university.website && (
                  <a
                    href={normalizeWebsiteUrl(university.website)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-w-0 items-center gap-2 transition-colors hover:text-primary"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Globe2 className="h-4 w-4" />
                    </div>

                    <span className="truncate">
                      {getWebsiteLabel(university.website)}
                    </span>

                    <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="border-t bg-muted/20 px-5 py-5 sm:px-7 lg:px-8">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <MetricCard
                icon={<Trophy />}
                label="University Ranking"
                value={
                  university.ranking ? `#${university.ranking}` : "Not added"
                }
              />

              <MetricCard
                icon={<CalendarDays />}
                label="Established"
                value={university.establishedYear?.toString() || "Not added"}
              />

              <MetricCard
                icon={<IndianRupee />}
                label="Application Fee"
                value={applicationFee}
              />

              <MetricCard
                icon={<BookOpen />}
                label="Available Courses"
                value={courses.length.toString()}
              />
            </div>
          </div>
        </section>

        {/* Content layout */}
        <div className="grid items-start gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="space-y-6 xl:sticky xl:top-6">
            <InfoCard
              icon={<Building2 />}
              title="About University"
              description="Overview and general university information"
            >
              <p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
                {university.description ||
                  "No university description has been added yet."}
              </p>
            </InfoCard>

            <InfoCard
              icon={<CheckCircle2 />}
              title="Intake Information"
              description="Important notes for student admissions"
            >
              {university.intakeNotes ? (
                <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4">
                  <p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
                    {university.intakeNotes}
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed bg-muted/20 p-5 text-center">
                  <CheckCircle2 className="mx-auto mb-3 h-6 w-6 text-muted-foreground/60" />

                  <p className="text-sm font-medium text-foreground">
                    No admission notes
                  </p>

                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Intake and admission notes will appear here.
                  </p>
                </div>
              )}
            </InfoCard>
          </aside>

          {/* Main content */}
          <main className="min-w-0 space-y-6">
            <Card className="overflow-hidden rounded-3xl border bg-card shadow-sm">
              <CardHeader className="border-b bg-muted/20 px-5 py-5 sm:px-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <SectionIcon>
                      <GraduationCap className="h-5 w-5" />
                    </SectionIcon>

                    <div>
                      <CardTitle className="text-xl">
                        Available Courses
                      </CardTitle>

                      <p className="mt-1 text-sm text-muted-foreground">
                        Degree programmes offered by this university
                      </p>
                    </div>
                  </div>

                  <Badge
                    variant="secondary"
                    className="w-fit rounded-full px-3 py-1"
                  >
                    {courses.length}{" "}
                    {courses.length === 1 ? "Course" : "Courses"}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-4 sm:p-6">
                {courses.length === 0 ? (
                  <EmptyState
                    icon={<BookOpen />}
                    title="No courses available"
                    description="Courses added for this university will appear here."
                  />
                ) : (
                  <div className="grid gap-4 lg:grid-cols-2">
                    {courses.map((course) => (
                      <CourseCard
                        key={course.id}
                        course={course}
                        universityCurrency={university.currency || "USD"}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Scholarships */}
            <Card className="overflow-hidden rounded-3xl border bg-card shadow-sm">
              <CardHeader className="border-b bg-muted/20 px-5 py-5 sm:px-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <SectionIcon>
                      <Award className="h-5 w-5" />
                    </SectionIcon>

                    <div>
                      <CardTitle className="text-xl">Scholarships</CardTitle>

                      <p className="mt-1 text-sm text-muted-foreground">
                        Financial aid and scholarship opportunities
                      </p>
                    </div>
                  </div>

                  <Badge
                    variant="secondary"
                    className="w-fit rounded-full px-3 py-1"
                  >
                    {scholarships.length}{" "}
                    {scholarships.length === 1 ? "Scholarship" : "Scholarships"}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-4 sm:p-6">
                {scholarships.length === 0 ? (
                  <EmptyState
                    icon={<Award />}
                    title="No scholarships available"
                    description="Scholarships added for this university will appear here."
                  />
                ) : (
                  <div className="space-y-4">
                    {scholarships.map((scholarship) => (
                      <ScholarshipCard
                        key={scholarship.id}
                        scholarship={scholarship}
                        currency={university.currency || "USD"}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </main>
        </div>
      </div>

      <UniversityFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        university={university as any}
        onSubmit={async (data) => {
          try {
            await axios.put(`/api/universities/${university.id}`, data);

            await Promise.all([
              queryClient.invalidateQueries({
                queryKey: ["university", university.id],
              }),
              queryClient.invalidateQueries({
                queryKey: ["universities"],
              }),
            ]);

            setEditOpen(false);
            toast.success("University updated successfully!");
          } catch (error) {
            console.error("University update failed:", error);
            toast.error("Failed to update university.");
          }
        }}
      />
    </div>
  );
}

function PageLoadingState() {
  return (
    <div className="flex min-h-125 items-center justify-center px-4">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium">Loading university details...</p>
      </div>
    </div>
  );
}

function PageErrorState() {
  return (
    <div className="mx-auto flex min-h-125 max-w-lg items-center px-4">
      <Card className="w-full rounded-2xl">
        <CardContent className="flex flex-col items-center p-8 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
            <Building2 className="h-7 w-7 text-muted-foreground" />
          </div>

          <h1 className="text-xl font-semibold">University not found</h1>

          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            The university may have been deleted, archived, or the page address
            may be incorrect.
          </p>

          <Button asChild className="mt-6 gap-2 rounded-xl">
            <Link href="/universities">
              <ArrowLeft className="h-4 w-4" />
              Back to Universities
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-2xl border bg-muted/20 p-4 transition-colors hover:bg-muted/40">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary [&>svg]:h-5 [&>svg]:w-5">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-muted-foreground">
          {label}
        </p>

        <p className="mt-1 truncate text-base font-semibold text-foreground">
          {value}
        </p>
      </div>
    </div>
  );
}

function InfoCard({
  icon,
  title,
  description,
  children,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <Card className="overflow-hidden rounded-3xl border bg-card shadow-sm">
      <CardHeader className="border-b bg-muted/20 px-5 py-5">
        <div className="flex items-start gap-3">
          <SectionIcon>{icon}</SectionIcon>

          <div className="min-w-0">
            <CardTitle className="text-lg">{title}</CardTitle>

            {description && (
              <p className="mt-1 text-sm leading-5 text-muted-foreground">
                {description}
              </p>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5">{children}</CardContent>
    </Card>
  );
}

function SectionIcon({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary [&>svg]:h-5 [&>svg]:w-5">
      {children}
    </div>
  );
}

function CourseCard({
  course,
  universityCurrency,
}: {
  course: Course;
  universityCurrency: string;
}) {
  return (
    <article className="flex h-full flex-col rounded-2xl border bg-background p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3
            className="line-clamp-2 text-base font-semibold leading-6 text-foreground"
            title={course.name}
          >
            {course.name}
          </h3>

          {course.courseCode && (
            <p className="mt-1.5 text-xs font-medium text-muted-foreground">
              Course code:{" "}
              <span className="font-mono text-foreground">
                {course.courseCode}
              </span>
            </p>
          )}
        </div>

        {course.degree && (
          <Badge variant="secondary" className="shrink-0 rounded-lg capitalize">
            {course.degree}
          </Badge>
        )}
      </div>

      <Separator className="my-4" />

      <div className="mt-auto space-y-1">
        <DetailRow
          icon={<Clock3 />}
          label="Duration"
          value={
            course.durationMonths
              ? `${course.durationMonths} months`
              : "Not specified"
          }
        />

        <DetailRow
          icon={<IndianRupee />}
          label="Annual Tuition"
          value={formatCurrency(
            course.annualTuitionFee,
            course.currency || universityCurrency,
          )}
        />

        <DetailRow
          icon={<CheckCircle2 />}
          label="IELTS Requirement"
          value={
            course.ieltsOverall
              ? `${course.ieltsOverall} overall`
              : "Not specified"
          }
        />
      </div>
    </article>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg px-2 py-2.5 text-sm transition-colors hover:bg-muted/40">
      <div className="flex min-w-0 items-center gap-2 text-muted-foreground">
        <span className="shrink-0 text-primary [&>svg]:h-4 [&>svg]:w-4">
          {icon}
        </span>

        <span>{label}</span>
      </div>

      <span className="text-right font-medium text-foreground">{value}</span>
    </div>
  );
}

function ScholarshipCard({
  scholarship,
  currency,
}: {
  scholarship: Scholarship;
  currency: string;
}) {
  const hasAmount =
    scholarship.amount !== null &&
    scholarship.amount !== undefined &&
    Number(scholarship.amount) > 0;

  const hasPercentage =
    scholarship.percentage !== null &&
    scholarship.percentage !== undefined &&
    Number(scholarship.percentage) > 0;

  return (
    <article className="rounded-2xl border bg-background p-5 transition-all duration-200 hover:border-primary/30 hover:shadow-md">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Award className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <h3 className="text-base font-semibold text-foreground sm:text-lg">
              {scholarship.name}
            </h3>

            <p className="mt-1.5 line-clamp-3 text-sm leading-6 text-muted-foreground">
              {scholarship.description ||
                "No scholarship description has been added."}
            </p>
          </div>
        </div>

        {(hasAmount || hasPercentage) && (
          <div className="flex shrink-0 flex-wrap gap-2 md:max-w-52.5 md:justify-end">
            {hasAmount && (
              <Badge className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-400">
                {formatCurrency(scholarship.amount, currency)}
              </Badge>
            )}

            {hasPercentage && (
              <Badge className="rounded-lg bg-blue-500/10 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-500/10 dark:text-blue-400">
                {scholarship.percentage}% Tuition Waiver
              </Badge>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-52 flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/10 px-6 py-10 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground [&>svg]:h-6 [&>svg]:w-6">
        {icon}
      </div>

      <h3 className="font-semibold text-foreground">{title}</h3>

      <p className="mt-1 max-w-sm text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
