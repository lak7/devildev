---
# PHASE 1: Phase 1: scoping and minimal plumbing to ensure the app and security baseline are ready

**STATUS:** NOT_STARTED

---

## 🎯 Phase Objective
Implement Phase 1: prepare scoping, security baseline, and minimal plumbing required to support GitHub App-based authentication. Concretely: create the GitHub App in a staging org, introduce the GitHubAppInstallation DB model + webhook dedupe model, add server-only secrets to staging, implement a small prototype of the GitHub App auth service (JWT signing + installation token exchange), deploy to staging, and validate installation token issuance. This phase must not change production behavior or remove existing OAuth flows — it sets up infrastructure only.

## 🔄 Current State vs. Target State
**Current State:**
- Next.js 15 App Router app using Clerk, Prisma/Postgres, LangChain/OpenAI streaming SSE, and existing GitHub OAuth user token flow at src/app/api/github/*.
- No GitHub App model in Prisma, no GitHub App auth service, and no GitHub webhook handler for app installation events.
- Secrets for GitHub App not provisioned.

**Target State after Phase 1:**
- GitHub App created in staging org with private key & webhook secret.
- Staging environment populated with server-only secrets: GITHUB_APP_ID, GITHUB_APP_SLUG, GITHUB_PRIVATE_KEY, GITHUB_WEBHOOK_SECRET.
- Prisma schema updated with GitHubAppInstallation and WebhookEvent models; migration created/applied in staging.
- Prototype server-only auth service at src/actions/githubAppAuth.ts that can:
  - create app JWT (signed with GITHUB_PRIVATE_KEY)
  - request installation access token for a test installation ID
  - expose minimal helper: getAppJWT(), getInstallationToken(installationId)
- Minimal webhook route exists (skeleton) at src/app/api/webhook/github/route.ts (created) and middleware configured to allow webhook path.
- Basic unit/integration tests for auth prototype; deployment to staging validated (token issuance works).
- Documentation updated with developer setup steps for local/staging.

**Impact Scope:**
- Files touched: prisma/schema.prisma (new models), src/actions/githubAppAuth.ts (new), src/app/api/webhook/github/route.ts (new skeleton), src/middleware.ts (allowlist update), src/app/api/github/callback/route.ts (add deprecation note / no behavior change), docs and CI config; tests added under tests/.
- No user-facing changes in production; OAuth flow remains intact for the grace period.

## 🎁 Key Deliverables
- Minimal, working GitHub App created in staging org (app id, slug, private key, webhook secret).
- Prisma schema update + migration adding GitHubAppInstallation and WebhookEvent models.
- Prototype auth service: src/actions/githubAppAuth.ts (JWT generation + installation token retrieval + caching stub).
- Webhook skeleton: src/app/api/webhook/github/route.ts with HMAC verification stub and idempotency handling plan.
- Staging deployment with secrets provisioned and successful installation token issuance validated.
- Developer documentation: docs/github-app-migration.md (setup & Phase 1 runbook).

## 📋 Prerequisites
**Must be completed before starting:**
- [ ] Existing project backup created and stored safely (DB dump + repo snapshot)
- [ ] Current project state documented and validated (README, infra notes)
- [ ] Development environment configured with existing project (local builds run)
- [ ] All existing dependencies verified and up-to-date (npm ci / yarn)
- [ ] Existing functionality baseline tests executed and passing (unit & integration smoke)

**⚠️ CRITICAL: DO NOT START THIS PHASE WITHOUT HUMAN APPROVAL OF PREPARATION CHECKS ABOVE ⚠️**

## 🔄 Human Review Checkpoints

### Pre-Phase Validation
- [ ] Confirm DB backup exists and is retrievable
- [ ] Confirm staging environment accessible for secret provisioning
- [ ] Confirm permission to create GitHub App in staging org (owner/admin)
- [ ] Confirm no changes to production OAuth behavior will be deployed in this phase

### Mid-Phase Review (after core artifacts exist)
- [ ] Validate Prisma schema changes (review schema diff)
- [ ] Validate githubAppAuth prototype: JWT creation and installation token retrieval for a test installation
- [ ] Confirm webhook route is reachable from staging and not protected by Clerk middleware
- [ ] Developer to run provided tests and attach logs in HUMAN_REVIEW.md

### End-Phase Review (MANDATORY)
- [ ] Human must run step-by-step validation from docs/github-app-migration.md and confirm:
  - [ ] Installation token returned for a test installationId
  - [ ] Webhook skeleton receives a signed event (simulated) and logs dedupe attempt
  - [ ] Prisma migration applied successfully in staging and GitHubAppInstallation table exists
  - [ ] No regressions in existing GitHub OAuth flows observed (quick smoke test)
  - [ ] Any issues recorded in HUMAN_REVIEW.md
  - [ ] Final approval provided in HUMAN_REVIEW.md to proceed to Phase 2

## ✅ Implementation Tasks

Each task is short and atomic — target 15–30 minutes per task where possible.

### Existing Code Modification Tasks:
- [ ] **MODIFY:** src/app/api/github/callback/route.ts — Add a non-breaking deprecation header/log message and a comment pointing to migration docs (no functional change). Purpose: signal that OAuth callback exists but now deprecated for future phases. Keep behavior unchanged.
- [ ] **MODIFY:** src/middleware.ts — Ensure the GitHub webhook path (/api/webhook/github) is allow-listed and not behind Clerk auth. Add unit test or runtime assertion in middleware to verify allowlist. (exact location: src/middleware.ts)
- [ ] **MODIFY:** package.json / CI config — Add check to ensure required env vars are present in staging CI before deployment (GITHUB_APP_ID, GITHUB_PRIVATE_KEY, GITHUB_WEBHOOK_SECRET). Do not change production pipeline behavior; only gating for staging.

### New Feature Development Tasks:
- [ ] **CREATE:** prisma/schema.prisma — Add model GitHubAppInstallation and model WebhookEvent as specified:
  - GitHubAppInstallation { id Int @id; installationId BigInt @unique; accountLogin String; accountId BigInt; accountType String; repositories Json?; permissions Json?; repositorySelection String?; lastSyncedAt DateTime?; createdAt DateTime @default(now()); updatedAt DateTime @updatedAt }
  - WebhookEvent { id Int @id; eventId String @unique; source String; createdAt DateTime @default(now()) }
  (Only add models; do not remove existing models.)
- [ ] **CREATE:** Run local migration and codegen:
  - Command: npx prisma generate
  - Command: npx prisma migrate dev --name add_github_app_installation
  - Verify generated client and model types are available.
- [ ] **CREATE:** src/actions/githubAppAuth.ts — Prototype auth service (server-only) with functions:
  - getAppJWT(): sign JWT using GITHUB_PRIVATE_KEY, GITHUB_APP_ID (use @octokit/auth-app or direct jose signing)
  - getInstallationToken(installationId: number | bigint): POST /app/installations/{id}/access_tokens using app JWT; parse token and expires_at; return { token, expiresAt }
  - minimal in-memory cache (Map) storing {token, expiresAt} for given installationId (TTL-based). Document that cache is temporary and Redis will be added in Phase 2.
  - DO NOT persist tokens in DB.
  - File path: src/actions/githubAppAuth.ts (TS/JS consistent with repo).
- [ ] **CREATE:** tests/actions/githubAppAuth.test.ts — Unit test file using mocked @octokit/rest calls (nock or mocked fetch) to validate:
  - getAppJWT returns a JWT-like string
  - getInstallationToken calls the correct REST path and returns token + expiresAt
  - token caching behavior (cache hit returns same token until expiry)
- [ ] **CREATE:** src/app/api/webhook/github/route.ts — Minimal webhook route skeleton:
  - Verify X-Hub-Signature-256 (HMAC-SHA256) against GITHUB_WEBHOOK_SECRET
  - Parse event header (X-GitHub-Event) and unique delivery id (X-GitHub-Delivery)
  - Insert or skip WebhookEvent by eventId for idempotency (using prisma.WebhookEvent.create try/catch on unique constraint)
  - For Phase 1: only log installation events and insert or update GitHubAppInstallation minimal metadata (if event contains installation payload) or create a placeholder entry manually in DB.
  - Ensure route is server-only and not exposed to client bundling.
- [ ] **CREATE:** docs/github-app-migration.md — New developer doc with:
  - How to create GitHub App in staging (permissions required, webhooks to set)
  - Environment variables to add locally and to staging
  - How to run the prototype auth service tests
  - Steps to simulate webhook delivery for staging
  - Rollback steps for Prisma migration
- [ ] **CREATE:** .env.example (or update) — Add placeholders and comments for:
  - GITHUB_APP_ID
  - GITHUB_APP_SLUG
  - GITHUB_PRIVATE_KEY (PEM content)
  - GITHUB_WEBHOOK_SECRET
  - Note clearly: server-only secrets, not to be committed with real values

### Integration and Compatibility Tasks:
- [ ] **INTEGRATE:** Ensure src/actions/githubAppAuth.ts is only imported from server code (API routes / actions). Add a runtime guard (if typeof window !== "undefined") to throw if imported client-side.
- [ ] **ENSURE:** Backward compatibility — verify existing OAuth calls still read db.user.githubAccessToken (no deletion) and still function. Add unit test or smoke test to validate import route works unchanged with OAuth tokens in staging.
- [ ] **VALIDATE:** Confirm middleware update does not require Clerk auth for /api/webhook/github. Add integration test that posts a signed payload and receives 200 from webhook route.

### Framework-Specific Enhancement Tasks (NextJS):
- [ ] **ENHANCE:** Ensure new API route is created under App Router path: src/app/api/webhook/github/route.ts (Next.js App Router route handler pattern). Implement server-only exports.
- [ ] **UPDATE:** Ensure code in src/actions/githubAppAuth.ts uses server runtime only — mark with "use server" or put in server-only folder if your repo enforces that.
- [ ] **OPTIMIZE:** Add a small startup check (runtime) in /src/actions/githubAppAuth.ts to validate required env vars at import time in staging and log clear error messages if missing.

### Testing and Validation Tasks:
- [ ] **TEST:** Run all existing unit tests and smoke tests after the schema change and code additions. Fix any resulting type or runtime issues.
- [ ] **CREATE:** Add integration test that:
  - Deploys to staging or runs locally with staging-like env
  - Uses a test installationId to call getInstallationToken and validates token received
- [ ] **UPDATE:** Update CI to run the new tests against staging-like env or mock secrets to validate compile+test steps.

### Documentation and Human Review Preparation Tasks:
- [ ] **UPDATE:** README.md — add a Phase 1 section with exact developer steps to run migration and validate token issuance locally.
- [ ] **DOCUMENT:** In docs/github-app-migration.md, add explicit test steps for the human reviewer (validation checklist, commands, and expected outputs).
- [ ] **PREPARE:** Create HUMAN_REVIEW.md template with the required checkboxes for Phase 1 (include test commands and places to paste logs).
- [ ] **CREATE:** Rollback instructions (short) in docs/github-app-migration.md explaining how to revert the prisma migration and how to remove staged webhook config.

## 🏁 Phase Completion Criteria

This phase is complete when:
- [ ] GitHub App exists in staging with private key & webhook secret stored in staging secret manager
- [ ] Prisma migration applied in staging and GitHubAppInstallation + WebhookEvent tables exist
- [ ] src/actions/githubAppAuth.ts prototype can generate an app JWT and retrieve an installation token for a test installationId (logged evidence)
- [ ] src/app/api/webhook/github/route.ts reachable in staging and verifies signatures for test payloads (received logs)
- [ ] Middleware updated to allow webhook route and no Clerk auth required for webhooks
- [ ] All new and existing unit/integration tests pass in staging; existing GitHub OAuth flows still function (smoke-tested)
- [ ] docs/github-app-migration.md and HUMAN_REVIEW.md updated with instructions and reviewer checklist
- [ ] HUMAN reviewer has executed the End-Phase Review checklist and recorded approval in HUMAN_REVIEW.md

**⚠️ CRITICAL: HUMAN APPROVAL REQUIRED BEFORE MARKING COMPLETE ⚠️**

### Human Approval Requirements:
- [ ] Human ran the getInstallationToken test and confirmed token + expiresAt logged
- [ ] Human posted a simulated signed webhook and confirmed the webhook route accepted and deduped the event (WebhookEvent row created)
- [ ] Human verified that existing import endpoints still work using stored user oauth tokens (smoke test)
- [ ] Human verified prisma migration exists and is reversible (migration files in prisma/migrations)
- [ ] Human recorded PASS/FAIL and any issues in HUMAN_REVIEW.md and explicitly marked Phase 1 "APPROVED"

---

**COMPLETION STATUS:** NOT_STARTED

**HUMAN APPROVAL STATUS:** PENDING

---

## 🚨 HUMAN REVIEW PROTOCOL FOR THIS PHASE

When Phase 1 implementation is complete, notify the human reviewer with this exact message:

🔄 PHASE 1 ENHANCEMENT COMPLETION - HUMAN REVIEW REQUIRED

Phase 1 implementation is complete. I need your review and approval before proceeding.

ENHANCEMENTS TO TEST:
- GitHub App creation in staging and secret provisioning
- Prisma models added: GitHubAppInstallation + WebhookEvent
- Prototype auth service at src/actions/githubAppAuth.ts: getAppJWT() and getInstallationToken()
- Webhook skeleton at src/app/api/webhook/github/route.ts with HMAC verification + idempotency
- Middleware update allowing webhook path

EXISTING FUNCTIONALITY TO VERIFY:
- Existing GitHub OAuth import flow still works (smoke test)
- Existing SSE LLM streaming endpoints remain functional (quick smoke)
- Prisma client usage unaffected (no runtime errors)

INTEGRATION POINTS TO VALIDATE:
- githubAppAuth prototype interacts with GitHub REST endpoint (mocked or staging)
- Webhook route is reachable and not behind Clerk middleware
- Prisma migration applied and DB tables visible

SETUP INSTRUCTIONS:
1. Pull latest code on branch for Phase 1
2. Ensure staging env vars set (GITHUB_APP_ID, GITHUB_PRIVATE_KEY, GITHUB_WEBHOOK_SECRET)
3. Run: npx prisma migrate dev --name add_github_app_installation (or verify applied migration in staging)
4. Run unit tests: npm test (or repo’s test command)
5. Run the sample script or call the API that triggers getInstallationToken for a test installationId
6. Send a signed test webhook to /api/webhook/github and confirm a WebhookEvent row is created

REQUIRED ACTION:
Update HUMAN_REVIEW.md with your test results, migration logs, and approval status.

❌ I CANNOT PROCEED UNTIL YOU APPROVE THIS PHASE AND CONFIRM NO REGRESSIONS

---

## Additional Notes & Risk Controls (Phase 1)
- Do not remove or alter any persisted user OAuth tokens in this phase.
- Do not change any production routing or behavior in this phase.
- Use staging-only GitHub App and installation; do not use production organizations for Phase 1.
- Keep the token cache in-memory only and explicit that Redis caching will be added in Phase 2.
- Log only metadata (no tokens) for auditability during Phase 1.

---