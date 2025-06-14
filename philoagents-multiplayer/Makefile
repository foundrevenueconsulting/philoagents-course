# PhiloAgents Multiplayer Server - Development and Deployment Commands

.PHONY: help dev build start stop restart logs clean test lint format health

# Default target
help: ## Show this help message
	@echo "PhiloAgents Multiplayer Server Commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# =============================================================================
# LOCAL DEVELOPMENT
# =============================================================================

dev: ## Start local development server with hot reload
	npm run dev

build: ## Build TypeScript to JavaScript
	npm run build

start: ## Start production server locally
	npm run start

install: ## Install dependencies
	npm ci

# =============================================================================
# DOCKER LOCAL DEVELOPMENT
# =============================================================================

docker-dev: ## Start local development environment with Docker
	docker-compose -f docker-compose.local.yml up --build

docker-dev-bg: ## Start local development environment in background
	docker-compose -f docker-compose.local.yml up --build -d

docker-stop: ## Stop local Docker environment
	docker-compose -f docker-compose.local.yml down

docker-restart: ## Restart local Docker environment
	docker-compose -f docker-compose.local.yml down && docker-compose -f docker-compose.local.yml up --build -d

docker-logs: ## View Docker container logs
	docker-compose -f docker-compose.local.yml logs -f

docker-clean: ## Clean up Docker containers and volumes
	docker-compose -f docker-compose.local.yml down -v
	docker system prune -f

# =============================================================================
# DATABASE MANAGEMENT
# =============================================================================

db-setup: ## Initialize database schema
	npm run db:migrate

db-connect: ## Connect to local PostgreSQL database
	docker exec -it philoagents-postgres-local psql -U philoagents -d philoagents_multiplayer

db-reset: ## Reset database (WARNING: destroys all data)
	docker-compose -f docker-compose.local.yml down -v postgres-multiplayer
	docker-compose -f docker-compose.local.yml up postgres-multiplayer -d
	sleep 5
	$(MAKE) db-setup

# =============================================================================
# TESTING AND QUALITY
# =============================================================================

test: ## Run tests
	npm test

test-watch: ## Run tests in watch mode
	npm run test -- --watch

lint: ## Run ESLint
	npm run lint

format: ## Format code with Prettier
	npm run format

loadtest: ## Run load testing against local server
	npm run loadtest

# =============================================================================
# MONITORING AND DEBUGGING
# =============================================================================

health: ## Check server health
	@echo "Checking multiplayer server health..."
	@curl -f http://localhost:2567/health || echo "Server is not responding"

monitor: ## Open Colyseus monitor dashboard
	@echo "Opening Colyseus monitor at http://localhost:2567/colyseus"
	@open http://localhost:2567/colyseus || echo "Monitor available at http://localhost:2567/colyseus"

playground: ## Open Colyseus playground
	@echo "Opening Colyseus playground..."
	@open http://localhost:2567 || echo "Playground available at http://localhost:2567"

# =============================================================================
# PRODUCTION DEPLOYMENT
# =============================================================================

build-prod: ## Build for production deployment
	docker build -t philoagents-multiplayer:latest .

deploy-railway: ## Deploy to Railway (requires Railway CLI)
	@echo "Deploying to Railway..."
	railway deploy

# =============================================================================
# UTILITIES
# =============================================================================

clean: ## Clean build artifacts and node_modules
	rm -rf lib/
	rm -rf node_modules/
	rm -rf .nyc_output/
	rm -rf coverage/

env-setup: ## Setup environment file from template
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "Created .env file from template. Please configure your environment variables."; \
	else \
		echo ".env file already exists."; \
	fi

# =============================================================================
# INTEGRATION WITH MAIN PROJECT
# =============================================================================

start-full-stack: ## Start complete PhiloAgents stack (requires main project)
	@echo "Starting full PhiloAgents stack..."
	@cd .. && make infrastructure-up

stop-full-stack: ## Stop complete PhiloAgents stack
	@echo "Stopping full PhiloAgents stack..."
	@cd .. && make infrastructure-stop