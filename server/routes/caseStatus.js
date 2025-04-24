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

// 📥 Получить статус кейса
router.get("/status/:caseId", async (req, res) => {
  const { caseId } = req.params;

  const client = new Client(dbConfig);
  await client.connect();

  try {
    const result = await client.query(
      "SELECT is_disabled FROM case_status WHERE case_id = $1",
      [caseId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Кейс не найден" });
    }

    res.json({ success: true, disabled: result.rows[0].is_disabled });
  } catch (error) {
    console.error("❌ Ошибка при получении статуса кейса:", error);
    res.status(500).json({ success: false, error: "Ошибка сервера" });
  } finally {
    await client.end();
  }
});

// ❌ Отключить кейс
router.post("/disable", async (req, res) => {
  const { caseId } = req.body;

  if (!caseId) {
    return res.status(400).json({ success: false, error: "caseId обязателен" });
  }

  const client = new Client(dbConfig);
  await client.connect();

  try {
    await client.query(
      "UPDATE case_status SET is_disabled = true WHERE case_id = $1",
      [caseId]
    );

    res.json({ success: true, message: `Кейс #${caseId} отключен` });
  } catch (error) {
    console.error("❌ Ошибка при отключении кейса:", error);
    res.status(500).json({ success: false, error: "Ошибка сервера" });
  } finally {
    await client.end();
  }
});

module.exports = router;
