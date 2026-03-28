# Editor Setup Guide

Step-by-step setup for each supported AI code editor.

---

## Table of Contents

- [Claude Code (Full Integration)](#claude-code-full-integration)
- [Cursor](#cursor)
- [Windsurf](#windsurf)
- [Antigravity (Google)](#antigravity-google)
- [GitHub Copilot](#github-copilot)
- [Syncing Editor Configs](#syncing-editor-configs)
- [Feature Compatibility](#feature-compatibility)
- [Constraints & Workarounds](#constraints--workarounds)

---

## Claude Code (Full Integration)

Claude Code is UltraThink's primary target. Every feature works: hooks, auto-trigger, memory, privacy guards, quality gates, statusline, and MCP servers.

### Prerequisites

- Node.js 18+
- Claude Code CLI: `npm install -g @anthropic-ai/claude-code`
- Neon Postgres account (free tier): [neon.tech](https://neon.tech)

### Step 1: Clone and setup

```bash
git clone https://github.com/InugamiDev/ultrathink-oss.git
cd ultrathink-oss
./scripts/setup.sh
```

This installs dependencies, creates `.env`, and runs migrations (if `DATABASE_URL` is set).

### Step 2: Configure database

```bash
# Edit .env with your Neon connection string
DATABASE_URL=postgresql://user:pass@your-host.neon.tech/neondb?sslmode=require
```

Then run migrations:

```bash
npm run migrate
```

### Step 3: Install globally

```bash
./scripts/init-global.sh
```

This symlinks into `~/.claude/`:
- **Skills** — 43 active SKILL.md files (340+ archived) → `~/.claude/skills/`
- **Registry** — `_registry.json` → `~/.claude/skills/_registry.json`
- **References** — Behavioral rules → `~/.claude/references/`
- **Agents** — 10 agent definitions → `~/.claude/agents/`
- **Hooks** — 6 lifecycle hooks → `~/.claude/hooks/` (prefixed with `ultrathink-`)
- **CLAUDE.md** — Appends UltraThink section to `~/.claude/CLAUDE.md`
- **settings.json** — Merges hook matchers (SessionStart, Stop, PreToolUse, PostToolUse, PreCompact)

### Step 4: Verify

```bash
claude
# You should see the UltraThink statusline
# Try: "what skills are available for React?"
```

### Step 5: Start the dashboard

```bash
npm run dashboard:dev
# Open http://localhost:3333
```

### What you get

| Feature | How it works |
|---------|-------------|
| **Auto-trigger** | Every prompt is scored against 43 active skills (<30ms). Top 5 inject context automatically |
| **Memory** | Decisions, patterns, preferences persist across sessions via Neon Postgres |
| **Privacy hooks** | `.env`, `.pem`, credentials blocked before Claude sees them |
| **Quality gates** | Auto-format (Biome/Prettier), JSON validation, shell syntax check on every edit |
| **Statusline** | 3-line display: model, context %, API quotas, active skills, hook activity |
| **Skill graph** | Skills link via `linksTo` — when `react` fires, `nextjs` and `tailwindcss` follow |
| **Dashboard** | 18 pages: memory browser, skill mesh, hook stats, usage tracking, kanban |

### Uninstall

```bash
./scripts/init-global.sh --uninstall
```

---

## Cursor

Cursor gets project rules via `.cursor/rules/*.mdc` files. Skills are available as read-only reference files.

### What works

- Project conventions and code standards injected into every chat
- Cursor can read SKILL.md files when you reference them by path
- Dashboard runs independently (port 3333)
- MCP servers (VFS) work if configured in `.mcp.json`

### What doesn't work

- No hooks (Cursor doesn't support lifecycle hooks)
- No auto-trigger (skills don't fire automatically)
- No persistent memory (no cross-session state)
- No privacy guards (no file access blocking)
- No quality gates (no auto-format on edit)
- No statusline

### Setup

```bash
git clone https://github.com/InugamiDev/ultrathink-oss.git
cd ultrathink-oss
npm install && cd dashboard && npm install && cd ..

# Generate Cursor rules (or run --all for all editors)
./scripts/sync-editors.sh --cursor
```

This creates 4 rule files:

| File | Scope | What it does |
|------|-------|-------------|
| `.cursor/rules/ultrathink.mdc` | Always on | Project identity, tech stack, code standards, key paths |
| `.cursor/rules/skills.mdc` | Always on | How to find and use skills from the registry |
| `.cursor/rules/dashboard.mdc` | `dashboard/**` | Dashboard-specific rules (Next.js 15, Tailwind v4, design tokens) |
| `.cursor/rules/memory.mdc` | `memory/**` | Memory system rules (Neon Postgres, parameterized queries) |

### Using skills in Cursor

Skills don't auto-trigger. Instead, tell Cursor to read them:

```
Read .claude/skills/react/SKILL.md and follow its workflow to build this component.
```

Or reference the registry:

```
Check .claude/skills/_registry.json for skills that match "authentication",
then read the matching SKILL.md and follow its steps.
```

### MCP servers

If you use Cursor's MCP support, the `.mcp.json` at the project root configures VFS (Virtual Function Signatures) for token-efficient code analysis.

---

## Windsurf

Windsurf gets a single rule file via `.windsurf/rules/ultrathink.md`.

### What works

- Project conventions injected via Cascade
- Cascade can read SKILL.md files from file context
- Dashboard runs independently
- MCP servers work if Windsurf supports them

### What doesn't work

- No hooks, no auto-trigger, no memory, no privacy guards, no quality gates, no statusline

### Setup

```bash
git clone https://github.com/InugamiDev/ultrathink-oss.git
cd ultrathink-oss
npm install && cd dashboard && npm install && cd ..

./scripts/sync-editors.sh --windsurf
```

This creates `.windsurf/rules/ultrathink.md` with project identity, tech stack, code standards, and Windsurf-specific tips for using Cascade's file context.

### Using skills in Windsurf

Same as Cursor — reference skills manually:

```
Read the skill file at .claude/skills/debug/SKILL.md and use its systematic debugging workflow.
```

---

## Antigravity (Google)

Antigravity reads `GEMINI.md` at the project root for project-level instructions.

### What works

- Project conventions via GEMINI.md
- Includes a skill lookup table (task → skill → trigger)
- Dashboard runs independently

### What doesn't work

- No hooks, no auto-trigger, no memory, no privacy guards, no quality gates, no statusline
- No MCP server support

### Setup

```bash
git clone https://github.com/InugamiDev/ultrathink-oss.git
cd ultrathink-oss
npm install && cd dashboard && npm install && cd ..

./scripts/sync-editors.sh --antigravity
```

This creates/updates `GEMINI.md` with project rules and a quick-reference skill table:

| Task | Skill | Trigger |
|------|-------|---------|
| Build a feature | `gsd` | "/gsd", "build", "implement" |
| Debug an issue | `debug` | "/debug", "fix this", "why is" |
| Write tests | `test` | "/test", "write tests" |
| Plan architecture | `plan` | "/plan", "how should we" |
| UI design | `ui-design-pipeline` | "/design-pipeline", "design a page" |
| Code review | `code-review` | "/review", "review this" |
| Optimize perf | `optimize` | "/optimize", "make it faster" |

### Using skills in Antigravity

Reference skills by path and ask the model to follow the workflow:

```
Open .claude/skills/nextjs/SKILL.md and follow its workflow for this task.
```

---

## GitHub Copilot

Copilot gets project rules via `.github/copilot-instructions.md`.

### What works

- Basic project conventions (code standards, tech stack)
- Dashboard runs independently

### What doesn't work

- No file reading during conversation (Copilot Chat can't read arbitrary files)
- No hooks, no auto-trigger, no memory, no privacy guards, no quality gates, no statusline
- No MCP servers
- Skills are not accessible (Copilot can't read SKILL.md files on demand)

### Setup

```bash
git clone https://github.com/InugamiDev/ultrathink-oss.git
cd ultrathink-oss
npm install && cd dashboard && npm install && cd ..

./scripts/sync-editors.sh --copilot
```

This creates `.github/copilot-instructions.md` with project identity, tech stack, code standards, and key paths.

### Constraints

Copilot is the most limited integration. It receives project rules but cannot access skills, memory, or any dynamic features. For full UltraThink capabilities, use Claude Code.

---

## Syncing Editor Configs

The `sync-editors.sh` script regenerates all editor config files from `CLAUDE.md` as the single source of truth.

```bash
# Sync all editors at once
./scripts/sync-editors.sh --all

# Sync specific editors
./scripts/sync-editors.sh --cursor
./scripts/sync-editors.sh --windsurf
./scripts/sync-editors.sh --antigravity
./scripts/sync-editors.sh --copilot
```

**When to re-sync:**
- After modifying `CLAUDE.md`
- After adding/removing skills from `_registry.json`
- After changing code standards or conventions
- After upgrading UltraThink (pull latest, then re-sync)

**Generated files:**

| Editor | Files | Source |
|--------|-------|--------|
| Cursor | `.cursor/rules/ultrathink.mdc`, `skills.mdc`, `dashboard.mdc`, `memory.mdc` | `CLAUDE.md` + inline templates |
| Windsurf | `.windsurf/rules/ultrathink.md` | `CLAUDE.md` + Windsurf tips |
| Antigravity | `GEMINI.md` | `CLAUDE.md` + skill table |
| Copilot | `.github/copilot-instructions.md` | `CLAUDE.md` (stripped) |

---

## Feature Compatibility

### Full comparison

| Feature | Claude Code | Cursor | Windsurf | Antigravity | Copilot |
|---------|:-----------:|:------:|:--------:|:-----------:|:-------:|
| Project rules (code standards) | Full | Full | Full | Full | Full |
| Dashboard (observability UI) | Full | Full | Full | Full | Full |
| Skills (43 active + 340+ archived) | Auto | Manual | Manual | Manual | — |
| Skill graph traversal (linksTo) | Auto | — | — | — | — |
| Auto-trigger (intent scoring) | Full | — | — | — | — |
| Memory (cross-session) | Full | — | — | — | — |
| Hooks (lifecycle events) | Full | — | — | — | — |
| Privacy guard (file blocking) | Full | — | — | — | — |
| Quality gates (auto-format) | Full | — | — | — | — |
| Statusline (context %, quota) | Full | — | — | — | — |
| Agent definitions | Full | — | — | — | — |
| MCP servers (VFS) | Full | Partial | Partial | — | — |
| Slash commands (/usage, etc.) | Full | — | — | — | — |

### Why the gaps?

UltraThink's most powerful features rely on **Claude Code hooks** — lifecycle events that fire shell scripts at specific moments (session start, prompt submit, tool use, etc.). No other editor currently supports this hook system.

| Feature | Requires |
|---------|---------|
| Auto-trigger | `UserPromptSubmit` hook → `prompt-analyzer.ts` |
| Memory recall | `SessionStart` hook → `memory-session-start.sh` |
| Memory flush | `Stop` hook → `memory-session-end.sh` |
| Privacy guard | `PreToolUse` hook → `privacy-hook.sh` |
| Quality gates | `PostToolUse` hook → `post-edit-quality.sh` |
| Statusline | `SessionStart` hook → `statusline.sh` |

Until other editors add hook-equivalent APIs, these features are Claude Code exclusive.

---

## Constraints & Workarounds

### For Cursor / Windsurf / Antigravity users

**No auto-trigger** — Skills don't fire automatically. Workaround: manually reference skills in your prompts.

```
Before implementing, read .claude/skills/_registry.json and find skills matching
"react" and "testing". Read their SKILL.md files and follow the workflows.
```

**No memory** — Decisions and patterns don't persist. Workaround: use the dashboard to manually browse past sessions (if you also use Claude Code) or maintain a project-level notes file.

**No privacy guard** — The editor can read any file. Workaround: use `.gitignore` and editor-level file exclusions to hide sensitive files from context.

**No quality gates** — No auto-format on edit. Workaround: configure your editor's built-in formatter (Prettier, Biome) and format-on-save.

### For GitHub Copilot users

**No skill access** — Copilot Chat can't read arbitrary project files during conversation. Workaround: paste relevant SKILL.md content into the chat when needed, or switch to a different editor for complex tasks.

### Multi-editor workflow

Many developers use multiple editors. A practical setup:

1. **Claude Code** for complex tasks (architecture, debugging, multi-file refactors) — gets full UltraThink
2. **Cursor/Windsurf** for day-to-day coding — gets project rules and manual skill access
3. **Dashboard** always available at `http://localhost:3333` regardless of editor

Keep configs in sync:

```bash
# After any CLAUDE.md change:
./scripts/sync-editors.sh --all
```
