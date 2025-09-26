"use server";

import crypto from "crypto";

// Simple in-memory cache for installation tokens
type CachedToken = { token: string; expiresAt: number };
const installationTokenCache: Map<string, CachedToken> = new Map();

// Lightweight metrics (in-memory counters)
const metrics = {
  cacheHit: 0,
  cacheMiss: 0,
  fetchFailure: 0,
  invalidationCount: 0,
};

function log(event: string, details: Record<string, unknown>) {
  if (process.env.GITHUB_APP_LOGGING === "true") {
    // Keep logs concise and structured
    console.log(`[githubAppAuth] ${event}`, details);
  }
}

function assertServerRuntime() {
  if (typeof window !== "undefined") {
    throw new Error("githubAppAuth must be imported server-side only");
  }
}

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

// Create a GitHub App JWT according to https://docs.github.com/apps/building-github-apps/authenticating-with-github-apps
export async function getAppJWT(): Promise<string> {
  assertServerRuntime();
  const appId = required("GITHUB_APP_ID");
  const privateKey = required("GITHUB_PRIVATE_KEY");

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iat: now - 60, // issued 60s in the past for clock skew
    exp: now + 9 * 60, // max 10 minutes
    iss: appId,
  };

  function base64url(input: Buffer) {
    return input
      .toString("base64")
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
  }

  const encHeader = base64url(Buffer.from(JSON.stringify(header)));
  const encPayload = base64url(Buffer.from(JSON.stringify(payload)));
  const unsigned = `${encHeader}.${encPayload}`;

  const signer = crypto.createSign("RSA-SHA256");
  signer.update(unsigned);
  const pem = privateKey.includes("\\n") ? privateKey.replace(/\\n/g, "\n") : privateKey;
  const signature = signer.sign(pem);
  const encSignature = base64url(signature);
  return `${unsigned}.${encSignature}`;
}

export async function getInstallationToken(installationId: number | bigint | string): Promise<{ token: string; expiresAt: string }> {
  assertServerRuntime();
  const id = String(installationId);
  const cacheKey = id;
  const nowMs = Date.now();
  const cached = installationTokenCache.get(cacheKey);
  if (cached && cached.expiresAt - nowMs > 60_000) {
    metrics.cacheHit += 1;
    const ttlMs = Math.max(0, cached.expiresAt - nowMs);
    log("cache_hit", { installationId: id, ttlMs });
    return { token: cached.token, expiresAt: new Date(cached.expiresAt).toISOString() };
  }

  const start = Date.now();
  const jwt = await getAppJWT();
  const res = await fetch(`https://api.github.com/app/installations/${id}/access_tokens`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${jwt}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "DevilDev-App",
    },
  });

  if (!res.ok) {
    const text = await res.text();
    metrics.fetchFailure += 1;
    log("fetch_failure", { installationId: id, status: res.status, bodySize: text?.length ?? 0 });
    throw new Error(`Failed to get installation token (${res.status}): ${text}`);
  }
  const data = (await res.json()) as { token: string; expires_at: string };
  const expiresMs = new Date(data.expires_at).getTime();
  installationTokenCache.set(cacheKey, { token: data.token, expiresAt: expiresMs });
  metrics.cacheMiss += 1;
  const latencyMs = Date.now() - start;
  log("cache_miss", { installationId: id, latencyMs, expiresAt: data.expires_at });
  return { token: data.token, expiresAt: data.expires_at };
}

export async function clearInstallationTokenCache(installationId?: string | number | bigint) {
  if (installationId === undefined) {
    installationTokenCache.clear();
    metrics.invalidationCount += 1;
    log("cache_invalidate_all", {});
    return;
  }
  installationTokenCache.delete(String(installationId));
  metrics.invalidationCount += 1;
  log("cache_invalidate", { installationId: String(installationId) });
}


