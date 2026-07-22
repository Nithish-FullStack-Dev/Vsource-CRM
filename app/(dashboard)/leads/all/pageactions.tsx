// crm-frontend-next\app\(dashboard)\leads\all\pageactions.tsx
"use client";

import type { Lead, LeadStatus } from "@/types";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Branch, getBranches } from "@/lib/branches";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useCounselors } from "@/lib/lead";
import { Loader2 } from "lucide-react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

interface PageActionsProps {
  selected: Lead | null;
  setSelected: React.Dispatch<React.SetStateAction<Lead | null>>;

  editingLead: Lead | null;
  setEditingLead: React.Dispatch<React.SetStateAction<Lead | null>>;

  leadIdToDelete: string | null;
  setLeadIdToDelete: React.Dispatch<React.SetStateAction<string | null>>;

  handleUpdateLead: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;

  executeDeleteLead: () => Promise<void>;

  branchOptions: string[];

  statusStyle: Record<LeadStatus, string>;

  selectedCounselors: string[];
  setSelectedCounselors: React.Dispatch<React.SetStateAction<string[]>>;

  isUpdating: boolean;

  followupDate: string;
  setFollowupDate: React.Dispatch<React.SetStateAction<string>>;

  followupNote: string;
  setFollowupNote: React.Dispatch<React.SetStateAction<string>>;
}
type EnglishTestType = "IELTS" | "TOEFL" | "DUOLINGO" | "PTE";

type EnglishScoreField =
  | "totalScore"
  | "listeningScore"
  | "readingScore"
  | "writingScore"
  | "speakingScore";

const englishTestOptions: EnglishTestType[] = [
  "IELTS",
  "TOEFL",
  "DUOLINGO",
  "PTE",
];

const englishTestScoreLimits: Record<
  EnglishTestType,
  {
    total: number;
    section: number;
    decimals: number;
  }
> = {
  IELTS: { total: 9, section: 9, decimals: 1 },
  TOEFL: { total: 120, section: 30, decimals: 0 },
  PTE: { total: 90, section: 90, decimals: 0 },
  DUOLINGO: { total: 160, section: 160, decimals: 0 },
};
export default function PageActions(props: PageActionsProps) {
  const {
    selected,
    setSelected,
    editingLead,
    setEditingLead,
    leadIdToDelete,
    setLeadIdToDelete,
    handleUpdateLead,
    executeDeleteLead,
    selectedCounselors,
    setSelectedCounselors,
    isUpdating,
    followupDate,
    setFollowupDate,
    followupNote,
    setFollowupNote,
  } = props;
  const queryClient = useQueryClient();
  const [branches, setBranches] = useState<Branch[]>([]);
  const { data: counselors = [] } = useCounselors(editingLead?.branchId);
  const [universityOpen, setUniversityOpen] = useState(false);
  const [universitySearch, setUniversitySearch] = useState("");
  const { data: intakes = [], isLoading: intakeLoad } = useQuery({
    queryKey: ["intake"],
    queryFn: async () => {
      const { data } = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/intakes`,
        {
          withCredentials: true,
        },
      );
      return data?.data || [];
    },
  });
  const { data: universities = [] } = useQuery({
    queryKey: ["universities"],
    queryFn: async () => {
      const { data } = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/lead-universities?status=true`,
        {
          withCredentials: true,
        },
      );

      return data?.data || [];
    },
  });
  const createUniversity = async (name: string) => {
    const { data } = await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}/lead-universities`,
      {
        name,
      },
      {
        withCredentials: true,
      },
    );

    await queryClient.invalidateQueries({
      queryKey: ["universities"],
    });

    return data;
  };
  const { data: courses = [], isLoading: coursesLoad } = useQuery({
    queryKey: ["courses"],
    queryFn: async () => {
      const { data } = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/lead-degrees?status=true`,
        {
          withCredentials: true,
        },
      );

      return data?.data || [];
    },
  });
  const { data: countries = [], isLoading: countryLoad } = useQuery({
    queryKey: ["countries"],
    queryFn: async () => {
      const { data } = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/countries`,
        {
          withCredentials: true,
        },
      );
      return data?.data || [];
    },
  });
  const { data: lead_sources = [], isLoading: lead_sourcesLoad } = useQuery({
    queryKey: ["lead-sources"],
    queryFn: async () => {
      const { data } = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/lead-sources`,
        {
          withCredentials: true,
        },
      );
      return data?.data || [];
    },
  });

  useEffect(() => {
    const loadBranches = async () => {
      try {
        const data = await getBranches();
        setBranches(data);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load branches");
      }
    };

    loadBranches();
  }, []);

  useEffect(() => {
    if (editingLead?.counselors) {
      setSelectedCounselors(
        editingLead.counselors.map((c: any) => c.counselor.id),
      );
    }
  }, [editingLead]);

  function DetailItem({
    label,
    value,
  }: {
    label: string;
    value?: string | number | null;
  }) {
    const displayValue =
      value === null || value === undefined || value === "" ? "—" : value;

    return (
      <div className="min-w-0">
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>

        <p className="break-words text-sm font-medium">{displayValue}</p>
      </div>
    );
  }

  function DetailBlock({
    label,
    value,
  }: {
    label: string;
    value?: string | null;
  }) {
    return (
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <div className="rounded-lg bg-muted/30 p-3 text-sm whitespace-pre-wrap">
          {value || "—"}
        </div>
      </div>
    );
  }
  const formatDate = (value?: string | Date | null) => {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleDateString("en-GB");
  };
  const addEnglishTest = (testType: EnglishTestType) => {
    if (!editingLead) return;

    const currentTests = editingLead.englishTests ?? [];

    if (currentTests.some((test) => test.testType === testType)) {
      toast.error(`${testType} is already added`);
      return;
    }

    setEditingLead({
      ...editingLead,
      englishTests: [
        ...currentTests,
        {
          testType,
          totalScore: null,
          listeningScore: null,
          readingScore: null,
          writingScore: null,
          speakingScore: null,
        },
      ],
    });
  };

  const removeEnglishTest = (index: number) => {
    if (!editingLead) return;

    setEditingLead({
      ...editingLead,
      englishTests: (editingLead.englishTests ?? []).filter(
        (_, testIndex) => testIndex !== index,
      ),
    });
  };

  const updateEnglishTestScore = (
    index: number,
    field: EnglishScoreField,
    rawValue: string,
  ) => {
    if (!editingLead) return;

    const tests = [...(editingLead.englishTests ?? [])];
    const test = tests[index];

    if (!test) return;

    const limits = englishTestScoreLimits[test.testType];

    const max = field === "totalScore" ? limits.total : limits.section;

    let value = rawValue.replace(/[^0-9.]/g, "");

    const parts = value.split(".");

    if (parts.length > 2) {
      value = `${parts[0]}.${parts.slice(1).join("")}`;
    }

    if (limits.decimals === 0) {
      value = value.replace(/\./g, "");
    } else if (value.includes(".")) {
      const [integerPart, decimalPart = ""] = value.split(".");

      value = `${integerPart}.${decimalPart.slice(0, limits.decimals)}`;
    }

    if (value !== "") {
      const numericValue = Number(value);

      if (Number.isNaN(numericValue)) return;

      if (numericValue > max) {
        value = String(max);
      }
    }

    tests[index] = {
      ...test,
      [field]: value === "" ? null : Number(value),
    };

    setEditingLead({
      ...editingLead,
      englishTests: tests,
    });
  };
  return (
    <>
      {/* 1. DETAILED RECORD VIEW SHEET */}
      <Sheet
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) {
            setSelected(null);
          }
        }}
      >
        <SheetContent className="w-full z-102 overflow-y-auto sm:max-w-4xl [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {selected && (
            <>
              {/* HEADER */}
              <SheetHeader className="border-b pb-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <SheetTitle className="break-words text-2xl font-bold">
                      {selected.studentName || "Unnamed Student"}
                    </SheetTitle>

                    <SheetDescription className="mt-1">
                      WalkIn Number:{" "}
                      <span className="font-mono font-semibold text-foreground">
                        {selected.leadNumber}
                      </span>
                    </SheetDescription>
                  </div>
                </div>
              </SheetHeader>

              <div className="space-y-6 py-6">
                {/* BASIC INFORMATION */}
                <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
                  <div className="border-b bg-muted/30 px-5 py-4">
                    <h3 className="text-base font-semibold">
                      Basic Information
                    </h3>

                    <p className="mt-1 text-sm text-muted-foreground">
                      Student personal and lead information
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 lg:grid-cols-3">
                    <DetailItem
                      label="Student Name"
                      value={selected.studentName}
                    />

                    <DetailItem
                      label="Father Name"
                      value={selected.fatherName}
                    />

                    <DetailItem
                      label="Mobile Number"
                      value={selected.mobileNumber}
                    />

                    <DetailItem
                      label="Email Address"
                      value={selected.emailId}
                    />

                    <DetailItem label="Place" value={selected.place} />

                    <DetailItem
                      label="Passport Number"
                      value={selected.passport}
                    />

                    <DetailItem
                      label="Passport Expiry Date"
                      value={formatDate(selected.passportExpireDate)}
                    />

                    <DetailItem
                      label="Counselling Date"
                      value={formatDate(selected.counsellingDate)}
                    />

                    <DetailItem label="Lead Source" value={selected.source} />

                    <DetailItem label="Branch" value={selected.branch?.name} />

                    <DetailItem
                      label="Graduation Status"
                      value={
                        selected.graduationStatus
                          ? selected.graduationStatus === "completed"
                            ? "Completed"
                            : "Pursuing"
                          : null
                      }
                    />

                    <DetailItem
                      label="Loan Requirement"
                      value={selected.loanRequirement ? "Yes" : "No"}
                    />

                    {/* ASSIGNED COUNSELORS */}
                    <div className="sm:col-span-2 lg:col-span-3">
                      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Assigned Counselors
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {selected.counselors?.length ? (
                          selected.counselors.map((item, index) => (
                            <Badge
                              key={item.counselor?.id || index}
                              variant={item.isPrimary ? "default" : "secondary"}
                            >
                              {item.counselor?.name || "Unknown Counselor"}

                              {item.isPrimary && " (Primary)"}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            No counselors assigned
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </section>

                {/* EDUCATIONAL INFORMATION */}
                <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
                  <div className="border-b bg-muted/30 px-5 py-4">
                    <h3 className="text-base font-semibold">
                      Educational Information
                    </h3>

                    <p className="mt-1 text-sm text-muted-foreground">
                      Academic history and graduation details
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 lg:grid-cols-3">
                    <DetailItem
                      label="10th Percentage"
                      value={
                        selected.tenthPercentage != null
                          ? `${selected.tenthPercentage}%`
                          : null
                      }
                    />

                    <DetailItem
                      label="10th Passing Year"
                      value={selected.tenthYearOfPassing}
                    />

                    <DetailItem
                      label="12th Percentage"
                      value={
                        selected.twelfthPercentage != null
                          ? `${selected.twelfthPercentage}%`
                          : null
                      }
                    />

                    <DetailItem
                      label="12th Passing Year"
                      value={selected.twelfthYearOfPassing}
                    />

                    <DetailItem
                      label="University / College"
                      value={selected.bachelorsUniversityName}
                    />

                    <DetailItem
                      label="Bachelor Course"
                      value={selected.bachelorsCourse}
                    />

                    <DetailItem
                      label="Bachelor Percentage / CGPA"
                      value={selected.bachelorsPercentage}
                    />

                    <DetailItem
                      label="Bachelor Passing Year"
                      value={selected.bachelorsYearOfPassing}
                    />

                    <DetailItem label="Backlogs" value={selected.backlogs} />
                  </div>

                  <div className="border-t p-5">
                    <DetailBlock
                      label="Education Gaps"
                      value={selected.gapsIfAny}
                    />
                  </div>
                </section>

                {/* ENGLISH PROFICIENCY TESTS */}
                <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
                  <div className="border-b bg-muted/30 px-5 py-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="text-base font-semibold">
                          English Proficiency Tests
                        </h3>

                        <p className="mt-1 text-sm text-muted-foreground">
                          Selected tests and individual score details
                        </p>
                      </div>

                      <Badge variant="secondary">
                        {selected.englishTests?.length || 0}{" "}
                        {selected.englishTests?.length === 1 ? "Test" : "Tests"}
                      </Badge>
                    </div>
                  </div>

                  <div className="p-5">
                    {selected.englishTests?.length ? (
                      <div className="space-y-4">
                        {selected.englishTests.map((test, index) => (
                          <div
                            key={test.id || `${test.testType}-${index}`}
                            className="overflow-hidden rounded-2xl border bg-muted/10"
                          >
                            {/* TEST HEADER */}
                            <div className="flex flex-col gap-3 border-b bg-muted/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                              <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border bg-background text-sm font-bold">
                                  {index + 1}
                                </div>

                                <div>
                                  <p className="font-semibold">
                                    {test.testType}
                                  </p>

                                  <p className="text-xs text-muted-foreground">
                                    English proficiency test scores
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">
                                  Total Score
                                </span>

                                <Badge variant="outline">
                                  {test.totalScore ?? "—"}
                                </Badge>
                              </div>
                            </div>

                            {/* TEST SCORES */}
                            <div className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-3 lg:grid-cols-5">
                              <DetailItem
                                label="Total Score"
                                value={test.totalScore}
                              />

                              <DetailItem
                                label="Listening"
                                value={test.listeningScore}
                              />

                              <DetailItem
                                label="Reading"
                                value={test.readingScore}
                              />

                              <DetailItem
                                label="Writing"
                                value={test.writingScore}
                              />

                              <DetailItem
                                label="Speaking"
                                value={test.speakingScore}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex min-h-32 items-center justify-center rounded-2xl border border-dashed bg-muted/10 p-6">
                        <div className="text-center">
                          <p className="text-sm font-medium">
                            No English tests added
                          </p>

                          <p className="mt-1 text-xs text-muted-foreground">
                            English proficiency test information is not
                            available for this lead.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                {/* GRE / GMAT */}
                <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
                  <div className="border-b bg-muted/30 px-5 py-4">
                    <h3 className="text-base font-semibold">
                      GRE / GMAT Details
                    </h3>

                    <p className="mt-1 text-sm text-muted-foreground">
                      Graduate admission test scores
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 lg:grid-cols-4">
                    <DetailItem
                      label="Total Score"
                      value={selected.greGmatScore}
                    />

                    <DetailItem
                      label="Quantitative"
                      value={selected.quantitativeScore}
                    />

                    <DetailItem label="Verbal" value={selected.verbalScore} />

                    <DetailItem
                      label="Analytical Writing"
                      value={selected.analyticalWritingScore}
                    />
                  </div>
                </section>

                {/* STUDY PREFERENCES */}
                <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
                  <div className="border-b bg-muted/30 px-5 py-4">
                    <h3 className="text-base font-semibold">
                      Study Preferences & Experience
                    </h3>

                    <p className="mt-1 text-sm text-muted-foreground">
                      Preferred study destination and professional experience
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 lg:grid-cols-3">
                    <DetailItem
                      label="Preferred Country"
                      value={selected.preferredCountry}
                    />

                    <DetailItem
                      label="Preferred Intake"
                      value={selected.preferredIntake}
                    />

                    <DetailItem
                      label="Preferred Course"
                      value={selected.preferredCourse}
                    />

                    {/* PREFERRED TIERS */}
                    <div className="sm:col-span-2 lg:col-span-3">
                      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Preferred University Tiers
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {selected.preferredTiers?.length ? (
                          selected.preferredTiers.map((tier) => (
                            <Badge key={tier} variant="secondary">
                              {tier}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            No university tiers selected
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="border-t p-5">
                    <DetailBlock
                      label="Work Experience"
                      value={selected.workExperience}
                    />
                  </div>
                </section>

                {/* CRM INFORMATION */}
                <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
                  <div className="border-b bg-muted/30 px-5 py-4">
                    <h3 className="text-base font-semibold">CRM Information</h3>

                    <p className="mt-1 text-sm text-muted-foreground">
                      Lead status, follow-up and remarks
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Status
                      </p>

                      <Badge className="capitalize">{selected.status}</Badge>
                    </div>

                    <DetailItem
                      label="Created Date"
                      value={formatDate(selected.createdAt)}
                    />

                    <DetailItem
                      label="Next Follow-up"
                      value={formatDate(selected.nextFollowup)}
                    />

                    <DetailItem
                      label="Converted"
                      value={selected.isConverted ? "Yes" : "No"}
                    />
                  </div>

                  <div className="border-t p-5">
                    <DetailBlock label="Remarks" value={selected.remarks} />
                  </div>
                </section>

                {/* FOLLOW-UP HISTORY */}
                <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
                  <div className="border-b bg-muted/30 px-5 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-base font-semibold">
                          Follow-up History
                        </h3>

                        <p className="mt-1 text-sm text-muted-foreground">
                          Previous notes and scheduled follow-ups
                        </p>
                      </div>

                      <Badge variant="secondary">
                        {selected.timelines?.length || 0}
                      </Badge>
                    </div>
                  </div>

                  <div className="p-5">
                    {selected.timelines?.length ? (
                      <div className="space-y-3">
                        {selected.timelines.map((timeline) => (
                          <div
                            key={timeline.id}
                            className="rounded-2xl border bg-muted/10 p-4"
                          >
                            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                              <div>
                                <p className="text-sm font-semibold">
                                  {timeline.nextFollowup
                                    ? `Follow-up: ${formatDate(
                                        timeline.nextFollowup,
                                      )}`
                                    : "Follow-up Note"}
                                </p>

                                <p className="mt-2 whitespace-pre-wrap break-words text-sm text-muted-foreground">
                                  {timeline.description || "No description"}
                                </p>
                              </div>

                              <span className="shrink-0 text-xs text-muted-foreground">
                                {formatDate(timeline.createdAt)}
                              </span>
                            </div>

                            {timeline.createdBy?.name && (
                              <div className="mt-3 border-t pt-3">
                                <p className="text-xs text-muted-foreground">
                                  Added by{" "}
                                  <span className="font-medium text-foreground">
                                    {timeline.createdBy.name}
                                  </span>
                                </p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex min-h-32 items-center justify-center rounded-2xl border border-dashed bg-muted/10 p-6">
                        <div className="text-center">
                          <p className="text-sm font-medium">
                            No follow-up history
                          </p>

                          <p className="mt-1 text-xs text-muted-foreground">
                            Follow-up notes have not been added for this lead.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* 2. RECORD MODIFICATION ACTIONSHEET FORM */}
      <Sheet
        open={!!editingLead}
        onOpenChange={(value) => !value && setEditingLead(null)}
      >
        <SheetContent className="w-full sm:max-w-4xl overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {editingLead && (
            <form
              onSubmit={handleUpdateLead}
              className="h-full flex flex-col justify-between"
            >
              <div className="space-y-5">
                <SheetHeader className="pb-4 border-b border-border">
                  <SheetTitle className="text-lg font-bold">
                    Modify Lead Parameters
                  </SheetTitle>
                  <SheetDescription>
                    Synchronize profile record variables for Serial Number:{" "}
                    <span className="font-mono text-foreground font-semibold">
                      {editingLead.leadNumber}
                    </span>
                  </SheetDescription>
                </SheetHeader>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Loan Requirement */}
                  <div className="space-y-3">
                    <Label>Loan Requirement</Label>

                    <RadioGroup
                      value={editingLead.loanRequirement ? "yes" : "no"}
                      onValueChange={(value) =>
                        setEditingLead({
                          ...editingLead,
                          loanRequirement: value === "yes",
                        })
                      }
                      className="flex h-10 items-center gap-6"
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="yes" id="edit-loan-yes" />

                        <Label
                          htmlFor="edit-loan-yes"
                          className="cursor-pointer font-normal"
                        >
                          Yes
                        </Label>
                      </div>

                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="no" id="edit-loan-no" />

                        <Label
                          htmlFor="edit-loan-no"
                          className="cursor-pointer font-normal"
                        >
                          No
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                  {/* Student Name */}
                  <div className="grid gap-1.5 sm:col-span-2">
                    <Label htmlFor="edit-name" className="text-sm font-medium">
                      Student Name
                    </Label>
                    <Input
                      id="edit-name"
                      className="bg-background"
                      value={editingLead.studentName || ""}
                      onChange={(e) =>
                        setEditingLead({
                          ...editingLead,
                          studentName: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="grid gap-1.5 sm:col-span-2">
                    <Label htmlFor="edit-name" className="text-sm font-medium">
                      Father Name
                    </Label>
                    <Input
                      id="edit-name"
                      className="bg-background"
                      value={editingLead.fatherName || ""}
                      onChange={(e) =>
                        setEditingLead({
                          ...editingLead,
                          fatherName: e.target.value,
                        })
                      }
                    />
                  </div>

                  {/* Mobile Number */}
                  <div className="grid gap-1.5">
                    <Label
                      htmlFor="edit-mobile"
                      className="text-sm font-medium"
                    >
                      Mobile Number
                    </Label>
                    <Input
                      id="edit-mobile"
                      className="bg-background"
                      value={editingLead.mobileNumber || ""}
                      onChange={(e) =>
                        setEditingLead({
                          ...editingLead,
                          mobileNumber: e.target.value,
                        })
                      }
                    />
                  </div>

                  {/* Email Address */}
                  <div className="grid gap-1.5">
                    <Label htmlFor="edit-email" className="text-sm font-medium">
                      Email Address
                    </Label>
                    <Input
                      id="edit-email"
                      type="email"
                      className="bg-background"
                      value={editingLead.emailId || ""}
                      onChange={(e) =>
                        setEditingLead({
                          ...editingLead,
                          emailId: e.target.value,
                        })
                      }
                    />
                  </div>

                  {/* Place */}
                  <div className="grid gap-1.5">
                    <Label htmlFor="edit-place" className="text-sm font-medium">
                      Place
                    </Label>
                    <Input
                      id="edit-place"
                      className="bg-background"
                      value={editingLead.place || ""}
                      onChange={(e) =>
                        setEditingLead({
                          ...editingLead,
                          place: e.target.value,
                        })
                      }
                    />
                  </div>

                  {/* Passport Number */}
                  <div className="grid gap-1.5">
                    <Label
                      htmlFor="edit-passport"
                      className="text-sm font-medium"
                    >
                      Passport Number
                    </Label>
                    <Input
                      id="edit-passport"
                      className="bg-background"
                      value={editingLead.passport || ""}
                      onChange={(e) =>
                        setEditingLead({
                          ...editingLead,
                          passport: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="grid gap-1.5">
                    <Label htmlFor="edit-passport-expiry">
                      Passport Expiry Date
                    </Label>

                    <Input
                      id="edit-passport-expiry"
                      type="date"
                      value={
                        editingLead.passportExpireDate
                          ? new Date(editingLead.passportExpireDate)
                              .toISOString()
                              .split("T")[0]
                          : ""
                      }
                      onChange={(e) =>
                        setEditingLead({
                          ...editingLead,
                          passportExpireDate: e.target.value || null,
                        })
                      }
                    />
                  </div>

                  {/* Assigned Branch - Synced dynamically with loaded branches */}
                  <div className="grid gap-1.5 sm:col-span-2">
                    <Label
                      htmlFor="edit-branch"
                      className="text-sm font-medium"
                    >
                      Assigned Branch
                    </Label>
                    <Select
                      value={editingLead.branch?.id || ""}
                      onValueChange={(val) => {
                        const targetBranch = branches.find((b) => b.id === val);

                        setEditingLead({
                          ...editingLead,
                          branchId: targetBranch?.id ?? "",
                          branch: targetBranch
                            ? {
                                id: targetBranch.id,
                                name: targetBranch.name,
                              }
                            : undefined,
                        });

                        setSelectedCounselors([]);
                      }}
                    >
                      <SelectTrigger
                        id="edit-branch"
                        className="w-full bg-white h-11 border-slate-200 rounded-xl"
                      >
                        <SelectValue placeholder="Select Branch" />
                      </SelectTrigger>
                      <SelectContent>
                        {branches.map((branch) => (
                          <SelectItem key={branch.id} value={branch.id}>
                            {branch.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Assigned Counselor */}
                  <div className="grid gap-2 sm:col-span-2">
                    <Label className="text-sm font-medium">Assigned User</Label>

                    <div className="border rounded-xl p-3 space-y-2 max-h-48 overflow-y-auto">
                      {counselors.length > 0 ? (
                        counselors.map(
                          (counselor: {
                            id: string;
                            name: string;
                            role: { name: string };
                          }) => (
                            <label
                              key={counselor.id}
                              className="flex items-center gap-2 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={selectedCounselors.includes(
                                  counselor.id,
                                )}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedCounselors((prev) => [
                                      ...prev,
                                      counselor.id,
                                    ]);
                                  } else {
                                    setSelectedCounselors((prev) =>
                                      prev.filter((id) => id !== counselor.id),
                                    );
                                  }
                                }}
                              />

                              <span>{counselor?.name || "User"}</span>
                              <span className="text-xs text-muted-foreground bg-amber-100 rounded-2xl px-2 py-0.5">
                                {counselor?.role?.name || "Role name"}
                              </span>
                            </label>
                          ),
                        )
                      ) : (
                        <div className="py-4 text-center text-sm text-muted-foreground">
                          No counselors available for the selected branch
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Preferred Country */}
                  <div className="grid gap-1.5">
                    <Label
                      htmlFor="edit-country"
                      className="text-sm font-medium"
                    >
                      Preferred Country
                    </Label>
                    <Select
                      value={editingLead.preferredCountry || ""}
                      onValueChange={(val) =>
                        setEditingLead({
                          ...editingLead,
                          preferredCountry: val,
                        })
                      }
                    >
                      <SelectTrigger
                        id="edit-country"
                        className="w-full bg-white h-11 border-slate-200 rounded-xl"
                      >
                        <SelectValue placeholder="Select Country" />
                      </SelectTrigger>
                      <SelectContent>
                        {countryLoad ? (
                          <SelectItem value="loading" disabled>
                            Loading countries...
                          </SelectItem>
                        ) : (
                          (countries || [])?.map(
                            (
                              country: { id: string; name: string },
                              idx: number,
                            ) => (
                              <SelectItem
                                key={country.id || idx}
                                value={country.name}
                              >
                                {country.name}
                              </SelectItem>
                            ),
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Preferred Intake */}
                  <div className="grid gap-1.5">
                    <Label
                      htmlFor="edit-intake"
                      className="text-sm font-medium"
                    >
                      Preferred Intake
                    </Label>
                    <Select
                      value={editingLead.preferredIntake || ""}
                      onValueChange={(val) =>
                        setEditingLead({
                          ...editingLead,
                          preferredIntake: val,
                        })
                      }
                    >
                      <SelectTrigger
                        id="edit-intake"
                        className="w-full bg-white h-11 border-slate-200 rounded-xl"
                      >
                        <SelectValue placeholder="Select Intake" />
                      </SelectTrigger>
                      <SelectContent>
                        {intakeLoad ? (
                          <SelectItem value="loading" disabled>
                            loading intakes...
                          </SelectItem>
                        ) : (
                          (intakes || []).map(
                            (intake: { id: string; name: string }) => (
                              <SelectItem key={intake.id} value={intake.name}>
                                {intake.name}
                              </SelectItem>
                            ),
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-1.5 sm:col-span-2">
                    <Label className="text-sm font-medium">
                      Preferred University Tiers
                    </Label>

                    <div className="flex flex-wrap gap-2">
                      {["T1", "T2", "T3", "T4"].map((tier) => {
                        const selectedTier =
                          editingLead.preferredTiers?.includes(tier);

                        return (
                          <Button
                            key={tier}
                            type="button"
                            size="sm"
                            variant={selectedTier ? "default" : "outline"}
                            onClick={() =>
                              setEditingLead({
                                ...editingLead,
                                preferredTiers: selectedTier
                                  ? editingLead.preferredTiers?.filter(
                                      (t) => t !== tier,
                                    )
                                  : [
                                      ...(editingLead.preferredTiers || []),
                                      tier,
                                    ],
                              })
                            }
                          >
                            {tier}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                  {/* Lead Source */}
                  <div className="grid gap-1.5 sm:col-span-2">
                    <Label
                      htmlFor="edit-source"
                      className="text-sm font-medium"
                    >
                      Lead Source
                    </Label>
                    <Select
                      value={editingLead.source || ""}
                      onValueChange={(val) =>
                        setEditingLead({
                          ...editingLead,
                          source: val,
                        })
                      }
                    >
                      <SelectTrigger
                        id="edit-source"
                        className="w-full bg-white h-11 border-slate-200 rounded-xl"
                      >
                        <SelectValue placeholder="Select Lead Source" />
                      </SelectTrigger>
                      <SelectContent>
                        {lead_sourcesLoad ? (
                          <SelectItem value="loading" disabled>
                            loading lead source...
                          </SelectItem>
                        ) : (
                          (lead_sources || []).map(
                            (
                              lead_source: { id: string; name: string },
                              idx: number,
                            ) => (
                              <SelectItem
                                key={lead_source.id || idx}
                                value={lead_source.name}
                              >
                                {lead_source.name}
                              </SelectItem>
                            ),
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  {/* EDUCATIONAL INFORMATION */}

                  <div className="sm:col-span-2 border-t pt-4">
                    <h3 className="font-semibold text-base">
                      Educational Information
                    </h3>
                  </div>

                  <div className="grid gap-1.5">
                    <Label>10th Percentage</Label>
                    <Input
                      type="text"
                      inputMode="decimal"
                      placeholder="e.g. 85 or 75.44"
                      maxLength={5}
                      value={editingLead.tenthPercentage ?? ""}
                      onKeyDown={(e) => {
                        if (["-", "+", "e", "E"].includes(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      onInput={(e) => {
                        const input = e.currentTarget;

                        let value = input.value.replace(/[^0-9.]/g, "");

                        // Allow only one decimal point
                        const parts = value.split(".");
                        if (parts.length > 2) {
                          value = parts[0] + "." + parts.slice(1).join("");
                        }

                        // Max 2 digits before decimal & 2 after
                        if (value.includes(".")) {
                          const [intPart, decimalPart] = value.split(".");
                          value =
                            intPart.slice(0, 2) + "." + decimalPart.slice(0, 2);
                        } else {
                          value = value.slice(0, 2);
                        }

                        input.value = value;
                      }}
                      onChange={(e) => {
                        const value = e.target.value;

                        setEditingLead({
                          ...editingLead,
                          tenthPercentage:
                            value === "" ? undefined : Number(value),
                        });
                      }}
                    />
                  </div>

                  <div className="grid gap-1.5">
                    <Label>10th Year</Label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="YYYY"
                      maxLength={4}
                      value={editingLead.tenthYearOfPassing ?? ""}
                      onKeyDown={(e) => {
                        // Prevent minus, plus, decimal, exponent
                        if (["-", "+", ".", "e", "E"].includes(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      onInput={(e) => {
                        const input = e.currentTarget;
                        // Allow only digits and limit to 4 characters
                        input.value = input.value
                          .replace(/\D/g, "")
                          .slice(0, 4);
                      }}
                      onChange={(e) => {
                        const value = e.target.value;

                        setEditingLead({
                          ...editingLead,
                          tenthYearOfPassing:
                            value === "" ? undefined : Number(value),
                        });
                      }}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label>12th Percentage</Label>
                    <Input
                      type="text"
                      inputMode="decimal"
                      placeholder="e.g. 88 or 75.44"
                      maxLength={5}
                      value={editingLead.twelfthPercentage ?? ""}
                      onKeyDown={(e) => {
                        // Prevent minus, plus, exponent
                        if (["-", "+", "e", "E"].includes(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      onInput={(e) => {
                        const input = e.currentTarget;

                        let value = input.value.replace(/[^0-9.]/g, "");

                        // Allow only one decimal point
                        const parts = value.split(".");
                        if (parts.length > 2) {
                          value = parts[0] + "." + parts.slice(1).join("");
                        }

                        // Limit to 2 digits before decimal and 2 digits after decimal
                        if (value.includes(".")) {
                          const [intPart, decimalPart] = value.split(".");
                          value =
                            intPart.slice(0, 2) + "." + decimalPart.slice(0, 2);
                        } else {
                          value = value.slice(0, 2);
                        }

                        input.value = value;
                      }}
                      onChange={(e) => {
                        const value = e.target.value;

                        setEditingLead({
                          ...editingLead,
                          twelfthPercentage:
                            value === "" ? undefined : Number(value),
                        });
                      }}
                    />
                  </div>

                  <div className="grid gap-1.5">
                    <Label>12th Year</Label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="YYYY"
                      maxLength={4}
                      value={editingLead.twelfthYearOfPassing ?? ""}
                      onKeyDown={(e) => {
                        // Prevent minus, plus, decimal, exponent
                        if (["-", "+", ".", "e", "E"].includes(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      onInput={(e) => {
                        const input = e.currentTarget;

                        // Allow only digits and limit to 4 characters
                        input.value = input.value
                          .replace(/\D/g, "")
                          .slice(0, 4);
                      }}
                      onChange={(e) => {
                        const value = e.target.value;

                        setEditingLead({
                          ...editingLead,
                          twelfthYearOfPassing:
                            value === "" ? undefined : Number(value),
                        });
                      }}
                    />
                  </div>

                  <div className="grid gap-1.5 sm:col-span-2">
                    <Label>University / College</Label>

                    <Popover
                      open={universityOpen}
                      onOpenChange={setUniversityOpen}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          role="combobox"
                          className="w-full justify-between font-normal"
                        >
                          {editingLead.bachelorsUniversityName ||
                            "Select or Type University"}

                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>

                      <PopoverContent className="w-[450px] p-0">
                        <Command>
                          <CommandInput
                            placeholder="Search university..."
                            value={universitySearch}
                            onValueChange={setUniversitySearch}
                          />

                          <CommandList>
                            <CommandEmpty>
                              <Button
                                type="button"
                                variant="ghost"
                                className="w-full justify-start"
                                onClick={async () => {
                                  const value = universitySearch.trim();

                                  if (!value) return;

                                  try {
                                    await createUniversity(value);

                                    setEditingLead({
                                      ...editingLead,
                                      bachelorsUniversityName: value,
                                    });

                                    setUniversitySearch("");
                                    setUniversityOpen(false);

                                    toast.success(
                                      "University added successfully",
                                    );
                                  } catch {
                                    toast.error("Failed to create university");
                                  }
                                }}
                              >
                                <Plus className="mr-2 h-4 w-4" />
                                Add "{universitySearch}"
                              </Button>
                            </CommandEmpty>

                            <CommandGroup>
                              {universities.map(
                                (uni: { id: string; name: string }) => (
                                  <CommandItem
                                    key={uni.id}
                                    value={uni.name}
                                    onSelect={(currentValue) => {
                                      setEditingLead({
                                        ...editingLead,
                                        bachelorsUniversityName: currentValue,
                                      });

                                      setUniversityOpen(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        editingLead.bachelorsUniversityName ===
                                          uni.name
                                          ? "opacity-100"
                                          : "opacity-0",
                                      )}
                                    />

                                    {uni.name}
                                  </CommandItem>
                                ),
                              )}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="grid gap-1.5">
                    <Label>Bachelor Course</Label>

                    <Select
                      value={editingLead.bachelorsCourse || ""}
                      onValueChange={(value) =>
                        setEditingLead({
                          ...editingLead,
                          bachelorsCourse: value,
                        })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Course" />
                      </SelectTrigger>

                      <SelectContent>
                        {coursesLoad ? (
                          <SelectItem value="loading" disabled>
                            Loading courses...
                          </SelectItem>
                        ) : (
                          courses.map(
                            (
                              course: { id: string; name: string },
                              index: number,
                            ) => (
                              <SelectItem
                                key={course.id || index}
                                value={course.name}
                              >
                                {course.name}
                              </SelectItem>
                            ),
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-1.5">
                    <Label>Bachelor Percentage / CGPA</Label>
                    <Input
                      type="text"
                      inputMode="decimal"
                      placeholder="e.g. 75 or 8.5"
                      maxLength={6}
                      value={editingLead.bachelorsPercentage ?? ""}
                      onKeyDown={(e) => {
                        // Prevent minus, plus, exponent
                        if (["-", "+", "e", "E"].includes(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      onInput={(e) => {
                        const input = e.currentTarget;

                        let value = input.value.replace(/[^0-9.]/g, "");

                        // Allow only one decimal point
                        const parts = value.split(".");
                        if (parts.length > 2) {
                          value = parts[0] + "." + parts.slice(1).join("");
                        }

                        // Limit integer part to 3 digits and decimal part to 2 digits
                        if (value.includes(".")) {
                          const [intPart, decimalPart] = value.split(".");
                          value =
                            intPart.slice(0, 3) + "." + decimalPart.slice(0, 2);
                        } else {
                          value = value.slice(0, 3);
                        }

                        input.value = value;
                      }}
                      onChange={(e) => {
                        const value = e.target.value;
                        const num = Number(value);

                        if (
                          value === "" ||
                          (!isNaN(num) && num >= 0 && num <= 100)
                        ) {
                          setEditingLead({
                            ...editingLead,
                            bachelorsPercentage: value === "" ? undefined : num,
                          });
                        }
                      }}
                    />
                  </div>

                  <div className="grid gap-1.5">
                    <Label>Bachelor Passing Year</Label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="YYYY"
                      maxLength={4}
                      value={editingLead.bachelorsYearOfPassing ?? ""}
                      onKeyDown={(e) => {
                        // Prevent minus, plus, decimal, exponent
                        if (["-", "+", ".", "e", "E"].includes(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      onInput={(e) => {
                        const input = e.currentTarget;

                        // Allow only digits and limit to 4 characters
                        input.value = input.value
                          .replace(/\D/g, "")
                          .slice(0, 4);
                      }}
                      onChange={(e) => {
                        const value = e.target.value;

                        setEditingLead({
                          ...editingLead,
                          bachelorsYearOfPassing:
                            value === "" ? undefined : Number(value),
                        });
                      }}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Backlogs</Label>
                    <Input
                      type="number"
                      min={0}
                      value={editingLead.backlogs ?? ""}
                      onChange={(e) =>
                        setEditingLead({
                          ...editingLead,
                          backlogs: Number(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  {/* Graduation Status */}
                  <div className="grid gap-1.5">
                    <Label htmlFor="edit-graduation-status">
                      Graduation Status
                    </Label>

                    <Select
                      value={editingLead.graduationStatus ?? ""}
                      onValueChange={(value) =>
                        setEditingLead({
                          ...editingLead,
                          graduationStatus: value as "completed" | "pursuing",
                        })
                      }
                    >
                      <SelectTrigger
                        id="edit-graduation-status"
                        className="w-full"
                      >
                        <SelectValue placeholder="Select Graduation Status" />
                      </SelectTrigger>

                      <SelectContent>
                        <SelectItem value="completed">Completed</SelectItem>

                        <SelectItem value="pursuing">Pursuing</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-1.5 sm:col-span-2">
                    <Label>Education Gaps</Label>
                    <Input
                      placeholder="e.g. 1 year gap between 12th and Bachelors due to...."
                      value={editingLead.gapsIfAny || ""}
                      onChange={(e) =>
                        setEditingLead({
                          ...editingLead,
                          gapsIfAny: e.target.value,
                        })
                      }
                    />
                  </div>

                  {/* ENGLISH PROFICIENCY TESTS */}
                  <div className="sm:col-span-2 border-t pt-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="text-base font-semibold">
                          English Proficiency Tests
                        </h3>

                        <p className="mt-1 text-sm text-muted-foreground">
                          Add multiple tests and update individual scores
                        </p>
                      </div>

                      <Select
                        value=""
                        onValueChange={(value) =>
                          addEnglishTest(value as EnglishTestType)
                        }
                      >
                        <SelectTrigger className="w-full sm:w-[220px]">
                          <SelectValue placeholder="Add English Test" />
                        </SelectTrigger>

                        <SelectContent>
                          {englishTestOptions.map((testType) => {
                            const alreadyAdded = editingLead.englishTests?.some(
                              (test) => test.testType === testType,
                            );

                            return (
                              <SelectItem
                                key={testType}
                                value={testType}
                                disabled={alreadyAdded}
                              >
                                {testType}
                                {alreadyAdded ? " (Added)" : ""}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    {editingLead.englishTests?.length ? (
                      <div className="space-y-4">
                        {editingLead.englishTests.map((test, index) => {
                          const limits = englishTestScoreLimits[test.testType];

                          const scoreFields: {
                            field: EnglishScoreField;
                            label: string;
                            max: number;
                          }[] = [
                            {
                              field: "totalScore",
                              label: "Total Score",
                              max: limits.total,
                            },
                            {
                              field: "listeningScore",
                              label: "Listening",
                              max: limits.section,
                            },
                            {
                              field: "readingScore",
                              label: "Reading",
                              max: limits.section,
                            },
                            {
                              field: "writingScore",
                              label: "Writing",
                              max: limits.section,
                            },
                            {
                              field: "speakingScore",
                              label: "Speaking",
                              max: limits.section,
                            },
                          ];

                          return (
                            <div
                              key={test.id || `${test.testType}-${index}`}
                              className="overflow-hidden rounded-2xl border bg-background shadow-sm"
                            >
                              <div className="flex flex-col gap-3 border-b bg-muted/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-semibold">
                                      {test.testType}
                                    </p>

                                    <Badge variant="secondary">
                                      English Test
                                    </Badge>
                                  </div>

                                  <p className="mt-1 text-xs text-muted-foreground">
                                    Total max {limits.total} · Section max{" "}
                                    {limits.section}
                                    {limits.decimals === 0
                                      ? " · Whole numbers only"
                                      : ` · ${limits.decimals} decimal allowed`}
                                  </p>
                                </div>

                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => removeEnglishTest(index)}
                                  className="w-full sm:w-auto"
                                >
                                  Remove Test
                                </Button>
                              </div>

                              <div className="grid grid-cols-2 gap-4 p-4 lg:grid-cols-5">
                                {scoreFields.map((scoreField) => (
                                  <div
                                    key={scoreField.field}
                                    className={
                                      scoreField.field === "totalScore"
                                        ? "col-span-2 space-y-2 lg:col-span-1"
                                        : "space-y-2"
                                    }
                                  >
                                    <Label
                                      htmlFor={`edit-${test.testType}-${scoreField.field}-${index}`}
                                      className="text-xs font-medium"
                                    >
                                      {scoreField.label}
                                    </Label>

                                    <Input
                                      id={`edit-${test.testType}-${scoreField.field}-${index}`}
                                      type="text"
                                      inputMode={
                                        limits.decimals > 0
                                          ? "decimal"
                                          : "numeric"
                                      }
                                      placeholder={`Max ${scoreField.max}`}
                                      value={test[scoreField.field] ?? ""}
                                      onKeyDown={(event) => {
                                        if (
                                          ["-", "+", "e", "E"].includes(
                                            event.key,
                                          )
                                        ) {
                                          event.preventDefault();
                                        }

                                        if (
                                          limits.decimals === 0 &&
                                          event.key === "."
                                        ) {
                                          event.preventDefault();
                                        }
                                      }}
                                      onChange={(event) =>
                                        updateEnglishTestScore(
                                          index,
                                          scoreField.field,
                                          event.target.value,
                                        )
                                      }
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex min-h-36 items-center justify-center rounded-2xl border border-dashed bg-muted/10 p-6">
                        <div className="text-center">
                          <p className="text-sm font-medium">
                            No English tests added
                          </p>

                          <p className="mt-1 text-xs text-muted-foreground">
                            Select IELTS, TOEFL, DUOLINGO, or PTE above.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="sm:col-span-2 border-t pt-4">
                    <h3 className="font-semibold text-base">GRE / GMAT</h3>
                  </div>

                  <div className="grid gap-1.5">
                    <Label>Total Score</Label>
                    <Input
                      type="number"
                      maxLength={6}
                      min={0}
                      step="0.01"
                      value={editingLead.greGmatScore ?? ""}
                      onKeyDown={(e) => {
                        if (["-", "+", "e", "E"].includes(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      onInput={(e) => {
                        const input = e.currentTarget;

                        let value = input.value.replace(/[^0-9.]/g, "");

                        // Allow only one decimal point
                        const parts = value.split(".");
                        if (parts.length > 2) {
                          value = parts[0] + "." + parts.slice(1).join("");
                        }

                        // Allow up to 3 digits before decimal and 2 after
                        if (value.includes(".")) {
                          const [intPart, decimalPart] = value.split(".");
                          value =
                            intPart.slice(0, 3) + "." + decimalPart.slice(0, 2);
                        } else {
                          value = value.slice(0, 3);
                        }

                        input.value = value;
                      }}
                      onChange={(e) => {
                        const value = e.target.value;
                        setEditingLead({
                          ...editingLead,
                          greGmatScore:
                            value === "" ? undefined : Number(value),
                        });
                      }}
                    />
                  </div>

                  <div className="grid gap-1.5">
                    <Label>Quantitative</Label>
                    <Input
                      type="number"
                      maxLength={6}
                      min={0}
                      step="0.01"
                      value={editingLead.quantitativeScore ?? ""}
                      onKeyDown={(e) => {
                        if (["-", "+", "e", "E"].includes(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      onInput={(e) => {
                        const input = e.currentTarget;

                        let value = input.value.replace(/[^0-9.]/g, "");

                        // Allow only one decimal point
                        const parts = value.split(".");
                        if (parts.length > 2) {
                          value = parts[0] + "." + parts.slice(1).join("");
                        }

                        // Allow up to 3 digits before decimal and 2 after
                        if (value.includes(".")) {
                          const [intPart, decimalPart] = value.split(".");
                          value =
                            intPart.slice(0, 3) + "." + decimalPart.slice(0, 2);
                        } else {
                          value = value.slice(0, 3);
                        }

                        input.value = value;
                      }}
                      onChange={(e) => {
                        const value = e.target.value;
                        setEditingLead({
                          ...editingLead,
                          quantitativeScore:
                            value === "" ? undefined : Number(value),
                        });
                      }}
                    />
                  </div>

                  <div className="grid gap-1.5">
                    <Label>Verbal</Label>
                    <Input
                      type="number"
                      maxLength={6}
                      min={0}
                      step="0.01"
                      value={editingLead.verbalScore ?? ""}
                      onKeyDown={(e) => {
                        if (["-", "+", "e", "E"].includes(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      onInput={(e) => {
                        const input = e.currentTarget;

                        let value = input.value.replace(/[^0-9.]/g, "");

                        // Allow only one decimal point
                        const parts = value.split(".");
                        if (parts.length > 2) {
                          value = parts[0] + "." + parts.slice(1).join("");
                        }

                        // Allow up to 3 digits before decimal and 2 after
                        if (value.includes(".")) {
                          const [intPart, decimalPart] = value.split(".");
                          value =
                            intPart.slice(0, 3) + "." + decimalPart.slice(0, 2);
                        } else {
                          value = value.slice(0, 3);
                        }

                        input.value = value;
                      }}
                      onChange={(e) => {
                        const value = e.target.value;
                        setEditingLead({
                          ...editingLead,
                          verbalScore: value === "" ? undefined : Number(value),
                        });
                      }}
                    />
                  </div>

                  <div className="grid gap-1.5">
                    <Label>AWA</Label>
                    <Input
                      type="number"
                      maxLength={6}
                      min={0}
                      step="0.01"
                      value={editingLead.analyticalWritingScore ?? ""}
                      onKeyDown={(e) => {
                        if (["-", "+", "e", "E"].includes(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      onInput={(e) => {
                        const input = e.currentTarget;

                        let value = input.value.replace(/[^0-9.]/g, "");

                        // Allow only one decimal point
                        const parts = value.split(".");
                        if (parts.length > 2) {
                          value = parts[0] + "." + parts.slice(1).join("");
                        }

                        // Allow up to 3 digits before decimal and 2 after
                        if (value.includes(".")) {
                          const [intPart, decimalPart] = value.split(".");
                          value =
                            intPart.slice(0, 3) + "." + decimalPart.slice(0, 2);
                        } else {
                          value = value.slice(0, 3);
                        }

                        input.value = value;
                      }}
                      onChange={(e) => {
                        const value = e.target.value;
                        setEditingLead({
                          ...editingLead,
                          analyticalWritingScore:
                            value === "" ? undefined : Number(value),
                        });
                      }}
                    />
                  </div>
                  <div className="grid gap-1.5 sm:col-span-2">
                    <Label>Preferred Course</Label>
                    <Input
                      placeholder="Data Science.."
                      value={editingLead.preferredCourse || ""}
                      onChange={(e) =>
                        setEditingLead({
                          ...editingLead,
                          preferredCourse: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="grid gap-1.5 sm:col-span-2">
                    <Label>Work Experience</Label>
                    <Input
                      placeholder="e.g. 2 years at XYZ company as a ......."
                      value={editingLead.workExperience || ""}
                      onChange={(e) =>
                        setEditingLead({
                          ...editingLead,
                          workExperience: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="followup-date">Next Follow-up Date</Label>

                    <Input
                      id="followup-date"
                      type="date"
                      value={followupDate}
                      onChange={(event) => setFollowupDate(event.target.value)}
                    />
                  </div>

                  <div className="grid gap-1.5 sm:col-span-2">
                    <Label htmlFor="followup-note">Follow-up Note</Label>

                    <Input
                      id="followup-note"
                      placeholder="Enter follow-up note..."
                      value={followupNote}
                      onChange={(event) => setFollowupNote(event.target.value)}
                    />
                  </div>
                </div>
              </div>

              <SheetFooter className="mt-6 pt-4 border-t border-border flex flex-row items-center justify-end gap-2 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isUpdating}
                  onClick={() => setEditingLead(null)}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  disabled={isUpdating}
                  className="w-full sm:w-auto min-w-[150px]"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating Lead...
                    </>
                  ) : (
                    "Save Updates"
                  )}
                </Button>
              </SheetFooter>
            </form>
          )}
        </SheetContent>
      </Sheet>

      {/* 3. HARD CONFIRMATION DELETION ALERT_DIALOG */}
      <AlertDialog
        open={!!leadIdToDelete}
        onOpenChange={(value) => !value && setLeadIdToDelete(null)}
      >
        <AlertDialogContent className="max-w-[90vw] sm:max-w-md rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold">
              Are you absolutely certain?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground leading-normal">
              This action cannot be undone. This will permanently detach the
              selected client file from your CRM live table data index matrices.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-0 pt-2">
            <AlertDialogCancel className="mt-0 w-full sm:w-auto">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={executeDeleteLead}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full sm:w-auto"
            >
              Confirm Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
