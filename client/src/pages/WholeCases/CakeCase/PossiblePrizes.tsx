import React, { useEffect } from "react";
import Dice from "../../../../assets/prize/dice.webp";
import StarIcon from "../../../../assets/prize/StarsIcon.webp";
import NewTape from "../../../../assets/newTape/newtape.webp";
import NewTapeLimited from "../../../../assets/newTape/newtapelimited.webp";
import { useLanguage } from "@/components/LanguageContext";

type PrizeItem = {
  id: string;
  img: string;
  price: number;
  chance: string;
};

interface PossiblePrizesProps {
  items: Record<number, PrizeItem>;
}

export const PossiblePrizes: React.FC<PossiblePrizesProps> = ({ items }) => {
  const { language } = useLanguage();
  useEffect(() => {
    const container = document.querySelector(".possible-prizes-container") as HTMLElement | null;
    if (!container) return;

    const handleWheelScroll = (event: WheelEvent) => {
      event.preventDefault();
      container.scrollLeft += event.deltaY; // Горизонтальный скролл
    };

    container.addEventListener("wheel", handleWheelScroll as EventListener);
    return () => container.removeEventListener("wheel", handleWheelScroll as EventListener);
  }, []);

  // Sort items to ensure rare prize (ID 9994) appears first
  const sortedItems = Object.values(items)
    .sort((a, b) => b.price - a.price)
    .sort((a, b) => {
      if (a.id === "9994") return -1; // 9994 всегда первый
      if (b.id === "9994") return 1;
      return 0;
    });

  return (
    <div className="possible-prizes-container">
      <div className="possible-prizes-inner">
        {sortedItems.map((prize, index) => (
          <div key={index} className="possible-prize">
            {prize.id === "9994" && (
              <div className="newTapeContainer">
                <img src={NewTapeLimited} alt="Rare" className="newTape" />
                <span className="newTapeText">
                  {language === "ru" ? "РЕДКИЙ" : "RARE"}
                </span>
              </div>
            )}
            {["5170521118301225164", "5170690322832818290", "5168043875654172773"].includes(prize.id) && (
              <div className="newTapeContainer">
                <img src={NewTape} alt="X3" className="newTape" />
                <span className="newTapeText">X3</span>
              </div>
            )}
            <div className="prize-image">
              <img src={prize.img} alt={`Item ID: ${prize.id}`} />
            </div>
            <div className="prize-stars">
              <img src={StarIcon} alt="star" /> {prize.price}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
