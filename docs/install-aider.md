# Install — Aider

[Aider](https://aider.chat) is a terminal-based AI pair programmer. It doesn't have native MCP support, but it respects `AGENTS.md` and `CONVENTIONS.md` files for project rules. UltraThink integrates as a **rules-only** layer.

## What Works

- Project conventions via `CONVENTIONS.md` or `AGENTS.md`
- Read-only skill references (Aider can read SKILL.md files)
- Dashboard (standalone web UI)
- UltraThink CLI commands run from the terminal alongside Aider

## What Doesn't Work

- MCP servers (Aider has no MCP client — track [aider#2252](https://github.com/Aider-AI/aider/issues/2252))
- Lifecycle hooks (Aider has no hook system)
- Auto-trigger on prompt submit
- Memory auto-loading (run `memory-runner.ts session-start` manually)

## Setup

```bash
git clone https://github.com/InugamiDev/ultrathink-oss.git ~/ultrathink
cd ~/ultrathink
./scripts/setup.sh

# Install Aider
python -m pip install aider-install
aider-install
```

### 1. Project Conventions

Aider reads `CONVENTIONS.md` when you pass it with `--read`. Point it at UltraThink's `AGENTS.md`:

```bash
./scripts/sync-editors.sh --codex   # generates AGENTS.md

# Run Aider with conventions loaded
aider --read AGENTS.md
```

Or add to `.aider.conf.yml` at the project root:

```yaml
read:
  - AGENTS.md
  - .claude/references/core.md
```

Now every Aider session starts with UltraThink's core rules preloaded.

### 2. Adding Skill Files On Demand

When a task matches a skill, load its SKILL.md into the chat:

```
/read .claude/skills/react/SKILL.md
```

Aider will keep it in context until you `/drop` it.

### 3. Running UltraThink Tools Alongside Aider

Because Aider doesn't support MCP, use VFS from a separate terminal pane:

```bash
# Terminal 1: Aider
aider --read AGENTS.md

# Terminal 2: VFS lookups
vfs extract src/auth.ts        # get signatures
vfs search src/ --query "login"
```

Paste the VFS output into Aider's chat when needed.

### 4. Memory Commands (manual)

Without hooks, run memory operations manually:

```bash
# Start of session
npx tsx memory/scripts/memory-runner.ts session-start

# Search during work
npx tsx memory/scripts/memory-runner.ts search "neon postgres"

# Save after
npx tsx memory/scripts/memory-runner.ts save "decision text" knowledge 7

# Flush pending
npx tsx memory/scripts/memory-runner.ts flush
```

### 5. Dashboard

```bash
cd ~/ultrathink/dashboard
pnpm dev
# Open http://localhost:3333
```

## Troubleshooting

- **`--read` file not loaded**: Check `aider --help` to confirm syntax; Aider may have changed flag names between versions
- **Conventions not applied**: Aider only applies conventions when the file is explicitly `--read`; without `.aider.conf.yml` you must pass it every time

## References

- [Aider docs](https://aider.chat/docs/)
- [Aider conventions](https://aider.chat/docs/usage/conventions.html)
- [Aider config file](https://aider.chat/docs/config/aider_conf.html)
