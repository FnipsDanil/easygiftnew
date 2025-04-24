require("dotenv").config();
const axios = require("axios");

const BOT_TOKEN = process.env.BOT_TOKEN;
const BUSINESS_CONNECTION_ID = process.env.BUSINESS_CONNECTION_ID;

// 🔹 Получить баланс звёзд на бизнес-аккаунте
async function checkBalance() {
  try {
    const res = await axios.post(
      `https://api.telegram.org/bot${BOT_TOKEN}/getBusinessAccountStarBalance`,
      {
        business_connection_id: BUSINESS_CONNECTION_ID,
      }
    );

    const balance = res.data?.result?.star_count;
    console.log("📦 Ответ от getBusinessAccountStarBalance:", res.data);

    if (balance === undefined) {
      console.warn("❗ balance (star_count) не найден в ответе");
      return null;
    }

    console.log(`🌟 Текущий баланс: ${balance} звёзд`);
    return balance;
  } catch (err) {
    console.error("⛔️ Ошибка при получении баланса:", err.response?.data || err.message);
    return null;
  }
}

// 🔹 Получить все доступные подарки (offset support)
async function getAvailableBusinessGifts() {
  try {
    let allGifts = [];
    let offset;

    while (true) {
      const res = await axios.post(
        `https://api.telegram.org/bot${BOT_TOKEN}/getBusinessAccountGifts`,
        {
          business_connection_id: BUSINESS_CONNECTION_ID,
          offset,
        }
      );

      const result = res.data?.result;
      const batch = result?.gifts || [];

      allGifts.push(...batch);

      if (!result?.next_offset) break;
      offset = result.next_offset;
    }

    console.log("📦 Всего получено подарков:", allGifts.length);
    return allGifts;
  } catch (err) {
    console.error("❌ Ошибка при получении доступных подарков:", err.response?.data || err.message);
    return [];
  }
}

// 🔹 Найти подарок по имени (startWith)
function findGiftByName(gifts, namePart) {
  const found = gifts.find(
    (g) =>
      g?.type === "unique" &&
      g?.can_be_transferred &&
      typeof g?.gift?.name === "string" &&
      g.gift.name.startsWith(namePart)
  );

  if (found) {
    console.log(`🎯 Найден уникальный подарок "${namePart}":`, found.gift.name);
  } else {
    console.warn(`❌ Подарок, начинающийся на "${namePart}", не найден`);
    console.log("📜 Все имена:", gifts.map((g) => g?.gift?.name).filter(Boolean));
  }

  return found;
}

// 🔹 Отправить запрос в Python-сервис
async function sendGiftToPython(ownedGiftId, chatId, giftName = null) {
  const payload = {
    owned_gift_id: ownedGiftId,
    new_owner_chat_id: Number(chatId),
    star_count: 25,
  };

  console.log("📤 Отправка в Python:", payload);

  try {
    const response = await axios.post("http://gifter:5050/transfer-gift", payload);

    if (response.data.status === "success") {
      console.log(`🏱 Успешно отправлен подарок "${giftName || ownedGiftId}" для chat_id ${chatId}`);
    } else {
      console.warn("⚠️ Ответ от Python:", response.data);
    }

    return response.data;
  } catch (err) {
    console.error("❌ Ошибка при отправке в Python:", err.response?.data || err.message);
    return { status: "error", message: err.message };
  }
}

module.exports = {
  checkBalance,
  getAvailableBusinessGifts,
  findGiftByName,
  sendGiftToPython,
};