# Install — Continue.dev

[Continue](https://continue.dev) is an open-source AI code assistant for VS Code and JetBrains. It supports MCP, custom context providers, and rules files.

## What Works

- MCP servers via `~/.continue/config.yaml`
- Project rules via `.continuerules` file
- Custom context providers pointing at UltraThink's skill files
- Dashboard (standalone web UI)

## What Doesn't Work

- Lifecycle hooks (Continue has no PreToolUse equivalent)
- UltraThink `.claude/hooks/` (no runner — use CLI commands manually)
- Auto-trigger on prompt submit

## Setup

```bash
git clone https://github.com/InugamiDev/ultrathink-oss.git ~/ultrathink
cd ~/ultrathink
./scripts/setup.sh
```

### 1. Project Rules

Create `.continuerules` at the project root:

```bash
cat > .continuerules << 'EOF'
This project uses UltraThink. See AGENTS.md for the full agent instructions.

Rules:
- Use VFS (mcp__vfs__extract) before reading source files
- Follow skill workflows in .claude/skills/<name>/SKILL.md when tasks match
- TypeScript strict mode, no `any`
- Parameterized SQL only
EOF
```

Or symlink `AGENTS.md`:

```bash
ln -sf AGENTS.md .continuerules
```

### 2. MCP Servers

Edit `~/.continue/config.yaml`:

```yaml
mcpServers:
  - name: vfs
    command: vfs
    args:
      - mcp
```

Reload Continue (`Cmd+Shift+P` → "Continue: Reload").

### 3. Custom Context Provider (skills)

Add a file context provider so Continue can pull skill files into the chat:

```yaml
contextProviders:
  - provider: file
    params:
      paths:
        - .claude/skills/**/SKILL.md
        - AGENTS.md
```

Now in Continue chat, type `@file` and pick a skill file.

### 4. Dashboard

```bash
cd ~/ultrathink/dashboard
pnpm dev
# Open http://localhost:3333
```

## Manual Skill Use

```
@file .claude/skills/react/SKILL.md

Follow this skill to build the LoginForm component.
```

## Troubleshooting

- **MCP not loading**: Continue logs are in `View` → `Output` → `Continue`
- **Rules ignored**: Ensure `.continuerules` is at the repository root and not in a subdirectory

## References

- [Continue.dev docs](https://docs.continue.dev/)
- [Continue MCP support](https://docs.continue.dev/customize/deep-dives/mcp)
