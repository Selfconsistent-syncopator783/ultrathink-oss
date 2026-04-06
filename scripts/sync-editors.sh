#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────
# UltraThink — Cross-Editor Sync
# Generates config files for Cursor, Windsurf, Antigravity, Copilot, and Codex
# from UltraThink's CLAUDE.md and skill registry.
#
# Usage: ./scripts/sync-editors.sh [--all | --cursor | --windsurf | --antigravity | --copilot | --codex]
# ──────────────────────────────────────────────────────────────────
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(dirname "$SCRIPT_DIR")"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${BLUE}[sync]${NC} $*"; }
ok()  { echo -e "${GREEN}[ok]${NC}   $*"; }

# Default: sync all
TARGETS="${1:---all}"

# ── Read CLAUDE.md ───────────────────────────────────────────────
CLAUDE_MD="$ROOT/CLAUDE.md"
if [[ ! -f "$CLAUDE_MD" ]]; then
  echo "Error: CLAUDE.md not found at $CLAUDE_MD"
  exit 1
fi

# ── Core instructions (shared across all editors) ────────────────
# Extract the essential parts of CLAUDE.md for other editors
generate_core_instructions() {
  cat << 'CORE'
# UltraThink — Workflow OS for AI Code Editors

> Persistent memory, 4-layer skill mesh, privacy hooks, and observability dashboard.

## Identity

You are **UltraThink** — an intelligent agent with structured skills, persistent memory,
and a layered architecture for complex engineering tasks.

## Tech Stack

- **Dashboard**: Next.js 15 + Tailwind v4 (port 3333)
- **Database**: Neon Postgres + pgvector + pg_trgm
- **Skills**: 370+ across 4 layers (orchestrator, hub, utility, domain)
- **Memory**: Postgres-backed fuzzy search (tsvector + trigram + ILIKE)
- **Tools**: VFS (AST signatures) via MCP

## Skill System

Skills are in `.claude/skills/[name]/SKILL.md`. Each skill has:
- Triggers (keywords that activate it)
- Inputs/outputs
- Step-by-step workflow instructions
- Links to related skills

When a task matches a skill's triggers, read and follow its SKILL.md.

## Key Paths

| Area | Path |
|------|------|
| Skills | `.claude/skills/[name]/SKILL.md` |
| References | `.claude/references/*.md` |
| Memory | `memory/` |
| Dashboard | `dashboard/` |

## Code Standards

- TypeScript strict mode, no `any`
- React: functional components, hooks, server components where possible
- CSS: Tailwind v4 with CSS custom properties for design tokens
- SQL: Parameterized queries only, no string interpolation
- Tests: Vitest for unit, Playwright for E2E
- Git: Conventional commits, no force push

## References (read on demand)

- `.claude/references/core.md` — Response patterns, skill selection, error handling
- `.claude/references/memory.md` — Memory read/write discipline
- `.claude/references/privacy.md` — File access control, sensitivity levels
- `.claude/references/quality.md` — Code standards, review checklist
CORE
}

generate_codex_instructions() {
  cat << 'CODEX'
# UltraThink Agent Instructions

## Identity

You are **UltraThink** running inside Codex. Use this repository's Claude-native assets as
the source of truth for skills, references, memory, and code intelligence.

## Codex Runtime Mapping

- `AGENTS.md` is the Codex entrypoint for repo behavior and operating rules
- `.claude/skills/[name]/SKILL.md` contains the full UltraThink skill workflows
- `.claude/skills/_registry.json` maps triggers, layers, and related skills
- `.claude/references/*.md` contains on-demand reference material
- `.claude/agents/*.md` defines specialist roles and handoff expectations
- `.mcp.json` defines the repo's MCP servers; inspect it carefully and never echo secrets
- `.claude/hooks/*.sh` documents Claude-specific automation; in Codex, emulate the intent
  manually when native hook parity is not available
CODEX

  if [[ -d "$ROOT/code-intel" ]]; then
    cat << 'CODEX'
- `code-intel/` is the local graph/indexing implementation behind the richer code exploration flow
CODEX
  else
    cat << 'CODEX'
- `code-intel/` is intentionally absent in this build; rely on VFS, `rg`, and targeted file reads instead
CODEX
  fi

  cat << 'CODEX'

## Operating Workflow

1. Check `.ckignore` before broad file exploration or search.
2. For non-trivial tasks, identify the relevant skill in `.claude/skills/` and read its `SKILL.md`.
3. Read `.claude/references/*.md` only when the task needs the extra context.
4. Prefer repo-native memory and MCP-backed exploration tools when available; otherwise fall back
   to targeted `rg` searches and minimal file reads.
5. Treat Claude-only features such as statusline and hook orchestration as design intent, not
   guaranteed runtime behavior in Codex.

## Memory Protocol

1. Read before write — check existing memories for context before creating new ones
2. Selective persistence — only write memories with lasting value (decisions, patterns, blockers)
3. Tag appropriately — use project, file, and category scopes
4. Confidence ratings — score 0.0–1.0 based on how verified the information is

### Memory Commands

- Search: `npx tsx memory/scripts/memory-runner.ts search "query"`
- Save: `npx tsx memory/scripts/memory-runner.ts save "content" "category" importance`
- Flush: `npx tsx memory/scripts/memory-runner.ts flush`

## Privacy Protocol

1. Check `.ckignore` — never access files matching ignore patterns without explicit approval
2. No secrets in output — never echo API keys, tokens, credentials, or `.mcp.json` env values
3. Log access — keep file access visible through tool traces and concise progress updates
4. Ask before accessing — sensitive paths require user confirmation

## Quality Protocol

1. Read before modify — always read existing code before suggesting changes
2. Minimal diff — make the smallest change that solves the problem
3. No hallucination — if unsure, search or ask rather than guessing
4. Test verification — verify changes work before marking complete

## Codex-Specific Execution

- Use `.claude/skills/_registry.json` to find matching skills when the task is ambiguous
- Use `.claude/agents/*.md` as role guides when the task maps to planner, debugger, reviewer, etc.
- Use `.mcp.json` as the source of truth for available repo tooling in the current build
CODEX

  if [[ -d "$ROOT/code-intel" ]]; then
    cat << 'CODEX'
- Use `code-intel/` and `npm run codeintel:index` when dependency graph or impact analysis is needed
- If MCP is unavailable in the current Codex runtime, fall back to the code-intel CLI, `rg`, and direct repository reads
CODEX
  else
    cat << 'CODEX'
- This build does not ship `code-intel/`; fall back to VFS, `rg`, and direct repository reads for exploration
CODEX
  fi

  cat << 'CODEX'

## Communication Protocol

1. Structured output — use headers, lists, and code blocks for clarity
2. Concise by default — adapt verbosity to the user's coding level
3. Show reasoning — explain non-obvious decisions and tradeoffs
4. Flag uncertainty — clearly mark assumptions and unknowns

## Available Agents

| Agent | Role | Context |
|-------|------|---------|
| planner | Implementation planning | Full project context |
| architect | System design | Architecture patterns |
| code-reviewer | Code review | Changed files + surrounding code |
| debugger | Bug hunting | Error logs + relevant source |
| security-auditor | Security scanning | Full codebase access |
| scout | Codebase exploration | Full codebase access |
| researcher | Deep research | Web + docs access |
| tester | Test generation | Source + test files |
| docs-writer | Documentation | Source + existing docs |
| memory-curator | Memory management | Memory database |

## Agent Handoff

When an agent needs capabilities outside its scope:

1. Complete current analysis with available context
2. Document findings and handoff notes
3. Recommend the appropriate next agent
4. Include any relevant context for the receiving agent
CODEX
}

# ── 1. Cursor (.cursor/rules/) ───────────────────────────────────
sync_cursor() {
  log "Syncing Cursor rules..."
  mkdir -p "$ROOT/.cursor/rules"

  # Main project rules
  cat > "$ROOT/.cursor/rules/ultrathink.mdc" << 'EOF'
---
description: UltraThink project rules and conventions
globs:
alwaysApply: true
---
EOF
  generate_core_instructions >> "$ROOT/.cursor/rules/ultrathink.mdc"
  ok ".cursor/rules/ultrathink.mdc"

  # Skill-aware rule
  cat > "$ROOT/.cursor/rules/skills.mdc" << 'EOF'
---
description: UltraThink skill system — read matching SKILL.md files for task guidance
globs:
alwaysApply: true
---

# Skill System

When working on a task, check if any skill in `.claude/skills/` matches.
Skills contain step-by-step workflows, best practices, and constraints.

To find relevant skills:
1. Look at the task keywords
2. Check `.claude/skills/_registry.json` for matching triggers
3. Read the matching `SKILL.md` file
4. Follow its workflow

Key skills: gsd (task execution), react, nextjs, tailwindcss, debug, test, plan, research-loop, ui-design-pipeline
EOF
  ok ".cursor/rules/skills.mdc"

  # Dashboard rules
  cat > "$ROOT/.cursor/rules/dashboard.mdc" << 'EOF'
---
description: Dashboard development rules
globs: dashboard/**
alwaysApply: false
---

# Dashboard Rules

- Next.js 15 App Router with React 19
- Tailwind CSS v4 (CSS-first config, @theme directive)
- CSS custom properties for all design tokens (--color-*, --space-*)
- No external component libraries — custom components only
- API routes read from Neon Postgres or local filesystem
- Port 3333
EOF
  ok ".cursor/rules/dashboard.mdc"

  # Memory rules
  cat > "$ROOT/.cursor/rules/memory.mdc" << 'EOF'
---
description: Memory system rules
globs: memory/**
alwaysApply: false
---

# Memory System Rules

- TypeScript with strict mode
- Neon Postgres with `postgres` package (not pg)
- 3-tier search: tsvector → pg_trgm → ILIKE with synonym expansion
- All queries parameterized — no string interpolation
- Importance scale 1-10, confidence 0-1
- Read before write — always check existing memories before saving
EOF
  ok ".cursor/rules/memory.mdc"
}

# ── 2. Windsurf (.windsurf/rules/) ──────────────────────────────
sync_windsurf() {
  log "Syncing Windsurf rules..."
  mkdir -p "$ROOT/.windsurf/rules"

  # Main rules
  {
    generate_core_instructions
    cat << 'EOF'

## Windsurf-Specific

- Use Cascade's file context to read skill files when tasks match triggers
- Reference `.claude/skills/_registry.json` for the full skill index
- When modifying dashboard code, always check the existing design tokens in `globals.css`
- For memory operations, read `memory/src/memory.ts` for the API surface
EOF
  } > "$ROOT/.windsurf/rules/ultrathink.md"
  ok ".windsurf/rules/ultrathink.md"
}

# ── 3. Google Antigravity (GEMINI.md) ───────────────────────────
sync_antigravity() {
  log "Syncing Antigravity (GEMINI.md)..."

  {
    generate_core_instructions
    cat << 'EOF'

## Antigravity-Specific

- Skills are in `.claude/skills/[name]/SKILL.md` — same format as Antigravity skills
- The skill registry at `.claude/skills/_registry.json` maps triggers to skills
- MCP servers are configured in `.mcp.json` (VFS for AST signatures)
- Dashboard runs on port 3333: `cd dashboard && npm run dev`
- Memory CLI: `npx tsx memory/scripts/memory-runner.ts <command>`

## Key Skills for Common Tasks

| Task | Skill | Trigger |
|------|-------|---------|
| Build a feature | `gsd` | "/gsd", "build", "implement" |
| Debug an issue | `debug` | "/debug", "fix this", "why is" |
| Write tests | `test` | "/test", "write tests" |
| Plan architecture | `plan` | "/plan", "how should we" |
| UI design | `ui-design-pipeline` | "/design-pipeline", "design a page" |
| Experiment loop | `research-loop` | "/experiment", "iterate until" |
| Code review | `code-review` | "/review", "review this" |
| Optimize perf | `optimize` | "/optimize", "make it faster" |
EOF
  } > "$ROOT/GEMINI.md"
  ok "GEMINI.md"
}

# ── 4. GitHub Copilot (.github/copilot-instructions.md) ─────────
sync_copilot() {
  log "Syncing Copilot instructions..."
  mkdir -p "$ROOT/.github"

  generate_core_instructions > "$ROOT/.github/copilot-instructions.md"
  ok ".github/copilot-instructions.md"
}

# ── 5. Codex (AGENTS.md) ────────────────────────────────────────
sync_codex() {
  log "Syncing Codex instructions..."
  generate_codex_instructions > "$ROOT/AGENTS.md"
  ok "AGENTS.md"
}

# ── Execute ──────────────────────────────────────────────────────
case "$TARGETS" in
  --all)
    sync_cursor
    sync_windsurf
    sync_antigravity
    sync_copilot
    sync_codex
    ;;
  --cursor)     sync_cursor ;;
  --windsurf)   sync_windsurf ;;
  --antigravity) sync_antigravity ;;
  --copilot)    sync_copilot ;;
  --codex)      sync_codex ;;
  *)
    echo "Usage: $0 [--all | --cursor | --windsurf | --antigravity | --copilot | --codex]"
    exit 1
    ;;
esac

echo ""
echo -e "${GREEN}Editor configs synced!${NC}"
echo ""
echo "  Generated files:"
[[ "$TARGETS" == "--all" || "$TARGETS" == "--cursor" ]] && echo "    .cursor/rules/*.mdc     (Cursor)"
[[ "$TARGETS" == "--all" || "$TARGETS" == "--windsurf" ]] && echo "    .windsurf/rules/*.md     (Windsurf)"
[[ "$TARGETS" == "--all" || "$TARGETS" == "--antigravity" ]] && echo "    GEMINI.md                (Antigravity)"
[[ "$TARGETS" == "--all" || "$TARGETS" == "--copilot" ]] && echo "    .github/copilot-instructions.md  (Copilot)"
[[ "$TARGETS" == "--all" || "$TARGETS" == "--codex" ]] && echo "    AGENTS.md                (Codex)"
echo ""
echo "  All editors now share UltraThink's skill system and conventions."
echo ""
