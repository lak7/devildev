---
# PHASE 3: Migration — Migration Execution, Rollout & Cleanup

**STATUS:** NOT_STARTED

---

## 🎯 Phase Objective
Execute the migration from user OAuth token–based GitHub repository imports to GitHub App installation token–based access for production tenants. This includes running the migration bridge to map existing repos to installations, updating Projects to reference installationIds, enabling a controlled canary rollout, providing a temporary OAuth bridge for unmapped repos during a grace period, removing or safely handling long‑lived githubAccessToken storage, and finalizing docs/runbooks/monitoring. All changes must preserve current functionality (SSE LLM streaming, Clerk auth, project imports) and include mandatory human review checkpoints.

## 🔄 Current State vs. Target State
**Current State:**
- Next.js 15 App Router app using server-side actions to call GitHub using stored user OAuth tokens (githubAccessToken) in DB.
- GitHub App authentication code, webhook handler, and installation token caching were introduced in earlier phases (src/actions/githubAppAuth.ts, src/app/api/webhook/github/route.ts).
- No production-wide mapping of existing repos to GitHubAppInstallation records yet.
- Projects still reference user-token-based import metadata (no consistent installationId references).

**Target State:**
- Projects and repo-import related models reference GitHubAppInstallation.installationId (BigInt) where applicable.
- A tested githubMigrationBridge script has mapped (or marked pending) existing repo records to installations; mappings are persisted in DB.
- Repo import endpoints default to installation token path for mapped repos; remaining repos use OAuth bridge during a controlled grace period.
- Long-lived user GitHub tokens are rotated/cleared or encrypted after migration (per policy), with rollback ability.
- Canary rollout completed and monitoring/alerts in place for import & webhook failures; docs and runbooks updated.

**Impact Scope:**
- Prisma schema and migrations (prisma/schema.prisma)
- DB data (Projects/Project repositories mapping)
- Server actions and API routes (src/app/api/github/import/route.ts, other import endpoints)
- Migration scripts (src/actions/githubMigrationBridge.ts)
- UI/UX: admin migration controls and deprecation messaging (src/components/*)
- Webhook and token lifecycle monitoring (src/app/api/webhook/github/route.ts, metrics)
- Security & ops (secret handling, backups)

## 🎁 Key Deliverables
- Existing repository-to-installation mappings created and verified for target repos (via githubMigrationBridge).
- Projects updated to reference installationId (DB schema + migrations).
- Repo import routes and server actions use installation tokens for mapped repos; OAuth bridge remains for unmigrated repos with feature-flagged behavior.
- Canary rollout executed and monitored; rollback plan tested.
- Documentation (docs/github-app-migration.md), HUMAN_REVIEW.md, runbooks, and monitoring dashboards updated.

## 📋 Prerequisites
**Must be completed before starting:**

- [ ] **HUMAN APPROVAL REQUIRED:** Phase 2 must be reviewed and approved in HUMAN_REVIEW.md
- [ ] All deliverables from Phase 2 tested and confirmed working with existing system
- [ ] No regressions in existing functionality from previous phase changes
- [ ] All reported issues from Phase 2 resolved without breaking existing features
- [ ] Existing project state maintained and enhanced from previous phase

⚠️ CRITICAL: DO NOT START THIS PHASE WITHOUT HUMAN APPROVAL OF PREVIOUS PHASE ⚠️

## 🔄 Human Review Checkpoints

### Pre-Phase Validation
- [ ] **Verify Human Approval:** Confirm Phase 2 approval recorded in HUMAN_REVIEW.md
- [ ] **Regression Testing:** Confirm Phase 2 changes pass regression tests in staging
- [ ] **Integration Validation:** Confirm githubAppAuth and webhook endpoints work end-to-end in staging
- [ ] **DB Backup:** Take and store a production DB snapshot before any production migration

### Mid-Phase Review (after ~50% tasks complete)
- [ ] **Mapping Spot-check:** Human verifies 5–10 sampled repo mappings (sha/byte checks) between GitHub and local import artifacts
- [ ] **Canary Verification:** Human validates canary tenant import success and SSE LLM streaming end-to-end
- [ ] **Performance Assessment:** Check import latency and token issuance metrics for regressions

### End-Phase Review (MANDATORY)
- [ ] **Enhancement Testing:** Human tests all new mapping and import flows for mapped and unmapped repos
- [ ] **Regression Testing:** Human verifies all critical existing features (LLM streaming, project/chat flows, Clerk auth) are unaffected
- [ ] **Integration Validation:** Human confirms imports, webhooks, and token lifecycle work together
- [ ] **Performance Verification:** Human validates performance meets baseline (no >10% regression)
- [ ] **UX Confirmation:** Human confirms deprecation messaging and migration UI are clear and correct
- [ ] **Final Approval:** Human marks Phase 3 as APPROVED in HUMAN_REVIEW.md before production cutoff

---

## ✅ Implementation Tasks

Note: Tasks are ordered to minimize disruption; each step is granular (aim ~15–30 min per task). Each task starts unchecked and specifies MODIFY or CREATE, and exact file paths where applicable.

### Existing Code Modification Tasks:
- [ ] **MODIFY:** prisma/schema.prisma — Add optional installation reference fields to relevant models
  - Add `githubInstallationId BigInt?` to Project (and/or ProjectRepo/ProjectArchitecture if that exists) and add any necessary indices. Keep existing githubAccessToken fields intact for now.
  - Rationale: allow mapping existing projects to installationId; keep backward compatibility for grace period.
- [ ] **MODIFY:** src/app/api/github/import/route.ts — Add/ensure support for fallback handling
  - Prefer installation-based import when `project.githubInstallationId` is present; otherwise continue using OAuth fallback when feature flag/grace period enabled. Add instrumentation log lines (import method used).
- [ ] **MODIFY:** src/app/api/github/repos/route.ts — Accept `installationId` param and prefer installation token path; maintain previous query param for `oauth` path during grace period.
- [ ] **MODIFY:** src/app/api/github/callback/route.ts — Mark as deprecated in response headers and add migration link in response body; ensure it still functions for OAuth fallback during grace period.
- [ ] **MODIFY:** src/actions/githubMigrationBridge.ts (if created earlier) — Extend to write `githubInstallationId` into Project records when mapping succeeds and to set `migrationStatus` metadata (e.g., 'mapped', 'pending', 'unmappable').
- [ ] **MODIFY:** src/app/api/webhook/github/route.ts — When installation repositories change, update cached `repositories` in GitHubAppInstallation and, if a repo matches a `pending` mapping, optionally auto-map (with caution). Idempotent write guarded by WebhookEvent dedupe.
- [ ] **MODIFY:** src/actions/githubAppAuth.ts — Add a `getInstallationToken(installationId, {forceRefresh?: boolean})` helper if not exist, and expose a token invalidation hook that migration/rollback tasks can call to force regeneration.

### New Feature Development Tasks:
- [ ] **CREATE:** src/actions/githubMigrationBridge.ts — Migration & verification script
  - Responsibilities:
    - Iterate projects / stored repos that reference user-based imports.
    - For each repo, attempt to find an installation that has access (using githubAppAuth.listInstallations() + getInstallationRepositories()).
    - If found: create mapping by setting Project.githubInstallationId and log mapping event.
    - If not found: mark Project.migrationStatus = "pending" and record reason.
    - Provide a dry-run mode (flag `--dry-run`) that outputs an exportable CSV with: projectId, repoFullName, matchedInstallationId (if any), confidence, nextSteps.
  - Path: src/actions/githubMigrationBridge.ts
- [ ] **CREATE:** prisma/migrations/* (run by commands) — Migration files
  - After schema change, run `npx prisma migrate dev --name add_github_installation_refs` locally and prepare migration for deploy.
- [ ] **CREATE:** src/components/GitHubMigrationBanner.tsx — Admin UI banner/component
  - Small admin component that shows migration status, button to "Run Mapping (dry-run)" and link to installation URL. Integrate into existing admin/settings page (developer to import where appropriate).
- [ ] **CREATE:** src/lib/migrationUtils.ts — small helpers used by bridge for verification checks (sha comparison, content checksum).
- [ ] **CREATE:** tests/e2e/github_migration.test.ts — E2E test that runs bridge in dry-run mode against a mocked Octokit (nock) and validates expected mapping decisions.

### Integration and Compatibility Tasks:
- [ ] **INTEGRATE:** Feature-flag toggle for rollout — add env var GITHUB_APP_MIGRATION_MODE with values `off`, `canary`, `on`
  - Modify import endpoints to check this flag and route traffic accordingly (off: OAuth only; canary: only for selected tenant IDs; on: installation-based by default).
  - Files: src/app/api/github/import/route.ts, src/lib/config.ts (create/update).
- [ ] **ENSURE:** Backward compatibility for import API — maintain the existing API contract for clients; server decides auth path based on mapping + feature flag.
- [ ] **VALIDATE:** Existing import workflow still functions for OAuth fallback (test at least one OAuth-based import using stored githubAccessToken).

### Framework-Specific Enhancement Tasks (Next.js):
- [ ] **ENHANCE:** Admin UI integration — import src/components/GitHubMigrationBanner.tsx into existing admin/settings page
  - File to modify: (example) src/app/(admin)/settings/page.tsx or wherever admin settings live — add banner and "Start dry-run" button that POSTs to /api/github/import/bridge with dry-run flag.
- [ ] **UPDATE:** Middleware allow-list — ensure src/middleware.ts excludes webhook route from Clerk protection:
  - File: src/middleware.ts — add route `/api/webhook/github` to public allowlist.

### Testing and Validation Tasks:
- [ ] **TEST:** Staging dry-run — run migration bridge in staging with `--dry-run` and human-verify the CSV for mapping correctness.
- [ ] **CREATE:** Unit tests for migration helper functions in src/lib/migrationUtils.ts
- [ ] **UPDATE:** CI workflow to run new tests and ensure migrations build: update .github/workflows/ci.yml to run `npx prisma generate` and run migration tests in dry-run mode against mocked Octokit.
- [ ] **VALIDATE:** Spot-check 10 sample repo imports (canary) end-to-end: import → LLM SSE generation → verify output material matches pre-migration results.

### Operations, Monitoring & Safety Tasks:
- [ ] **MODIFY:** src/lib/metrics.ts or add file — add metrics for migration: migration_mapped_count, migration_pending_count, import_method (installation|oauth)_count, token_request_success/failure.
- [ ] **CREATE:** docs/HUMAN_REVIEW.md — Add mandatory Phase 3 verification checklist and instructions for human reviewers (how to run dry-run, sample queries).
- [ ] **CREATE:** docs/github-app-migration.md — Update runbook with migration steps, rollback steps, and detailed canary rollout instructions.
- [ ] **CREATE:** ops/runbooks/rollback_migration.md — explicit rollback steps: how to revert prisma migration, restore DB snapshot, revert code using feature flag, re-enable OAuth path.
- [ ] **CREATE:** src/actions/clearUserGithubTokens.ts — safe script to (optionally, after approval) rotate or scrub long-lived githubAccessToken values; run only after migration and human sign-off. Provide `--dry-run` mode.

### Deployment and Rollout Tasks:
- [ ] **RUN:** Take production DB snapshot and store it securely before any production migration step (manual/human action with confirmation recorded in HUMAN_REVIEW.md).
- [ ] **RUN:** Deploy migration DB changes to staging, then to production using `npx prisma migrate deploy` after human sign-off.
- [ ] **RUN:** Execute migration bridge in staging (dry-run), then in canary tenant(s), then progressively across tenants as approved.
- [ ] **MONITOR:** Collect and review metrics for token issuance latency, import success rates, webhook failures for 24–72 hours during canary.

### Documentation and Human Review Preparation Tasks:
- [ ] **UPDATE:** README.md — add local dev instructions for running migration bridge in dry-run and live modes; document new env var GITHUB_APP_MIGRATION_MODE.
- [ ] **DOCUMENT:** Add a changelog entry in CHANGELOG.md for Phase 3 migration steps and deprecation schedule for OAuth callback.
- [ ] **PREPARE:** Provide human reviewer instructions: exact commands to run (dry-run and live), sample project IDs to spot-check, and expected output verification steps. Add to HUMAN_REVIEW.md.

---

## 🏁 Phase Completion Criteria

This phase is complete when:
- [ ] All implementation tasks above are checked off
- [ ] Migration bridge mapped targeted repositories and wrote `githubInstallationId` to Project records (or marked pending) with no data corruption
- [ ] Canary tenants show successful installation-based imports and end-to-end SSE pipelines function unchanged
- [ ] OAuth fallback remains available for unmapped repos and is feature-flagged
- [ ] Long-lived githubAccessToken values are addressed per policy (rotated/cleared/encrypted) with human approval
- [ ] Monitoring dashboards show acceptable error rates and token issuance performance (within success criteria)
- [ ] Documentation and runbooks updated; HUMAN_REVIEW.md contains human sign-off entries
- [ ] All human review checkpoints passed and Phase 3 approved by human reviewer

⚠️ CRITICAL: HUMAN APPROVAL REQUIRED BEFORE MARKING COMPLETE

### Human Approval Requirements:
- [ ] Human performed Full System Integration tests for mapped and unmapped repos
- [ ] Human confirmed no regressions in LLM SSE streaming and existing user workflows
- [ ] Human validated performance metrics (token issuance, import latency)
- [ ] Human reviewed and approved DB changes and backup/rollback plan
- [ ] Human marked Phase 3 as "APPROVED" in HUMAN_REVIEW.md

### Final Phase Additional Requirements:
- [ ] Full end-to-end migration verification across a representative set of tenants
- [ ] Final production readiness sign-off by Backend/Platform, Security, and QA engineers

---

**COMPLETION STATUS:** NOT_STARTED

**HUMAN APPROVAL STATUS:** PENDING

---

## 🚨 HUMAN REVIEW PROTOCOL FOR PHASE 3

When Phase 3 implementation is complete, do NOT mark this phase as complete. Notify the human reviewer with the following message exactly:

🔄 PHASE 3 ENHANCEMENT COMPLETION - HUMAN REVIEW REQUIRED

Phase 3 implementation is complete. I need your review and approval before proceeding.

ENHANCEMENTS TO TEST:
- Repo mapping via githubMigrationBridge (dry-run and live)
- Installation-based import flow for mapped repos
- OAuth fallback import flow for unmapped repos (feature-flagged)
- Clearing/rotation of long-lived githubAccessToken (dry-run verification)
- Admin migration UI (dry-run runner + status banner)
- Monitoring for migration & token issuance metrics

EXISTING FUNCTIONALITY TO VERIFY:
- SSE LLM streaming (generate-docs-stream) end-to-end after import
- Clerk-authenticated flows and pages
- Existing repo imports that are still in OAuth fallback mode
- Webhook processing (installation events) and idempotency

INTEGRATION POINTS TO VALIDATE:
- githubMigrationBridge → Prisma writes to Project.githubInstallationId
- Import API → uses installation token vs OAuth fallback
- Webhook handler → updates GitHubAppInstallation.repositories and triggers re-evaluation of pending mappings
- Metrics → migration_mapped_count, import_method_count

SETUP INSTRUCTIONS:
1. Pull the branch containing Phase 3 changes
2. Ensure staging has GITHUB_APP_* env vars and a test GitHub App installed
3. Run the migration bridge in `--dry-run` mode:
   - node ./src/actions/githubMigrationBridge.ts --dry-run --output=reports/dryrun.csv
4. Spot-check 5 repositories listed in dryrun CSV by fetching files from GitHub and comparing checksums with stored imports
5. Run the migration bridge in canary mode for a selected tenant (human selects tenant ID)
6. Test an import for a mapped repo and ensure generate-docs-stream works end-to-end
7. Test an import for an unmapped repo; confirm OAuth fallback still works if enabled
8. Review monitoring dashboard for errors

REQUIRED ACTION:
Update HUMAN_REVIEW.md with your test results, regression testing results, and approval status.

❌ I CANNOT PROCEED UNTIL YOU APPROVE THIS PHASE AND CONFIRM NO REGRESSIONS

---

## NOTES, CAUTIONS & ROLLBACK

- Always take a DB snapshot before running production migrations or live mapping.
- Use dry-run first; never run live mapping across all tenants without canary verification and human approval.
- Keep OAuth callback route functional until a formal deprecation date and until all tenants are mapped.
- If regressions occur: flip feature flag to route imports to OAuth fallback, revert code if needed, and restore DB from snapshot if mapping caused corruption.

---

If you want, I can:
- Generate the exact Prisma schema diff and migration commands for adding Project.githubInstallationId and WebhookEvent.
- Produce the githubMigrationBridge script template with dry-run, live, and verification modes.
- Produce a sample HUMAN_REVIEW.md template pre-filled with the exact verification checklist and example commands.

Which of those should I generate next?