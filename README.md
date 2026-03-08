# 🥦 FoodWiser — Backend API

> Scan any food barcode → get ingredients, nutrition, halal status, and dietary flags — instantly.

Built with **Bun + Hono + Drizzle ORM + PostgreSQL**. Uses **Open Food Facts** as primary data source with optional **AI enrichment** (Gemini / Groq) for incomplete products.

---

## ✨ Features

- 🔍 Single barcode scan endpoint → full product profile
- 🌐 Open Food Facts API as primary data source (3M+ products)
- 🤖 AI fills missing fields, translates ingredients, classifies halal status
- 🕌 DB-driven halal classification (keyword + additive lookup)
- 🥗 Dietary flags — vegan, vegetarian, palm oil (tri-state)
- 📊 Nutri-Score, NOVA group, Eco-Score, full nutriments
- ⚡ 30-day DB cache — repeat scans are instant
- 🛡️ Rate limiting (50 req / 10 min per IP)
- 🔑 BYOK — pass your own AI key via `x-api-key` header

---

## 🚀 Quick Start

### Prerequisites

- [Bun](https://bun.sh) v1.3.6+
- PostgreSQL database (e.g. [Neon](https://neon.tech))

### Setup

```bash
git clone https://github.com/your-org/foodwiser-be.git
cd foodwiser-be
bun install
cp .env.example .env   # fill in your DB URL + AI keys
```

### Database

```bash
bun run db:push        # push schema to DB
bun run db:seed        # seed halal/haram classification data
```

### Run

```bash
bun run dev            # dev server with hot reload  →  http://localhost:3000
```

---

## 📡 API

### `GET /api/v1/products/scan/:barcode`

| Param / Header | Type | Required | Description |
|---|---|---|---|
| `:barcode` | path | ✅ | 8–14 digit EAN/UPC barcode |
| `aiMode` | query | ❌ | `auto` (default) · `always` · `never` |
| `x-api-key` | header | ❌ | Your own Gemini/Groq API key |

**Response** `200`:

```json
{
  "success": true,
  "message": "Product scanned successfully",
  "statusCode": 200,
  "data": {
    "barcode": "8901491502055",
    "name": "Maggi 2-Minute Noodles",
    "brand": "Maggi",
    "ingredients": "Wheat flour, salt, vegetable oil...",
    "dietaryStatus": "veg",
    "halalStatus": "doubtful",
    "halalReason": "Contains E471 (mono/diglycerides) — source unknown.",
    "overview": "Maggi 2-Minute Noodles is a processed wheat snack...",
    "aiInsight": "Maggi noodles were first launched in India in 1983...",
    "dataCompleteness": 85,
    "dataSource": "off+ai"
  }
}
```

| Status | Reason |
|---|---|
| `404` | Product not found in OFF |
| `400` | Invalid barcode format |
| `429` | Rate limit exceeded |

---

## ⚙️ Environment Variables

```env
DATABASE_URL=postgresql://user:password@host/db?sslmode=require
AI_MODEL=groq                    # "groq" (default) or "gemini"
GROQ_API_KEY=your_key_here
GEMINI_API_KEY=your_key_here
PORT=3000
NODE_ENV=development
```

---

## 🛠️ Scripts

| Script | Description |
|---|---|
| `bun run dev` | Dev server (hot reload) |
| `bun run start` | Production server |
| `bun run db:push` | Push schema to DB |
| `bun run db:seed` | Seed halal/haram data |
| `bun run db:studio` | Drizzle Studio UI |
| `bun run db:reset` | Drop → Push → Seed |
| `bun run format` | Prettier format |

---

## 📦 Tech Stack

| | |
|---|---|
| **Runtime** | Bun |
| **Framework** | Hono |
| **Database** | PostgreSQL + Drizzle ORM |
| **AI** | Google Gemini (`gemini-2.0-flash`) · Groq (`llama-3.3-70b-versatile`) |
| **Validation** | Zod |
| **Data Source** | Open Food Facts API |
| **Language** | TypeScript |
