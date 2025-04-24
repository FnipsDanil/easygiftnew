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

router.get("/leaderboard/position", async (req, res) => {
  try {
    const initData = req.headers.authorization?.split(' ')[1];
    if (!initData) {
      return res.status(401).json({ error: "Unauthorized: No initData provided" });
    }

    const telegramUser = validateInitData(initData);
    if (!telegramUser) {
      return res.status(401).json({ error: "Unauthorized: Invalid initData" });
    }

    const chat_id = telegramUser.id;
    const client = new Client(dbConfig);
    await client.connect();

    try {
      const query = `
        SELECT chat_id, position FROM (
          SELECT u.chat_id, RANK() OVER (ORDER BY SUM(h.price) DESC) AS position
          FROM history_deposit h
          JOIN users u ON u.id_user = h.user_id
          WHERE h.source = 'sell'
          GROUP BY u.chat_id
        ) ranked
        WHERE chat_id = $1;
      `;

      const result = await client.query(query, [chat_id]);

      if (result.rows.length > 0) {
        res.json({ success: true, position: result.rows[0].position });
      } else {
        res.json({ success: true, position: null });
      }
    } catch (error) {
      console.error("Error getting user position:", error);
      res.status(500).json({ success: false, error: "Server error" });
    } finally {
      await client.end();
    }
  } catch (error) {
    console.error("Error processing request:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

module.exports = router;