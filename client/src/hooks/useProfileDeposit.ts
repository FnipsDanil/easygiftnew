import { invoice, openPopup } from "@telegram-apps/sdk-react";
import { API_BASE_URL } from "@/config/api";
import { useLanguage } from '@/components/LanguageContext';
import { retrieveLaunchParams } from "@telegram-apps/sdk";

export const useProfileDeposit = () => {
  const { language } = useLanguage();
  const urlApi = `${API_BASE_URL}`;
  const { initDataRaw } = retrieveLaunchParams();

  const handleDeposit = async (amount: number, refetchStars?: () => void) => {
    const confirm = await openPopup({
      title: language === 'ru' ? "Пополнение баланса" : "Top up balance",
      message: language === 'ru' 
        ? "Хотите пополнить баланс?" 
        : "Would you like to top up your balance?",
      buttons: [
        { id: "yes", type: "default", text: language === 'ru' ? "Пополнить" : "Top Up" },
        { id: "no", type: "destructive", text: language === 'ru' ? "Отмена" : "Cancel" },
      ],
    });

    if (confirm !== "yes") return;

    try {
      // Get initial stars count
      const initialStarsRes = await fetch(`${urlApi}/depositprofile/get-stars`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `tma ${initDataRaw}`
        }
      });
      const initialStarsData = await initialStarsRes.json();
      const initialStars = initialStarsData?.stars || 0;

      const invoiceRes = await fetch(`${urlApi}/depositprofile/profiledonate`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `tma ${initDataRaw}`
        },
        body: JSON.stringify({ amount, language }),
      });

      const invoiceData = await invoiceRes.json();

      if (!invoiceRes.ok || !invoiceData.invoice_link) {
        await openPopup({
          title: "Error",
          message: "Failed to create a payment link. Please try again later.",
          buttons: [{ id: "ok", type: "default", text: "OK" }],
        });
        return;
      }

      // Open link through Telegram API
      invoice.open(invoiceData.invoice_link.replace("https://t.me/$", ""));

      // Start checking balance immediately
      const startTime = Date.now();
      const maxWaitTime = 5 * 60 * 1000; // 5 minutes timeout
      const checkInterval = 1000; // Check every second

      const checkBalance = async () => {
        try {
          const checkRes = await fetch(`${urlApi}/depositprofile/get-stars`, {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              "Authorization": `tma ${initDataRaw}`
            }
          });

          const checkData = await checkRes.json();
          const currentStars = checkData?.stars || 0;

          if (currentStars > initialStars) {
            // Payment successful
            refetchStars?.(); // Update UI
            await openPopup({
              title: language === 'ru' ? "Успех" : "Success",
              message: language === 'ru' ? "Баланс успешно пополнен!" : "Balance successfully updated!",
              buttons: [{ id: "ok", type: "default", text: "OK" }],
            });
            return true;
          }

          // Check if we've exceeded the maximum wait time
          if (Date.now() - startTime > maxWaitTime) {
            await openPopup({
              title: language === 'ru' ? "Внимание" : "Attention",
              message: language === 'ru' 
                ? "Время ожидания оплаты истекло. Если вы уже оплатили, пожалуйста, обновите страницу." 
                : "Payment wait time expired. If you have already paid, please refresh the page.",
              buttons: [{ id: "ok", type: "default", text: "OK" }],
            });
            return true;
          }

          return false;
        } catch (err) {
          console.error("Error checking stars:", err);
          return false;
        }
      };

      // Poll until payment is confirmed or timeout
      const poll = async () => {
        const isDone = await checkBalance();
        if (!isDone) {
          setTimeout(poll, checkInterval);
        }
      };

      // Start polling
      poll();

    } catch (err) {
      console.error("Error creating invoice:", err);
      await openPopup({
        title: "Error",
        message: "Something went wrong while creating the payment link.",
        buttons: [{ id: "ok", type: "default", text: "OK" }],
      });
    }
  };

  return {
    handleDeposit,
  };
};
