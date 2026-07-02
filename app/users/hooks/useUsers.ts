import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { userKeys } from "../service/query-keys";
import { api } from "@/lib/api";

interface Params {
  search?: string;
  page: number;
  limit: number;
}

export const useUsers = ({ search, page, limit }: Params) => {
  return useQuery({
    queryKey: [...userKeys.all, search, page, limit],
    queryFn: async () => {
      const { data } = await api.get("/users", {
        params: {
          search,
          page,
          limit,
        },
      });

      return data;
    },
    placeholderData: keepPreviousData,
  });
};
