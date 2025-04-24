require("dotenv").config();
const express = require("express");
const { Client } = require("pg");
const { validateInitData } = require("../utils/validateInitData");

const router = express.Router();

const dbConfig = {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
};

router.post("/history/actions", async (req, res) => {
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
      const history = [];

      // Deposits and sales
      const depositQuery = `
        SELECT id_deposit AS id, price, date, source, id_gift_number
        FROM history_deposit
        WHERE user_id = (
          SELECT id_user FROM users WHERE chat_id = $1
        )
      `;
      const depositResult = await client.query(depositQuery, [userId]);

      depositResult.rows.forEach((row) => {
        history.push({
          id: row.id,
          type: row.source === "donate" ? "Deposit" : "Sold",
          amount: row.price,
          date: row.date,
          gift_number: row.id_gift_number,
          direction: "+",
        });
      });

      // Case wins
      const gameQuery = `
        SELECT h.id_game AS id, h.date, h.price, g.gift_number, g.id_gift_number
        FROM history_game h
        JOIN gift_user_have g ON h.id_gift_number = g.id_gift_number
        WHERE h.user_id = (
          SELECT id_user FROM users WHERE chat_id = $1
        )
      `;
      const gameResult = await client.query(gameQuery, [userId]);

      gameResult.rows.forEach((row) => {
        history.push({
          id: row.id,
          type: "Gift won",
          amount: row.price,
          date: row.date,
          gift_number: row.gift_number,
          id_gift_number: row.id_gift_number,
          direction: "-",
        });
      });

      // Exchanges
      const exchangeQuery = `
        SELECT 
        g.id_gift_number AS id, 
        g.gift_number, 
        g.received, 
        h.date + interval '1 millisecond' AS date
        FROM gift_user_have g
        LEFT JOIN history_game h ON g.id_gift_number = h.id_gift_number
        WHERE g.user_id = (
          SELECT id_user FROM users WHERE chat_id = $1
        )
        AND g.received = true
        AND g.id_gift_number NOT IN (
          SELECT id_gift_number
          FROM history_deposit
          WHERE user_id = (
            SELECT id_user FROM users WHERE chat_id = $1
          ) AND source = 'sell'
        )`;
      const exchangeResult = await client.query(exchangeQuery, [userId]);

      exchangeResult.rows.forEach((row) => {
        history.push({
          id: row.id,
          type: "Gift exchanged",
          amount: 25,
          date: row.date,
          gift_number: row.gift_number,
          direction: "+",
        });
      });

      history.sort((a, b) => new Date(b.date) - new Date(a.date));

      res.json({ success: true, history });
    } catch (error) {
      console.error("Error while fetching history:", error);
      res.status(500).json({ error: "Server error" });
    } finally {
      await client.end();
    }
  } catch (error) {
    console.error("Error processing request:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
