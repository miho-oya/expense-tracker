# 出費管理 — Expense Tracker

A Japanese-language mobile expense tracking app for daily life in Thailand. Upload a screenshot of a receipt from any Thai bank or payment app (SCB, Kasikorn, TrueMoney, Grab, etc.) and AI extracts the amount, date, merchant, and category automatically.

## Architecture

Pnpm monorepo with two artifacts:

- **artifacts/expense-tracker** — Expo (React Native + web) mobile app served at `/`.
  - Local storage only via `AsyncStorage` — no database required.
  - Receipt upload via `expo-image-picker` (library + camera).
  - Generated React Query hook (`useParseReceipt`) calls the backend.
  - Two tabs: 履歴 (history list grouped by day) and 集計 (monthly category breakdown with bars).
  - Modal screen for adding / editing / deleting an expense.
- **artifacts/api-server** — Express API at `/api/*`.
  - `POST /api/receipts/parse` — receives a base64 image, sends it to Gemini 2.5 Flash with a Japanese system prompt + JSON response schema, returns `{ amount, currency, date, merchant, suggestedCategory, rawNote }`.

## Categories (固定7種)

食費 / 交通費 / 買い物 / 娯楽 / 公共料金 / 医療 / その他 — defined in `artifacts/expense-tracker/constants/categories.ts`.

## API spec

Edit `lib/api-spec/openapi.yaml`, then regenerate types/hooks:

```bash
pnpm --filter @workspace/api-spec run codegen
```

Schema names use `ReceiptParseInput` / `ReceiptParseResult` to avoid colliding with orval's operation-derived `ParseReceiptResponse` Zod schema.

## AI integration

Gemini is wired through Replit's AI Integrations proxy (`AI_INTEGRATIONS_GEMINI_BASE_URL` / `AI_INTEGRATIONS_GEMINI_API_KEY`). The lightweight client lives in `lib/integrations-gemini-ai/`. The api-server also lists `@google/genai` as a direct dependency so the bundled output can resolve it at runtime (it is marked external in the esbuild config).

## Theme

Cream background (`#fefdf9`) + deep teal primary (`#0d9488`). Light-only — system dark mode falls back to light.
