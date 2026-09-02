// app\(dashboard)\leads\add\page.tsx
"use client";
import { z } from "zod";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PageHeader, PageTransition } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Briefcase,
  Check,
  CheckCircle2,
  ChevronsUpDown,
  Globe,
  GraduationCap,
  Loader2,
  MapPin,
  Plus,
  Trash2,
} from "lucide-react";
import { Branch } from "@/lib/branches";
import { type FormEvent, useEffect, useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Country,
  Intake,
  LeadSource,
  getCountries,
  getIntakes,
  getLeadSources,
} from "@/lib/master-settings";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
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

import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/store";
import { RoutePermission } from "@/components/guards/RoutePermission";
import { MODULES } from "@/lib/module-codes";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
const englishTestOptions = ["IELTS", "TOEFL", "DUOLINGO", "PTE"] as const;

type EnglishTestType = (typeof englishTestOptions)[number];

type EnglishTestScoreLimit = {
  total: number;
  section: number;
  decimals: number;
};
type PreferredUniversity = {
  id: string;
  name: string;
  countryId: string;
  tier: "T1" | "T2" | "T3" | "T4";
};

type PreferredCourse = {
  id: string;
  name: string;
  universityId: string;
};
const englishTestScoreLimits: Record<EnglishTestType, EnglishTestScoreLimit> = {
  IELTS: {
    total: 9,
    section: 9,
    decimals: 1,
  },
  TOEFL: {
    total: 120,
    section: 30,
    decimals: 0,
  },
  DUOLINGO: {
    total: 160,
    section: 160,
    decimals: 0,
  },
  PTE: {
    total: 90,
    section: 90,
    decimals: 0,
  },
};

const optionalNumber = z.preprocess((value) => {
  if (
    value === "" ||
    value === null ||
    value === undefined ||
    Number.isNaN(value)
  ) {
    return undefined;
  }

  const numberValue = Number(value);

  return Number.isNaN(numberValue) ? undefined : numberValue;
}, z.number().optional());

const englishTestSchema = z
  .object({
    testType: z.enum(englishTestOptions),
    totalScore: optionalNumber,
    listeningScore: optionalNumber,
    readingScore: optionalNumber,
    writingScore: optionalNumber,
    speakingScore: optionalNumber,
  })
  .superRefine((data, ctx) => {
    const limits = englishTestScoreLimits[data.testType];

    const validateScore = (
      value: number | undefined,
      field:
        | "totalScore"
        | "listeningScore"
        | "readingScore"
        | "writingScore"
        | "speakingScore",
      maxScore: number,
    ) => {
      if (value === undefined) {
        return;
      }

      if (value < 0 || value > maxScore) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [field],
          message: `Score must be between 0 and ${maxScore}`,
        });

        return;
      }

      const decimalPlaces = value.toString().split(".")[1]?.length ?? 0;

      if (decimalPlaces > limits.decimals) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [field],
          message:
            limits.decimals === 0
              ? `${data.testType} accepts whole numbers only`
              : `Maximum ${limits.decimals} decimal place allowed`,
        });
      }
    };

    validateScore(data.totalScore, "totalScore", limits.total);

    validateScore(data.listeningScore, "listeningScore", limits.section);

    validateScore(data.readingScore, "readingScore", limits.section);

    validateScore(data.writingScore, "writingScore", limits.section);

    validateScore(data.speakingScore, "speakingScore", limits.section);
  });

const leadFormSchema = z.object({
  counsellingDate: z.string().optional(),
  studentName: z.string().min(1, "Student name is required"),
  fatherName: z.string().optional(),
  mobileNumber: z
    .string()
    .min(10, "Must be at least 10 digits")
    .max(10, "Cannot exceed 10 digits")
    .regex(/^[0-9]+$/, "Must be numbers only"),
  emailId: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address"),
  place: z.string().optional(),
  passport: z.string().optional(),
  passportExpireDate: z.string().optional(),
  tenthPercentage: optionalNumber,
  tenthYearOfPassing: optionalNumber,
  twelfthPercentage: optionalNumber,
  twelfthYearOfPassing: optionalNumber,
  bachelorsCourse: z.string().optional(),
  bachelorsUniversityName: z.string().optional(),
  bachelorsPercentage: optionalNumber,
  bachelorsYearOfPassing: optionalNumber,
  backlogs: optionalNumber,
  workExperience: z.string().optional(),
  preferredCountry: z.string().optional(),
  preferredIntake: z.string().optional(),

  preferredUniversityId: z.string().uuid().optional().or(z.literal("")),
  preferredCourseId: z.string().uuid().optional().or(z.literal("")),

  preferredTiers: z.array(z.string()).optional(),
  greGmatScore: optionalNumber,
  quantitativeScore: optionalNumber,
  verbalScore: optionalNumber,
  analyticalWritingScore: optionalNumber,
  englishTests: z
    .array(englishTestSchema)
    .max(4, "Maximum 4 English proficiency tests are allowed")
    .default([]),
  moi: z.string().optional(),
  gapsIfAny: z.string().optional(),
  status: z.string().optional(),
  source: z.string().optional(),
  branchId: z.string().min(1, "Branch is required"),
  graduationStatus: z.preprocess(
    (value) => {
      if (value === "" || value === null || value === undefined) {
        return undefined;
      }

      return value;
    },
    z.enum(["completed", "pursuing"]).optional(),
  ),
  loanRequirement: z.boolean().optional(),
  counselorIds: z.array(z.string()).optional(),
  loanNote: z.string().optional(),
  fintechAssigneeId: z.preprocess((value) => {
    if (value === "" || value === null || value === undefined) {
      return null;
    }

    return value;
  }, z.string().uuid().nullable().optional()),
});

type LeadFormValues = z.input<typeof leadFormSchema>;

export default function AddLeadPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [bachelorsUniversityOpen, setBachelorsUniversityOpen] = useState(false);

  const [bachelorsUniversitySearch, setBachelorsUniversitySearch] =
    useState("");

  const [preferredUniversityOpen, setPreferredUniversityOpen] = useState(false);

  const [preferredUniversitySearch, setPreferredUniversitySearch] =
    useState("");

  const [preferredCourseOpen, setPreferredCourseOpen] = useState(false);

  const [preferredCourseSearch, setPreferredCourseSearch] = useState("");
  const [countries, setCountries] = useState<Country[]>([]);
  const [intakes, setIntakes] = useState<Intake[]>([]);
  const [leadSources, setLeadSources] = useState<LeadSource[]>([]);
  const { user } = useAuth();

  const branches = user?.branches ?? [];
  const [isSaving, setIsSaving] = useState(false);
  const [preferredUniversities, setPreferredUniversities] = useState<
    PreferredUniversity[]
  >([]);

  const [preferredCourses, setPreferredCourses] = useState<PreferredCourse[]>(
    [],
  );

  const [loadingUniversities, setLoadingUniversities] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(false);

  const [creatingUniversity, setCreatingUniversity] = useState(false);
  const [creatingCourse, setCreatingCourse] = useState(false);
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
      `${process.env.NEXT_PUBLIC_API_URL}/lead-universities?status=true`,
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
  const loadPreferredUniversities = async (countryId: string) => {
    if (!countryId) {
      setPreferredUniversities([]);
      return;
    }

    try {
      setLoadingUniversities(true);

      const params = new URLSearchParams({
        countryId,
        status: "active",
        page: "1",
        limit: "100",
      });

      const response = await fetch(`/api/universities?${params.toString()}`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load universities");
      }

      const result = await response.json();

      const universitiesData: PreferredUniversity[] = Array.isArray(
        result?.data,
      )
        ? result.data
        : [];

      setPreferredUniversities(universitiesData);
    } catch (error) {
      console.error("Failed to load preferred universities:", error);

      setPreferredUniversities([]);

      toast.error("Failed to load universities");
    } finally {
      setLoadingUniversities(false);
    }
  };
  const loadPreferredCourses = async (universityId: string) => {
    if (!universityId) {
      setPreferredCourses([]);
      return;
    }

    try {
      setLoadingCourses(true);

      const response = await fetch(`/api/universities/${universityId}`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load courses");
      }

      const result = await response.json();

      setPreferredCourses(
        Array.isArray(result.data?.courses) ? result.data.courses : [],
      );
    } catch (error) {
      console.error("Failed to load preferred courses:", error);
      setPreferredCourses([]);
    } finally {
      setLoadingCourses(false);
    }
  };
  const createPreferredUniversity = async () => {
    const name = preferredUniversitySearch.trim();

    const countryName = watch("preferredCountry");

    const selectedCountry = countries.find(
      (country) => country.name === countryName,
    );

    const countryId = selectedCountry?.id;

    if (!countryId) {
      toast.error("Please select Preferred Country first");
      return;
    }

    if (!name) {
      toast.error("Please enter university name");
      return;
    }

    try {
      setCreatingUniversity(true);

      const existing = preferredUniversities.find(
        (university) =>
          university.name.trim().toLowerCase() === name.toLowerCase(),
      );

      if (existing) {
        setValue("preferredUniversityId", existing.id, {
          shouldDirty: true,
          shouldValidate: true,
        });

        await loadPreferredCourses(existing.id);

        setPreferredUniversityOpen(false);
        setPreferredUniversitySearch("");

        return;
      }

      const response = await fetch("/api/universities", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          countryId,
          tier: "T4",
          status: "active",
          courses: [],
          scholarships: [],
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.message || "Failed to create university");
      }

      const university: PreferredUniversity = result.data;

      setPreferredUniversities((current) => [...current, university]);

      setValue("preferredUniversityId", university.id, {
        shouldDirty: true,
        shouldValidate: true,
      });

      setPreferredCourses([]);

      setValue("preferredCourseId", "", {
        shouldDirty: true,
        shouldValidate: true,
      });

      setPreferredUniversitySearch("");
      setPreferredUniversityOpen(false);

      toast.success("University added successfully");
    } catch (error) {
      console.error("Create university error:", error);

      toast.error(
        error instanceof Error ? error.message : "Failed to add university",
      );
    } finally {
      setCreatingUniversity(false);
    }
  };
  const createPreferredCourse = async () => {
    const name = preferredCourseSearch.trim();
    const universityId = watch("preferredUniversityId");

    if (!universityId) {
      toast.error("Please select Preferred University first");
      return;
    }

    if (!name) {
      toast.error("Please enter course name");
      return;
    }

    try {
      setCreatingCourse(true);

      const existing = preferredCourses.find(
        (course) => course.name.trim().toLowerCase() === name.toLowerCase(),
      );

      if (existing) {
        setValue("preferredCourseId", existing.id, {
          shouldDirty: true,
          shouldValidate: true,
        });

        setPreferredCourseOpen(false);
        setPreferredCourseSearch("");

        return;
      }

      const response = await fetch(`/api/universities/${universityId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          courses: [
            ...preferredCourses.map((course) => ({
              id: course.id,
              name: course.name,
              universityId,
            })),
            {
              name,
              universityId,
            },
          ],
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.message || "Failed to create course");
      }

      await loadPreferredCourses(universityId);

      const createdCourse = result.data?.courses?.find(
        (course: PreferredCourse) =>
          course.name.trim().toLowerCase() === name.toLowerCase(),
      );

      if (createdCourse) {
        setValue("preferredCourseId", createdCourse.id, {
          shouldDirty: true,
          shouldValidate: true,
        });
      }

      setPreferredCourseSearch("");
      setPreferredCourseOpen(false);

      toast.success("Course added successfully");
    } catch (error) {
      console.error("Create course error:", error);

      toast.error(
        error instanceof Error ? error.message : "Failed to add course",
      );
    } finally {
      setCreatingCourse(false);
    }
  };
  const getCurrentDateTimeLocal = () => {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      counsellingDate: getCurrentDateTimeLocal(),

      studentName: "",
      mobileNumber: "",
      emailId: "",
      branchId: "",

      fatherName: "",
      place: "",
      passport: "",
      passportExpireDate: "",
      source: "",

      graduationStatus: undefined,
      loanRequirement: false,
      counselorIds: [],
      loanNote: "",
      fintechAssigneeId: null,

      tenthPercentage: undefined,
      tenthYearOfPassing: undefined,
      twelfthPercentage: undefined,
      twelfthYearOfPassing: undefined,
      bachelorsCourse: "",
      bachelorsUniversityName: "",
      bachelorsPercentage: undefined,
      bachelorsYearOfPassing: undefined,
      backlogs: 0,
      moi: "",
      gapsIfAny: "",

      englishTests: [],

      greGmatScore: undefined,
      quantitativeScore: undefined,
      verbalScore: undefined,
      analyticalWritingScore: undefined,

      preferredCountry: "",
      preferredIntake: "",
      preferredUniversityId: "",
      preferredCourseId: "",
      preferredTiers: [],
      workExperience: "",

      status: "NEW",
    },
  });
  useEffect(() => {
    console.log("Errors:", errors);
  }, [errors]);
  const loanRequired = watch("loanRequirement");
  useEffect(() => {
    if (!loanRequired) {
      setValue("fintechAssigneeId", null, {
        shouldValidate: true,
        shouldDirty: false,
      });
    }
  }, [loanRequired, setValue]);
  const {
    fields: englishTestFields,
    append: appendEnglishTest,
    remove: removeEnglishTest,
  } = useFieldArray({
    control,
    name: "englishTests",
  });
  const selectedBranchId = watch("branchId");

  interface Counselor {
    id: string;
    name: string;
    email: string;
  }
  const buildScoreInputHandler =
    (maxScore: number, decimals: number) =>
    (event: FormEvent<HTMLInputElement>) => {
      const input = event.currentTarget;

      let value = input.value.replace(/[^0-9.]/g, "");

      // Remove additional decimal points
      const parts = value.split(".");

      if (parts.length > 2) {
        value = `${parts[0]}.${parts.slice(1).join("")}`;
      }

      // Whole-number tests
      if (decimals === 0) {
        value = value.replace(/\./g, "");
      }

      // Decimal tests such as IELTS
      if (decimals > 0 && value.includes(".")) {
        const [integerPart, decimalPart = ""] = value.split(".");

        value = `${integerPart}.${decimalPart.slice(0, decimals)}`;
      }

      // Prevent score above maximum
      if (value !== "" && value !== ".") {
        const numericValue = Number(value);

        if (!Number.isNaN(numericValue) && numericValue > maxScore) {
          value = String(maxScore);
        }
      }

      input.value = value;
    };
  const addEnglishTest = (testType: EnglishTestType) => {
    const alreadyAdded = englishTestFields.some(
      (test) => test.testType === testType,
    );

    if (alreadyAdded) {
      toast.error(`${testType} has already been added`);
      return;
    }

    appendEnglishTest({
      testType,
      totalScore: undefined,
      listeningScore: undefined,
      readingScore: undefined,
      writingScore: undefined,
      speakingScore: undefined,
    });
  };
  const { data: counselors = [], isLoading: counselorsLoading } = useQuery<
    Counselor[]
  >({
    queryKey: ["counselors", selectedBranchId],

    queryFn: async () => {
      const { data } = await api.get(
        `/users/branch-dropdown/${selectedBranchId}`,
      );

      return data?.data ?? [];
    },

    enabled: Boolean(selectedBranchId),
  });

  useEffect(() => {
    setValue("counselorIds", []);
  }, [selectedBranchId, setValue]);
  useEffect(() => {
    const loadMasters = async () => {
      try {
        const [countryData, intakeData, sourceData] = await Promise.all([
          getCountries(),
          getIntakes(),
          getLeadSources(),
        ]);

        setCountries(countryData);
        setIntakes(intakeData);
        setLeadSources(sourceData);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load master data");
      }
    };

    loadMasters();
  }, []);

  const onSubmit = async (values: LeadFormValues, continueFlow = false) => {
    setIsSaving(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leads`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data?.message || data?.error || "Failed to create walkin");

        return;
      }

      toast.success("Walkin created successfully");

      queryClient.invalidateQueries({ queryKey: ["notifications"] });

      if (continueFlow) {
        router.push("/leads/all");
        return;
      }

      reset();
    } catch (error: any) {
      console.error(error);

      toast.error(error?.message || "Failed to create walkin");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <PageTransition>
      <RoutePermission action="create" moduleCode={MODULES.MASTER_LEADS}>
        <div className="mx-auto max-w-6xl space-y-6 pb-12">
          <PageHeader
            title="Add New Walkin"
            description="Register a new student for counselling and process tracking."
          />

          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <form className="space-y-8">
              <Accordion
                type="multiple"
                defaultValue={["basic"]}
                className="space-y-4"
              >
                <AccordionItem
                  value="basic"
                  className="rounded-2xl border bg-card"
                >
                  <AccordionTrigger className="overflow-hidden border-t-4 border-t-primary rounded-2xl shadow-sm">
                    <div className=" px-6 py-4">
                      <h3 className="flex items-center text-lg font-semibold text-foreground">
                        <MapPin className="mr-2 h-5 w-5 text-primary" />
                        Basic Information
                      </h3>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="p-6">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                      <div className="space-y-2">
                        <Label className="after:content-['*'] after:ml-0.5 after:text-red-500">
                          Branch
                        </Label>

                        <Controller
                          control={control}
                          name="branchId"
                          render={({ field }) => (
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select Branch" />
                              </SelectTrigger>

                              <SelectContent>
                                {branches.map((branch: Branch) => (
                                  <SelectItem key={branch.id} value={branch.id}>
                                    {branch.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />

                        {errors.branchId && (
                          <p className="text-sm font-medium text-destructive">
                            {errors.branchId.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="counsellingDate">
                          Application Date
                        </Label>
                        <Input
                          id="counsellingDate"
                          type="datetime-local"
                          defaultValue={new Date().toISOString().slice(0, 16)}
                          {...register("counsellingDate")}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="studentName"
                          className="after:content-['*'] after:ml-0.5 after:text-red-500"
                        >
                          Student Name
                        </Label>
                        <Input
                          id="studentName"
                          placeholder="ex: Rahul"
                          {...register("studentName")}
                        />
                        {errors.studentName && (
                          <p className="text-sm font-medium text-destructive">
                            {errors.studentName.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="fatherName">Father Name</Label>
                        <Input
                          id="fatherName"
                          placeholder="ex: Venkatesh"
                          {...register("fatherName")}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="mobileNumber"
                          className="after:content-['*'] after:ml-0.5 after:text-red-500"
                        >
                          Mobile Number
                        </Label>
                        <Input
                          type="tel"
                          id="mobileNumber"
                          placeholder="9876543210"
                          maxLength={10}
                          min={0}
                          // This event handler ensures only numbers are accepted
                          onInput={(e: FormEvent<HTMLInputElement>) => {
                            e.currentTarget.value =
                              e.currentTarget.value.replace(/[^0-9]/g, "");
                          }}
                          {...register("mobileNumber")}
                        />
                        {errors.mobileNumber && (
                          <p className="text-sm font-medium text-destructive">
                            {errors.mobileNumber.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="emailId"
                          className="after:content-['*'] after:ml-0.5 after:text-red-500"
                        >
                          Email Address
                        </Label>
                        <Input
                          id="emailId"
                          type="email"
                          placeholder="rahul@example.com"
                          {...register("emailId")}
                        />
                        {errors.emailId && (
                          <p className="text-sm font-medium text-destructive">
                            {errors.emailId.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="place">City / Place</Label>
                        <Input
                          id="place"
                          placeholder="Hyderabad"
                          {...register("place")}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="passport">Passport Number</Label>
                        <Input
                          id="passport"
                          placeholder="U12345678"
                          {...register("passport")}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="passportExpireDate">
                          Passport Expiry Date
                        </Label>

                        <Input
                          id="passportExpireDate"
                          type="date"
                          {...register("passportExpireDate")}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Walkin Source</Label>
                        <Controller
                          control={control}
                          name="source"
                          render={({ field }) => (
                            <Select
                              value={field.value ?? ""}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select Source" />
                              </SelectTrigger>

                              <SelectContent>
                                {leadSources.map((item) => (
                                  <SelectItem key={item.id} value={item.name}>
                                    {item.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Assign User</Label>

                        <Controller
                          control={control}
                          name="counselorIds"
                          render={({ field }) => (
                            <Select
                              disabled={!selectedBranchId || counselorsLoading}
                              value={field.value?.[0] ?? ""}
                              onValueChange={(value) => field.onChange([value])}
                            >
                              <SelectTrigger>
                                <SelectValue
                                  placeholder={
                                    !selectedBranchId
                                      ? "Select Branch First"
                                      : counselorsLoading
                                        ? "Loading Counsellors..."
                                        : "Select Counsellor"
                                  }
                                />
                              </SelectTrigger>

                              <SelectContent>
                                {counselors.map((counselor) => (
                                  <SelectItem
                                    key={counselor.id}
                                    value={counselor.id}
                                  >
                                    {counselor.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>

                      <div className="space-y-3">
                        <Label>Loan Requirement</Label>

                        <Controller
                          control={control}
                          name="loanRequirement"
                          render={({ field }) => (
                            <RadioGroup
                              value={field.value ? "yes" : "no"}
                              onValueChange={(value) =>
                                field.onChange(value === "yes")
                              }
                              className="flex h-10 items-center gap-6"
                            >
                              <div className="flex items-center gap-2">
                                <RadioGroupItem value="yes" id="loan-yes" />
                                <Label
                                  htmlFor="loan-yes"
                                  className="cursor-pointer"
                                >
                                  Yes
                                </Label>
                              </div>

                              <div className="flex items-center gap-2">
                                <RadioGroupItem value="no" id="loan-no" />
                                <Label
                                  htmlFor="loan-no"
                                  className="cursor-pointer"
                                >
                                  No
                                </Label>
                              </div>
                            </RadioGroup>
                          )}
                        />
                      </div>
                      {loanRequired && (
                        <div className="space-y-2">
                          <Label>Assign Fintech</Label>

                          <Controller
                            control={control}
                            name="fintechAssigneeId"
                            render={({ field }) => (
                              <Select
                                disabled={
                                  !selectedBranchId || counselorsLoading
                                }
                                value={(field.value as string) ?? ""}
                                onValueChange={(value) => field.onChange(value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select Fintech" />
                                </SelectTrigger>

                                <SelectContent>
                                  {counselors.map((user) => (
                                    <SelectItem key={user.id} value={user.id}>
                                      {user?.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          />
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
                {/* Section 2: Educational Information & Experience */}
                {/* Education */}
                <AccordionItem
                  value="education"
                  className="rounded-2xl border bg-card"
                >
                  <AccordionTrigger className="overflow-hidden border-t-4 rounded-2xl border-t-primary shadow-sm">
                    <div className="px-6 py-4 ">
                      <h3 className="flex items-center text-lg font-semibold text-foreground">
                        <GraduationCap className="mr-2 h-5 w-5 text-blue-500" />
                        Educational Information & Experience
                      </h3>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-8 p-6">
                    {/* Schooling */}
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                      <div className="space-y-2">
                        <Label>10th Percentage (%)</Label>
                        <Input
                          type="text"
                          inputMode="decimal"
                          placeholder="e.g. 85 or 75.44"
                          maxLength={5} // Maximum: 99.99 (5 characters)
                          {...register("tenthPercentage", {
                            setValueAs: (v) =>
                              v === "" ? undefined : Number(v),
                            validate: (value) => {
                              if (value === undefined || value === "")
                                return true;

                              const str = String(value);

                              // Allows only numbers with up to 2 decimal places
                              return (
                                /^\d{1,2}(\.\d{1,2})?$/.test(str) ||
                                "Enter a valid percentage"
                              );
                            },
                          })}
                          onKeyDown={(e) => {
                            // Prevent minus, plus, exponent
                            if (["-", "+", "e", "E"].includes(e.key)) {
                              e.preventDefault();
                            }
                          }}
                          onInput={(e) => {
                            const input = e.currentTarget;

                            // Remove everything except digits and one decimal point
                            let value = input.value.replace(/[^0-9.]/g, "");

                            // Keep only first decimal point
                            const parts = value.split(".");
                            if (parts.length > 2) {
                              value = parts[0] + "." + parts.slice(1).join("");
                            }

                            // Limit integer part to 2 digits and decimal part to 2 digits
                            if (value.includes(".")) {
                              const [intPart, decimalPart] = value.split(".");
                              value =
                                intPart.slice(0, 2) +
                                "." +
                                decimalPart.slice(0, 2);
                            } else {
                              value = value.slice(0, 2);
                            }

                            input.value = value;
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>10th Year of Passing</Label>
                        <Input
                          type="text"
                          inputMode="numeric"
                          placeholder="YYYY"
                          maxLength={4}
                          {...register("tenthYearOfPassing", {
                            setValueAs: (v) =>
                              v === "" ? undefined : Number(v),
                            validate: (value) => {
                              if (value === undefined || value === "")
                                return true;
                              return (
                                /^\d{4}$/.test(String(value)) ||
                                "Enter a valid 4-digit year"
                              );
                            },
                          })}
                          onKeyDown={(e) => {
                            // Prevent non-numeric special keys
                            if (["-", "+", ".", "e", "E"].includes(e.key)) {
                              e.preventDefault();
                            }
                          }}
                          onInput={(e) => {
                            const input = e.currentTarget;
                            input.value = input.value
                              .replace(/\D/g, "")
                              .slice(0, 4);
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>12th Percentage (%)</Label>
                        <Input
                          type="text"
                          inputMode="decimal"
                          placeholder="e.g. 88 or 75.44"
                          maxLength={5}
                          {...register("twelfthPercentage", {
                            setValueAs: (v) =>
                              v === "" ? undefined : Number(v),
                            validate: (value) => {
                              if (value === undefined || value === "")
                                return true;

                              return (
                                /^\d{1,2}(\.\d{1,2})?$/.test(String(value)) ||
                                "Enter a valid percentage"
                              );
                            },
                          })}
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

                            // Limit to 2 digits before decimal and 2 digits after decimal
                            if (value.includes(".")) {
                              const [intPart, decimalPart] = value.split(".");
                              value =
                                intPart.slice(0, 2) +
                                "." +
                                decimalPart.slice(0, 2);
                            } else {
                              value = value.slice(0, 2);
                            }

                            input.value = value;
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>12th Year of Passing</Label>
                        <Input
                          type="text"
                          inputMode="numeric"
                          placeholder="YYYY"
                          maxLength={4}
                          {...register("twelfthYearOfPassing", {
                            setValueAs: (v) =>
                              v === "" ? undefined : Number(v),
                            validate: (value) => {
                              if (value === undefined || value === "")
                                return true;
                              return (
                                /^\d{4}$/.test(String(value)) ||
                                "Enter a valid 4-digit year"
                              );
                            },
                          })}
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
                        />
                      </div>
                    </div>

                    <div className="border-t pt-6" />

                    {/* Bachelors */}
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                      Bachelor's Degree
                    </h4>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                      <div className="space-y-2 lg:col-span-2">
                        <Label>University / College Name</Label>
                        <Controller
                          control={control}
                          name="bachelorsUniversityName"
                          render={({ field }) => (
                            <Popover
                              open={bachelorsUniversityOpen}
                              onOpenChange={setBachelorsUniversityOpen}
                            >
                              <PopoverTrigger asChild>
                                <Button
                                  type="button"
                                  variant="outline"
                                  role="combobox"
                                  className="w-full justify-between"
                                >
                                  {field.value || "Select or Type University"}

                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </PopoverTrigger>

                              <PopoverContent className="w-112.5 p-0">
                                <Command>
                                  <CommandInput
                                    placeholder="Search university..."
                                    value={bachelorsUniversitySearch}
                                    onValueChange={setBachelorsUniversitySearch}
                                  />

                                  <CommandList>
                                    <CommandEmpty>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        className="w-full justify-start"
                                        onClick={async () => {
                                          const value =
                                            bachelorsUniversitySearch.trim();

                                          if (!value) return;

                                          try {
                                            await createUniversity(value);

                                            field.onChange(value);

                                            setBachelorsUniversityOpen(false);

                                            setBachelorsUniversitySearch("");

                                            toast.success(
                                              "University added successfully",
                                            );
                                          } catch {
                                            toast.error(
                                              "Failed to create university",
                                            );
                                          }
                                        }}
                                      >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add "{bachelorsUniversitySearch}"
                                      </Button>
                                    </CommandEmpty>

                                    <CommandGroup>
                                      {universities.map(
                                        (uni: { id: string; name: string }) => (
                                          <CommandItem
                                            key={uni.id}
                                            value={uni.name}
                                            onSelect={(currentValue) => {
                                              field.onChange(currentValue);

                                              setBachelorsUniversityOpen(false);
                                            }}
                                          >
                                            <Check
                                              className={cn(
                                                "mr-2 h-4 w-4",
                                                field.value === uni.name
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
                          )}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Course / Major</Label>
                        <Controller
                          control={control}
                          name="bachelorsCourse"
                          render={({ field }) => (
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select Course" />
                              </SelectTrigger>

                              <SelectContent>
                                {coursesLoad ? (
                                  <SelectItem value="loading" disabled>
                                    loading courses...
                                  </SelectItem>
                                ) : (
                                  courses.map(
                                    (
                                      course: { id: string; name: string },
                                      idx: number,
                                    ) => (
                                      <SelectItem
                                        key={course.id || idx}
                                        value={course.name}
                                      >
                                        {course.name}
                                      </SelectItem>
                                    ),
                                  )
                                )}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>CGPA / Percentage</Label>
                        <Input
                          type="text"
                          inputMode="decimal"
                          placeholder="e.g. 75 or 8.5"
                          maxLength={6}
                          {...register("bachelorsPercentage", {
                            setValueAs: (v) =>
                              v === "" ? undefined : Number(v),
                            validate: (value) => {
                              if (value === undefined || value === "")
                                return true;

                              const num = Number(value);

                              if (isNaN(num)) return "Enter a valid number";

                              // Allow CGPA (0–10) OR Percentage (0–100)
                              if (num < 0 || num > 100) {
                                return "Enter a valid CGPA (0–10) or Percentage (0–100)";
                              }

                              // Maximum 2 decimal places
                              if (
                                !/^\d{1,3}(\.\d{1,2})?$/.test(String(value))
                              ) {
                                return "Maximum 2 decimal places allowed";
                              }

                              return true;
                            },
                          })}
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

                            if (value.includes(".")) {
                              const [intPart, decimalPart] = value.split(".");
                              value =
                                intPart.slice(0, 3) +
                                "." +
                                decimalPart.slice(0, 2);
                            } else {
                              value = value.slice(0, 3);
                            }

                            input.value = value;
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Year of Passing</Label>
                        <Input
                          type="text"
                          inputMode="numeric"
                          placeholder="YYYY"
                          maxLength={4}
                          {...register("bachelorsYearOfPassing", {
                            setValueAs: (v) =>
                              v === "" ? undefined : Number(v),
                            validate: (value) => {
                              if (value === undefined || value === "")
                                return true;

                              return (
                                /^\d{4}$/.test(String(value)) ||
                                "Enter a valid 4-digit year"
                              );
                            },
                          })}
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
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Active Backlogs</Label>
                        <Input
                          type="text"
                          inputMode="numeric"
                          placeholder="0"
                          maxLength={2} // Adjust if you want more than 99 backlogs
                          {...register("backlogs", {
                            setValueAs: (v) =>
                              v === "" ? undefined : Number(v),
                            validate: (value) => {
                              if (value === undefined || value === "")
                                return true;

                              return (
                                /^\d+$/.test(String(value)) ||
                                "Enter a valid number"
                              );
                            },
                          })}
                          onKeyDown={(e) => {
                            // Prevent minus, plus, decimal, exponent
                            if (["-", "+", ".", "e", "E"].includes(e.key)) {
                              e.preventDefault();
                            }
                          }}
                          onInput={(e) => {
                            const input = e.currentTarget;

                            // Allow only digits
                            input.value = input.value
                              .replace(/\D/g, "")
                              .slice(0, 2);
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Graduation Status</Label>

                        <Controller
                          control={control}
                          name="graduationStatus"
                          render={({ field }) => (
                            <Select
                              value={field.value as string | undefined}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select Graduation Status" />
                              </SelectTrigger>

                              <SelectContent>
                                <SelectItem value="completed">
                                  Completed
                                </SelectItem>

                                <SelectItem value="pursuing">
                                  Pursuing
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                    </div>

                    <div className="space-y-2 pt-2">
                      <Label>Education Gaps (If Any)</Label>
                      <Textarea
                        placeholder="Explain any gaps in education..."
                        rows={2}
                        {...register("gapsIfAny")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center">
                        <Briefcase className="mr-2 h-4 w-4" /> Work Experience
                      </Label>
                      <Textarea
                        placeholder="Details of current or past employment..."
                        rows={2}
                        {...register("workExperience")}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
                {/* Section 3: EPT Details */}
                <AccordionItem
                  value="scores"
                  className="rounded-2xl border bg-card"
                >
                  <AccordionTrigger className="overflow-hidden border-t-4 border-t-primary rounded-2xl shadow-sm">
                    <div className=" px-6 py-4 ">
                      <h3 className="flex items-center text-lg font-semibold text-foreground">
                        <BookOpen className="mr-2 h-5 w-5 text-purple-500" />
                        EPT Details
                      </h3>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-8 p-6">
                    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.7fr)]">
                      {/* English Proficiency Tests */}
                      <div className="space-y-5 rounded-2xl border bg-muted/20 p-4 sm:p-5">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-primary" />

                            <h4 className="font-semibold text-foreground">
                              English Proficiency Tests
                            </h4>
                          </div>

                          <p className="text-sm text-muted-foreground">
                            Add one or more tests completed by the student.
                          </p>
                        </div>
                        {/* Medium of Instruction */}
                        <div className="border-b pb-3">
                          <div className="space-y-6">
                            <Label
                              htmlFor="moi"
                              className="text-sm font-semibold"
                            >
                              Medium of Instruction (MOI)
                            </Label>

                            <Input
                              id="moi"
                              placeholder="e.g. English"
                              {...register("moi")}
                              className="h-11 rounded-xl"
                            />
                          </div>
                        </div>
                        {/* Available Tests */}
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                          {englishTestOptions.map((testType) => {
                            const isAdded = englishTestFields.some(
                              (test) => test.testType === testType,
                            );

                            return (
                              <Button
                                key={testType}
                                type="button"
                                variant={isAdded ? "secondary" : "outline"}
                                disabled={isAdded}
                                onClick={() => addEnglishTest(testType)}
                                className="h-auto min-h-20 flex-col gap-2 rounded-xl px-3 py-4"
                              >
                                {isAdded ? (
                                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                ) : (
                                  <Plus className="h-5 w-5" />
                                )}

                                <span className="text-sm font-semibold">
                                  {testType}
                                </span>

                                <span className="text-[11px] font-normal text-muted-foreground">
                                  {isAdded ? "Added" : "Add Test"}
                                </span>
                              </Button>
                            );
                          })}
                        </div>

                        {/* Selected Tests */}
                        {englishTestFields.map((test, index) => {
                          const testType = test.testType as EnglishTestType;

                          const limits = englishTestScoreLimits[testType];

                          const scoreFields = [
                            {
                              name: "totalScore",
                              label: "Total Score",
                              max: limits.total,
                            },
                            {
                              name: "listeningScore",
                              label: "Listening",
                              max: limits.section,
                            },
                            {
                              name: "readingScore",
                              label: "Reading",
                              max: limits.section,
                            },
                            {
                              name: "writingScore",
                              label: "Writing",
                              max: limits.section,
                            },
                            {
                              name: "speakingScore",
                              label: "Speaking",
                              max: limits.section,
                            },
                          ] as const;

                          return (
                            <div
                              key={test.id}
                              className="overflow-hidden rounded-2xl border bg-background shadow-sm"
                            >
                              {/* Header */}
                              <div className="flex items-center justify-between gap-3 border-b bg-muted/30 px-4 py-3">
                                <div className="flex min-w-0 items-center gap-3">
                                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                                    <BookOpen className="h-4 w-4 text-primary" />
                                  </div>

                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                      <p className="truncate text-sm font-semibold">
                                        {testType}
                                      </p>

                                      <Badge
                                        variant="secondary"
                                        className="hidden sm:inline-flex"
                                      >
                                        English Test
                                      </Badge>
                                    </div>

                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                      Total max {limits.total} · Section max{" "}
                                      {limits.section}
                                      {limits.decimals === 0
                                        ? " · Whole numbers only"
                                        : ` · ${limits.decimals} decimal allowed`}
                                    </p>
                                  </div>
                                </div>

                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeEnglishTest(index)}
                                  className="shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                  aria-label={`Remove ${testType}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>

                              {/* Hidden Test Type */}
                              <input
                                type="hidden"
                                {...register(`englishTests.${index}.testType`)}
                              />

                              {/* Score Inputs */}
                              <div className="p-4">
                                <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
                                  {scoreFields.map((scoreField) => {
                                    const fieldError =
                                      errors.englishTests?.[index]?.[
                                        scoreField.name
                                      ];

                                    return (
                                      <div
                                        key={scoreField.name}
                                        className={
                                          scoreField.name === "totalScore"
                                            ? "col-span-2 space-y-2 lg:col-span-1"
                                            : "space-y-2"
                                        }
                                      >
                                        <Label
                                          htmlFor={`englishTests-${index}-${scoreField.name}`}
                                          className="text-xs font-medium"
                                        >
                                          {scoreField.label}
                                        </Label>

                                        <Input
                                          id={`englishTests-${index}-${scoreField.name}`}
                                          type="text"
                                          inputMode={
                                            limits.decimals > 0
                                              ? "decimal"
                                              : "numeric"
                                          }
                                          placeholder={`Max ${scoreField.max}`}
                                          aria-invalid={Boolean(fieldError)}
                                          className={
                                            fieldError
                                              ? "border-destructive focus-visible:ring-destructive"
                                              : ""
                                          }
                                          {...register(
                                            `englishTests.${index}.${scoreField.name}`,
                                            {
                                              setValueAs: (value) =>
                                                value === ""
                                                  ? undefined
                                                  : Number(value),
                                            },
                                          )}
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
                                          onInput={buildScoreInputHandler(
                                            scoreField.max,
                                            limits.decimals,
                                          )}
                                        />

                                        {fieldError?.message && (
                                          <p className="text-xs font-medium text-destructive">
                                            {fieldError.message}
                                          </p>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {/* Summary */}
                        {englishTestFields.length > 0 && (
                          <div className="flex flex-col gap-2 rounded-xl bg-muted/40 px-4 py-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                            <span>
                              {englishTestFields.length}{" "}
                              {englishTestFields.length === 1
                                ? "test"
                                : "tests"}{" "}
                              added
                            </span>

                            <span>
                              {4 - englishTestFields.length} remaining
                            </span>
                          </div>
                        )}
                      </div>

                      {/* GRE/GMAT */}
                      <div className="space-y-4 rounded-xl border p-4 bg-muted/20">
                        <h4 className="font-medium text-foreground">
                          GRE / GMAT
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2 col-span-2">
                            <Label>Total Score</Label>
                            <Input
                              placeholder="Overall Score"
                              type="number"
                              inputMode="decimal"
                              maxLength={6}
                              {...register("greGmatScore", {
                                setValueAs: (v) =>
                                  v === "" ? undefined : Number(v),
                                validate: (value) => {
                                  if (value === undefined || value === "")
                                    return true;

                                  const num = Number(value);

                                  return (
                                    (!isNaN(num) &&
                                      num >= 0 &&
                                      num <= 10 &&
                                      /^\d{1,2}(\.\d{1,2})?$/.test(
                                        String(value),
                                      )) ||
                                    "Enter a valid score"
                                  );
                                },
                              })}
                              onKeyDown={(e) => {
                                if (["-", "+", "e", "E"].includes(e.key)) {
                                  e.preventDefault();
                                }
                              }}
                              onInput={(e) => {
                                const input = e.currentTarget;
                                let value = input.value.replace(/[^0-9.]/g, "");

                                const parts = value.split(".");
                                if (parts.length > 2) {
                                  value =
                                    parts[0] + "." + parts.slice(1).join("");
                                }

                                if (value.includes(".")) {
                                  const [intPart, decimalPart] =
                                    value.split(".");
                                  value =
                                    intPart.slice(0, 2) +
                                    "." +
                                    decimalPart.slice(0, 2);
                                } else {
                                  value = value.slice(0, 2);
                                }

                                // Clamp to max 10
                                if (value !== "" && value !== ".") {
                                  const num = Number(value);
                                  if (!isNaN(num) && num > 10) {
                                    value = "10";
                                  }
                                }
                                input.value = value;
                              }}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Quantitative (Q)</Label>
                            <Input
                              placeholder="Q Score"
                              type="number"
                              inputMode="decimal"
                              maxLength={6}
                              {...register("quantitativeScore", {
                                setValueAs: (v) =>
                                  v === "" ? undefined : Number(v),
                                validate: (value) => {
                                  if (value === undefined || value === "")
                                    return true;

                                  const num = Number(value);

                                  return (
                                    (!isNaN(num) &&
                                      num >= 0 &&
                                      num <= 10 &&
                                      /^\d{1,2}(\.\d{1,2})?$/.test(
                                        String(value),
                                      )) ||
                                    "Enter a valid score"
                                  );
                                },
                              })}
                              onKeyDown={(e) => {
                                if (["-", "+", "e", "E"].includes(e.key)) {
                                  e.preventDefault();
                                }
                              }}
                              onInput={(e) => {
                                const input = e.currentTarget;
                                let value = input.value.replace(/[^0-9.]/g, "");

                                const parts = value.split(".");
                                if (parts.length > 2) {
                                  value =
                                    parts[0] + "." + parts.slice(1).join("");
                                }

                                if (value.includes(".")) {
                                  const [intPart, decimalPart] =
                                    value.split(".");
                                  value =
                                    intPart.slice(0, 2) +
                                    "." +
                                    decimalPart.slice(0, 2);
                                } else {
                                  value = value.slice(0, 2);
                                }

                                // Clamp to max 10
                                if (value !== "" && value !== ".") {
                                  const num = Number(value);
                                  if (!isNaN(num) && num > 10) {
                                    value = "10";
                                  }
                                }

                                input.value = value;
                              }}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Verbal (V)</Label>
                            <Input
                              placeholder="V Score"
                              type="number"
                              inputMode="decimal"
                              maxLength={6}
                              {...register("verbalScore", {
                                setValueAs: (v) =>
                                  v === "" ? undefined : Number(v),
                                validate: (value) => {
                                  if (value === undefined || value === "")
                                    return true;

                                  const num = Number(value);

                                  return (
                                    (!isNaN(num) &&
                                      num >= 0 &&
                                      num <= 10 &&
                                      /^\d{1,2}(\.\d{1,2})?$/.test(
                                        String(value),
                                      )) ||
                                    "Enter a valid score"
                                  );
                                },
                              })}
                              onKeyDown={(e) => {
                                if (["-", "+", "e", "E"].includes(e.key)) {
                                  e.preventDefault();
                                }
                              }}
                              onInput={(e) => {
                                const input = e.currentTarget;
                                let value = input.value.replace(/[^0-9.]/g, "");

                                const parts = value.split(".");
                                if (parts.length > 2) {
                                  value =
                                    parts[0] + "." + parts.slice(1).join("");
                                }

                                if (value.includes(".")) {
                                  const [intPart, decimalPart] =
                                    value.split(".");
                                  value =
                                    intPart.slice(0, 2) +
                                    "." +
                                    decimalPart.slice(0, 2);
                                } else {
                                  value = value.slice(0, 2);
                                }

                                // Clamp to max 10
                                if (value !== "" && value !== ".") {
                                  const num = Number(value);
                                  if (!isNaN(num) && num > 10) {
                                    value = "10";
                                  }
                                }

                                input.value = value;
                              }}
                            />
                          </div>
                          <div className="space-y-2 col-span-2">
                            <Label className="text-xs">
                              Analytical Writing (AWA)
                            </Label>
                            <Input
                              placeholder="AWA Score"
                              type="number"
                              inputMode="decimal"
                              step="0.5"
                              maxLength={6}
                              {...register("analyticalWritingScore", {
                                setValueAs: (v) =>
                                  v === "" ? undefined : Number(v),
                                validate: (value) => {
                                  if (value === undefined || value === "")
                                    return true;

                                  const num = Number(value);

                                  return (
                                    (!isNaN(num) &&
                                      num >= 0 &&
                                      num <= 10 &&
                                      /^\d{1,2}(\.\d{1,2})?$/.test(
                                        String(value),
                                      )) ||
                                    "Enter a valid score"
                                  );
                                },
                              })}
                              onKeyDown={(e) => {
                                if (["-", "+", "e", "E"].includes(e.key)) {
                                  e.preventDefault();
                                }
                              }}
                              onInput={(e) => {
                                const input = e.currentTarget;
                                let value = input.value.replace(/[^0-9.]/g, "");

                                const parts = value.split(".");
                                if (parts.length > 2) {
                                  value =
                                    parts[0] + "." + parts.slice(1).join("");
                                }

                                if (value.includes(".")) {
                                  const [intPart, decimalPart] =
                                    value.split(".");
                                  value =
                                    intPart.slice(0, 2) +
                                    "." +
                                    decimalPart.slice(0, 2);
                                } else {
                                  value = value.slice(0, 2);
                                }

                                // Clamp to max 10
                                if (value !== "" && value !== ".") {
                                  const num = Number(value);
                                  if (!isNaN(num) && num > 10) {
                                    value = "10";
                                  }
                                }

                                input.value = value;
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                {/* Section 4: Preferences */}
                <AccordionItem
                  value="preferences"
                  className="rounded-2xl border bg-card"
                >
                  <AccordionTrigger className="overflow-hidden border-t-4 border-t-primary rounded-2xl shadow-sm">
                    <div className=" px-6 py-4 ">
                      <h3 className="flex items-center text-lg font-semibold text-foreground">
                        <Globe className="mr-2 h-5 w-5 text-emerald-500" />
                        Study Preferences
                      </h3>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-6 pt-2 sm:px-6">
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
                      {/* Preferred Country */}
                      <div className="min-w-0 space-y-2">
                        <Label
                          htmlFor="preferred-country"
                          className="text-sm font-medium"
                        >
                          Preferred Country
                        </Label>

                        <Controller
                          control={control}
                          name="preferredCountry"
                          render={({ field }) => (
                            <Select
                              value={field.value ?? ""}
                              onValueChange={(countryName) => {
                                field.onChange(countryName);

                                const selectedCountry = countries.find(
                                  (country) => country.name === countryName,
                                );

                                setValue("preferredUniversityId", "", {
                                  shouldDirty: true,
                                  shouldValidate: true,
                                });

                                setValue("preferredCourseId", "", {
                                  shouldDirty: true,
                                  shouldValidate: true,
                                });

                                setPreferredUniversities([]);
                                setPreferredCourses([]);

                                setPreferredUniversitySearch("");
                                setPreferredCourseSearch("");

                                setPreferredUniversityOpen(false);
                                setPreferredCourseOpen(false);

                                if (selectedCountry?.id) {
                                  loadPreferredUniversities(selectedCountry.id);
                                }
                              }}
                            >
                              <SelectTrigger
                                id="preferred-country"
                                className="h-11 w-full min-w-0"
                              >
                                <SelectValue placeholder="Select Country" />
                              </SelectTrigger>

                              <SelectContent>
                                {countries.map((country) => (
                                  <SelectItem
                                    key={country.id}
                                    value={country.name}
                                  >
                                    {country.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>

                      {/* Preferred Intake */}
                      <div className="min-w-0 space-y-2">
                        <Label
                          htmlFor="preferred-intake"
                          className="text-sm font-medium"
                        >
                          Preferred Intake
                        </Label>

                        <Controller
                          control={control}
                          name="preferredIntake"
                          render={({ field }) => (
                            <Select
                              value={field.value ?? ""}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger
                                id="preferred-intake"
                                className="h-11 w-full min-w-0"
                              >
                                <SelectValue placeholder="Select Intake" />
                              </SelectTrigger>

                              <SelectContent>
                                {intakes.map((intake) => (
                                  <SelectItem
                                    key={intake.id}
                                    value={intake.name}
                                  >
                                    {intake.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>

                      {/* Preferred University */}
                      <div className="min-w-0 space-y-2">
                        <Label className="text-sm font-medium">
                          Preferred University
                        </Label>

                        <Controller
                          control={control}
                          name="preferredUniversityId"
                          render={({ field }) => {
                            const selectedUniversity =
                              preferredUniversities.find(
                                (university) => university.id === field.value,
                              );

                            const filteredUniversities =
                              preferredUniversities.filter((university) =>
                                university.name
                                  .toLowerCase()
                                  .includes(
                                    preferredUniversitySearch.toLowerCase(),
                                  ),
                              );

                            const countrySelected = Boolean(
                              watch("preferredCountry"),
                            );

                            return (
                              <Popover
                                open={preferredUniversityOpen}
                                onOpenChange={setPreferredUniversityOpen}
                              >
                                <PopoverTrigger asChild>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={preferredUniversityOpen}
                                    disabled={!countrySelected}
                                    className="h-11 w-full min-w-0 justify-between gap-2 font-normal"
                                  >
                                    <span className="min-w-0 flex-1 truncate text-left">
                                      {selectedUniversity?.name ||
                                        (countrySelected
                                          ? "Select or type university"
                                          : "Select country first")}
                                    </span>

                                    <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                                  </Button>
                                </PopoverTrigger>

                                <PopoverContent
                                  className="w-(--radix-popover-trigger-width) min-w-70 max-w-[calc(100vw-2rem)] p-0"
                                  align="start"
                                  sideOffset={6}
                                >
                                  <Command shouldFilter={false}>
                                    <CommandInput
                                      placeholder="Search or type university..."
                                      value={preferredUniversitySearch}
                                      onValueChange={
                                        setPreferredUniversitySearch
                                      }
                                    />

                                    <CommandList className="max-h-72">
                                      {loadingUniversities && (
                                        <CommandEmpty>
                                          Loading universities...
                                        </CommandEmpty>
                                      )}

                                      {!loadingUniversities &&
                                        filteredUniversities.length === 0 &&
                                        !preferredUniversitySearch.trim() && (
                                          <CommandEmpty>
                                            No universities found.
                                          </CommandEmpty>
                                        )}

                                      {!loadingUniversities &&
                                        filteredUniversities.length > 0 && (
                                          <CommandGroup heading="Universities">
                                            {filteredUniversities.map(
                                              (university) => (
                                                <CommandItem
                                                  key={university.id}
                                                  value={university.id}
                                                  onSelect={() => {
                                                    field.onChange(
                                                      university.id,
                                                    );

                                                    setValue(
                                                      "preferredCourseId",
                                                      "",
                                                      {
                                                        shouldDirty: true,
                                                        shouldValidate: true,
                                                      },
                                                    );

                                                    setPreferredCourseSearch(
                                                      "",
                                                    );
                                                    setPreferredUniversityOpen(
                                                      false,
                                                    );

                                                    loadPreferredCourses(
                                                      university.id,
                                                    );
                                                  }}
                                                  className="flex min-w-0 items-center gap-2"
                                                >
                                                  <Check
                                                    className={`h-4 w-4 shrink-0 ${
                                                      field.value ===
                                                      university.id
                                                        ? "opacity-100"
                                                        : "opacity-0"
                                                    }`}
                                                  />

                                                  <span className="min-w-0 flex-1 truncate">
                                                    {university.name}
                                                  </span>

                                                  <span className="shrink-0 text-xs text-muted-foreground">
                                                    {university.tier}
                                                  </span>
                                                </CommandItem>
                                              ),
                                            )}
                                          </CommandGroup>
                                        )}

                                      {preferredUniversitySearch.trim() &&
                                        !filteredUniversities.some(
                                          (university) =>
                                            university.name
                                              .trim()
                                              .toLowerCase() ===
                                            preferredUniversitySearch
                                              .trim()
                                              .toLowerCase(),
                                        ) && (
                                          <CommandGroup>
                                            <CommandItem
                                              value={`add-${preferredUniversitySearch}`}
                                              onSelect={
                                                createPreferredUniversity
                                              }
                                              disabled={creatingUniversity}
                                              className="min-w-0"
                                            >
                                              <Plus className="mr-2 h-4 w-4 shrink-0" />

                                              <span className="min-w-0 truncate">
                                                {creatingUniversity
                                                  ? "Adding..."
                                                  : `Add "${preferredUniversitySearch.trim()}"`}
                                              </span>
                                            </CommandItem>
                                          </CommandGroup>
                                        )}
                                    </CommandList>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                            );
                          }}
                        />
                      </div>

                      {/* Preferred Course */}
                      <div className="min-w-0 space-y-2">
                        <Label className="text-sm font-medium">
                          Preferred Course
                        </Label>

                        <Controller
                          control={control}
                          name="preferredCourseId"
                          render={({ field }) => {
                            const selectedCourse = preferredCourses.find(
                              (course) => course.id === field.value,
                            );

                            const filteredCourses = preferredCourses.filter(
                              (course) =>
                                course.name
                                  .toLowerCase()
                                  .includes(
                                    preferredCourseSearch.toLowerCase(),
                                  ),
                            );

                            const universityId = watch("preferredUniversityId");
                            const universitySelected = Boolean(universityId);

                            return (
                              <Popover
                                open={preferredCourseOpen}
                                onOpenChange={setPreferredCourseOpen}
                              >
                                <PopoverTrigger asChild>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={preferredCourseOpen}
                                    disabled={!universitySelected}
                                    className="h-11 w-full min-w-0 justify-between gap-2 font-normal"
                                  >
                                    <span className="min-w-0 flex-1 truncate text-left">
                                      {selectedCourse?.name ||
                                        (universitySelected
                                          ? "Select or type course"
                                          : "Select university first")}
                                    </span>

                                    <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                                  </Button>
                                </PopoverTrigger>

                                <PopoverContent
                                  className="w-(--radix-popover-trigger-width) min-w-70 max-w-[calc(100vw-2rem)] p-0"
                                  align="start"
                                  sideOffset={6}
                                >
                                  <Command shouldFilter={false}>
                                    <CommandInput
                                      placeholder="Search or type course..."
                                      value={preferredCourseSearch}
                                      onValueChange={setPreferredCourseSearch}
                                    />

                                    <CommandList className="max-h-72">
                                      {loadingCourses && (
                                        <CommandEmpty>
                                          Loading courses...
                                        </CommandEmpty>
                                      )}

                                      {!loadingCourses &&
                                        filteredCourses.length === 0 &&
                                        !preferredCourseSearch.trim() && (
                                          <CommandEmpty>
                                            No courses found.
                                          </CommandEmpty>
                                        )}

                                      {!loadingCourses &&
                                        filteredCourses.length > 0 && (
                                          <CommandGroup heading="Courses">
                                            {filteredCourses.map((course) => (
                                              <CommandItem
                                                key={course.id}
                                                value={course.id}
                                                onSelect={() => {
                                                  field.onChange(course.id);
                                                  setPreferredCourseOpen(false);
                                                  setPreferredCourseSearch("");
                                                }}
                                                className="flex min-w-0 items-center gap-2"
                                              >
                                                <Check
                                                  className={`h-4 w-4 shrink-0 ${
                                                    field.value === course.id
                                                      ? "opacity-100"
                                                      : "opacity-0"
                                                  }`}
                                                />

                                                <span className="min-w-0 flex-1 truncate">
                                                  {course.name}
                                                </span>
                                              </CommandItem>
                                            ))}
                                          </CommandGroup>
                                        )}

                                      {preferredCourseSearch.trim() &&
                                        !filteredCourses.some(
                                          (course) =>
                                            course.name.trim().toLowerCase() ===
                                            preferredCourseSearch
                                              .trim()
                                              .toLowerCase(),
                                        ) && (
                                          <CommandGroup>
                                            <CommandItem
                                              value={`add-${preferredCourseSearch}`}
                                              onSelect={createPreferredCourse}
                                              disabled={creatingCourse}
                                              className="min-w-0"
                                            >
                                              <Plus className="mr-2 h-4 w-4 shrink-0" />

                                              <span className="min-w-0 truncate">
                                                {creatingCourse
                                                  ? "Adding..."
                                                  : `Add "${preferredCourseSearch.trim()}"`}
                                              </span>
                                            </CommandItem>
                                          </CommandGroup>
                                        )}
                                    </CommandList>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                            );
                          }}
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <div className="sticky bottom-4 z-10 flex flex-col-reverse gap-3 rounded-2xl bg-background/80 p-4 shadow-lg backdrop-blur-md border sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isSaving}
                    onClick={() => {
                      reset();
                      setPreferredUniversities([]);
                      setPreferredCourses([]);
                      setPreferredUniversitySearch("");
                      setPreferredCourseSearch("");
                      setPreferredUniversityOpen(false);
                      setPreferredCourseOpen(false);
                    }}
                  >
                    Reset Form
                  </Button>
                  <Button
                    type="button"
                    disabled={isSaving}
                    onClick={handleSubmit((values) => {
                      onSubmit(
                        {
                          ...values,
                          status: "NEW",
                        },
                        true,
                      );
                    })}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving Walkin...
                      </>
                    ) : (
                      "Save Walkin & Continue"
                    )}
                  </Button>
                </div>
              </Accordion>
            </form>
          </div>
        </div>
      </RoutePermission>
    </PageTransition>
  );
}
