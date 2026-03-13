/**
 * Rule: Test ID coverage — measures data-testid density.
 */

import type { AuditRuleContext } from '../types.js';
import { countMatches } from '../scanner.js';

export function auditTestIds(ctx: AuditRuleContext): number {
  const srcDir = ctx.adapter.resolveSrc(ctx.root);
  const testIdCount = countMatches(srcDir, /data-testid=/g);
  return Math.min(100, Math.round((testIdCount / 50) * 100));
}
