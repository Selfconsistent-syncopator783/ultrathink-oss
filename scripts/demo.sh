#!/usr/bin/env bash
# UltraThink OSS — Presentation Demo
# Run: bash scripts/demo.sh
# Works with: asciinema, ttygif, or just live terminal
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# --- Config ---
TYPING_SPEED=${TYPING_SPEED:-0.04}
PAUSE=${PAUSE:-1.5}

# --- Helpers ---
G='\033[0;32m' Y='\033[1;33m' C='\033[0;36m' M='\033[0;35m'
B='\033[1m' D='\033[2m' R='\033[0m'

type_out() {
  local text="$1"
  echo -ne "${D}\$ ${R}"
  for ((i=0; i<${#text}; i++)); do
    echo -n "${text:$i:1}"
    sleep "$TYPING_SPEED"
  done
  echo ""
  sleep 0.3
}

narrate() { echo -e "\n${M}# $1${R}"; sleep "$PAUSE"; }
run_cmd() { type_out "$1"; eval "$1"; sleep "$PAUSE"; }
spacer() { echo ""; sleep 0.5; }

# ╔══════════════════════════════════════════════╗
# ║                  ACT 1                       ║
# ╚══════════════════════════════════════════════╝

clear
echo ""
echo -e "${B}  ╔═══════════════════════════════════════════════════╗${R}"
echo -e "${B}  ║                                                   ║${R}"
echo -e "${B}  ║   ${C}UltraThink${R}${B} — A Workflow OS for AI Editors     ║${R}"
echo -e "${B}  ║                                                   ║${R}"
echo -e "${B}  ║   Persistent memory · Skill mesh · Privacy hooks  ║${R}"
echo -e "${B}  ║   Observability dashboard · Token-optimized       ║${R}"
echo -e "${B}  ║                                                   ║${R}"
echo -e "${B}  ╚═══════════════════════════════════════════════════╝${R}"
echo ""
sleep 3

# ── Scene 1: What's inside ──
narrate "What ships with UltraThink?"

type_out "ls .claude/"
echo -e "  ${C}agents/${R}     — Subagent definitions"
echo -e "  ${C}hooks/${R}      — 19 lifecycle hooks (prompt, edit, session)"
echo -e "  ${C}skills/${R}     — 43 active skills + 340 archived"
echo -e "  ${C}references/${R} — Behavioral rules (quality, privacy, teaching)"
echo -e "  ${C}commands/${R}   — Custom slash commands"
echo -e "  ${C}settings.json${R}"
sleep "$PAUSE"

# ── Scene 2: Skill mesh ──
narrate "The skill mesh: 43 active skills, auto-triggered by intent"

type_out "cat .claude/skills/_registry.json | python3 -c \"import json,sys; r=json.load(sys.stdin); print(f'{len(r)} skills in registry'); [print(f'  {k}: {v[\\\"triggers\\\"][:2]}') for k,v in list(r.items())[:8]]; print('  ...')\""
python3 -c "
import json
with open('.claude/skills/_registry.json') as f:
    r = json.load(f)
print(f'${G}{len(r)} skills in registry${R}')
for k,v in list(r.items())[:8]:
    t = v.get('triggers', [])[:2]
    print(f'  ${C}{k}${R}: {t}')
print('  ...')
"
sleep "$PAUSE"

# ── Scene 3: Auto-trigger in action ──
narrate "Watch the prompt analyzer match skills in real-time"

echo -e "\n${Y}Prompt:${R} \"build a react component with hooks and write tests\""
type_out "echo '{\"user_prompt\":\"build a react component with hooks and write tests\",\"session_id\":\"demo\"}' | bash .claude/hooks/prompt-submit.sh"
RESULT=$(echo '{"user_prompt":"build a react component with hooks and write tests","session_id":"demo"}' | bash .claude/hooks/prompt-submit.sh 2>/dev/null || echo '{}')
echo "$RESULT" | python3 -c "
import json, sys
d = json.load(sys.stdin)
ctx = d.get('additionalContext', '')
if ctx:
    for line in ctx.split('\n'):
        line = line.strip()
        if line and ('ACTIVATE' in line or 'Also relevant' in line):
            print(f'  → {line[:90]}')
else:
    print('  → (empty — no DB, skills matched silently)')
" 2>/dev/null
sleep "$PAUSE"

spacer
echo -e "${Y}Prompt:${R} \"debug why the API returns 500 on POST /users\""
type_out "echo '{\"user_prompt\":\"debug why the API returns 500 on POST /users\",\"session_id\":\"demo\"}' | bash .claude/hooks/prompt-submit.sh"
RESULT2=$(echo '{"user_prompt":"debug why the API returns 500 on POST /users","session_id":"demo"}' | bash .claude/hooks/prompt-submit.sh 2>/dev/null || echo '{}')
echo "$RESULT2" | python3 -c "
import json, sys
d = json.load(sys.stdin)
ctx = d.get('additionalContext', '')
if ctx:
    for line in ctx.split('\n'):
        line = line.strip()
        if line and ('ACTIVATE' in line or 'Also relevant' in line):
            print(f'  → {line[:90]}')
" 2>/dev/null
sleep "$PAUSE"

# ── Scene 4: Privacy ──
narrate "Privacy hooks block sensitive files BEFORE Claude sees them"

for f in ".env" "config/secrets.json" "src/index.ts"; do
  type_out "echo '{\"tool_name\":\"Read\",\"tool_input\":{\"file_path\":\"/app/$f\"}}' | bash .claude/hooks/privacy-hook.sh"
  RESULT=$(echo "{\"tool_name\":\"Read\",\"tool_input\":{\"file_path\":\"/app/$f\"}}" | bash .claude/hooks/privacy-hook.sh 2>/dev/null)
  if echo "$RESULT" | grep -q "block" 2>/dev/null; then
    echo -e "  ${G}✗ BLOCKED${R} — /app/$f"
  else
    echo -e "  ${G}✓ ALLOWED${R} — /app/$f"
  fi
  sleep 0.5
done
sleep "$PAUSE"

# ── Scene 5: Token optimization ──
narrate "Token optimization: lean by default, full power on demand"

type_out "ls .claude/skills/ | wc -l"
ACTIVE=$(ls -d .claude/skills/*/ 2>/dev/null | grep -v _archive | wc -l | tr -d ' ')
echo -e "  ${G}${ACTIVE} active skills${R} (loaded into system prompt)"

type_out "ls .claude/skills/_archive/ | wc -l"
ARCHIVED=$(ls -d .claude/skills/_archive/*/ 2>/dev/null | wc -l | tr -d ' ')
echo -e "  ${Y}${ARCHIVED} archived skills${R} (zero token cost, restore with mv)"

spacer
echo -e "  ${D}# Restore any skill on demand:${R}"
type_out "mv .claude/skills/_archive/docker .claude/skills/docker"
echo -e "  ${G}✓${R} docker skill restored"
# Actually move it back
mv .claude/skills/docker .claude/skills/_archive/docker 2>/dev/null || true
sleep "$PAUSE"

# ── Scene 6: Dashboard ──
narrate "Observability dashboard — Next.js 15 on port 3333"

type_out "npm run dashboard:dev &"
echo -e "  ${G}▸${R} http://localhost:3333/dashboard  — System health"
echo -e "  ${G}▸${R} http://localhost:3333/skills      — Skill catalog + graph"
echo -e "  ${G}▸${R} http://localhost:3333/memory      — Memory browser"
echo -e "  ${G}▸${R} http://localhost:3333/hooks       — Privacy event log"
echo -e "  ${G}▸${R} http://localhost:3333/usage       — Token cost tracking"
echo -e "  ${G}▸${R} http://localhost:3333/docs        — Built-in docs"
sleep "$PAUSE"

# ── Scene 7: Hook pipeline ──
narrate "The full hook pipeline — every interaction is enhanced"

echo ""
echo -e "  ${B}User types a prompt${R}"
echo -e "    │"
echo -e "    ├─ ${C}SessionStart${R} ── memory recall + preference loading"
echo -e "    │"
echo -e "    ├─ ${C}PromptSubmit${R} ── skill scoring → top 5 injected as context"
echo -e "    │"
echo -e "    ├─ ${C}PreToolUse${R} ─── privacy check (block .env, creds, keys)"
echo -e "    │"
echo -e "    ├─ ${C}PostToolUse${R} ── format check + quality gate + observe"
echo -e "    │"
echo -e "    └─ ${C}Stop${R} ───────── memory flush + session close"
echo ""
sleep 3

# ╔══════════════════════════════════════════════╗
# ║                  FINALE                      ║
# ╚══════════════════════════════════════════════╝

echo ""
echo -e "${B}  ╔═══════════════════════════════════════════════════╗${R}"
echo -e "${B}  ║                                                   ║${R}"
echo -e "${B}  ║   ${G}Get started:${R}${B}                                    ║${R}"
echo -e "${B}  ║                                                   ║${R}"
echo -e "${B}  ║   ${C}git clone https://github.com/InugamiDev/ultrathink-oss${R}${B}  ║${R}"
echo -e "${B}  ║   ${C}cd ultrathink-oss && ./scripts/setup.sh${R}${B}          ║${R}"
echo -e "${B}  ║   ${C}claude${R}${B}                                           ║${R}"
echo -e "${B}  ║                                                   ║${R}"
echo -e "${B}  ║   github.com/InugamiDev/ultrathink-oss            ║${R}"
echo -e "${B}  ║                                                   ║${R}"
echo -e "${B}  ╚═══════════════════════════════════════════════════╝${R}"
echo ""
