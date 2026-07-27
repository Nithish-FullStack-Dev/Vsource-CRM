import { useMutation, useQueryClient } from "@tanstack/react-query";
import { userKeys } from "../service/query-keys";
import { api } from "@/lib/api";

export const useUnblockUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { data } = await api.post(`/admin/users/${userId}/unblock`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
};