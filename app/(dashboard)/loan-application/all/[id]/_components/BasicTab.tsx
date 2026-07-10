// app/(dashboard)/loan-application/all/[id]/_components/BasicTab.tsx

"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Building2,
  Calendar,
  FileText,
  Loader2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Save,
  User,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { useUpdateLoanApplication } from "@/hooks/loan-application/useLoanApplications";

import {
  updateLoanApplicationSchema,
  type UpdateLoanApplicationValues,
} from "@/schemas/loan-application/loan-application.schema";

import { formatDate } from "./config";
import { InfoCard, InfoGrid, TabHeader } from "./ProfileUI";
import type { LoanApplication } from "./types";

interface BasicTabProps {
  applicant: LoanApplication;
}

interface BranchOption {
  id: string;
  name: string;
  code?: string | null;
  status?: boolean;
}

interface RoleOption {
  id?: string;
  name?: string;
}

interface UserOption {
  id: string;
  name: string;
  email?: string;
  role?: RoleOption | string | null;
  roleName?: string | null;
}

interface LeadSourceOption {
  id: string;
  name: string;
  status?: boolean;
}

interface MasterDataState {
  branches: BranchOption[];
  leadSources: LeadSourceOption[];
}

const EMPTY_SELECT_VALUE = "__none__";

export function BasicTab({ applicant }: BasicTabProps) {
  const [editOpen, setEditOpen] = useState(false);

  return (
    <>
      <div className="space-y-6">
        <TabHeader
          eyebrow="Applicant Profile"
          title="Basic Information"
          action={
            <Button
              type="button"
              size="sm"
              onClick={() => setEditOpen(true)}
              className="gap-2"
            >
              <Pencil className="h-4 w-4" />
              Edit Applicant
            </Button>
          }
        />

        <InfoGrid>
          <InfoCard icon={User} label="Full Name" value={applicant.fullName} />

          <InfoCard
            icon={Phone}
            label="Mobile Number"
            value={applicant.mobile}
          />

          <InfoCard
            icon={Phone}
            label="Alternate Mobile"
            value={applicant.altMobile}
          />

          <InfoCard icon={Mail} label="Email" value={applicant.email} />

          <InfoCard
            icon={Calendar}
            label="Date of Birth"
            value={formatDate(applicant.dob)}
          />

          <InfoCard icon={Users} label="Gender" value={applicant.gender} />

          <InfoCard
            icon={Users}
            label="Marital Status"
            value={applicant.maritalStatus}
          />

          <InfoCard icon={FileText} label="Aadhaar" value={applicant.aadhaar} />

          <InfoCard icon={FileText} label="PAN" value={applicant.pan} />

          <InfoCard
            icon={FileText}
            label="Passport"
            value={applicant.passport}
          />

          <InfoCard
            icon={Calendar}
            label="Passport Expiry"
            value={formatDate(applicant.passportExpireDate)}
          />

          <InfoCard
            icon={Calendar}
            label="Application Date"
            value={formatDate(applicant.enquiryDate)}
          />

          <InfoCard icon={MapPin} label="City" value={applicant.city} />

          <InfoCard icon={MapPin} label="State" value={applicant.state} />

          <InfoCard icon={MapPin} label="PIN Code" value={applicant.pin} />

          <InfoCard
            icon={Building2}
            label="Branch"
            value={getBranchName(applicant)}
          />

          <InfoCard
            icon={User}
            label="Fintech Assignee"
            value={getFintechAssigneeName(applicant)}
          />

          <InfoCard
            icon={FileText}
            label="Lead Source"
            value={applicant.leadSource}
          />

          <InfoCard
            icon={FileText}
            label="Priority"
            value={applicant.priority}
          />

          <InfoCard
            icon={Calendar}
            label="Next Follow-Up"
            value={formatDate(applicant.nextFollowUp)}
          />
        </InfoGrid>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <AddressCard
            title="Current Address"
            value={applicant.currentAddress}
          />

          <AddressCard
            title="Permanent Address"
            value={applicant.permanentAddress}
          />
        </div>

        <AddressCard title="Remarks" value={applicant.remarks} />
      </div>

      <EditBasicInformationDialog
        applicant={applicant}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </>
  );
}

interface EditBasicInformationDialogProps {
  applicant: LoanApplication;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function EditBasicInformationDialog({
  applicant,
  open,
  onOpenChange,
}: EditBasicInformationDialogProps) {
  const update = useUpdateLoanApplication(applicant.id);

  const [masterData, setMasterData] = useState<MasterDataState>({
    branches: [],
    leadSources: [],
  });

  const [fintechUsers, setFintechUsers] = useState<UserOption[]>([]);
  const [isLoadingFintechUsers, setIsLoadingFintechUsers] = useState(false);
  const [fintechUsersError, setFintechUsersError] = useState<string | null>(
    null,
  );

  const [isLoadingMasterData, setIsLoadingMasterData] = useState(false);

  const [masterDataError, setMasterDataError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<UpdateLoanApplicationValues>({
    resolver: zodResolver(updateLoanApplicationSchema),
    defaultValues: getDefaultValues(applicant),
  });

  const gender = watch("gender");
  const maritalStatus = watch("maritalStatus");
  const branchId = watch("branchId");
  const counselorId = watch("counselorId");
  const fintechAssigneeId = watch("fintechAssigneeId");
  const leadSource = watch("leadSource");
  const priority = watch("priority");

  useEffect(() => {
    if (!open) {
      return;
    }

    reset(getDefaultValues(applicant));

    void loadMasterData();
  }, [open, applicant, reset]);
  useEffect(() => {
    if (!open) {
      return;
    }

    if (!branchId || branchId === EMPTY_SELECT_VALUE) {
      setFintechUsers([]);
      return;
    }

    void loadFintechUsers(branchId);
  }, [open, branchId]);
  async function loadMasterData() {
    try {
      setIsLoadingMasterData(true);
      setMasterDataError(null);

      const [branchesResponse, leadSourcesResponse] = await Promise.all([
        fetch("/api/branches", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }),

        fetch("/api/lead-sources", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }),
      ]);

      if (!branchesResponse.ok) {
        throw new Error("Failed to load branches");
      }

      if (!leadSourcesResponse.ok) {
        throw new Error("Failed to load lead sources");
      }

      const branchesJson: unknown = await branchesResponse.json();
      const leadSourcesJson: unknown = await leadSourcesResponse.json();

      setMasterData({
        branches: extractArray<BranchOption>(branchesJson),
        leadSources: extractArray<LeadSourceOption>(leadSourcesJson),
      });
    } catch (error) {
      console.error("LOAD BASIC TAB MASTER DATA ERROR:", error);

      setMasterDataError(
        error instanceof Error ? error.message : "Failed to load dropdown data",
      );
    } finally {
      setIsLoadingMasterData(false);
    }
  }
  async function loadFintechUsers(selectedBranchId: string) {
    if (!selectedBranchId) {
      setFintechUsers([]);
      return;
    }

    try {
      setIsLoadingFintechUsers(true);
      setFintechUsersError(null);

      const params = new URLSearchParams({
        branchId: selectedBranchId,
        role: "fintech",
      });

      const response = await fetch(`/api/users?${params.toString()}`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to load fintech users");
      }

      const json: unknown = await response.json();

      setFintechUsers(extractArray<UserOption>(json));
    } catch (error) {
      console.error("LOAD FINTECH USERS ERROR:", error);

      setFintechUsers([]);

      setFintechUsersError(
        error instanceof Error ? error.message : "Failed to load fintech users",
      );
    } finally {
      setIsLoadingFintechUsers(false);
    }
  }
  const handleDialogChange = (nextOpen: boolean) => {
    if (update.isPending) {
      return;
    }

    if (!nextOpen) {
      reset(getDefaultValues(applicant));
      setMasterDataError(null);
    }

    onOpenChange(nextOpen);
  };

  const onSubmit = async (values: UpdateLoanApplicationValues) => {
    const payload: UpdateLoanApplicationValues = {
      ...values,

      counselorId: normalizeOptionalSelect(values.counselorId),

      fintechAssigneeId: normalizeOptionalSelect(values.fintechAssigneeId),

      leadSource: normalizeOptionalSelect(values.leadSource),
    };

    await update.mutateAsync(payload);

    reset(payload);

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="flex max-h-[94vh] w-[calc(100%-1rem)] max-w-5xl flex-col overflow-hidden p-0 sm:w-full">
        <DialogHeader className="shrink-0 border-b bg-slate-50 px-5 py-5 dark:border-slate-800 dark:bg-slate-950 sm:px-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-600/10">
              <User className="h-5 w-5 text-red-600" />
            </div>

            <div className="min-w-0">
              <DialogTitle className="text-lg font-black">
                Edit Basic Information
              </DialogTitle>

              <DialogDescription className="mt-1">
                Update applicant personal, contact, address, assignment and
                enquiry information.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="flex-1 space-y-8 overflow-y-auto px-5 py-6 sm:px-6">
            {masterDataError && (
              <div className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-red-900/50 dark:bg-red-950/20">
                <p className="text-sm font-semibold text-red-600">
                  {masterDataError}
                </p>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => void loadMasterData()}
                >
                  Retry
                </Button>
              </div>
            )}

            <FormSection
              title="Personal Information"
              description="Applicant identity and personal details."
              icon={User}
            >
              <FormField
                label="Full Name"
                error={errors.fullName?.message}
                required
              >
                <Input
                  {...register("fullName")}
                  placeholder="Enter full name"
                  disabled={update.isPending}
                />
              </FormField>

              <FormField label="Date of Birth" error={errors.dob?.message}>
                <Input
                  type="date"
                  {...register("dob")}
                  disabled={update.isPending}
                />
              </FormField>

              <FormField label="Gender" error={errors.gender?.message}>
                <Select
                  value={toSelectValue(gender)}
                  onValueChange={(value) =>
                    setValue("gender", value, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                  disabled={update.isPending}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>

                    <SelectItem value="Female">Female</SelectItem>

                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>

              <FormField
                label="Marital Status"
                error={errors.maritalStatus?.message}
              >
                <Select
                  value={toSelectValue(maritalStatus)}
                  onValueChange={(value) =>
                    setValue("maritalStatus", value, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                  disabled={update.isPending}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select marital status" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="Single">Single</SelectItem>

                    <SelectItem value="Married">Married</SelectItem>

                    <SelectItem value="Divorced">Divorced</SelectItem>

                    <SelectItem value="Widowed">Widowed</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
            </FormSection>

            <FormSection
              title="Contact Information"
              description="Applicant phone and email information."
              icon={Phone}
            >
              <FormField
                label="Mobile Number"
                error={errors.mobile?.message}
                required
              >
                <Input
                  {...register("mobile")}
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="Enter 10-digit mobile number"
                  disabled={update.isPending}
                />
              </FormField>

              <FormField
                label="Alternate Mobile"
                error={errors.altMobile?.message}
              >
                <Input
                  {...register("altMobile")}
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="Enter alternate mobile"
                  disabled={update.isPending}
                />
              </FormField>

              <div className="md:col-span-2">
                <FormField
                  label="Email Address"
                  error={errors.email?.message}
                  required
                >
                  <Input
                    type="email"
                    {...register("email")}
                    placeholder="Enter email address"
                    disabled={update.isPending}
                  />
                </FormField>
              </div>
            </FormSection>

            <FormSection
              title="Identity Information"
              description="Government and travel identification details."
              icon={FileText}
            >
              <FormField label="Aadhaar Number" error={errors.aadhaar?.message}>
                <Input
                  {...register("aadhaar")}
                  inputMode="numeric"
                  maxLength={12}
                  placeholder="Enter 12-digit Aadhaar"
                  disabled={update.isPending}
                />
              </FormField>

              <FormField label="PAN Number" error={errors.pan?.message}>
                <Input
                  {...register("pan")}
                  maxLength={10}
                  placeholder="ABCDE1234F"
                  className="uppercase"
                  disabled={update.isPending}
                />
              </FormField>

              <FormField
                label="Passport Number"
                error={errors.passport?.message}
              >
                <Input
                  {...register("passport")}
                  placeholder="Enter passport number"
                  disabled={update.isPending}
                />
              </FormField>

              <FormField
                label="Passport Expiry Date"
                error={errors.passportExpireDate?.message}
              >
                <Input
                  type="date"
                  {...register("passportExpireDate")}
                  disabled={update.isPending}
                />
              </FormField>
            </FormSection>

            <FormSection
              title="Address Information"
              description="Current and permanent residential details."
              icon={MapPin}
            >
              <div className="md:col-span-2">
                <FormField
                  label="Current Address"
                  error={errors.currentAddress?.message}
                >
                  <Textarea
                    {...register("currentAddress")}
                    placeholder="Enter current residential address"
                    className="min-h-24 resize-none"
                    disabled={update.isPending}
                  />
                </FormField>
              </div>

              <div className="md:col-span-2">
                <FormField
                  label="Permanent Address"
                  error={errors.permanentAddress?.message}
                >
                  <Textarea
                    {...register("permanentAddress")}
                    placeholder="Enter permanent residential address"
                    className="min-h-24 resize-none"
                    disabled={update.isPending}
                  />
                </FormField>
              </div>

              <FormField label="City" error={errors.city?.message}>
                <Input
                  {...register("city")}
                  placeholder="Enter city"
                  disabled={update.isPending}
                />
              </FormField>

              <FormField label="State" error={errors.state?.message}>
                <Input
                  {...register("state")}
                  placeholder="Enter state"
                  disabled={update.isPending}
                />
              </FormField>

              <FormField label="PIN Code" error={errors.pin?.message}>
                <Input
                  {...register("pin")}
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="Enter 6-digit PIN code"
                  disabled={update.isPending}
                />
              </FormField>
            </FormSection>

            <FormSection
              title="Enquiry & Assignment Information"
              description="Application source, branch, assignments and priority."
              icon={Calendar}
            >
              <FormField
                label="Application Date"
                error={errors.enquiryDate?.message}
              >
                <Input
                  type="date"
                  {...register("enquiryDate")}
                  disabled={update.isPending}
                />
              </FormField>

              <FormField label="Lead Source" error={errors.leadSource?.message}>
                <Select
                  value={toSelectValue(leadSource)}
                  onValueChange={(value) =>
                    setValue("leadSource", normalizeOptionalSelect(value), {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                  disabled={update.isPending || isLoadingMasterData}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        isLoadingMasterData
                          ? "Loading lead sources..."
                          : "Select lead source"
                      }
                    />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value={EMPTY_SELECT_VALUE}>
                      No lead source
                    </SelectItem>

                    {masterData.leadSources
                      .filter((source) => source.status !== false)
                      .map((source) => (
                        <SelectItem key={source.id} value={source.name}>
                          {source.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField
                label="Branch"
                error={errors.branchId?.message}
                required
              >
                <Select
                  value={toSelectValue(branchId)}
                  onValueChange={(value) => {
                    setValue("branchId", value, {
                      shouldDirty: true,
                      shouldValidate: true,
                    });

                    setValue("fintechAssigneeId", undefined, {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                  }}
                  disabled={update.isPending || isLoadingMasterData}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        isLoadingMasterData
                          ? "Loading branches..."
                          : "Select branch"
                      }
                    />
                  </SelectTrigger>

                  <SelectContent>
                    {masterData.branches
                      .filter((branch) => branch.status !== false)
                      .map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name}
                          {branch.code ? ` (${branch.code})` : ""}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField
                label="Fintech Assignee"
                error={errors.fintechAssigneeId?.message}
              >
                <Select
                  value={toSelectValue(fintechAssigneeId)}
                  onValueChange={(value) => {
                    setValue(
                      "fintechAssigneeId",
                      normalizeOptionalSelect(value),
                      {
                        shouldDirty: true,
                        shouldValidate: true,
                      },
                    );
                  }}
                  disabled={
                    update.isPending ||
                    isLoadingFintechUsers ||
                    !branchId ||
                    branchId === EMPTY_SELECT_VALUE
                  }
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        !branchId || branchId === EMPTY_SELECT_VALUE
                          ? "Select branch first"
                          : isLoadingFintechUsers
                            ? "Loading fintech users..."
                            : "Select fintech assignee"
                      }
                    />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value={EMPTY_SELECT_VALUE}>
                      Unassigned
                    </SelectItem>

                    {fintechUsers.length > 0 ? (
                      fintechUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="__no_fintech_users__" disabled>
                        No fintech users found
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>

                {fintechUsersError && (
                  <p className="text-xs font-semibold text-red-600">
                    {fintechUsersError}
                  </p>
                )}
              </FormField>

              <FormField label="Priority" error={errors.priority?.message}>
                <Select
                  value={toSelectValue(priority)}
                  onValueChange={(value) =>
                    setValue("priority", normalizeOptionalSelect(value), {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                  disabled={update.isPending}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value={EMPTY_SELECT_VALUE}>
                      No priority
                    </SelectItem>

                    <SelectItem value="Low">Low</SelectItem>

                    <SelectItem value="Medium">Medium</SelectItem>

                    <SelectItem value="High">High</SelectItem>

                    <SelectItem value="Urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>

              <FormField
                label="Next Follow-Up"
                error={errors.nextFollowUp?.message}
              >
                <Input
                  type="date"
                  {...register("nextFollowUp")}
                  disabled={update.isPending}
                />
              </FormField>

              <div className="md:col-span-2">
                <FormField label="Remarks" error={errors.remarks?.message}>
                  <Textarea
                    {...register("remarks")}
                    placeholder="Enter applicant remarks"
                    className="min-h-28 resize-none"
                    disabled={update.isPending}
                  />
                </FormField>
              </div>
            </FormSection>
          </div>

          <DialogFooter className="shrink-0 border-t bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-950 sm:px-6">
            <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleDialogChange(false)}
                disabled={update.isPending}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={update.isPending || !isDirty || isLoadingMasterData}
                className="w-full gap-2 sm:w-auto"
              >
                {update.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Applicant
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface FormSectionProps {
  title: string;
  description: string;
  icon: React.ElementType;
  children: React.ReactNode;
}

function FormSection({
  title,
  description,
  icon: Icon,
  children,
}: FormSectionProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-start gap-3 border-b border-slate-100 bg-slate-50/70 px-4 py-4 dark:border-slate-800 dark:bg-slate-900/60 sm:px-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-600/10">
          <Icon className="h-4 w-4 text-red-600" />
        </div>

        <div>
          <h3 className="text-sm font-black text-slate-900 dark:text-white">
            {title}
          </h3>

          <p className="mt-0.5 text-xs text-slate-500">{description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 p-4 sm:p-5 md:grid-cols-2">
        {children}
      </div>
    </section>
  );
}

interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}

function FormField({
  label,
  error,
  required = false,
  children,
}: FormFieldProps) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
        {label}

        {required && <span className="ml-1 text-red-600">*</span>}
      </Label>

      {children}

      {error && <p className="text-xs font-semibold text-red-600">{error}</p>}
    </div>
  );
}

function AddressCard({
  title,
  value,
}: {
  title: string;
  value?: string | null;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
        {title}
      </p>

      <p className="mt-2 whitespace-pre-wrap text-sm font-semibold text-slate-700 dark:text-slate-200">
        {value || "Not provided"}
      </p>
    </div>
  );
}

function getDefaultValues(
  applicant: LoanApplication,
): UpdateLoanApplicationValues {
  return {
    fullName: applicant.fullName ?? "",
    mobile: applicant.mobile ?? "",
    altMobile: applicant.altMobile ?? "",
    email: applicant.email ?? "",

    dob: toDateInputValue(applicant.dob),

    gender: applicant.gender ?? "",
    maritalStatus: applicant.maritalStatus ?? "",

    aadhaar: applicant.aadhaar ?? "",
    pan: applicant.pan ?? "",
    passport: applicant.passport ?? "",

    passportExpireDate: toDateInputValue(applicant.passportExpireDate),

    currentAddress: applicant.currentAddress ?? "",
    permanentAddress: applicant.permanentAddress ?? "",

    city: applicant.city ?? "",
    state: applicant.state ?? "",
    pin: applicant.pin ?? "",

    enquiryDate: toDateInputValue(applicant.enquiryDate),

    leadSource: applicant.leadSource ?? "",

    branchId: applicant.branchId ?? "",

    counselorId: applicant.counselor?.id ?? "",

    fintechAssigneeId: applicant.fintechAssigneeId ?? "",

    priority: applicant.priority ?? "",

    nextFollowUp: toDateInputValue(applicant.nextFollowUp),

    remarks: applicant.remarks ?? "",
  };
}

function toDateInputValue(value?: string | Date | null): string {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value.slice(0, 10);
  }

  return value.toISOString().slice(0, 10);
}

function toSelectValue(value: unknown): string {
  if (typeof value !== "string" || !value) {
    return EMPTY_SELECT_VALUE;
  }

  return value;
}

function normalizeOptionalSelect(value: unknown): string | undefined {
  if (typeof value !== "string" || !value || value === EMPTY_SELECT_VALUE) {
    return undefined;
  }

  return value;
}

function extractArray<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) {
    return payload as T[];
  }

  if (payload && typeof payload === "object" && "data" in payload) {
    const data = (
      payload as {
        data?: unknown;
      }
    ).data;

    if (Array.isArray(data)) {
      return data as T[];
    }

    if (data && typeof data === "object" && "data" in data) {
      const nestedData = (
        data as {
          data?: unknown;
        }
      ).data;

      if (Array.isArray(nestedData)) {
        return nestedData as T[];
      }
    }
  }

  return [];
}

function getBranchName(applicant: LoanApplication): string | null {
  if (applicant.branchName) {
    return applicant.branchName;
  }

  if (
    applicant.branch &&
    typeof applicant.branch === "object" &&
    "name" in applicant.branch
  ) {
    return String(applicant.branch.name);
  }

  if (typeof applicant.branch === "string") {
    return applicant.branch;
  }

  return null;
}

function getFintechAssigneeName(applicant: LoanApplication): string | null {
  if (applicant.fintechAssigneeName) {
    return applicant.fintechAssigneeName;
  }

  if (
    applicant.fintechAssignee &&
    typeof applicant.fintechAssignee === "object" &&
    "name" in applicant.fintechAssignee
  ) {
    return String(applicant.fintechAssignee.name);
  }

  if (typeof applicant.fintechAssignee === "string") {
    return applicant.fintechAssignee;
  }

  return null;
}
