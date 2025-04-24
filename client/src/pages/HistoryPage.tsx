import { FC, useEffect } from "react";
import { Page } from "@/components/Page";
import { useSignal, initData, miniApp, useLaunchParams} from "@telegram-apps/sdk-react";
import { Text, Headline } from "@telegram-apps/telegram-ui";
import { useHistory } from "@/hooks/useHistory";
import styles from "./HistoryPage.module.css";
import { items } from "@/data/items";
import MoneyBagIcon from "../../assets/prize/moneyBag.webp";
import StarIcon from "../../assets/prize/StarsIcon.webp";
import { useNavigate } from "react-router-dom";
import { backButton } from "@telegram-apps/sdk-react";

import { useLanguage } from '@/components/LanguageContext';

export const HistoryPage: FC = () => {
  const initDataState = useSignal(initData.state);
  const user = initDataState?.user;
  const { history, loading } = useHistory();
  const navigate = useNavigate();

  const isDark = useSignal(miniApp.isDark); // Получаем текущую тему
  const { platform } = useLaunchParams(); // Получаем информацию о платформе

  const { language } = useLanguage();

  useEffect(() => {
    backButton.show();
    return backButton.onClick(() => {
      navigate('/?tab=profile');
    });
  }, [navigate]);

  const translateHistoryType = (type: string, language: string) => {
    switch (type) {
      case "Deposit":
        return language === 'ru' ? "Пополнение" : "Deposit";
      case "Sold":
        return language === 'ru' ? "Продажа" : "Sold";
      case "Gift won":
        return language === 'ru' ? "Подарок получен" : "Gift won";
      case "Gift exchanged":
        return language === 'ru' ? "Подарок обменян" : "Gift exchanged";
      default:
        return type;
    }
  };
  

  useEffect(() => {
    if (platform === 'ios') { // Применяем только для iOS
      const profileContainer = document.querySelector(`.${styles.profileContainer}`) as HTMLElement;
      const historyItem = document.querySelectorAll(`.${styles.historyItem}`) as NodeListOf<HTMLElement>;

      // Меняем стили для баннера с позицией пользователя
      if (profileContainer) {
        if (isDark) {
          profileContainer.style.backgroundColor = "#232e3c"; // Тёмный фон
          profileContainer.style.color = "#ffffff"; // Белый текст
        } else {
          profileContainer.style.backgroundColor = "#f1f1f1"; // Светлый фон
          profileContainer.style.color = "#000000"; // Чёрный текст
        }
      }

      // Задержка, чтобы убедиться, что элементы отрендерены
      setTimeout(() => {
        // Меняем стили для каждого элемента списка истории
        historyItem.forEach((item) => {
          if (isDark) {
            item.style.backgroundColor = "#232e3c"; // Тёмный фон
            item.style.color = "#ffffff"; // Белый текст
          } else {
            item.style.backgroundColor = "#ffffff"; // Светлый фон
            item.style.color = "#000000"; // Чёрный текст
          }
        });
      }, 0); // Задержка, чтобы элементы успели отрендериться
    }
  }, [isDark, platform]); // Запускаем при изменении темы и платформы


  return (
    <Page back={true}>
      <div className={styles.profileContainer}>
        {language === 'ru' ? (
          <Headline className={styles.pageTitle}>История действий</Headline>
        ) : (
          <Headline className={styles.pageTitle}>Action History</Headline>
        )}
  
        {language === 'ru' ? (
          <Text className={styles.pageSubtitle}>Следите за вашими действиями ниже</Text>
        ) : (
          <Text className={styles.pageSubtitle}>Track your gift activities below</Text>
        )}
  
        {loading ? (
          language === 'ru' ? (
            <Text>Загрузка...</Text> // Переход на русский
          ) : (
            <Text>Loading...</Text> // Английский
          )
        ) : history.length === 0 ? (
          language === 'ru' ? (
            <Text>История пустая</Text>
          ) : (
            <Text>No history available</Text>
          )
        ) : (
          <div className={styles.historyContainer}>
            {history.map((item, idx) => {
              const isPositive = item.direction === "+";
              const matchedItem = Object.values(items).find(
                (i) => i.id === String(item.gift_number)
              );
  
              return (
                <div key={idx} className={styles.historyItem}>
                  <div className={styles.historyIcon}>
                    {matchedItem ? (
                      <img
                        src={matchedItem.img}
                        alt="gift"
                        className={styles.historyImage}
                      />
                    ) : (
                      <img src={MoneyBagIcon} alt="money" className={styles.historyImage} />
                    )}
                  </div>
  
                  <div className={styles.historyContent}>
                    <div className={styles.historyTitle}>
                      <span className={styles.historyType}>
                        {translateHistoryType(item.type, language)}
                        {item.id ? ` #${item.id}` : ""}
                      </span>
  
                      {/* Условие для исключения количества звёзд, если тип действия "Gift exchanged" */}
                      {item.type !== "Gift exchanged" && (
                        <span
                          className={`${styles.historyStars} ${
                            isPositive ? styles.positive : styles.negative
                          }`}
                        >
                          {item.direction}
                          {item.amount}
                          <img src={StarIcon} alt="star" className={styles.starIcon} />
                        </span>
                      )}
                    </div>
  
                    <div className={styles.historyDate}>
                      {new Date(item.date).toLocaleString("en-US")}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Page>
  );
}
