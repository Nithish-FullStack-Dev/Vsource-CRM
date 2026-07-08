import { Calendar } from "lucide-react";

import { formatDate } from "./config";
import { DataTable, EmptyState, TabHeader } from "./ProfileUI";
import type { LoanApplication } from "./types";

export function FollowUpsTab({ applicant }: { applicant: LoanApplication }) {
  const followUps = applicant.followUps ?? [];

  return (
    <div className="space-y-6">
      <TabHeader eyebrow="Tracking" title="Follow-Ups" />

      {followUps.length === 0 ? (
        <EmptyState message="No follow-up records found." />
      ) : (
        <DataTable
          columns={["Date", "Next Follow-Up", "Type", "Note", "Created By"]}
          rows={followUps.map((item, index) => (
            <tr key={item.id ?? index} className="border-t dark:border-slate-800">
              <td className="px-4 py-3 text-slate-500">
                {formatDate(item.date || item.createdAt)}
              </td>
              <td className="px-4 py-3 font-bold text-red-600">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDate(item.nextFollowUp)}
                </span>
              </td>
              <td className="px-4 py-3 text-slate-500">{item.type || "—"}</td>
              <td className="px-4 py-3 text-slate-500">{item.note || "—"}</td>
              <td className="px-4 py-3 text-slate-500">
                {item.createdBy || "—"}
              </td>
            </tr>
          ))}
        />
      )}
    </div>
  );
}