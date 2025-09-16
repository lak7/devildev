This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## GitHub App Migration (Bridge Mode)

- Set the following server-only env vars:
  - `GITHUB_APP_ID`
  - `GITHUB_PRIVATE_KEY` (PEM contents)
  - `GITHUB_WEBHOOK_SECRET`
  - Optional: `GITHUB_APP_SLUG`
  - Feature flag: `GITHUB_APP_FLOW_ENABLED=true` to enable App-token paths

- Endpoints updated to accept an installation id when the flag is enabled:
  - `GET /api/github/repos?installationId=<id>`
    - Lists repos via installation token if provided (fallbacks to OAuth if disabled or missing)
  - `POST /api/github/import` with JSON body:
    - `{ "repositoryId": "...", "fullName": "owner/repo", "installationId": <id> }`

- Webhook receiver (GitHub App): `POST /api/webhook/github`
  - Expects `X-Hub-Signature-256`, `X-GitHub-Event`, `X-GitHub-Delivery`

### New user connect behavior

- Set `GITHUB_APP_NEW_USERS=true` and `GITHUB_APP_SLUG=<your_app_slug>` to route new users (without existing OAuth connection) from `/api/github/auth` to the GitHub App installation page.
- Existing users with OAuth stay on the OAuth flow and keep existing behavior.

### Phase 3: Mapping Projects to Installations

- Schema adds `Project.githubInstallationId` (nullable).
- Import API can accept:
  - `installationId` directly, or
  - `projectId` and will use `Project.githubInstallationId` when `GITHUB_APP_FLOW_ENABLED=true`.
- Skeleton bridge: `actions/githubMigrationBridge.ts` with `runGithubMigrationBridge({ dryRun: true })` to enumerate unmapped projects (matching logic TBD).
