import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/config/api";
import { retrieveLaunchParams } from "@telegram-apps/sdk";

export const useUserRank = () => {
  const [position, setPosition] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const { initDataRaw } = retrieveLaunchParams();

  useEffect(() => {
    const fetchRank = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/placecheckleaderboard/leaderboard/position`, {
          headers: {
            "Authorization": `tma ${initDataRaw}`,
            "ngrok-skip-browser-warning": "true",
          },
        });
        const data = await res.json();
        setPosition(data.position ?? null);
      } catch (err) {
        console.error("Error getting position:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRank();
  }, [initDataRaw]);

  return { position, loading };
};