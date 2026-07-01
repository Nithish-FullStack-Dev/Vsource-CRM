import { getCounsellorPerformance } from "@/services/performance/performance";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

export const usePerformance = (year: number, month: number) => {
  return useQuery({
    queryKey: ["counsellor-performance", year, month, "all"],
    queryFn: () =>
      getCounsellorPerformance({
        year,
        month,
      }),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
};

export const useBranchPerformance = (
  year: number,
  month: number,
  branchId: string,
) => {
  return useQuery({
    queryKey: ["counsellor-performance", year, month, branchId],
    queryFn: () =>
      getCounsellorPerformance({
        year,
        month,
        branchId,
      }),
    enabled: branchId !== "all",
    placeholderData: keepPreviousData,
    staleTime: 60_000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
};
