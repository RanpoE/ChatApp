SHELL := /bin/bash

# Configuration
FRONTEND_DIR := frontend
BACKEND_DIR := backend
NEXT_PUBLIC_API_BASE_URL ?= http://localhost:3001

.PHONY: help setup dev dev-back dev-front build start start-back start-front up down logs ps db-shell clean

help:
	@echo "Makefile targets:"
	@echo "  setup       - Install deps for frontend and backend"
	@echo "  dev         - Run backend (ts-node-dev) and frontend (next dev) locally"
	@echo "  dev-back    - Run backend dev only"
	@echo "  dev-front   - Run frontend dev only"
	@echo "  build       - Build backend (tsc) and frontend (next build)"
	@echo "  start       - Start both apps in production mode (requires prior build)"
	@echo "  start-back  - Start backend from dist"
	@echo "  start-front - Start frontend (next start)"
	@echo "  up          - docker compose up (db, backend, frontend)"
	@echo "  down        - docker compose down -v"
	@echo "  logs        - docker compose logs -f"
	@echo "  ps          - docker compose ps"
	@echo "  db-shell    - Open psql shell inside db container"
	@echo "  clean       - Clean build artifacts"

# Install dependencies
setup:
	@echo "Installing backend deps..."
	@if [ -f $(BACKEND_DIR)/package-lock.json ]; then \
		npm ci --prefix $(BACKEND_DIR); \
	else \
		npm install --prefix $(BACKEND_DIR); \
	fi
	@echo "Installing frontend deps..."
	@if [ -f $(FRONTEND_DIR)/package-lock.json ]; then \
		npm ci --prefix $(FRONTEND_DIR); \
	else \
		npm install --prefix $(FRONTEND_DIR); \
	fi

# Local development (without Docker)
dev: 
	@echo "Starting backend and frontend (local dev). Press Ctrl+C to stop."
	@trap 'kill 0' SIGINT SIGTERM EXIT; \
	( PORT=3001 DATABASE_URL=$${DATABASE_URL} npm --prefix $(BACKEND_DIR) run dev & ); \
	( cd $(FRONTEND_DIR) && NEXT_PUBLIC_API_BASE_URL=$(NEXT_PUBLIC_API_BASE_URL) npm run dev ); \
	wait

dev-back:
	PORT=3001 DATABASE_URL=$${DATABASE_URL} npm --prefix $(BACKEND_DIR) run dev

dev-front:
	cd $(FRONTEND_DIR) && NEXT_PUBLIC_API_BASE_URL=$(NEXT_PUBLIC_API_BASE_URL) npm run dev

# Build and start (production-like, without Docker)
build:
	npm --prefix $(BACKEND_DIR) run build
	npm --prefix $(FRONTEND_DIR) run build

start: start-back start-front

start-back:
	PORT=3001 node $(BACKEND_DIR)/dist/server.js

start-front:
	cd $(FRONTEND_DIR) && NEXT_PUBLIC_API_BASE_URL=$(NEXT_PUBLIC_API_BASE_URL) npm run start

# Docker Compose helpers
up:
	docker-compose up --build

down:
	docker-compose down -v

logs:
	docker-compose logs -f

ps:
	docker-compose ps

db-shell:
	docker exec -it chatapp-db psql -U postgres -d chatapp

# Cleanup
clean:
	rm -rf $(BACKEND_DIR)/dist
