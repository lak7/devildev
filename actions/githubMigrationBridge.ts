"use server";

import { db } from '@/lib/db';
import { getInstallationToken } from './githubAppAuth';

type BridgeOptions = { dryRun?: boolean };

export async function runGithubMigrationBridge(options: BridgeOptions = {}) {
  const dryRun = options.dryRun ?? true;

  const projects = await db.project.findMany({
    where: { githubInstallationId: null, repoFullName: { not: null } },
    select: { id: true, repoFullName: true },
  });

  const results: Array<{ projectId: string; repoFullName: string | null; matchedInstallationId?: bigint | null; note: string }> = [];

  for (const p of projects) {
    // Placeholder: in a real bridge we would list installations and repositories to match access
    results.push({ projectId: p.id, repoFullName: p.repoFullName, matchedInstallationId: null, note: 'pending: implement matching' });
  }

  if (!dryRun) {
    // Future: write mappings when matchedInstallationId is determined
  }

  return { total: projects.length, results };
}


