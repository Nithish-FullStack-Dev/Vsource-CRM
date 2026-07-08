// lib/branches.ts

import { useQuery } from "@tanstack/react-query";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface Branch {
  id: string;
  name: string;
  code: string;

  email?: string;
  phone?: string;

  city?: string;
  state?: string;

  country?: string;
  pincode?: string;

  address?: string;
  status?: boolean;

  usersCount: number;
  leadsCount: number;
  studentsCount: number;
  visaApprovalsCount: number;

  createdAt: string;
}

export interface CreateBranchDto {
  name: string;
  code: string;

  email?: string;
  phone?: string;

  city?: string;
  state?: string;

  country?: string;
  pincode?: string;

  address?: string;
}

export const getBranches = async () => {
  const { data } = await axios.get(`${API_URL}/branches`, {
    withCredentials: true,
  });
  return data?.data || [];
};

export const createBranch = async (payload: CreateBranchDto) => {
  const { data } = await axios.post(`${API_URL}/branches`, payload, {
    withCredentials: true,
  });
  return data?.data || [];
};

export const updateBranch = async (id: string, payload: CreateBranchDto) => {
  const { data } = await axios.put(`${API_URL}/branches/${id}`, payload, {
    withCredentials: true,
  });

  return data?.data || [];
};

export const deleteBranch = async (id: string) => {
  const { data } = await axios.delete(`${API_URL}/branches/${id}`, {
    withCredentials: true,
  });

  return data?.data || [];
};

export const useBranches = () => {
  return useQuery({
    queryKey: ["branches"],
    queryFn: getBranches,
    staleTime: 0,
  });
};
