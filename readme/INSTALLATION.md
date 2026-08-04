# Installation Guide

This guide covers how to install and run the Production Management System (PMS) on a new machine.

---

## 1. Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| **Docker** + **Docker Compose** | Latest | Easiest full stack (recommended) |
| **PHP** | 8.3+ | Laravel backend |
| **Composer** | 2.x | PHP dependencies |
| **Node.js** | 18+ | React frontend build |
| **npm** | 9+ | Frontend packages |
| **MySQL** | 8.0 | Database |
| **RabbitMQ** | 3.x | Async production queue (optional for local: use `database` queue) |

---

## 2. Option A — Install with Docker (recommended)

### Step 1: Clone and enter the project

```bash
git clone <repository-url> neProject
cd neProject
```

### Step 2: Create environment file

```bash
cp .env.example .env
```

Generate an application key (on your host, before or after first compose run):

```bash
php artisan key:generate
```

Or set `APP_KEY` manually in `.env` before `docker compose up`.

### Step 3: Start all services

```bash
docker compose up --build
```

This starts:

| Service | Port | Role |
|---------|------|------|
| **app** | 8000 | Laravel API + React UI |
| **mysql** | 3306 | Database |
| **rabbitmq** | 5672, 15672 | Message queue + management UI |
| **queue-worker** | — | Processes production jobs |

On first run, the app container will:

- Run `composer install`
- Run `npm install` and `npm run build`
- Run `php artisan migrate --seed`

### Step 4: Open the application

| URL | Description |
|-----|-------------|
| http://localhost:8000 | Web UI + API |
| http://localhost:15672 | RabbitMQ UI (`guest` / `guest`) |

Log in with **admin@pms.com** / **password**.

### Step 5: Verify queue worker

Production batches stay **pending** until the worker runs. With Docker, the `queue-worker` service handles this automatically.

Check logs:

```bash
docker compose logs -f queue-worker
```

---

## 3. Option B — Local development (without Docker)

Use this when developing on your machine with existing MySQL (or local MySQL install).

### Step 1: Install dependencies

```bash
composer install
npm install
```

### Step 2: Configure environment

```bash
cp .env.example .env
php artisan key:generate
```

Edit `.env`:

```env
APP_URL=http://127.0.0.1:8001

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=laravel
DB_USERNAME=root
DB_PASSWORD=your_password

SESSION_DRIVER=database

# Use rabbitmq if RabbitMQ is installed, or database for simple local dev:
QUEUE_CONNECTION=database

# If using RabbitMQ:
# QUEUE_CONNECTION=rabbitmq
# RABBITMQ_HOST=127.0.0.1
# RABBITMQ_PORT=5672

VITE_BACKEND_URL=http://127.0.0.1:8001
VITE_API_URL=/api
```

**Important:**

- Use **one URL consistently** in the browser (`127.0.0.1` or `localhost`, not both).
- If port **8000** is used by another app, run Laravel on **8001** (see below).
- Keep `VITE_API_URL=/api` (relative path).

### Step 3: Create database and migrate

```bash
# Create MySQL database (example)
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS laravel;"

php artisan migrate --seed
php artisan config:clear
```

### Step 4: Run services (3 terminals)

**Terminal 1 — Laravel**

```bash
php artisan serve --port=8001
```

**Terminal 2 — Vite (frontend hot reload)**

```bash
npm run dev
```

**Terminal 3 — Queue worker** (required for production to complete)

```bash
# With RabbitMQ:
php artisan queue:work rabbitmq --queue=production

# Or with database queue (set QUEUE_CONNECTION=database in .env):
php artisan queue:work --queue=production
```

### Step 5: Open the app

http://127.0.0.1:8001/login

---

## 4. Production build (no Vite dev server)

```bash
npm run build
php artisan serve --port=8001
```

Only Laravel needs to run; assets are served from `public/build/`.

---

## 5. Post-install checklist

- [ ] Can open login page without errors
- [ ] Can log in as `admin@pms.com` / `password`
- [ ] Dashboard loads at `/admin`
- [ ] Queue worker is running (for production status → `completed`)
- [ ] MySQL has seeded data (Steel Sheets, Steel Rods, Steel Pipes)

---

## 6. Common issues

### Authentication / logout on every click

- Set `APP_URL` to the **exact** URL in the browser.
- Use port **8001** if another project uses 8000.
- Clear browser cookies for `127.0.0.1`.
- Run `php artisan config:clear`.

### Production stays `pending`

- Queue worker is not running. Start Terminal 3 (see above).
- Check `QUEUE_CONNECTION` in `.env` matches your worker command.

### "No recipe defined for this finished product"

- Link products under **Admin → Recipes** before starting production.
- See [WORKFLOW.md](./WORKFLOW.md).

### Traceability: "Finished product batch not found"

- Finished batches exist only **after** semi→finished production **completes**.
- Use the dropdown on the Traceability page (do not guess batch ID `1`).

### Port already in use

```bash
php artisan serve --port=8001
```

Update `APP_URL` and `VITE_BACKEND_URL` to match.

---

## 7. Useful commands

```bash
# Reset database and re-seed
php artisan migrate:fresh --seed

# Clear config cache after .env changes
php artisan config:clear

# Run tests
php artisan test

# Build frontend
npm run build
```
