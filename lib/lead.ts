// lib\lead.ts
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { api } from "./api";

export const LEADS = {
  all: ["leads"],
  resources: ["lead-source"],
};

export const useCounselors = (branchId?: string) => {
  return useQuery({
    queryKey: ["branch-counselors", branchId],

    enabled: !!branchId,

    queryFn: async () => {
      const { data } = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/branches/${branchId}/counselors`,
        {
          withCredentials: true,
        },
      );

      return data?.data ?? [];
    },
  });
};

export const useLeads = () => {
  return useQuery({
    queryKey: LEADS.all,
    queryFn: async () => {
      const { data } = await api.get(
        `${process.env.NEXT_PUBLIC_API_URL}/leads`,
      );
      return data?.data ?? [];
    },
  });
};

export const useLeadSources = () => {
  return useQuery({
    queryKey: LEADS.resources,
    queryFn: async () => {
      const { data } = await api.get(
        `${process.env.NEXT_PUBLIC_API_URL}/lead-sources`,
      );
      return data?.data ?? [];
    },
  });
};
