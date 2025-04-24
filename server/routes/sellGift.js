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

// Объект с ценами предметов для проверки
const itemPrices = {
  "5170233102089322756": 15,  // Bear
  "5170145012310081615": 15,  // Heart
  "5170250947678437525": 25,  // Gift
  "5170521118301225164": 100, // Gem
  "5170690322832818290": 100, // Ring
  "5168043875654172773": 100, // Trophy
  "5170564780938756245": 50,  // Rocket
  "5170314324215857265": 50,  // Roses
  "5170144170496491616": 50,  // Cake
  "5168103777563050263": 25,  // RoseSingle
  "6028601630662853006": 50,  // Champangne
  "5782984811920491178": 350, // HappyBirth
  "6042113507581755979": 200, // rareRocket
  "5773791997064119815": 75, // Easter Cake
  "5773725897517433693": 150, // Easter Rabbit
  "5773668482394620318": 200, // Easter Egg
  "9999": 800,               // Rare Bear
  "9998": 275,               // Heart Cookie
  "9997": 9999,              // Durov's Cap
  "9996": 3000,              // Swiss Watch
  "9995": 300,               // Jack In The Box
  "9994": 250,               // HomeMade Cake
  "9993": 1000,               // Skeleton Skull
  "9992": 600,               // Top Hat Rare  
  "9991": 3000,              // Signet Ring Rare
  "9990": 3000,              // Vintage Cigar Rare
  "9989": 250,               // Easter Egg Rare
};

router.post("/roulette/sell", async (req, res) => {
  const { idGiftNumber, price, language } = req.body;
  const initDataRaw = req.headers.authorization?.replace(/^tma\s+/i, "");

  if (!idGiftNumber || !price) {
    return res.status(400).json({ error: "idGiftNumber и price обязательны" });
  }

  if (!initDataRaw) {
    return res.status(401).json({ error: "Отсутствует initData" });
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
    const userRes = await client.query("SELECT id_user FROM users WHERE chat_id = $1", [telegramUserId]);
    const user = userRes.rows[0];
  
    if (!user) {
      return res.status(404).json({ error: "Пользователь не найден" });
    }
  
    const userDbId = user.id_user;
  
    await client.query('BEGIN');
  
    const checkRes = await client.query(`
      SELECT * FROM gift_user_have 
      WHERE id_gift_number = $1 AND user_id = $2 AND received = false AND locked = false
      FOR UPDATE
    `, [idGiftNumber, userDbId]);
  
    if (checkRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        error: language === "ru"
          ? "Подарок уже получен или в процессе отправки"
          : "The gift has already been claimed or is being processed"
      });
    }
  
    const giftId = checkRes.rows[0].gift_number;
    const actualPrice = itemPrices[giftId];
  
    if (!actualPrice) {
      await client.query('ROLLBACK');
      console.log(`Неверный ID предмета: ${giftId}`);
      return res.status(400).json({
        error: language === "ru"
          ? "Неверный ID предмета"
          : "Invalid item ID"
      });
    }
  
    if (Number(price) !== actualPrice) {
      await client.query('ROLLBACK');
      console.log(`Попытка продажи с неверной ценой. Отправлено: ${price}, Ожидается: ${actualPrice}`);
      return res.status(400).json({
        error: language === "ru"
          ? "Неверная цена предмета"
          : "Invalid item price"
      });
    }
  
    // 🔒 Блокируем подарок (на случай параллельных попыток)
    await client.query(`
      UPDATE gift_user_have SET locked = true WHERE id_gift_number = $1
    `, [idGiftNumber]);
  
    // ✅ Обновляем звёзды
    await client.query(`
      UPDATE users SET stars_count = stars_count + $1 WHERE id_user = $2
    `, [actualPrice, userDbId]);
  
    // ✅ Обновляем подарок как полученный
    await client.query(`
      UPDATE gift_user_have SET received = true WHERE id_gift_number = $1
    `, [idGiftNumber]);
  
    // ✅ Записываем в историю
    await client.query(`
      INSERT INTO history_deposit (user_id, price, source, id_gift_number)
      VALUES ($1, $2, 'sell', $3)
    `, [userDbId, actualPrice, idGiftNumber]);
  
    await client.query('COMMIT');
  
    console.log(`💰 Пользователь ${telegramUserId} продал подарок id #${idGiftNumber} за ${actualPrice}⭐`);
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Ошибка при продаже подарка:", err);
    try {
      await client.query('ROLLBACK');
    } catch (rollbackErr) {
      console.error("⚠️ Ошибка при откате транзакции:", rollbackErr);
    }
    res.status(500).json({ error: "Ошибка сервера" });
  } finally {
    try {
      await client.query(
        "UPDATE gift_user_have SET locked = false WHERE id_gift_number = $1",
        [idGiftNumber]
      );
    } catch (unlockErr) {
      console.error("⚠️ Не удалось разблокировать подарок:", unlockErr);
    }
  
    await client.end();
  }
});

module.exports = router;
