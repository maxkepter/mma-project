# Docker Setup Guide

This guide explains how to run the MMA Project using Docker and Docker Compose.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose V2

## Quick Start

### 1. Environment Setup

Copy the example environment file and customize if needed:

```bash
cp .env.example .env
```

Default values:
- `PORT=3000` — Server port
- `DB_USERNAME=postgres` — PostgreSQL username
- `DB_PASSWORD=postgres` — PostgreSQL password
- `DB_NAME=mma_db` — Database name
- `DB_PORT=5432` — PostgreSQL port

### 2. Start Services

Start both PostgreSQL and the NestJS server:

```bash
docker-compose up -d
```

The `-d` flag runs containers in detached mode (background).

### 3. View Logs

Watch logs from all services:

```bash
docker-compose logs -f
```

Or specific services:

```bash
docker-compose logs -f server
docker-compose logs -f postgres
```

### 4. Check Status

```bash
docker-compose ps
```

Both services should show "Up" and "healthy" status.

### 5. Access the Application

- **Server API:** http://localhost:3000
- **PostgreSQL:** localhost:5432 (use a client like pgAdmin or DBeaver)

## Common Commands

### Stop Services

```bash
docker-compose down
```

### Stop and Remove Volumes (⚠️ deletes database data)

```bash
docker-compose down -v
```

### Rebuild After Code Changes

```bash
docker-compose up -d --build
```

### Execute Commands Inside Containers

```bash
# Server shell
docker-compose exec server sh

# PostgreSQL shell
docker-compose exec postgres psql -U postgres -d mma_db
```

### View Database Schema

```bash
docker-compose exec postgres psql -U postgres -d mma_db -c "\dt"
```

## Development Workflow

For active development, you may prefer running services separately:

1. **Start only PostgreSQL via Docker:**

```bash
docker-compose up -d postgres
```

2. **Run the server locally in watch mode:**

```bash
npm run server:dev
```

This gives you hot-reload while using the Dockerized database.

## Troubleshooting

### Server can't connect to database

- Ensure PostgreSQL is healthy: `docker-compose ps`
- Check logs: `docker-compose logs postgres`
- Verify environment variables in `.env`

### Port already in use

Change ports in `.env`:

```env
PORT=3001
DB_PORT=5433
```

Then restart: `docker-compose down && docker-compose up -d`

### Database schema out of sync

TypeORM `synchronize` is enabled in non-production environments, so schema changes apply automatically on server restart. For production, use migrations instead.

### Reset everything

```bash
docker-compose down -v
docker system prune -f
docker-compose up -d --build
```

## Production Considerations

- Set `NODE_ENV=production` in `.env`
- Use strong passwords for `DB_PASSWORD`
- Disable TypeORM `synchronize` and use migrations
- Consider using Docker secrets for sensitive data
- Set up proper logging and monitoring
- Use a reverse proxy (nginx, Traefik) for SSL termination
- Implement database backups

## Architecture

```
┌─────────────────┐         ┌─────────────────┐
│   NestJS Server │────────▶│   PostgreSQL    │
│   (port 3000)   │         │   (port 5432)   │
└─────────────────┘         └─────────────────┘
        │                            │
        └────────────┬───────────────┘
                     │
              mma-network (bridge)
```

- Both services run on an isolated Docker network (`mma-network`)
- Server depends on PostgreSQL health check before starting
- PostgreSQL data persists in a Docker volume (`postgres_data`)
- Health checks ensure services are ready before marking as "healthy"

## Next Steps

- Check [CLAUDE.md](./CLAUDE.md) for project architecture details
- Explore the Expo app in `app/`
- Review server documentation in `server/`
