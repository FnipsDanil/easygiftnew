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

// 🔝 Таблица лидеров по продаже подарков
router.get("/leaderboard/sell", async (req, res) => {
  const client = new Client(dbConfig);
  await client.connect();

  try {
    const query = `
      SELECT u.username, SUM(h.price) AS total_earned, COUNT(h.id_deposit) AS total_sales
      FROM history_deposit h
      JOIN users u ON u.id_user = h.user_id
      WHERE h.source = 'sell'
      GROUP BY u.id_user
      ORDER BY total_earned DESC
      LIMIT 100;
    `;

    const result = await client.query(query);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error("Ошибка при получении лидерборда:", error);
    res.status(500).json({ success: false, error: "Ошибка сервера" });
  } finally {
    await client.end();
  }
});

module.exports = router;
