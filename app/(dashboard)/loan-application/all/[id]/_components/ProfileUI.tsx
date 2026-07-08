import type { LoanProfileTabKey } from "./config";

export type LoanProfileTab = {
  key: LoanProfileTabKey;
  label: string;
};

export function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wider ${
        className ?? ""
      }`}
    >
      {status}
    </span>
  );
}

export function TabHeader({
  eyebrow,
  title,
  action,
}: {
  eyebrow?: string;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between border-b border-inherit pb-3">
      <div>
        {eyebrow && (
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            {eyebrow}
          </p>
        )}

        <h4 className="text-sm font-black text-slate-800 dark:text-slate-100">
          {title}
        </h4>
      </div>

      {action}
    </div>
  );
}

export function InfoCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-950">
      <div className="rounded-xl bg-red-600/10 p-2 text-red-600">
        <Icon className="h-4 w-4" />
      </div>

      <div className="min-w-0">
        <span className="mb-0.5 block text-[9px] font-black uppercase tracking-wider text-slate-400">
          {label}
        </span>

        <span className="break-words font-mono text-xs font-extrabold text-slate-800 dark:text-slate-100">
          {value || "Not provided"}
        </span>
      </div>
    </div>
  );
}

export function InfoGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{children}</div>;
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center text-sm font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-950">
      {message}
    </div>
  );
}

export function DataTable({
  columns,
  rows,
}: {
  columns: string[];
  rows: React.ReactNode;
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400 dark:bg-slate-950">
            {columns.map((column) => (
              <th key={column} className="px-4 py-3 text-left font-black">
                {column}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>{rows}</tbody>
      </table>
    </div>
  );
}