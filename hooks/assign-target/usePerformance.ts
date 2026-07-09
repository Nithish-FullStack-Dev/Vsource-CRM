import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  exportCounsellorPerformance,
  getCounsellorPerformance,
  updateIntakeTarget,
} from "@/services/performance/performance";
import type {
  PerformanceQueryParams,
  UpdateIntakeTargetPayload,
} from "@/types/counsellor-performance";

export const PERFORMANCE_QUERY_KEY = ["counsellor-performance"] as const;

export function usePerformance(params: PerformanceQueryParams) {
  return useQuery({
    queryKey: [...PERFORMANCE_QUERY_KEY, params],
    queryFn: () => getCounsellorPerformance(params),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
}

export function useUpdateIntakeTarget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateIntakeTargetPayload) =>
      updateIntakeTarget(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: PERFORMANCE_QUERY_KEY,
      });
    },
  });
}

export function useExportPerformance() {
  return useMutation({
    mutationFn: (params: PerformanceQueryParams) =>
      exportCounsellorPerformance(params),
  });
}
