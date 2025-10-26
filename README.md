# Investment Tracker

A modern, full-stack investment tracking web application with Telegram authentication. Built with FastAPI (backend) and Next.js (frontend).

![Investment Tracker](https://img.shields.io/badge/Status-Production%20Ready-green)
![Python](https://img.shields.io/badge/Python-3.12-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791)

## ✨ Features

- 🔐 **Telegram Bot Authentication** - Simple one-click login via Telegram bot (just /start!)
- 🤖 **Magic Link Login** - Instant access through secure bot-generated links
- 📊 **Interactive Dashboard** - Real-time portfolio overview with beautiful charts
- 💼 **Investment Management** - Full CRUD operations for investments
- 🎯 **Multiple Asset Types** - Stocks, Crypto, Shares, Gold, Real Estate, Bonds, and more
- 📈 **Advanced Analytics** - Earnings analysis with customizable time aggregations
- 🔍 **Smart Filtering** - Filter by type, date range, and search functionality
- 🎨 **Modern UI** - Beautiful, professional interface inspired by Budget Ok
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile

## 🚀 Quick Start

### Prerequisites
- Docker Desktop
- Node.js 18+ (for frontend development)

### 1. Clone and Setup

```bash
git clone <repository-url>
cd investments-dash-service

# Copy environment file
cp .env.example .env
```

### 2. Start Backend

```bash
docker-compose up --build -d
```

Backend will be available at:
- API: http://localhost:8000
- Swagger Docs: http://localhost:8000/docs

### 3. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend will be available at: http://localhost:3000

### 4. Setup Telegram Bot (Optional but Recommended)

For the best login experience, set up the Telegram bot:

1. Create a bot with @BotFather on Telegram
2. Add your bot token to `.env`:
   ```bash
   TELEGRAM_BOT_TOKEN=your-bot-token-here
   ```
3. Run the bot:
   ```bash
   # Locally
   pipenv run python -m app.bot
   
   # Or with Docker (uncomment bot service in docker-compose.yml)
   docker-compose up -d bot
   ```

**📖 Full Bot Setup Guide**: [BOT_SETUP.md](BOT_SETUP.md)

### 5. Access the Application

Open http://localhost:3000 and:
- Open your Telegram bot and click `/start` to get a magic login link 🚀
- OR use the demo account for testing

**📖 Full Documentation**: [SETUP_GUIDE.md](SETUP_GUIDE.md)

## Технологический стек

- **FastAPI** 0.115+ - современный веб-фреймворк для создания API
- **Pydantic** 2.9+ - валидация данных и управление настройками
- **SQLAlchemy** 2.0+ - ORM для работы с базой данных (современный подход с `Mapped` и `mapped_column`)
- **Alembic** 1.13+ - инструмент для миграций базы данных
- **PostgreSQL** 16 - реляционная база данных
- **Docker & Docker Compose** - контейнеризация приложения
- **Pipenv** - управление зависимостями Python
- **Python** 3.12

## Требования

- Docker Desktop
- Docker Compose

## Структура проекта

```
investments-dash-service/
├── app/
│   ├── api/                  # API endpoints
│   │   ├── __init__.py
│   │   └── investments.py
│   ├── models/               # SQLAlchemy модели
│   │   ├── __init__.py
│   │   └── investment.py
│   ├── schemas/              # Pydantic схемы
│   │   ├── __init__.py
│   │   └── investment.py
│   ├── __init__.py
│   ├── config.py            # Конфигурация приложения
│   ├── database.py          # Настройка БД
│   └── main.py              # Главный файл приложения
├── alembic/                 # Миграции БД
│   ├── versions/
│   ├── env.py
│   └── script.py.mako
├── .env                     # Переменные окружения (не в git)
├── .gitignore
├── alembic.ini              # Конфигурация Alembic
├── docker-compose.yml       # Docker Compose конфигурация
├── Dockerfile
├── Pipfile                  # Зависимости Python
└── README.md
```

## Быстрый старт

### 1. Клонирование репозитория

Если вы еще не клонировали репозиторий:

```bash
git clone <repository-url>
cd investments-dash-service
```

### 2. Настройка переменных окружения

Создайте файл `.env` в корне проекта (можно скопировать из `.env.example`):

```bash
# Database Configuration
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=investments_dash
DATABASE_URL=postgresql://postgres:postgres@db:5432/investments_dash

# Application Configuration
APP_NAME=Investments Dashboard API
APP_VERSION=0.1.0
DEBUG=True
HOST=0.0.0.0
PORT=8000
```

**Важно**: Для продакшн окружения используйте надежные пароли!

### 3. Запуск приложения

Запустите приложение с помощью Docker Compose:

```bash
docker-compose up --build
```

При первом запуске:
- Будет собран Docker образ
- Запустится PostgreSQL
- Автоматически применятся миграции Alembic
- Запустится FastAPI приложение

### 4. Проверка работы

Откройте в браузере:

- **API документация (Swagger)**: http://localhost:8000/docs
- **API документация (ReDoc)**: http://localhost:8000/redoc
- **Health check**: http://localhost:8000/health

## Работа с приложением

### API Endpoints

#### Основные endpoints:

- `GET /` - Главная страница API
- `GET /health` - Проверка здоровья приложения

#### Investments endpoints:

- `GET /api/investments/` - Получить список всех инвестиций
- `GET /api/investments/{id}` - Получить инвестицию по ID
- `POST /api/investments/` - Создать новую инвестицию
- `PUT /api/investments/{id}` - Обновить инвестицию
- `DELETE /api/investments/{id}` - Удалить инвестицию

### Примеры запросов

#### Создание инвестиции:

```bash
curl -X POST "http://localhost:8000/api/investments/" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Apple Inc.",
    "symbol": "AAPL",
    "amount": 10,
    "purchase_price": 150.00,
    "current_price": 175.50
  }'
```

#### Получение всех инвестиций:

```bash
curl -X GET "http://localhost:8000/api/investments/"
```

#### Получение инвестиции по ID:

```bash
curl -X GET "http://localhost:8000/api/investments/1"
```

#### Обновление инвестиции:

```bash
curl -X PUT "http://localhost:8000/api/investments/1" \
  -H "Content-Type: application/json" \
  -d '{
    "current_price": 180.00
  }'
```

#### Удаление инвестиции:

```bash
curl -X DELETE "http://localhost:8000/api/investments/1"
```

## Работа с базой данных

### Создание новой миграции

Если вы изменили модели и хотите создать новую миграцию:

```bash
# Войдите в контейнер приложения
docker-compose exec app bash

# Создайте миграцию
alembic revision --autogenerate -m "Описание изменений"

# Примените миграцию
alembic upgrade head
```

### Откат миграции

```bash
# Откатить на одну версию назад
docker-compose exec app alembic downgrade -1

# Откатить все миграции
docker-compose exec app alembic downgrade base
```

### Просмотр истории миграций

```bash
docker-compose exec app alembic history
```

## Подключение к базе данных

Для прямого подключения к PostgreSQL:

```bash
docker-compose exec db psql -U postgres -d investments_dash
```

Или используйте любой PostgreSQL клиент с параметрами:
- Host: localhost
- Port: 5432
- Database: investments_dash
- User: postgres
- Password: postgres

## Разработка

### Установка зависимостей локально (опционально)

Если вы хотите работать с кодом локально:

```bash
# Установите pipenv
pip install pipenv

# Установите зависимости
pipenv install --dev

# Активируйте виртуальное окружение
pipenv shell
```

### Запуск тестов

```bash
docker-compose exec app pytest
```

### Форматирование кода

Рекомендуется использовать:
- **black** для форматирования
- **isort** для сортировки импортов
- **flake8** для линтинга

### Hot Reload

При запуске через Docker Compose приложение автоматически перезагружается при изменении файлов благодаря:
- Volume mapping в `docker-compose.yml`
- Флаг `--reload` в uvicorn

## Остановка приложения

```bash
# Остановить контейнеры
docker-compose down

# Остановить и удалить volumes (БД будет очищена)
docker-compose down -v
```

## Troubleshooting

### Порт уже занят

Если порт 8000 или 5432 уже используется, измените их в `docker-compose.yml`:

```yaml
services:
  app:
    ports:
      - "8001:8000"  # Измените первое число
  db:
    ports:
      - "5433:5432"  # Измените первое число
```

### Проблемы с миграциями

Если миграции не применяются автоматически:

```bash
docker-compose exec app alembic upgrade head
```

### Пересоздание базы данных

```bash
docker-compose down -v
docker-compose up --build
```

## Особенности реализации

### SQLAlchemy 2.0 современный подход

Проект использует современный подход SQLAlchemy 2.0 с типизацией:

```python
from sqlalchemy.orm import Mapped, mapped_column, DeclarativeBase

class Base(DeclarativeBase):
    pass

class Investment(Base):
    __tablename__ = "investments"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    amount: Mapped[float] = mapped_column(Float)
```

### Pydantic Settings

Все настройки приложения управляются через переменные окружения с использованием `pydantic-settings`:

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str
    app_name: str
    
    class Config:
        env_file = ".env"
```

## Дополнительные ресурсы

- [FastAPI документация](https://fastapi.tiangolo.com/)
- [SQLAlchemy 2.0 документация](https://docs.sqlalchemy.org/en/20/)
- [Alembic документация](https://alembic.sqlalchemy.org/)
- [Pydantic V2 документация](https://docs.pydantic.dev/latest/)
- [PostgreSQL документация](https://www.postgresql.org/docs/)

## 🚀 Production Deployment

Для развертывания приложения на production сервере используйте специальный `docker-compose.production.yml`.

### Быстрый старт (Production)

1. **Создайте `.env.production` файл:**
```bash
# Скопируйте пример и отредактируйте
cp .env.production.example .env.production
nano .env.production
```

Обязательно измените:
- `POSTGRES_PASSWORD` - надежный пароль для базы данных
- `SECRET_KEY` - длинный случайный ключ (минимум 32 символа)
- `TELEGRAM_BOT_TOKEN` - токен вашего бота
- `FRONTEND_URL` - URL вашего домена (https://your-domain.com)
- `NEXT_PUBLIC_API_URL` - API URL (https://your-domain.com/api)

2. **Деплой приложения:**
```bash
# Автоматический деплой (рекомендуется)
make prod-deploy

# Или вручную
docker-compose -f docker-compose.production.yml build
docker-compose -f docker-compose.production.yml up -d
```

3. **Проверьте статус:**
```bash
make prod-ps
# или
docker-compose -f docker-compose.production.yml ps
```

### Настройка SSL сертификата (HTTPS)

Для включения HTTPS используйте скрипт настройки SSL:

```bash
sudo ./setup-ssl.sh
```

Скрипт автоматически:
- Установит certbot (если не установлен)
- Получит SSL сертификат от Let's Encrypt
- Настроит автоматическое обновление сертификата
- Скопирует сертификаты в нужную директорию

После получения сертификата:
1. Отредактируйте `nginx/conf.d/default.conf`
2. Раскомментируйте блок HTTPS server
3. Замените `your-domain.com` на ваш домен
4. Перезапустите nginx: `make prod-restart`

### Production команды (Makefile)

```bash
make prod-build      # Собрать production образы
make prod-up         # Запустить production сервисы
make prod-down       # Остановить production сервисы
make prod-logs       # Показать логи
make prod-restart    # Перезапустить сервисы
make prod-ps         # Показать статус сервисов
make prod-migrate    # Применить миграции БД
make prod-deploy     # Полный деплой (pull, build, restart)
make prod-clean      # Очистить контейнеры и volumes
```

### Архитектура Production

Production окружение включает:

- **Backend** (FastAPI) - API сервер на порту 8000 (внутренний)
- **Frontend** (Next.js) - веб-интерфейс на порту 3000 (внутренний)
- **PostgreSQL** - база данных (не доступна извне)
- **Telegram Bot** - бот для авторизации
- **Nginx** - reverse proxy на портах 80/443 (публичный)

### Безопасность Production

Production конфигурация включает:
- ✅ Отдельная production база данных
- ✅ Все сервисы в изолированной Docker сети
- ✅ База данных недоступна извне
- ✅ Nginx как reverse proxy с rate limiting
- ✅ Security headers (HSTS, X-Frame-Options, etc.)
- ✅ Автоматические health checks
- ✅ Non-root контейнеры для безопасности
- ✅ Оптимизированные production Docker образы
- ✅ Standalone Next.js build
- ✅ Multi-worker uvicorn (4 workers)

### Мониторинг

Просмотр логов:
```bash
# Все сервисы
make prod-logs

# Конкретный сервис
docker-compose -f docker-compose.production.yml logs -f backend
docker-compose -f docker-compose.production.yml logs -f frontend
docker-compose -f docker-compose.production.yml logs -f nginx
```

Health checks:
```bash
# Backend API
curl http://your-domain.com/api/health

# Frontend
curl http://your-domain.com
```

### Обновление Production

Для обновления приложения на production:

```bash
# Автоматическое обновление
make prod-deploy

# Или вручную:
git pull origin master
docker-compose -f docker-compose.production.yml build
docker-compose -f docker-compose.production.yml up -d
```

### Backup базы данных

Создание backup:
```bash
docker-compose -f docker-compose.production.yml exec db \
  pg_dump -U postgres investments_dash > backup_$(date +%Y%m%d_%H%M%S).sql
```

Восстановление из backup:
```bash
cat backup_YYYYMMDD_HHMMSS.sql | \
  docker-compose -f docker-compose.production.yml exec -T db \
  psql -U postgres investments_dash
```

### Troubleshooting Production

**Проблемы с контейнерами:**
```bash
# Проверить статус
docker-compose -f docker-compose.production.yml ps

# Проверить логи
docker-compose -f docker-compose.production.yml logs --tail=100

# Перезапустить все
docker-compose -f docker-compose.production.yml restart
```

**Проблемы с базой данных:**
```bash
# Проверить подключение к БД
docker-compose -f docker-compose.production.yml exec db \
  psql -U postgres -d investments_dash -c "SELECT 1;"

# Применить миграции
make prod-migrate
```

**Nginx не запускается:**
```bash
# Проверить конфигурацию
docker-compose -f docker-compose.production.yml exec nginx nginx -t

# Посмотреть логи
docker-compose -f docker-compose.production.yml logs nginx
```

## Лицензия

MIT

