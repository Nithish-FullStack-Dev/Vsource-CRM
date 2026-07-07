// app\(dashboard)\master-tracker\TrackerInfoRow.tsx
import React from "react";

type Props = {
  label: string;
  value: React.ReactNode;
};

export function TrackerInfoRow({ label, value }: Props) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-xs">
      <span className="font-medium text-slate-500">{label}</span>

      <span className="font-bold text-slate-900">{value}</span>
    </div>
  );
}
