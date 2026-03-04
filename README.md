# 🥦 FoodWiser — Backend API

> **Scan any food barcode. Get full ingredients, calorie charts, nutrition data, halal status, and dietary flags — instantly.**

FoodWiser-BE is a high-performance REST API built with **Bun + Hono** that fetches food product data via the **Open Food Facts (OFF) API**, enriches incomplete data using **AI (Google Gemini / Groq)**, and returns a complete nutrition + ingredient profile within milliseconds. Results are cached in a **PostgreSQL** database with **Drizzle ORM** so repeated scans are near-instant.

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🔍 **Barcode Scan** | Single endpoint to get full product data from any valid barcode |
| 🌐 **Open Food Facts** | Primary data source — free, global food product database |
| 🤖 **AI Enrichment** | Gemini / Groq fills missing fields, translates ingredients, detects halal status |
| 🕌 **Halal Classification** | Cross-references ingredients + additives with a seeded halal/haram DB |
| 🥗 **Dietary Flags** | Detects vegan, vegetarian, palm-oil status from ingredient analysis |
| 📊 **Full Nutrition Chart** | Nutri-Score, NOVA group, Eco-Score, nutrient levels, full nutriments |
| ⚡ **DB Caching** | Products saved to PostgreSQL — second scan is a single DB lookup |
| 🛡️ **Rate Limiting** | Built-in rate limiter middleware to prevent abuse |
| 🔑 **BYOK Support** | Pass your own AI API key via `x-api-key` header to override the server key |

---

## 🏗️ Architecture & Data Flow

```
Client (Frontend / Mobile)
        │
        │  GET /api/v1/products/scan/:barcode
        │  Header: x-api-key (optional, BYOK)
        ▼
┌─────────────────────────────────────────┐
│           Hono HTTP Server              │
│  Middlewares: CORS · Logger · RateLimiter│
└───────────────┬─────────────────────────┘
                │
                ▼
       ProductController.scanProduct
                │
                ▼
       ProductService.getProductData
                │
       ┌────────┴────────┐
       │                 │
  [Cache Hit]       [Cache Miss]
  Return from DB         │
                         ▼
              ① Fetch from Open Food Facts
              https://world.openfoodfacts.org/api/v2/product/{barcode}.json
                         │
                         ▼
              ② Extract & normalise OFF fields
              (name, brand, ingredients, additives,
               allergens, nutrition, scores, labels…)
                         │
                         ▼
              ③ Check data completeness (0–100%)
              Identify: missingCritical, needsTranslation
                         │
                         ▼
              ④ Derive dietary status
              (vegan / vegetarian / palm-oil / non-vegan)
                         │
                         ▼
              ⑤ Classify halal status
              DB lookup → ingredients scan → additive check
              Result: halal | haram | doubtful | unknown
                         │
                    [Needs AI?]
               completeness < 60%  OR
               missingCritical > 0 OR
               halalStatus = unknown
                    /        \
                  YES         NO
                   │           │
                   ▼           │
        ⑥ AI Enrichment        │
        (Gemini or Groq)       │
        - Fill missing fields  │
        - Translate ingredients│
        - Detect halal status  │
        - Generate overview    │
                   │           │
                   └────┬──────┘
                        │
                        ▼
              ⑦ Merge all data →
              Save to PostgreSQL (Drizzle)
                        │
                        ▼
              Return JSON response to client
```

**Data Source Labels:**

| Label | Meaning |
|---|---|
| `off-only` | Data was complete enough from OFF — no AI needed |
| `off+ai` | OFF data had some gaps, AI filled the missing fields |
| `ai-heavy` | OFF data was very incomplete (<40%), AI did most of the work |

---

## 🌐 Open Food Facts (OFF) API

FoodWiser uses the **[Open Food Facts API v2](https://openfoodfacts.github.io/openfoodfacts-api/)** as its primary data source.

- **Endpoint used:** `GET https://world.openfoodfacts.org/api/v2/product/{barcode}.json`
- **Authentication:** None required (public API)
- **User-Agent:** `FoodWiser - Bun/Hono - Version 1.0` *(required by OFF guidelines)*
- **Response fields extracted:**

| OFF Field | Maps To |
|---|---|
| `product_name` | `name` |
| `brands` | `brand` |
| `quantity` | `quantity` |
| `image_front_url` | `imageUrl` |
| `ingredients_text` | `ingredients` |
| `ingredients_analysis_tags` | `ingredientsAnalysis` |
| `allergens` | `allergens` |
| `additives_tags` + `additives_original_tags` | `additives[]` |
| `nutriscore_grade` | `nutriScore` |
| `ecoscore_grade` | `ecoScore` |
| `nova_group` | `novaGroup` |
| `nutrient_levels` | `nutrientLevels` |
| `nutriments` | `nutritionInfo` |
| `countries` | `countryOfOrigin` |
| `packaging` | `packaging` |
| `labels` | `labels[]` |

> OFF is free, open-source, and community-driven. It contains **3M+ products** globally. If a product is not found, a `404` is returned to the client.

---

## 🤖 AI Enrichment

When OFF data is incomplete, the server automatically enriches it using an AI model.

### Supported Models

| Model | Provider | Env Key | Default |
|---|---|---|---|
| `gemini` | Google Gemini | `GEMINI_API_KEY` | ✅ Yes |
| `groq` | Groq (Llama) | `GROQ_API_KEY` | No |

Set `AI_MODEL=gemini` or `AI_MODEL=groq` in your `.env` to switch models.

### What AI Enriches

- Missing `ingredients` (e.g., products only found on local databases)
- Non-English ingredient lists → translated to English
- `allergens` if not listed by OFF
- `additives` array if missing
- `halalStatus` when it can't be determined from the DB
- `overview` — a human-readable summary of the product

### BYOK (Bring Your Own Key)

Clients may pass their own AI key via the `x-api-key` HTTP header. The server uses the **client key first**, falling back to the server's environment key.

---

## 📡 API Reference

### Base URL
```
http://localhost:3000/api/v1
```

---

### `GET /products/scan/:barcode`

Scan a product by barcode. Returns full product nutrition and ingredient data.

**Path Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `barcode` | `string` | ✅ | EAN-13, UPC-A, or any valid product barcode |

**Headers:**

| Header | Required | Description |
|---|---|---|
| `x-api-key` | ❌ Optional | Your own Gemini or Groq API key (BYOK) |

**Example Request:**
```bash
curl -X GET http://localhost:3000/api/v1/products/scan/8901491502055
```

**Example Response:**
```json
{
  "success": true,
  "message": "Product scanned successfully",
  "statusCode": 200,
  "data": {
    "barcode": "8901491502055",
    "name": "Maggi 2-Minute Noodles",
    "brand": "Maggi",
    "quantity": "70g",
    "imageUrl": "https://images.openfoodfacts.org/...",
    "ingredients": "Wheat flour, salt, vegetable oil...",
    "ingredientsAnalysis": {
      "vegan": "yes",
      "vegetarian": "yes",
      "palmOil": "maybe",
      "nonVegan": "no"
    },
    "allergens": "wheat, gluten",
    "additives": [
      { "code": "E621", "name": "Monosodium glutamate" }
    ],
    "nutriScore": "d",
    "ecoScore": "c",
    "novaGroup": "4",
    "nutrientLevels": {
      "fat": "moderate",
      "salt": "high",
      "sugars": "low",
      "saturated-fat": "low"
    },
    "nutritionInfo": {
      "energy_kcal": 320,
      "proteins": 8.2,
      "carbohydrates": 55.1,
      "fat": 7.4,
      "fiber": 2.1,
      "sodium": 1.2,
      "sugars": 1.8
    },
    "dietaryStatus": "vegetarian",
    "halalStatus": "doubtful",
    "overview": "Maggi 2-Minute Noodles is a processed wheat snack...",
    "countryOfOrigin": "India",
    "packaging": "plastic",
    "labels": ["vegetarian"],
    "dataCompleteness": 85,
    "dataSource": "off-only",
    "lastEnriched": null,
    "createdAt": "2025-03-04T15:00:00Z"
  }
}
```

**Error Responses:**

| Status | Reason |
|---|---|
| `404` | Product not found in Open Food Facts database |
| `400` | Invalid barcode format |
| `429` | Rate limit exceeded |
| `500` | Internal server error |

---

## 🗄️ Database Schema

**Table: `products`** — Cached product data

| Column | Type | Description |
|---|---|---|
| `barcode` | `varchar` PK | Primary key |
| `name` | `text` | Product name |
| `brand` | `varchar` | Brand name |
| `quantity` | `varchar` | Package size (e.g. "200g") |
| `image_url` | `text` | Product image URL |
| `ingredients` | `text` | Full ingredients list |
| `ingredients_analysis` | `jsonb` | `{vegan, vegetarian, palmOil, nonVegan}` |
| `allergens` | `text` | Allergen list |
| `additives` | `jsonb` | `[{code, name}]` array |
| `nutri_score` | `varchar` | A–E grade |
| `eco_score` | `varchar` | A–E grade |
| `nova_group` | `varchar` | 1–4 processing level |
| `nutrient_levels` | `jsonb` | `{fat, salt, sugars, saturated-fat}` |
| `nutrition_info` | `jsonb` | Full nutriments (kcal, protein, carbs…) |
| `dietary_status` | `varchar` | `vegan / vegetarian / non-vegetarian` |
| `halal_status` | `varchar` | `halal / haram / doubtful / unknown` |
| `overview` | `text` | AI-generated or template product summary |
| `country_of_origin` | `varchar` | Country |
| `packaging` | `varchar` | Packaging type |
| `labels` | `jsonb` | Certifications (e.g. `["organic", "fair-trade"]`) |
| `data_completeness` | `integer` | Score 0–100% |
| `data_source` | `varchar` | `off-only / off+ai / ai-heavy` |
| `last_enriched` | `timestamp` | When AI last processed this product |
| `created_at` | `timestamp` | Record creation time |
| `updated_at` | `timestamp` | Last updated time |

**Indexes:** `brand`, `dietary_status`, `halal_status`, `nova_group`

**Seeded Tables:**

| Table | Purpose |
|---|---|
| `additive_classifications` | E-number halal/haram database |
| `haram_keywords` | Ingredient keyword → halal classification |

---

## ⚙️ Environment Variables

Create a `.env` file in the project root:

```env
# Server
PORT=3000
NODE_ENV=development

# Database (PostgreSQL)
DATABASE_URL=postgresql://user:password@localhost:5432/foodwiser

# AI Model Selection
AI_MODEL=gemini          # "gemini" or "groq"

# AI API Keys
GEMINI_API_KEY=your_gemini_api_key_here
GROQ_API_KEY=your_groq_api_key_here   # optional if using gemini
```

---

## 🚀 Getting Started

### Prerequisites

- [Bun](https://bun.sh) v1.3.6+
- PostgreSQL database

### Installation

```bash
# Clone the repo
git clone https://github.com/your-org/foodwiser-be.git
cd foodwiser-be

# Install dependencies
bun install

# Set up environment variables
cp .env.example .env
# Edit .env with your database URL and AI keys
```

### Database Setup

```bash
# Push schema to database
bun run db:push

# Seed halal/haram classification data
bun run db:seed

# (Optional) Open Drizzle Studio to browse the DB
bun run db:studio
```

### Running the Server

```bash
# Development (hot reload)
bun run dev

# Production
bun run start
```

Server will be live at: `http://localhost:3000`

---

## 🛠️ NPM Scripts

| Script | Description |
|---|---|
| `bun run dev` | Start server with hot reload |
| `bun run start` | Start server in production mode |
| `bun run db:push` | Push Drizzle schema to database |
| `bun run db:generate` | Generate migration files |
| `bun run db:seed` | Seed halal/haram classification data |
| `bun run db:studio` | Open Drizzle Studio UI |
| `bun run db:drop` | Drop all tables |
| `bun run db:reset` | Drop → Push → Seed (full reset) |
| `bun run format` | Format source files with Prettier |
| `bun run format:check` | Check formatting without writing |

---

## 📦 Tech Stack

| Layer | Technology |
|---|---|
| **Runtime** | [Bun](https://bun.sh) v1.3.6 |
| **Framework** | [Hono](https://hono.dev) v4 |
| **Database** | PostgreSQL + [Drizzle ORM](https://orm.drizzle.team) |
| **AI — Gemini** | [@google/generative-ai](https://ai.google.dev) |
| **AI — Groq** | [groq-sdk](https://console.groq.com) |
| **Validation** | [Zod](https://zod.dev) |
| **Rate Limiting** | hono-rate-limiter |
| **External Data** | [Open Food Facts API](https://openfoodfacts.github.io/openfoodfacts-api/) |
| **Language** | TypeScript 5 |

---

## 📁 Project Structure

```
src/
├── index.ts                  # App entry point — Hono server setup
├── config/
│   └── env.ts                # Typed environment variable loader
├── routes/
│   ├── index.ts              # Route aggregator
│   └── product.routes.ts     # /products/scan/:barcode
├── controller/
│   └── product.controller.ts # Request parsing, response shaping
├── services/
│   └── product.service.ts    # Core business logic & orchestration
├── db/
│   ├── connection.ts         # Drizzle + postgres connection
│   ├── schema/
│   │   └── product.ts        # Table definitions
│   ├── migrations/           # SQL migration scripts
│   └── seeds/
│       └── seedHalalData.ts  # Seed halal/haram tables
├── middleware/
│   ├── logger.middleware.ts
│   ├── errorHandler.middleware.ts
│   └── rateLimiter.middleware.ts
├── utils/
│   ├── logger.util.ts
│   ├── response.util.ts
│   ├── tryCatch.util.ts
│   └── helper/
│       ├── fetchOFFData.ts         # Call OFF API
│       ├── extractOFFFields.ts     # Normalise OFF response
│       ├── checkDataCompleteness.ts # Score completeness 0–100%
│       ├── deriveDietaryStatus.ts  # Vegan/vegetarian logic
│       ├── classifyHalalStatus.ts  # DB-backed halal check
│       ├── selectiveEnrichment.ts  # Trigger AI enrichment
│       ├── generateBasicOverview.ts # Fallback template overview
│       └── models/
│           ├── index.ts            # Model registry
│           ├── types.ts            # AIEnricher interface
│           ├── getAPIKey.ts        # BYOK key resolution
│           ├── prompt.ts           # AI prompt template
│           ├── enhanceWithGemini.ts
│           └── enhanceWithGroq.ts
└── validations/
    └── product.validations.ts  # Zod schema for barcode + api key
```

---

## 🔒 Rate Limiting

The API employs rate limiting middleware (`hono-rate-limiter`) to protect against abuse. Configure limits in `src/middleware/rateLimiter.middleware.ts`.

---

## 📄 License

This project was bootstrapped with `bun init` using [Bun](https://bun.com) v1.3.6.
