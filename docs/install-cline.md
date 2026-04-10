# Install — Cline

[Cline](https://cline.bot) is an autonomous coding agent VS Code extension with native MCP, custom instructions, and workflow files. UltraThink integrates through Cline's `.clinerules` file and MCP marketplace.

## What Works

- MCP servers via Cline's MCP settings
- Custom instructions via `.clinerules` at the project root
- Cline workflows that reference UltraThink skills
- Memory Bank-style persistence (Cline's own system — complements UltraThink's vault)
- Dashboard (standalone web UI)

## What Doesn't Work

- Lifecycle hooks (Cline has its own plan/act loop — not programmable)
- UltraThink `.claude/hooks/` (use Cline's custom commands instead)
- Auto-trigger on prompt submit (Cline's autonomous planner picks context)

## Setup

```bash
git clone https://github.com/InugamiDev/ultrathink-oss.git ~/ultrathink
cd ~/ultrathink
./scripts/setup.sh
```

Install the Cline extension from the VS Code Marketplace.

### 1. Project Rules

Create `.clinerules` at the project root (Cline reads this on every task):

```bash
cat > .clinerules << 'EOF'
This project uses UltraThink. See AGENTS.md for the full agent instructions.

Core rules:
- Use VFS (mcp__vfs__extract) before reading any source file — 60-98% token savings
- Follow skill workflows in .claude/skills/<name>/SKILL.md when tasks match
- Check .claude/skills/_registry.json for the skill index
- TypeScript strict mode, no `any`
- Parameterized SQL only
- Read before write — always check existing files before modifying
EOF
```

Or symlink UltraThink's `AGENTS.md`:

```bash
ln -sf AGENTS.md .clinerules
```

### 2. MCP Servers

Open Cline → **MCP Servers** → **Installed** → **Configure MCP Servers**. Add:

```json
{
  "mcpServers": {
    "vfs": {
      "command": "vfs",
      "args": ["mcp"],
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

Cline will pick up the server after a reload (`Cmd+Shift+P` → "Developer: Reload Window").

### 3. Workflows (optional)

Cline supports `.clinerules/workflows/*.md` for reusable task templates. You can create workflows that invoke UltraThink skills:

```bash
mkdir -p .clinerules/workflows
cat > .clinerules/workflows/build-feature.md << 'EOF'
# Build a feature

1. Use VFS to map the area you'll be editing
2. Read .claude/skills/gsd/SKILL.md and follow its plan → execute → verify cycle
3. After implementation, run the relevant tests
4. Summarize changes in a single paragraph
EOF
```

Trigger with `/build-feature` in the Cline chat.

### 4. Dashboard

```bash
cd ~/ultrathink/dashboard
pnpm dev
# Open http://localhost:3333
```

## Memory Bank Compatibility

Cline has its own Memory Bank feature that writes markdown files to your repo. UltraThink's Obsidian vault (`~/.ultrathink/vault/`) lives outside the repo, so they don't conflict. Use:

- **Cline Memory Bank** — per-project working context Cline manages itself
- **UltraThink vault** — global second brain editable in Obsidian

## Troubleshooting

- **Rules not loading**: Ensure the file is `.clinerules` (no extension) at repo root
- **MCP server missing**: Check the MCP servers panel; test `vfs mcp` in a terminal first
- **Task loop stuck**: Use Cline's `plan` mode to review steps before it acts

## References

- [Cline docs](https://docs.cline.bot/)
- [Cline MCP marketplace](https://docs.cline.bot/mcp-servers/mcp-marketplace)
- [Cline custom instructions](https://docs.cline.bot/features/custom-instructions)
