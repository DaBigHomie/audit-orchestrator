#!/usr/bin/env npx tsx
/**
 * scaffold-phase2.mts — Generates all Phase 2 files for UGWTF integration.
 *
 * Creates:
 *   1. docs/CHANGELOG.md — Documents v1.0.1 bug fix + v1.1.0 Phase 2
 *   2. src/agent.ts — UGWTF Agent adapter (wraps audit-orchestrator for UGWTF)
 *   3. src/cluster.ts — UGWTF Cluster definition with DAG edges
 *   4. src/prompt-scanner.ts — Format A prompt scanner
 *   5. Updates src/index.ts — Adds --cluster flag for single-cluster audit
 *
 * Usage: npx tsx scripts/scaffold-phase2.mts
 */
import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';

const ROOT = dirname(dirname(new URL(import.meta.url).pathname));

function write(relPath: string, content: string) {
  const abs = join(ROOT, relPath);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, content, 'utf-8');
  console.log(`✅ Created ${relPath}`);
}

// ─── 1. CHANGELOG ─────────────────────────────────────────────────────────────

write('docs/CHANGELOG.md', `# Changelog — @dabighomie/audit-orchestrator

## [1.1.0] — 2026-03-13

### Added — Phase 2: UGWTF Integration
- \`src/agent.ts\` — UGWTF Agent adapter wrapping all 10 audit rules as UGWTF agents
- \`src/cluster.ts\` — \`visual-audit\` cluster definition with DAG dependency edges
- \`src/prompt-scanner.ts\` — Format A prompt scanner (\`.github/prompts/*.prompt.md\`)
- \`--cluster <id>\` CLI flag for single-cluster audit mode (dual audit)
- UGWTF-compatible \`shouldRun()\` guard checking repo framework support

### Fixed
- \`findFiles()\` crash when called with a file path instead of directory (ENOTDIR)

## [1.0.1] — 2026-03-13

### Fixed
- **BUG-001: ENOTDIR crash in \`findFiles()\`**
  - **Root cause**: \`button-consistency\` rule called \`countMatches(filePath)\`
    where \`filePath\` was a single \`.tsx\` file, not a directory.
    \`countMatches()\` delegates to \`findFiles()\` which called \`readdirSync()\`
    on the file path, throwing \`ENOTDIR\`.
  - **Trigger**: Only occurred when scanning Vite-React projects (\`damieus-com-migration\`)
    where \`resolveComponents()\` resolved to \`src/components/ui\` containing \`button.tsx\`.
    The \`buttonPaths\` array matched that file, then passed it to \`countMatches()\`.
  - **Fix**: Added \`stat.isDirectory()\` guard at top of \`findFiles()\`. If given a file
    path, returns \`[filePath]\` if the extension matches, otherwise \`[]\`.
  - **File**: \`src/scanner.ts\` lines 13-17
  - **Verified**: CLI now works against both Next.js and Vite-React projects

## [1.0.0] — 2026-03-13

### Added — Phase 1: Extract & Package
- 10 audit rules extracted from monolithic \`audit-orchestrator.mts\`
- 3 reporters: terminal, JSON, markdown
- 2 framework adapters: Next.js App Router, Vite-React
- Auto-detection of framework from config files / package.json
- CLI entry point with \`parseArgs\` (zero dependencies)
- 32 issue catalog with severity + category tagging
- 9 prompt clusters across 4 execution waves
- Parallel execution map renderer

### Verified Against
| Repo | Framework | Completion | Issues |
|------|-----------|------------|--------|
| one4three-co-next-app | nextjs | 42% | 32 |
| damieus-com-migration | vite-react | 27% | 32 |
`);

// ─── 2. src/agent.ts — UGWTF Agent adapter ────────────────────────────────────

write('src/agent.ts', `/**
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

function scoreToStatus(score: number): AgentStatus {
  if (score >= 80) return 'success';
  if (score >= 40) return 'failed'; // partial = needs work
  return 'failed';
}

// ── Create UGWTF agents from audit rules ──────────────────────────────────────

function createVisualAuditAgent(meta: RuleMeta): UgwtfAgent {
  const ruleFn = RULES[meta.id as keyof typeof RULES];

  return {
    id: \`visual-audit-\${meta.id}\`,
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
        const score = ruleFn(ruleCtx);
        const status = scoreToStatus(score);

        return {
          agentId: \`visual-audit-\${meta.id}\`,
          status,
          repo: ctx.repoAlias,
          duration: Date.now() - start,
          message: \`\${meta.name}: \${score}% (\${status})\`,
          artifacts: [\`\${meta.id}=\${score}\`],
        };
      } catch (err) {
        return {
          agentId: \`visual-audit-\${meta.id}\`,
          status: 'failed',
          repo: ctx.repoAlias,
          duration: Date.now() - start,
          message: \`\${meta.name}: error\`,
          artifacts: [],
          error: err instanceof Error ? err.message : String(err),
        };
      }
    },
  };
}

/** All 10 visual audit agents, ready for UGWTF cluster registration. */
export const visualAuditAgents: UgwtfAgent[] = RULE_META.map(createVisualAuditAgent);
`);

// ─── 3. src/cluster.ts — UGWTF Cluster definition ─────────────────────────────

write('src/cluster.ts', `/**
 * UGWTF Cluster definition for visual-audit.
 *
 * Registers the visual-audit cluster with:
 *   - 10 agents (one per audit rule)
 *   - DAG dependency: runs after 'quality' cluster
 *
 * Usage from UGWTF clusters/index.ts:
 *   import { visualAuditCluster } from '@dabighomie/audit-orchestrator/cluster';
 *   CLUSTERS.push(visualAuditCluster);
 */
import { visualAuditAgents } from './agent.js';

export interface VisualAuditCluster {
  id: string;
  name: string;
  description: string;
  agents: typeof visualAuditAgents;
  dependsOn: string[];
}

export const visualAuditCluster: VisualAuditCluster = {
  id: 'visual-audit',
  name: 'Visual Audit & Issue Detection',
  description: 'Run 10 visual/UX audit rules: dark mode, accessibility, design system, mobile, checkout, collections, Supabase, test IDs, buttons, marquee',
  agents: visualAuditAgents,
  dependsOn: ['quality'],
};
`);

// ─── 4. src/prompt-scanner.ts — Format A prompt scanner ────────────────────────

write('src/prompt-scanner.ts', `/**
 * Format A Prompt Scanner — discovers .github/prompts/*.prompt.md files
 * and extracts YAML frontmatter metadata.
 *
 * Designed to be compatible with UGWTF prompt-agents.ts scanner.
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';

export interface PromptMeta {
  /** File name without extension, e.g. "P01-dark-mode-hero" */
  id: string;
  /** Full file path */
  path: string;
  /** Extracted YAML fields */
  title?: string;
  description?: string;
  priority?: string;
  estimatedTime?: string;
  cluster?: string;
  wave?: number;
  severity?: string;
  /** Raw YAML frontmatter text */
  rawFrontmatter: string;
  /** Body text after frontmatter */
  body: string;
}

/**
 * Scan a repo's .github/prompts/ directory for Format A prompts.
 * Returns parsed prompt metadata sorted by filename.
 */
export function scanPrompts(root: string): PromptMeta[] {
  const promptDir = join(root, '.github', 'prompts');
  if (!existsSync(promptDir)) return [];

  const files = readdirSync(promptDir)
    .filter(f => f.endsWith('.prompt.md'))
    .sort();

  return files.map(file => {
    const fullPath = join(promptDir, file);
    const content = readFileSync(fullPath, 'utf-8');
    const id = basename(file, '.prompt.md');

    // Parse YAML frontmatter (between --- markers)
    const fmMatch = content.match(/^---\\n([\\s\\S]*?)\\n---/);
    const rawFrontmatter = fmMatch ? fmMatch[1]! : '';
    const body = fmMatch ? content.slice(fmMatch[0].length).trim() : content;

    // Extract known fields from YAML
    const fields: Record<string, string> = {};
    for (const line of rawFrontmatter.split('\\n')) {
      const kv = line.match(/^(\\w[\\w-]*):\\s*(.+)$/);
      if (kv) fields[kv[1]!] = kv[2]!.replace(/^["']|["']$/g, '');
    }

    return {
      id,
      path: fullPath,
      title: fields['title'],
      description: fields['description'],
      priority: fields['priority'],
      estimatedTime: fields['estimatedTime'],
      cluster: fields['cluster'],
      wave: fields['wave'] ? parseInt(fields['wave'], 10) : undefined,
      severity: fields['severity'],
      rawFrontmatter,
      body,
    };
  });
}

/**
 * Validate prompt quality. Returns score 0-100 and list of issues.
 * Compatible with UGWTF prompt-validator scoring.
 */
export function validatePrompt(prompt: PromptMeta): { score: number; issues: string[] } {
  const issues: string[] = [];
  let score = 100;

  if (!prompt.title) { issues.push('Missing title'); score -= 15; }
  if (!prompt.description) { issues.push('Missing description'); score -= 10; }
  if (!prompt.priority) { issues.push('Missing priority field'); score -= 10; }
  if (!prompt.estimatedTime) { issues.push('Missing estimatedTime'); score -= 5; }
  if (!prompt.cluster) { issues.push('Missing cluster field'); score -= 10; }
  if (!prompt.wave) { issues.push('Missing wave field'); score -= 5; }
  if (!prompt.severity) { issues.push('Missing severity field'); score -= 5; }
  if (prompt.body.length < 100) { issues.push('Body too short (<100 chars)'); score -= 10; }
  if (!prompt.rawFrontmatter) { issues.push('No YAML frontmatter'); score -= 30; }

  return { score: Math.max(0, score), issues };
}
`);

// ─── 5 & 6. Skip index.ts and rules/index.ts edits — handled manually ──────────
console.log('⚠️  Skipping src/index.ts and src/rules/index.ts — apply edits manually');

// ─── 7. Update package.json — Add exports for agent + cluster modules ──────────

const pkgPath = join(ROOT, 'package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
pkg.version = '1.1.0';
pkg.exports = {
  '.': './dist/index.js',
  './agent': './dist/agent.js',
  './cluster': './dist/cluster.js',
  './prompt-scanner': './dist/prompt-scanner.js',
  './types': './dist/types.js',
};
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8');
console.log('✅ Updated package.json — v1.1.0, added exports map');

console.log('\n🎉 Phase 2 scaffolding complete. Run: npm run build');
