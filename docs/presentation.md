# UltraThink OSS

### A Workflow OS for AI Editors

---

## What is UltraThink?

UltraThink turns Claude Code from a chatbot into an **intelligent agent** with:

- **43 active skills** across 4 layers (340+ archived, zero token cost)
- **19 lifecycle hooks** — privacy, quality, observability
- **Prompt analyzer** — auto-triggers skills by intent detection
- **Observability dashboard** — Next.js 15, port 3333
- **Token-optimized** — lean by default, full power on demand

---

## Architecture: 4-Layer Skill Mesh

```
┌─────────────────────────────────────────┐
│           ORCHESTRATORS (8)             │
│  cook · ship · gsd-verify · ut-chain   │
├─────────────────────────────────────────┤
│              HUBS (12)                  │
│  plan · debug · refactor · test · scout│
├─────────────────────────────────────────┤
│           UTILITIES (10)                │
│  fix · verify · quality-gate · commit  │
├─────────────────────────────────────────┤
│        DOMAIN SPECIALISTS (13)          │
│  react · nextjs · tailwind · typescript│
└─────────────────────────────────────────┘
```

Skills link via `linksTo`/`linkedFrom` edges in `_registry.json`.
The prompt analyzer scores skills and injects the **top 5** as context — every prompt gets the right tools automatically.

---

## How Auto-Trigger Works

```
User types: "build a react component with hooks and write tests"
                          │
                          ▼
              ┌──────────────────┐
              │  Prompt Analyzer  │
              │  (TypeScript)     │
              └────────┬─────────┘
                       │ scores 53 skills
                       ▼
          ┌─────────────────────────┐
          │  Top 5 skills matched:  │
          │  1. react      (score 8)│
          │  2. test       (score 6)│
          │  3. typescript (score 4)│
          │  4. cook       (score 3)│
          │  5. fix        (score 2)│
          └─────────────────────────┘
                       │
                       ▼
           Skill SKILL.md content
           injected as additionalContext
```

**Intent categories**: build · debug · refactor · explore · deploy · test · design · plan
Each category boosts relevant domain skills. Graph traversal follows 1-hop `linksTo` edges.

---

## Hook Pipeline

Every interaction passes through the full hook lifecycle:

```
User types a prompt
  │
  ├─ SessionStart ── memory recall + preference loading
  │
  ├─ PromptSubmit ── skill scoring → top 5 injected as context
  │
  ├─ PreToolUse ─── privacy check (block .env, creds, keys)
  │
  ├─ PostToolUse ── format check + quality gate + observe
  │
  └─ Stop ───────── memory flush + session close
```

### Privacy Hook

The privacy hook runs **before** Claude reads any file:

| File | Result |
|------|--------|
| `.env` | **BLOCKED** |
| `secrets.json` | **BLOCKED** |
| `*.pem` / `*.key` | **BLOCKED** |
| `.env.example` | Allowed |
| `src/index.ts` | Allowed |

Patterns are configurable. All decisions are logged for audit.

---

## Token Optimization

The #1 source of token waste in Claude Code is **skills loaded into the system prompt every turn**.

UltraThink OSS ships lean:

| Metric | Before | After | Savings |
|--------|--------|-------|---------|
| Active skills | 370+ | 43 | **88%** |
| Registry entries | 140 (88KB) | 53 (26KB) | **70%** |
| Prompt analyzer | 1758 lines | 1209 lines | **31%** |
| Domain signals | ~70 | 7 | **90%** |
| Plugins enabled | 12 | 1 | **92%** |

### How it works

- **Active skills** live in `.claude/skills/<name>/SKILL.md` — loaded into context
- **Archived skills** live in `.claude/skills/_archive/<name>/` — **zero token cost**
- Restore any skill instantly: `mv .claude/skills/_archive/docker .claude/skills/docker`
- The `plugins` skill provides on-demand enable/disable for 11 plugins

---

## Superpowers Integration

[obra/superpowers](https://github.com/obra/superpowers) workflow skills are merged into the auto-trigger engine. No slash commands needed — they fire automatically:

| Skill | What it does |
|-------|-------------|
| `test-driven-development` | RED → GREEN → REFACTOR enforcement |
| `systematic-debugging` | 4-phase root-cause analysis |
| `brainstorming` | Socratic design before coding |
| `writing-plans` | Structured task decomposition |
| `executing-plans` | Plan execution with checkpoints |
| `subagent-driven-development` | Two-stage review (spec → quality) |
| `dispatching-parallel-agents` | Concurrent subagent orchestration |
| `verification-before-completion` | Post-implementation validation |
| `sequential-thinking` | Step-by-step reasoning |

---

## Observability Dashboard

Next.js 15 + Tailwind v4 on **port 3333**:

| Page | URL | Purpose |
|------|-----|---------|
| Home | `/` | Health cards, system status |
| Skills | `/skills` | Skill catalog + dependency graph |
| Memory | `/memory` | Memory browser with search |
| Kanban | `/kanban` | Task board |
| Plans | `/plans` | Plan registry |
| Analytics | `/analytics` | Usage charts + token tracking |
| Hooks | `/hooks` | Privacy event log |
| Testing | `/testing` | UI test reports |
| Settings | `/settings` | Config editor |

```bash
npm run dashboard:dev
# → http://localhost:3333
```

---

## What Ships in the Box

```
.claude/
├── skills/          43 active skills + _archive/ (340+)
├── hooks/           19 lifecycle hooks (prompt, edit, session)
├── references/      Behavioral rules (quality, privacy, teaching)
├── commands/        Custom slash commands
└── settings.json    Configuration

memory/              Postgres-backed persistent memory
dashboard/           Next.js 15 observability UI
tests/               Vitest test suite
scripts/             Setup + utilities
```

---

## Get Started

```bash
git clone https://github.com/InugamiDev/ultrathink-oss
cd ultrathink-oss
./scripts/setup.sh
claude
```

That's it. Claude Code is now UltraThink.

---

**github.com/InugamiDev/ultrathink-oss**
