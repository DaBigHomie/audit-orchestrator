---
applyTo: "**"
---

# UGWTF Workflow Management

> Unified GitHub Workflow & Task Framework — handles labels, issues, PRs, CI/CD, and auditing for this repo.
> Package: `@dabighomie/ugwtf` v1.0.0 | Location: `~/management-git/ugwtf/`

---

## Quick Reference

This repo is registered as **`audit-orch`** (`DaBigHomie/audit-orchestrator`) in the UGWTF orchestrator.
Framework: **Node.js**

```bash
# All commands run from the ugwtf directory
cd ~/management-git/ugwtf

# Run with npx tsx (dev) or node dist/index.js (built)
npx tsx src/index.ts <command> [repos...] [flags]
```

---

## Commands

| Command | What It Does | When to Use |
|---------|-------------|-------------|
| `labels` | Sync 23+ universal labels + repo-specific labels | After adding new label definitions |
| `deploy` | Sync labels + deploy CI/CD workflow YAML files | Initial setup or workflow updates |
| `validate` | Run quality gates (tsc, lint, build, config) | Before commits, after major changes |
| `issues` | Detect stalled issues, assign Copilot, auto-triage | When issues pile up or need triage |
| `prs` | Review Copilot PRs, enforce DB migration firewall | When Copilot PRs need processing |
| `audit` | Full audit with scoreboard generation | Weekly health checks |
| `fix` | Auto-fix labels + workflows + quality issues | When audit reveals drift |
| `status` | Quick health snapshot | Anytime |

### Target This Repo Only

```bash
npx tsx src/index.ts issues audit-orch
npx tsx src/index.ts prs audit-orch
npx tsx src/index.ts audit audit-orch --verbose
npx tsx src/index.ts validate audit-orch
npx tsx src/index.ts deploy audit-orch --dry-run
```

### Flags

```
--dry-run        Preview changes without executing
--verbose, -v    Show debug output
--concurrency N  Max parallel repos (default: 3)
--cluster ID     Run specific cluster (repeatable)
```

---

## CI Commands

| Gate | Command |
|------|---------|
| Lint | [TODO: configure] |
| Type-check | `tsc --noEmit` |
| Build | [TODO: configure] |
| E2E | `playwright test --project=chromium-desktop` |

---

## Label System

### How to Label Issues

**Priority** (pick one):
- `priority:p0` — Critical, blocking launch
- `priority:p1` — High, needed before launch
- `priority:p2` — Medium, nice to have
- `priority:p3` — Low, future enhancement

**Automation tier** (pick one):
- `automation:copilot` — Copilot can implement autonomously
- `automation:full` — Fully automated workflow
- `automation:partial` — Agent assists, human decides
- `automation:manual` — Must be done manually

**Status** (applied automatically by agents):
- `automation:in-progress` — Pipeline running
- `automation:completed` — Done successfully
- `agent:copilot` — Assigned to Copilot
- `needs-pr` — Issue needs a pull request
- `stalled` — No activity >48h
- `needs-review` — Awaiting human review

### Creating Issues for Copilot

To have Copilot auto-pick up an issue:

1. Create the issue with labels: `agent:copilot` + `automation:copilot` + `priority:pN`
2. Run: `npx tsx src/index.ts issues audit-orch`
3. The `issue-copilot-assign` agent will assign Copilot and mark `automation:in-progress`

---

## PR Workflow

| Step | Action |
|------|--------|
| Copilot opens PR | Validate with `prs audit-orch` |
| PR is draft | Promote with `prs audit-orch` |
| Tests pass | Merge via GitHub UI (squash merge) |
| Merge | Issues linked via `Closes #N` are auto-closed |

**DB Firewall**: PRs touching migration files require manual approval before merge.

---

## Anti-Patterns

- ❌ Don't assign Copilot manually via GitHub UI — use `npx tsx src/index.ts issues audit-orch`
- ❌ Don't merge PRs that fail the UGWTF validate gate
- ❌ Don't create issues and immediately close them in the same session
- ✅ Always run `validate audit-orch` before marking work complete
