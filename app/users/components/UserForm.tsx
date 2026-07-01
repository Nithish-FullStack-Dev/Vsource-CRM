"use client";

import { useEffect, useState } from "react";

import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { Input } from "@/components/ui/input";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createUserSchema,
  updateUserSchema,
  UserFormValues,
} from "../schemas/user.schema";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff } from "lucide-react";

interface Role {
  id: string;
  name: string;
}

interface Branch {
  id: string;
  name: string;
}

interface UserFormProps {
  mode: "create" | "edit";

  defaultValues?: Partial<UserFormValues>;

  roles: Role[];

  branches: Branch[];

  isLoading?: boolean;

  onSubmit: (values: UserFormValues) => void;
}

export default function UserForm({
  mode,
  defaultValues,
  roles,
  branches,
  isLoading,
  onSubmit,
}: UserFormProps) {
  const [show, setShow] = useState(false);

  const form = useForm<UserFormValues>({
    resolver: zodResolver(
      mode === "create" ? createUserSchema : updateUserSchema,
    ) as any,

    defaultValues: {
      name: "",
      email: "",
      password: "",
      branchIds: [],
      roleId: "",
      target: undefined,
      ...defaultValues,
    },
  });

  const selectedRoleId = form.watch("roleId");

  const selectedRole = roles.find((r) => r.id === selectedRoleId);

  const isCounsellor = selectedRole?.name.toLowerCase() === "counsellor";

  useEffect(() => {
    if (defaultValues) {
      form.reset({
        name: defaultValues.name ?? "",
        email: defaultValues.email ?? "",
        password: "",
        branchIds: defaultValues.branchIds ?? [],
        roleId: defaultValues.roleId ?? "",
        target: defaultValues.target,
      });
    }
  }, [defaultValues, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* NAME */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>

              <FormControl>
                <Input placeholder="Enter name" {...field} />
              </FormControl>

              <FormMessage />
            </FormItem>
          )}
        />
        {/* EMAIL */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>

              <FormControl>
                <Input placeholder="Enter email" {...field} />
              </FormControl>

              <FormMessage />
            </FormItem>
          )}
        />

        {/* PASSWORD */}
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
                    placeholder="Enter password"
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

              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="branchIds"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Branches</FormLabel>

              <div className="space-y-3 rounded-md border p-4">
                {branches.map((branch) => (
                  <div key={branch.id} className="flex items-center space-x-2">
                    <Checkbox
                      checked={field.value?.includes(branch.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          field.onChange([...(field.value ?? []), branch.id]);
                        } else {
                          field.onChange(
                            field.value?.filter((id) => id !== branch.id) ?? [],
                          );
                        }
                      }}
                    />

                    <label className="text-sm">{branch.name}</label>
                  </div>
                ))}
              </div>

              <FormMessage />
            </FormItem>
          )}
        />
        {/* ROLES */}
        <FormField
          control={form.control}
          name="roleId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>

              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                </FormControl>

                <SelectContent>
                  {roles.map((role: Role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <FormMessage />
            </FormItem>
          )}
        />

        {isCounsellor && (
          <FormField
            control={form.control}
            name="target"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Monthly Target</FormLabel>

                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    placeholder="Enter monthly target"
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value === ""
                          ? undefined
                          : Number(e.target.value),
                      )
                    }
                  />
                </FormControl>

                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading
            ? "Saving..."
            : mode === "create"
              ? "Create User"
              : "Update User"}
        </Button>
      </form>
    </Form>
  );
}
