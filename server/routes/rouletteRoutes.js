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

    if (r < 4000) return "5170233102089322756";   // 🐻 Bear (4%)
    if (r < 8000) return "5170145012310081615";  // ❤️ Heart (4%)
    if (r < 16000) return "5170250947678437525";  // 🎁 Gift (8%)
    if (r < 30000) return "5170521118301225164";  // 💎 Gem (14%)
    if (r < 44000) return "5170690322832818290";  // 💍 Ring (14%)
    if (r < 58000) return "5168043875654172773";  // 🏆 Trophy (14%)
    if (r < 65000) return "5170564780938756245";  // 🚀 Rocket (7%)
    if (r < 72000) return "5170314324215857265";  // 🌹 Roses (7%)
    if (r < 79000) return "5170144170496491616";  // 🎂 Cake (7%)
    if (r < 87000) return "5168103777563050263";  // 🌹 RoseSingle (8%)
    if (r < 94000) return "6028601630662853006";  // 🍾 Champangne (7%)
    if (r < 99000) return "5782984811920491178";  // 🎉 HappyBirth (5%)
    return "9996";                                 // ⌚ SwissWatch (1.00%)
  }

  if (caseType === 'bear') {
    const r = Math.floor(Math.random() * 100000);

    if (r < 6500) return "5170233102089322756";   // 🐻 Bear (6.50%)
    if (r < 13000) return "5170145012310081615";   // ❤️ Heart (6.50%)
    if (r < 28000) return "5170250947678437525";   // 🎁 Gift (15.00%)
    if (r < 30000) return "5170521118301225164";   // 💎 Gem (2.00%)
    if (r < 32000) return "5170690322832818290";   // 💍 Ring (2.00%)
    if (r < 34000) return "5168043875654172773";   // 🏆 Trophy (2.00%)
    if (r < 46500) return "5170564780938756245";   // 🚀 Rocket (12.50%)
    if (r < 59000) return "5170314324215857265";   // 🌹 Roses (12.50%)
    if (r < 71500) return "5170144170496491616";   // 🎂 Cake (12.50%)
    if (r < 86500) return "5168103777563050263";   // 🌹 RoseSingle (15.00%)
    if (r < 99000) return "6028601630662853006";   // 🍾 Champangne (12.50%)
    return "9999";                                  // 🧸 Toy Bear (1.00%)
  }

  if (caseType === 'heart') {
    const r = Math.floor(Math.random() * 100000);

    if (r < 21600) return "5170233102089322756";   // 🐻 Bear (21.60%)
    if (r < 43200) return "5170145012310081615";   // ❤️ Heart (21.60%)
    if (r < 66200) return "5170250947678437525";   // 🎁 Gift (23.00%)
    if (r < 66800) return "5170521118301225164";   // 💎 Gem (0.6%)
    if (r < 67400) return "5170690322832818290";   // 💍 Ring (0.6%)
    if (r < 68000) return "5168043875654172773";   // 🏆 Trophy (0.6%)
    if (r < 69500) return "5170564780938756245";   // 🚀 Rocket (1.50%)
    if (r < 71000) return "5170314324215857265";    // 🌹 Roses (1.50%)
    if (r < 72500) return "5170144170496491616";   // 🎂 Cake (1.50%)
    if (r < 95500) return "5168103777563050263";   // 🌹 RoseSingle (23.00%)
    if (r < 97000) return "6028601630662853006";   // 🍾 Champangne (1.50%)
    return "9998";                                  // 🍪 HeartCookie (3.00%)
  }

  if (caseType === 'cap') {
    const r = Math.floor(Math.random() * 100000);

    if (r < 550) return "5170233102089322756";    // 🐻 Bear (0.55%)
    if (r < 1100) return "5170145012310081615";    // ❤️ Heart (0.55%)
    if (r < 3500) return "5170250947678437525";    // 🎁 Gift (2.40%)
    if (r < 22500) return "5170521118301225164";   // 💎 Gem (19.00%)
    if (r < 41500) return "5170690322832818290";   // 💍 Ring (19.00%)
    if (r < 60500) return "5168043875654172773";   // 🏆 Trophy (19.00%)
    if (r < 65500) return "5170564780938756245";   // 🚀 Rocket (5.00%)
    if (r < 70500) return "5170314324215857265";   // 🌹 Roses (5.00%)
    if (r < 75500) return "5170144170496491616";   // 🎂 Cake (5.00%)
    if (r < 77900) return "5168103777563050263";   // 🌹 RoseSingle (2.40%)
    if (r < 82900) return "6028601630662853006";   // 🍾 Champangne (5.00%)
    if (r < 99990) return "5782984811920491178";   // 🎉 HappyBirth (17.00%)
    return "9997";                                  // 🧢 Cap (0.10%)
  }


  if (caseType === 'jack') {
    const r = Math.floor(Math.random() * 100000);

    if (r < 20100) return "5170233102089322756";   // 🐻 Bear (20.10%)
    if (r < 40200) return "5170145012310081615";   // ❤️ Heart (20.10%)
    if (r < 63200) return "5170250947678437525";   // 🎁 Gift (23.00%)
    if (r < 63800) return "5170521118301225164";   // 💎 Gem (0.6%)
    if (r < 64400) return "5170690322832818290";   // 💍 Ring (0.6%)
    if (r < 65000) return "5168043875654172773";   // 🏆 Trophy (0.6%)
    if (r < 67000) return "5170564780938756245";   // 🚀 Rocket (2.00%)
    if (r < 69000) return "5170314324215857265";    // 🌹 Roses (2.00%)
    if (r < 71000) return "5170144170496491616";   // 🎂 Cake (2.00%)
    if (r < 94000) return "5168103777563050263";   // 🌹 RoseSingle (23.00%)
    if (r < 96000) return "6028601630662853006";   // 🍾 Champangne (2.00%)
    return "9995";                                    // 🎃 Jack In The Box (4%)
  }
  
  if (caseType === 'cake') {
    const r = Math.floor(Math.random() * 100000);

    if (r < 22000) return "5170233102089322756";   // 🐻 Bear (22.00%)
    if (r < 44000) return "5170145012310081615";   // ❤️ Heart (22.00%)
    if (r < 67000) return "5170250947678437525";   // 🎁 Gift (23.00%)
    if (r < 67600) return "5170521118301225164";   // 💎 Gem (0.6%)
    if (r < 68200) return "5170690322832818290";   // 💍 Ring (0.6%)
    if (r < 68800) return "5168043875654172773";   // 🏆 Trophy (0.6%)
    if (r < 70350) return "5170564780938756245";   // 🚀 Rocket (1.55%)
    if (r < 71900) return "5170314324215857265";    // 🌹 Roses (1.55%)
    if (r < 73450) return "5170144170496491616";   // 🎂 Cake (1.55%)
    if (r < 96450) return "5168103777563050263";   // 🌹 RoseSingle (23.00%)
    if (r < 98000) return "6028601630662853006";   // 🍾 Champangne (1.55%)
    return "9994";                                  // 🍪 Cake (2%)
  }

  if (caseType === 'skeleton') {
    const r = Math.floor(Math.random() * 100000);

    if (r < 6500) return "5170233102089322756";   // 🐻 Bear (6.50%)
    if (r < 13000) return "5170145012310081615";   // ❤️ Heart (6.50%)
    if (r < 28000) return "5170250947678437525";   // 🎁 Gift (15.00%)
    if (r < 30000) return "5170521118301225164";   // 💎 Gem (2.00%)
    if (r < 32000) return "5170690322832818290";   // 💍 Ring (2.00%)
    if (r < 34000) return "5168043875654172773";   // 🏆 Trophy (2.00%)
    if (r < 46500) return "5170564780938756245";   // 🚀 Rocket (12.50%)
    if (r < 59000) return "5170314324215857265";   // 🌹 Roses (12.50%)
    if (r < 71500) return "5170144170496491616";   // 🎂 Cake (12.50%)
    if (r < 86500) return "5168103777563050263";   // 🌹 RoseSingle (15.00%)
    if (r < 99000) return "6028601630662853006";   // 🍾 Champangne (12.50%)
    return "9993";                                   // 💀 Skeleton (1.00%)
  }

  if (caseType === 'tophat') {
    const r = Math.floor(Math.random() * 100000);

    if (r < 6500) return "5170233102089322756";   // 🐻 Bear (6.50%)
    if (r < 13000) return "5170145012310081615";   // ❤️ Heart (6.50%)
    if (r < 33000) return "5170250947678437525";   // 🎁 Gift (20.00%)
    if (r < 35000) return "5170521118301225164";   // 💎 Gem (2.00%)
    if (r < 37000) return "5170690322832818290";   // 💍 Ring (2.00%)
    if (r < 39000) return "5168043875654172773";   // 🏆 Trophy (2.00%)
    if (r < 49000) return "5170564780938756245";   // 🚀 Rocket (10.00%)
    if (r < 59000) return "5170314324215857265";   // 🌹 Roses (10.00%)
    if (r < 69000) return "5170144170496491616";   // 🎂 Cake (10.00%)
    if (r < 89000) return "5168103777563050263";   // 🌹 RoseSingle (20.00%)
    if (r < 99000) return "6028601630662853006";   // 🍾 Champangne (10.00%)
    return "9992";                                  // 🎩 Top Hat (1.00%)
  }
  if (caseType === 'signetring') {
    const r = Math.floor(Math.random() * 100000);

    if (r < 4000) return "5170233102089322756";   // 🐻 Bear (4%)
    if (r < 8000) return "5170145012310081615";  // ❤️ Heart (4%)
    if (r < 16000) return "5170250947678437525";  // 🎁 Gift (8%)
    if (r < 30000) return "5170521118301225164";  // 💎 Gem (14%)
    if (r < 44000) return "5170690322832818290";  // 💍 Ring (14%)
    if (r < 58000) return "5168043875654172773";  // 🏆 Trophy (14%)
    if (r < 65000) return "5170564780938756245";  // 🚀 Rocket (7%)
    if (r < 72000) return "5170314324215857265";  // 🌹 Roses (7%)
    if (r < 79000) return "5170144170496491616";  // 🎂 Cake (7%)
    if (r < 87000) return "5168103777563050263";  // 🌹 RoseSingle (8%)
    if (r < 94000) return "6028601630662853006";  // 🍾 Champangne (7%)
    if (r < 99000) return "5782984811920491178";  // 🎉 HappyBirth (5%)
    return "9991";                                  // 🍪 Signet Ring (1.00%)
  }
  if (caseType === 'vintagecigar') {
    const r = Math.floor(Math.random() * 100000);

    if (r < 4000) return "5170233102089322756";   // 🐻 Bear (4%)
    if (r < 8000) return "5170145012310081615";  // ❤️ Heart (4%)
    if (r < 16000) return "5170250947678437525";  // 🎁 Gift (8%)
    if (r < 30000) return "5170521118301225164";  // 💎 Gem (14%)
    if (r < 44000) return "5170690322832818290";  // 💍 Ring (14%)
    if (r < 58000) return "5168043875654172773";  // 🏆 Trophy (14%)
    if (r < 65000) return "5170564780938756245";  // 🚀 Rocket (7%)
    if (r < 72000) return "5170314324215857265";  // 🌹 Roses (7%)
    if (r < 79000) return "5170144170496491616";  // 🎂 Cake (7%)
    if (r < 87000) return "5168103777563050263";  // 🌹 RoseSingle (8%)
    if (r < 94000) return "6028601630662853006";  // 🍾 Champangne (7%)
    if (r < 99000) return "5782984811920491178";  // 🎉 HappyBirth (5%)
    return "9990";                                  // 🍪 Vintage Cigar (1.00%)
  }
  if (caseType === 'egg') {
    const r = Math.floor(Math.random() * 100000);

    if (r < 22000) return "5170233102089322756";   // 🐻 Bear (22.00%)
    if (r < 44000) return "5170145012310081615";   // ❤️ Heart (22.00%)
    if (r < 67000) return "5170250947678437525";   // 🎁 Gift (23.00%)
    if (r < 67600) return "5170521118301225164";   // 💎 Gem (0.6%)
    if (r < 68200) return "5170690322832818290";   // 💍 Ring (0.6%)
    if (r < 68800) return "5168043875654172773";   // 🏆 Trophy (0.6%)
    if (r < 70350) return "5170564780938756245";   // 🚀 Rocket (1.55%)
    if (r < 71900) return "5170314324215857265";    // 🌹 Roses (1.55%)
    if (r < 73450) return "5170144170496491616";   // 🎂 Cake (1.55%)
    if (r < 96450) return "5168103777563050263";   // 🌹 RoseSingle (23.00%)
    if (r < 98000) return "6028601630662853006";   // 🍾 Champangne (1.55%)
    return "9989";                                  // 🍪 Easter Egg (2%)
  }
  if (caseType === 'bday') {
    const r = Math.floor(Math.random() * 100000);

    if (r < 50000) return "5170233102089322756";   // 🐻 Bear (50%)
    if (r < 100000) return "5782984811920491178";   // 🎉 HappyBirth (50%)
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
