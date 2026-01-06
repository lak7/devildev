<p align="center">
  <a href="https://github.com/lak7/devildev">
    <picture>
      <source srcset="public/full-logo-dark.svg" media="(prefers-color-scheme: dark)">
      <source srcset="public/full-logo-light.svg" media="(prefers-color-scheme: light)">
      <img src="public/full-logo-light.svg" alt="DevilDev logo" height="100">
    </picture>
  </a>
  
</p>

<p align="center">Spec driven lovable alternative.</p>

<p align="center">
  <img src="public/devildev-architecture.png" alt="DevilDev Architecture Preview" width="90%">
</p>

## Table of Contents
- [DevilDev](#DevilDev)
- [Why DevilDev](#why-devildev)
- [Getting Started](#getting-started)
- [Tech Stack](#tech-stack)
- [Local Setup](#local-setup)
- [License](#license)

## DevilDev
DevilDev is a Next.js platform for generating, reviewing, and iterating on software architecture with integrated authentication, repository imports, and background job processing.

## Why DevilDev
- Clerk authentication with webhook-driven user provisioning
- GitHub OAuth/App integration for imports and installation events
- Architecture generation and reverse architecture via Inngest workers
- Vectorized document retrieval backed by Supabase
- Subscription handling with Dodo Payments webhooks
- PostgreSQL persistence managed through Prisma

## Getting Started
Use the Local Setup instructions below to configure your environment, webhooks, and required third-party keys before running the app locally.

## Tech Stack
- Next.js (App Router), React, TypeScript
- PostgreSQL + Prisma
- Clerk for auth and webhooks
- GitHub OAuth/App integrations
- Supabase for vector store
- Inngest for background jobs
- Dodo Payments for subscriptions

## Local Setup

### Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher recommended)
- **npm**, **yarn**, **pnpm**, or **bun** package manager
- **PostgreSQL** database (local or cloud-hosted)
- **Git** for version control

Choose your setup path:

---

### Option 1: Local Development Setup

### Step 1: Clone and Install Dependencies

```bash
# Clone the repository (if not already done)
git clone <repository-url>
cd v1

# Install dependencies
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

### Step 2: Set Up Public URL for Webhooks (CRITICAL)

**⚠️ IMPORTANT**: Webhooks are **required** for core functionality. Services need to send HTTP requests to your local server, which requires a public URL.

#### Option A: Using ngrok (Recommended)

1. Sign up for a free account at [ngrok](https://ngrok.com/)
2. Install ngrok:
   ```bash
   # macOS
   brew install ngrok
   
   # Or download from https://ngrok.com/download
   ```
3. Authenticate ngrok:
   ```bash
   ngrok config add-authtoken YOUR_AUTH_TOKEN
   ```
4. Start ngrok tunnel (in a separate terminal, keep it running):
   ```bash
   ngrok http 3000
   ```
5. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`) - you'll use this for webhook endpoints

#### Option B: Using Other Tunneling Services

- [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)
- [localtunnel](https://localtunnel.github.io/www/)
- [serveo](https://serveo.net/)

**Note**: The public URL will change each time you restart ngrok (unless you have a paid plan). Update webhook URLs in service dashboards when it changes.

### Step 3: Set Up Services

#### Clerk Authentication

**⚠️ CRITICAL**: Clerk webhooks are required to create users in your database when they sign up. Without a working webhook, user accounts won't be created in the database.

1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Create a new application (use **Development** mode)
3. Copy your **Publishable Key** and **Secret Key** (they start with `pk_test_` and `sk_test_`)
4. Set up webhook endpoint:
   - Go to **Webhooks** in Clerk Dashboard
   - Click **Add Endpoint**
   - Enter your ngrok URL: `https://your-ngrok-url.ngrok.io/api/webhook/clerk`
   - Select events: `user.created`, `user.updated`, `user.deleted`
   - Copy the **Signing Secret** to `CLERK_WEBHOOK_SECRET` in `.env.local`
   - **Important**: Update this URL whenever your ngrok URL changes

#### GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **"New OAuth App"**
3. Fill in:
   - **Application name**: DevilDev (Local)
   - **Homepage URL**: `https://your-ngrok-url.ngrok.io` (use your ngrok URL)
   - **Authorization callback URL**: `https://your-ngrok-url.ngrok.io/api/github/callback`
4. Copy **Client ID** and **Client Secret** to `.env.local`

#### GitHub Webhook (If using GitHub App)

**⚠️ CRITICAL**: If you're using GitHub App features, webhooks are required to receive installation events.

1. In your GitHub App settings, go to **Webhooks**
2. Set webhook URL: `https://your-ngrok-url.ngrok.io/api/webhook/github`
3. Set webhook secret to `GITHUB_WEBHOOK_SECRET` in `.env.local`
4. Select events: `installation`, `installation_repositories`

#### Supabase Setup

1. Create a project at [Supabase](https://supabase.com/)
2. Go to **Settings** → **API**
3. Copy **Project URL** to `SUPABASE_URL`
4. Copy **anon/public key** to `SUPABASE_KEY`
5. Set up the vector store table (see Supabase Vector documentation)

#### Database Setup

1. Set up a PostgreSQL database:
   - **Option A**: Local PostgreSQL installation
   - **Option B**: Cloud service like [Neon](https://neon.tech/), [Supabase](https://supabase.com/), or [Railway](https://railway.app/)
2. Update `DATABASE_URL` in `.env.local` with your connection string

#### Dodo Payments Webhook

**⚠️ CRITICAL**: Dodo webhooks are required to update subscription status when payments are processed.

1. In your Dodo Payments dashboard, go to **Webhooks**
2. Add webhook endpoint: `https://your-ngrok-url.ngrok.io/api/webhook/dodo`
3. Copy the webhook secret to `DODO_WEBHOOK_KEY` in `.env.local`
4. **Important**: Update this URL whenever your ngrok URL changes

#### Inngest Setup (Required)

Inngest is **required** for core functionality including architecture generation and reverse architecture generation.

1. Sign up for a free account at [Inngest](https://www.inngest.com/)
2. Create a new app in the Inngest dashboard
3. For local development, set the app URL to your ngrok URL: `https://your-ngrok-url.ngrok.io/api/inngest`
4. Copy your **Event Key** and **Signing Key** from the dashboard
5. Add them to `.env.local` as `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY`
6. Start Inngest Dev Server in a separate terminal:
   ```bash
   npx inngest-cli@latest dev
   ```
   This handles function execution locally. Keep this running while developing.

### Step 4: Set Up Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Database Configuration (Required)
DATABASE_URL="postgresql://user:password@localhost:5432/devildev?schema=public"

# Clerk Authentication (Required)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# OpenAI API (Required)
OPENAI_API_KEY=sk-...

# Base URL (Required for local - use your ngrok URL)
NEXT_PUBLIC_BASE_URL=https://your-ngrok-url.ngrok.io

# GitHub OAuth Integration (Required for GitHub features)
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Supabase Vector Store (Required for document retrieval)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_anon_key

# Dodo Payments (Required for subscription features)
NEXT_PUBLIC_DODO_PAYMENT_LINK=https://pay.dodopayments.com/...
DODO_WEBHOOK_KEY=your_dodo_webhook_secret
NEXT_PUBLIC_DODO_PAYMENT_CANCEL_LINK=https://your-ngrok-url.ngrok.io/cancel

# Inngest (Required - for background job processing)
INNGEST_EVENT_KEY=your_inngest_event_key
INNGEST_SIGNING_KEY=your_inngest_signing_key

# GitHub App Integration (Optional - for GitHub App migration)
GITHUB_APP_ID=your_github_app_id
GITHUB_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
GITHUB_WEBHOOK_SECRET=your_github_webhook_secret
GITHUB_APP_SLUG=your_app_slug
GITHUB_APP_FLOW_ENABLED=false
GITHUB_APP_NEW_USERS=false

# Optional: E2B (for code interpreter sandbox)
E2B_API_KEY=your_e2b_api_key

# Optional: GitHub App Logging
GITHUB_APP_LOGGING=false
```

### Step 4: Database Migration

Generate Prisma Client and run migrations:

```bash
# Generate Prisma Client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# (Optional) View database in Prisma Studio
npx prisma studio
```

### Step 6: Run the Development Server

**Important**: Make sure you have these running:

1. **ngrok** (Terminal 1) - provides public URL for webhooks
2. **Inngest Dev Server** (Terminal 2) - handles background jobs
3. **Next.js dev server** (Terminal 3) - your application

```bash
# Terminal 1: Start ngrok (keep running)
ngrok http 3000

# Terminal 2: Start Inngest Dev Server (keep running)
npx inngest-cli@latest dev

# Terminal 3: Start Next.js dev server
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

**Important**: 
- Use the ngrok HTTPS URL (not localhost) when accessing the app
- Example: `https://abc123.ngrok.io` instead of `http://localhost:3000`
- Update webhook URLs in service dashboards if your ngrok URL changes

### Step 7: Verify Local Setup

1. **Authentication**: Sign up/Sign in should work via Clerk
2. **GitHub Integration**: Try connecting GitHub from the settings page
3. **Database**: Verify tables are created in your PostgreSQL database
4. **Inngest**: Check that Inngest Dev Server is running and receiving events
5. **Architecture Generation**: Test creating a new architecture (this requires Inngest)

---

## Troubleshooting

### Local Development Issues

- **Webhooks Not Working**: 
  - **CRITICAL**: Ensure ngrok is running and you're using the ngrok HTTPS URL (not localhost)
  - Verify webhook URLs in service dashboards match your current ngrok URL
  - Check that webhook endpoints are accessible: `https://your-ngrok-url.ngrok.io/api/webhook/clerk`
  - Test webhook endpoints using the service's webhook testing tools
  - **Clerk**: Without working webhook, users won't be created in database when signing up
  - **Dodo**: Without working webhook, subscription status won't update after payments
  - **GitHub**: Without working webhook, GitHub App installation events won't be received
- **Database Connection Issues**: Verify `DATABASE_URL` is correct and database is running
- **Clerk Errors**: 
  - Ensure webhook secret matches in `.env.local` and Clerk dashboard
  - Verify webhook URL in Clerk dashboard uses your ngrok URL
  - Check that `user.created` event is enabled in webhook settings
- **GitHub OAuth**: Verify callback URL matches exactly: `https://your-ngrok-url.ngrok.io/api/github/callback`
- **Prisma Errors**: Run `npx prisma generate` after schema changes
- **Inngest Not Working**: 
  - Ensure Inngest Dev Server is running (`npx inngest-cli@latest dev`)
  - Verify `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY` are set correctly
  - Check that Inngest app URL in dashboard matches your ngrok URL
  - Architecture generation features will not work without Inngest
- **ngrok URL Changed**: 
  - Update all webhook URLs in service dashboards (Clerk, Dodo, GitHub, Inngest)
  - Update `NEXT_PUBLIC_BASE_URL` in `.env.local`
  - Restart your Next.js dev server after updating environment variables

## License
Licensed under the Apache License 2.0. See `LICENSE` for details.