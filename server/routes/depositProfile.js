require("dotenv").config();
const express = require("express");
const { Client } = require("pg");
const fetch = require("node-fetch");
const { validateInitData } = require("../utils/validateInitData");

const dbConfig = {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
};

module.exports = (bot) => {
  const router = express.Router();

  router.post("/profiledonate", async (req, res) => {
    const { amount, language = 'en' } = req.body;
    
    try {
      const initData = req.headers.authorization?.split(' ')[1];
      if (!initData) {
        return res.status(401).json({ error: "Unauthorized: No initData provided" });
      }

      const telegramUser = validateInitData(initData);
      if (!telegramUser) {
        return res.status(401).json({ error: "Unauthorized: Invalid initData" });
      }

      const userId = telegramUser.id;
      const username = telegramUser.username || "unknown";
    
      if (!amount) {
        return res.status(400).json({
          error: language === 'ru' ? "amount обязателен" : "amount is required"
        });
      }

      const client = new Client(dbConfig);
      await client.connect();

      try {
        // Check and create user if not exists
        const userResult = await client.query("SELECT * FROM users WHERE chat_id = $1", [userId]);
        if (userResult.rows.length === 0) {
          await client.query(
            `INSERT INTO users (chat_id, username, stars_count)
             VALUES ($1, $2, 0)
             ON CONFLICT (chat_id) DO NOTHING;`,
            [userId, username]
          );
          console.log(`User ${userId} added to DB`);
        }

        // Create payment link through Telegram API
        const prices = [
          {
            label: language === 'ru' ? "Пополнение" : "Top Up",
            amount: amount,
          },
        ];

        const response = await fetch(
          `https://api.telegram.org/bot${bot.token}/createInvoiceLink`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: language === 'ru' ? "💫 Пополнение звёзд" : "💫 Top Up Stars",
              description: language === 'ru' ? `Пополните ваш баланс на ${amount}⭐` : `Top up your balance with ${amount}⭐`,
              payload: "stars_donation",
              provider_token: "", // Telegram Stars
              currency: "XTR",
              prices,
            }),
          }
        );

        const invoice = await response.json();

        if (!invoice.ok || !invoice.result) {
          throw new Error(
            invoice.description ||
              (language === 'ru' ? "Не удалось создать ссылку на оплату" : "Failed to create payment link")
          );
        }

        console.log("Payment link created:", invoice.result);
        res.status(200).json({ invoice_link: invoice.result });

      } catch (err) {
        console.error("Error creating payment link:", err);
        res.status(500).json({
          error: language === 'ru' ? "Ошибка при создании платежа" : "Error while creating payment link"
        });
      } finally {
        await client.end();
      }
    } catch (error) {
      console.error("Error processing request:", error);
      res.status(500).json({ 
        error: language === 'ru' ? "Ошибка сервера" : "Server error" 
      });
    }
  });

  // Get current stars count endpoint
  router.post("/get-stars", async (req, res) => {
    try {
      const initData = req.headers.authorization?.split(' ')[1];
      if (!initData) {
        return res.status(401).json({ error: "Unauthorized: No initData provided" });
      }

      const telegramUser = validateInitData(initData);
      if (!telegramUser) {
        return res.status(401).json({ error: "Unauthorized: Invalid initData" });
      }

      const userId = telegramUser.id;
      const client = new Client(dbConfig);
      await client.connect();
  
      try {
        const result = await client.query(
          "SELECT stars_count FROM users WHERE chat_id = $1",
          [userId]
        );
  
        if (!result.rows.length) {
          return res.status(404).json({ error: "User not found" });
        }
  
        const stars = result.rows[0].stars_count;
  
        res.json({ stars });
      } catch (error) {
        console.error("Error getting stars:", error);
        res.status(500).json({ error: "Server error" });
      } finally {
        await client.end();
      }
    } catch (error) {
      console.error("Error processing request:", error);
      res.status(500).json({ error: "Server error" });
    }
  });

  return router;
};
