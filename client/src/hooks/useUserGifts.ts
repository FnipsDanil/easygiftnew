import { useEffect, useState, useCallback } from "react";
import { API_BASE_URL } from "@/config/api";
import { retrieveLaunchParams } from '@telegram-apps/sdk';

export interface Gift {
  gift_number: string;
  id_gift_number: number;
}

const API_URL = `${API_BASE_URL}/checkgifts`;
const { initDataRaw } = retrieveLaunchParams();

export const useUserGifts = () => {
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGifts = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/user-gifts`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
          "Authorization": `tma ${initDataRaw}`,
        },
      });

      const text = await response.text();
      const data = JSON.parse(text);

      setGifts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching gifts:", error);
      setGifts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGifts();
  }, [fetchGifts]);

  return { gifts, loading, refetchGifts: fetchGifts };
};
