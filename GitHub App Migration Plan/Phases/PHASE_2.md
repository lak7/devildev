---
# PHASE 2: GitHub App integration and API surface adaptation

**STATUS:** NOT_STARTED

---

## 🎯 Phase Objective
Implement server-side GitHub App authentication and integrate it into the server-side GitHub consumers: provide installation token issuance & caching, webhook handling for installation events, refactor repo import/list endpoints to use installation tokens (with OAuth fallback during grace period), and update server actions that fetch GitHub content to use the centralized auth service. Add tests and instrumentation for the new flow. Preserve existing functionality and enable a staged migration.

## 🔄 Current State vs. Target State
**Current State:**
- Server-side GitHub API calls use stored user OAuth tokens (githubAccessToken) in DB.
- GitHub OAuth callback, import and repos endpoints live under src/app/api/github/* and call GitHub directly via ad-hoc code.
- No centralized GitHub App auth service exists.
- Prisma schema lacks GitHubAppInstallation & webhook dedupe models.
- Webhooks are handled for Clerk (Svix). No GitHub App webhook handler yet.
- SSE LLM streaming and Clerk-based auth must remain unchanged.

**Target State (after Phase 2):**
- Centralized server-only GitHub App auth service implemented: src/actions/githubAppAuth.ts (JWT generation, installation token exchange, token cache).
- Octokit usage consolidated via lib wrapper (src/lib/githubClient.ts) used by server routes/actions.
- src/app/api/webhook/github/route.ts handles GitHub App webhooks (installation & installation_repositories), with signature verification and idempotency.
- src/app/api/github/import/route.ts and src/app/api/github/repos/route.ts accept optional installationId and prefer installation tokens; maintain OAuth fallback under bridge mode.
- Server actions that fetch repo contents (actions/*) refactored to accept a GitHub client or repository content payload provided by import layer.
- Token caching (in-memory TTL, pluggable to Redis) implemented; metrics/instrumentation for token issuance added.
- Unit/integration tests and CI additions for auth flow and webhook handling.

**Impact Scope:**
- Files under src/app/api/github/* (import, repos, callback)
- actions/* that fetch GitHub content (actions/context.ts, actions/reverse-architecture.ts, actions/github-helpers.ts)
- New files under src/actions and src/lib
- prisma/schema.prisma (if not already added in Phase 1) may need small updates; ensure Phase 1 migrations completed
- src/middleware.ts (allow webhook path)
- CI workflows and package.json (new dependencies)
- Documentation and README updates

---

## 🎁 Key Deliverables
- Central GitHub App auth service implemented (JWT + getInstallationToken + cache) integrated across server routes/actions.
- Webhook receiver for GitHub App events (installation & installation_repositories) with signature verification and idempotent processing.
- Refactored import & repos API routes to use installation tokens (with OAuth fallback during grace period).
- Octokit wrapper (github client) for server-side usage with clear server-only imports.
- Unit & integration tests covering token issuance, webhook verification, and import with installation tokens.
- Instrumentation/metrics for token issuance and webhook processing; README updates and runbook entries for Phase 2 ops.

---

## 📋 Prerequisites
**Must be completed before starting:**

- [ ] **HUMAN APPROVAL REQUIRED:** Phase 1 must be reviewed and approved in HUMAN_REVIEW.md
- [ ] All deliverables from Phase 1 tested and confirmed working in staging (JWT creation + Prisma migration applied)
- [ ] GITHUB_APP_ID, GITHUB_PRIVATE_KEY, GITHUB_WEBHOOK_SECRET set in staging environment (and locally for dev)
- [ ] CI/staging environment configured with these secrets
- [ ] Existing system baseline tests passing (no regressions from Phase 1)

**⚠️ CRITICAL: DO NOT START THIS PHASE WITHOUT HUMAN APPROVAL OF PREVIOUS PHASE ⚠️**

---

## 🔄 Human Review Checkpoints

### Pre-Phase Validation
- [ ] **Verify Human Approval**: Check HUMAN_REVIEW.md for Phase 1 approval status
- [ ] **Regression Testing**: Confirm Phase 1 changes didn't break existing functionality
- [ ] **Integration Validation**: Ensure Phase 1 enhancements integrate properly with existing system
- [ ] **Performance Check**: Validate existing system performance baseline unchanged after Phase 1

### Mid-Phase Review (after ~50% tasks complete)
- [ ] **Existing Functionality Validation**: Ensure core repo import and SSE flows still run end-to-end in staging
- [ ] **Integration Testing**: Validate that the new githubAppAuth service returns tokens and Octokit usage via token works for at least one test installation
- [ ] **Performance Impact Assessment**: Spot-check token issuance latency and import performance

### End-Phase Review (MANDATORY)
- [ ] **Enhancement Testing**: Human must test new auth service (token issuance), import via installationId, and webhook processing
- [ ] **Regression Testing**: Human must verify existing import via OAuth still works (bridge)
- [ ] **Integration Validation**: Confirm actions/* correctly receive repo contents when using installation tokens
- [ ] **Performance Verification**: Validate token issuance latency & import times meet acceptance
- [ ] **User Experience Review**: Validate UI flows (Install App link, repo selection) if updated
- [ ] **Issue Reporting**: Document problems in HUMAN_REVIEW.md
- [ ] **Final Approval**: Human must approve phase completion before moving to Phase 3

---

## ✅ Implementation Tasks

(Tasks are granular and designed to be 15–30 min each where possible. Include exact file paths and whether MODIFY or CREATE.)

### Environment & Dependencies
- [ ] **MODIFY:** package.json - Add dependencies "@octokit/rest" and "@octokit/auth-app" (and types if needed). Run npm install locally. Rationale: required by githubAppAuth and Octokit usage.
- [ ] **MODIFY:** .env.example / README.md - Add entries and docs for GITHUB_APP_ID, GITHUB_APP_SLUG, GITHUB_PRIVATE_KEY, GITHUB_WEBHOOK_SECRET, and note they are server-only.

### Core Auth Service (centralized)
- [ ] **CREATE:** src/actions/githubAppAuth.ts - Implement minimal server-only service:
  - export async function getAppJWT(): generates signed JWT using GITHUB_PRIVATE_KEY (use @octokit/auth-app helper or sign manually).
  - export async function getInstallationToken(installationId: number | string): checks in-memory cache, if miss calls POST /app/installations/{installationId}/access_tokens via @octokit/auth-app or @octokit/rest, caches token with expiresAt.
  - export async function listInstallations(): returns list of installations for app (server-admin use).
  - Add logging (masked) and metrics hooks (simple counters).
  - Ensure module only imported in server code (document with comment).

- [ ] **CREATE:** src/lib/githubClient.ts - Thin wrapper:
  - export function createOctokitWithToken(token: string) -> returns new Octokit({ auth: token })
  - export function createOctokitAsApp(jwt?: string) if needed.
  - Keep usage limited to server modules; add types and small helper for repo content fetch.

- [ ] **CREATE:** src/actions/tokenCache.ts - Small in-memory TTL cache abstraction (Map with expiry), clearly documented as pluggable to Redis. Provide get/set/clear functions and metrics hooks.

### Webhook Handler
- [ ] **CREATE:** src/app/api/webhook/github/route.ts - Implement POST route:
  - Verify X-Hub-Signature-256 using GITHUB_WEBHOOK_SECRET.
  - Parse event type (installation, installation_repositories).
  - Use WebhookEvent dedupe pattern (insert eventId in DB WebhookEvent or use in-memory for staging) to ensure idempotency.
  - On installation created/added: create/update GitHubAppInstallation record in DB (prisma) with account info & repositorySelection.
  - On installation_repositories: update repositories cache in the GitHubAppInstallation record.
  - Return 200 quickly; enqueue any heavy sync work asynchronously (log placeholder or use background job).
  - Add tests for signature verification and idempotency.

- [ ] **MODIFY:** src/middleware.ts - Ensure webhook path /api/webhook/github is allow-listed (not protected by Clerk middleware). Add a unit test that the route is reachable without auth.

### Refactor Import & Repos Endpoints
- [ ] **MODIFY:** src/app/api/github/import/route.ts - Add optional installationId input:
  - If installationId present: call getInstallationToken(installationId) and use Octokit client (createOctokitWithToken) to fetch repo contents for import; maintain existing import logic downstream.
  - If installationId absent: during grace period, fall back to existing db.user.githubAccessToken path and add response field oauthImported: true.
  - Ensure proper error handling: if installation token returns 403/404, respond with clear message instructing to install app or provide OAuth fallback.
  - Add unit tests mocking githubAppAuth and verifying both flows.

- [ ] **MODIFY:** src/app/api/github/repos/route.ts - Accept installationId query param:
  - If installationId provided: use getInstallationToken and list repositories via Octokit with installation token.
  - If not, use existing OAuth path (grace period).
  - Ensure response shape is backward-compatible; add field installationId when used.

- [ ] **MODIFY:** src/app/api/github/callback/route.ts - Mark deprecated:
  - Add deprecation-warning header and body explaining migration.
  - Keep functionality as bridge; add logging that OAuth flow was used for import to aid migration scripts.

### Update Server Actions that Fetch GitHub Content
- [ ] **MODIFY:** src/actions/github-helpers.ts (or wherever ad-hoc GitHub calls exist) - Replace direct usage of DB-stored githubAccessToken with an injected Octokit client parameter. If the module currently creates Octokit internally, refactor to accept client or token from caller to centralize auth usage.
- [ ] **MODIFY:** src/actions/reverse-architecture.ts - Update functions that fetch repository files to accept either:
  - a) an Octokit client created by caller via getInstallationToken OR
  - b) raw repository file payloads produced by import route
  - Add fallbacks to support both patterns to maintain compatibility.

- [ ] **MODIFY:** actions/context.ts - Ensure orchestrator passes repo content or a server-side repo client to downstream actions; do not import githubAppAuth directly if unnecessary—prefer dependency injection from route layer.

### Token Cache, Retry & Metrics
- [ ] **CREATE:** instrumentation hooks in src/actions/githubAppAuth.ts - simple counters/logs for token requests, cache hits/misses, failures.
- [ ] **CREATE:** retry logic in getInstallationToken - on 401/403 regenerate token and retry once with exponential backoff (small).
- [ ] **MODIFY:** add logging (masked) in existing error handling for GitHub API calls so operators can see token-related failures without exposing secrets.

### Tests & CI
- [ ] **CREATE:** tests/unit/githubAppAuth.test.ts - Unit tests using nock or mocked Octokit to validate JWT generation flow, token caching behavior, and expiry handling.
- [ ] **CREATE:** tests/integration/webhook-github.test.ts - Integration test for webhook signature verification and DB record creation (use test DB or sqlite).
- [ ] **MODIFY:** CI workflow (e.g., .github/workflows/ci.yml) - Add steps to run the new tests and ensure env vars for test/staging are available for CI runs (mocked if necessary).

### Documentation & Dev Experience
- [ ] **UPDATE:** README.md - Add Phase 2 developer setup steps for GitHub App (env vars, how to run webhook locally with ngrok, how to run tests).
- [ ] **CREATE:** docs/github-app-phase2.md - Short guide describing the new service, how to call endpoints with installationId, token cache behavior, and where to put logs/metrics.
- [ ] **CREATE:** HUMAN_REVIEW.md entry template - Add a Phase 2 review checklist and explicit steps for the human reviewer.

### Compatibility & Safety
- [ ] **ENSURE:** Backward compatibility in src/app/api/github/import/route.ts and repos/route.ts - preserve existing API shapes and maintain OAuth fallback.
- [ ] **MODIFY:** src/app/api/webhook/clerk/route.ts - Ensure existing Clerk webhook handling remains unchanged and not impacted by new GitHub webhook route.
- [ ] **VALIDATE:** confirm src/app/api/generate-docs-stream/route.ts remains unchanged and that actions that require repo contents are invoked with repository content the same way as before.

### Operational & Rollback Preparation
- [ ] **CREATE:** runbooks/runbooks/github-app-phase2.md - Minimal operational runbook: how to restart token cache, how to view token issuance logs, and how to disable the new flow (feature flag switch) to fall back to OAuth.
- [ ] **CREATE:** feature flag config (simple env switch) - e.g., GITHUB_APP_FLOW_ENABLED - used in import/repos routes to route traffic; document and default to disabled until human enables.

---

## 🏁 Phase Completion Criteria

**This phase is complete when:**
- [ ] All implementation tasks above are checked off
- [ ] getInstallationToken() issues tokens and caches them (cache hit/miss metrics visible)
- [ ] Import and repos endpoints accept installationId and perform repo fetches via installation tokens in staging
- [ ] OAuth fallback still works for bridge cases and callback route returns deprecation info
- [ ] Webhook route verifies signatures and updates GitHubAppInstallation DB records idempotently
- [ ] Unit & integration tests pass in CI for the new flows
- [ ] Documentation (README + docs/github-app-phase2.md + runbook) updated
- [ ] No regressions in SSE LLM streaming flows (smoke-tested)
- [ ] Human approval recorded in HUMAN_REVIEW.md (see list below)

**⚠️ CRITICAL: HUMAN APPROVAL REQUIRED BEFORE MARKING COMPLETE ⚠️**

### Human Approval Requirements:
- [ ] Existing Functionality Validation: Human tested existing import via OAuth and confirmed it still works (bridge)
- [ ] Enhancement Validation: Human tested new installation-token-based import and confirmed it works
- [ ] Integration Testing: Human verified actions/* ingest repository data properly when using installation tokens
- [ ] Performance Validation: Human checked token issuance latency and import times within acceptance
- [ ] Documentation Review: Human reviewed and approved README and docs changes
- [ ] Issue Resolution: All human-reported issues resolved
- [ ] Final Approval: Human marked Phase 2 "APPROVED" in HUMAN_REVIEW.md

---

**COMPLETION STATUS:** NOT_STARTED

**HUMAN APPROVAL STATUS:** PENDING

---

## 🚨 HUMAN REVIEW PROTOCOL FOR EXISTING PROJECT ENHANCEMENTS

### When Phase Implementation is Complete:
1. **STOP**: Do not mark phase as complete
2. **NOTIFY HUMAN**: Request human review using this exact message:

🔄 PHASE 2 ENHANCEMENT COMPLETION - HUMAN REVIEW REQUIRED

Phase 2 implementation is complete. I need your review and approval before proceeding.

ENHANCEMENTS TO TEST:
- Centralized GitHub App auth service (getAppJWT, getInstallationToken, token cache)
- Webhook handler for GitHub App events (installation, installation_repositories)
- Import endpoint using installation tokens and repos endpoint listing installation repos
- Octokit wrapper usage and refactor of actions/* to accept injected GitHub client or repo payloads
- Token cache behavior, retry-on-401 logic, and instrumentation

EXISTING FUNCTIONALITY TO VERIFY:
- Existing OAuth callback and OAuth-based import still function as a bridge
- SSE generate-docs-stream endpoint behaves unchanged end-to-end
- Clerk-authenticated pages and middleware behavior remain intact

INTEGRATION POINTS TO VALIDATE:
- actions/reverse-architecture.ts and actions/context.ts integration with updated import route
- DB updates to GitHubAppInstallation from webhook events and idempotency of webhook processing
- CI tests added for githubAppAuth and webhook handlers

SETUP INSTRUCTIONS:
1. Pull/update the enhanced codebase
2. Ensure staging env has GITHUB_APP_ID, GITHUB_PRIVATE_KEY, GITHUB_WEBHOOK_SECRET (or use test mocks)
3. Run unit and integration tests (CI will run them automatically)
4. Smoke-test import flows:
   - a) Install GitHub App in staging test org and use installationId in import request
   - b) Use OAuth fallback import for a user with existing githubAccessToken to confirm bridge path
5. Trigger webhook events (or replay) to validate webhook handler updates DB
6. Validate SSE generate-docs-stream after import completes to ensure no regressions

REQUIRED ACTION:
Update HUMAN_REVIEW.md with your test results, regression testing results, and approval status.

❌ I CANNOT PROCEED UNTIL YOU APPROVE THIS PHASE AND CONFIRM NO REGRESSIONS

3. **WAIT**: Do not proceed until human approval is received
4. **FIX REGRESSIONS**: If human reports existing functionality is broken, fix immediately
5. **FINAL APPROVAL**: Only mark phase complete after explicit human approval with no regressions

### Issue and Regression Resolution Process:
If human reports issues or regressions:
1. **Categorize Issues**: Distinguish between new feature bugs vs. existing functionality regressions
2. **Prioritize Regressions**: Fix any broken existing functionality immediately
3. **Analyze Root Causes**: Understand why existing functionality was affected
4. **Implement Fixes**: Resolve all issues while preserving enhancements
5. **Re-test Everything**: Validate both fixes and original functionality work
6. **Request Re-review**: Ask human to test both existing and new functionality again
7. **Repeat**: Continue until human approves with no regressions

---

## TASK GENERATION REQUIREMENTS ACKNOWLEDGEMENT
All tasks above reference existing files and patterns from the project plan (src/app/api/github/*, actions/*, prisma, middleware, SSE route) and are scoped specifically for Phase 2. They aim to be granular, backward-compatible, and include mandatory human review checkpoints before moving to Phase 3.

---