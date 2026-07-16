// crm-frontend-next/app/components/universities/university-form-dialog.tsx

"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

import { useFieldArray, useForm, type FieldErrors } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Save } from "lucide-react";

import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import axios from "axios";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Button } from "@/components/ui/button";
import { ImageUpload } from "@/components/ui/image-upload";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  universitySchema,
  type UniversityFormValues,
} from "@/lib/university-schema";

import type { University } from "@/types/university";

import { UniversityCourseForm } from "./university-course-form";
import { UniversityScholarshipForm } from "./university-scholarship-form";
interface UniversityFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  university?: University | null;
  onSubmit: (data: UniversityFormValues) => Promise<void> | void;
}

type FormTab = "info" | "courses" | "scholarships";

interface CountryOption {
  id: string;
  name: string;
  code: string;
}
function createDefaultValues(): UniversityFormValues {
  return {
    name: "",
    countryId: "",
    tier: "T4",
    status: "active",
    courses: [],
    scholarships: [],
  };
}

function getTemporaryId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `temporary-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function toOptionalNumber(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }

  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : undefined;
}

function formatDateForInput(value: unknown) {
  if (!value) {
    return undefined;
  }

  const date = new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date.toISOString().slice(0, 10);
}

function removeUniversityMetadata(university: University) {
  const cleanedUniversity = {
    ...(university as unknown as Record<string, unknown>),
  };

  delete cleanedUniversity.country;
  delete cleanedUniversity._count;
  delete cleanedUniversity.createdAt;
  delete cleanedUniversity.updatedAt;

  return cleanedUniversity;
}
export function UniversityFormDialog({
  open,
  onOpenChange,
  university,
  onSubmit,
}: UniversityFormDialogProps) {
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<FormTab>("info");

  const isEdit = Boolean(university);
  const {
    data: countriesData,
    isLoading: isCountriesLoading,
    isError: isCountriesError,
  } = useQuery({
    queryKey: ["countries"],
    queryFn: async () => {
      const response = await axios.get("/api/countries");

      return response.data.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const countries = (countriesData ?? []) as CountryOption[];
  const values = useMemo<UniversityFormValues>(() => {
    if (!university) {
      return createDefaultValues();
    }

    const universityData = university as University & {
      country?:
        | {
            id?: string;
          }
        | string
        | null;
    };

    const cleanedUniversity = removeUniversityMetadata(university);

    const countryId =
      university.countryId ||
      (typeof universityData.country === "object"
        ? universityData.country?.id
        : universityData.country) ||
      "";

    return {
      ...createDefaultValues(),
      ...cleanedUniversity,

      name: university.name ?? "",
      countryId,
      status: university.status ?? "active",

      tier: university.tier ?? "T4",

      city: university.city ?? undefined,
      state: university.state ?? undefined,
      postalCode: university.postalCode ?? undefined,
      website: university.website ?? undefined,
      logo: university.logo ?? undefined,

      ranking: toOptionalNumber(university.ranking),

      establishedYear: toOptionalNumber(university.establishedYear),

      applicationFee: toOptionalNumber(university.applicationFee),

      currency: university.currency ?? undefined,

      intakeNotes: university.intakeNotes ?? undefined,

      description: university.description ?? undefined,

      courses: (university.courses ?? []).map((course: any) => ({
        id: course.id ?? getTemporaryId(),
        name: course.name ?? "",
        courseCode: course.courseCode ?? undefined,
        degree: course.degree ?? undefined,

        durationMonths: toOptionalNumber(course.durationMonths),

        annualTuitionFee: toOptionalNumber(course.annualTuitionFee),

        totalTuitionFee: toOptionalNumber(course.totalTuitionFee),

        currency: course.currency ?? undefined,

        intakeId: course.intakeId ?? course.intake?.id ?? undefined,

        minimumPercentage: toOptionalNumber(course.minimumPercentage),

        backlogLimit: toOptionalNumber(course.backlogLimit),

        ieltsOverall: toOptionalNumber(course.ieltsOverall),

        applicationDeadline: formatDateForInput(course.applicationDeadline),

        description: course.description ?? undefined,
      })),

      scholarships: (university.scholarships ?? []).map((scholarship: any) => ({
        id: scholarship.id ?? getTemporaryId(),

        name: scholarship.name ?? "",

        amount: toOptionalNumber(scholarship.amount),

        percentage: toOptionalNumber(scholarship.percentage),

        description: scholarship.description ?? undefined,
      })),
    } as UniversityFormValues;
  }, [university]);
  const form = useForm<UniversityFormValues>({
    resolver: zodResolver(universitySchema) as any,

    defaultValues: createDefaultValues(),

    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  const {
    formState: { errors, isSubmitting },
  } = form;

  const courseArray = useFieldArray({
    control: form.control,
    name: "courses",
  });

  const scholarshipArray = useFieldArray({
    control: form.control,
    name: "scholarships",
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    form.reset(university ? values : createDefaultValues());

    form.clearErrors();
    setActiveTab("info");
  }, [open, university, values, form]);
  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (isSubmitting) {
      return;
    }

    if (!nextOpen) {
      form.reset(university ? values : createDefaultValues());

      form.clearErrors();
      setActiveTab("info");
    }

    onOpenChange(nextOpen);
  };
  const invalidSubmitHandler = (
    formErrors: FieldErrors<UniversityFormValues>,
  ) => {
    const hasGeneralErrors = Object.keys(formErrors).some(
      (key) => key !== "courses" && key !== "scholarships",
    );

    if (hasGeneralErrors) {
      setActiveTab("info");
    } else if (formErrors.courses) {
      setActiveTab("courses");
    } else if (formErrors.scholarships) {
      setActiveTab("scholarships");
    }

    toast.error("Please check the required fields before submitting.");
  };
  const submitHandler = async (data: UniversityFormValues) => {
    try {
      const cleanedData = {
        ...data,

        courses: data.courses ?? [],

        scholarships: (data.scholarships ?? []).map(
          ({ id: _temporaryId, ...scholarship }) => scholarship,
        ),
      };

      await onSubmit(cleanedData as UniversityFormValues);

      const refreshRequests: Promise<void>[] = [
        queryClient.invalidateQueries({
          queryKey: ["universities"],
          refetchType: "active",
        }),
      ];

      if (university?.id) {
        refreshRequests.push(
          queryClient.invalidateQueries({
            queryKey: ["university", university.id],
            refetchType: "active",
          }),
        );
      }

      await Promise.all(refreshRequests);

      if (isEdit) {
        form.reset(data);
      } else {
        form.reset(createDefaultValues());
      }

      form.clearErrors();
      setActiveTab("info");

      onOpenChange(false);
    } catch (error: unknown) {
      const requestError = error as {
        response?: {
          data?: {
            message?: string;
          };
        };
        message?: string;
      };

      const message =
        requestError?.response?.data?.message ||
        requestError?.message ||
        "An error occurred during submission.";

      console.error("[UniversityForm] submit error:", error);

      toast.error(message);
    }
  };
  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent
        className="
          flex
          h-[92vh]
          max-h-[920px]
          w-[calc(100vw-2rem)]
          max-w-5xl
          flex-col
          overflow-hidden
          rounded-2xl
          p-0
        "
        onEscapeKeyDown={(event) => {
          if (isSubmitting) {
            event.preventDefault();
          }
        }}
        onInteractOutside={(event) => {
          if (isSubmitting) {
            event.preventDefault();
          }
        }}
      >
        {/* Header */}
        <DialogHeader className="shrink-0 border-b bg-muted/10 px-5 py-4 sm:px-6 sm:py-5">
          <DialogTitle className="text-lg sm:text-xl">
            {isEdit ? "Edit University Details" : "Create New University"}
          </DialogTitle>

          <p className="text-sm text-muted-foreground">
            {isEdit
              ? "Update university information, courses and scholarships."
              : "Add university information, courses and scholarships."}
          </p>
        </DialogHeader>

        <form
          noValidate
          aria-busy={isSubmitting}
          onSubmit={form.handleSubmit(submitHandler, invalidSubmitHandler)}
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as FormTab)}
            className="flex min-h-0 flex-1 flex-col overflow-hidden"
          >
            {/* Tab Navigation */}
            <div className="shrink-0 border-b bg-muted/5 px-4 py-3 sm:px-6">
              <TabsList className="grid h-auto w-full max-w-lg grid-cols-3">
                <TabsTrigger
                  value="info"
                  disabled={isSubmitting}
                  className="px-2 py-2.5 text-xs sm:text-sm"
                >
                  General Info
                </TabsTrigger>

                <TabsTrigger
                  value="courses"
                  disabled={isSubmitting}
                  className="px-2 py-2.5 text-xs sm:text-sm"
                >
                  Courses
                </TabsTrigger>

                <TabsTrigger
                  value="scholarships"
                  disabled={isSubmitting}
                  className="px-2 py-2.5 text-xs sm:text-sm"
                >
                  Scholarships
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
              <TabsContent value="info" className="mt-0 space-y-6">
                <FormSection
                  title="Basic Information"
                  description="Enter the university name and country."
                >
                  <div className="grid items-start gap-5 md:grid-cols-2">
                    <FormFieldContainer>
                      <Label htmlFor="university-name">
                        University Name
                        <span className="ml-1 text-destructive">*</span>
                      </Label>

                      <Input
                        id="university-name"
                        placeholder="e.g. University of Birmingham"
                        disabled={isSubmitting}
                        {...form.register("name")}
                      />

                      <FieldError message={errors.name?.message} />
                    </FormFieldContainer>

                    <FormFieldContainer>
                      <Label>
                        Country
                        <span className="ml-1 text-destructive">*</span>
                      </Label>

                      <Select
                        disabled={isSubmitting || isCountriesLoading}
                        value={form.watch("countryId") || ""}
                        onValueChange={(value) =>
                          form.setValue("countryId", value, {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue
                            placeholder={
                              isCountriesLoading
                                ? "Loading countries..."
                                : "Select country"
                            }
                          />
                        </SelectTrigger>

                        <SelectContent>
                          {countries.map((country) => (
                            <SelectItem key={country.id} value={country.id}>
                              {country.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {isCountriesError && (
                        <p className="text-xs text-destructive">
                          Failed to load countries.
                        </p>
                      )}

                      <FieldError message={errors.countryId?.message} />
                    </FormFieldContainer>
                  </div>
                </FormSection>

                {/* Location */}
                <FormSection
                  title="Location"
                  description="Add the university's geographical information."
                >
                  <div className="grid items-start gap-5 md:grid-cols-2 lg:grid-cols-3">
                    <FormFieldContainer>
                      <Label htmlFor="university-city">City</Label>

                      <Input
                        id="university-city"
                        placeholder="e.g. Birmingham"
                        disabled={isSubmitting}
                        {...form.register("city")}
                      />

                      <FieldError message={errors.city?.message} />
                    </FormFieldContainer>

                    <FormFieldContainer>
                      <Label htmlFor="university-state">State / Province</Label>

                      <Input
                        id="university-state"
                        placeholder="e.g. West Midlands"
                        disabled={isSubmitting}
                        {...form.register("state")}
                      />

                      <FieldError message={errors.state?.message} />
                    </FormFieldContainer>

                    <FormFieldContainer>
                      <Label htmlFor="university-postal-code">
                        Postal Code
                      </Label>

                      <Input
                        id="university-postal-code"
                        placeholder="e.g. B15 2TT"
                        disabled={isSubmitting}
                        {...form.register("postalCode")}
                      />

                      <FieldError message={errors.postalCode?.message} />
                    </FormFieldContainer>
                  </div>
                </FormSection>

                {/* Digital Presence */}
                <FormSection
                  title="Digital Presence"
                  description="Add the official website and university logo."
                >
                  <div className="grid items-start gap-6 lg:grid-cols-2">
                    <FormFieldContainer>
                      <Label htmlFor="university-website">
                        Official Website
                      </Label>

                      <Input
                        id="university-website"
                        type="url"
                        placeholder="https://www.university.edu"
                        disabled={isSubmitting}
                        {...form.register("website")}
                      />

                      <p className="text-xs leading-5 text-muted-foreground">
                        Enter the complete website address, including https://
                      </p>

                      <FieldError message={errors.website?.message} />
                    </FormFieldContainer>

                    <div className="min-w-0">
                      <ImageUpload
                        label="University Logo"
                        value={form.watch("logo") || ""}
                        onChange={(url) =>
                          form.setValue("logo", url, {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                        }
                      />

                      <FieldError message={errors.logo?.message} />
                    </div>
                  </div>
                </FormSection>

                {/* Institutional Details */}
                <FormSection
                  title="Institutional Details"
                  description="Enter ranking, establishment year and application fee."
                >
                  <div className="grid items-start gap-5 sm:grid-cols-2 xl:grid-cols-4">
                    <FormFieldContainer>
                      <Label htmlFor="university-ranking">Global Ranking</Label>

                      <Input
                        id="university-ranking"
                        type="number"
                        min="1"
                        placeholder="e.g. 68"
                        disabled={isSubmitting}
                        {...form.register("ranking", {
                          setValueAs: (value) =>
                            value === "" ? undefined : Number(value),
                        })}
                      />

                      <FieldError message={errors.ranking?.message} />
                    </FormFieldContainer>

                    <FormFieldContainer>
                      <Label htmlFor="university-established-year">
                        Established Year
                      </Label>

                      <Input
                        id="university-established-year"
                        type="number"
                        min="1000"
                        max={new Date().getFullYear()}
                        placeholder="e.g. 1900"
                        disabled={isSubmitting}
                        {...form.register("establishedYear", {
                          setValueAs: (value) =>
                            value === "" ? undefined : Number(value),
                        })}
                      />

                      <FieldError message={errors.establishedYear?.message} />
                    </FormFieldContainer>

                    <FormFieldContainer>
                      <Label htmlFor="university-application-fee">
                        Application Fee
                      </Label>

                      <Input
                        id="university-application-fee"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        disabled={isSubmitting}
                        {...form.register("applicationFee", {
                          setValueAs: (value) =>
                            value === "" ? undefined : Number(value),
                        })}
                      />

                      <FieldError message={errors.applicationFee?.message} />
                    </FormFieldContainer>

                    <FormFieldContainer>
                      <Label>Currency</Label>

                      <Select
                        disabled={isSubmitting}
                        value={form.watch("currency") || ""}
                        onValueChange={(value) =>
                          form.setValue("currency", value, {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>

                        <SelectContent>
                          <SelectItem value="USD">USD — US Dollar</SelectItem>

                          <SelectItem value="AUD">
                            AUD — Australian Dollar
                          </SelectItem>

                          <SelectItem value="CAD">
                            CAD — Canadian Dollar
                          </SelectItem>

                          <SelectItem value="GBP">
                            GBP — British Pound
                          </SelectItem>

                          <SelectItem value="EUR">EUR — Euro</SelectItem>

                          <SelectItem value="NZD">
                            NZD — New Zealand Dollar
                          </SelectItem>

                          <SelectItem value="SGD">
                            SGD — Singapore Dollar
                          </SelectItem>

                          <SelectItem value="INR">
                            INR — Indian Rupee
                          </SelectItem>
                        </SelectContent>
                      </Select>

                      <FieldError message={errors.currency?.message} />
                    </FormFieldContainer>
                  </div>
                </FormSection>

                {/* Additional Information */}
                <FormSection
                  title="Additional Information"
                  description="Manage status, intake details and university description."
                >
                  <div className="space-y-5">
                    <div className="grid items-start gap-5 md:grid-cols-2">
                      <FormFieldContainer>
                        <Label>University Tier</Label>

                        <Select
                          disabled={isSubmitting}
                          value={form.watch("tier") || "T3"}
                          onValueChange={(value) =>
                            form.setValue("tier", value as "T1" | "T2" | "T3", {
                              shouldDirty: true,
                              shouldValidate: true,
                            })
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select Tier" />
                          </SelectTrigger>

                          <SelectContent>
                            <SelectItem value="T1">
                              T1 - Premium Universities
                            </SelectItem>

                            <SelectItem value="T2">
                              T2 - High Ranking Universities
                            </SelectItem>

                            <SelectItem value="T3">
                              T3 - Standard Universities
                            </SelectItem>

                            <SelectItem value="T4">
                              T4 - Easy Admission Universities
                            </SelectItem>
                          </SelectContent>
                        </Select>

                        <FieldError message={errors.tier?.message} />
                      </FormFieldContainer>
                      <FormFieldContainer>
                        <Label>Status</Label>

                        <Select
                          disabled={isSubmitting}
                          value={form.watch("status") || "active"}
                          onValueChange={(value) =>
                            form.setValue(
                              "status",
                              value as "active" | "inactive",
                              {
                                shouldDirty: true,
                                shouldValidate: true,
                              },
                            )
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>

                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>

                            <SelectItem value="inactive">Inactive</SelectItem>

                            <SelectItem value="archived">Archived</SelectItem>
                          </SelectContent>
                        </Select>

                        <FieldError message={errors.status?.message} />
                      </FormFieldContainer>
                    </div>

                    <FormFieldContainer>
                      <Label htmlFor="university-intake-notes">
                        Intake Information
                      </Label>

                      <Textarea
                        id="university-intake-notes"
                        rows={4}
                        placeholder="Enter intake months, deadlines or special admission instructions..."
                        className="min-h-28 resize-y"
                        disabled={isSubmitting}
                        {...form.register("intakeNotes")}
                      />

                      <FieldError message={errors.intakeNotes?.message} />
                    </FormFieldContainer>

                    <FormFieldContainer>
                      <Label htmlFor="university-description">
                        About University
                      </Label>

                      <Textarea
                        id="university-description"
                        rows={5}
                        placeholder="Enter a brief description of the university..."
                        className="min-h-32 resize-y"
                        disabled={isSubmitting}
                        {...form.register("description")}
                      />

                      <FieldError message={errors.description?.message} />
                    </FormFieldContainer>
                  </div>
                </FormSection>
              </TabsContent>
              <TabsContent value="courses" className="mt-0 space-y-6">
                <div className="flex flex-col gap-4 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold">Courses</h3>

                    <p className="text-sm text-muted-foreground">
                      Manage courses offered by this university.
                    </p>
                  </div>

                  <Button
                    type="button"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto"
                    onClick={() =>
                      courseArray.append({
                        id: getTemporaryId(),
                        name: "",
                      })
                    }
                  >
                    <Plus className="mr-2 size-4" />
                    Add Course
                  </Button>
                </div>

                {errors.courses?.message && (
                  <p className="text-sm text-destructive">
                    {errors.courses.message}
                  </p>
                )}

                <div className="space-y-4">
                  {courseArray.fields.length === 0 ? (
                    <EmptyFormState
                      title="No courses added yet"
                      description="Click Add Course to create the first course."
                    />
                  ) : (
                    courseArray.fields.map((field, index) => (
                      <UniversityCourseForm
                        key={field.id}
                        index={index}
                        control={form.control}
                        remove={courseArray.remove}
                      />
                    ))
                  )}
                </div>
              </TabsContent>
              <TabsContent value="scholarships" className="mt-0 space-y-6">
                <div className="flex flex-col gap-4 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold">Scholarships</h3>

                    <p className="text-sm text-muted-foreground">
                      Manage scholarships available at this university.
                    </p>
                  </div>

                  <Button
                    type="button"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto"
                    onClick={() =>
                      scholarshipArray.append({
                        id: getTemporaryId(),
                        name: "",
                      })
                    }
                  >
                    <Plus className="mr-2 size-4" />
                    Add Scholarship
                  </Button>
                </div>

                {errors.scholarships?.message && (
                  <p className="text-sm text-destructive">
                    {errors.scholarships.message}
                  </p>
                )}

                <div className="space-y-4">
                  {scholarshipArray.fields.length === 0 ? (
                    <EmptyFormState
                      title="No scholarships added yet"
                      description="Click Add Scholarship to create the first scholarship."
                    />
                  ) : (
                    scholarshipArray.fields.map((field, index) => (
                      <UniversityScholarshipForm
                        key={field.id}
                        index={index}
                        control={form.control}
                        remove={scholarshipArray.remove}
                      />
                    ))
                  )}
                </div>
              </TabsContent>
            </div>
          </Tabs>

          {/* Footer */}
          <DialogFooter className="shrink-0 gap-3 border-t bg-muted/10 px-4 py-4 sm:px-6 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => handleDialogOpenChange(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full min-w-48 sm:w-auto"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />

                  {isEdit ? "Updating University..." : "Creating University..."}
                </>
              ) : (
                <>
                  <Save className="mr-2 size-4" />

                  {isEdit ? "Update University" : "Create University"}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border bg-card">
      <div className="border-b bg-muted/20 px-4 py-4 sm:px-5">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>

        {description && (
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {description}
          </p>
        )}
      </div>

      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

function FormFieldContainer({ children }: { children: ReactNode }) {
  return <div className="min-w-0 space-y-2">{children}</div>;
}

function FieldError({ message }: { message?: unknown }) {
  if (typeof message !== "string" || !message) {
    return null;
  }

  return <p className="text-xs font-medium text-destructive">{message}</p>;
}

function EmptyFormState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-36 flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/10 px-5 py-8 text-center">
      <p className="text-sm font-medium text-foreground">{title}</p>

      <p className="mt-1 text-xs leading-5 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
