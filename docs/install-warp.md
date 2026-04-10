# Install — Warp

Warp is an AI-native terminal with built-in Agent Mode and native MCP support. UltraThink runs inside Warp via Claude Code or Codex, and Warp Agents can consume UltraThink's MCP servers directly.

## What Works

- MCP servers via Warp Drive → MCP settings
- Running Claude Code / Codex inside Warp (full UltraThink features)
- Warp Agent Mode using UltraThink's MCP tools
- Warp Rules files for project conventions
- Dashboard (standalone web UI)

## What Doesn't Work

- Warp-native hooks (no PreToolUse equivalent — use Claude Code's hooks instead)
- Auto-trigger prompts (Warp Agent decides its own skill loading)

## Setup

```bash
git clone https://github.com/InugamiDev/ultrathink-oss.git ~/ultrathink
cd ~/ultrathink
./scripts/setup.sh
./scripts/init-global.sh   # installs UltraThink to ~/.claude/
```

### 1. Project Rules for Warp Agent

Warp Agent reads project-level rules from `WARP.md` at the project root. UltraThink ships `AGENTS.md` which Warp will also detect:

```bash
./scripts/sync-editors.sh --codex   # generates AGENTS.md
ln -sf AGENTS.md WARP.md            # optional: Warp-specific name
```

### 2. MCP Servers

Open Warp → **Settings** → **AI** → **MCP Servers** → **Add Server**. Use either the UI or add to your Warp config:

```json
{
  "mcpServers": {
    "vfs": {
      "command": "vfs",
      "args": ["mcp"]
    }
  }
}
```

Toggle the server on. Warp Agent will now have access to VFS tools.

### 3. Running Claude Code inside Warp

UltraThink's full feature set (hooks, skills, memory, auto-trigger) runs through Claude Code. Install it and use it from a Warp tab:

```bash
npm install -g @anthropic-ai/claude-code
cd ~/your-project
claude-code
```

All UltraThink hooks, skills, and MCP servers load automatically from `~/.claude/`.

### 4. Dashboard

```bash
cd ~/ultrathink/dashboard
pnpm dev
# Open http://localhost:3333
```

## Using Warp Agent with UltraThink

- **Agent Mode** (`Cmd+Shift+I`) — Ask questions; Warp Agent uses VFS + project rules
- **Skill references** — *"Follow .claude/skills/debug/SKILL.md to fix this test"*
- **Terminal workflows** — Run `npx tsx memory/scripts/memory-runner.ts search "neon"` directly in a Warp pane

## Troubleshooting

- **MCP server won't start**: Test the binary manually (`vfs mcp`), check Warp → Settings → AI → MCP logs
- **WARP.md ignored**: File must be at repo root; check Warp logs for rule loading
- **Agent Mode feels slow**: Limit concurrent MCP servers or disable autonomy for faster iteration

## References

- [Warp Agent Mode](https://docs.warp.dev/agents/agent-mode)
- [Warp MCP integration](https://docs.warp.dev/agents/mcp)
