import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  deleteStudentDocument,
  getStudentDocuments,
  updateStudentDocument,
  uploadStudentDocument,
} from "@/services/student/student-documents";

export const STUDENT_DOCUMENT_KEYS = {
  all: ["student-documents"] as const,
  detail: (studentId: string) =>
    [...STUDENT_DOCUMENT_KEYS.all, studentId] as const,
};

type CreateStudentDocumentTypePayload = {
  name: string;
  required: boolean;
};

type CreatedStudentDocumentType = {
  id: string;
  studentId: string;
  code: string;
  name: string;
  required: boolean;
  isSystem: false;
  isOptional: boolean;
  module: "OTHER";
};

export function useStudentDocuments(studentId: string) {
  return useQuery({
    queryKey: STUDENT_DOCUMENT_KEYS.detail(studentId),
    queryFn: () => getStudentDocuments(studentId),
    enabled: Boolean(studentId),
    retry: 1,
  });
}

export function useUploadStudentDocument(studentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      documentCode: string;
      file: File;
      remarks?: string;
      onProgress?: (progress: number) => void;
    }) =>
      uploadStudentDocument({
        studentId,
        ...params,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: STUDENT_DOCUMENT_KEYS.detail(studentId),
      });

      toast.success("Document uploaded successfully");
    },
    onError: (error: unknown) => {
      toast.error(
        error instanceof Error ? error.message : "Document upload failed",
      );
    },
  });
}

export function useUpdateStudentDocument(studentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      documentId: string;
      file?: File | null;
      remarks?: string;
      onProgress?: (progress: number) => void;
    }) =>
      updateStudentDocument({
        studentId,
        ...params,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: STUDENT_DOCUMENT_KEYS.detail(studentId),
      });

      toast.success("Document updated successfully");
    },
    onError: (error: unknown) => {
      toast.error(
        error instanceof Error ? error.message : "Unable to update document",
      );
    },
  });
}

export function useDeleteStudentDocument(studentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (documentId: string) =>
      deleteStudentDocument({
        studentId,
        documentId,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: STUDENT_DOCUMENT_KEYS.detail(studentId),
      });

      toast.success("Document deleted successfully");
    },
    onError: (error: unknown) => {
      toast.error(
        error instanceof Error ? error.message : "Unable to delete document",
      );
    },
  });
}

export function useCreateStudentDocumentType(studentId: string) {
  return useMutation({
    mutationFn: async (
      payload: CreateStudentDocumentTypePayload,
    ): Promise<CreatedStudentDocumentType> => {
      const response = await fetch(
        `/api/students/${studentId}/documents/types`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to create document type");
      }

      return result.data;
    },
  });
}
