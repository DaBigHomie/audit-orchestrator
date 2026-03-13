/**
 * Rules index — registry, runner, issue catalog, and cluster definitions.
 */

import type { AuditIssue, AuditRuleContext, AuditResult, PromptCluster } from '../types.js';
import { auditDarkModeContrast } from './dark-mode-contrast.js';
import { auditTestIds } from './test-ids.js';
import { auditAccessibility } from './accessibility.js';
import { auditDesignSystem } from './design-system.js';
import { auditMobileResponsiveness } from './mobile-responsive.js';
import { auditSupabaseIntegration } from './supabase-integration.js';
import { auditCheckoutFlow } from './checkout-flow.js';
import { auditCollections } from './collections.js';
import { auditMarquee } from './marquee.js';
import { auditButtonConsistency } from './button-consistency.js';

export const RULES = {
  'dark-mode-contrast': auditDarkModeContrast,
  'test-ids': auditTestIds,
  'accessibility': auditAccessibility,
  'design-system': auditDesignSystem,
  'mobile-responsive': auditMobileResponsiveness,
  'supabase-integration': auditSupabaseIntegration,
  'checkout-flow': auditCheckoutFlow,
  'collections': auditCollections,
  'marquee': auditMarquee,
  'button-consistency': auditButtonConsistency,
} as const;

export type RuleName = keyof typeof RULES;

export function runAllRules(ctx: AuditRuleContext): Record<RuleName, number> {
  const results = {} as Record<RuleName, number>;
  for (const [name, fn] of Object.entries(RULES)) {
    results[name as RuleName] = fn(ctx);
  }
  return results;
}

export function buildIssueCatalog(ctx: AuditRuleContext): AuditIssue[] {
  const dm = auditDarkModeContrast(ctx);
  const ds = auditDesignSystem(ctx);
  const btn = auditButtonConsistency(ctx);
  const mar = auditMarquee(ctx);
  const co = auditCheckoutFlow(ctx);
  const col = auditCollections(ctx);
  const mob = auditMobileResponsiveness(ctx);
  const tid = auditTestIds(ctx);
  const a11y = auditAccessibility(ctx);
  const supa = auditSupabaseIntegration(ctx);

  return [
    // DARK MODE (P01-P05)
    { id: 'DM-01', title: 'Hero dark mode contrast collapse', severity: 'critical', category: 'dark-mode',
      description: 'Hero heading/body text fails WCAG AA on navy bg in dark mode', affectedFiles: ['src/features/homepage/'], completionPct: dm, promptId: 'P01' },
    { id: 'DM-02', title: 'Section eyebrow text invisible', severity: 'critical', category: 'dark-mode',
      description: 'CURATED FOR YOU, COLLECTIONS, etc. ghost headings in both modes', affectedFiles: ['src/features/homepage/', 'src/app/globals.css'], completionPct: dm, promptId: 'P02' },
    { id: 'DM-03', title: 'Collection cards monochrome flatness', severity: 'high', category: 'dark-mode',
      description: 'Shop By Vibe cards merge with dark bg', affectedFiles: ['src/features/collections/'], completionPct: dm, promptId: 'P03' },
    { id: 'DM-04', title: 'Testimonials color inversion failure', severity: 'high', category: 'dark-mode',
      description: 'Light blue bg band jarring in dark mode, text invisible', affectedFiles: ['src/features/homepage/'], completionPct: dm, promptId: 'P04' },
    { id: 'DM-05', title: 'Newsletter section washed out', severity: 'high', category: 'dark-mode',
      description: 'STAY CONNECTED eyebrow and body text unreadable', affectedFiles: ['src/features/newsletter/'], completionPct: dm, promptId: 'P05' },

    // LAYOUT (P06-P10)
    { id: 'LY-01', title: 'Homepage excessive vertical whitespace', severity: 'medium', category: 'layout',
      description: 'Dead screens between hero/marquee, essentials/story', affectedFiles: ['src/features/homepage/', 'src/app/page.tsx'], completionPct: 0, promptId: 'P06' },
    { id: 'LY-02', title: 'Essentials grid shows only 2 products', severity: 'medium', category: 'layout',
      description: 'Should show 4 to fill row, reduce orphaned look', affectedFiles: ['src/features/homepage/'], completionPct: 0, promptId: 'P06' },
    { id: 'LY-03', title: 'Collection cards orphaned 5th card', severity: 'medium', category: 'layout',
      description: 'Accessories card sits alone on second row', affectedFiles: ['src/features/homepage/'], completionPct: 0, promptId: 'P07' },
    { id: 'LY-04', title: 'Shop page filter not functional', severity: 'high', category: 'functionality',
      description: 'Category filter URL param ignored, no active state', affectedFiles: ['src/features/shop/', 'src/app/shop/'], completionPct: col, promptId: 'P08' },
    { id: 'LY-05', title: 'PDP margin issues + top bar hidden', severity: 'high', category: 'layout',
      description: 'Left/right margins broken, bg image hides top bar', affectedFiles: ['src/features/product-detail/'], completionPct: 0, promptId: 'P09' },

    // CONTENT (P10-P14)
    { id: 'CT-01', title: 'Hero link mismatch /about vs /our-story', severity: 'medium', category: 'content',
      description: 'Our Story button → /about but nav → /our-story', affectedFiles: ['src/features/homepage/', 'src/features/story/'], completionPct: 0, promptId: 'P10' },
    { id: 'CT-02', title: 'Product cards missing info badges', severity: 'medium', category: 'content',
      description: 'No material, sizing, new badges beyond BESTSELLER', affectedFiles: ['src/entities/product/'], completionPct: 0, promptId: 'P11' },
    { id: 'CT-03', title: 'Newsletter value prop inconsistent', severity: 'low', category: 'content',
      description: '10% off shown on shop but not homepage', affectedFiles: ['src/features/newsletter/'], completionPct: 0, promptId: 'P12' },
    { id: 'CT-04', title: 'Empty link destinations in footer', severity: 'medium', category: 'content',
      description: 'Community, Lookbook etc. may lead to empty states', affectedFiles: ['src/features/homepage/', 'src/shared/'], completionPct: 0, promptId: 'P13' },
    { id: 'CT-05', title: 'Social proof stats text wrapping', severity: 'medium', category: 'layout',
      description: '"500+ Happy Customers" breaks across lines incorrectly', affectedFiles: ['src/features/homepage/'], completionPct: 0, promptId: 'P14' },

    // DESIGN SYSTEM (P15-P19)
    { id: 'DS-01', title: 'CSS custom property theme system', severity: 'critical', category: 'design',
      description: 'Need --heading-color, --eyebrow-color etc. with dark variants', affectedFiles: ['src/app/globals.css', 'tailwind.config.js'], completionPct: ds, promptId: 'P15' },
    { id: 'DS-02', title: 'Button hierarchy standardization', severity: 'high', category: 'design',
      description: 'Primary/secondary/outline buttons inconsistent across pages', affectedFiles: ['src/shared/ui/button.tsx'], completionPct: btn, promptId: 'P16' },
    { id: 'DS-03', title: 'Typography weight in dark mode', severity: 'high', category: 'design',
      description: 'Serif headings render too lightly, need heavier dark variants', affectedFiles: ['src/app/globals.css', 'tailwind.config.js'], completionPct: 0, promptId: 'P17' },
    { id: 'DS-04', title: 'PDP washed-out UI in light mode', severity: 'high', category: 'design',
      description: 'Title, price, swatches, CTA all pale gray on white', affectedFiles: ['src/features/product-detail/'], completionPct: 0, promptId: 'P18' },
    { id: 'DS-05', title: 'Shop page banner text overlay conflict', severity: 'high', category: 'design',
      description: 'Logo watermark competes with Shop All heading', affectedFiles: ['src/features/shop/'], completionPct: 0, promptId: 'P19' },

    // FUNCTIONALITY (P20-P24)
    { id: 'FN-01', title: 'Marquee not scrolling', severity: 'high', category: 'functionality',
      description: 'Marquee ticker doesnt animate on any device', affectedFiles: ['src/features/homepage/'], completionPct: mar, promptId: 'P20' },
    { id: 'FN-02', title: 'Proceed to checkout button broken', severity: 'critical', category: 'functionality',
      description: 'Button doesnt navigate to checkout page', affectedFiles: ['src/features/cart/', 'src/features/checkout/'], completionPct: co, promptId: 'P21' },
    { id: 'FN-03', title: 'PDP payment icons wrong', severity: 'medium', category: 'functionality',
      description: 'Shows Apple Pay/PayPal vs Stripe Link logos', affectedFiles: ['src/features/product-detail/'], completionPct: 0, promptId: 'P22' },
    { id: 'FN-04', title: 'Collection thumbnails missing', severity: 'high', category: 'functionality',
      description: 'Collection cards show placeholders not photos', affectedFiles: ['src/features/collections/', 'public/'], completionPct: col, promptId: 'P23' },
    { id: 'FN-05', title: 'Product badge inconsistency', severity: 'medium', category: 'functionality',
      description: 'Multiple sold out badges, inconsistent badge rendering', affectedFiles: ['src/entities/product/', 'src/features/shop/'], completionPct: 0, promptId: 'P24' },

    // MOBILE (P25-P27)
    { id: 'MB-01', title: 'Mobile menu cant scroll', severity: 'critical', category: 'mobile',
      description: 'Mobile navigation menu is not scrollable', affectedFiles: ['src/features/homepage/', 'src/shared/'], completionPct: mob, promptId: 'P25' },
    { id: 'MB-02', title: 'Top bar text not centered', severity: 'medium', category: 'mobile',
      description: 'Announcement bar text alignment off on mobile', affectedFiles: ['src/features/homepage/'], completionPct: 0, promptId: 'P26' },
    { id: 'MB-03', title: 'Atlanta Rooted text wordwrap issue', severity: 'medium', category: 'mobile',
      description: 'Footer tagline wraps incorrectly, needs 2-line treatment', affectedFiles: ['src/features/homepage/'], completionPct: 0, promptId: 'P26' },

    // CROSS-CUTTING (P27-P30)
    { id: 'XC-01', title: 'Test ID coverage', severity: 'high', category: 'accessibility',
      description: 'Need 50+ data-testid for E2E testing', affectedFiles: ['src/'], completionPct: tid, promptId: 'P27' },
    { id: 'XC-02', title: 'ARIA + keyboard nav coverage', severity: 'high', category: 'accessibility',
      description: 'Focus traps, roving tabindex, ARIA live regions', affectedFiles: ['src/'], completionPct: a11y, promptId: 'P28' },
    { id: 'XC-03', title: 'Supabase cart/wishlist sync', severity: 'high', category: 'integration',
      description: 'Cart/wishlist persist server-side for logged-in users', affectedFiles: ['src/features/cart/', 'src/features/wishlist/', 'lib/supabase/'], completionPct: supa, promptId: 'P29' },
    { id: 'XC-04', title: 'Shipping methods from FFS', severity: 'medium', category: 'integration',
      description: 'Copy shipping method component/logic from flipflops-sundays', affectedFiles: ['src/features/shipping/', 'src/features/checkout/'], completionPct: 0, promptId: 'P30' },
  ];
}

export function buildClusters(): PromptCluster[] {
  return [
    // WAVE 1 — Foundation (no dependencies, all parallel)
    { id: 'C1', name: 'Design System Foundation', prompts: ['P15', 'P16', 'P17'], canParallelize: true, dependsOn: [], estimatedMinutes: 45, agentCount: 3 },
    { id: 'C2', name: 'Dark Mode Contrast System', prompts: ['P01', 'P02', 'P03', 'P04', 'P05'], canParallelize: true, dependsOn: ['C1'], estimatedMinutes: 60, agentCount: 5 },
    { id: 'C3', name: 'Mobile & Responsive Fixes', prompts: ['P25', 'P26'], canParallelize: true, dependsOn: [], estimatedMinutes: 30, agentCount: 2 },

    // WAVE 2 — Layout & Structure (depends on design system)
    { id: 'C4', name: 'Homepage Layout Optimization', prompts: ['P06', 'P07', 'P14'], canParallelize: true, dependsOn: ['C1'], estimatedMinutes: 40, agentCount: 3 },
    { id: 'C5', name: 'Shop & PDP Fixes', prompts: ['P08', 'P09', 'P18', 'P19'], canParallelize: true, dependsOn: ['C1', 'C2'], estimatedMinutes: 50, agentCount: 4 },

    // WAVE 3 — Content & Functionality
    { id: 'C6', name: 'Content & Links', prompts: ['P10', 'P11', 'P12', 'P13'], canParallelize: true, dependsOn: [], estimatedMinutes: 35, agentCount: 4 },
    { id: 'C7', name: 'Functional Fixes', prompts: ['P20', 'P21', 'P22', 'P23', 'P24'], canParallelize: false, dependsOn: ['C5'], estimatedMinutes: 60, agentCount: 3 },

    // WAVE 4 — Cross-Cutting (depends on functional fixes)
    { id: 'C8', name: 'Testing & Accessibility', prompts: ['P27', 'P28'], canParallelize: true, dependsOn: ['C7'], estimatedMinutes: 40, agentCount: 2 },
    { id: 'C9', name: 'Supabase & Integration', prompts: ['P29', 'P30'], canParallelize: true, dependsOn: ['C7'], estimatedMinutes: 45, agentCount: 2 },
  ];
}

export function buildAuditResult(ctx: AuditRuleContext, clusterFilter?: string): AuditResult {
  let issues = buildIssueCatalog(ctx);
  const clusters = buildClusters();

  // If cluster filter is set, only include issues from that cluster's prompts
  if (clusterFilter) {
    const cluster = clusters.find(c => c.id === clusterFilter || c.name.toLowerCase().includes(clusterFilter.toLowerCase()));
    if (cluster) {
      const clusterPrompts = new Set(cluster.prompts);
      issues = issues.filter(i => clusterPrompts.has(i.promptId));
    }
  }

  const bySeverity: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0 };
  const byCategory: Record<string, number> = {};
  for (const issue of issues) {
    bySeverity[issue.severity]++;
    byCategory[issue.category] = (byCategory[issue.category] ?? 0) + 1;
  }

  return {
    totalIssues: issues.length,
    bySeverity,
    byCategory,
    overallCompletion: Math.round(issues.reduce((sum, i) => sum + i.completionPct, 0) / issues.length),
    clusters,
    issues,
    timestamp: new Date().toISOString(),
    cwd: ctx.root,
    framework: ctx.adapter.framework,
  };
}
