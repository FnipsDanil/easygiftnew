FROM python:3.11-slim

WORKDIR /app

# Копируем всё
COPY . .

# Указываем явно сессию
COPY easygifter_session.session /app/

# Устанавливаем зависимости
RUN pip install --no-cache-dir telethon psycopg2-binary python-dotenv
    

# Запуск основного скрипта
CMD ["python", "userbot_listener.py"]
