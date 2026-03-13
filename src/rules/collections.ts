/**
 * Rule: Collections — feature dir, route, thumbnails, search/filter.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { AuditRuleContext } from '../types.js';
import { countMatches } from '../scanner.js';

export function auditCollections(ctx: AuditRuleContext): number {
  let score = 0;
  const checks = 4;
  const src = ctx.adapter.resolveSrc(ctx.root);

  // Collections feature
  const featurePaths = [
    join(src, 'features', 'collections'),
    join(src, 'features', 'shop'),
  ];
  if (featurePaths.some((p) => existsSync(p))) score++;

  // App route
  const routePaths = [
    join(src, 'app', 'collections'),
    join(src, 'app', 'shop'),
    join(src, 'pages', 'Shop.tsx'),
  ];
  if (routePaths.some((p) => existsSync(p))) score++;

  // Collection thumbnails / images
  const imageRefs = countMatches(src, /collection.*image|collection.*thumbnail|CollectionCard/gi);
  if (imageRefs > 0) score++;

  // Filter / search params
  const filterRefs = countMatches(src, /searchParams|useSearchParams|filter|FilterBar/g);
  if (filterRefs > 0) score++;

  return Math.round((score / checks) * 100);
}
