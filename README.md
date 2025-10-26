# Investments Dashboard Service

Сервис для управления инвестиционным портфелем, построенный на FastAPI с использованием PostgreSQL.

> **🆕 Впервые здесь?** Начните с [START_HERE.md](START_HERE.md) или [FIRST_RUN.md](FIRST_RUN.md)

## 🚀 Быстрый старт

```bash
# С помощью Makefile (Mac/Linux)
make setup && make dev

# Или вручную
chmod +x setup.sh && ./setup.sh
docker-compose up --build -d
```

**📖 Документация**: [START_HERE.md](START_HERE.md) | [QUICKSTART.md](QUICKSTART.md) | [SETUP_GUIDE.md](SETUP_GUIDE.md) | [ARCHITECTURE.md](ARCHITECTURE.md)

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

## Лицензия

MIT

