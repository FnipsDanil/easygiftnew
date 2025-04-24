import { useState, useEffect } from "react";
import { API_BASE_URL } from "@/config/api";
import { retrieveLaunchParams } from "@telegram-apps/sdk";

const API_URL = `${API_BASE_URL}/historyactions/history/actions`;

type HistoryItem = {
  id?: number;
  type: string;
  amount: number;
  date: string;
  gift_number?: string | number;
  direction: "+" | "-";
};

export const useHistory = () => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const { initDataRaw } = retrieveLaunchParams();

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        console.log("📦 Requesting user history");
        const res = await fetch(API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `tma ${initDataRaw}`,
            "ngrok-skip-browser-warning": "true",
          }
        });

        const text = await res.text();
        console.log("📩 Server response (text):", text);

        const data = JSON.parse(text);
        console.log("📊 History actions:", data.history);

        setHistory(data.history || []);
      } catch (error) {
        console.error("❌ Error fetching history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [initDataRaw]);

  return { history, loading };
};
