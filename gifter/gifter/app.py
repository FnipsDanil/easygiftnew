from fastapi import FastAPI, Depends
from pydantic import BaseModel
from aiogram import Bot
import os
from dotenv import load_dotenv

from gifter.bot import bot

from contextlib import asynccontextmanager

import logging

# Загружаем переменные окружения
load_dotenv()

logger = logging.getLogger("uvicorn")

class GiftTransferRequest(BaseModel):
    # business_connection_id теперь необязателен, так как будет загружаться из .env
    business_connection_id: str = None
    owned_gift_id: str
    new_owner_chat_id: int
    star_count: int = 25

@asynccontextmanager
async def lifespan(application: FastAPI):
    try:
        yield
    finally:
        await bot.close()

app = FastAPI(lifespan=lifespan)

@app.post("/transfer-gift")
async def transfer_gift_endpoint(data: GiftTransferRequest, provided_bot: Bot = Depends(bot.get_bot)):
    try:
        # Используем значение business_connection_id из .env, если оно не указано в запросе
        business_connection_id = data.business_connection_id or os.getenv("BUSINESS_CONNECTION_ID")
        
        if not business_connection_id:
            raise ValueError("business_connection_id должен быть указан в .env или в запросе")
        
        response = await provided_bot.transfer_gift(
            business_connection_id=business_connection_id,
            owned_gift_id=data.owned_gift_id,
            new_owner_chat_id=data.new_owner_chat_id,
            star_count=data.star_count
        )
        if response:
            logger.info(f"Successfully sent gift to: {data.owned_gift_id=}, {data.new_owner_chat_id=}")
            return {"status": "success", "message": "gift transferred successfully"}
        else:
            raise Exception("gift isn't transferred")
    except Exception as e:
        logger.error(f"Got exception: {e}")
        return {"status": "error", "message": str(e)}

@app.get("/health")
def health():
    return "OK"
