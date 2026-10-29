# Robolingo — LINE OA Webchat

An admin webchat for a LINE Official Account: customers message the OA in LINE, and staff read and reply from the browser. Built with Next.js (App Router) + TypeScript, MongoDB, and the LINE Messaging API.

| | |
| --- | --- |
| Webchat | https://webchat.saveurnote.com (protected by Basic Auth — credentials are shared privately with reviewers) |
| LINE OA (add as friend) | https://line.me/R/ti/p/@983qrsvl |

## Features

**Core**
- Conversation list with each customer's LINE display name and profile picture (`getProfile`), last-message preview and unread badge
- Chat history split left (customer) / right (admin) with timestamps and day dividers
- Reply box — Enter to send, Shift+Enter for a new line (IME-safe for Thai input)
- New messages appear without refreshing (polling every 3 s; keeps polling in a background tab while sound is on)

**Messaging**
- Text, stickers, images, files and locations from customers; unsupported types show a placeholder instead of breaking
- Send images: pick, paste or drag-and-drop → preview tray → optional caption → send. Images are resized in the browser (2048 px JPEG + 480 px preview) before upload
- Click an image to open it in a modal
- Links are clickable and the first link gets an Open Graph preview card
- Optimistic sending with retry/discard on failure; messages are delivered in order (a caption never overtakes its image)
- "Read" shown on admin messages once the customer has replied (LINE has no read receipts for OA messages, so it is inferred); opening a chat marks the customer's messages as read in LINE

**Admin experience**
- Search by name, All / Unread views, mark as read
- Right-click → open a chat in a new tab, or pop a chat out into its own window
- New-message sound with an on/off toggle (remembered per browser)
- Responsive layout down to phone width

**Security & robustness**
- Every webhook request is verified with `x-line-signature` (HMAC-SHA256 over the raw body, timing-safe compare)
- Duplicate webhook deliveries are ignored (unique `webhookEventId`)
- Admin pages and APIs behind HTTP Basic Auth; production refuses to start serving without credentials
- Link previews are fetched server-side with an SSRF guard (public IPs only, ports 80/443, every redirect re-checked)
- Uploaded files are checked by magic bytes (JPEG/PNG only); public image URLs use random UUIDs

## Tech stack

| Area | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, Route Handlers, Proxy) · React 19 · TypeScript |
| Database | MongoDB 8 via Mongoose |
| LINE | Messaging API over `fetch` (webhook, profile, push, content, mark-as-read) |
| Styling | CSS Modules, HubSpot-inspired design tokens |
| Realtime | Polling (`usePolling` hook) |
| Tests | `node:test` unit specs · Storybook 10 stories with interaction tests |
| Container | Docker (Next.js standalone image) |

## Architecture

```
 LINE app ──► LINE Platform ──webhook (HTTPS, signed)──► /api/line/webhook ─┐
    ▲                │                                                       │ verify signature
    │                │ GET profile / content                                 │ dedupe, store
    │                ▼                                                       ▼
    │        ┌──────────────────────── Next.js (one container) ────────────────────────┐
    │        │  src/app/api/*  (route handlers = thin controllers)                     │
    │        │      └─► src/server/app/<feature>/use-cases ─► databaseModules ─► Mongo │
    │        │                                              └─► line/line.service      │
    │        │  src/app (React UI) ── polls /api/conversations, /api/messages ─────────┘
    │        └──────────────────────────────────────────────────────────────────────────┘
    │                          │ POST /api/messages, /api/messages/image
    └──── Push API ◄───────────┘ (images are pushed as public /api/media/:id URLs)
```

- **Inbound:** LINE calls the webhook → signature check on the raw body → each message is saved once (`webhookEventId` is unique) → the contact's profile is refreshed at most once a day → `unreadCount` and the last-message preview are updated.
- **Outbound:** the admin sends → the server pushes to LINE first and saves only after LINE accepts, so the history never shows a message the customer didn't get. Images are stored in MongoDB and served at `/api/media/:id` (public, unguessable UUIDs) for LINE to fetch.
- **Realtime:** the UI polls every 3 s. This works on any host (no long-lived connections), which also keeps it compatible with serverless platforms.

### Backend layout

The backend mirrors a NestJS-style layering without DI:

```
src/app/api/                     route handlers (controllers): parse request → call use-case → JSON
src/server/
├── app/<feature>/               conversation · message · line-webhook · media · link-preview
│   ├── use-cases/               one file per endpoint/task
│   ├── dto/                     request validation
│   └── lib/                     feature helpers (document → response view, parsers)
├── databaseModules/<entity>/    collection queries only (contact, message, media)
├── schemas/                     Mongoose schemas
├── line/                        LINE API client + signature verification
├── auth/                        Basic Auth
└── common/                      HttpException, error responses, shared validators
```

More detail: [`src/server/README.md`](src/server/README.md) (backend) and [`src/components/README.md`](src/components/README.md) (frontend).

### Data model

```ts
// contacts — one per LINE user
{ _id: lineUserId, displayName, pictureUrl, lastMessageAt, lastMessage, unreadCount, profileSyncedAt }

// messages
{ _id, lineUserId, direction: "inbound" | "outbound", type: "text" | "image" | "sticker" | "file" | "other",
  text, contentUrl, lineMessageId, webhookEventId /* unique, inbound only */, markAsReadToken, readAt, createdAt }

// media — images sent by the admin
{ _id: uuid, contentType, data, previewContentType, preview, createdAt }
```

## Getting started

### Prerequisites

- Node.js 22+ and npm
- MongoDB (local Docker is the easiest — see below)
- A LINE Messaging API channel (LINE Developers Console)

### 1. Configure environment

```bash
cp .env.example .env.local
```

| Variable | Required | Description |
| --- | --- | --- |
| `LINE_CHANNEL_ACCESS_TOKEN` | yes | Long-lived channel access token (Messaging API tab) |
| `LINE_CHANNEL_SECRET` | yes | Channel secret, used to verify webhook signatures |
| `MONGODB_URI` | yes* | MongoDB connection string, e.g. `mongodb://user:pass@localhost:27017/line-webchat?authSource=admin`. *Set automatically by the Docker Compose files |
| `BASIC_AUTH_USER`, `BASIC_AUTH_PASSWORD` | prod | Admin login. Optional in development; production returns 503 without them |
| `PUBLIC_BASE_URL` | for images | Public HTTPS origin LINE can fetch sent images from (e.g. your domain or a tunnel URL) |
| `MONGO_ROOT_USERNAME`, `MONGO_ROOT_PASSWORD` | Docker | Root user of the bundled MongoDB (dev defaults: `robolingo` / `robolingo-dev`) |
| `PROXY_NETWORK` | Docker prod | Docker network shared with the reverse proxy (default `webchat-proxy`) |
| `PORT` | no | Port for `npm run dev` / `npm start` (default 3000) |

> This project uses `MONGODB_URI` (MongoDB) where the brief mentions `DATABASE_URL`.
> Never commit real credentials — `.env*` files are git-ignored except `.env.example`.

### 2a. Run with Docker (recommended)

Starts MongoDB and the app with hot reload:

```bash
docker compose up --build
```

Open http://localhost (use `WEB_PORT=3000 docker compose up` if port 80 is taken).

### 2b. Run on the host

Start only MongoDB in Docker, then run Next.js directly (faster file watching on macOS):

```bash
docker compose up -d mongodb
npm install
npm run dev
```

With `MONGODB_URI=mongodb://robolingo:robolingo-dev@localhost:27017/line-webchat?authSource=admin` in `.env.local`.

### 3. Receive LINE messages locally

LINE only calls public HTTPS URLs. The dev compose file includes an optional Cloudflare quick tunnel:

```bash
docker compose --profile tunnel up -d
docker compose logs tunnel | grep trycloudflare
```

Use `https://<tunnel-host>/api/line/webhook` as the webhook URL (next section), and set `PUBLIC_BASE_URL` to the tunnel URL to send images. The tunnel host is allowed for Next.js dev resources automatically via `PUBLIC_BASE_URL`.

## LINE setup

**LINE Developers Console → your channel → Messaging API**
1. Issue a long-lived **channel access token**; copy it and the **channel secret** (Basic settings) into your env.
2. **Webhook URL:** `https://<your-domain>/api/line/webhook` → **Verify** (should succeed).
3. Turn on **Use webhook**. Optionally enable **Webhook redelivery** (duplicates are ignored) and **Error statistics aggregation**.

**LINE Official Account Manager → Settings → Response settings**
- **Chat:** off for bot mode, as the brief asks. If you keep it on, the webchat also tells LINE when the admin has read a chat.
- **Webhook:** on
- **Auto-response** and **Greeting message:** off (otherwise LINE replies on its own)

Testers must add the OA as a friend before they can message it.

## Testing

```bash
npm test                 # unit tests: signature verification, OG parser, SSRF guard, linkify, image helpers
npm run storybook        # component explorer with interaction tests (http://localhost:6006)
npx tsc --noEmit         # type check
```

## Production build

`Dockerfile` builds a Next.js standalone image; `docker-compose.prod.yml` runs it with MongoDB (auth enabled, no published port). Serve it behind an HTTPS reverse proxy — LINE only calls HTTPS webhooks and fetches sent images over HTTPS — and allow request bodies of at least 8 MB for image uploads.

## Notes & limitations

- **Read status** on admin messages is inferred from customer replies — the Messaging API exposes no read receipts for OA messages.
- **Images from customers** are proxied from LINE's content API, which only keeps files for a limited time; old images may stop loading.
- **Messages sent from LINE OA Manager** (not through this webchat) are not delivered to the webhook, so they don't appear here.
- **Push messages count toward the OA's monthly message quota.**
