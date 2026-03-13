/**
 * Rule: Design system — CSS custom properties, hardcoded colors, tokens, animation constants.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { AuditRuleContext } from '../types.js';
import { countMatches } from '../scanner.js';

export function auditDesignSystem(ctx: AuditRuleContext): number {
  const srcDir = ctx.adapter.resolveSrc(ctx.root);
  let score = 0;
  const checks = 5;

  const globalsCss = ctx.adapter.resolveStylesheet(ctx.root);
  if (existsSync(globalsCss)) {
    const css = readFileSync(globalsCss, 'utf-8');
    const customProps = (css.match(/--[\w-]+:/g) ?? []).length;
    if (customProps > 10) score++;
    if (customProps > 30) score++;
  }

  const hardcodedHex = countMatches(srcDir, /#[0-9a-fA-F]{3,8}(?![\w-])/g, /\.tsx$/);
  if (hardcodedHex < 20) score++;

  // Design tokens file
  const tokenPaths = [
    join(ctx.root, 'src', 'shared', 'config', 'design-system.ts'),
    join(ctx.root, 'src', 'shared', 'config', 'design-tokens.ts'),
    join(ctx.root, 'lib', 'design-system.ts'),
    join(ctx.root, 'src', 'lib', 'design-system.ts'),
  ];
  if (tokenPaths.some((p) => existsSync(p))) score++;

  const animImports = countMatches(srcDir, /from ['"]@?\/?(?:lib|shared)\/animations/g);
  if (animImports > 3) score++;

  return Math.round((score / checks) * 100);
}
