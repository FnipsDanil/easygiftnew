import {useLaunchParams, } from "@telegram-apps/sdk-react";
import React, { useMemo, useState, useEffect } from "react";
import { items } from "../data/items";
import { useSignal, initData } from "@telegram-apps/sdk-react";
import { useModalGiftActions } from "@/hooks/useModalGiftActions";
import "./ModalPage/modal.page.css";
import StarIcon from "../../assets/prize/StarsIcon.webp";
// import DiceIcon from "../../assets/prize/dice.png";

import { useLanguage } from '@/components/LanguageContext';

interface ProfileModalProps {
  giftNumber: string | null;
  idGiftNumber: number | null;
  onClose: () => void;
  isOpen: boolean;
  refetchStars: () => void;
  refetchGifts: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  giftNumber,
  idGiftNumber,
  onClose,
  isOpen,
  refetchGifts,
  refetchStars,
}) => {
  const initDataState = useSignal(initData.state);
  const user = initDataState?.user;
  const { language } = useLanguage();


  const [isProcessing, setIsProcessing] = useState(false); // 👈 Состояние

  const selectedItem = useMemo(() => {
    return Object.values(items).find((item) => item.id === giftNumber) || null;
  }, [giftNumber]);

  const { handleSend, handleSell } = useModalGiftActions({
    selectedItem,
    idGiftNumber,
    onClose,
    setIsProcessing, // 👈 передаём в хук
    refetchGifts,
    refetchStars
  });

  const { platform } = useLaunchParams(); // Получаем платформу

  useEffect(() => {
    if (platform === "ios" && isOpen) { // Применяем только для iOS, если модалка открыта
      const overlay = document.querySelector(".modal-overlay") as HTMLElement;
      if (overlay) {
        // Применяем затемнение фона для iOS
        overlay.style.backdropFilter = "blur(8px)"; // Размытие фона
        overlay.style.backgroundColor = "rgba(0, 0, 0, 0.35)"; // Полупрозрачный черный фон
      }
    }
  }, [platform, isOpen]);


  if (!isOpen || !selectedItem) return null;

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
        <img src={selectedItem.img} alt="gift" className="modal-gift" />
        {/* <div className="modal-stars">
          <img src={DiceIcon} alt="chance" />
          {selectedItem.chance}
        </div> */}
        <div className="modal-actions">
        {language === 'ru' ?
          <button
            onClick={handleSend}
            className="modal-button claim"
            disabled={isProcessing} // 👈 блокировка
          >
            Получить
          </button> :
          <button
          onClick={handleSend}
          className="modal-button claim"
          disabled={isProcessing} // 👈 блокировка
        >
          Claim
        </button>
          }
        {language === 'ru' ?
          <button
            onClick={handleSell}
            className="modal-button sell"
            disabled={isProcessing} // 👈 блокировка
          >
            Продать за {selectedItem.price}
            <img src={StarIcon} alt="star" />
          </button> :
          <button
          onClick={handleSell}
          className="modal-button sell"
          disabled={isProcessing} // 👈 блокировка
        >
          Sell for {selectedItem.price}
          <img src={StarIcon} alt="star" />
        </button> }
        </div>
      </div>
    </div>
  );
};
