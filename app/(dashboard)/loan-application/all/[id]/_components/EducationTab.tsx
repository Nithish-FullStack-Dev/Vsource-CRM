// app/(dashboard)/loan-application/all/[id]/_components/EducationTab.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import {
  BookOpen,
  Building2,
  Calendar,
  Check,
  ChevronsUpDown,
  GraduationCap,
  Loader2,
  Pencil,
  Plus,
  Save,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { cn } from "@/lib/utils";
import { getCountries, getIntakes } from "@/lib/master-settings";
import { useUpdateLoanApplication } from "@/hooks/loan-application/useLoanApplications";
import {
  updateLoanApplicationSchema,
  type UpdateLoanApplicationValues,
} from "@/schemas/loan-application/loan-application.schema";

import { InfoCard, InfoGrid, TabHeader } from "./ProfileUI";
import type { LoanApplication } from "./types";

/* -------------------------------------------------------------------------- */
/*                                    TYPES                                   */
/* -------------------------------------------------------------------------- */

interface EducationTabProps {
  applicant: LoanApplication;
}

interface EditEducationDialogProps {
  applicant: LoanApplication;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface MasterItem {
  id: string;
  name: string;
}

interface CountryItem {
  id: string;
  name: string;
}

interface IntakeItem {
  id: string;
  name: string;
}

interface InstitutionOption {
  id: string;
  name: string;
}

interface AbroadUniversity {
  id: string;
  name: string;
  countryId: string;
  city: string | null;
  state: string | null;
  country?: {
    id: string;
    name: string;
    code: string;
  };
}

interface UniversityCourse {
  id: string;
  name: string;
  degree?: string | null;
  duration?: string | null;
  status?: boolean;
  intake?: {
    id: string;
    name: string;
  } | null;
}

interface Option {
  value: string;
  label: string;
}

/* -------------------------------------------------------------------------- */
/*                                  CONSTANTS                                 */
/* -------------------------------------------------------------------------- */

const GRADUATION_STATUS_OPTIONS = [
  "Pursuing",
  "Completed",
  "Discontinued",
] as const;

const STUDY_DESTINATION_OPTIONS = ["Abroad", "Domestic"] as const;

const COURSE_LEVEL_OPTIONS = [
  "Undergraduate",
  "Postgraduate",
  "PhD",
  "Diploma",
  "MBBS",
] as const;

const ADMISSION_STATUS_OPTIONS = ["On Hold", "Applied", "Drop"] as const;

const OFFER_LETTER_OPTIONS = [
  "Pending",
  "Priority UCOL",
  "Priority COL",
  "COL",
  "UCOL",
] as const;

/* -------------------------------------------------------------------------- */
/*                                  HELPERS                                   */
/* -------------------------------------------------------------------------- */

const toOptions = (
  items: readonly string[] | Array<{ id: string; name: string }>,
): Option[] =>
  items.map((item) =>
    typeof item === "string"
      ? {
          value: item,
          label: item,
        }
      : {
          value: item.name,
          label: item.name,
        },
  );

function normalizeOptionalString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();

  return trimmed || undefined;
}

function getArrayData<T>(response: unknown): T[] {
  if (Array.isArray(response)) {
    return response as T[];
  }

  if (
    response &&
    typeof response === "object" &&
    "data" in response &&
    Array.isArray(response.data)
  ) {
    return response.data as T[];
  }

  return [];
}

/* -------------------------------------------------------------------------- */
/*                                  MAIN TAB                                  */
/* -------------------------------------------------------------------------- */

export function EducationTab({ applicant }: EducationTabProps) {
  const [editOpen, setEditOpen] = useState(false);

  return (
    <>
      <div className="space-y-8">
        <section className="space-y-5">
          <TabHeader
            eyebrow="Student Details"
            title="Education Background"
            action={
              <Button
                type="button"
                size="sm"
                onClick={() => setEditOpen(true)}
                className="gap-2"
              >
                <Pencil className="h-4 w-4" />
                Edit Education
              </Button>
            }
          />

          <InfoGrid>
            <InfoCard
              icon={GraduationCap}
              label="Highest Qualification"
              value={applicant.qualification}
            />

            <InfoCard
              icon={GraduationCap}
              label="Graduation Status"
              value={applicant.graduationStatus}
            />

            <InfoCard
              icon={BookOpen}
              label="Percentage / CGPA"
              value={applicant.percentage}
            />

            <InfoCard
              icon={Calendar}
              label="Year of Passing"
              value={applicant.yearOfPassing}
            />

            <InfoCard
              icon={Building2}
              label="Current Institution"
              value={applicant.currentInstitution}
            />

            <InfoCard
              icon={BookOpen}
              label="Work Experience"
              value={applicant.workExperience}
            />
          </InfoGrid>
        </section>

        <section className="space-y-5 border-t border-slate-200 pt-8 dark:border-slate-800">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Education Loan
            </p>

            <h2 className="mt-1 text-base font-black text-slate-900 dark:text-white">
              Study / Abroad Information
            </h2>
          </div>

          <InfoGrid>
            <InfoCard
              icon={GraduationCap}
              label="Study Destination"
              value={applicant.studyDestination}
            />

            <InfoCard
              icon={BookOpen}
              label="Destination Country"
              value={applicant.country}
            />

            <InfoCard
              icon={Building2}
              label="Abroad University"
              value={applicant.university}
            />

            <InfoCard
              icon={BookOpen}
              label="Course Name"
              value={applicant.courseName}
            />

            <InfoCard
              icon={GraduationCap}
              label="Course Level"
              value={applicant.courseLevel}
            />

            <InfoCard
              icon={Calendar}
              label="Course Duration"
              value={applicant.courseDuration}
            />

            <InfoCard icon={Calendar} label="Intake" value={applicant.intake} />

            <InfoCard
              icon={BookOpen}
              label="Admission Status"
              value={applicant.admissionStatus}
            />

            <InfoCard
              icon={BookOpen}
              label="Offer Status"
              value={applicant.offerLetterReceived}
            />
          </InfoGrid>
        </section>
      </div>

      <EditEducationDialog
        applicant={applicant}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*                              EDIT EDUCATION                                */
/* -------------------------------------------------------------------------- */

function EditEducationDialog({
  applicant,
  open,
  onOpenChange,
}: EditEducationDialogProps) {
  const update = useUpdateLoanApplication(applicant.id);

  const [institutionOpen, setInstitutionOpen] = useState(false);
  const [institutionSearch, setInstitutionSearch] = useState("");
  const [isCreatingInstitution, setIsCreatingInstitution] = useState(false);

  const [countries, setCountries] = useState<CountryItem[]>([]);
  const [intakes, setIntakes] = useState<IntakeItem[]>([]);

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<UpdateLoanApplicationValues>({
    resolver: zodResolver(updateLoanApplicationSchema),
    defaultValues: getEducationDefaultValues(applicant),
  });

  const selectedCountryName = watch("country");
  const selectedUniversityName = watch("university");

  /* ------------------------------------------------------------------------ */
  /*                         CURRENT INSTITUTIONS                             */
  /* ------------------------------------------------------------------------ */

  const {
    data: institutions = [],
    isLoading: institutionsLoading,
    refetch: refetchInstitutions,
  } = useQuery<InstitutionOption[]>({
    queryKey: ["lead-universities"],

    queryFn: async () => {
      const { data } = await axios.get("/api/lead-universities?status=true", {
        withCredentials: true,
      });

      return getArrayData<InstitutionOption>(data);
    },
  });

  const createInstitution = async (name: string): Promise<void> => {
    const normalizedName = name.trim();

    if (!normalizedName) {
      throw new Error("Institution name is required");
    }

    await axios.post(
      "/api/lead-universities",
      {
        name: normalizedName,
        status: true,
      },
      {
        withCredentials: true,
      },
    );

    await refetchInstitutions();
  };

  /* ------------------------------------------------------------------------ */
  /*                            QUALIFICATIONS                                */
  /* ------------------------------------------------------------------------ */

  const { data: qualifications = [], isLoading: qualificationsLoading } =
    useQuery<MasterItem[]>({
      queryKey: ["loan-courses"],

      queryFn: async () => {
        const { data } = await axios.get("/api/lead-degrees?status=true", {
          withCredentials: true,
        });

        return getArrayData<MasterItem>(data);
      },
    });

  /* ------------------------------------------------------------------------ */
  /*                         COUNTRY AND INTAKE                               */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    let mounted = true;

    const loadMasterData = async () => {
      try {
        const [countryData, intakeData] = await Promise.all([
          getCountries(),
          getIntakes(),
        ]);

        if (!mounted) {
          return;
        }

        setCountries(countryData);
        setIntakes(intakeData);
      } catch (error) {
        if (!mounted) {
          return;
        }

        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to load country and intake master data",
        );
      }
    };

    void loadMasterData();

    return () => {
      mounted = false;
    };
  }, []);

  /* ------------------------------------------------------------------------ */
  /*                            SELECTED COUNTRY                              */
  /* ------------------------------------------------------------------------ */

  const selectedCountry = useMemo(
    () => countries.find((country) => country.name === selectedCountryName),
    [countries, selectedCountryName],
  );

  /* ------------------------------------------------------------------------ */
  /*                          ABROAD UNIVERSITIES                             */
  /* ------------------------------------------------------------------------ */

  const {
    data: abroadUniversities = [],
    isLoading: abroadUniversitiesLoading,
    isFetching: abroadUniversitiesFetching,
  } = useQuery<AbroadUniversity[]>({
    queryKey: ["abroad-universities", selectedCountry?.id],

    enabled: Boolean(selectedCountry?.id),

    queryFn: async () => {
      if (!selectedCountry?.id) {
        return [];
      }

      const { data } = await axios.get("/api/universities", {
        params: {
          page: 1,
          limit: 100,
          countryId: selectedCountry.id,
          status: "active",
        },
        withCredentials: true,
      });

      return getArrayData<AbroadUniversity>(data);
    },
  });

  /* ------------------------------------------------------------------------ */
  /*                         SELECTED UNIVERSITY                              */
  /* ------------------------------------------------------------------------ */

  const selectedAbroadUniversity = useMemo(
    () =>
      abroadUniversities.find(
        (university) => university.name === selectedUniversityName,
      ),
    [abroadUniversities, selectedUniversityName],
  );

  /* ------------------------------------------------------------------------ */
  /*                          UNIVERSITY COURSES                              */
  /* ------------------------------------------------------------------------ */

  const {
    data: universityCourses = [],
    isLoading: universityCoursesLoading,
    isFetching: universityCoursesFetching,
  } = useQuery<UniversityCourse[]>({
    queryKey: ["university-courses", selectedAbroadUniversity?.id],

    enabled: Boolean(selectedAbroadUniversity?.id),

    queryFn: async () => {
      if (!selectedAbroadUniversity?.id) {
        return [];
      }

      const { data } = await axios.get(
        `/api/universities/${selectedAbroadUniversity.id}/courses`,
        {
          params: {
            page: 1,
            limit: 100,
            status: true,
          },
          withCredentials: true,
        },
      );

      return getArrayData<UniversityCourse>(data);
    },
  });

  /* ------------------------------------------------------------------------ */
  /*                              RESET FORM                                  */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    if (!open) {
      return;
    }

    reset(getEducationDefaultValues(applicant));

    setInstitutionOpen(false);
    setInstitutionSearch("");
    setIsCreatingInstitution(false);
  }, [open, applicant, reset]);

  /* ------------------------------------------------------------------------ */
  /*                              CLOSE DIALOG                                */
  /* ------------------------------------------------------------------------ */

  const handleDialogChange = (nextOpen: boolean) => {
    if (update.isPending || isCreatingInstitution) {
      return;
    }

    if (!nextOpen) {
      reset(getEducationDefaultValues(applicant));

      setInstitutionOpen(false);
      setInstitutionSearch("");
    }

    onOpenChange(nextOpen);
  };

  /* ------------------------------------------------------------------------ */
  /*                                 SUBMIT                                   */
  /* ------------------------------------------------------------------------ */

  const onSubmit = async (values: UpdateLoanApplicationValues) => {
    const payload: UpdateLoanApplicationValues = {
      qualification: normalizeOptionalString(values.qualification),

      graduationStatus: normalizeOptionalString(values.graduationStatus),

      percentage: normalizeOptionalString(values.percentage),

      yearOfPassing: normalizeOptionalString(values.yearOfPassing),

      currentInstitution: normalizeOptionalString(values.currentInstitution),

      workExperience: normalizeOptionalString(values.workExperience),

      studyDestination: normalizeOptionalString(values.studyDestination),

      country: normalizeOptionalString(values.country),

      university: normalizeOptionalString(values.university),

      courseName: normalizeOptionalString(values.courseName),

      courseLevel: normalizeOptionalString(values.courseLevel),

      courseDuration: normalizeOptionalString(values.courseDuration),

      intake: normalizeOptionalString(values.intake),

      admissionStatus: normalizeOptionalString(values.admissionStatus),

      offerLetterReceived: normalizeOptionalString(values.offerLetterReceived),
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
              <GraduationCap className="h-5 w-5 text-red-600" />
            </div>

            <div className="min-w-0">
              <DialogTitle className="text-lg font-black">
                Edit Education Information
              </DialogTitle>

              <DialogDescription className="mt-1">
                Update academic background and study abroad information.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="flex-1 space-y-8 overflow-y-auto px-5 py-6 sm:px-6">
            <FormSection
              title="Education Background"
              description="Applicant qualification and academic information."
              icon={GraduationCap}
            >
              <SelectFormField
                control={control}
                name="qualification"
                label="Highest Qualification"
                error={errors.qualification?.message}
                options={toOptions(qualifications)}
                disabled={qualificationsLoading || update.isPending}
                placeholder={
                  qualificationsLoading
                    ? "Loading Qualifications..."
                    : "Select Qualification"
                }
              />

              <SelectFormField
                control={control}
                name="graduationStatus"
                label="Graduation Status"
                error={errors.graduationStatus?.message}
                options={toOptions(GRADUATION_STATUS_OPTIONS)}
                disabled={update.isPending}
                placeholder="Select Graduation Status"
              />

              <FormField
                label="Percentage / CGPA"
                error={errors.percentage?.message}
              >
                <Input
                  {...register("percentage")}
                  placeholder="75% / 8.2 CGPA"
                  disabled={update.isPending}
                />
              </FormField>

              <FormField
                label="Year of Passing"
                error={errors.yearOfPassing?.message}
              >
                <Input
                  {...register("yearOfPassing")}
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="2026"
                  disabled={update.isPending}
                />
              </FormField>

              {/* CURRENT INSTITUTION SEARCH + CREATE */}

              <FormField
                label="Current Institution"
                error={errors.currentInstitution?.message}
              >
                <Controller
                  control={control}
                  name="currentInstitution"
                  render={({ field }) => {
                    const normalizedSearch = institutionSearch
                      .trim()
                      .toLowerCase();

                    const exactInstitutionExists = institutions.some(
                      (institution) =>
                        institution.name.trim().toLowerCase() ===
                        normalizedSearch,
                    );

                    const handleCreateInstitution = async () => {
                      const value = institutionSearch.trim();

                      if (
                        !value ||
                        exactInstitutionExists ||
                        isCreatingInstitution
                      ) {
                        return;
                      }

                      try {
                        setIsCreatingInstitution(true);

                        await createInstitution(value);

                        field.onChange(value);

                        setInstitutionSearch("");
                        setInstitutionOpen(false);

                        toast.success("Institution added successfully");
                      } catch (error) {
                        toast.error(
                          axios.isAxiosError(error)
                            ? error.response?.data?.message ||
                                error.response?.data?.error ||
                                "Failed to create institution"
                            : error instanceof Error
                              ? error.message
                              : "Failed to create institution",
                        );
                      } finally {
                        setIsCreatingInstitution(false);
                      }
                    };

                    return (
                      <Popover
                        open={institutionOpen}
                        onOpenChange={(nextOpen) => {
                          setInstitutionOpen(nextOpen);

                          if (!nextOpen) {
                            setInstitutionSearch("");
                          }
                        }}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            role="combobox"
                            aria-expanded={institutionOpen}
                            disabled={
                              institutionsLoading ||
                              isCreatingInstitution ||
                              update.isPending
                            }
                            className={cn(
                              "w-full justify-between font-normal",
                              !field.value && "text-muted-foreground",
                              errors.currentInstitution &&
                                "border-destructive focus-visible:ring-destructive",
                            )}
                          >
                            <span className="truncate">
                              {institutionsLoading
                                ? "Loading Institutions..."
                                : typeof field.value === "string" && field.value
                                  ? field.value
                                  : "Select or Type Institution"}
                            </span>

                            {institutionsLoading || isCreatingInstitution ? (
                              <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin opacity-50" />
                            ) : (
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            )}
                          </Button>
                        </PopoverTrigger>

                        <PopoverContent
                          align="start"
                          className="w-[var(--radix-popover-trigger-width)] p-0"
                        >
                          <Command shouldFilter>
                            <CommandInput
                              placeholder="Search or type institution..."
                              value={institutionSearch}
                              onValueChange={setInstitutionSearch}
                            />

                            <CommandList>
                              <CommandEmpty>
                                {institutionSearch.trim() ? (
                                  exactInstitutionExists ? (
                                    <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                                      Institution already exists
                                    </div>
                                  ) : (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      disabled={isCreatingInstitution}
                                      className="h-auto w-full justify-start rounded-none px-3 py-3"
                                      onClick={handleCreateInstitution}
                                    >
                                      {isCreatingInstitution ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      ) : (
                                        <Plus className="mr-2 h-4 w-4" />
                                      )}

                                      <span className="min-w-0 truncate">
                                        Add &quot;
                                        {institutionSearch.trim()}
                                        &quot;
                                      </span>
                                    </Button>
                                  )
                                ) : (
                                  <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                                    Type an institution name to search
                                  </div>
                                )}
                              </CommandEmpty>

                              <CommandGroup>
                                {institutions.map((institution) => (
                                  <CommandItem
                                    key={institution.id}
                                    value={institution.name}
                                    onSelect={() => {
                                      field.onChange(institution.name);

                                      setInstitutionSearch("");
                                      setInstitutionOpen(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4 shrink-0",
                                        field.value === institution.name
                                          ? "opacity-100"
                                          : "opacity-0",
                                      )}
                                    />

                                    <span className="truncate">
                                      {institution.name}
                                    </span>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    );
                  }}
                />
              </FormField>

              <FormField
                label="Work Experience"
                error={errors.workExperience?.message}
              >
                <Input
                  {...register("workExperience")}
                  placeholder="e.g. 2 years"
                  disabled={update.isPending}
                />
              </FormField>
            </FormSection>

            <FormSection
              title="Study / Abroad Information"
              description="Destination, university, course and admission details."
              icon={BookOpen}
            >
              <SelectFormField
                control={control}
                name="studyDestination"
                label="Study Destination"
                error={errors.studyDestination?.message}
                options={toOptions(STUDY_DESTINATION_OPTIONS)}
                disabled={update.isPending}
                placeholder="Select Study Destination"
              />

              <SelectFormField
                control={control}
                name="country"
                label="Destination Country"
                error={errors.country?.message}
                options={toOptions(countries)}
                disabled={update.isPending}
                placeholder="Select Country"
                onValueChange={(value) => {
                  setValue("country", value, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });

                  setValue("university", "", {
                    shouldDirty: true,
                    shouldValidate: true,
                  });

                  setValue("courseName", "", {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                }}
              />

              <SelectFormField
                control={control}
                name="university"
                label="Abroad University Name"
                error={errors.university?.message}
                options={abroadUniversities.map((university) => ({
                  value: university.name,
                  label: university.name,
                }))}
                disabled={
                  !selectedCountry?.id ||
                  abroadUniversitiesLoading ||
                  abroadUniversitiesFetching ||
                  update.isPending
                }
                placeholder={
                  !selectedCountry?.id
                    ? "Select Destination Country First"
                    : abroadUniversitiesLoading || abroadUniversitiesFetching
                      ? "Loading Universities..."
                      : abroadUniversities.length === 0
                        ? "No Universities Found"
                        : "Select University"
                }
                onValueChange={(value) => {
                  setValue("university", value, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });

                  setValue("courseName", "", {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                }}
              />

              <SelectFormField
                control={control}
                name="courseName"
                label="Course Name"
                error={errors.courseName?.message}
                options={universityCourses.map((course) => ({
                  value: course.name,
                  label: course.name,
                }))}
                disabled={
                  !selectedAbroadUniversity?.id ||
                  universityCoursesLoading ||
                  universityCoursesFetching ||
                  update.isPending
                }
                placeholder={
                  !selectedAbroadUniversity?.id
                    ? "Select University First"
                    : universityCoursesLoading || universityCoursesFetching
                      ? "Loading Courses..."
                      : universityCourses.length === 0
                        ? "No Courses Found"
                        : "Select Course"
                }
              />

              <SelectFormField
                control={control}
                name="courseLevel"
                label="Course Level"
                error={errors.courseLevel?.message}
                options={toOptions(COURSE_LEVEL_OPTIONS)}
                disabled={update.isPending}
                placeholder="Select Course Level"
              />

              <FormField
                label="Course Duration"
                error={errors.courseDuration?.message}
              >
                <Input
                  {...register("courseDuration")}
                  placeholder="e.g. 2 years"
                  disabled={update.isPending}
                />
              </FormField>

              <SelectFormField
                control={control}
                name="intake"
                label="Intake"
                error={errors.intake?.message}
                options={toOptions(intakes)}
                disabled={update.isPending}
                placeholder="Select Intake"
              />

              <SelectFormField
                control={control}
                name="admissionStatus"
                label="Admission Status"
                error={errors.admissionStatus?.message}
                options={toOptions(ADMISSION_STATUS_OPTIONS)}
                disabled={update.isPending}
                placeholder="Select Admission Status"
              />

              <SelectFormField
                control={control}
                name="offerLetterReceived"
                label="Offer Status"
                error={errors.offerLetterReceived?.message}
                options={toOptions(OFFER_LETTER_OPTIONS)}
                disabled={update.isPending}
                placeholder="Select Offer Status"
              />
            </FormSection>
          </div>

          <DialogFooter className="shrink-0 border-t bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-950 sm:px-6">
            <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleDialogChange(false)}
                disabled={update.isPending || isCreatingInstitution}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={update.isPending || isCreatingInstitution || !isDirty}
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
                    Save Education
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

/* -------------------------------------------------------------------------- */
/*                            SELECT FORM FIELD                               */
/* -------------------------------------------------------------------------- */

interface SelectFormFieldProps {
  control: ReturnType<typeof useForm<UpdateLoanApplicationValues>>["control"];

  name:
    | "qualification"
    | "graduationStatus"
    | "studyDestination"
    | "country"
    | "university"
    | "courseName"
    | "courseLevel"
    | "intake"
    | "admissionStatus"
    | "offerLetterReceived";

  label: string;
  error?: string;
  options: Option[];
  placeholder: string;
  disabled?: boolean;
  onValueChange?: (value: string) => void;
}

function SelectFormField({
  control,
  name,
  label,
  error,
  options,
  placeholder,
  disabled,
  onValueChange,
}: SelectFormFieldProps) {
  return (
    <FormField label={label} error={error}>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <Select
            value={typeof field.value === "string" ? field.value : ""}
            disabled={disabled}
            onValueChange={(value) => {
              if (onValueChange) {
                onValueChange(value);
                return;
              }

              field.onChange(value);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>

            <SelectContent>
              {options.length > 0 ? (
                options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="__empty__" disabled>
                  No options available
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        )}
      />
    </FormField>
  );
}

/* -------------------------------------------------------------------------- */
/*                              FORM SECTION                                  */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/*                               FORM FIELD                                   */
/* -------------------------------------------------------------------------- */

interface FormFieldProps {
  label: string;
  error?: string;
  children: React.ReactNode;
}

function FormField({ label, error, children }: FormFieldProps) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
        {label}
      </Label>

      {children}

      {error && <p className="text-xs font-semibold text-red-600">{error}</p>}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              DEFAULT VALUES                                */
/* -------------------------------------------------------------------------- */

function getEducationDefaultValues(
  applicant: LoanApplication,
): UpdateLoanApplicationValues {
  return {
    qualification: applicant.qualification ?? "",
    graduationStatus: applicant.graduationStatus ?? "",
    percentage: applicant.percentage ?? "",
    yearOfPassing: applicant.yearOfPassing ?? "",
    currentInstitution: applicant.currentInstitution ?? "",
    workExperience: applicant.workExperience ?? "",

    studyDestination: applicant.studyDestination ?? "",
    country: applicant.country ?? "",
    university: applicant.university ?? "",
    courseName: applicant.courseName ?? "",
    courseLevel: applicant.courseLevel ?? "",
    courseDuration: applicant.courseDuration ?? "",
    intake: applicant.intake ?? "",
    admissionStatus: applicant.admissionStatus ?? "",
    offerLetterReceived: applicant.offerLetterReceived ?? "",
  };
}
