require("dotenv").config();
const { Client } = require("pg");
const express = require("express");
const { Telegraf } = require("telegraf");
const fetch = require("node-fetch");
const { InlineKeyboard } = require("telegraf");
const router = express.Router();

const BOT_TOKEN = process.env.BOT_TOKEN;
const TELEGRAM_API_URL = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

const bot = new Telegraf(BOT_TOKEN);

const dbConfig = {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
};

// Функция для добавления пользователя в БД
async function createUser(chatId, username) {
  const client = new Client(dbConfig);
  await client.connect();

  try {
    await client.query(
      `INSERT INTO users (chat_id, username, stars_count)
       VALUES ($1, $2, 0)
       ON CONFLICT (chat_id) DO NOTHING;`,
      [chatId, username]
    );
    console.log(`✅ Пользователь ${username} (ID: ${chatId}) добавлен в БД`);
  } catch (error) {
    console.error("❌ Ошибка при добавлении пользователя:", error);
  } finally {
    await client.end();
  }
}


// 📌 Обработка команды `/start`
bot.start(async (ctx) => {
  const chatId = ctx.message.chat.id;
  const username = ctx.message.from.username || "unknown";
  const language = ctx.from?.language_code === "ru" ? "ru" : "en";
  const payload = ctx.startPayload || null;

  const validSources = ["Podarok", "Vseznayka", "Vanbay", "Gazz", "d1sha"];

  console.log(`📩 Получена команда /start от ${username} (${language}) (ID: ${chatId})`);

  // 👉 Проверка на переход по ссылке ?start=Podarok, и если юзер НЕ в users — записываем
  if (validSources.includes(payload)) {
    const client = new Client(dbConfig);
    await client.connect();

    try {
      const userInUsers = await client.query(
        `SELECT 1 FROM users WHERE chat_id = $1`,
        [chatId]
      );

      if (userInUsers.rowCount === 0) {
        await client.query(
          `INSERT INTO gift_channel_referrals (chat_id, source_name)
           VALUES ($1, $2)
           ON CONFLICT (chat_id) DO NOTHING;`,
          [chatId, payload]
        );
      } else {
        console.log(`ℹ️ Пользователь ${chatId} уже есть в users — не записываем в gift_channel_referrals`);
      }
    } catch (error) {
      console.error("❌ Ошибка при записи в gift_channel_referrals:", error);
    } finally {
      await client.end();
    }
  }

  await createUser(chatId, username); // 👈 регистрация в БД

  // 🌐 Локализация
  const texts = {
    ru: {
      caption: `🎁 *Добро пожаловать в Easy Gift!* 🌟

Открывай кейсы за звёзды и получай улучшенные подарки.

В наших кейсах всегда лежат утешительные призы, которые ты можешь продать или вывести к себе на аккаунт.

🚀 *Готов испытать удачу?* Запускай мини-приложение и начинай выигрывать уже сейчас!`,
      appBtn: "🎮 Открыть приложение",
      channelBtn: "📢 Наш канал",
    },
    en: {
      caption: `🎁 *Welcome to Easy Gift!* 🌟

Open cases using stars and receive upgraded gifts.

Even consolation prizes can be sold or sent to your account.

🚀 Ready to test your luck?
Launch the mini app and start winning!`,
      appBtn: "🎮 Open App",
      channelBtn: "📢 Our Channel",
    },
  };

  const locale = texts[language];

  try {
    await ctx.replyWithPhoto(
      "https://easygift.site/assets/logo-LRAo8M-j.webp",
      {
        caption: locale.caption,
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: locale.appBtn,
                url: "https://t.me/EasyGiftDropbot?startapp",
              },
            ],
            [
              {
                text: locale.channelBtn,
                url: "https://t.me/EasyGiftNews",
              },
            ],
          ],
        },
      }
    );

    console.log("✅ Стартовое сообщение отправлено");
  } catch (err) {
    console.error("❌ Ошибка при отправке старт-сообщения:", err);
  }
});



// 📌 Обработчик успешной оплаты Stars
bot.on("message", async (ctx) => {
  const payment = ctx.message?.successful_payment;
  const userId = ctx.from?.id;

  if (!payment || !userId) return;

  const starsToAdd = payment.total_amount;

  const client = new Client(dbConfig);
  await client.connect();

  try {
    // ✅ Начисляем звёзды
    await client.query(
      "UPDATE users SET stars_count = stars_count + $1 WHERE chat_id = $2",
      [starsToAdd, userId]
    );

    // 2. Получаем ID пользователя
    const userRes = await client.query("SELECT id_user FROM users WHERE chat_id = $1", [userId]);
    const dbUser = userRes.rows[0];

    if (!dbUser) {
      throw new Error("Пользователь не найден в БД");
    }

    // 3. Записываем в историю пополнений
    await client.query(
      "INSERT INTO history_deposit (user_id, price, source, id_gift_number) VALUES ($1, $2, $3, $4)",
      [dbUser.id_user, starsToAdd, "donate", null]
    );    

    console.log(`💫 Пользователь ${userId} пополнил баланс на ${starsToAdd}⭐`);
  } catch (err) {
    console.error("❌ Ошибка при начислении звёзд:", err);
    ctx.reply("❌ Не удалось начислить звёзды, обратитесь в поддержку.");
  } finally {
    await client.end();
  }
});

bot.on("pre_checkout_query", async (ctx) => {
  try {
    await ctx.answerPreCheckoutQuery(true);
    console.log("🧾 pre_checkout_query подтверждён");
  } catch (err) {
    console.error("❌ Ошибка при подтверждении оплаты:", err);
  }
});

// Запускаем бота
bot.launch().then(() => console.log("🤖 Бот запущен!"));

// Экспортируем маршрутизатор
module.exports = {
  router,
  bot, // 👈 экспортируем сам бот
}
