# Install — Zed

Zed has first-class agent support via the Agent Client Protocol (ACP) and native MCP integration, plus its own Assistant panel with slash commands and rules files.

## What Works

- MCP servers (native support via `context_servers` in `settings.json`)
- Project rules via `.rules` file at project root
- Agent Client Protocol — run external agents (Claude Code, Gemini, Codex) inside Zed
- Dashboard (standalone web UI)
- Skill awareness (read SKILL.md files when referenced)

## What Doesn't Work

- Lifecycle hooks (no PreToolUse/PostToolUse — use ACP agent's own hooks)
- UltraThink's `.claude/hooks/` (Zed doesn't execute them directly)
- Auto-trigger prompts (use Zed's `/` slash commands instead)

## Setup

```bash
git clone https://github.com/InugamiDev/ultrathink-oss.git ~/ultrathink
cd ~/ultrathink
./scripts/setup.sh
```

### 1. Project Rules

Zed reads `.rules` (or `AGENTS.md`) at the project root. UltraThink generates `AGENTS.md` already:

```bash
./scripts/sync-editors.sh --codex   # generates AGENTS.md
```

Zed will automatically surface `AGENTS.md` as context for the Assistant panel.

### 2. MCP Servers

Add UltraThink's MCP servers to `~/.config/zed/settings.json`:

```json
{
  "context_servers": {
    "vfs": {
      "command": {
        "path": "vfs",
        "args": ["mcp"],
        "env": {}
      }
    }
  }
}
```

Reload Zed (`Cmd+Shift+P` → "zed: reload").

### 3. Running UltraThink Agents via ACP

Zed supports external agents through the Agent Client Protocol. To run Claude Code inside Zed:

```json
{
  "agent_servers": {
    "Claude Code": {
      "command": "claude-code",
      "args": ["--acp"],
      "env": {}
    }
  }
}
```

Then open the Assistant panel (`Cmd+?`) and pick "Claude Code" from the agent selector. Claude Code will load UltraThink's skills, memory, and hooks as if it were running in a terminal.

### 4. Dashboard

```bash
cd ~/ultrathink/dashboard
pnpm dev
# Open http://localhost:3333
```

## Manual Skill Use

Zed's Assistant can read skill files on demand:

```
Read .claude/skills/react/SKILL.md and follow its workflow for this component.
```

## Troubleshooting

- **MCP server not loading**: Check `View` → `Debug Log`, filter for `context_server`
- **AGENTS.md ignored**: Ensure it's at the project root, not in a subdirectory
- **Agent Client Protocol errors**: Update Zed to the latest stable channel

## References

- [Zed Agent Panel docs](https://zed.dev/docs/ai/agent-panel)
- [Agent Client Protocol](https://agentclientprotocol.com/)
- [Zed MCP context servers](https://zed.dev/docs/ai/mcp)
