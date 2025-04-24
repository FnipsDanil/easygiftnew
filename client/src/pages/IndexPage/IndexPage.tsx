import { Tabbar } from '@telegram-apps/telegram-ui';
import type { FC } from 'react';
import { Boxes, Globe, CircleUser } from "lucide-react";
import { useState, useEffect } from "react";
import { Page } from '@/components/Page.tsx';
import { backButton, openTelegramLink } from "@telegram-apps/sdk-react";
import { CasesPage } from '@/pages/CasesPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { LeaderboardPage } from '@/pages/LeaderboardPage';
import styles from './IndexPage.module.css';
import { miniApp, useSignal } from "@telegram-apps/sdk-react"; // Импорт для работы с темой
import { useLanguage } from '@/components/LanguageContext';
import { useSearchParams } from 'react-router-dom';

export const IndexPage: FC = () => {
  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const [currentTab, setCurrentTab] = useState(tabFromUrl || "case");
  // Получаем текущую тему (темную или светлую)
  const isDark = useSignal(miniApp.isDark);
  const { language } = useLanguage();

  useEffect(() => {
    if (tabFromUrl) {
      setCurrentTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  useEffect(() => {
    backButton.hide();
  }, [currentTab]);

  const handleBannerClick = (e: React.MouseEvent) => {
    e.preventDefault(); // предотвратить переход по ссылке по умолчанию
    openTelegramLink("https://t.me/easygifter");
  };
  useEffect(() => {
    const root = document.documentElement;

    // Динамическое изменение значений переменных CSS в зависимости от текущей темы
    if (isDark) {
      root.style.setProperty('--tg-theme-background-color', '#17212b'); // Тёмный фон для темы
      root.style.setProperty('--tg-theme-text-color', '#ffffff'); // Светлый текст для темной темы
      root.style.setProperty('--tg-theme-secondary-background-color', '#232e3c'); // Цвет фона для элементов на темной теме
    } else {
      root.style.setProperty('--tg-theme-background-color', '#ffffff'); // Светлый фон для темы
      root.style.setProperty('--tg-theme-text-color', '#000000'); // Тёмный текст для светлой темы
      root.style.setProperty('--tg-theme-secondary-background-color', '#f1f1f1'); // Цвет фона для элементов на светлой теме
    }
  }, [isDark]); // Запускать при изменении темы
  return (
    <Page>
      <div style={{ paddingBottom: "50px" }}>
        {currentTab === "leaders" && <LeaderboardPage />}
        {currentTab === "case" && <CasesPage />}
        {currentTab === "profile" && <ProfilePage />}
      </div>

      {currentTab === "case" && (
        <div className={styles.banner}>
          {language === 'ru' ?
          <a
            onClick={handleBannerClick}
            className={styles.bannerLink}
          >
            Проверь <span className={styles.username}>@easygifter</span> и призы на сегодня
          </a> :
          <a
          onClick={handleBannerClick}
          className={styles.bannerLink}
        >
          Check out <span className={styles.username}>@easygifter</span> and today's prizes
        </a> }
        </div>
      )}
      {language === 'ru' ?
      <Tabbar className={styles.tabbar}>
        <Tabbar.Item
          id="leaders"
          text="Лидеры"
          selected={currentTab === "leaders"}
          onClick={() => setCurrentTab("leaders")}
        >
          <Globe size={18} />
        </Tabbar.Item>
        <Tabbar.Item
          id="case"
          text="Кейсы"
          selected={currentTab === "case"}
          onClick={() => setCurrentTab("case")}
        >
          <Boxes size={18} />
        </Tabbar.Item>
        <Tabbar.Item
          id="profile"
          text="Профиль"
          selected={currentTab === "profile"}
          onClick={() => setCurrentTab("profile")}
        >
          <CircleUser size={18} />
        </Tabbar.Item>
      </Tabbar> :
      <Tabbar className={styles.tabbar}>
      <Tabbar.Item
        id="leaders"
        text="Leaders"
        selected={currentTab === "leaders"}
        onClick={() => setCurrentTab("leaders")}
      >
        <Globe size={20} />
      </Tabbar.Item>
      <Tabbar.Item
        id="case"
        text="Cases"
        selected={currentTab === "case"}
        onClick={() => setCurrentTab("case")}
      >
        <Boxes size={20} />
      </Tabbar.Item>
      <Tabbar.Item
        id="profile"
        text="Profile"
        selected={currentTab === "profile"}
        onClick={() => setCurrentTab("profile")}
      >
        <CircleUser size={20} />
      </Tabbar.Item>
    </Tabbar> }
    </Page>
  );
};
