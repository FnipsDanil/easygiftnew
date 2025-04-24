-- 👤 Таблица пользователей
CREATE TABLE users (
    id_user SERIAL PRIMARY KEY,
    chat_id BIGINT UNIQUE NOT NULL,
    username VARCHAR(50),
    stars_count INT DEFAULT 0
);

-- 💸 Таблица истории пополнений (донаты и продажи)
CREATE TABLE history_deposit (
    id_deposit SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    price INT NOT NULL,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    source VARCHAR(20), -- 'donate' или 'sell'
    id_gift_number INT, -- может быть NULL для donate
    FOREIGN KEY (user_id) REFERENCES users(id_user) ON DELETE CASCADE
);

-- 🎁 Таблица подарков пользователя
CREATE TABLE gift_user_have (
    id_gift_number SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    gift_number BIGINT NOT NULL,
    received BOOLEAN DEFAULT FALSE,
    locked BOOLEAN DEFAULT FALSE, -- 🔒 Новый флаг блокировки
    FOREIGN KEY (user_id) REFERENCES users(id_user) ON DELETE CASCADE
);

-- 🎮 Таблица истории игр
CREATE TABLE history_game (
    id_game SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    id_gift_number INT NOT NULL,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    price INT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id_user) ON DELETE CASCADE,
    FOREIGN KEY (id_gift_number) REFERENCES gift_user_have(id_gift_number) ON DELETE CASCADE
);

CREATE TABLE case_status (
  case_id INT PRIMARY KEY,
  is_disabled BOOLEAN DEFAULT FALSE
);
CREATE TABLE IF NOT EXISTS rare_gift_claims (
  id SERIAL PRIMARY KEY,
  chat_id BIGINT NOT NULL,
  username TEXT,
  gift_number TEXT NOT NULL,
  collection TEXT,
  model TEXT,
  backdrop TEXT,
  symbol TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS verified_senders (
  chat_id BIGINT PRIMARY KEY,
  username TEXT,
  verified_at TIMESTAMP DEFAULT NOW()
);
-- ✅ Инициализация кейсов
INSERT INTO case_status (case_id, is_disabled) VALUES
  (1, FALSE),
  (2, FALSE),
  (3, FALSE),
  (4, FALSE)
ON CONFLICT (case_id) DO NOTHING;