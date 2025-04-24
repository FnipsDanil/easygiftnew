require("dotenv").config();
const express = require("express");
const { Client } = require("pg");

const router = express.Router();

const dbConfig = {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
};

router.get("/user/gifts/:chat_id", async (req, res) => {
    const { chat_id } = req.params;
  
    const client = new Client(dbConfig);
    await client.connect();
  
    try {
      // Получаем ID пользователя
      const userResult = await client.query("SELECT id_user FROM users WHERE chat_id = $1", [chat_id]);
      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: "Пользователь не найден" });
      }
  
      const userId = userResult.rows[0].id_user;
  
      // Возвращаем все подарки
      const gifts = await client.query(
        "SELECT gift_number, received FROM gift_user_have WHERE user_id = $1",
        [userId]
      );
  
      res.json({ gifts: gifts.rows });
    } catch (error) {
      console.error("❌ Ошибка при получении подарков:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    } finally {
      await client.end();
    }
  });
  


module.exports = router;
