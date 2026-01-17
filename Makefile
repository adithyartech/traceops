.PHONY: dev down logs

dev:
	docker compose -f deploy/docker-compose.dev.yml up --build

down:
	docker compose -f deploy/docker-compose.dev.yml down

logs:
	docker compose -f deploy/docker-compose.dev.yml logs -f
