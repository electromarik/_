# Messenger

Полноценное веб-приложение для обмена сообщениями в реальном времени: регистрация и вход по JWT, личные диалоги, доставка сообщений через WebSocket, индикатор "печатает" и статус "в сети".

## Стек

- **Backend**: Node.js, TypeScript, Express, Socket.io, PostgreSQL, Prisma ORM, JWT (access + refresh токены), bcrypt
- **Frontend**: React, TypeScript, Vite, Tailwind CSS, React Router, Zustand, Axios, socket.io-client

## Структура проекта

```
server/   REST API + WebSocket сервер
client/   React SPA
```

## Быстрый старт

### 1. База данных

Нужен запущенный PostgreSQL. Создайте пользователя и БД:

```sql
CREATE USER messenger WITH PASSWORD 'messenger' CREATEDB;
CREATE DATABASE messenger OWNER messenger;
```

### 2. Backend

```bash
cd server
cp .env.example .env   # заполните JWT_ACCESS_SECRET / JWT_REFRESH_SECRET случайными строками
npm install
npm run prisma:migrate # применит миграции и сгенерирует Prisma Client
npm run dev             # http://localhost:4000
```

### 3. Frontend

```bash
cd client
cp .env.example .env    # при необходимости поменяйте VITE_API_URL
npm install
npm run dev              # http://localhost:5173
```

Откройте `http://localhost:5173`, зарегистрируйте двух пользователей (например, в двух разных браузерных профилях) и начните переписку.

## Основные возможности

- Регистрация / вход с JWT (access-токен в памяти, refresh-токен в httpOnly cookie) и автоматическое обновление access-токена
- Поиск пользователей и создание личных диалогов
- Групповые чаты: создание группы, добавление и удаление участников (права создателя), выход из группы
- Обмен сообщениями в реальном времени через Socket.io, с сохранением истории в PostgreSQL
- Вложения: отправка изображений и файлов (до 5 файлов, до 15 МБ каждый) с превью прямо в чате
- Редактирование и удаление собственных сообщений (мягкое удаление с плашкой "Сообщение удалено")
- Статусы прочтения ("прочитано") на основе `lastReadAt` по каждому участнику
- Индикатор набора текста ("печатает...")
- Статус "в сети / не в сети" с обновлением в реальном времени
- Пагинация истории сообщений (курсор по `id`)

## Переменные окружения

### server/.env

| Переменная | Назначение |
|---|---|
| `DATABASE_URL` | строка подключения к PostgreSQL |
| `PORT` | порт HTTP/WS сервера (по умолчанию 4000) |
| `CLIENT_ORIGIN` | origin фронтенда для CORS |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | секреты для подписи токенов |
| `JWT_ACCESS_EXPIRES_IN` / `JWT_REFRESH_EXPIRES_IN` | время жизни токенов |

### client/.env

| Переменная | Назначение |
|---|---|
| `VITE_API_URL` | базовый URL backend API/WebSocket |

## Загрузка файлов

Вложения сохраняются локально на диске сервера в `server/uploads/` и отдаются статически по пути `/uploads/...`. Это подходит для локальной разработки и демонстрации; для продакшена стоит переключиться на объектное хранилище (S3-совместимое) — сама точка расширения находится в `server/src/middleware/upload.ts`.

## Production-сборка

```bash
# backend
cd server && npm run build && npm start

# frontend
cd client && npm run build   # статические файлы в client/dist
```
