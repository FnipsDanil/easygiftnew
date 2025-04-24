import { useRef, useEffect } from "react";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { Page } from "@/components/Page";
import { Text, Headline, Avatar } from "@telegram-apps/telegram-ui";
import { Player } from "@lottiefiles/react-lottie-player";
import leaderAnimation from "../../assets/prize/tropy.json";
import styles from "@/pages/LeaderboardPage/LeaderboardPage.module.css";

import FirstPlaceAnimation from "../../assets/prize/first_medal_place.json";
import SecondPlaceAnimation from "../../assets/prize/second_medal_place.json";
import ThirdPlaceAnimation from "../../assets/prize/third_place_medal.json";
import UserImg from "../../assets//leaderboard/user_img.webp";
import { initData, useSignal, miniApp, useLaunchParams } from "@telegram-apps/sdk-react";
import { useUserRank } from "@/hooks/useUserRank";

import { useLanguage } from '@/components/LanguageContext';

export const LeaderboardPage = () => {
  const { leaders, loading } = useLeaderboard();
  const playerRef = useRef<Player>(null);

  const initDataState = useSignal(initData.state);
  const chatId = initDataState?.user?.id;
  const { position, loading: positionLoading } = useUserRank();

  const isDark = useSignal(miniApp.isDark);
  const { platform } = useLaunchParams(); // Получаем информацию о платформе

  const { language } = useLanguage();

  useEffect(() => {
    if (platform === 'ios') { // Применяем только для iOS
      const userPositionBanner = document.querySelector(`.${styles.userPositionBanner}`) as HTMLElement;
      const leaderItems = document.querySelectorAll(`.${styles.leaderItem}`) as NodeListOf<HTMLElement>;

      // Меняем стили для баннера с позицией пользователя
      if (userPositionBanner) {
        if (isDark) {
          userPositionBanner.style.backgroundColor = "#232e3c"; // Тёмный фон
          userPositionBanner.style.color = "#ffffff"; // Белый текст
        } else {
          userPositionBanner.style.backgroundColor = "#f1f1f1"; // Светлый фон
          userPositionBanner.style.color = "#000000"; // Чёрный текст
        }
      }

      // Меняем стили для каждого элемента списка лидеров
      leaderItems.forEach((item) => {
        if (isDark) {
          item.style.backgroundColor = "#232e3c"; // Тёмный фон
          item.style.color = "#ffffff"; // Белый текст
        } else {
          item.style.backgroundColor = "#ffffff"; // Светлый фон
          item.style.color = "#000000"; // Чёрный текст
        }
      });
    }
  }, [isDark, platform]); // Запускаем при изменении темы и платформы

  return (
    <Page back={false}>
      <div className={styles.scrollableContent}>
        {positionLoading ? (
          <div className={styles.userPositionBanner}>
           {language === 'ru' ? <Text className={styles.userPositionText}>Загрузка вашего места...</Text> :
           <Text className={styles.userPositionText}>Loading your position...</Text> }
          </div>
        ) : position !== null && (
          <div className={styles.userPositionBanner}>
            {language === 'ru' ?
            <Text className={styles.userPositionText}>
              Вы находитесь на <strong>#{position}</strong> в списке лидеров
            </Text> :
            <Text className={styles.userPositionText}>
            You are ranked <strong>#{position}</strong> on the leaderboard
          </Text> }
          </div>
        )}

        <Player
          ref={playerRef}
          autoplay
          keepLastFrame
          className={styles.lottieAnimation}
          src={leaderAnimation}
          onEvent={(event) => {
            if (event === "complete") {
              playerRef.current?.pause();
            }
          }}
        />

        <div className={styles.titleBlock}>
        {language === 'ru' ?
          <Headline plain weight="1" className={styles.headText}>
            Таблица лидеров
          </Headline> :
          <Headline plain weight="1" className={styles.headText}>
          Leaderboard
          </Headline> }
        {language === 'ru' ?
          <Text className={styles.subHeaderText}>
            Посмотри на самых удачливых игроков!
          </Text> :
          <Text className={styles.subHeaderText}>
          Check out the luckiest players!
        </Text> }
        </div>

        {loading ? (
          <div className={styles.loadingRow}>
            <Player
              autoplay
              loop
              src="https://lottie.host/0d3874f8-29fc-4a40-889f-027132ca1e55/9XXqmi8nJd.json"
              style={{ width: 36, height: 36 }}
            />
            {language === 'ru' ?
            <Text>Загрузка...</Text> :
            <Text>Loading...</Text> }
          </div>
        ) : (
          <div className={styles.leaderList}>
            {leaders.map((user, index) => {
              const backgroundColor = isDark ? "--tg-theme-bg-color" : "#ffffff";
              const textColor = isDark ? "#ffffff" : "#000000";

              return (
                <div
                  key={user.id}
                  className={styles.leaderItem}
                  style={{ backgroundColor, color: textColor }} // Динамическое изменение стилей
                >
                  <div className={styles.userInfo}>
                    <Avatar
                      src={UserImg}
                      className={styles.avatar}
                    />
                    <div>
                      <div>
                        <strong>#{index + 1}</strong> {user.username || "unknown"}
                      </div>
                      {language === 'ru' ?
                      <div className={styles.subText}>
                        {user.total_earned} звёзд заработано
                      </div> :
                      <div className={styles.subText}>
                      {user.total_earned} stars earned
                    </div> }
                    </div>
                  </div>

                  {/* Анимации медалей */}
                  {index === 0 && (
                    <Player
                      autoplay
                      loop
                      className={styles.medalIcon}
                      src={FirstPlaceAnimation}
                    />
                  )}
                  {index === 1 && (
                    <Player
                      autoplay
                      loop
                      className={styles.medalIcon}
                      src={SecondPlaceAnimation}
                    />
                  )}
                  {index === 2 && (
                    <Player
                      autoplay
                      loop
                      className={styles.medalIcon}
                      src={ThirdPlaceAnimation}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Page>
  );
};
