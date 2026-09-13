# Snowy ❄️ — Premium Discord Bot Dashboard

> Your Discord server, beautifully under control.

Snowy is a production-quality, premium Discord bot management dashboard with a
snowy winter aesthetic: frosted glass panels, deep navy + icy blue, animated
snowfall, and a polished SaaS experience. It ships with Discord OAuth2, server
management, feature configuration for every bot module, a distributed-roles
permission system, Stripe subscriptions, a Lavalink diagnostics page, and an
admin panel.

## Tech stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** design system with CSS-variable theming
- **Framer Motion** animations, **Lucide** icons
- **NextAuth** — Discord OAuth2 (identify, email, guilds)
- **Prisma** + **PostgreSQL**
- **Stripe** subscriptions (checkout, portal, webhooks)
- **Discord REST API** + a pluggable **bot API** integration layer

## Demo mode (zero-config local review)

Snowy boots into **demo mode** automatically when Discord/auth secrets are
missing. In demo mode:

- Auth uses a mock session (click "Continue with Discord" and you're in).
- Servers, channels, roles, music, and diagnostics use clearly-labeled sample data.
- Config changes persist to an in-memory store so every toggle is interactive.

This lets you run and review the entire UI locally without any credentials.
Once you add real credentials, the same code paths switch to live Discord,
database, Stripe, and bot integrations — nothing is faked in production mode.

## Getting started (local)

Requirements: Node.js 18+ (tested on Node 24), npm.

```bash
# 1. Install dependencies
npm install

# 2. (optional) copy env template — not required for demo mode
cp .env.example .env

# 3. Run the dev server
npm run dev
```

Open http://localhost:3000.

> Windows/PowerShell note: if `npm` is blocked by execution policy, use
> `npm.cmd` (e.g. `npm.cmd install`, `npm.cmd run dev`) or run in Command Prompt.

## Enabling real integrations

Fill in `.env` (see `.env.example`):

### Discord OAuth2
1. Create an app at the Discord Developer Portal.
2. Add redirect URI `http://localhost:3000/api/auth/callback/discord`.
3. Set `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, `DISCORD_BOT_TOKEN`.
4. Set `NEXTAUTH_SECRET` (`openssl rand -base64 32`).

### Database (Prisma + PostgreSQL)
```bash
# Set DATABASE_URL in .env, then:
npm run db:push      # create tables
npm run db:seed      # seed plan configs
npm run db:studio    # inspect data (optional)
```

### Stripe
1. Set `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
2. For webhooks: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
   and set `STRIPE_WEBHOOK_SECRET`.

### Bot integration
Point `BOT_API_URL` + `BOT_API_SECRET` at your discord.js bot's internal HTTP
API. The dashboard calls it via `src/lib/bot-api.ts`. Until then, actions are
recorded and clearly marked as **pending integration** — no fake success.

Expected bot endpoints (bearer-authenticated with `BOT_API_SECRET`):

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/guilds/:id/status` | `{ online, latencyMs }` |
| GET/POST | `/guilds/:id/music` `/guilds/:id/music/:action` | player state & controls |
| PUT | `/guilds/:id/config/:module` | apply module configuration |
| POST | `/guilds/:id/moderation` | perform a moderation action |
| GET | `/lavalink/status` | node health for diagnostics |

## Admin panel

Add your Discord user id to `ADMIN_DISCORD_IDS` (comma-separated) to access
`/admin`. In demo mode every user is treated as an admin for review.

## Project structure

```
src/
  app/
    (marketing)/        Landing, pricing, privacy, terms
    login/              Discord login
    servers/            Server selector
    dashboard/[guildId] Dashboard shell + all feature module pages
    admin/              Platform admin panel
    profile/            User profile
    api/                Auth, guilds, per-module config, moderation, music,
                        giveaways, roles, billing (Stripe), webhooks, lavalink
  components/
    ui/                 Button, Card, Badge, Input, Switch, Dialog, Toast, ...
    dashboard/          Shell, sidebar, topbar, config-page, module-gate, ...
    marketing/          Hero preview, feature grid, pricing cards
  lib/
    modules.ts          Source of truth: bot commands → dashboard modules
    plans.ts            Subscription tiers + feature limits
    permissions.ts      Distributed roles model
    authz.ts            Server-side authorization + permission checks
    discord.ts          Discord REST helpers
    bot-api.ts          Bot integration client
    config-service.ts   Module config persistence (DB or in-memory)
    stripe.ts, env.ts, db.ts, subscription.ts, demo.ts, utils.ts
prisma/schema.prisma    Full data model
```

## Security

- OAuth2 authorization-code flow; access token kept server-side in the JWT.
- **All guild access and permissions are validated server-side** — the frontend
  is never trusted. Non-owners cannot escalate privileges.
- Stripe webhooks verify signatures. Secrets stay in environment variables.
- Dangerous actions (bans, disabling antinuke, etc.) require explicit confirmation.

## Production deployment

1. Provision PostgreSQL and set `DATABASE_URL`.
2. Set all secrets from `.env.example` in your host (Vercel, Fly, Railway, etc.).
3. Set `NEXTAUTH_URL` to your production URL and add the matching Discord
   redirect URI.
4. Run migrations: `npx prisma migrate deploy`.
5. Configure the Stripe webhook endpoint `https://yourdomain/api/webhooks/stripe`.
6. `npm run build && npm run start`.

## License

Provided as a starter for your Snowy bot. Replace placeholder legal copy before
launch.
