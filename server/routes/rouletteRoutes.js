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

// Map для хранения токенов сессий
const sessionTokens = new Map();

const CASE_PRICES = {
  heart: 35,
  swiss: 150,
  bear: 70,
  cap: 500,
  jack: 40,
  cake: 30,
  skeleton: 75,
  tophat: 65,
  signetring: 150,
  vintagecigar: 150,
  egg: 30,
  bday: 175,
};


// Helper function to get random gift number based on case type
function getRandomGiftNumber(caseType) {
  if (caseType === 'swiss') {
    const r = Math.floor(Math.random() * 100000);

    if (r < 4000) return "5170233102089322756"; 
    if (r < 8000) return "5170145012310081615";
    if (r < 16000) return "5170250947678437525"; 
    if (r < 30000) return "5170521118301225164";
    if (r < 44000) return "5170690322832818290";
    if (r < 58000) return "5168043875654172773"; 
    if (r < 65000) return "5170564780938756245";  
    if (r < 72000) return "5170314324215857265"; 
    if (r < 79000) return "5170144170496491616";
    if (r < 87000) return "5168103777563050263";
    if (r < 94000) return "6028601630662853006";
    if (r < 99000) return "5782984811920491178"; 
    return "9996";                    
  }

  throw new Error(`Unknown case type: ${caseType}`);
}

// Генерация токена сессии
function generateSessionToken() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// 🎯 Получение токена для начала игры
router.post("/roulette/get-token", async (req, res) => {
  const initDataRaw = req.headers.authorization?.replace(/^tma\s+/i, "");

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
    const userRes = await client.query(
      "SELECT id_user FROM users WHERE chat_id = $1",
      [telegramUserId]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: "Пользователь не найден" });
    }

    // Генерация токена
    const token = generateSessionToken();
    sessionTokens.set(token, {
      userId: telegramUserId,
      timestamp: Date.now(),
      used: false,
    });

    // Очистка старых токенов
    const now = Date.now();
    for (const [key, value] of sessionTokens.entries()) {
      if (now - value.timestamp > 5 * 60 * 1000) {
        sessionTokens.delete(key);
      }
    }

    res.json({ success: true, token });
  } catch (err) {
    console.error("❌ Ошибка при генерации токена:", err);
    res.status(500).json({ error: "Ошибка сервера" });
  } finally {
    await client.end();
  }
});

// 🎯 Старт рулетки и списание звёзд
router.post("/roulette/start", async (req, res) => {
  const { caseType, token } = req.body;
  const initDataRaw = req.headers.authorization?.replace(/^tma\s+/i, "");

  if (!caseType || !token) {
    return res.status(400).json({ error: "caseType и token обязательны" });
  }

  if (!initDataRaw) {
    return res.status(401).json({ error: "Отсутствует initData" });
  }

  let parsed;
  let telegramUserId;
  try {
    validate(initDataRaw, process.env.BOT_TOKEN);
    parsed = parse(initDataRaw);

    const now = Math.floor(Date.now() / 1000);
    const authAge = now - parsed.auth_date;
    if (authAge > 6000) {
      return res.status(403).json({ error: "Срок действия сессии истёк" });
    }

    telegramUserId = parsed?.user?.id;

  } catch (e) {
    console.error("❌ Невалидный initData:", e);
    return res.status(403).json({ error: "Недопустимый запрос" });
  }

  const casePrice = CASE_PRICES[caseType];
  if (!casePrice) {
    return res.status(400).json({ error: "Недопустимый тип кейса" });
  }

  const sessionData = sessionTokens.get(token);
  if (!sessionData || sessionData.userId !== telegramUserId || sessionData.used || Date.now() - sessionData.timestamp > 5 * 60 * 1000) {
    return res.status(403).json({ error: "Недействительный или устаревший токен" });
  }  

  const client = new Client(dbConfig);
  await client.connect();

  try {
    await client.query('BEGIN');

    const userRes = await client.query(
      "SELECT id_user, stars_count FROM users WHERE chat_id = $1 FOR UPDATE",
      [telegramUserId]
    );

    const user = userRes.rows[0];
    if (!user) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: "Пользователь не найден" });
    }

    if (user.stars_count < casePrice) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: "Недостаточно звёзд для запуска" });
    }

    const userDbId = user.id_user;
    const giftNumber = getRandomGiftNumber(caseType);

    await client.query(
      "UPDATE users SET stars_count = stars_count - $1 WHERE chat_id = $2",
      [casePrice, telegramUserId]
    );

    const insertGift = await client.query(`
      INSERT INTO gift_user_have (user_id, gift_number, received)
      VALUES ($1, $2, $3)
      RETURNING id_gift_number
    `, [userDbId, giftNumber, false]);

    const idGiftNumber = insertGift.rows[0].id_gift_number;

    await client.query(`
      INSERT INTO history_game (user_id, id_gift_number, price)
      VALUES ($1, $2, $3)
    `, [userDbId, idGiftNumber, casePrice]);

    await client.query('COMMIT');

    sessionData.used = true;

    console.log(`✅ Игра записана: user ${telegramUserId}, подарок ${giftNumber}`);
    res.json({ success: true, idGiftNumber, giftNumber });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error("❌ Ошибка при записи игры:", err);
    res.status(500).json({ error: "Ошибка сервера" });
  } finally {
    await client.end();
  }
});

module.exports = router;
