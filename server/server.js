const fetch = require("node-fetch");
const express = require("express");
const cors = require("cors");


const sendGiftRouter = require("./bot/sendGift");
const userRoutes = require("./routes/userRoutes");
const rouletteRoutes = require("./routes/rouletteRoutes");
const userGiftsRoutes = require("./routes/checkStars");
const userSellGift = require("./routes/sellGift");
const { router: botRouter, bot } = require("./bot/bot");
const depositStarsRoutes = require("./routes/depositStars")(bot);

const sendRareGift = require("./routes/sendRareGift");
const checkGiftsRoutes = require("./routes/checkGifts");

const historyActions = require("./routes/historyActions");
const leaderboard = require("./routes/leaderboard");
const caseStatusRoutes = require("./routes/caseStatus");
const chechPlaceLeadear = require("./routes/chechPlaceLeadear");
const depositProfile = require("./routes/depositProfile")(bot);
const { router: telegramRouter } = require("./utils/telegram");


const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Подключаем маршруты
app.use("/api/bot", botRouter);
app.use("/api/gift", sendGiftRouter);
app.use("/api/startgame", rouletteRoutes);
app.use("/api/checkstars", userGiftsRoutes);
app.use("/api/deposit", depositStarsRoutes);
app.use("/api/sell", userSellGift);
app.use("/api/rare", sendRareGift);
app.use("/api/checkgifts", checkGiftsRoutes);
app.use("/api/historyactions", historyActions);
app.use("/api/leaderboard", leaderboard);
app.use("/api/cases", caseStatusRoutes);
app.use("/api/placecheckleaderboard", chechPlaceLeadear);
app.use("/api/depositprofile", depositProfile);
app.use("/api/telegram", telegramRouter);

// 📌 Подключаем роуты
app.use("/api", userRoutes);

app.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`);
});
