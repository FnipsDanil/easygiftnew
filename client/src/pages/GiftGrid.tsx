import { FC, useEffect } from "react";
import styles from "./ProfileStyle/ProfilePage.module.css";
import { items } from "../data/items";
import StarIcon from "../../assets/prize/StarsIcon.webp";
import { useSignal, miniApp, useLaunchParams } from "@telegram-apps/sdk-react";

interface Gift {
  gift_number: string;
  id?: number;
}

interface GiftGridProps {
  gifts: Gift[];
  onGiftClick?: (gift: Gift) => void;
}

export const GiftGrid: FC<GiftGridProps> = ({ gifts, onGiftClick }) => {
  const isDark = useSignal(miniApp.isDark); // Получаем текущую тему
  const { platform } = useLaunchParams();
  useEffect(() => {
    if (platform === 'ios') {
    const giftItems = document.querySelectorAll(`.${styles.giftItem}`) as NodeListOf<HTMLElement>;

    giftItems.forEach((item) => {
      if (isDark) {
        item.style.backgroundColor = "#232e3c"; // Тёмный фон для тёмной темы
        item.style.color = "#ffffff"; // Светлый текст для тёмной темы
      } else {
        item.style.backgroundColor = "#f1f1f1"; // Светлый фон для светлой темы
        item.style.color = "#000000"; // Темный текст для светлой темы
      }
    });
  }
}, [isDark, platform]); // Запускаем каждый раз при изменении темы

  return (
    <div className={styles.giftGridWrapper}>
      <div className={styles.prizeGrid}>
        {gifts.map((gift, index) => {
          const match = Object.values(items).find(item => item.id === gift.gift_number);

          return (
            <div
              key={index}
              className={styles.giftItem}
              onClick={() => gift.id !== undefined && onGiftClick?.(gift)}
            >
              {match ? (
                <>
                  <img src={match.img} className={styles.giftImage} alt="gift" />
                  <div className={styles.caseStars}>
                    <img src={StarIcon} alt="star" />
                    {match.price}
                  </div>
                </>
              ) : (
                <>
                  <span style={{ fontSize: 48 }}>🎁</span>
                  <div className={styles.caseStars}>
                    <span>ID: {gift.gift_number}</span>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
