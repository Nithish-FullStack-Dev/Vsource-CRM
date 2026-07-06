"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";

import { Button } from "@/components/ui/button";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  updateStudentStatusSchema,
  UpdateStudentStatusForm,
} from "@/schemas/student/updateStudentBasicInfoSchema";

import { StudentRecord } from "@/types/student";
import { useUpdateStudentBasicInfo } from "@/hooks/student/basic-info/useUpdateStudentBasicInfo";

interface Props {
  open: boolean;
  onClose: () => void;
  student: StudentRecord;
}

export function StudentStatusDialog({ open, onClose, student }: Props) {
  const mutation = useUpdateStudentBasicInfo();

  const form = useForm<UpdateStudentStatusForm>({
    resolver: zodResolver(updateStudentStatusSchema),
    defaultValues: {
      status: "active",
    },
  });

  useEffect(() => {
    if (!student) return;

    form.reset({
      status: student.status,
    });
  }, [student, form]);

  const onSubmit = async (values: UpdateStudentStatusForm) => {
    await mutation.mutateAsync({
      id: student.id,
      payload: values,
    });

    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Update Student Status</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>

                  <FormControl>
                    <select
                      {...field}
                      className="w-full h-10 rounded-md border px-3"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="drop">Drop</option>
                    </select>
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end">
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
