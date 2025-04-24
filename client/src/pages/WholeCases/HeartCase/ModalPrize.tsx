import React, { useState, useEffect } from "react";
import { initData, useSignal, useLaunchParams, openPopup, openTelegramLink, retrieveLaunchParams } from "@telegram-apps/sdk-react";
import { useSendGift } from "@/hooks/useSendGift";
import { useLanguage } from '@/components/LanguageContext';
import StarIcon from "../../../../assets/prize/StarsIcon.webp";
import DiceIcon from "../../../../assets/prize/dice.webp";
import "../../ModalPage/modal.page.css";
import { API_BASE_URL } from "@/config/api";

interface ModalPrizeProps {
  isOpen: boolean;
  winningItem: {
    id: string;
    img: string;
    price: number;
    model?: string;
    backdrop?: string;
    symbol?: string;
    collection?: string;
    chance?: string;
  } | null;
  onClose: () => void;
  onSell: () => void;
  idGiftNumber: number | null;
}

export const ModalPrize: React.FC<ModalPrizeProps> = ({
  isOpen,
  winningItem,
  onClose,
  onSell,
  idGiftNumber,
}) => {
  const initDataState = useSignal(initData.state);
  const user = initDataState?.user;
  const { platform } = useLaunchParams();
  const { language } = useLanguage();
  const { initDataRaw } = retrieveLaunchParams();

  useEffect(() => {
    if (platform === "ios" && isOpen) {
      const overlay = document.querySelector(".modal-overlay") as HTMLElement;
      if (overlay) {
        overlay.style.backdropFilter = "blur(8px)";
        overlay.style.backgroundColor = "rgba(0, 0, 0, 0.35)";
      }
    }
  }, [platform, isOpen]);

  const isRare = winningItem?.id === "9998";
  const [isSending, setIsSending] = useState(false);
  const { sendGift } = useSendGift(idGiftNumber || undefined);

  if (!isOpen || !winningItem) return null;

  const handleClaimPrize = async () => {
    if (!user?.id || !winningItem || !idGiftNumber) {
      await openPopup({
        title: language === 'ru' ? "Ошибка" : "Error",
        message: language === 'ru' ? "Подарок или пользователь не определены." : "Gift or user not defined.",
        buttons: [{ id: "ok", type: "default", text: "OK" }],
      });
      return;
    }
  
    const isRare = winningItem.id === "9998";
  
    if (isRare) {
      setIsSending(true);
  
      // 🛡️ Проверка — писал ли в Telegram
      const verifyRes = await fetch(`${API_BASE_URL}/telegram/check-verified`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `tma ${initDataRaw}`
        },
      });
  
      const verifyData = await verifyRes.json();
  
      // 🔁 Ещё не писал — покажем popup и предложим открыть Telegram
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
  
        setIsSending(false);
        return;
      }
  
      // ✅ Уже писал — показываем финальное подтверждение
      const confirmSend = await openPopup({
        title: language === 'ru' ? "Подтверждение получения" : "Confirm Claim",
        message: language === 'ru'
          ? `Вы уверены, что хотите получить этот редкий подарок?\nПосле этого его нельзя будет продать.`
          : `Are you sure you want to claim this rare gift?\nYou won’t be able to sell it after.`,
        buttons: [
          { id: "yes", type: "default", text: language === 'ru' ? "Получить" : "Claim" },
          { id: "no", type: "destructive", text: language === 'ru' ? "Отмена" : "Cancel" },
        ],
      });
  
      if (confirmSend !== "yes") {
        setIsSending(false);
        return;
      }
  
      // 🚀 Отправка запроса на редкий подарок
      const res = await fetch(`${API_BASE_URL}/rare/send-rare-gift`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `tma ${initDataRaw}`
        },
        body: JSON.stringify({
          id_gift_number: idGiftNumber,
          gift_id: winningItem.id,
          extra: {
            collection: winningItem.collection,
            model: winningItem.model,
            backdrop: winningItem.backdrop,
            symbol: winningItem.symbol,
          },
          language
        }),
      });
  
      if (res.status === 409) {
        await openPopup({
          title: language === 'ru' ? "Подарок недоступен" : "Gift Unavailable",
          message: language === 'ru'
            ? "Этот подарок уже обрабатывается. Пожалуйста, подождите."
            : "This gift is already being processed. Please wait.",
          buttons: [{ id: "ok", type: "default", text: "OK" }],
        });
        setIsSending(false);
        return;
      }
  
      const result = await res.json();
  
      if (!result.success) {
        await openPopup({
          title: language === 'ru' ? "Ошибка" : "Error",
          message: result.error || (language === 'ru' ? "Что-то пошло не так." : "Something went wrong."),
          buttons: [{ id: "ok", type: "default", text: "OK" }],
        });
        setIsSending(false);
        return;
      }
  
      // 🎉 Открываем Telegram с авто-сообщением
      const message = encodeURIComponent(
        language === 'ru'
          ? `[Автоматическое сообщение]\n\n🎁 Я выиграл редкий подарок!\nID подарка: ${winningItem.id}\n\nПожалуйста, подтвердите вручение, отправив это сообщение.\nПодарок уже отображается в истории действий в приложении.\n\nМы постараемся вручить его как можно скорее!\n\n— Easy Gift`
          : `[Auto-generated message]\n\n🎁 I've won a rare gift!\nGift ID: ${winningItem.id}\n\nPlease confirm the delivery by sending this message.\nThe gift is already visible in your activity history in the app.\n\nWe'll try to deliver it as soon as possible!\n\n— Easy Gift`
      );
      openTelegramLink(`https://t.me/easygifter?start&text=${message}`);
  
      onClose();
      return;
    }
  
    // 🎁 Обычный подарок
    const confirm = await openPopup({
      title: language === 'ru' ? "Подтверждение" : "Confirm",
      message: language === 'ru'
        ? `Вы уверены, что хотите забрать этот подарок?\nЭтот подарок нельзя обменять на звёзды.`
        : `Are you sure you want to claim this gift?\nThis gift cannot be exchanged for stars.`,
      buttons: [
        { id: "yes", type: "default", text: language === 'ru' ? "OK" : "OK" },
        { id: "no", type: "destructive", text: language === 'ru' ? "Отмена" : "Cancel" },
      ],
    });
  
    if (confirm !== "yes") return;
  
    setIsSending(true);
    const result = await sendGift();
  
    await openPopup({
      title: result?.success ? (language === 'ru' ? "Успех" : "Success") : (language === 'ru' ? "Ошибка" : "Error"),
      message: result?.success
        ? (language === 'ru' ? `🎁 Подарок отправлен!` : `🎁 Gift sent!`)
        : result?.error || (language === 'ru' ? "Неизвестная ошибка" : "Unknown error"),
      buttons: [{ id: "ok", type: "default", text: "OK" }],
    });
  
    if (result?.success) {
      onClose();
    } else {
      setIsSending(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <button className="modal-close" onClick={onClose}>×</button>
        {language === 'ru' ?
        <h2>Вы выиграли подарок!</h2> :
        <h2>You've won a gift!</h2>
        }
        {language === 'ru' ?
        <p>Что вы хотите с ним сделать?</p> :
        <p>What would you like to do with it?</p>
        }
        <img
          src={winningItem.img}
          alt="gift"
          className="modal-gift"
        />
        <div className="modal-stars">
          <img src={DiceIcon} alt="star" />
          {winningItem.chance || "??"}
        </div>
        <div className="modal-actions">
        {language === 'ru' ?
          <button onClick={handleClaimPrize} className="modal-button claim" disabled={isSending}>
            Получить
          </button> :
          <button onClick={handleClaimPrize} className="modal-button claim" disabled={isSending}>
          Claim
        </button>
          }
          {language === 'ru' ?
          <button onClick={onSell} className="modal-button sell" disabled={isSending}>
            Продать за {winningItem.price}
            <img src={StarIcon} alt="star"/>
          </button> :
          <button onClick={onSell} className="modal-button sell" disabled={isSending}>
          Sell for {winningItem.price}
          <img src={StarIcon} alt="star"/>
        </button> }
        </div>
      </div>
    </div>
  );
};
