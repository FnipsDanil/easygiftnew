import { FC, useRef } from "react";
import { Page } from "@/components/Page";
import { Text, Title } from "@telegram-apps/telegram-ui";
import { Player } from "@lottiefiles/react-lottie-player";
import { useLanguage } from "@/components/LanguageContext";

import folderAnimation from "../../../assets/prize/nhh.json"; // твой путь

export const MaintenancePage: FC = () => {
  const playerRef = useRef<Player>(null);
  const { language } = useLanguage();

  return (
    <Page>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "32px 16px",
          textAlign: "center",
          height: "100%",
        }}
      >
        <Player
          ref={playerRef}
          autoplay
          keepLastFrame
          src={folderAnimation}
          style={{ width: 200, height: 200, marginBottom: 16 }}
          onEvent={(event) => {
            if (event === "complete") {
              playerRef.current?.pause();
            }
          }}
        />
        <Title weight="2" style={{ marginBottom: 8 }}>
          {language === "ru" ? "Технический перерыв" : "Maintenance Break"}
        </Title>
        <Text style={{ fontSize: 16, opacity: 0.8 }}>
          {language === "ru"
            ? "Мы скоро вернёмся! Спасибо за ожидание."
            : "We'll be back soon! Thanks for waiting."}
        </Text>
      </div>
    </Page>
  );
};
