import { useState, useEffect } from "react";
import { invoice, openPopup } from "@telegram-apps/sdk-react";
import { API_BASE_URL } from "@/config/api";
import { useLanguage } from '@/components/LanguageContext';
import { retrieveLaunchParams } from '@telegram-apps/sdk';

const { initDataRaw } = retrieveLaunchParams();

// Глобальная переменная для хранения активной сессии
let activeSessionId: string | null = null;

interface RouletteConfig {
  generateRoulette: (giftNumber?: string) => void;
  startRolling: (giftNumber: string, callback: () => void) => void;
  items: Record<string, {
    id: string;
    img: string;
    price: number;
    chance: string;
    collection?: string;
    model?: string;
    backdrop?: string;
    symbol?: string;
  }>;
}

export const useUnifiedRoulette = (
  caseType: string, 
  casePrice: number, 
  rouletteConfig: RouletteConfig,
  username?: string,
) => {
  const [winningItemId, setWinningItemId] = useState<string | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [idGiftNumber, setIdGiftNumber] = useState<number | null>(null);
  const { language } = useLanguage();
  // Создаем уникальный идентификатор сессии для этого экземпляра хука
  const [sessionId] = useState(() => Math.random().toString(36).substring(2, 15));

  const urlApi = `${API_BASE_URL}`;

  // Устанавливаем активную сессию при монтировании компонента
  useEffect(() => {
    activeSessionId = sessionId;
    
    // Очищаем активную сессию при размонтировании компонента
    return () => {
      if (activeSessionId === sessionId) {
        activeSessionId = null;
      }
    };
  }, [sessionId]);

  useEffect(() => {
    rouletteConfig.generateRoulette(); // Инициализация рулетки при монтировании
  }, [rouletteConfig]);

  // Вспомогательная функция для запуска игры
  const startGame = async () => {
    // Проверяем, что текущая сессия все еще активна
    if (activeSessionId !== sessionId) {
      console.log("Сессия больше не активна, отмена запуска игры");
      return;
    }
    
    try {
      setGameStarted(true);
      setWinningItemId(null);
      setIsModalOpen(false); // Сброс состояния модального окна

      // Получение токена для запуска игры
      const tokenRes = await fetch(`${urlApi}/startgame/roulette/get-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
          "Authorization": `tma ${initDataRaw}`,
        },
        body: JSON.stringify({}),
      });

      const tokenData = await tokenRes.json();
      if (!tokenRes.ok || !tokenData.success || !tokenData.token) {
        await openPopup({
          title: "Error",
          message: "Failed to start the game. Please try again.",
          buttons: [{ id: "ok", type: "default", text: "OK" }],
        });
        setGameStarted(false);
        return;
      }

      // Проверяем, что текущая сессия все еще активна
      if (activeSessionId !== sessionId) {
        console.log("Сессия больше не активна, отмена запуска игры");
        setGameStarted(false);
        return;
      }

      // Запуск игры на сервере
      const gameRes = await fetch(`${urlApi}/startgame/roulette/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
          "Authorization": `tma ${initDataRaw}`,
        },
        body: JSON.stringify({
          caseType,
          token: tokenData.token,
        }),
      });

      const gameData = await gameRes.json();
      if (!gameRes.ok || gameData.error) {
        alert(gameData.error || "Ошибка при записи игры");
        setGameStarted(false);
        return;
      }

      // Проверяем, что текущая сессия все еще активна
      if (activeSessionId !== sessionId) {
        console.log("Сессия больше не активна, отмена запуска игры");
        setGameStarted(false);
        return;
      }

      // Генерация визуальной рулетки с выигрышным ID
      rouletteConfig.generateRoulette(gameData.giftNumber);

      // Ожидание рендеринга DOM
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Проверяем, что текущая сессия все еще активна
      if (activeSessionId !== sessionId) {
        console.log("Сессия больше не активна, отмена запуска игры");
        setGameStarted(false);
        return;
      }

      // Запуск анимации
      rouletteConfig.startRolling(gameData.giftNumber, () => {
        // Проверяем, что текущая сессия все еще активна
        if (activeSessionId !== sessionId) {
          console.log("Сессия больше не активна, отмена запуска игры");
          setGameStarted(false);
          return;
        }
        
        setWinningItemId(gameData.giftNumber);
        setIdGiftNumber(gameData.idGiftNumber);
        setIsModalOpen(true);
        setGameStarted(false);
      });
    } catch (error) {
      console.error("❌ Ошибка при запуске игры:", error);
      alert("Произошла ошибка при запуске игры. Пожалуйста, попробуйте снова.");
      setGameStarted(false);
    }
  };

  // Основная функция для запуска игры
  const handleStart = async () => {
    if (gameStarted) return; // Защита от повторного запуска
    setGameStarted(true); // Блокировка повторных кликов сразу

    try {
      // Проверка количества звёзд
      const balanceResponse = await fetch(`${urlApi}/checkstars/roulette/check-stars`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
          "Authorization": `tma ${initDataRaw}`,
        },
        body: JSON.stringify({ casePrice }),
      });

      const balanceData = await balanceResponse.json();

      // Проверяем, что текущая сессия все еще активна
      if (activeSessionId !== sessionId) {
        console.log("Сессия больше не активна, отмена запуска игры");
        setGameStarted(false);
        return;
      }

      // Обработка недостаточного количества звёзд
      if (!balanceResponse.ok || !balanceData.success) {
        const confirm = await openPopup({
          title: language === 'ru' ? "Недостаточно звёзд" : "Not Enough Stars",
          message: language === 'ru'
            ? "У вас недостаточно звёзд для открытия этого кейса.\nХотите пополнить баланс?"
            : "You don't have enough stars to open this case.\nWould you like to top up your balance?",
          buttons: [
            { id: "yes", type: "default", text: language === 'ru' ? "Пополнить" : "Top Up" },
            { id: "no", type: "destructive", text: language === 'ru' ? "Отмена" : "Cancel" },
          ],
        });

        if (confirm !== "yes") {
          setGameStarted(false);
          return;
        }

        try {
          // Создание инвойса для пополнения баланса
          const invoiceRes = await fetch(`${urlApi}/deposit/donate`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `tma ${initDataRaw}`,
            },
            body: JSON.stringify({ username, casePrice, language }),
          });

          const invoiceData = await invoiceRes.json();

          if (!invoiceRes.ok || !invoiceData.invoice_link) {
            await openPopup({
              title: "Error",
              message: "Failed to create a payment link. Please try again later.",
              buttons: [{ id: "ok", type: "default", text: "OK" }],
            });
            setGameStarted(false);
            return;
          }

          // Открытие инвойса
          invoice.open(invoiceData.invoice_link.replace("https://t.me/$", ""));

          // Функция проверки статуса платежа
          const checkPaymentStatus = async () => {
            // Проверяем, что текущая сессия все еще активна
            if (activeSessionId !== sessionId) {
              console.log("Сессия больше не активна, отмена проверки платежа");
              return false;
            }
            
            try {
              const checkBalanceResponse = await fetch(`${urlApi}/checkstars/roulette/check-stars`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "ngrok-skip-browser-warning": "true",
                  "Authorization": `tma ${initDataRaw}`,
                },
                body: JSON.stringify({ casePrice }),
              });

              const checkBalanceData = await checkBalanceResponse.json();

              if (checkBalanceResponse.ok && checkBalanceData.success) {
                await startGame();
                return true; // Платёж успешен
              }
              return false; // Платёж ещё не успешен
            } catch (error) {
              console.error("Error checking payment status:", error);
              return false;
            }
          };

          // Механизм опроса статуса платежа
          const pollPayment = async () => {
            let attempts = 0;
            const maxAttempts = 300; // 5 минут (1 секунда * 300)
            let pollTimer: NodeJS.Timeout | null = null;

            const poll = async () => {
              // Проверяем, что текущая сессия все еще активна
              if (activeSessionId !== sessionId || attempts >= maxAttempts) {
                if (activeSessionId === sessionId) {
                  setGameStarted(false); // Завершаем попытки — разблокируем
                }
                return;
              }

              const success = await checkPaymentStatus();
              if (!success) {
                attempts++;
                pollTimer = setTimeout(poll, 1000); // Проверка каждую секунду
              }
            };

            await poll();
            
            // Очищаем таймер при размонтировании компонента
            return () => {
              if (pollTimer) {
                clearTimeout(pollTimer);
              }
            };
          };

          const cleanup = await pollPayment();
          
          // Очищаем таймер при размонтировании компонента
          return () => {
            if (cleanup) {
              cleanup();
            }
          };
        } catch (err) {
          console.error("❌ Error creating invoice:", err);
          await openPopup({
            title: "Error",
            message: "Something went wrong while creating the payment link.",
            buttons: [{ id: "ok", type: "default", text: "OK" }],
          });
          setGameStarted(false);
          return;
        }
      }

      // Запуск игры, если достаточно звёзд
      await startGame();
    } catch (error) {
      console.error("❌ Ошибка при проверке звёзд:", error);
      alert("Ошибка подключения к серверу");
      setGameStarted(false);
    }
  };

  // Закрытие модального окна
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // Продажа выигрыша
  const handleSell = async () => {
    if (!winningItemId || !idGiftNumber) return;

    const winningItem = Object.values(rouletteConfig.items).find(item => item.id === winningItemId);
    if (!winningItem) return;

    // Подтверждение перед продажей
    const confirm = await openPopup({
      title: language === 'ru' ? "Подтвердите продажу" : "Confirm Sale",
      message: language === 'ru'
        ? `Вы хотите продать этот подарок за ${winningItem.price}⭐?\n\nВы не получите сам подарок, но звезды будут добавлены на ваш баланс.`
        : `Sell this gift for ${winningItem.price}⭐?\n\nYou won't receive the gift, but the stars will be added to your balance.`,
      buttons: [
        { id: "yes", type: "default", text: language === 'ru' ? "Да" : "Yes" },
        { id: "no", type: "destructive", text: language === 'ru' ? "Нет" : "No" },
      ],
    });

    if (confirm !== "yes") return;

    try {
      const res = await fetch(`${urlApi}/sell/roulette/sell`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
          "Authorization": `tma ${initDataRaw}`,
        },
        body: JSON.stringify({
          idGiftNumber,
          price: winningItem.price,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        await openPopup({
          title: "Error",
          message: data.error || "Error while selling gift",
          buttons: [{ id: "ok", type: "default", text: "OK" }],
        });
        return;
      }

      // Закрываем модалку после успешной продажи
      setIsModalOpen(false);
    } catch (err) {
      console.error("❌ Sell error:", err);
      await openPopup({
        title: "Error",
        message: "Unexpected error while selling gift.",
        buttons: [{ id: "ok", type: "default", text: "OK" }],
      });
    }
  };

  // Сброс состояния игры при выигрыше
  useEffect(() => {
    if (winningItemId !== null) {
      setGameStarted(false);
    }
  }, [winningItemId]);

  // Горизонтальный скролл колесиком мыши
  useEffect(() => {
    const container = document.querySelector(".possible-prizes-container") as HTMLElement | null;
    if (!container) return;

    const handleWheelScroll = (event: WheelEvent) => {
      event.preventDefault();
      container.scrollLeft += event.deltaY;
    };

    container.addEventListener("wheel", handleWheelScroll as EventListener);
    return () => container.removeEventListener("wheel", handleWheelScroll as EventListener);
  }, []);

  return {
    winningItemId,
    gameStarted,
    isModalOpen,
    handleStart,
    handleCloseModal,
    handleSell,
    idGiftNumber,
  };
}; 