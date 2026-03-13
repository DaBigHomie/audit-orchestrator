/**
 * Rule: Marquee / ticker presence and animation.
 */

import type { AuditRuleContext } from '../types.js';
import { countMatches } from '../scanner.js';

export function auditMarquee(ctx: AuditRuleContext): number {
  const src = ctx.adapter.resolveSrc(ctx.root);
  const marqueeCount = countMatches(src, /marquee|Marquee|ticker|Ticker/g);

  if (marqueeCount === 0) return 0;

  // Check for animation (CSS or Framer Motion)
  const animRefs = countMatches(src, /marquee.*animate|@keyframes.*marquee|motion\.div.*marquee/gi);
  return animRefs > 0 ? 80 : 40;
}
