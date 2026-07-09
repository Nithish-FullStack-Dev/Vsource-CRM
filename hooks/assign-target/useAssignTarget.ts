import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  DashboardFilters,
  targetService,
  UpdateTargetPayload,
} from "@/services/assign-target/target.service";

export const targetKeys = {
  masters: ["masters"] as const,
  dashboardRoot: ["target-dashboard"] as const,
  dashboard: (filters: DashboardFilters) =>
    ["target-dashboard", filters] as const,
};

export const useMasters = () =>
  useQuery({
    queryKey: targetKeys.masters,
    queryFn: targetService.getMasters,
    staleTime: Infinity,
  });

export const useDashboard = (filters: DashboardFilters, enabled = true) =>
  useQuery({
    queryKey: targetKeys.dashboard(filters),
    queryFn: () => targetService.getDashboard(filters),
    enabled,
    placeholderData: keepPreviousData,
  });

export const useUpdateTarget = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateTargetPayload) =>
      targetService.updateTarget(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: targetKeys.dashboardRoot,
      });
    },
  });
};
