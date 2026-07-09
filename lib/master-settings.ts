// lib\master-settings.ts
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface Country {
  id: string;
  name: string;
  status: boolean;
}

export interface Intake {
  id: string;
  name: string;
  status: boolean;
}

export interface LeadSource {
  id: string;
  name: string;
  status: boolean;
}
export interface Bank {
  id: string;
  name: string;
  status: boolean;
}
export const updateMaster = async (
  endpoint: string,
  id: string,
  name: string,
) => {
  const { data } = await axios.put(
    `${API_URL}${endpoint}/${id}`,
    {
      name,
    },
    {
      withCredentials: true,
    },
  );

  return data?.data;
};
export const getBanks = async (): Promise<Bank[]> => {
  const { data } = await axios.get(`${API_URL}/banks?status=true`, {
    withCredentials: true,
  });

  return data?.data || [];
};
export const getCountries = async () => {
  try {
    const { data } = await axios.get(`${API_URL}/countries?status=true`, {
      withCredentials: true,
    });

    return data?.data || [];
  } catch (error) {
    console.log(error);
    return [];
  }
};

export const getIntakes = async () => {
  const { data } = await axios.get(`${API_URL}/intakes?status=true`, {
    withCredentials: true,
  });

  return data?.data || [];
};

export const getLeadSources = async () => {
  const { data } = await axios.get(`${API_URL}/lead-sources?status=true`, {
    withCredentials: true,
  });

  return data?.data || [];
};

export interface MasterItem {
  id: string;
  name: string;
  status: boolean;
}

export const getMasters = async (endpoint: string) => {
  const { data } = await axios.get(`${API_URL}${endpoint}`, {
    withCredentials: true,
  });

  return data?.data || [];
};

export const createMaster = async (endpoint: string, name: string) => {
  const { data } = await axios.post(
    `${API_URL}${endpoint}`,
    {
      name,
    },
    { withCredentials: true },
  );

  return data?.data || [];
};

export const deleteMaster = async (endpoint: string, id: string) => {
  const { data } = await axios.delete(`${API_URL}${endpoint}/${id}`, {
    withCredentials: true,
  });

  return data?.data || [];
};

export const useCountries = () => {
  return useQuery({
    queryKey: ["countries"],
    queryFn: getCountries,
    staleTime: 0,
  });
};

export const useIntakes = () => {
  return useQuery({
    queryKey: ["intakes"],
    queryFn: getIntakes,
    staleTime: 0,
  });
};

export const useLeadSources = () => {
  return useQuery({
    queryKey: ["lead-sources"],
    queryFn: getLeadSources,
    staleTime: 0,
  });
};
export const useBanks = () => {
  return useQuery<Bank[]>({
    queryKey: ["banks"],
    queryFn: getBanks,
    staleTime: 0,
  });
};