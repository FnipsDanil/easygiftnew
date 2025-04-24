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

// Get user's unclaimed gifts
router.get("/user-gifts", async (req, res) => {
  try {
    const initData = req.headers.authorization?.split(' ')[1];
    if (!initData) {
      return res.status(401).json({ error: "Unauthorized: No initData provided" });
    }

    const telegramUser = validateInitData(initData);
    if (!telegramUser) {
      return res.status(401).json({ error: "Unauthorized: Invalid initData" });
    }

    const chatId = telegramUser.id;
    const client = new Client(dbConfig);
    await client.connect();

    try {
      const result = await client.query(
        `
        SELECT 
          guh.id_gift_number,
          guh.gift_number
        FROM gift_user_have AS guh
        JOIN users u ON guh.user_id = u.id_user
        WHERE u.chat_id = $1 AND guh.received != true
        `,
        [chatId]
      );

      console.log("Gifts for chat_id:", chatId, result.rows);
      res.json(result.rows);
    } catch (error) {
      console.error("Error getting gifts:", error);
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
