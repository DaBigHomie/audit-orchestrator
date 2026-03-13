/**
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
