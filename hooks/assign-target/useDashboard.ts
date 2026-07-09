import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { targetService } from "@/services/assign-target/target.service";

export const useDashboard = (filters: any) =>
  useQuery({
    queryKey: ["target-dashboard", filters],
    queryFn: () => targetService.getDashboard(filters),
    enabled: !!filters,
    placeholderData: keepPreviousData,
  });
