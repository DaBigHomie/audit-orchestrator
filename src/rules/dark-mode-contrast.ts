/**
 * Rule: Dark mode contrast validation.
 * Checks CSS custom properties, dark: prefixed classes, and darkMode config.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { AuditRuleContext } from '../types.js';
import { countMatches } from '../scanner.js';

export function auditDarkModeContrast(ctx: AuditRuleContext): number {
  const srcDir = ctx.adapter.resolveSrc(ctx.root);
  const globalsCss = ctx.adapter.resolveStylesheet(ctx.root);
  const tailwindConfig = ctx.adapter.resolveConfig(ctx.root);

  let score = 0;
  const checks = 6;

  if (existsSync(globalsCss)) {
    const css = readFileSync(globalsCss, 'utf-8');
    if (css.includes('.dark') || css.includes('[data-theme="dark"]') || css.includes('@media (prefers-color-scheme: dark)')) score++;
    if (/--heading-color|--eyebrow-color|--body-muted|--text-primary/.test(css)) score++;
    if (/--card-bg|--section-bg|--surface/.test(css)) score++;
  }

  const darkClasses = countMatches(srcDir, /dark:/g);
  if (darkClasses > 50) score++;
  if (darkClasses > 100) score++;

  if (existsSync(tailwindConfig)) {
    const tw = readFileSync(tailwindConfig, 'utf-8');
    if (tw.includes('darkMode')) score++;
  }

  return Math.round((score / checks) * 100);
}
