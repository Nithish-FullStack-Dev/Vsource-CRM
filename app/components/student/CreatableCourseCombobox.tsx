"use client";

import { useMemo, useState } from "react";
import { Check, ChevronsUpDown, Loader2, Plus } from "lucide-react";

import { cn } from "@/lib/utils";

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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface CourseOption {
  id: string;
  name: string;
  intakeId?: string | null;
}

interface CreatableCourseComboboxProps {
  universityId: string;
  courses: CourseOption[];
  value: string;
  onValueChange: (courseId: string) => void;
  onCreateCourse: (courseName: string) => Promise<CourseOption>;
  disabled?: boolean;
}

export function CreatableCourseCombobox({
  universityId,
  courses,
  value,
  onValueChange,
  onCreateCourse,
  disabled = false,
}: CreatableCourseComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const normalizedSearch = search.trim().toLowerCase();

  const selectedCourse = useMemo(
    () => courses.find((course) => course.id === value),
    [courses, value],
  );

  const exactCourseExists = useMemo(() => {
    if (!normalizedSearch) return false;

    return courses.some(
      (course) => course.name.trim().toLowerCase() === normalizedSearch,
    );
  }, [courses, normalizedSearch]);

  const handleCreateCourse = async () => {
    const courseName = search.trim();

    if (!courseName || !universityId || exactCourseExists || isCreating) {
      return;
    }

    try {
      setIsCreating(true);

      const createdCourse = await onCreateCourse(courseName);

      onValueChange(createdCourse.id);

      setSearch("");
      setOpen(false);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);

        if (!nextOpen) {
          setSearch("");
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || !universityId}
          className="h-11 w-full justify-between rounded-2xl px-4 font-normal"
        >
          <span className="truncate">
            {selectedCourse?.name ?? "Select or type course"}
          </span>

          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
      >
        <Command shouldFilter>
          <CommandInput
            value={search}
            onValueChange={setSearch}
            placeholder="Type course name..."
          />

          <CommandList>
            <CommandEmpty>
              {search.trim() && !exactCourseExists ? (
                <button
                  type="button"
                  disabled={isCreating}
                  onClick={handleCreateCourse}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent disabled:opacity-50"
                >
                  {isCreating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}

                  <span className="truncate">
                    Add &quot;{search.trim()}&quot;
                  </span>
                </button>
              ) : (
                <span>No courses found.</span>
              )}
            </CommandEmpty>

            <CommandGroup>
              {courses.map((course) => (
                <CommandItem
                  key={course.id}
                  value={course.name}
                  onSelect={() => {
                    onValueChange(course.id);
                    setSearch("");
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === course.id ? "opacity-100" : "opacity-0",
                    )}
                  />

                  {course.name}
                </CommandItem>
              ))}
            </CommandGroup>

            {search.trim() && !exactCourseExists && courses.length > 0 && (
              <CommandGroup heading="Create new course">
                <CommandItem
                  value={`create-${search}`}
                  disabled={isCreating}
                  onSelect={handleCreateCourse}
                >
                  {isCreating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  Add &quot;{search.trim()}&quot;
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
