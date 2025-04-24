import { useState, useEffect, useCallback, useRef } from "react";
import { API_BASE_URL } from "@/config/api";
import { retrieveLaunchParams } from "@telegram-apps/sdk";

const API_URL = `${API_BASE_URL}/user`;

export const useStars = () => {
  const [stars, setStars] = useState<number | null>(null);
  const previousStarsRef = useRef<number | null>(null);
  const { initDataRaw } = retrieveLaunchParams();
  
  const fetchStars = useCallback(async () => {
    try {
      console.log("🔵 Sending request to:", API_URL);
      const response = await fetch(API_URL, {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "Authorization": `tma ${initDataRaw}`,
          "ngrok-skip-browser-warning": "true",
        },
      });

      const text = await response.text();
      const data = JSON.parse(text);
      const newStars = data.stars_count;

      previousStarsRef.current = stars;
      setStars(newStars);
    } catch (error) {
      console.error("❌ Error fetching stars:", error);
    }
  }, [initDataRaw, stars]); // Added initDataRaw to dependencies

  useEffect(() => {
    fetchStars();
  }, [fetchStars]);

  return {
    stars,
    refetchStars: fetchStars,
    previousStars: previousStarsRef.current,
  };
};
