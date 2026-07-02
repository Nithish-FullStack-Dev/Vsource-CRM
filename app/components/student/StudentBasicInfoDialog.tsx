"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";

import { zodResolver } from "@hookform/resolvers/zod";

import { useForm } from "react-hook-form";

import {
  updateStudentBasicInfoSchema,
  UpdateStudentBasicInfoForm,
} from "@/schemas/student/basic-info.schema";

import { StudentRecord } from "@/types/student";

import { useEffect, useState } from "react";
import { useUpdateStudentBasicInfo } from "@/hooks/student/basic-info/useUpdateStudentBasicInfo";
import { Eye, EyeOff } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  student: StudentRecord;
}

export function StudentBasicInfoDialog({ open, onClose, student }: Props) {
  const mutation = useUpdateStudentBasicInfo();
  const [show, setShow] = useState(false);
  const form = useForm<UpdateStudentBasicInfoForm>({
    resolver: zodResolver(updateStudentBasicInfoSchema),
    defaultValues: {
      studentName: "",
      mobileNumber: "",
      emailId: "",
      password: "",
      dob: "",
      moi: "",
      undergraduate: undefined,
      gender: undefined,
      applicationDate: "",
      counselorId: "",
      currentStage: "",
      status: undefined,
    },
  });

  useEffect(() => {
    if (!student) return;

    form.reset({
      studentName: student.studentName ?? "",
      mobileNumber: student.mobileNumber ?? "",
      emailId: student.emailId ?? "",
      password: "",

      dob: student.dob ? new Date(student.dob).toISOString().split("T")[0] : "",

      applicationDate: student.applicationDate
        ? new Date(student.applicationDate).toISOString().split("T")[0]
        : "",

      gender: student.gender ?? undefined,

      counselorId: student.counselorId ?? "",

      currentStage: student.currentStage ?? "",

      status: student.status ?? undefined,

      moi: student.moi ?? "",

      undergraduate: student.undergraduate ?? undefined,
    });
  }, [student, form]);

  const onSubmit = async (values: UpdateStudentBasicInfoForm) => {
    await mutation.mutateAsync({
      id: student.id,
      payload: values,
    });

    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Update Student Basic Information</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid grid-cols-2 gap-4"
          >
            <FormField
              control={form.control}
              name="studentName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Student Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="mobileNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mobile Number</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="emailId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>VSTU Email</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>

                  <FormControl>
                    <div className="relative">
                      <Input
                        type={show ? "text" : "password"}
                        placeholder="Leave empty to keep existing password"
                        className="pr-10"
                        {...field}
                      />

                      <button
                        type="button"
                        onClick={() => setShow((prev) => !prev)}
                        className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground"
                        tabIndex={-1}
                      >
                        {show ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dob"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date Of Birth</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} value={field.value ?? ""} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gender</FormLabel>

                  <select
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    className="w-full h-10 rounded-md border px-3"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="others">Others</option>
                  </select>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="applicationDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Application Date</FormLabel>

                  <FormControl>
                    <Input type="date" {...field} value={field.value ?? ""} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="moi"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>MOI</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Medium of Instruction"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Student Status</FormLabel>

                  <select
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    className="w-full h-10 rounded-md border px-3"
                  >
                    <option value="">Select Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">in Active</option>
                  </select>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="undergraduate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Undergraduate Status</FormLabel>

                  <select
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    className="w-full h-10 rounded-md border px-3"
                  >
                    <option value="">Select Status</option>
                    <option value="pursuing">Pursuing</option>
                    <option value="graduate">Graduate</option>
                  </select>
                </FormItem>
              )}
            />

            <div className="col-span-2 flex justify-end">
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
