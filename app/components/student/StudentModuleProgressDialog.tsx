"use client";

import { useEffect, useState } from "react";
import {
  StudentModuleKey,
  StudentModuleProgress,
  StudentModuleStatus,
  useUpdateStudentModuleProgress,
} from "@/hooks/student/useStudentModuleProgress";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const statusOptions: Array<{
  value: StudentModuleStatus;
  label: string;
  defaultProgress: number;
}> = [
  { value: "not_started", label: "Not Started", defaultProgress: 0 },
  { value: "started", label: "Started", defaultProgress: 20 },
  { value: "in_progress", label: "In Progress", defaultProgress: 50 },
  { value: "need_corrections", label: "Need Corrections", defaultProgress: 75 },
  { value: "completed", label: "Completed", defaultProgress: 100 },
  { value: "rejected", label: "Rejected", defaultProgress: 0 },
];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  module: StudentModuleKey;
  moduleLabel: string;
  currentProgress?: StudentModuleProgress;
};

export function StudentModuleProgressDialog({
  open,
  onOpenChange,
  studentId,
  module,
  moduleLabel,
  currentProgress,
}: Props) {
  const updateMutation = useUpdateStudentModuleProgress(studentId);
  const [status, setStatus] = useState<StudentModuleStatus>("not_started");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!open) return;
    setStatus(currentProgress?.status ?? "not_started");
    setProgress(currentProgress?.progress ?? 0);
  }, [open, currentProgress]);

  const handleStatusChange = (value: StudentModuleStatus) => {
    const option = statusOptions.find((item) => item.value === value);
    setStatus(value);
    setProgress(option?.defaultProgress ?? 0);
  };

  const handleSave = async () => {
    await updateMutation.mutateAsync({
      module,
      status,
      progress,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{moduleLabel} Progress</DialogTitle>
          <DialogDescription>
            Update this module status and completion percentage.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={handleStatusChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Progress</Label>
              <span className="text-sm font-bold">{progress}%</span>
            </div>
            <Progress value={progress} />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? "Saving..." : "Save Progress"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
