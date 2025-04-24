// utils/rareGiftHelpers.js

async function disableCaseIfNeeded(client, gift_id) {
  const caseMap = {
    '9999': 1, '9998': 2, '9997': 3, '9996': 4,
    '9995': 7, '9994': 8, '9993': 9, '9992': 10,
    '9991': 11, '9990': 12, '9989': 13,
  };

  const caseId = caseMap[gift_id];
  if (caseId) {
    await client.query("UPDATE case_status SET is_disabled = true WHERE case_id = $1", [caseId]);
    console.log(`🚫 Кейс ${caseId} отключён (подарок ${gift_id})`);
  }
}

async function notifyAdmins(bot, chatId, username, gift_id, extra, textOverride = null, replyText = null) {
  const { collection = "-", model = "-", backdrop = "-", symbol = "-" } = extra;

  const text = textOverride || `
<b>🎉 Редкий подарок получен!</b>

👤 Пользователь: @${username}
🆔 chat_id: ${chatId}
🎁 Подарок: ${gift_id}
📦 Коллекция: ${collection}
🧩 Модель: ${model}
🎨 Оформление: ${backdrop}
🧷 Символ: ${symbol}
`;

  const adminChatIds = [
    process.env.AdminChatId,
    process.env.AdminChatId2,
  ];

  for (const adminId of adminChatIds) {
    if (!adminId) continue;
    try {
      const sent = await bot.telegram.sendMessage(adminId, text, { parse_mode: "HTML" });
      console.log(`📩 Уведомление отправлено админу ${adminId}`);

      if (replyText) {
        await bot.telegram.sendMessage(adminId, replyText, {
          reply_to_message_id: sent.message_id,
        });
      }
    } catch (err) {
      console.error(`❌ Ошибка при отправке админу ${adminId}:`, err.message);
    }
  }
}


module.exports = {
  disableCaseIfNeeded,
  notifyAdmins,
};
