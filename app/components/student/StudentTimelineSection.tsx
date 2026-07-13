"use client";

import { FormEvent, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarClock,
  CreditCard,
  FileCheck2,
  FileStack,
  FileText,
  History,
  Info,
  LucideIcon,
  PhoneCall,
  Plus,
  RefreshCw,
  ShieldCheck,
  StickyNote,
  Users2,
  Wallet,
} from "lucide-react";

export type TimelineType =
  | "note"
  | "followup"
  | "call"
  | "meeting"
  | "status_change"
  | "document"
  | "application"
  | "offer_letter"
  | "loan"
  | "visa"
  | "payment"
  | "info";

export interface TimelineItem {
  id: string;
  type: TimelineType;
  description?: string | null;
  createdAt?: string | Date | null;
  followupDate?: string | Date | null;
  createdBy?: {
    id?: string;
    name?: string | null;
    email?: string | null;
  } | null;
}

interface StudentTimelineSectionProps {
  timeline: TimelineItem[];
  onSubmit: (payload: {
    type: TimelineType;
    description?: string;
    followupDate: string;
  }) => Promise<void> | void;
  isSubmitting: boolean;
  canCreate: boolean;
  formatDate: (value?: string | Date | null) => string;
}

interface TimelineMeta {
  label: string;
  icon: LucideIcon;
  accent: string;
}

const TIMELINE_META: Record<TimelineType, TimelineMeta> = {
  followup: {
    label: "Follow Up",
    icon: CalendarClock,
    accent:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  },
  note: {
    label: "Note",
    icon: StickyNote,
    accent: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  },
  call: {
    label: "Call",
    icon: PhoneCall,
    accent:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  meeting: {
    label: "Meeting",
    icon: Users2,
    accent:
      "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  },
  status_change: {
    label: "Status Change",
    icon: RefreshCw,
    accent:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  },
  document: {
    label: "Document",
    icon: FileStack,
    accent: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  application: {
    label: "Application",
    icon: FileText,
    accent: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
  },
  offer_letter: {
    label: "Offer Letter",
    icon: FileCheck2,
    accent: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
  },
  loan: {
    label: "Loan",
    icon: Wallet,
    accent:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  },
  visa: {
    label: "Visa",
    icon: ShieldCheck,
    accent:
      "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-400",
  },
  payment: {
    label: "Payment",
    icon: CreditCard,
    accent: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  },
  info: {
    label: "Info",
    icon: Info,
    accent: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
  },
};

function getCurrentLocalDateTime(): string {
  const now = new Date();

  const offset = now.getTimezoneOffset();

  const localDate = new Date(now.getTime() - offset * 60 * 1000);

  return localDate.toISOString().slice(0, 16);
}

export default function StudentTimelineSection({
  timeline,
  onSubmit,
  isSubmitting,
  canCreate,
  formatDate,
}: StudentTimelineSectionProps) {
  const [type, setType] = useState<TimelineType>("followup");
  const [description, setDescription] = useState("");
  const [followupDate, setFollowupDate] = useState(getCurrentLocalDateTime);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!followupDate || isSubmitting) return;

    await onSubmit({
      type,
      description: description.trim() || undefined,
      followupDate,
    });

    setType("followup");
    setDescription("");
    setFollowupDate(getCurrentLocalDateTime());
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2.5">
        <div className="rounded-xl bg-red-600/10 p-2 text-red-600 dark:bg-red-500/10 dark:text-red-500">
          <History className="h-4 w-4" />
        </div>

        <div>
          <h3 className="text-sm font-black uppercase tracking-wide text-slate-800 dark:text-slate-100">
            Timeline
          </h3>

          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {timeline.length} {timeline.length === 1 ? "event" : "events"}
          </p>
        </div>
      </div>

      {canCreate && (
        <form
          onSubmit={handleSubmit}
          className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <select
              value={type}
              onChange={(event) => setType(event.target.value as TimelineType)}
              disabled={isSubmitting}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-800 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-600/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            >
              {(Object.keys(TIMELINE_META) as TimelineType[]).map((key) => (
                <option key={key} value={key}>
                  {TIMELINE_META[key].label}
                </option>
              ))}
            </select>

            <input
              type="datetime-local"
              value={followupDate}
              onChange={(event) => setFollowupDate(event.target.value)}
              disabled={isSubmitting}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-800 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-600/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:[color-scheme:dark]"
              required
            />
          </div>

          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Add a description..."
            rows={3}
            disabled={isSubmitting}
            className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-red-500 focus:ring-2 focus:ring-red-600/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
          />

          <button
            type="submit"
            disabled={isSubmitting || !followupDate}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-black uppercase text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            <Plus className="h-3.5 w-3.5" />

            {isSubmitting ? "Saving..." : "Add Timeline"}
          </button>
        </form>
      )}

      <div className="relative max-h-[520px] overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-700 dark:bg-slate-950/40">
        {timeline.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
            <History className="h-8 w-8 text-slate-300 dark:text-slate-700" />

            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              No timeline events yet
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {timeline.map((item, index) => {
              const meta = TIMELINE_META[item.type] ?? TIMELINE_META.info;
              const Icon = meta.icon;
              const isLast = index === timeline.length - 1;

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{
                    duration: 0.2,
                    delay: index * 0.02,
                  }}
                  className="relative flex gap-3 pb-5 last:pb-0"
                >
                  <div className="flex flex-col items-center">
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${meta.accent}`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>

                    {!isLast && (
                      <span className="mt-1 w-px flex-1 bg-slate-200 dark:bg-slate-700" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${meta.accent}`}
                      >
                        {meta.label}
                      </span>

                      <span className="font-mono text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                        {formatDate(item.createdAt)}
                      </span>
                    </div>

                    {item.description && (
                      <p className="break-words text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                        {item.description}
                      </p>
                    )}

                    <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        {item.createdBy?.name ?? "Unknown"}
                      </span>

                      {item.followupDate && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                          <CalendarClock className="h-3 w-3" />

                          {formatDate(item.followupDate)}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
