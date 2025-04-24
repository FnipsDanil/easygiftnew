import { openPopup, openTelegramLink } from "@telegram-apps/sdk-react";
import { useSendGift } from "@/hooks/useSendGift";
import { useSendRareGift } from "@/hooks/useSendRareGift";
import { useLanguage } from "@/components/LanguageContext";
import { API_BASE_URL } from "@/config/api";
import { retrieveLaunchParams } from '@telegram-apps/sdk';

interface Props {
  selectedItem: any;
  idGiftNumber: number | null;
  onClose: () => void;
  setIsProcessing: (v: boolean) => void;
  refetchStars: () => void;
  refetchGifts: () => void;
}

const urlApi = `${API_BASE_URL}`;

export const useModalGiftActions = ({
  selectedItem,
  idGiftNumber,
  onClose,
  setIsProcessing,
  refetchStars,
  refetchGifts,
}: Props) => {
  const isRare = ['9999', '9998', '9997', '9996', '9995', '9994', '9993', '9992', '9991', '9990', '9989'].includes(selectedItem?.id);
  const { language } = useLanguage();
  const { initDataRaw } = retrieveLaunchParams();
  const { sendGift } = useSendGift(idGiftNumber || undefined);
  const { sendRareGift } = useSendRareGift(
    idGiftNumber || undefined,
    isRare
      ? JSON.stringify({
          gift_number: selectedItem.id,
          collection: selectedItem.collection,
          model: selectedItem.model,
          backdrop: selectedItem.backdrop,
          symbol: selectedItem.symbol,
        })
      : undefined
  );

  const handleSend = async () => {
    if (!selectedItem || !idGiftNumber) {
      await openPopup({
        title: language === 'ru' ? "Ошибка" : "Error",
        message: language === 'ru' ? "Подарок не определен." : "Gift is not defined.",
        buttons: [{ id: "ok", type: "default", text: "OK" }],
      });
      return;
    }

    if (!initDataRaw) {
      await openPopup({
        title: language === 'ru' ? "Ошибка авторизации" : "Authorization Error",
        message: language === 'ru'
          ? "Ошибка авторизации. Пожалуйста, попробуйте перезапустить приложение."
          : "Authorization error. Please try restarting the application.",
        buttons: [{ id: "ok", type: "default", text: "OK" }],
      });
      return;
    }

    if (isRare) {
      setIsProcessing(true);
    
      // 🛡 Проверка verified_senders (срок — 2 дня)
      const verifyRes = await fetch(`${API_BASE_URL}/telegram/check-verified`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `tma ${initDataRaw}`,
        },
      });
    
      const verifyData = await verifyRes.json();
    
      if (!verifyData.verified) {
        const redirect = await openPopup({
          title: language === 'ru' ? "Требуется подтверждение" : "Confirmation required",
          message: language === 'ru'
            ? "Напишите нам в Telegram, чтобы получить подарок.\n\nЗатем вернитесь и снова нажмите «Получить»."
            : "Please message us on Telegram to receive the gift.\n\nThen come back and click 'Claim' again.",
          buttons: [
            { id: "open", type: "default", text: language === 'ru' ? "Открыть Telegram" : "Open Telegram" },
            { id: "cancel", type: "destructive", text: language === 'ru' ? "Отмена" : "Cancel" },
          ],
        });
    
        if (redirect === "open") {
          openTelegramLink("https://t.me/easygifter");
        }
    
        setIsProcessing(false);
        return;
      }
    
      // ✅ Пользователь подтвердился → Финальный popup
      const confirm = await openPopup({
        title: language === 'ru' ? "Подтвердите вручение" : "Confirm Delivery",
        message: language === 'ru'
          ? "Вы уверены, что хотите получить этот редкий подарок?\nПодарок будет отправлен через Telegram."
          : "Are you sure you want to claim this rare gift?\nThe gift will be delivered via Telegram.",
        buttons: [
          { id: "confirm", type: "default", text: language === 'ru' ? "Получить" : "Claim" },
          { id: "cancel", type: "destructive", text: language === 'ru' ? "Отмена" : "Cancel" },
        ],
      });
    
      if (confirm !== "confirm") {
        setIsProcessing(false);
        return;
      }
    
      const result = await sendRareGift();
    
      if (!result?.success) {
        await openPopup({
          title: language === 'ru' ? "Ошибка" : "Error",
          message: result.error || (language === 'ru' ? "Что-то пошло не так." : "Something went wrong."),
          buttons: [{ id: "ok", type: "default", text: "OK" }],
        });
        setIsProcessing(false);
        return;
      }
    
      // 🎉 Успешно
      refetchStars();
      refetchGifts();
      onClose();
    
      const message = encodeURIComponent(
        language === 'ru'
          ? `[Автоматическое сообщение]\n\n🎁 Я выиграл редкий подарок! ID: ${selectedItem.id}`
          : `[Auto message]\n\n🎁 I won a rare gift! ID: ${selectedItem.id}`
      );
      openTelegramLink(`https://t.me/easygifter?start&text=${message}`);
    
      setIsProcessing(false);
      return;
    }

    // 🎁 Обычный подарок
    const confirm = await openPopup({
      title: language === 'ru' ? "Подтвердить отправку" : "Confirm Send",
      message: language === 'ru'
        ? "Вы уверены, что хотите получить этот подарок?\nЭтот подарок нельзя обменять на звёзды."
        : "Are you sure you want to send this gift?\nThis gift cannot be exchanged for stars.",
      buttons: [
        { id: "yes", type: "default", text: language === 'ru' ? "Да" : "Yes" },
        { id: "no", type: "destructive", text: language === 'ru' ? "Нет" : "No" },
      ],
    });

    if (confirm !== "yes") return;

    try {
      setIsProcessing(true);
      const result = await sendGift();

      if (!result?.success) {
        await openPopup({
          title: language === 'ru' ? "Ошибка" : "Error",
          message: result?.error || (language === 'ru' ? "Неизвестная ошибка." : "Unknown error."),
          buttons: [{ id: "ok", type: "default", text: "OK" }],
        });
        return;
      }

      refetchStars();
      refetchGifts();
      onClose();
    } catch (err) {
      await openPopup({
        title: language === 'ru' ? "Ошибка" : "Error",
        message: language === 'ru' ? "Неожиданная ошибка при отправке подарка." : "Unexpected error while sending gift.",
        buttons: [{ id: "ok", type: "default", text: "OK" }],
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSell = async () => {
    if (!selectedItem || !idGiftNumber || !initDataRaw) {
      await openPopup({
        title: language === 'ru' ? "Ошибка" : "Error",
        message: language === 'ru' ? "Невозможно продать подарок." : "Cannot sell gift.",
        buttons: [{ id: "ok", type: "default", text: "OK" }],
      });
      return;
    }

    const confirm = await openPopup({
      title: language === 'ru' ? "Подтвердить продажу" : "Confirm Sale",
      message: language === 'ru'
        ? `Продать этот подарок за ${selectedItem.price}⭐?\n\nВы не получите подарок, но звезды будут добавлены на ваш баланс.`
        : `Sell this gift for ${selectedItem.price}⭐?\n\nYou won't receive the gift, but the stars will be added to your balance.`,
      buttons: [
        { id: "yes", type: "default", text: language === 'ru' ? "Да" : "Yes" },
        { id: "no", type: "destructive", text: language === 'ru' ? "Нет" : "No" },
      ],
    });

    if (confirm !== "yes") return;

    setIsProcessing(true);

    try {
      const res = await fetch(`${urlApi}/sell/roulette/sell`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `tma ${initDataRaw}`,
        },
        body: JSON.stringify({
          idGiftNumber: Number(idGiftNumber),
          price: Number(selectedItem.price),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        await openPopup({
          title: language === 'ru' ? "Ошибка" : "Error",
          message: data.error || (language === 'ru' ? "Ошибка при продаже подарка" : "Error while selling gift."),
          buttons: [{ id: "ok", type: "default", text: "OK" }],
        });
        return;
      }

      refetchStars();
      refetchGifts();
      onClose();
    } catch (err) {
      await openPopup({
        title: language === 'ru' ? "Ошибка" : "Error",
        message: language === 'ru' ? "Неожиданная ошибка при продаже подарка." : "Unexpected error while selling gift.",
        buttons: [{ id: "ok", type: "default", text: "OK" }],
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return { handleSend, handleSell };
};