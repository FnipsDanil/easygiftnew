from telethon.sync import TelegramClient, events
import psycopg2
import os
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()  # загружаем .env

# ⚠️ ОБЯЗАТЕЛЬНО: нужны реальные значения (из my.telegram.org)
API_ID = int(os.getenv("TG_API_ID"))
API_HASH = os.getenv("TG_API_HASH")
SESSION_PATH = "easygifter_session"  # без .session!

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "db"),
    "port": int(os.getenv("DB_PORT", "5432")),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
    "dbname": os.getenv("DB_NAME")
}

client = TelegramClient(SESSION_PATH, API_ID, API_HASH)

@client.on(events.NewMessage(incoming=True))
async def handler(event):
    sender = await event.get_sender()
    chat_id = sender.id
    username = sender.username or "unknown"
    print(f"📥 Сообщение от @{username} ({chat_id})")

    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO verified_senders (chat_id, username, verified_at)
            VALUES (%s, %s, %s)
            ON CONFLICT (chat_id) DO UPDATE
              SET verified_at = EXCLUDED.verified_at;
        """, (chat_id, username, datetime.utcnow()))
        conn.commit()
        cur.close()
        conn.close()
        print(f"✅ @{username} добавлен в verified_senders")
    except Exception as e:
        print(f"❌ Ошибка БД: {e}")

async def main():
    print("🚀 Слушаем входящие сообщения...")
    await client.start()
    await client.run_until_disconnected()

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
