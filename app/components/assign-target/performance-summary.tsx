"use client";

import { ListPlus, Target, UserRoundCheck, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { PerformanceSummary as PerformanceSummaryType } from "@/types/counsellor-performance";

type PerformanceSummaryProps = {
  summary: PerformanceSummaryType;
  periodLabel: string;
  isLoading: boolean;
};

export function PerformanceSummary({
  summary,
  periodLabel,
  isLoading,
}: PerformanceSummaryProps) {
  const items = [
    {
      title: "Total Counsellors",
      value: summary.totalCounsellors,
      description: "Counsellors in the selected report",
      icon: Users,
    },
    {
      title: "Monthly Target",
      value: summary.totalTarget,
      description: "Assigned target for the selected month",
      icon: Target,
    },
    {
      title: "Total Achieved",
      value: summary.totalAchieved,
      description: `Achievements during ${periodLabel}`,
      icon: UserRoundCheck,
    },
    {
      title: "Total Leads Added",
      value: summary.totalLeadsCreated,
      description: `Leads added during ${periodLabel}`,
      icon: ListPlus,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <Card key={item.title}>
            <CardContent className="flex items-start justify-between p-5">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {item.title}
                </p>

                {isLoading ? (
                  <Skeleton className="mt-3 h-8 w-20" />
                ) : (
                  <p className="mt-2 text-3xl font-bold">{item.value}</p>
                )}

                <p className="mt-1 text-xs text-muted-foreground">
                  {item.description}
                </p>
              </div>

              <div className="rounded-lg border bg-muted/50 p-3">
                <Icon className="size-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
