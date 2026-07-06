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
const englishTestOptions = ["IELTS", "TOEFL", "DUOLINGO", "PTE"];
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
    return (
      <div>
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="text-sm font-medium break-words">{value || "—"}</p>
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
  return (
    <>
      {/* 1. DETAILED RECORD VIEW SHEET */}
      <Sheet
        open={!!selected}
        onOpenChange={(value) => !value && setSelected(null)}
      >
        <SheetContent className="w-full sm:max-w-4xl overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {selected && (
            <>
              <SheetHeader className="border-b pb-4">
                <SheetTitle className="text-2xl font-bold">
                  {selected?.studentName}
                </SheetTitle>
                <SheetDescription>
                  Serial Number: {selected?.leadNumber}
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-6 py-6">
                {/* BASIC INFORMATION */}
                <div className="rounded-xl border bg-card">
                  <div className="border-b px-5 py-3">
                    <h3 className="font-semibold text-lg">Basic Information</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2 lg:grid-cols-3">
                    <DetailItem
                      label="Student Name"
                      value={selected?.studentName}
                    />
                    <DetailItem
                      label="Father Name"
                      value={selected?.fatherName}
                    />
                    <DetailItem
                      label="Mobile Number"
                      value={selected?.mobileNumber}
                    />
                    <DetailItem
                      label="Email Address"
                      value={selected?.emailId}
                    />
                    <DetailItem label="Place" value={selected?.place} />
                    <DetailItem
                      label="Passport Number"
                      value={selected?.passport}
                    />
                    <DetailItem label="Lead Source" value={selected?.source} />
                    <DetailItem label="Branch" value={selected?.branch?.name} />
                    <DetailItem
                      label="Graduation Status"
                      value={selected?.graduationStatus}
                    />
                    <div>
                      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Assigned Counselors
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {selected?.counselors?.length ? (
                          selected?.counselors.map((coun, idx) => (
                            <Badge key={coun.counselor?.id || idx}>
                              {coun?.counselor?.name}
                              {coun.isPrimary && " (Primary)"}
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
                </div>

                {/* EDUCATIONAL INFORMATION */}
                <div className="rounded-xl border bg-card">
                  <div className="border-b px-5 py-3">
                    <h3 className="font-semibold text-lg">
                      Educational Information
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2 lg:grid-cols-3">
                    <DetailItem
                      label="10th Percentage"
                      value={selected.tenthPercentage}
                    />
                    <DetailItem
                      label="10th Passing Year"
                      value={selected.tenthYearOfPassing}
                    />
                    <DetailItem
                      label="12th Percentage"
                      value={selected.twelfthPercentage}
                    />
                    <DetailItem
                      label="12th Passing Year"
                      value={selected.twelfthYearOfPassing}
                    />
                    <DetailItem
                      label="University"
                      value={selected.bachelorsUniversityName}
                    />
                    <DetailItem
                      label="Course"
                      value={selected.bachelorsCourse}
                    />
                    <DetailItem
                      label="Bachelor Percentage"
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
                </div>

                {/* EPT Details */}
                <div className="rounded-xl border bg-card">
                  <div className="border-b px-5 py-3">
                    <h3 className="font-semibold text-lg">EPT Details</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2 lg:grid-cols-3">
                    <DetailItem
                      label="English Test"
                      value={selected.englishTestType}
                    />
                    <DetailItem
                      label="Listening"
                      value={selected.listeningScore}
                    />
                    <DetailItem label="Reading" value={selected.readingScore} />
                    <DetailItem label="Writing" value={selected.writingScore} />
                    <DetailItem
                      label="Speaking"
                      value={selected.speakingScore}
                    />
                    <DetailItem
                      label="GRE / GMAT"
                      value={selected.greGmatScore}
                    />
                    <DetailItem
                      label="Quantitative"
                      value={selected.quantitativeScore}
                    />
                    <DetailItem label="Verbal" value={selected.verbalScore} />
                    <DetailItem
                      label="AWA"
                      value={selected.analyticalWritingScore}
                    />
                  </div>
                </div>

                {/* STUDY PREFERENCES */}
                <div className="rounded-xl border bg-card">
                  <div className="border-b px-5 py-3">
                    <h3 className="font-semibold text-lg">
                      Study Preferences & Experience
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2 lg:grid-cols-3">
                    <DetailItem
                      label="Preferred Country"
                      value={selected.preferredCountry}
                    />
                    <DetailItem
                      label="Preferred Intake"
                      value={selected.preferredIntake}
                    />
                    <div>
                      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Preferred Tiers
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
                            Not Selected
                          </span>
                        )}
                      </div>
                    </div>
                    <DetailItem
                      label="Preferred Course"
                      value={selected.preferredCourse}
                    />
                  </div>
                  <div className="border-t p-5">
                    <DetailBlock
                      label="Work Experience"
                      value={selected.workExperience}
                    />
                  </div>
                </div>

                {/* CRM INFORMATION */}
                <div className="rounded-xl border bg-card">
                  <div className="border-b px-5 py-3">
                    <h3 className="text-lg font-semibold">CRM Information</h3>
                  </div>

                  <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2 lg:grid-cols-3">
                    <DetailItem label="Status" value={selected.status} />

                    <DetailItem
                      label="Created Date"
                      value={formatDate(selected.createdAt)}
                    />

                    <DetailItem
                      label="Next Followup"
                      value={formatDate(selected.nextFollowup)}
                    />
                  </div>

                  <div className="border-t p-5">
                    <DetailBlock label="Remarks" value={selected.remarks} />
                  </div>

                  <div className="border-t p-5">
                    <h4 className="mb-4 text-sm font-semibold">
                      Follow-up History
                    </h4>

                    {selected.timelines?.length ? (
                      <div className="space-y-3">
                        {selected.timelines.map((timeline) => (
                          <div
                            key={timeline.id}
                            className="rounded-xl border bg-muted/20 p-4"
                          >
                            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                              <p className="font-medium">
                                {timeline.nextFollowup
                                  ? formatDate(timeline.nextFollowup)
                                  : "No follow-up date"}
                              </p>

                              <span className="text-xs text-muted-foreground">
                                Added {formatDate(timeline.createdAt)}
                              </span>
                            </div>

                            <p className="mt-2 text-sm text-muted-foreground">
                              {timeline.description}
                            </p>

                            {timeline.createdBy?.name && (
                              <p className="mt-2 text-xs text-muted-foreground">
                                Added by {timeline.createdBy.name}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No follow-up history available.
                      </p>
                    )}
                  </div>
                </div>
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

                  <div className="sm:col-span-2 border-t pt-4">
                    <h3 className="font-semibold text-base">EPT Details</h3>
                  </div>

                  <div className="grid gap-1.5">
                    <Label>English Test Type</Label>

                    <Select
                      value={editingLead.englishTestType || ""}
                      onValueChange={(value) =>
                        setEditingLead({
                          ...editingLead,
                          englishTestType: value,
                        })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Test" />
                      </SelectTrigger>

                      <SelectContent>
                        {englishTestOptions.map((test) => (
                          <SelectItem key={test} value={test}>
                            {test}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-1.5">
                    <Label>Listening</Label>
                    <Input
                      type="text"
                      inputMode="decimal"
                      placeholder="L Score"
                      maxLength={6}
                      value={editingLead.listeningScore ?? ""}
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
                          listeningScore:
                            value === "" ? undefined : Number(value),
                        });
                      }}
                    />
                  </div>

                  <div className="grid gap-1.5">
                    <Label>Reading</Label>
                    <Input
                      type="number"
                      maxLength={6}
                      min={0}
                      step="0.01"
                      value={editingLead.readingScore ?? ""}
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
                          readingScore:
                            value === "" ? undefined : Number(value),
                        });
                      }}
                    />
                  </div>

                  <div className="grid gap-1.5">
                    <Label>Writing</Label>
                    <Input
                      type="number"
                      maxLength={6}
                      min={0}
                      step="0.01"
                      value={editingLead.writingScore ?? ""}
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
                          writingScore:
                            value === "" ? undefined : Number(value),
                        });
                      }}
                    />
                  </div>

                  <div className="grid gap-1.5">
                    <Label>Speaking</Label>
                    <Input
                      type="number"
                      maxLength={6}
                      min={0}
                      step="0.01"
                      value={editingLead.speakingScore ?? ""}
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
                          speakingScore:
                            value === "" ? undefined : Number(value),
                        });
                      }}
                    />
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
