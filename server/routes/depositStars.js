require("dotenv").config();
const express = require("express");
const { Client } = require("pg");
const fetch = require("node-fetch");
const { validate, parse } = require('@telegram-apps/init-data-node');

const dbConfig = {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
};

module.exports = (bot) => {
  const router = express.Router();

  router.post("/donate", async (req, res) => {
    const { username, casePrice, language = 'en' } = req.body;
    const initDataRaw = req.headers.authorization?.replace(/^tma\s+/i, "");
  
    if (casePrice === undefined) {
      return res.status(400).json({
        error: language === 'ru' ? "casePrice обязателен" : "casePrice is required"
      });
    }
  
    if (!initDataRaw) {
      return res.status(401).json({ error: "Missing initData" });
    }
  
    let parsed;
    let telegramUserId;
    try {
      validate(initDataRaw, process.env.BOT_TOKEN);
      parsed = parse(initDataRaw);
  
      // ⏳ Проверка актуальности
      const now = Math.floor(Date.now() / 1000);
      const authAge = now - parsed.auth_date;
      if (authAge > 6000) {
        return res.status(403).json({ error: "Срок действия сессии истёк" });
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
      // 📌 Проверка и создание пользователя, если его нет
      const userResult = await client.query("SELECT * FROM users WHERE chat_id = $1", [telegramUserId]);
      if (userResult.rows.length === 0) {
        await client.query(
          `INSERT INTO users (chat_id, username, stars_count)
           VALUES ($1, $2, 0)
           ON CONFLICT (chat_id) DO NOTHING;`,
          [telegramUserId, username || "unknown"]
        );  
        console.log(`✅ Пользователь ${telegramUserId} добавлен в БД`);
      }
  
      // 📌 Проверка баланса
      const result = await client.query("SELECT stars_count FROM users WHERE chat_id = $1", [telegramUserId]);
      const user = result.rows[0];
  
      if (!user) {
        return res.status(404).json({
          error: language === 'ru' ? "Пользователь не найден" : "User not found"
        });
      }
  
      const currentStars = user.stars_count;
      const required = casePrice;
      const needToBuy = required - currentStars;
  
      if (needToBuy <= 0) {
        return res.status(400).json({
          error: language === 'ru' ? "У вас уже достаточно звёзд" : "You already have enough stars"
        });
      }
  
      const amount = needToBuy;
      const prices = [{ label: language === 'ru' ? "Пополнение" : "Top Up", amount }];

      // 📌 Запрос к Telegram API
      const response = await fetch(`https://api.telegram.org/bot${bot.token}/createInvoiceLink`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: language === 'ru' ? "💫 Пополнение звёзд" : "💫 Top Up Stars",
          description: language === 'ru' ? `Не хватает ${needToBuy}⭐ для запуска рулетки` : `You need ${needToBuy}⭐ to start the roulette`,
          payload: "stars_donation",
          provider_token: "", // Telegram Stars
          currency: "XTR",
          prices,
        }),
      });
  
      const invoice = await response.json();
  
      if (!invoice.ok || !invoice.result) {
        throw new Error(invoice.description || (language === 'ru' ? "Не удалось создать ссылку на оплату" : "Failed to create payment link"));
      }
  
      console.log("✅ Ссылка на оплату создана:", invoice.result);
      res.status(200).json({ invoice_link: invoice.result });
    } catch (err) {
      console.error("❌ Ошибка при создании ссылки на оплату:", err);
      res.status(500).json({
        error: language === 'ru' ? "Ошибка при создании платежа" : "Error while creating payment link"
      });
    } finally {
      await client.end();
    }
  });
  

  return router;
};
