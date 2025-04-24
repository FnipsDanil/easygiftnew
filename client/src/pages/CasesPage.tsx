import { Button, Headline } from "@telegram-apps/telegram-ui";
import { FC, useState, useRef, useEffect } from "react";
import { Page } from "@/components/Page.tsx";
import { Player } from "@lottiefiles/react-lottie-player";
import pageAnimation from "../../assets/prize/!!!!!dizzy.json";

import { useLanguage } from '@/components/LanguageContext';

import caseHeart from "../../assets/cases/heart_case.webp";
import caseBear from "../../assets/cases/bear_case.webp";
// import caseGem from "../../assets/cases/gem_case.webp";
import caseDurovCap from "../../assets/cases/durov's_cap_case.webp";
// import caseRocket from "../../assets/cases/rocket_case_v1.webp";
import caseSwiss from "../../assets/cases/swissWatch_case.webp";
import caseJack from "../../assets/cases/jack_in_the_case.webp";
import caseCake from "../../assets/cases/homemade_cake_case.webp";
import caseSkeleton from "../../assets/cases/skeleton_skull_case.webp";
import caseTopHat from "../../assets/cases/top_hat_case.webp";
import caseSignetRing from "../../assets/cases/signet_ring_case.webp";
import caseVintageCigar from "../../assets/cases/vintage_cigar_case.webp";
import caseBday from "../../assets/cases/bday_case.webp";
// import caseEaster from "../../assets/cases/easter_case.webp";
import caseEgg from "../../assets/cases/easter_case.webp";
import StarIcon from "../../assets/prize/StarsIcon.webp";

import NewTape from "../../assets/newTape/newtape.webp";
// import NewTapeLimited from "../../assets/newTape/newtapelimited.webp";

import { BearCase } from "@/pages/WholeCases/BearCase/BearCase";
import { HeartCase } from "@/pages/WholeCases/HeartCase/HeartCase";

import { CapCase } from "@/pages/WholeCases/CapCase/CapCase";
import { SwissCase } from "@/pages/WholeCases/SwissCase/SwissCase";
import { JackCase } from "@/pages/WholeCases/JackCase/JackCase";
import styles from "@/pages/CasePage/CasesPage.module.css";

import { useCaseStatus } from "@/hooks/useCaseStatus";
import { miniApp, useSignal, useLaunchParams } from "@telegram-apps/sdk-react"; // Импорт для работы с темой
import { CakeCase } from "@/pages/WholeCases/CakeCase/CakeCase";
import { SkeletonCase } from "@/pages/WholeCases/SkeletonCase/SkeletonCase";
import { TopHatCase } from "@/pages/WholeCases/TopHatCase/TopHatCase";
import { SignetRingCase } from "@/pages/WholeCases/SignetRingCase/SignetRingCase";
import { VintageCigarCase } from "@/pages/WholeCases/VintageCigarCase/VintageCigarCase";
import { EggCase } from "@/pages/WholeCases/EggCase/EggCase";
import { BdayCase } from "@/pages/WholeCases/BdayCase/BdayCase";

export const CasesPage: FC = () => {
  const [selectedCase, setSelectedCase] = useState<number | null>(null);

  
  const caseStatus3 = useCaseStatus(3);

  const playerRef = useRef<Player>(null);

  const { language } = useLanguage();

  const cases = [
    { id: 15, title: "Risky Bday Case", image: caseBday, isDisabled: false, stars: 175, isNew: true},
    { id: 14, title: "Easter Case", image: caseEgg, isDisabled: false, stars: 30},
    { id: 8, title: "Cake Case", image: caseCake, isDisabled: false, stars: 30}, 
    { id: 2, title: "Heart Case", image: caseHeart, isDisabled: false, stars: 35},
    { id: 7, title: "Jack-in-the-Case", image: caseJack, isDisabled: false, stars: 40},       
    { id: 10, title: "Top Hat Case", image: caseTopHat, isDisabled: false, stars: 65},
    { id: 1, title: "Bear Case", image: caseBear, isDisabled: false, stars: 70}, 
    { id: 9, title: "Skeleton Case", image: caseSkeleton, isDisabled: false, stars: 75},
    { id: 11, title: "Signet Ring Case", image: caseSignetRing, isDisabled: false, stars: 150},
    { id: 12, title: "Cigar Case", image: caseVintageCigar, isDisabled: false, stars: 150},        
    { id: 4, title: "Swiss Case", image: caseSwiss, isDisabled: false, stars: 150},
    { id: 3, title: "Durov's Case", image: caseDurovCap, isDisabled: caseStatus3, stars: 500},
    
  ];

  // Получаем текущую тему (темную или светлую)
  const isDark = useSignal(miniApp.isDark);


  // Получаем платформу и текущую тему (темную или светлую)
  const { platform } = useLaunchParams();

  useEffect(() => {
    if (platform === 'ios') { // Проверяем, если платформа iOS
      const caseCards = document.querySelectorAll(`.${styles.caseCard}`);
  
      caseCards.forEach((card) => {
        const htmlElement = card as HTMLElement;
        if (isDark) {
          htmlElement.style.backgroundColor = "#232e3c"; // Тёмный фон для тёмной темы
        } else {
          htmlElement.style.backgroundColor = "#f1f1f1"; // Светлый фон для светлой темы
        }
      });
    }
  }, [isDark, platform]);

  if ([1].includes(selectedCase!)) {
    return <BearCase />;
  }
  if ([2].includes(selectedCase!)) {
    return <HeartCase />;
  }
  if ([3].includes(selectedCase!)) {
    return <CapCase />;
  }
  if ([4].includes(selectedCase!)) {
    return <SwissCase />;
  }
  
  if ([7].includes(selectedCase!)) {
    return <JackCase />;
  }
  if ([8].includes(selectedCase!)) {
    return <CakeCase />;
  }
  if ([9].includes(selectedCase!)) {
    return <SkeletonCase />;
  }
  if ([10].includes(selectedCase!)) {
    return <TopHatCase />;
  }
  if ([11].includes(selectedCase!)) {
    return <SignetRingCase />;
  }
  if ([12].includes(selectedCase!)) {
    return <VintageCigarCase />;
  }
  if ([14].includes(selectedCase!)) {
    return <EggCase />;
  }
  if ([15].includes(selectedCase!)) {
    return <BdayCase />;
  }

  return (
    <Page back={false}>
      <div className={styles.lottieWrapper}>
        <div className={styles.lottieBackground} />
        <Player
          ref={playerRef}
          autoplay
          keepLastFrame
          className={styles.lottieAnimation}
          src={pageAnimation}
          onEvent={(event) => {
            if (event === "complete") {
              playerRef.current?.pause();
            }
          }}
        />
      </div>
      {language === 'ru' ? <Headline plain weight="1" className={styles.HeadText}>
        Какой кейс вы хотите открыть?
      </Headline> : 
      <Headline plain weight="1" className={styles.HeadText}>
      Which case will you open?
    </Headline>      
      }
          <div className={styles.casesGrid}>
            {cases.map(({ id, title, image, isDisabled, stars, isNew,  }) => (
              <div
              key={id}
              className={`${styles.caseCard} ${isDisabled ? styles.disabledCard : ""}`}
              onClick={() => {
                if (!isDisabled) setSelectedCase(id);
              }}
            >        
             <div className={styles.cardContent}>
              {isNew && (
                <div className={styles.newTapeContainer}>
                  <img src={NewTape} alt="New" className={styles.newTape} />
                  <span className={styles.newTapeText}>
                    {language === 'ru' ? 'НОВЫЙ' : 'NEW'}
                  </span>
                </div>
              )}
              <img src={image} alt={title} className={styles.caseImage} />
              <h3 className={styles.caseTitle}>{title}</h3>
              {isDisabled ? (
                <Button disabled>blocked</Button>
              ) : (
                <div className={styles.caseStars}>
                  <img src={StarIcon} alt="star" />
                  {stars}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </Page>
  );
};
