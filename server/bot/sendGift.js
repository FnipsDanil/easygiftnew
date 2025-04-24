require("dotenv").config();
const express = require("express");
const axios = require("axios");
const { Client } = require("pg");
const { validate, parse } = require('@telegram-apps/init-data-node');

const router = express.Router();

const BOT_TOKEN = process.env.BOT_TOKEN;
const TELEGRAM_API_URL = `https://api.telegram.org/bot${BOT_TOKEN}/sendGift`;

const dbConfig = {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
};

router.post("/send-gift", async (req, res) => {
  const { id_gift_number, language = "en" } = req.body;
  const initDataRaw = req.headers.authorization?.replace(/^tma\s+/i, "");

  if (!id_gift_number) {
    return res.status(400).json({ success: false, error: "id_gift_number обязателен" });
  }

  if (!initDataRaw) {
    return res.status(401).json({ success: false, error: "Отсутствует initData" });
  }

  let telegramUserId;
  try {
    validate(initDataRaw, BOT_TOKEN);
    const parsed = parse(initDataRaw);

    const now = Math.floor(Date.now() / 1000);
    const authAge = now - parsed.auth_date;
    if (authAge > 6000) {
      return res.status(403).json({ success: false, error: "Срок действия сессии истёк" });
    }

    telegramUserId = parsed?.user?.id;
  } catch (err) {
    console.error("❌ Невалидный initData:", err);
    return res.status(403).json({ success: false, error: "Недопустимый запрос" });
  }

  const client = new Client(dbConfig);
  await client.connect();

  try {
    await client.query('BEGIN');

    const userRes = await client.query(
      "SELECT id_user FROM users WHERE chat_id = $1 FOR UPDATE",
      [telegramUserId]
    );
    const user = userRes.rows[0];

    if (!user) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: "Пользователь не найден" });
    }

    const userDbId = user.id_user;

    const gameHistoryRes = await client.query(`
      SELECT * FROM history_game 
      WHERE id_gift_number = $1 AND user_id = $2
    `, [id_gift_number, userDbId]);

    if (gameHistoryRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(403).json({
        success: false,
        error: language === "ru"
          ? "Этот подарок не был получен через прокрут рулетки"
          : "This gift was not obtained through roulette"
      });
    }

    const recentGiftsRes = await client.query(`
      SELECT COUNT(*) FROM gift_user_have 
      WHERE user_id = $1 
      AND received = true 
      AND id_gift_number IN (
        SELECT id_gift_number FROM history_game 
        WHERE user_id = $1 
        AND date > NOW() - INTERVAL '10 minutes'
      )
    `, [userDbId]);

    const recentGiftsCount = parseInt(recentGiftsRes.rows[0].count);
    if (recentGiftsCount >= 50) {
      await client.query('ROLLBACK');
      return res.status(429).json({
        success: false,
        error: language === "ru"
          ? "Вы уже вывели или продали 50 подарков за последние 10 минут. Пожалуйста, подождите."
          : "You have already claimed or sold 50 gifts in the last 10 minutes. Please wait before trying again."
      });
    }

    const checkRes = await client.query(`
      SELECT * FROM gift_user_have 
      WHERE id_gift_number = $1 AND user_id = $2 AND received = false AND locked = false
    `, [id_gift_number, userDbId]);

    if (checkRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        success: false,
        error: language === "ru"
          ? "Подарок уже получен или в процессе отправки"
          : "The gift has already been claimed or is being processed"
      });
    }

    await client.query("UPDATE gift_user_have SET locked = true WHERE id_gift_number = $1", [id_gift_number]);

    const giftRes = await client.query(
      "SELECT gift_number FROM gift_user_have WHERE id_gift_number = $1",
      [id_gift_number]
    );
    const gift_number = giftRes.rows[0]?.gift_number;

    console.log(`📡 Отправляем подарок ${gift_number} пользователю ${telegramUserId}`);
    const payload = {
      user_id: telegramUserId,
      gift_id: gift_number,
      pay_for_upgrade: false,
    };

    const response = await axios.post(TELEGRAM_API_URL, payload, {
      headers: { "Content-Type": "application/json" },
    });

    console.log("✅ Ответ от Telegram API:", response.data);

    await client.query(`
      UPDATE gift_user_have SET received = true WHERE id_gift_number = $1 AND user_id = $2
    `, [id_gift_number, userDbId]);

    await client.query('COMMIT');

    res.json({ success: true, message: `Подарок #${gift_number} отправлен пользователю ${telegramUserId}` });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error("❌ Ошибка при отправке или обновлении:", error.response?.data || error.message);
    res.status(500).json({ success: false, error: error.response?.data || error.message });
  } finally {
    try {
      await client.query("UPDATE gift_user_have SET locked = false WHERE id_gift_number = $1", [id_gift_number]);
    } catch (unlockErr) {
      console.error("⚠️ Не удалось разблокировать подарок:", unlockErr);
    }

    await client.end();
  }
});

module.exports = router;
