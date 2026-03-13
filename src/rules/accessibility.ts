/**
 * Rule: Accessibility — ARIA coverage, skip-to-content, focus traps, alt text.
 */

import { existsSync } from 'node:fs';
import type { AuditRuleContext } from '../types.js';
import { countMatches, fileContains } from '../scanner.js';

export function auditAccessibility(ctx: AuditRuleContext): number {
  const srcDir = ctx.adapter.resolveSrc(ctx.root);
  let score = 0;
  const checks = 5;

  const ariaCount = countMatches(srcDir, /aria-/g);
  if (ariaCount > 30) score++;
  if (ariaCount > 100) score++;

  const layoutFile = ctx.adapter.resolveLayout(ctx.root);
  if (existsSync(layoutFile) && fileContains(layoutFile, ['skip-to', 'Skip to'])) score++;

  const focusTrap = countMatches(srcDir, /focus-trap|FocusTrap|useFocusTrap/g);
  if (focusTrap > 0) score++;

  const altCount = countMatches(srcDir, /alt=/g);
  if (altCount > 10) score++;

  return Math.round((score / checks) * 100);
}
