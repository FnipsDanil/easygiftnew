require("dotenv").config();
const express = require("express");
const { Client } = require("pg");
const { validate, parse } = require('@telegram-apps/init-data-node');

const router = express.Router();

const dbConfig = {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
};

router.post("/roulette/check-stars", async (req, res) => {
  const { casePrice } = req.body;
  const initDataRaw = req.headers.authorization?.replace(/^tma\s+/i, "");

  if (casePrice === undefined) {
    return res.status(400).json({ error: "casePrice обязателен" });
  }

  if (!initDataRaw) {
    return res.status(401).json({ error: "Отсутствует initData" });
  }

  let parsed;
  let telegramUserId;
  try {
    validate(initDataRaw, process.env.BOT_TOKEN); // ✅ Проверка подписи
    parsed = parse(initDataRaw); // 🧾 Разбор initData в объект

    // ⏳ Проверка актуальности initData
    const now = Math.floor(Date.now() / 1000);
    const authAge = now - parsed.auth_date;
    if (authAge > 600) { 
      return res.status(403).json({ error: "Истек срок действия сессии" });
    }
    
    // Extract user ID from parsed initData
    telegramUserId = parsed?.user?.id;
    
    if (!telegramUserId) {
      return res.status(400).json({ error: "Не удалось определить ID пользователя" });
    }

  } catch (e) {
    console.error("❌ Невалидный initData:", e);
    return res.status(403).json({ error: "Недопустимый запрос" });
  }

  const client = new Client(dbConfig);
  await client.connect();

  try {
    const result = await client.query("SELECT stars_count FROM users WHERE chat_id = $1", [telegramUserId]);
    const user = result.rows[0];

    if (!user || user.stars_count < casePrice) {
      return res.status(403).json({ error: "Недостаточно звёзд для запуска" });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("❌ Ошибка при проверке звёзд:", error);
    res.status(500).json({ error: "Ошибка сервера" });
  } finally {
    await client.end();
  }
});

module.exports = router;
