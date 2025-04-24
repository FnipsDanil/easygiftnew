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

// Get user data endpoint
router.get("/user", async (req, res) => {
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
        console.log("📡 API request for user:", userId);

        const client = new Client(dbConfig);
        await client.connect();
        const result = await client.query("SELECT stars_count FROM users WHERE chat_id = $1", [userId]);

        if (result.rows.length > 0) {
            console.log("✅ Data from DB:", result.rows[0]);
            res.setHeader("Content-Type", "application/json");
            res.json(result.rows[0]);
        } else {
            res.status(404).json({ error: "User not found" });
        }
        await client.end();
    } catch (error) {
        console.error("❌ Error querying DB:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// 📌 Экспортируем router, а НЕ app
module.exports = router;
