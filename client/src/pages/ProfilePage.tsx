import { useRef, useState, useEffect, useMemo } from "react";
import type { FC } from "react";
import { Page } from "@/components/Page.tsx";
import { Avatar, Text, Button, Title, Modal, Placeholder, Input,} from "@telegram-apps/telegram-ui";
import { initData, useSignal, openPopup, miniApp, useLaunchParams} from "@telegram-apps/sdk-react";
import { Player } from "@lottiefiles/react-lottie-player";

import styles from "./ProfileStyle/ProfilePage.module.css";
import inputStyles from "./ProfileStyle/InputFix.module.css";
import folderAnimation from "../../assets/prize/13_FOLDER_empty.json";
import StarIcon from "../../assets/prize/StarsIcon.webp";

import { useStars } from "@/hooks/useStars";
import { useUserGifts } from "@/hooks/useUserGifts";
import { GiftGrid } from "./GiftGrid";
import { HistoryPage } from "@/pages/HistoryPage";
import { ProfileModal } from "./ProfileModal";

import { History } from "lucide-react";
import { useProfileDeposit } from "@/hooks/useProfileDeposit";
import { useLanguage } from '@/components/LanguageContext';
import { ModalHeader } from "@telegram-apps/telegram-ui/dist/components/Overlays/Modal/components/ModalHeader/ModalHeader";
import { ModalClose } from "@telegram-apps/telegram-ui/dist/components/Overlays/Modal/components/ModalClose/ModalClose";
import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const ProfilePage: FC = () => {
  const initDataState = useSignal(initData.state);
  const user = initDataState?.user;
  const playerRef = useRef<Player>(null);
  if (!user?.id) return null;
  const { stars, refetchStars } = useStars();
  const { gifts, refetchGifts } = useUserGifts();

  const [showHistory, ] = useState(false);

  const [activeGiftId, setActiveGiftId] = useState<string | null>(null);
  const [activeGiftDbId, setActiveGiftDbId] = useState<number | null>(null);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const { language } = useLanguage();
  const navigate = useNavigate();

  const isDark = useSignal(miniApp.isDark);
  const { platform } = useLaunchParams();
  
  // Мемоизируем аватар пользователя
  const userAvatar = useMemo(() => (
    <Avatar
      className={styles.avatar}
      size={96}
      src={user?.photoUrl ?? "https://avatars.githubusercontent.com/u/84640980?v=4"}
    />
  ), [user?.photoUrl]);
  
  if (showHistory) {
    return <HistoryPage />;
  }
  useEffect(() => {
    if (platform === "ios") {
      const input = document.querySelector("input[type='number']") as HTMLInputElement;
      if (input) {
        input.classList.add(inputStyles.inputIOSFix);
      }
    }
  }, [platform, isDark]);
  
  const handleGiftClick = (gift: { gift_number: string; id?: number }) => {
    if (!gift.id) return;

    setActiveGiftId(gift.gift_number);
    setActiveGiftDbId(gift.id);
    setShowGiftModal(true);
  };

  const handleCloseModal = () => {
    setShowGiftModal(false);
    setActiveGiftId(null);
    setActiveGiftDbId(null);
  };
  const [amount, setAmount] = useState<string>('');  // Состояние для суммы пополнения
  const { handleDeposit } = useProfileDeposit();
  // Стейт для отображения Deposit Modal
  const [, setShowDepositModal] = useState(false);
  const handleTopUp = () => {
    const parsedAmount = Number(amount);  // Преобразуем строку в число только при обработке
    if (parsedAmount <= 0 || isNaN(parsedAmount)) {
      openPopup({
        title: language === 'ru' ? "Неверная сумма" : "Invalid Amount",
        message: language === 'ru' ? "Пожалуйста, введите правильную сумму." : "Please enter a valid amount.",
        buttons: [{ id: "ok", type: "default", text: language === 'ru' ? "OK" : "OK" }],
      });
      return;
    }
    handleDeposit(parsedAmount, refetchStars);
    setShowDepositModal(false); // Закрыть модалку после успешного пополнения
  };

  return (
    <Page back={false}>
      <div className={styles.profileContainer}>         
        {userAvatar}

        <Title plain weight="1" className={styles.userName}>
          {`${user?.firstName || ""} ${user?.lastName || ""}`.trim()}
        </Title>

        {language === 'ru' ? (
  <Text className={styles.starsContainer}>
    <span className={styles.starsText}>У вас</span>
    <span className={styles.starValue}>{stars ?? "0"}</span>
    <img src={StarIcon} alt="star" className={styles.starIcon} />
    <span className={styles.starsText}>звёзд</span>
    <Modal
      header={
        <ModalHeader after={<ModalClose><X style={{ color: 'var(--tgui--plain_foreground)' }} /></ModalClose>}>
          {language === 'ru' ? "Пополнение баланса" : "Top Up Balance"}
        </ModalHeader>
      }
      trigger={
        <button className={styles.roundButton}>+</button> // Кнопка пополнения
      }
    >
      <Placeholder
        description="Введите сумму пополнения"
        header="Пополните ваш баланс"
      >        
        
        <Input
          type="number"
          placeholder="Введите сумму"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}// Обновляем значение в состоянии
          className={platform === "ios" ? inputStyles.inputIOSFix : undefined}
        />
        <Button onClick={handleTopUp}>
          Пополнить
        </Button>
      </Placeholder>
    </Modal>
  </Text>
) : (
  <Text className={styles.starsContainer}>
    <span className={styles.starsText}>You have</span>
    <span className={styles.starValue}>{stars ?? "0"}</span>
    <img src={StarIcon} alt="star" className={styles.starIcon} />
    <span className={styles.starsText}>stars</span>
    <Modal
      header={
        <ModalHeader after={<ModalClose><X style={{ color: 'var(--tgui--plain_foreground)' }} /></ModalClose>}>
          {language === 'ru' ? "Пополнение баланса" : "Top Up Balance"}
        </ModalHeader>
      }
      trigger={
        <button className={styles.roundButton}>+</button> // Кнопка пополнения
      }
    >
      <Placeholder
        description="Enter the amount to top up"
        header="Top Up Your Balance"
      >
        <Input
          type="number"
          placeholder="Enter amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)} // Обновляем значение в состоянии
          className={platform === "ios" ? inputStyles.inputIOSFix : undefined}
        />
        <Button onClick={handleTopUp}>
          Top Up
        </Button>
      </Placeholder>
    </Modal>
  </Text>
)}


          
       {/* Кнопка для перехода на страницу Истории */}
       <span
        role="button"
        onClick={() => navigate("/history")}
        className={styles.historyButton}
      >
        <Button mode="plain" size="s">
          <History size={16} className={styles.historyIcon} />
          {language === 'ru' ? 'История действий' : 'View action history'}
        </Button>
      </span>

        {gifts.length === 0 ? (
          <div className={styles.prizeContainer}>
            <Player
              ref={playerRef}
              autoplay
              keepLastFrame
              className={styles.lottieAnimation}
              src={folderAnimation}
              onEvent={(event) => {
                if (event === "complete") {
                  playerRef.current?.pause();
                }
              }}
            />
           {language === 'ru' ? <Text className={styles.prizeText}>Не найдено нераспределённых подарков</Text> :
           <Text className={styles.prizeText}>No unassigned gifts found</Text> }
          </div>
        ) : (
          <GiftGrid
            gifts={gifts.map((gift) => ({
              gift_number: gift.gift_number,
              id: gift.id_gift_number, // нормализуем под тип
            }))}
            onGiftClick={handleGiftClick}
          />
        )}

        <ProfileModal
          isOpen={showGiftModal}
          onClose={handleCloseModal}
          giftNumber={activeGiftId}
          idGiftNumber={activeGiftDbId}
          refetchGifts={refetchGifts}
          refetchStars={refetchStars}
        />
      </div>      
    </Page>
  );
};

