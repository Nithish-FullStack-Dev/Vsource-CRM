import { formatDate, formatINR } from "./config";
import { DataTable, EmptyState, TabHeader } from "./ProfileUI";
import type { LoanApplication } from "./types";

export function BanksTab({ applicant }: { applicant: LoanApplication }) {
  const rows = applicant.bankApplications ?? [];

  return (
    <div className="space-y-6">
      <TabHeader eyebrow="Bank Process" title="Bank / NBFC Applications" />

      {rows.length === 0 ? (
        <EmptyState message="No bank or NBFC applications found." />
      ) : (
        <DataTable
          columns={[
            "Bank / NBFC",
            "Application No",
            "Login Date",
            "Applied",
            "Status",
            "Remarks",
          ]}
          rows={rows.map((row, index) => (
            <tr key={row.id ?? index} className="border-t dark:border-slate-800">
              <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-100">
                {row.bank || "—"}
              </td>
              <td className="px-4 py-3 font-mono text-xs text-slate-500">
                {row.applicationNo || "—"}
              </td>
              <td className="px-4 py-3 text-slate-500">
                {formatDate(row.loginDate)}
              </td>
              <td className="px-4 py-3 text-slate-500">
                {formatINR(row.appliedAmount)}
              </td>
              <td className="px-4 py-3 text-slate-500">
                {row.status || "—"}
              </td>
              <td className="px-4 py-3 text-slate-500">
                {row.remarks || "—"}
              </td>
            </tr>
          ))}
        />
      )}
    </div>
  );
}