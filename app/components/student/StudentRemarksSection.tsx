"use client";

import { FormEvent, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageSquareText, Send, UserRound } from "lucide-react";

export interface RemarkItem {
  id: string;
  note: string;
  createdAt: string | Date;
  createdBy?: {
    id?: string;
    name?: string | null;
    email?: string | null;
  } | null;
}

interface StudentRemarksSectionProps {
  remarks: RemarkItem[];
  onSubmit: (note: string) => Promise<void> | void;
  isSubmitting: boolean;
  canCreate: boolean;
  formatDate: (value?: string | Date | null) => string;
}

function getInitials(name?: string | null): string {
  if (!name) return "?";

  const parts = name.trim().split(" ").filter(Boolean);

  if (parts.length === 0) return "?";

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export default function StudentRemarksSection({
  remarks,
  onSubmit,
  isSubmitting,
  canCreate,
  formatDate,
}: StudentRemarksSectionProps) {
  const [text, setText] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedText = text.trim();

    if (!trimmedText || isSubmitting) return;

    await onSubmit(trimmedText);

    setText("");
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="rounded-xl bg-red-600/10 p-2 text-red-600 dark:bg-red-500/10 dark:text-red-500">
            <MessageSquareText className="h-4 w-4" />
          </div>

          <div>
            <h3 className="text-sm font-black uppercase tracking-wide text-slate-800 dark:text-slate-100">
              Remarks
            </h3>

            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {remarks.length} {remarks.length === 1 ? "entry" : "entries"}
            </p>
          </div>
        </div>
      </div>

      {canCreate && (
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-2.5 sm:flex-row sm:items-center"
        >
          <input
            type="text"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Type a remark and press enter..."
            disabled={isSubmitting}
            className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-red-500 focus:ring-2 focus:ring-red-600/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
            required
          />

          <button
            type="submit"
            disabled={isSubmitting || !text.trim()}
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-black uppercase text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" />

            {isSubmitting ? "Saving..." : "Save"}
          </button>
        </form>
      )}

      <div className="relative max-h-[520px] space-y-3 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-700 dark:bg-slate-950/40">
        {remarks.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
            <MessageSquareText className="h-8 w-8 text-slate-300 dark:text-slate-700" />

            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              No remarks added yet
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {remarks.map((remark, index) => (
              <motion.div
                key={remark.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 0.2,
                  delay: index * 0.02,
                }}
                className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-600/10 text-[11px] font-black text-red-600 dark:bg-red-500/10 dark:text-red-500">
                  {remark.createdBy?.name ? (
                    getInitials(remark.createdBy.name)
                  ) : (
                    <UserRound className="h-4 w-4" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="mb-1.5 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <span className="truncate text-xs font-bold text-slate-800 dark:text-slate-100">
                      {remark.createdBy?.name ?? "Unknown"}
                    </span>

                    <span className="w-fit shrink-0 rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {formatDate(remark.createdAt)}
                    </span>
                  </div>

                  <p className="break-words text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    {remark.note}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
