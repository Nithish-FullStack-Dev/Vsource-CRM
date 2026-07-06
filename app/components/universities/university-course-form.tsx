// app\components\universities\university-course-form.tsx
"use client";

import { memo } from "react";
import { UseFieldArrayRemove, Control, useController } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Trash2, Loader2 } from "lucide-react";
import { UniversityFormValues } from "@/lib/university-schema";

interface Props {
  index: number;
  control: Control<UniversityFormValues>;
  remove: UseFieldArrayRemove;
}

const DEGREE_OPTIONS = [
  { value: "diploma", label: "Diploma" },
  { value: "bachelors", label: "Bachelors" },
  { value: "masters", label: "Masters" },
  { value: "phd", label: "PhD" },
  { value: "mba", label: "MBA" },
  { value: "certificate", label: "Certificate" },
] as const;

function UniversityCourseFormComponent({ index, control, remove }: Props) {
  // Fetch intakes from master settings
  const { data: intakesData, isLoading: intakesLoading } = useQuery({
    queryKey: ["intakes"],
    queryFn: async () => {
      const res = await axios.get("/api/intakes?limit=100");
      return (res.data.data ?? []) as { id: string; name: string }[];
    },
    staleTime: 5 * 60 * 1000, // cache for 5 mins — rarely changes
  });
  const intakes = intakesData ?? [];

  const { field: name } = useController({
    control,
    name: `courses.${index}.name`,
  });
  const { field: courseCode } = useController({
    control,
    name: `courses.${index}.courseCode`,
  });
  const { field: degree } = useController({
    control,
    name: `courses.${index}.degree`,
  });
  const { field: durationMonths } = useController({
    control,
    name: `courses.${index}.durationMonths`,
  });
  const { field: annualFee } = useController({
    control,
    name: `courses.${index}.annualTuitionFee`,
  });
  const { field: totalFee } = useController({
    control,
    name: `courses.${index}.totalTuitionFee`,
  });
  const { field: currency } = useController({
    control,
    name: `courses.${index}.currency`,
  });
  const { field: intakeId } = useController({
    control,
    name: `courses.${index}.intakeId`,
  });
  const { field: minimumPercentage } = useController({
    control,
    name: `courses.${index}.minimumPercentage`,
  });
  const { field: backlogLimit } = useController({
    control,
    name: `courses.${index}.backlogLimit`,
  });
  const { field: ieltsOverall } = useController({
    control,
    name: `courses.${index}.ieltsOverall`,
  });
  const { field: applicationDeadline } = useController({
    control,
    name: `courses.${index}.applicationDeadline`,
  });
  const { field: description } = useController({
    control,
    name: `courses.${index}.description`,
  });

  return (
    <Card className="rounded-2xl border">
      <CardContent className="p-5 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold">Course #{index + 1}</h4>
            <p className="text-sm text-muted-foreground">Course information</p>
          </div>
          <Button
            type="button"
            variant="destructive"
            size="icon"
            onClick={() => remove(index)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>

        {/* Basic Info */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>
              Course Name <span className="text-destructive">*</span>
            </Label>
            <Input
              value={name.value ?? ""}
              onChange={name.onChange}
              placeholder="Master of Computer Science"
            />
          </div>
          <div className="space-y-2">
            <Label>Course Code</Label>
            <Input
              value={courseCode.value ?? ""}
              onChange={courseCode.onChange}
              placeholder="MCS001"
            />
          </div>
        </div>

        {/* Degree + Duration */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Degree</Label>

            <Select
              value={degree.value ?? "none"}
              onValueChange={(value) =>
                degree.onChange(value === "none" ? undefined : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select degree" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="none">— None —</SelectItem>

                {DEGREE_OPTIONS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Duration (Months)</Label>
            <Input
              type="number"
              min={0}
              value={durationMonths.value ?? ""}
              onChange={(e) =>
                durationMonths.onChange(
                  e.target.value === "" ? "" : Number(e.target.value),
                )
              }
              placeholder="24"
            />
          </div>
        </div>

        {/* Fees */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Annual Fee</Label>
            <Input
              type="number"
              min={0}
              value={annualFee.value ?? ""}
              onChange={(e) =>
                annualFee.onChange(
                  e.target.value === "" ? "" : Number(e.target.value),
                )
              }
              placeholder="0"
            />
          </div>
          <div className="space-y-2">
            <Label>Total Fee</Label>
            <Input
              type="number"
              min={0}
              value={totalFee.value ?? ""}
              onChange={(e) =>
                totalFee.onChange(
                  e.target.value === "" ? "" : Number(e.target.value),
                )
              }
              placeholder="0"
            />
          </div>
          <div className="space-y-2">
            <Label>Currency</Label>
            <Input
              value={currency.value ?? ""}
              onChange={currency.onChange}
              placeholder="AUD"
            />
          </div>
        </div>

        {/* Intake Dropdown + Application Deadline */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Intake</Label>
            <Select
              value={intakeId.value ?? "none"}
              onValueChange={(val) =>
                intakeId.onChange(val === "none" ? "" : val)
              }
              disabled={intakesLoading}
            >
              <SelectTrigger>
                {intakesLoading ? (
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Loading intakes…
                  </span>
                ) : (
                  <SelectValue placeholder="Select intake" />
                )}
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— None —</SelectItem>
                {intakes.map((intake) => (
                  <SelectItem key={intake.id} value={intake.id}>
                    {intake.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Application Deadline</Label>
            <Input
              type="date"
              value={applicationDeadline.value ?? ""}
              onChange={applicationDeadline.onChange}
            />
          </div>
        </div>

        {/* Requirements */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Minimum Percentage</Label>
            <Input
              type="number"
              min={0}
              max={100}
              value={minimumPercentage.value ?? ""}
              onChange={(e) =>
                minimumPercentage.onChange(
                  e.target.value === "" ? "" : Number(e.target.value),
                )
              }
              placeholder="60"
            />
          </div>
          <div className="space-y-2">
            <Label>Backlog Limit</Label>
            <Input
              type="number"
              min={0}
              value={backlogLimit.value ?? ""}
              onChange={(e) =>
                backlogLimit.onChange(
                  e.target.value === "" ? "" : Number(e.target.value),
                )
              }
              placeholder="0"
            />
          </div>
          <div className="space-y-2">
            <Label>IELTS Overall</Label>
            <Input
              type="number"
              step="0.5"
              min={0}
              max={9}
              value={ieltsOverall.value ?? ""}
              onChange={(e) =>
                ieltsOverall.onChange(
                  e.target.value === "" ? "" : Number(e.target.value),
                )
              }
              placeholder="6.5"
            />
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea
            rows={3}
            value={description.value ?? ""}
            onChange={description.onChange}
            placeholder="Course description..."
            className="resize-none"
          />
        </div>
      </CardContent>
    </Card>
  );
}

export const UniversityCourseForm = memo(UniversityCourseFormComponent);
