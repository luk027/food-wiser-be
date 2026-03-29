# FoodWiser BE

Food intelligence API — scan a barcode, get structured product data with halal & dietary classification, powered by Open Food Facts and cached in PostgreSQL.

---

## Stack

| | |
|---|---|
| **Runtime** | Bun |
| **Framework** | Hono |
| **ORM** | Drizzle |
| **Database** | PostgreSQL (Neon) |
| **Data Source** | Open Food Facts API |
| **Validation** | Zod |

---

## How It Works

```
Barcode → DB Cache (30-day TTL) → Open Food Facts → Map & Classify → Save → Return
```

1. Checks PostgreSQL cache — returns immediately if fresh
2. Fetches from OFF if not cached or expired
3. Maps raw OFF data to structured schema
4. Derives dietary status (vegan / vegetarian / non-veg)
5. Classifies halal status via keyword + E-code DB lookup
6. Persists and returns

---

## Endpoint

```
GET /api/v1/products/scan/:barcode
```

**Example:** `/api/v1/products/scan/3017620422003`

**Success response:**
```json
{
  "success": true,
  "message": "Product scanned successfully",
  "status": 200,
  "data": {
    "barcode": "3017620422003",
    "name": "Nutella",
    "brand": "Ferrero",
    "dietaryStatus": "veg",
    "halalStatus": "halal",
    "nutriScore": "e",
    "novaGroup": "4",
    "dataSource": "off-only",
    ...
  }
}
```

**Product not found:**
```json
{
  "success": true,
  "message": "Food product data not available",
  "status": 200,
  "data": null
}
```

---

## Setup

```bash
# Install dependencies
bun install

# Configure environment
cp .env.example .env

# Push schema & seed halal data
bun run db:push
bun run db:seed

# Start dev server
bun run dev
```

**Required env vars:**
```env
DATABASE_URL=postgresql://...
PORT=3000
NODE_ENV=development
```

---

## Scripts

```bash
bun run dev          # Dev server with hot reload
bun run start        # Production server
bun run db:push      # Push schema to DB
bun run db:seed      # Seed halal/additive data
bun run db:reset     # Drop → push → seed
bun run db:studio    # Open Drizzle Studio
bun run format       # Format source files
```
