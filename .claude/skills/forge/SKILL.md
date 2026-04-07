# /forge — Product Builder Pipeline

> `idea → clarify → feasibility → plan → build → validate → improve → ship`

## Trigger

- `/forge`, `/forge <idea>`, "build product", "build app", "create app", "ship"
- Invoked when user has a product idea and wants structured execution

## How It Works

Forge is a **7-phase pipeline** that turns an idea into a shipped product. Each phase has clear inputs, outputs, and exit criteria. State persists to disk so work survives compaction and session restarts.

**Always guided**: explains each step in plain language before executing.

---

## State Management

**State file**: `~/.ultrathink/forge/projects/<hash>.json`
**Hash**: first 8 chars of `echo -n "$PWD" | shasum -a 256`

### On `/forge` invocation:
1. Compute hash from current working directory
2. Check if state file exists
3. If exists → show progress summary, ask "Continue from [stage]?" or "Start fresh?"
4. If not → create state file, enter CLARIFY

### State updates:
- Write state after EVERY phase transition and feature completion
- Include timestamp in `updated` field
- Append phase transitions to `history` array

```json
{
  "project": "descriptive-slug",
  "project_path": "/absolute/path",
  "stage": "clarify|feasibility|plan|build|validate|improve|ship|complete",
  "created": "ISO-8601",
  "updated": "ISO-8601",
  "spec": {
    "target_user": "",
    "problem": "",
    "value_prop": "",
    "stack": "",
    "feasibility_score": null,
    "complexity_score": null
  },
  "phases": [
    {
      "id": 1,
      "name": "Phase name",
      "features": [
        { "id": "1.1", "name": "Feature name", "passes": false }
      ]
    }
  ],
  "current_phase": 1,
  "current_feature": "1.1",
  "evaluation": {
    "functionality": null,
    "design": null,
    "craft": null,
    "originality": null,
    "overall": null
  },
  "history": []
}
```

---

## Phase 1: CLARIFY

**Goal**: Understand what we're building and for whom.

Ask:
1. **Who** is the target user? *(so we design for real needs, not assumptions)*
2. **What** specific problem does this solve? *(one sentence, forces clarity)*
3. **Why** is this better than what exists? *(validates the idea has a reason to exist)*
4. **What** is the MVP scope? *(the ONE thing it must do — prevents scope creep)*
5. **Stack preference?** *(or say "you decide" and forge picks based on the problem)*

**Exit criteria**: All 5 answers captured → write to `spec` → advance to FEASIBILITY.

---

## Phase 2: FEASIBILITY

**Goal**: Honest assessment before investing build time.

Score:
| Dimension | Scale | Question |
|-----------|-------|----------|
| Tech complexity | 1-5 | How hard to build with this stack? |
| Novelty | 1-5 | What's genuinely new here? |
| Time estimate | hours/days | Realistic with chosen stack |
| Risk factors | list | What could block or derail this? |

Present the scores to the user. If complexity is high (4-5), flag it and suggest scope reduction.

**Exit criteria**: Scores written to `spec.feasibility_score` and `spec.complexity_score` → user confirms "proceed" → advance to PLAN.

---

## Phase 3: PLAN

**Goal**: Break the product into buildable atomic features.

Generate:
- **3-5 phases**, ordered by dependency (foundations first)
- **5-10 features per phase**, each with a clear pass/fail test
- Show one phase at a time, explain each feature in plain language
- Ask **"Ready to proceed?"** before finalizing

Use `/plan` for task decomposition, `/scout` for tech research if needed.

**Exit criteria**: User approves the plan → write `phases` array (all features `passes: false`) → advance to BUILD.

---

## Phase 4: BUILD

**Goal**: Implement features one at a time, test each, commit each.

For each feature in the current phase:
1. **Explain** what you're about to build and why
2. **Build** it (write code, create files, install deps)
3. **Test** — run the project's test command
4. **Pass** → set `feature.passes = true`, commit: `feat(forge): <phase>.<feature> — <description>`
5. **Fail** → fix and retry (max 3 attempts)

Rules:
- **One feature at a time.** Never build multiple simultaneously.
- **Commit after each feature.** Small, reviewable commits.
- Chain skills as needed: `/react`, `/nextjs`, `/tailwindcss`, `/drizzle`, etc.
- Update state after each feature completion.

When all features in a phase pass → advance to VALIDATE.

---

## Phase 5: VALIDATE

**Goal**: Verify the phase actually works as a whole.

Run:
1. `npm run build` (or equivalent) — must succeed
2. `npm run test` (or equivalent) — must pass
3. Structural checks: files exist, routes respond, no console errors

Score (0-1 each):
| Dimension | What it measures |
|-----------|-----------------|
| Functionality | Does it work as specified? |
| Design | Is the UI/UX acceptable? |
| Craft | Code quality, error handling, no debug artifacts |
| Originality | Does it deliver the unique value prop? |

**Exit criteria**: All scores ≥ 0.7 → advance to next phase's BUILD (or SHIP if last phase). Any score < 0.7 → enter IMPROVE.

---

## Phase 6: IMPROVE

**Goal**: Fix what validation caught.

1. Read scores and failure details from state
2. Prioritize: functionality > design > craft > originality
3. Fix one issue at a time
4. Re-run VALIDATE after fixes

**Loop**: IMPROVE → VALIDATE, max 3 cycles. If still failing after 3 → ask user how to proceed.

---

## Phase 7: SHIP

**Goal**: Prepare for deployment.

1. Generate/update `README.md` with setup instructions
2. Create PR if on a feature branch
3. List deployment steps for the chosen stack
4. Generate launch checklist
5. Walk through each step — explain what deployment means

**Exit criteria**: User confirms shipped → set `stage: "complete"`.

---

## Flow Diagram

```
CLARIFY ──[spec done]──→ FEASIBILITY ──[user confirms]──→ PLAN
                                                            │
                                                    [user approves]
                                                            ▼
SHIP ←──[all phases done]── VALIDATE ←──────────── BUILD
                               │                      ↑
                          [score < 0.7]                │
                               ▼                       │
                            IMPROVE ───[re-validate]───┘
```

**Cannot skip phases.** Cannot BUILD without approved PLAN. Cannot SHIP without passing VALIDATE.

---

## Directory Setup

On first forge invocation, ensure these exist:
```bash
mkdir -p ~/.ultrathink/forge/projects
```

## Resuming

On any `/forge` call in a project with existing state:
- Show: project name, current stage, phase progress (X/Y features done)
- Ask: "Continue?" or "Start fresh?"

Starting fresh archives the old state to `<hash>-<timestamp>.json`.
