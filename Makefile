.PHONY: build up down logs deploy clean help

# ==============================================================================
# Agentic AI Job Application Copilot - Operations Engine
# ==============================================================================

help:
	@echo "Agentic Job Copilot Operations Engine:"
	@echo "---------------------------------------"
	@echo "make build      - Build local docker containers"
	@echo "make up         - Start infrastructure (Daemonized)"
	@echo "make down       - Stop infrastructure"
	@echo "make logs       - View active logs"
	@echo "make deploy     - Pull codebase, build, and deploy (Prod)"
	@echo "make clean      - Nuke docker volumes (DANGEROUS)"

build:
	docker-compose build

up:
	docker-compose up -d

down:
	docker-compose down

logs:
	docker-compose logs -f

deploy: down build up
	@echo "Deployment successfully reloaded."

clean: down
	docker-compose rm -fsv
	docker volume prune -f
	@echo "State nuked."
