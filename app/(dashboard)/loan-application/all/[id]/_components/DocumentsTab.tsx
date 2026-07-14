"use client";

import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  Loader2,
  RefreshCw,
  Trash2,
  Upload,
  UploadCloud,
  X,
} from "lucide-react";
import {
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

import type { LoanDocumentChecklistItem, LoanDocumentRecord } from "./types";
import { MODULES } from "@/lib/module-codes";

const apiBase = process.env.NEXT_PUBLIC_API_URL;
const maxFileSize = 15 * 1024 * 1024;
const acceptedTypes = ".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx";
const acceptedExtensions = ["pdf", "jpg", "jpeg", "png", "webp", "doc", "docx"];

type DocumentsResponse = {
  checklist: LoanDocumentChecklistItem[];
};

function formatBytes(bytes?: number | null) {
  if (!bytes || bytes <= 0) return "Size unavailable";

  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );

  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function getFileExtension(fileName?: string | null) {
  return fileName?.split(".").pop()?.toLowerCase() ?? "";
}

function getDocumentType(fileName?: string | null) {
  return getFileExtension(fileName).toUpperCase() || "FILE";
}

function isValidFile(file: File) {
  return acceptedExtensions.includes(getFileExtension(file.name));
}

function getSafeFileUrl(value?: string | null) {
  const url = value?.trim() ?? "";

  if (!url) return "";
  if (url.startsWith("/") || url.startsWith("blob:")) return url;

  try {
    const parsedUrl = new URL(url);

    return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:"
      ? url
      : "";
  } catch {
    return "";
  }
}

function isOptionalItem(item?: LoanDocumentChecklistItem | null) {
  if (!item) return false;
  return item.isOptional ?? item.required === false;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) return error.message;
  return "Something went wrong. Please try again.";
}

function DocumentPreview({ record }: { record: LoanDocumentRecord }) {
  const fileName = record.originalFileName?.trim() || "Uploaded document";
  const extension = getFileExtension(fileName);
  const fileUrl = getSafeFileUrl(record.fileUrl);
  const isImage = ["jpg", "jpeg", "png", "webp"].includes(extension);
  const isPdf = extension === "pdf";

  if (!fileUrl) {
    return (
      <div className="flex h-full min-h-[300px] flex-col items-center justify-center rounded-[20px] border border-dashed border-slate-300 bg-slate-50 px-6 text-center dark:border-slate-700 dark:bg-slate-900">
        <FileText className="h-10 w-10 text-slate-300" />

        <p className="mt-3 text-sm font-black text-slate-700 dark:text-slate-200">
          Preview unavailable
        </p>

        <p className="mt-1 max-w-sm text-xs text-slate-500">
          The document URL is missing or invalid. The file record is still
          available below.
        </p>
      </div>
    );
  }

  if (isImage) {
    return (
      <div className="flex h-full min-h-[300px] items-center justify-center overflow-hidden rounded-[20px] border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
        <img
          src={fileUrl}
          alt={fileName}
          className="max-h-[430px] w-full object-contain"
        />
      </div>
    );
  }

  if (isPdf) {
    return (
      <iframe
        src={fileUrl}
        title={fileName}
        className="h-[430px] w-full rounded-[20px] border border-slate-200 bg-white dark:border-slate-800"
      />
    );
  }

  return (
    <div className="flex h-full min-h-[300px] flex-col items-center justify-center rounded-[20px] border border-dashed border-slate-300 bg-slate-50 px-6 text-center dark:border-slate-700 dark:bg-slate-900">
      <FileText className="h-12 w-12 text-slate-300" />

      <p className="mt-3 text-sm font-black text-slate-700 dark:text-slate-200">
        In-browser preview is not available for {getDocumentType(fileName)}
      </p>

      <a
        href={fileUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
      >
        <Eye className="h-4 w-4" />
        Open document
      </a>
    </div>
  );
}

export function DocumentsTab({
  applicationId,
  canUpdate,
}: {
  applicationId: string;
  applicantName: string;
  isDarkMode?: boolean;
  canUpdate: (moduleCode: string) => boolean;
}) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedItemCode, setSelectedItemCode] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [remarks, setRemarks] = useState("");
  const [fileError, setFileError] = useState("");
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [editingDocument, setEditingDocument] =
    useState<LoanDocumentRecord | null>(null);

  const documentsQuery = useQuery<DocumentsResponse>({
    queryKey: ["loan-application-documents", applicationId],
    queryFn: async () => {
      const { data } = await axios.get(
        `${apiBase}/loan-applications/${applicationId}/documents`,
        { withCredentials: true },
      );

      return data?.data ?? data;
    },
  });

  const checklist = documentsQuery.data?.checklist ?? [];

  const selectedItem = useMemo(
    () => checklist.find((item) => item.code === selectedItemCode) ?? null,
    [checklist, selectedItemCode],
  );

  const selectedIndex = useMemo(
    () => checklist.findIndex((item) => item.code === selectedItemCode),
    [checklist, selectedItemCode],
  );

  const activeDocument = selectedItem?.documents?.[0] ?? null;

  useEffect(() => {
    if (!checklist.length) {
      setSelectedItemCode(null);
      return;
    }

    if (!checklist.some((item) => item.code === selectedItemCode)) {
      setSelectedItemCode(checklist[0]?.code ?? null);
    }
  }, [checklist, selectedItemCode]);

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedItem?.code || !selectedFile) return;

      const formData = new FormData();

      formData.append("documentCode", selectedItem.code);
      formData.append("file", selectedFile);
      formData.append("remarks", remarks);

      await axios.post(
        `${apiBase}/loan-applications/${applicationId}/documents`,
        formData,
        {
          withCredentials: true,
          onUploadProgress: (event) => {
            if (!event.total) return;
            setProgress(Math.round((event.loaded * 100) / event.total));
          },
        },
      );
    },
    onSuccess: async () => {
      clearUploadForm();
      await queryClient.invalidateQueries({
        queryKey: ["loan-application-documents", applicationId],
      });
    },
    onError: (error) => setFileError(getErrorMessage(error)),
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingDocument?.id || !selectedFile) return;

      const formData = new FormData();

      formData.append("file", selectedFile);
      formData.append("remarks", remarks);

      await axios.patch(
        `${apiBase}/loan-applications/${applicationId}/documents/${editingDocument.id}`,
        formData,
        {
          withCredentials: true,
          onUploadProgress: (event) => {
            if (!event.total) return;
            setProgress(Math.round((event.loaded * 100) / event.total));
          },
        },
      );
    },
    onSuccess: async () => {
      clearUploadForm();
      await queryClient.invalidateQueries({
        queryKey: ["loan-application-documents", applicationId],
      });
    },
    onError: (error) => setFileError(getErrorMessage(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: async (documentId: string) => {
      await axios.delete(
        `${apiBase}/loan-applications/${applicationId}/documents/${documentId}`,
        { withCredentials: true },
      );
    },
    onSuccess: async () => {
      clearUploadForm();
      await queryClient.invalidateQueries({
        queryKey: ["loan-application-documents", applicationId],
      });
    },
    onError: (error) => setFileError(getErrorMessage(error)),
  });

  const isSaving = uploadMutation.isPending || updateMutation.isPending;

  const clearUploadForm = () => {
    setSelectedFile(null);
    setRemarks("");
    setFileError("");
    setProgress(0);
    setEditingDocument(null);

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const selectChecklistItem = (item?: LoanDocumentChecklistItem | null) => {
    if (!item?.code) return;

    setSelectedItemCode(item.code);
    clearUploadForm();
  };

  const validateFile = (file: File) => {
    setFileError("");

    if (!isValidFile(file)) {
      setSelectedFile(null);
      setFileError("Select a PDF, JPG, PNG, WEBP, DOC or DOCX file.");
      return;
    }

    if (file.size <= 0) {
      setSelectedFile(null);
      setFileError("The selected file is empty.");
      return;
    }

    if (file.size > maxFileSize) {
      setSelectedFile(null);
      setFileError("The selected file must be 15 MB or smaller.");
      return;
    }

    setSelectedFile(file);
  };

  const openFilePicker = (record?: LoanDocumentRecord | null) => {
    setEditingDocument(record ?? null);
    setSelectedFile(null);
    setRemarks(record?.remarks ?? "");
    setFileError("");
    setProgress(0);
    fileInputRef.current?.click();
  };

  const handleFileInput = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file) validateFile(file);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);

    if (activeDocument && !editingDocument) {
      setEditingDocument(activeDocument);
      setRemarks(activeDocument.remarks ?? "");
    }

    const file = event.dataTransfer.files?.[0];

    if (file) validateFile(file);
  };

  const handleCardKeyDown = (
    event: KeyboardEvent<HTMLDivElement>,
    item: LoanDocumentChecklistItem,
  ) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectChecklistItem(item);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedItem?.code) {
      setFileError("Select a checklist item first.");
      return;
    }

    if (!selectedFile) {
      setFileError("Please select a document.");
      return;
    }

    setFileError("");
    setProgress(0);

    if (editingDocument?.id) {
      await updateMutation.mutateAsync();
    } else {
      await uploadMutation.mutateAsync();
    }
  };

  const handleDelete = async (record?: LoanDocumentRecord | null) => {
    if (!record?.id) return;

    const fileName = record.originalFileName?.trim() || "this document";

    if (!window.confirm(`Delete "${fileName}" permanently?`)) return;

    await deleteMutation.mutateAsync(record.id);
  };

  const goToChecklistItem = (direction: -1 | 1) => {
    if (!checklist.length) return;

    const currentIndex = selectedIndex >= 0 ? selectedIndex : 0;
    const nextIndex = Math.min(
      Math.max(currentIndex + direction, 0),
      checklist.length - 1,
    );

    const nextItem = checklist[nextIndex];

    if (nextItem) selectChecklistItem(nextItem);
  };

  const currentPosition = selectedIndex >= 0 ? selectedIndex + 1 : 0;
  const activeFileName =
    activeDocument?.originalFileName?.trim() ||
    `${selectedItem?.name?.trim() || "Document"} file pending`;

  const activeFileMeta = activeDocument
    ? `${activeDocument.documentType?.trim() || getDocumentType(activeFileName)} | ${formatBytes(
        activeDocument.fileSize,
      )}`
    : `${selectedItem?.name?.trim() || "Document"} | Not uploaded`;

  const activeFileUrl = getSafeFileUrl(activeDocument?.fileUrl);

  if (documentsQuery.isLoading) {
    return (
      <div className="grid min-h-[720px] grid-cols-1 gap-6 xl:h-[calc(100vh-120px)] xl:min-h-[720px] xl:grid-cols-[420px_minmax(0,1fr)]">
        <div className="animate-pulse rounded-[28px] bg-slate-100 dark:bg-slate-900" />
        <div className="animate-pulse rounded-[28px] bg-slate-100 dark:bg-slate-900" />
      </div>
    );
  }

  if (documentsQuery.isError) {
    return (
      <div className="flex min-h-[460px] items-center justify-center rounded-[28px] border border-rose-200 bg-rose-50 p-8 text-center dark:border-rose-900/50 dark:bg-rose-950/20">
        <div>
          <AlertCircle className="mx-auto h-10 w-10 text-rose-500" />

          <h4 className="mt-4 text-sm font-black text-rose-700 dark:text-rose-300">
            Unable to load document checklist
          </h4>

          <p className="mt-1 text-xs text-rose-600/80 dark:text-rose-300/80">
            Please refresh the checklist and try again.
          </p>

          <button
            type="button"
            onClick={() => documentsQuery.refetch()}
            className="mt-5 rounded-xl bg-red-600 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-red-700"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-h-[720px] grid-cols-1 gap-6 xl:h-[calc(100vh-120px)] xl:min-h-[720px] xl:grid-cols-[420px_minmax(0,1fr)]">
      <aside className="flex min-h-[520px] flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_10px_35px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-950 xl:h-full xl:min-h-0">
        <div className="relative min-h-0 flex-1 overflow-y-auto px-7 pb-7 pt-2 [scrollbar-color:rgb(148_163_184)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-400/70 [&::-webkit-scrollbar-track]:bg-transparent">
          <div className="pointer-events-none absolute bottom-8 left-[36px] top-3 w-px bg-slate-300 dark:bg-slate-700" />

          {!checklist.length ? (
            <div className="relative rounded-[22px] border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center dark:border-slate-700 dark:bg-slate-900">
              <FileText className="mx-auto h-9 w-9 text-slate-300" />

              <p className="mt-3 text-sm font-black text-slate-600 dark:text-slate-300">
                No checklist items found
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Document folders will appear here when available.
              </p>
            </div>
          ) : (
            <div className="relative space-y-3">
              {checklist.map((item) => {
                const itemDocuments = item.documents ?? [];
                const itemDocument = itemDocuments[0] ?? null;
                const isSelected = item.code === selectedItemCode;
                const isComplete = item.isComplete || itemDocuments.length > 0;
                const title = item.name?.trim() || "Untitled document";

                return (
                  <div
                    key={item.code}
                    role="button"
                    tabIndex={0}
                    onClick={() => selectChecklistItem(item)}
                    onKeyDown={(event) => handleCardKeyDown(event, item)}
                    className={`group relative ml-0 flex min-h-[82px] cursor-pointer items-center gap-3 overflow-hidden rounded-[22px] border px-4 py-3.5 outline-none transition duration-200 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950 ${
                      isSelected
                        ? "border-emerald-200 bg-emerald-50/80 shadow-[0_8px_24px_rgba(16,185,129,0.10)] dark:border-emerald-900/70 dark:bg-emerald-950/20"
                        : "border-slate-300 bg-white hover:-translate-y-0.5 hover:border-slate-400 hover:shadow-[0_10px_24px_rgba(15,23,42,0.10)] dark:border-slate-700 dark:bg-slate-950 dark:hover:border-slate-600"
                    }`}
                  >
                    <div
                      className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                        isComplete
                          ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                          : "bg-slate-50 text-slate-400 dark:bg-slate-900"
                      }`}
                    >
                      <FileText className="h-5 w-5" />
                    </div>

                    <div className="relative z-10 min-w-0 flex-1 pr-1">
                      <p className="truncate text-[14px] font-black text-slate-700 dark:text-slate-100">
                        {title}
                      </p>

                      {isComplete ? (
                        <p className="mt-1 truncate text-[10px] text-slate-400">
                          {itemDocument?.originalFileName?.trim() ||
                            `${itemDocuments.length} uploaded file${
                              itemDocuments.length === 1 ? "" : "s"
                            }`}
                        </p>
                      ) : (
                        <p className="mt-1 flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.08em] text-rose-500">
                          <AlertCircle className="h-3 w-3" />
                          {isOptionalItem(item)
                            ? "Optional document"
                            : "Missing checklist item"}
                        </p>
                      )}
                    </div>

                    {isComplete ? (
                      <CheckCircle2 className="relative z-10 h-5 w-5 shrink-0 text-emerald-500 transition group-hover:opacity-0" />
                    ) : canUpdate(MODULES.LOAN_APPLICATION) ? (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          selectChecklistItem(item);
                          window.setTimeout(() => openFilePicker(null), 0);
                        }}
                        className="relative z-10 inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-rose-500 px-4 py-2.5 text-[11px] font-black text-white shadow-sm transition hover:bg-rose-600"
                      >
                        <Upload className="h-3.5 w-3.5" />
                        Upload
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </aside>

      <section className="flex min-h-[720px] flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_10px_35px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-950 xl:h-full xl:min-h-0">
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes}
          onChange={handleFileInput}
          className="sr-only"
        />

        {!selectedItem ? (
          <div className="flex flex-1 items-center justify-center p-8 text-center">
            <div>
              <FileText className="mx-auto h-12 w-12 text-slate-300" />

              <h3 className="mt-4 text-base font-black text-slate-700 dark:text-slate-200">
                Select a document folder
              </h3>

              <p className="mt-1 text-xs text-slate-400">
                Choose a checklist item to view or upload its document.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-4 border-b border-slate-100 px-7 py-5 md:flex-row md:items-center md:justify-between dark:border-slate-800">
              <div className="min-w-0">
                <h3 className="mt-3 truncate text-[16px] font-black text-slate-800 dark:text-white">
                  {activeFileName}
                </h3>

                <p className="mt-1 text-[11px] text-slate-400">
                  {activeFileMeta}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => goToChecklistItem(-1)}
                  disabled={selectedIndex <= 0}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>

                <div className="rounded-xl bg-slate-50 px-4 py-3 text-[11px] font-black text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                  Checklist: {currentPosition} / {checklist.length}
                </div>

                <button
                  type="button"
                  onClick={() => goToChecklistItem(1)}
                  disabled={
                    selectedIndex < 0 || selectedIndex >= checklist.length - 1
                  }
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 p-5 dark:bg-slate-900/40 md:p-7">
              <form
                onSubmit={handleSubmit}
                className="mx-auto flex min-h-[620px] max-w-[760px] flex-col rounded-[26px] border border-slate-300 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.14)] dark:border-slate-700 dark:bg-slate-950 md:p-7"
              >
                {activeDocument ? (
                  <div className="group relative">
                    <DocumentPreview record={activeDocument} />

                    <div className="absolute right-3 top-3 flex translate-y-1 items-center gap-2 rounded-xl border border-white/70 bg-white/90 p-1.5 opacity-0 shadow-lg backdrop-blur transition duration-200 group-hover:translate-y-0 group-hover:opacity-100 dark:border-slate-700 dark:bg-slate-950/90">
                      {activeFileUrl && (
                        <a
                          href={activeFileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white"
                          title="Open document"
                        >
                          <Eye className="h-4 w-4" />
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={() => openFilePicker(activeDocument)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white"
                        title="Replace document"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => void handleDelete(activeDocument)}
                        disabled={deleteMutation.isPending}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-400 dark:hover:bg-rose-950/30 dark:hover:text-rose-400"
                        title="Delete document"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
                      <Upload className="h-6 w-6" />
                    </div>

                    <h4 className="mt-4 text-[15px] font-black uppercase tracking-[0.02em] text-slate-700 dark:text-slate-200">
                      {selectedItem.name?.trim() || "Document"} File Pending
                    </h4>

                    <p className="mt-1 text-[11px] text-slate-400">
                      No official document attached. Please upload a PDF or
                      image.
                    </p>
                  </div>
                )}

                {canUpdate(MODULES.LOAN_APPLICATION) && (
                  <div
                    onDragEnter={(event) => {
                      event.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragOver={(event) => {
                      event.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={(event) => {
                      event.preventDefault();
                      setIsDragging(false);
                    }}
                    onDrop={handleDrop}
                    onClick={() => openFilePicker(activeDocument)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        openFilePicker(activeDocument);
                      }
                    }}
                    className={`mt-5 cursor-pointer rounded-[18px] border border-dashed px-5 py-6 text-center outline-none transition focus-visible:ring-2 focus-visible:ring-red-500 ${
                      isDragging
                        ? "border-red-500 bg-red-50 dark:bg-red-950/20"
                        : "border-slate-300 bg-slate-50 hover:border-red-300 hover:bg-red-50/50 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-red-900 dark:hover:bg-red-950/10"
                    }`}
                  >
                    <UploadCloud className="mx-auto h-6 w-6 text-slate-400" />

                    <p className="mt-2 text-xs font-black text-slate-700 dark:text-slate-200">
                      {activeDocument
                        ? "Upload / Replace Device File here"
                        : "Upload / Attach Device File here"}
                    </p>

                    <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                      PDF, JPG, PNG format
                    </p>
                  </div>
                )}

                {selectedFile && (
                  <div className="mt-4 rounded-[18px] border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/20">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm dark:bg-slate-900 dark:text-emerald-400">
                          <FileText className="h-5 w-5" />
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-xs font-black text-slate-700 dark:text-slate-200">
                            {selectedFile.name || "Selected document"}
                          </p>

                          <p className="mt-1 text-[10px] text-slate-400">
                            {formatBytes(selectedFile.size)}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFile(null);
                          setFileError("");
                          if (fileInputRef.current)
                            fileInputRef.current.value = "";
                        }}
                        className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-white hover:text-slate-700 dark:hover:bg-slate-900 dark:hover:text-white"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <textarea
                      value={remarks}
                      onChange={(event) => setRemarks(event.target.value)}
                      maxLength={200}
                      rows={2}
                      placeholder="Remarks (optional)"
                      className="mt-3 w-full resize-none rounded-xl border border-emerald-200 bg-white px-3 py-2.5 text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-red-500 dark:border-emerald-900/60 dark:bg-slate-900 dark:text-slate-200"
                    />

                    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:justify-end">
                      <button
                        type="button"
                        onClick={clearUploadForm}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        disabled={isSaving}
                        className="inline-flex min-w-[170px] items-center justify-center gap-2 rounded-xl bg-rose-500 px-5 py-2.5 text-xs font-black text-white shadow-sm transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Saving {progress}%
                          </>
                        ) : (
                          <>
                            <UploadCloud className="h-4 w-4" />
                            {editingDocument
                              ? "Replace Document"
                              : "Upload Document"}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {fileError && (
                  <div className="mt-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-600 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-400">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{fileError}</span>
                  </div>
                )}
              </form>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
