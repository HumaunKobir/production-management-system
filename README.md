# Production Management System

A manufacturing production management system built with Laravel, MySQL, RabbitMQ, and React. It supports a three-stage production workflow (raw materials → semi-finished → finished products) with batch traceability and event-driven inventory processing.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Laravel (port 8000)               │
│  ┌─────────────────┐         ┌──────────────────┐   │
│  │ React SPA       │  REST   │  API + Services  │   │
│  │ resources/js    │ ──────► │  /api/*          │   │
│  │ resources/views │         └────────┬─────────┘   │
│  └─────────────────┘                  │             │
└───────────────────────────────────────┼─────────────┘
                                        │
                             ┌──────────┼──────────┐
                             ▼          ▼          ▼
                         ┌───────┐ ┌────────┐ ┌─────────┐
                         │ MySQL │ │RabbitMQ│ │ Worker  │
                         └───────┘ └────────┘ └─────────┘
```

Production orders are validated synchronously via the API, then dispatched to a RabbitMQ queue. A separate worker processes inventory adjustments, batch creation, and event logging asynchronously.

## Quick Start

1. Copy the environment file and set `APP_KEY`:

```bash
cp .env.example .env
php artisan key:generate
```

2. Start all services:

```bash
docker compose up --build
```

| Service        | URL                                  |
|----------------|--------------------------------------|
| App (UI + API) | http://localhost:8000                |
| API            | http://localhost:8000/api            |
| RabbitMQ UI    | http://localhost:15672 (guest/guest) |

## Authentication & Authorization

Session-based auth via **Laravel Sanctum** with role-based access control.

### Demo Accounts

| Role | Email | Password | Permissions |
|------|-------|----------|-------------|
| Admin | admin@pms.com | password | Full access + user management |
| Manager | manager@pms.com | password | Products, inventory, production |
| Operator | operator@pms.com | password | Inventory view, production execution |

### Frontend Routes

| Route | Access |
|-------|--------|
| `/` | Public home page |
| `/login` | Admin login |
| `/admin` | Dashboard (authenticated) |
| `/admin/inventory` | All roles |
| `/admin/products` | Admin, Manager |
| `/admin/production` | All roles |
| `/admin/traceability` | All roles |
| `/admin/users` | Admin only |

Run migrations and seed after pulling:

```bash
php artisan migrate
php artisan db:seed
```

## Domain Model (Steel Manufacturing)

The seeded data uses a steel manufacturing example:

- **Steel Sheets** (raw material) → **Steel Rods** (semi-finished) → **Steel Pipes** (finished)
- Recipe: 2.5 kg steel sheets per steel rod
- Recipe: 3 steel rods per steel pipe

## API Endpoints

### Products (CRUD)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/raw-materials` | List / create raw materials |
| GET/PUT/DELETE | `/api/raw-materials/{id}` | Show / update / delete |
| GET/POST | `/api/semi-finished-products` | List / create semi-finished |
| GET/PUT/DELETE | `/api/semi-finished-products/{id}` | Show / update / delete |
| GET/POST | `/api/finished-products` | List / create finished |
| GET/PUT/DELETE | `/api/finished-products/{id}` | Show / update / delete |

### Inventory

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/inventory` | Current inventory at all stages |
| POST | `/api/inventory/receive` | Receive raw material batch |

### Production

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/production` | Production history |
| GET | `/api/production/{id}` | Batch details with traceability |
| POST | `/api/production/raw-to-semi` | Start raw → semi production |
| POST | `/api/production/semi-to-finished` | Start semi → finished production |

### Traceability

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/traceability/finished-batch/{id}` | Full trace from finished batch to raw materials |

## Example Workflow

```bash
# 1. Check inventory
curl http://localhost:8000/api/inventory

# 2. Produce 10 steel rods (consumes 25 kg steel sheets)
curl -X POST http://localhost:8000/api/production/raw-to-semi \
  -H "Content-Type: application/json" \
  -d '{"semi_finished_product_id": 1, "output_quantity": 10}'

# 3. Wait for worker, then produce 5 steel pipes (consumes 15 steel rods)
curl -X POST http://localhost:8000/api/production/semi-to-finished \
  -H "Content-Type: application/json" \
  -d '{"finished_product_id": 1, "output_quantity": 5}'

# 4. Trace finished batch #1 back to raw materials
curl http://localhost:8000/api/traceability/finished-batch/1
```

## Database Schema

- **raw_materials**, **semi_finished_products**, **finished_products** — product catalogs
- **raw_material_batches**, **semi_finished_batches**, **finished_product_batches** — inventory batches
- **production_batches** — production runs with status tracking
- **production_inputs** — consumed input batches per production run
- **production_events** — audit log of production lifecycle
- **raw_to_semi_recipes**, **semi_to_finished_recipes** — bill of materials

## Tech Stack

- **Backend:** Laravel 13, PHP 8.3
- **Database:** MySQL 8.0
- **Queue:** RabbitMQ with `laravel-queue-rabbitmq`
- **Frontend:** React 19 + Vite (in `resources/js`, served via `resources/views/app.blade.php`)
- **Infrastructure:** Docker Compose

## Local Development (without Docker)

```bash
composer install
npm install
cp .env.example .env
php artisan key:generate
# Configure MySQL and RabbitMQ in .env
php artisan migrate --seed

# Terminal 1: Laravel + Vite dev server
php artisan serve
npm run dev

# Terminal 2: Queue worker
php artisan queue:work rabbitmq --queue=production
```

### Frontend Structure

```
resources/
├── js/
│   ├── main.jsx         # React entry point
│   ├── App.jsx          # Router + layout
│   ├── api.js           # API client
│   ├── App.css          # Styles
│   └── pages/           # Page components
└── views/
    └── app.blade.php    # SPA shell (loads Vite assets)
```
