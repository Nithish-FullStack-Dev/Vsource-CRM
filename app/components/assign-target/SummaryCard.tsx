"use client";

import React from "react";
import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

interface SummaryCardProps {
  id: string;
  title: string;
  value: string | number;
  icon: LucideIcon;
  subtext?: string;
  colorClass?: string;
}

export default function SummaryCard({
  id,
  title,
  value,
  icon: Icon,
  subtext,
  colorClass = "text-red-600",
}: SummaryCardProps) {
  let borderLeftClass = "border-l-4 border-red-600";
  let textValueColorClass = "text-foreground";

  const lowerTitle = title.toLowerCase();

  if (lowerTitle.includes("walk")) {
    borderLeftClass = "border-l-4 border-foreground";
  } else if (lowerTitle.includes("appli")) {
    borderLeftClass = "border-l-4 border-muted-foreground";
  } else if (lowerTitle.includes("visa")) {
    borderLeftClass = "border-l-4 border-red-600";
    textValueColorClass = "text-red-600";
  }

  return (
    <motion.div
      id={id}
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      className={`relative overflow-hidden rounded-xl border bg-card p-5 text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md ${borderLeftClass}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="text-xs font-bold text-muted-foreground">
            {title}
          </span>

          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`text-3xl font-black tracking-tight ${textValueColorClass}`}
            >
              {typeof value === "number" ? value.toLocaleString() : value}
            </span>
          </div>
        </div>

        <div className="shrink-0 rounded-xl border border-border bg-muted p-3 text-muted-foreground">
          <Icon size={18} className={colorClass} />
        </div>
      </div>

      {subtext && (
        <p className="mt-4 text-[11px] font-medium tracking-tight text-muted-foreground">
          {subtext}
        </p>
      )}
    </motion.div>
  );
}
