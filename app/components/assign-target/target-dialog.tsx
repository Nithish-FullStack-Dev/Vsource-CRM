"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
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
import type { TargetDialogCounsellor } from "@/types/counsellor-performance";

type TargetDialogProps = {
  counsellor: TargetDialogCounsellor | null;
  periodLabel: string;
  isSaving: boolean;
  onClose: () => void;
  onSave: (target: number) => void;
};

export function TargetDialog({
  counsellor,
  periodLabel,
  isSaving,
  onClose,
  onSave,
}: TargetDialogProps) {
  const [targetInput, setTargetInput] = useState("");

  useEffect(() => {
    setTargetInput(counsellor ? String(counsellor.target) : "");
  }, [counsellor]);

  const handleSave = () => {
    const target = Number(targetInput);

    if (!Number.isInteger(target) || target < 0) {
      return;
    }

    onSave(target);
  };

  const isValidTarget =
    targetInput.trim() !== "" &&
    Number.isInteger(Number(targetInput)) &&
    Number(targetInput) >= 0;

  return (
    <Dialog
      open={Boolean(counsellor)}
      onOpenChange={(open) => {
        if (!open && !isSaving) {
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Set Monthly Target</DialogTitle>
          <DialogDescription>
            Set the target for <strong>{counsellor?.name}</strong> for {periodLabel}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-3">
          <Label htmlFor="monthly-target">Student target</Label>
          <Input
            id="monthly-target"
            type="number"
            min={0}
            step={1}
            value={targetInput}
            onChange={(event) => setTargetInput(event.target.value)}
            disabled={isSaving}
            onKeyDown={(event) => {
              if (event.key === "Enter" && isValidTarget) {
                event.preventDefault();
                handleSave();
              }
            }}
          />
          <p className="text-xs text-muted-foreground">
            Enter zero when no target is assigned for this month.
          </p>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isSaving}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={isSaving || !isValidTarget}
            onClick={handleSave}
          >
            {isSaving && <Loader2 className="mr-2 size-4 animate-spin" />}
            Save target
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
