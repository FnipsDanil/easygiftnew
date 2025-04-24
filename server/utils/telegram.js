const express = require("express");
const axios = require("axios");
const { Client } = require("pg");
const { validateInitData } = require("../utils/validateInitData");

const router = express.Router();

const BOT_TOKEN = process.env.BOT_TOKEN;

const dbConfig = {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
};

// Проверка через Telegram API
async function isValidChat(chatId) {
  try {
    const res = await axios.get(
      `https://api.telegram.org/bot${BOT_TOKEN}/getChat?chat_id=${chatId}`
    );
    console.log(`✅ Пользователь ${chatId} подтверждён через getChat`);
    return true;
  } catch (err) {
    console.warn(`⚠️ getChat: Пользователь ${chatId} не найден`);
    return false;
  }
}

// 🔄 Проверка, есть ли пользователь в verified_senders
router.post("/check-verified", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("tma ")) {
    return res.status(401).json({ verified: false, error: "Unauthorized" });
  }

  const initDataRaw = authHeader.substring(4);
  const telegramUser = validateInitData(initDataRaw);
  if (!telegramUser) {
    return res.status(401).json({ verified: false, error: "Invalid initData" });
  }

  const chatId = telegramUser.id;

  const client = new Client(dbConfig);
  await client.connect();

  try {
    const check = await client.query(
      "SELECT * FROM verified_senders WHERE chat_id = $1",
      [chatId]
    );

    const isVerified = check.rows.length > 0;
    res.json({ verified: isVerified });
  } catch (err) {
    console.error("❌ Ошибка при проверке verified_senders:", err);
    res.status(500).json({ verified: false, error: "Database error" });
  } finally {
    await client.end();
  }
});

module.exports = {
  router,
  isValidChat,
};
