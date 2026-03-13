/**
 * Rule: Supabase integration — client, types, migrations, RLS, queries.
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { AuditRuleContext } from '../types.js';
import { countMatches } from '../scanner.js';

export function auditSupabaseIntegration(ctx: AuditRuleContext): number {
  let score = 0;
  const checks = 5;

  const clientPaths = [
    join(ctx.root, 'lib', 'supabase'),
    join(ctx.root, 'src', 'lib', 'supabase'),
    join(ctx.root, 'src', 'shared', 'lib', 'supabase-browser.ts'),
    join(ctx.root, 'src', 'integrations', 'supabase'),
  ];
  if (clientPaths.some((p) => existsSync(p))) score++;

  const typePaths = [
    join(ctx.root, 'lib', 'supabase', 'types.ts'),
    join(ctx.root, 'src', 'lib', 'supabase', 'types.ts'),
    join(ctx.root, 'src', 'shared', 'types', 'database.ts'),
    join(ctx.root, 'src', 'integrations', 'supabase', 'types.ts'),
  ];
  if (typePaths.some((p) => existsSync(p))) score++;

  const migrationDir = join(ctx.root, 'supabase', 'migrations');
  if (existsSync(migrationDir)) {
    const migrations = readdirSync(migrationDir).filter((f) => f.endsWith('.sql'));
    if (migrations.length > 0) score++;
    const hasRLS = migrations.some((f) => {
      const sql = readFileSync(join(migrationDir, f), 'utf-8');
      return /ENABLE ROW LEVEL SECURITY|CREATE POLICY/i.test(sql);
    });
    if (hasRLS) score++;
  }

  const srcDir = ctx.adapter.resolveSrc(ctx.root);
  const serverQueries = countMatches(srcDir, /supabase\.from\(/g);
  if (serverQueries > 3) score++;

  return Math.round((score / checks) * 100);
}
