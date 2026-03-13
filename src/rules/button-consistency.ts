/**
 * Rule: Button consistency — shared component, variants, CTA patterns.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { AuditRuleContext } from '../types.js';
import { countMatches, fileContains } from '../scanner.js';

export function auditButtonConsistency(ctx: AuditRuleContext): number {
  let score = 0;
  const checks = 3;
  const src = ctx.adapter.resolveSrc(ctx.root);

  // Shared Button component
  const buttonPaths = [
    join(ctx.adapter.resolveComponents(ctx.root), 'button.tsx'),
    join(ctx.adapter.resolveComponents(ctx.root), 'Button.tsx'),
    join(src, 'shared', 'ui', 'button.tsx'),
    join(src, 'components', 'ui', 'button.tsx'),
  ];
  if (buttonPaths.some((p) => existsSync(p))) score++;

  // Variant patterns
  const variantBtn = buttonPaths.find((p) => existsSync(p));
  if (variantBtn) {
    const variantCount = countMatches(
      variantBtn,
      /variant|default|destructive|outline|secondary|ghost|link/g
    );
    if (variantCount > 5) score++;
  }

  // CTA patterns using the Button component
  const ctaRefs = countMatches(src, /ButtonProps|cva|buttonVariants/g);
  if (ctaRefs > 0) score++;

  return Math.round((score / checks) * 100);
}
