from aiogram import Bot
from dotenv import load_dotenv

import os
import logging

load_dotenv()

logger = logging.getLogger("uvicorn")


class GifterBot:
    def __init__(self, token: str):
        self.bot = Bot(token)

    def get_bot(self) -> Bot:
        return self.bot

    async def close(self):
        logger.info("Closing bot and session...")
        await self.bot.session.close()
        logger.info("Bot session closed.")

bot = GifterBot(token= os.getenv("BOT_TOKEN"))