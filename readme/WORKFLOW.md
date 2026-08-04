# Business Workflow Guide

This document describes the **full procedure** to use the Production Management System from setup to traceability.

---

## Overview

```
Products → Recipes (BOM) → Inventory → Production → Traceability
```

| Stage | What happens |
|-------|----------------|
| **Products** | Define raw materials, semi-finished, and finished items |
| **Recipes** | Link products: how much input is needed per output unit |
| **Inventory** | Receive and track stock at each stage |
| **Production** | Convert materials through the chain (async via RabbitMQ) |
| **Traceability** | Trace a finished batch back to raw materials |

---

## Phase 1 — Login & roles

1. Open **/login**
2. Sign in with a demo account:

| Role | Email | What they can do |
|------|-------|-------------------|
| **Admin** | admin@pms.com | Everything + user management |
| **Manager** | manager@pms.com | Products, recipes, inventory, production |
| **Operator** | operator@pms.com | View inventory, run production |

Password for all: `password`

---

## Phase 2 — Products (catalog)

**Menu:** Admin → **Products**

### List page (`/admin/products`)

- View all raw, semi-finished, and finished products in one table
- **Filter** by type and search by name/SKU
- **Edit** / **Delete** from the list

### Create a product

1. Click **+ Raw Material**, **+ Semi-Finished**, or **+ Finished**
2. Fill in: Name, SKU, Unit, Description
3. Save → success toast appears

### Seeded example (after `db:seed`)

| Type | Name | SKU |
|------|------|-----|
| Raw | Steel Sheets | RM-STEEL-SHEET |
| Semi | Steel Rods | SF-STEEL-ROD |
| Finished | Steel Pipes | FP-STEEL-PIPE |

---

## Phase 3 — Recipes (link products / BOM)

**Menu:** Admin → **Recipes**

A **recipe** tells production how much input to consume per 1 output unit.

### Why recipes are required

Without a recipe, production returns:

> *No recipe defined for this finished product.*

### Create Raw → Semi recipe

1. Go to **Recipes** → **+ Raw → Semi**
2. **Raw Material (consumed):** e.g. Steel Sheets
3. **Semi-Finished (produced):** e.g. Steel Rods
4. **Quantity per unit:** e.g. `2.5` (2.5 kg sheets per 1 rod)
5. Click **Link Products**

### Create Semi → Finished recipe

1. Go to **Recipes** → **+ Semi → Finished**
2. **Semi-Finished (consumed):** e.g. Steel Rods
3. **Finished (produced):** your finished product
4. **Quantity per unit:** e.g. `3` (3 rods per 1 pipe)
5. Click **Link Products**

### Example chain

```
2.5 kg Steel Sheets  →  1 Steel Rod  →  3 Steel Rods  →  1 Steel Pipe
     (raw→semi)              (semi→finished)
```

---

## Phase 4 — Inventory

**Menu:** Admin → **Inventory**

### View stock

- List shows quantity per product and batch count
- **Filter** by category; **search** by name/SKU
- Click **Batches** to expand batch-level detail

### Receive raw materials

1. Go to **Inventory** → **+ Receive Raw Material**
2. Select raw material, quantity, optional batch number
3. Save → stock increases

Seeded data includes 1500 kg Steel Sheets (two batches).

### Edit / delete raw batches (Admin/Manager)

- Expand batches → **Edit** or **Delete**
- Delete only works if batch was not used in production

---

## Phase 5 — Production

**Menu:** Admin → **Production**

**Requires:** queue worker running (see [INSTALLATION.md](./INSTALLATION.md)).

### Start production

1. Go to **Production** → **+ Start Production**
2. Choose type:
   - **Raw → Semi-Finished** (e.g. sheets → rods)
   - **Semi-Finished → Finished** (e.g. rods → pipes)
3. Select output product, quantity, optional batch number and notes
4. Submit → batch is **queued** (status: `pending`)

### Production statuses

| Status | Meaning |
|--------|---------|
| `pending` | Queued, waiting for worker |
| `processing` | Worker is running |
| `completed` | Done; inventory updated |
| `failed` | Error or cancelled |

### Manage batches (list page)

- **Filter** by status and type
- **Change status** (Admin/Manager): cancel, retry, start processing
- **View** details and event log
- **Delete** pending or failed batches

### Example: produce 10 steel rods

1. Ensure recipe: 2.5 kg sheets → 1 rod
2. Ensure inventory: ≥ 25 kg Steel Sheets
3. Production → Start → Raw→Semi → Steel Rods → qty `10`
4. Wait for worker → status `completed`
5. Check **Inventory** → semi-finished stock increased

### Example: produce 5 steel pipes

1. Ensure recipe: 3 rods → 1 pipe
2. Ensure inventory: ≥ 15 Steel Rods
3. Production → Start → Semi→Finished → Steel Pipes → qty `5`
4. Wait for worker → status `completed`

---

## Phase 6 — Traceability

**Menu:** Admin → **Traceability**

### When to use

After **semi→finished** production **completes**, a **finished product batch** is created.

### How to trace

1. Open **Traceability**
2. Select a batch from the **dropdown** (only completed batches appear)
3. Click **Trace Batch**
4. View chain: finished batch → production → semi sources → raw materials

> Do not enter random IDs. Batch `1` may not exist until production completes.

---

## Phase 7 — User management (Admin only)

**Menu:** Admin → **Users**

| Action | Page |
|--------|------|
| List users | `/admin/users` |
| Create user | `/admin/users/create` |
| Edit user | `/admin/users/{id}/edit` |

Filter by role; search by name/email.

---

## Complete walkthrough (new finished product)

Use this checklist when you add a **new** finished product:

```
□ 1. Products  → Create semi-finished product (if needed)
□ 2. Products  → Create finished product
□ 3. Recipes   → Raw → Semi (if new semi needs new raw link)
□ 4. Recipes   → Semi → Finished (link semi INPUT to finished OUTPUT)
□ 5. Inventory → Receive raw materials (if stock low)
□ 6. Production → Raw → Semi (build semi stock)
□ 7. Production → Semi → Finished (build finished stock)
□ 8. Traceability → Select finished batch and trace
```

---

## Admin UI route map

| Module | List | Create | Edit / Detail |
|--------|------|--------|----------------|
| Products | `/admin/products` | `/admin/products/{type}/create` | `/admin/products/{type}/{id}/edit` |
| Recipes | `/admin/recipes` | `/admin/recipes/{type}/create` | `/admin/recipes/{type}/{id}/edit` |
| Inventory | `/admin/inventory` | `/admin/inventory/receive` | `/admin/inventory/batches/{id}/edit` |
| Production | `/admin/production` | `/admin/production/create` | `/admin/production/{id}` |
| Users | `/admin/users` | `/admin/users/create` | `/admin/users/{id}/edit` |
| Traceability | `/admin/traceability` | — | — |

`{type}` for products: `raw`, `semi`, `finished`  
`{type}` for recipes: `raw-to-semi`, `semi-to-finished`

---

## API workflow (optional / testing)

```bash
# Login (session cookie) — use browser or Sanctum CSRF flow for SPA

# 1. Inventory
curl http://127.0.0.1:8001/api/inventory

# 2. Start raw → semi
curl -X POST http://127.0.0.1:8001/api/production/raw-to-semi \
  -H "Content-Type: application/json" \
  -d '{"semi_finished_product_id": 1, "output_quantity": 10}'

# 3. Start semi → finished
curl -X POST http://127.0.0.1:8001/api/production/semi-to-finished \
  -H "Content-Type: application/json" \
  -d '{"finished_product_id": 1, "output_quantity": 5}'

# 4. Trace (use real finished batch ID from traceability list)
curl http://127.0.0.1:8001/api/traceability/finished-batch/1
```

---

## Notifications

The UI shows **toast messages**:

- **Green** — success (create, update, delete, login)
- **Red** — errors (validation, missing recipe, insufficient inventory)

Each list page includes a collapsible **“what you can do here”** guide.
