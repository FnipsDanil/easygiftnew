import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/config/api";

export interface LeaderboardUser {
  id: number;
  username: string;
  total_earned: number;
  total_sales: number;
}

const API_URL = `${API_BASE_URL}/leaderboard/leaderboard/sell`;

export const useLeaderboard = () => {
  const [leaders, setLeaders] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await fetch(API_URL, {
          headers: {
            "ngrok-skip-browser-warning": "true",
          },
        });

        const data = await res.json();

        if (data.success && Array.isArray(data.data)) {
          setLeaders(data.data);
        } else {
          console.error("Некорректный ответ от сервера", data);
        }
      } catch (err) {
        console.error("Ошибка загрузки лидерборда:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  return { leaders, loading };
};
