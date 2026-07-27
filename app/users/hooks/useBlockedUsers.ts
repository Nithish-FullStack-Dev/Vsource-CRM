import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { userKeys } from "../service/query-keys";
import { api } from "@/lib/api";

interface Params {
  page: number;
  limit: number;
}

export const useBlockedUsers = ({ page, limit }: Params) => {
  return useQuery({
    queryKey: [...userKeys.all, "blocked", page, limit],
    queryFn: async () => {
      const { data } = await api.get("/users", {
        params: {
          isBlocked: true,
          page,
          limit,
        },
      });
      return data;
    },
    placeholderData: keepPreviousData,
  });
};