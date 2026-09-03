// hooks/application-tracker/useMasterTracker.ts

import { useQuery } from "@tanstack/react-query";
import axios from "axios";

const API = process.env.NEXT_PUBLIC_API_URL;

export const useMasterTracker = () => {
  return useQuery({
    queryKey: ["master-tracker"],

    queryFn: async () => {
      let students = [];

      try {
        const studentsRes = await axios.get(`${API}/students`, {
          withCredentials: true,
          params: {
            limit: 10000,
          },
        });

        console.log("STUDENTS API RESPONSE:", studentsRes.data);
        console.log(
          "STUDENT COUNT:",
          studentsRes.data?.data?.length
        );

        students = studentsRes.data?.data ?? [];

        console.log(
          "STUDENTS STORED IN MASTER TRACKER:",
          students.length
        );
      } catch (err) {
        console.error("Students Error", err);
      }

      return {
        students,
      };
    },
  });
};