import { openPopup } from "@telegram-apps/sdk-react";
import { API_BASE_URL } from "@/config/api";
import { useLanguage } from '@/components/LanguageContext';
import { retrieveLaunchParams } from '@telegram-apps/sdk';

export const useSendRareGift = (
  idGiftNumber?: number,
  extra?: string
) => {
  const { language } = useLanguage();
  const { initDataRaw } = retrieveLaunchParams();

  const sendRareGift = async () => {
    if (!idGiftNumber || !initDataRaw) {
      return {
        success: false,
        error: language === 'ru' ? "Подарок не определен или отсутствует initData." : "Gift is not defined or initData is missing.",
      };
    }

    try {
      const res = await fetch(`${API_BASE_URL}/rare/send-rare-gift`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `tma ${initDataRaw}`,
        },
        body: JSON.stringify({
          id_gift_number: idGiftNumber,
          gift_id: extra ? JSON.parse(extra).gift_number : undefined,
          extra: extra ? JSON.parse(extra) : undefined,
          language,
        }),
      });

      // If gift is already locked
      if (res.status === 409) {
        await openPopup({
          title: language === 'ru' ? "Подарок недоступен" : "Gift Unavailable",
          message: language === 'ru' 
            ? "Этот подарок уже обрабатывается. Пожалуйста, подождите." 
            : "This gift is already being processed. Please wait.",
          buttons: [{ id: "ok", type: "default", text: language === 'ru' ? "OK" : "OK" }],
        });
        return { success: false };
      }

      const data = await res.json();
      return data;
    } catch (err) {
      console.error("❌ Rare gift send error:", err);
      return { success: false, error: language === 'ru' ? "Ошибка сети или сервера." : "Network or server error." };
    }
  };

  return { sendRareGift };
};
