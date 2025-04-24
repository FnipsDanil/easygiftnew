import { useEffect } from "react";
import { Page } from "@/components/Page.tsx";
import { Button,  } from "@telegram-apps/telegram-ui";
import "./rouletteStyles.css";
import { ModalPrize } from "./ModalPrize";
import { initData, useSignal, useLaunchParams, miniApp,openPopup } from "@telegram-apps/sdk-react";
import Bear from "../../../../assets/prize/bear.webp";
import Heart from "../../../../assets/prize/heartTape.webp";
import Gift from "../../../../assets/prize/gift.webp";
import Gem from "../../../../assets/prize/gem.webp";
import Ring from "../../../../assets/prize/ring.webp";
import Trophy from "../../../../assets/prize/trophy.webp";
import Rocket from "../../../../assets/prize/rocket.webp";
import Roses from "../../../../assets/prize/roses.webp";
import Cake from "../../../../assets/prize/cake.webp";
import RoseSingle from "../../../../assets/prize/roseSingle.webp";
import Champangne from "../../../../assets/prize/champangne.webp";
import happyBirth from "../../../../assets/prize/happyBirth.webp";

// 🔥 Дополнительные иконки
import StarIcon from "../../../../assets/prize/StarsIcon.webp";
import CaseIcon from "../../../../assets/cases/vintage_cigar_case.webp";

import { PossiblePrizes } from "./PossiblePrizes";

import { useUnifiedRoulette } from "@/hooks/useUnifiedRoulette";
import { generateRoulette, startRolling } from "./generateRoulette";

//rare gift
import vintageCigarRare from "../../../../assets/prize/vintageCigarRare.webp";

import { useLanguage } from "@/components/LanguageContext";
import { fetchCaseStatus } from "@/hooks/fetchCaseStatus";

const items = {
  1: { id: "5170233102089322756", img: Bear, price: 15, chance: "2%"},
  2: { id: "5170145012310081615", img: Heart, price: 15, chance: "2%"},
  3: { id: "5170250947678437525", img: Gift, price: 25, chance: "5%"},
  4: { id: "5170521118301225164", img: Gem, price: 100, chance: "18%"},
  5: { id: "5170690322832818290", img: Ring, price: 100, chance: "18%"},
  6: { id: "5168043875654172773", img: Trophy, price: 100, chance: "18%"},
  7: { id: "5170564780938756245", img: Rocket, price: 50, chance: "5%"},
  8: { id: "5170314324215857265", img: Roses, price: 50, chance: "5%"},
  9: { id: "5170144170496491616", img: Cake, price: 50, chance: "5%"},
  10: { id: "5168103777563050263", img: RoseSingle, price: 25, chance: "5%"},
  11: { id: "6028601630662853006", img: Champangne, price: 50, chance: "5%"},
  12: { id: "5782984811920491178", img: happyBirth, price: 350, chance: "8%"},
  9990: {
    id: "9990",
    img: vintageCigarRare,
    price: 3000,
    chance: "4%",
    collection: "Vintage Cigar",
    model: "nomatter",
    backdrop: "nomatter",
    symbol: "nomatter",
  },
};



export const VintageCigarCase: React.FC = () => {
  const initDataState = useSignal(initData.state);
  const user = initDataState?.user;
  const { platform } = useLaunchParams(); // Получаем платформу
  const isDark = useSignal(miniApp.isDark);
  const {language} = useLanguage();

  useEffect(() => {
    // Применяем стили только для iOS
    if (platform === "ios") {
      const casePreviewCircle = document.querySelector(".case-preview-circle") as HTMLElement;
      const rouletteroller = document.querySelector(".raffle-roller") as HTMLElement;
      const rafflerollerholder = document.querySelector(".raffle-roller-holder") as HTMLElement;
      const caseCards = document.querySelectorAll(".raffle-roller-container .item");
      const container = document.querySelector(".possible-prizes-container") as HTMLElement | null;

      if (casePreviewCircle) {
        if (isDark) {
          casePreviewCircle.style.backgroundColor = "#232e3c"; // Тёмный фон для iOS
        } else {
          casePreviewCircle.style.backgroundColor = "#f1f1f1"; // Светлый фон для iOS
        }
      }

      if (rouletteroller) {
        if (isDark) {
          rouletteroller.style.backgroundColor = "#232e3c"; // Тёмный фон для iOS
        } else {
          rouletteroller.style.backgroundColor = "#fff"; // Светлый фон для iOS
        }
      }

      if (rafflerollerholder) {
        if (isDark) {
          rafflerollerholder.style.backgroundColor = "#232e3c"; // Тёмный фон для iOS
        } else {
          rafflerollerholder.style.backgroundColor = "#f1f1f1"; // Светлый фон для iOS
        }
      }
      if (!container) return;

      // Для iOS задаем стиль
      if (platform === "ios") {
        if (isDark) {
          container.style.backgroundColor = "#232e3c"; // Тёмный фон для iOS
        } else {
          container.style.backgroundColor = "#f1f1f1"; // Светлый фон для iOS
        }
      }
      caseCards.forEach((card) => {
        const htmlElement = card as HTMLElement;
        if (isDark) {
          htmlElement.style.backgroundColor = "#111921"; // Тёмный фон для iOS и темной темы
        } else {
          htmlElement.style.backgroundColor = "#fff"; // Светлый фон для iOS и светлой темы
        }
      });
    } else {
      // Если не iOS, применяем стили для всех остальных платформ
      const caseCards = document.querySelectorAll(".raffle-roller-container .item");

      caseCards.forEach((card) => {
        const htmlElement = card as HTMLElement;
        if (isDark) {
          htmlElement.style.backgroundColor = "#232e3c"; // Тёмный фон для остальных платформ и темной темы
        } else {
          htmlElement.style.backgroundColor = "#f1f1f1"; // Светлый фон для остальных платформ и светлой темы
        }
      });
    }
  }, [platform, isDark]); // Запускаем эффект при изменении платформы и темы
  
  const {
    winningItemId,
    gameStarted,
    isModalOpen,
    handleStart,
    handleCloseModal,
    handleSell,
    idGiftNumber,
  } = useUnifiedRoulette(
    'vintagecigar', // caseType
    150, // casePrice
    {
      generateRoulette,
      startRolling,
      items
    },
    user?.username
  );

  const winningItem = Object.values(items).find(item => item.id === winningItemId);
  console.log(`🎲 Выигранный ID: ${winningItemId}`);

  

  return (
    <Page back={true}>
      <div className="scroll-wrapper">
      {/* 🧊 Превью кейса */}
      <div className="case-preview-circle">
        <img src={CaseIcon} alt="case" />
      </div>
      <div className="roulette-section">
      {/* 🎰 Рулетка */}
      <div className="raffle-roller">
        <div className="raffle-roller-holder">
          <div className="bottom-triangle"></div>
          <div className="raffle-roller-container" id="roulette-container"></div>
        </div>
      </div>

      {/* 🔘 Кнопка запуска */}
      <div className="start-button"> 
        <Button
          onClick={async () => {
            // const isBlocked = await fetchCaseStatus(12); // 🔥 живая проверка

            // if (isBlocked) {
            //   await openPopup({
            //     title: language === 'ru' ? "Кейс заблокирован" : "Case Blocked",
            //     message: language === 'ru'
            //       ? "Этот кейс временно недоступен. Попробуйте позже."
            //       : "This case is temporarily unavailable. Try again later.",
            //     buttons: [{ id: "ok", type: "default", text: "OK" }],
            //   });
            //   return;
            // }

            handleStart();
          }}
          disabled={gameStarted}
        >
          {language === 'ru' ? "Испытай удачу - 150" : "Try Your Luck - 150"}
          <img src={StarIcon} alt="star" />
        </Button>
      </div>

      {/* 🎁 Возможные призы */}
      <PossiblePrizes items={items} />
      </div></div>
      {/* 🪄 Модалка с выигрышем */}
      {winningItem && idGiftNumber !== null && (
        <ModalPrize
          isOpen={isModalOpen}
          winningItem={winningItem}
          idGiftNumber={idGiftNumber}
          onClose={handleCloseModal}
          onSell={handleSell}
        />
      )}
    </Page>
  );
};
