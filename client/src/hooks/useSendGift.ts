import { API_BASE_URL } from "@/config/api";
import { retrieveLaunchParams } from "@telegram-apps/sdk";

const { initDataRaw } = retrieveLaunchParams();

export const useSendGift = (idGiftNumber?: number) => {
  const sendGift = async () => {
    if (!idGiftNumber || !initDataRaw) {
      return { success: false, error: "Подарок не определён или отсутствует initData" };
    }

    try {
      const res = await fetch(`${API_BASE_URL}/gift/send-gift`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
          "Authorization": `tma ${initDataRaw}`,
        },
        body: JSON.stringify({
          id_gift_number: idGiftNumber,
        }),
      });

      const data = await res.json();
      return data;
    } catch (err) {
      return { success: false, error: "Ошибка при отправке" };
    }
  };

  return { sendGift };
};
