import { API_BASE_URL } from "@/config/api";

export const fetchCaseStatus = async (caseId: number): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE_URL}/cases/status/${caseId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
      });
  
      const data = await res.json();
      return data?.success ? data.disabled : false;
    } catch (err) {
      console.error("❌ Ошибка при получении статуса кейса:", err);
      return false;
    }
  };
  