# Install — JetBrains IDEs (IntelliJ / PyCharm / WebStorm / GoLand)

JetBrains ships **Junie** — an autonomous coding agent — as its official AI agent surface. UltraThink integrates through Junie's guideline files and JetBrains' MCP support.

## What Works

- Project guidelines (Junie reads `.junie/guidelines.md`)
- MCP servers via JetBrains AI Assistant settings
- Claude Code plugin (runs Claude Code inside JetBrains via ACP)
- Skill awareness (read SKILL.md files when referenced)
- Dashboard (standalone web UI)

## What Doesn't Work

- Lifecycle hooks (Junie has its own task lifecycle, not programmable)
- UltraThink `.claude/hooks/` (run them from Claude Code plugin instead)
- Auto-trigger on prompt submit (Junie decides its own context)

## Setup

```bash
git clone https://github.com/InugamiDev/ultrathink-oss.git ~/ultrathink
cd ~/ultrathink
./scripts/setup.sh
```

### 1. Junie Guidelines

Junie looks for `.junie/guidelines.md` at the project root. Point it at UltraThink's shared instructions:

```bash
mkdir -p .junie
cat > .junie/guidelines.md << 'EOF'
# Project Guidelines for Junie

This project uses UltraThink. See `AGENTS.md` for the full agent instructions.

Key rules:
- Use VFS (mcp__vfs__extract) before reading any source file
- Follow skill workflows in .claude/skills/<name>/SKILL.md when tasks match
- TypeScript strict mode, no `any`
- Parameterized SQL only
EOF
```

Or symlink directly:

```bash
mkdir -p .junie
ln -sf ../AGENTS.md .junie/guidelines.md
```

### 2. MCP Servers

Open **Settings** → **Tools** → **AI Assistant** → **Model Context Protocol (MCP)**. Add VFS:

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

Restart the IDE.

### 3. Claude Code Plugin (optional, recommended)

Install the **Claude Code** plugin from the JetBrains Marketplace. It runs Claude Code in a side panel and inherits UltraThink's hooks, skills, and memory from `~/.claude/`.

```bash
# Make sure UltraThink is installed globally
./scripts/init-global.sh
```

When the plugin starts, it will auto-load `.claude/settings.json` + `.mcp.json` from the project and `~/.claude/` globals.

### 4. Dashboard

```bash
cd ~/ultrathink/dashboard
pnpm dev
# Open http://localhost:3333
```

## Using Junie with UltraThink

1. Open the Junie panel (`Alt+J` / `Cmd+Option+J`)
2. Ask a question — Junie reads `.junie/guidelines.md` automatically
3. Reference skills explicitly: *"Use the debug skill workflow to find this bug"*
4. Ask Junie to read SKILL.md when deeper context is needed

## Troubleshooting

- **Junie ignores guidelines**: Ensure the file is at `.junie/guidelines.md` exactly (case-sensitive)
- **MCP server missing**: Check AI Assistant → MCP settings, run `vfs mcp` manually to verify the binary works
- **Plugin can't find Claude Code**: Install Claude Code CLI globally first (`npm install -g @anthropic-ai/claude-code`)

## References

- [Junie docs](https://www.jetbrains.com/junie/)
- [JetBrains AI Assistant MCP](https://www.jetbrains.com/help/idea/mcp.html)
- [Claude Code JetBrains plugin](https://plugins.jetbrains.com/plugin/claude-code)
