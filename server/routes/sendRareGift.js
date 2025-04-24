require("dotenv").config();
const express = require("express");
const { Client } = require("pg");
const { bot } = require("../bot/bot");
const { validateInitData } = require("../utils/validateInitData");
const {
  checkBalance,
  getAvailableBusinessGifts,
  findGiftByName,
  sendGiftToPython,
} = require("../utils/sendGiftToPython");
const {
  disableCaseIfNeeded,
  notifyAdmins,
} = require("../utils/rareGiftHelpers");
const { isValidChat } = require("../utils/telegram");

const router = express.Router();

const dbConfig = {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
};

router.post("/send-rare-gift", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("tma ")) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  const initDataRaw = authHeader.substring(4);
  const telegramUser = validateInitData(initDataRaw);

  if (!telegramUser) {
    return res.status(401).json({ success: false, error: "Invalid initData" });
  }

  const chatId = telegramUser.id;
  const username = telegramUser.username || "unknown";
  const { id_gift_number, gift_id, extra, language } = req.body;

  if (!id_gift_number || !gift_id) {
    return res.status(400).json({ success: false, error: "Missing required fields" });
  }

  const extraData = extra || {};
  const { collection, model, backdrop, symbol } = extraData;

  if (!collection || !model || !backdrop || !symbol) {
    return res.status(400).json({ success: false, error: "Missing fields in extra data" });
  }

  const client = new Client(dbConfig);
  await client.connect();
  if (gift_id === '9995' || gift_id === '9989' || gift_id === '9994' ||
     gift_id === '9998' || gift_id === '9992' || gift_id === '9993' || gift_id === '9991'
      || gift_id === '9990' || gift_id === '9999' || gift_id === '9996') {
  const verifiedCheck = await client.query(
    `SELECT 1 FROM verified_senders 
     WHERE chat_id = $1 AND verified_at >= NOW() - INTERVAL '2 days'`,
    [chatId]
  );
  
  if (verifiedCheck.rowCount === 0) {
    await client.end();
    return res.status(403).json({
      success: false,
      error: "User must write in chat first",
    });
  }}

  const checkLocked = await client.query(
    "SELECT locked FROM gift_user_have WHERE id_gift_number = $1",
    [id_gift_number]
  );
  if (checkLocked.rows[0]?.locked) {
    await client.end();
    return res.status(409).json({ success: false, error: "Gift is currently in use." });
  }

  const checkRes = await client.query(
    `SELECT * FROM gift_user_have 
     WHERE id_gift_number = $1 
       AND user_id = (SELECT id_user FROM users WHERE chat_id = $2::BIGINT)
       AND received = false 
       AND locked = false`,
    [id_gift_number, Number(chatId)]
  );

  if (checkRes.rows.length === 0) {
    await client.end();
    return res.status(409).json({
      success: false,
      error:
        language === "ru"
          ? "Подарок уже получен или в процессе отправки"
          : "The gift has already been claimed or is being processed",
    });
  }

  await client.query(
    "UPDATE gift_user_have SET locked = true WHERE id_gift_number = $1",
    [id_gift_number]
  );

  try {
    await client.query(
      `UPDATE gift_user_have SET received = true 
       WHERE id_gift_number = $1 AND user_id = (
         SELECT id_user FROM users WHERE chat_id = $2::BIGINT
       )`,
      [id_gift_number, Number(chatId)]
    );

    await client.query(
      `INSERT INTO rare_gift_claims 
      (chat_id, username, gift_number, collection, model, backdrop, symbol)
      VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [chatId, username, gift_id, collection, model, backdrop, symbol]
    );

    if (gift_id === '9995' || gift_id === '9989' || gift_id === '9994'
      || gift_id === '9998' || gift_id === '9992' || gift_id === '9993'
      || gift_id === '9991' || gift_id === '9990' || gift_id === '9999' || gift_id === '9996') {
      const isKnown = await isValidChat(chatId);     
      const balance = await checkBalance();
      let giftWasSent = false;

      if (!isKnown) {
        const adminText = `
<b>🚫 Пользователь не найден в Telegram при автоотправке</b>

👤 Пользователь: @${username}
🆔 chat_id: ${chatId}
🎁 Подарок: ${gift_id}
📦 Коллекция: ${collection}
🧩 Модель: ${model}
🎨 Оформление: ${backdrop}
🧷 Символ: ${symbol}
⭐️ Баланс: ${balance ?? "неизвестен"} звёзд
        `;
        await notifyAdmins(bot, chatId, username, gift_id, extraData, adminText);
        await disableCaseIfNeeded(client, gift_id);
        await client.end();
        return res.json({ success: true, skipped: true });
      }

      if (!balance || balance < 25) {
        const adminText = `
<b>🚫 Недостаточно звёзд для автоотправки подарка</b>

👤 Пользователь: @${username}
🆔 chat_id: ${chatId}
🎁 Подарок: ${gift_id}
📦 Коллекция: ${collection}
🧩 Модель: ${model}
🎨 Оформление: ${backdrop}
🧷 Символ: ${symbol}
⭐️ Баланс: ${balance ?? "неизвестен"} звёзд
`;
        await notifyAdmins(bot, chatId, username, gift_id, extraData, adminText);
      } else {
        const gifts = await getAvailableBusinessGifts();

        let foundGift;

        if (gift_id === '9995') {
          foundGift = gifts.find(
            (g) =>
              g?.type === "unique" &&
              g?.can_be_transferred &&
              g?.gift?.name?.startsWith("JackInTheBox") &&
              g?.gift?.name !== "JackInTheBox-17010"
          );
        } else if (gift_id === '9989') {
          foundGift = gifts.find(
            (g) =>
              g?.type === "unique" &&
              g?.can_be_transferred &&
              g?.gift?.name?.startsWith("EasterEgg")
          );
        } else if (gift_id === '9994') {
          foundGift = gifts.find(
            (g) =>
              g?.type === "unique" &&
              g?.can_be_transferred &&
              g?.gift?.name?.startsWith("HomemadeCake")
          );
        } else if (gift_id === '9998') {
          foundGift = gifts.find(
            (g) =>
              g?.type === "unique" &&
              g?.can_be_transferred &&
              g?.gift?.name?.startsWith("CookieHeart")
          );
        } else if (gift_id === '9992') {
          foundGift = gifts.find(
            (g) =>
              g?.type === "unique" &&
              g?.can_be_transferred &&
              g?.gift?.name?.startsWith("TopHat")
          );
        } else if (gift_id === '9993') {
          foundGift = gifts.find(
            (g) =>
              g?.type === "unique" &&
              g?.can_be_transferred &&
              g?.gift?.name?.startsWith("ElectricSkull")
          );
        } else if (gift_id === '9991') {
          foundGift = gifts.find(
            (g) =>
              g?.type === "unique" &&
              g?.can_be_transferred &&
              g?.gift?.name?.startsWith("SignetRing")
          );
        } else if (gift_id === '9990') {
          foundGift = gifts.find(
            (g) =>
              g?.type === "unique" &&
              g?.can_be_transferred &&
              g?.gift?.name?.startsWith("VintageCigar")
          );
        } else if (gift_id === '9999') {
          foundGift = gifts.find(
            (g) =>
              g?.type === "unique" &&
              g?.can_be_transferred &&
              g?.gift?.name?.startsWith("ToyBear")
          );
        } else if (gift_id === '9996') {
          foundGift = gifts.find(
            (g) =>
              g?.type === "unique" &&
              g?.can_be_transferred &&
              g?.gift?.name?.startsWith("SwissWatch")
          );
        }
          
        if (!foundGift) {
          const adminText = `
<b>🚫 Подарок не найден в инвентаре (хотя звёзды есть)</b>

👤 Пользователь: @${username}
🆔 chat_id: ${chatId}
🎁 Подарок: ${gift_id}
📦 Коллекция: ${collection}
🧩 Модель: ${model}
🎨 Оформление: ${backdrop}
🧷 Символ: ${symbol}
⭐️ Баланс: ${balance} звёзд
`;
          await notifyAdmins(bot, chatId, username, gift_id, extraData, adminText);
        } else {
          const giftResult = await sendGiftToPython(
            foundGift.owned_gift_id,
            Number(chatId),
            foundGift.gift.name
          );

          if (giftResult.status === "success") {
            giftWasSent = true;
          }

          const updatedBalance = await checkBalance();
          const adminText = `
<b>${giftWasSent ? '✅ Уникальный подарок успешно отправлен!\n\n🎉🎉🎉' : '⚠️ Попытка автоотправки завершилась неудачей'}</b>

👤 Пользователь: @${username}
🆔 chat_id: ${chatId}
🎁 Подарок: ${foundGift?.gift?.name || gift_id}
📦 Коллекция: ${collection}
🧩 Модель: ${model}
🎨 Оформление: ${backdrop}
🧷 Символ: ${symbol}
⭐️ Остаток звёзд: ${updatedBalance ?? balance ?? "неизвестен"}
`;
          await notifyAdmins(bot, chatId, username, gift_id, extraData, adminText);
        }
      }
    } else {
      // Старое поведение для остальных редких подарков
      const adminText = `
<b>🎉 Редкий подарок получен!</b>

👤 Пользователь: @${username}
🆔 chat_id: ${chatId}
🎁 Подарок: ${gift_id}
📦 Коллекция: ${collection}
🧩 Модель: ${model}
🎨 Оформление: ${backdrop}
🧷 Символ: ${symbol}
`;
      await notifyAdmins(bot, chatId, username, gift_id, extraData, adminText);
    }

    await disableCaseIfNeeded(client, gift_id);
    await client.end();
    return res.json({ success: true });
  } catch (error) {
    console.error("❌ Ошибка при обработке редкого подарка:", error);
    await client.end();
    return res.status(500).json({ success: false, error: "Server error" });
  }
});

module.exports = router;
