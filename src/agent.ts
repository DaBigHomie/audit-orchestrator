/**
 * UGWTF Agent adapter — wraps audit-orchestrator rules as UGWTF-compatible agents.
 *
 * Each audit rule becomes a UGWTF Agent with:
 *   - execute() → runs the rule and maps score to AgentResult
 *   - shouldRun() → checks framework support for the target repo
 *
 * Usage from UGWTF:
 *   import { visualAuditAgents } from '@dabighomie/audit-orchestrator/agent';
 */
import { detectAdapter } from './adapters/index.js';
import { RULES } from './rules/index.js';
import type { AuditRuleContext } from './types.js';

// ── UGWTF-compatible interfaces (mirrors ugwtf/src/types.ts) ──────────────────
// Defined locally to avoid a hard dependency on @dabighomie/ugwtf

export type AgentStatus = 'idle' | 'running' | 'success' | 'failed' | 'skipped';

export interface UgwtfAgentContext {
  repoAlias: string;
  repoSlug: string;
  github: unknown;
  localPath: string;
  dryRun: boolean;
  logger: { info(msg: string): void; warn(msg: string): void; error(msg: string): void; group(msg: string): void; groupEnd(): void };
}

export interface UgwtfAgentResult {
  agentId: string;
  status: AgentStatus;
  repo: string;
  duration: number;
  message: string;
  artifacts: string[];
  error?: string;
}

export interface UgwtfAgent {
  id: string;
  name: string;
  description: string;
  clusterId: string;
  execute(ctx: UgwtfAgentContext): Promise<UgwtfAgentResult>;
  shouldRun(ctx: UgwtfAgentContext): boolean;
}

// ── Rule metadata for agent wrapping ──────────────────────────────────────────

interface RuleMeta {
  id: string;
  name: string;
  description: string;
  /** Frameworks this rule supports. Empty = all. */
  frameworks: string[];
}

const RULE_META: RuleMeta[] = [
  { id: 'dark-mode-contrast', name: 'Dark Mode Contrast Audit', description: 'CSS variable coverage and dark mode class density', frameworks: [] },
  { id: 'test-ids', name: 'Test ID Coverage Audit', description: 'data-testid attribute density on interactive elements', frameworks: [] },
  { id: 'accessibility', name: 'Accessibility Audit', description: 'ARIA labels, alt text, skip-to-content, focus traps', frameworks: [] },
  { id: 'design-system', name: 'Design System Audit', description: 'CSS custom properties, token usage, hardcoded value detection', frameworks: [] },
  { id: 'mobile-responsive', name: 'Mobile Responsive Audit', description: 'Breakpoint classes, mobile menu, touch targets', frameworks: [] },
  { id: 'supabase-integration', name: 'Supabase Integration Audit', description: 'Client usage, DB types, migrations, RLS, server queries', frameworks: [] },
  { id: 'checkout-flow', name: 'Checkout Flow Audit', description: 'Payment steps, Stripe integration, shipping', frameworks: [] },
  { id: 'collections', name: 'Collections Audit', description: 'Dynamic routes, thumbnails, search/filter', frameworks: [] },
  { id: 'marquee', name: 'Marquee Audit', description: 'Scrolling animation presence and CSS animation', frameworks: [] },
  { id: 'button-consistency', name: 'Button Consistency Audit', description: 'Shared Button component, variant count, CTA patterns', frameworks: [] },
];

// ── Score → status mapping ────────────────────────────────────────────────────

function findingsToStatus(findings: import('./types.js').AuditIssue[]): AgentStatus {
  if (findings.length === 0) return 'success';
  if (findings.some((f) => f.severity === 'critical' || f.severity === 'high')) return 'failed';
  return 'success';
}

// ── Create UGWTF agents from audit rules ──────────────────────────────────────

function createVisualAuditAgent(meta: RuleMeta): UgwtfAgent {
  const ruleFn = RULES[meta.id as keyof typeof RULES];

  return {
    id: `visual-audit-${meta.id}`,
    name: meta.name,
    description: meta.description,
    clusterId: 'visual-audit',

    shouldRun(ctx: UgwtfAgentContext): boolean {
      // Skip if localPath doesn't exist or isn't set
      if (!ctx.localPath) return false;
      // If rule has framework restrictions, check adapter
      if (meta.frameworks.length > 0) {
        const adapter = detectAdapter(ctx.localPath);
        return meta.frameworks.includes(adapter.framework);
      }
      return true;
    },

    async execute(ctx: UgwtfAgentContext): Promise<UgwtfAgentResult> {
      const start = Date.now();
      try {
        const adapter = detectAdapter(ctx.localPath);
        const ruleCtx: AuditRuleContext = { root: ctx.localPath, adapter };
        const findings = ruleFn(ruleCtx);
        const status = findingsToStatus(findings);

        return {
          agentId: `visual-audit-${meta.id}`,
          status,
          repo: ctx.repoAlias,
          duration: Date.now() - start,
          message: `${meta.name}: ${findings.length} issue(s) (${status})`,
          artifacts: findings.map((f) => `${f.id}:${f.severity}:${f.title}`),
        };
      } catch (err) {
        return {
          agentId: `visual-audit-${meta.id}`,
          status: 'failed',
          repo: ctx.repoAlias,
          duration: Date.now() - start,
          message: `${meta.name}: error`,
          artifacts: [],
          error: err instanceof Error ? err.message : String(err),
        };
      }
    },
  };
}

/** All 10 visual audit agents, ready for UGWTF cluster registration. */
export const visualAuditAgents: UgwtfAgent[] = RULE_META.map(createVisualAuditAgent);
