import { formatDate } from "./config";
import { EmptyState, TabHeader } from "./ProfileUI";
import type { LoanApplication } from "./types";

export function ActivityTab({ applicant }: { applicant: LoanApplication }) {
  const activities = applicant.activities ?? [];

  return (
    <div className="space-y-6">
      <TabHeader eyebrow="History" title="Activity Timeline" />

      {activities.length === 0 ? (
        <EmptyState message="No activity records found." />
      ) : (
        <div className="relative space-y-4">
          <div className="absolute bottom-4 left-5 top-4 w-px bg-slate-200 dark:bg-slate-800" />

          {activities.map((item, index) => (
            <div key={item.id ?? index} className="relative flex gap-4">
              <div className="z-10 mt-1 h-10 w-10 rounded-xl bg-red-600/10 ring-4 ring-white dark:ring-slate-900" />

              <div className="flex-1 rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-sm font-black text-slate-800 dark:text-white">
                    {item.title || item.type || "Activity"}
                  </h4>

                  <span className="text-[10px] font-bold text-slate-400">
                    {formatDate(item.createdAt)}
                  </span>
                </div>

                <p className="mt-1 text-sm font-semibold text-slate-600 dark:text-slate-300">
                  {item.description || "No description"}
                </p>

                {item.createdBy && (
                  <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    By {item.createdBy}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}