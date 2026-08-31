export const STUDENTKEY = {
  all: ["students"] as const,
  one: ["student"] as const,
  applications: ["student-applications"],
  remarks: ["student-remarks"],
  details: () => [...STUDENTKEY.all, "detail"] as const,

  detail: (id: string) => [...STUDENTKEY.details(), id] as const,
};

export const DOCUMENT = {
  all: ["student-documents"] as const,
};

export const APPLICATION = {
  universityDropDown: ["university-dropdown"],
  courseDropDown: ["course-dropdown"],
};

export const REMARKS = {
  all: ["remarks"],
};
