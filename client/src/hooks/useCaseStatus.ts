import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/config/api";

export const useCaseStatus = (caseId: number) => {
  const [isDisabled, setIsDisabled] = useState<boolean | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/cases/status/${caseId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
          },
        });

        const data = await res.json();
        if (data?.success) {
          setIsDisabled(data.disabled);
        } else {
          console.warn("⚠️ Не удалось получить статус кейса:", data.error);
          setIsDisabled(false); // fallback
        }
      } catch (err) {
        console.error("❌ Ошибка при получении статуса кейса:", err);
        setIsDisabled(false);
      }
    };

    fetchStatus();
  }, [caseId]);

  return isDisabled;
};
