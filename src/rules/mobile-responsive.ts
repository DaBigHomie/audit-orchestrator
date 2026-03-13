/**
 * Rule: Mobile responsiveness — responsive classes, mobile menu, touch targets.
 */

import type { AuditRuleContext } from '../types.js';
import { countMatches, findFiles } from '../scanner.js';

export function auditMobileResponsiveness(ctx: AuditRuleContext): number {
  const srcDir = ctx.adapter.resolveSrc(ctx.root);
  let score = 0;
  const checks = 5;

  const mdClasses = countMatches(srcDir, /\bmd:/g);
  const lgClasses = countMatches(srcDir, /\blg:/g);
  const smClasses = countMatches(srcDir, /\bsm:/g);
  if (mdClasses > 30) score++;
  if (lgClasses > 10) score++;
  if (smClasses > 5) score++;

  const mobileMenuFiles = findFiles(srcDir, /mobile.*menu|menu.*mobile|hamburger/i);
  if (mobileMenuFiles.length > 0 || countMatches(srcDir, /MobileMenu|mobile-menu|HamburgerMenu/g) > 0) score++;

  const touchTargets = countMatches(srcDir, /min-h-\[44px\]|min-w-\[44px\]|h-11|w-11|p-3/g);
  if (touchTargets > 5) score++;

  return Math.round((score / checks) * 100);
}
