.PHONY: help setup build up down restart logs shell db-shell migration migrate rollback test clean

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

setup: ## Initialize project (create .env files)
	@chmod +x setup.sh
	@./setup.sh

build: ## Build Docker images
	docker-compose build

up: ## Start all services
	docker-compose up -d

down: ## Stop all services
	docker-compose down

restart: ## Restart all services
	docker-compose restart

logs: ## Show logs for all services
	docker-compose logs -f

shell: ## Open shell in app container
	docker-compose exec app bash

db-shell: ## Open PostgreSQL shell
	docker-compose exec db psql -U postgres -d investments_dash

migration: ## Create new migration (usage: make migration MSG="description")
	docker-compose exec app alembic revision --autogenerate -m "$(MSG)"

migrate: ## Apply all pending migrations
	docker-compose exec app alembic upgrade head

rollback: ## Rollback last migration
	docker-compose exec app alembic downgrade -1

history: ## Show migration history
	docker-compose exec app alembic history

test: ## Run tests
	docker-compose exec app pytest

clean: ## Remove all containers, volumes and images
	docker-compose down -v
	docker-compose rm -f

dev: setup build up migrate ## Setup and start development environment
	@echo "🚀 Development environment is ready!"
	@echo "📚 API docs: http://localhost:8000/docs"

.DEFAULT_GOAL := help

