AGENT_RULES.md

Status: ACTIVE

Owner: CONDUCTOR

⸻

Purpose

Defines worker behavior, execution boundaries, compliance requirements, and governance protections. All workers must follow these rules.

Violation → Default Violation Rule in GOVERNANCE_CORE.md (Status: FAIL, Ready For Next Stage: NO).

⸻

Table of Contents

| # | Rule | Enforcement |
|---|---|---|
| 1 | Governance Protection | Always |
| 2 | Worker Scope | Always |
| 3 | Main Branch Merge Authority | Always |
| 4 | Domain Ownership | Always |
| 5 | Technology Stack Authority | Always |
| 6 | Version Policy | MANDATORY — before every install |
| 7 | Dependencies | Always |
| 8 | Testing Rules | MANDATORY — before gate-out |
| 9 | Error Handling | Always |
| 10 | License Gate | MANDATORY — enforced by hook |
| 11 | Worktree Isolation | MANDATORY — enforced by hook |
| 12 | Sub-Agent Restriction | Always |
| 13 | Parallel Execution | MANDATORY |
| 14 | Security Rules | See SECURITY_RULES.md |
| 15 | Build Artifact Rules | Always |
| 16 | Stage Completion | MANDATORY — before gate-out |
| 17 | Agent Orchestration | MANDATORY for multi-agent stages |
| 18 | Observability | MANDATORY for agent/API stages |

⸻

Governance Protection

See GOVERNANCE_CORE.md for the governance file ownership table. Workers may NOT modify any governance file. Only Dev and Conductor may, per that table.

⸻

Worker Scope

Each worker owns one stage, one branch, one domain. Workers may not execute tasks outside assigned scope.

⸻

Main Branch Merge Authority

Agents may NOT create, rename, delete, or re-point the main branch. `main` is owned exclusively by Dev.

⸻

Domain Ownership

Workers may only modify files inside their assigned domain. Cross-domain changes require explicit Conductor approval.

⸻

Technology Stack Authority

DECISIONS.md is authoritative. Workers must use approved technologies and must NOT replace frameworks, libraries, databases, authentication systems, or infrastructure without Conductor approval.

⸻

Version Policy — MANDATORY

Workers must use the latest stable version of every package unless the package appears in the **Pinned Versions** table in DECISIONS.md.

If a package is pinned: use the exact version in that table. Do NOT upgrade, downgrade, or substitute. Do NOT run `@latest` for pinned packages.

**Workers may NOT rely on memory or training data for version numbers** — versions known at training time are outdated. Always verify at runtime.

Before installing any package, run the appropriate check:

```bash
# npm
npm info <package> version

# pip
pip index versions <package>

# cargo
cargo search <package>
```

Bootstrap commands must always use `@latest`:

```bash
npm create vite@latest
npx create-expo-app@latest
npx create-next-app@latest
```

Violations that result in Status: FAIL:
* installing a package without running the version check above
* using a pinned version not declared in DECISIONS.md Pinned Versions table
* ignoring a pinned version and using @latest instead
* bootstrapping from a template without `@latest`
* claiming "latest" without evidence from the check command

Workers must include the verified version number in `dependencies_added` in gate-out.

⸻

Dependencies

Prefer existing dependencies. If a new dependency is required, document in gate-out.md: package, version, reason. See SECURITY_RULES.md for supply chain and security requirements.

⸻

Testing Rules

Required: build verification, unit tests, type checks. Workers may not claim tests passed unless executed.

⸻

Error Handling

Applications must fail gracefully. Return structured errors. Never intentionally crash systems.

⸻

License Gate Rule — MANDATORY

The license system does not exist yet in this template. It will be implemented in a future stage.

**Governance gate (enforced now — via hook):**

`license_status: active` must be set in `agentic/PROJECT.md` before any file can be written or edited. This is enforced automatically by `.claude/hooks/license-check.sh` — not prompt-based. The hook blocks `Write` and `Edit` tool calls at the harness level and exits with code 2 if license is not active.

Exempt from hook: `agentic/PROJECT.md`, `agentic/GOVERNANCE_CORE.md`, `agentic/DEV.md`, `agentic/DEV_LOG.md`, `.claude/*`, `.gitkeep`, `.example` files.

Only Dev may set `license_status: active` in PROJECT.md. Workers may NOT modify PROJECT.md.

**Future implementation requirement (enforced when license stage is built):**

When the license system is implemented, all protected API routes must validate license status from the DB on every request via a `licenseGuard` Hono middleware. Requirements at that time:
- Session must be valid (authenticated via Better Auth)
- `license` table record must exist for the user with `status = "active"`
- `license.key` must match the key on record — checked against DB, never cached in session
- Failure returns `403 { error: "license_inactive" }` — never 401
- Exempt routes: `/health`, `/api/auth/*`, `/api/payment/webhook`
- DB schema minimum: `id`, `user_id`, `key`, `status`, `expires_at`, `created_at`

Violation → Status: FAIL, Ready For Next Stage: NO.

⸻

Worktree Isolation Rule — MANDATORY

Each stage must be executed in a dedicated git worktree on its own branch. Workers may NOT work directly on `main`.

**Branch naming:** `stage/stage-[N]-<domain>`
Examples: `stage/stage-9-customer`, `stage/stage-10-tests`

**Worktree path:** `.claude/worktrees/stage-[N]-<domain>/`

The Conductor creates the worktree before dispatch. Workers operate only within their assigned worktree path. After merge-approval, the Conductor removes the worktree and deletes the branch.

If a Worker finds itself on `main` → output `BLOCKED: WRONG_BRANCH` and STOP.

Violation → Status: FAIL, Ready For Next Stage: NO.

⸻

Sub-Agent Restriction

Workers may NOT create, dispatch, or generate new workers or autonomous agents, delegate tasks, or create recursive execution chains. Only the Conductor may create workers.

⸻

Parallel Execution Rule — MANDATORY

Workers MUST execute independent operations in parallel. Sequential execution of parallelizable operations is a violation.

**Rule:** If two or more operations have no data dependency between them, they MUST be called simultaneously in a single message — not one after another.

Examples of required parallel execution:
- Reading multiple files → call all read tools at once
- Writing multiple independent files → call all write tools at once
- Running type-check and linting → run both at once
- Fetching multiple API endpoints → call all at once
- Creating multiple independent database records → insert in parallel

Examples where sequential is correct (dependency exists):
- Read file → then edit that file (must read first)
- Create table → then insert into that table
- Build → then deploy (build output required for deploy)

**How to apply:** Before executing any set of operations, ask: "Do any of these depend on the output of another?" If NO → parallel. If YES → sequential only for the dependent pair, parallel for everything else.

Violation → Status: FAIL, Ready For Next Stage: NO.

⸻

Security Rules

See SECURITY_RULES.md for all security requirements (secrets, access control, data, network, APIs, dependencies, cryptography, infrastructure, CI/CD).

⸻

Build Artifact Rules

Never commit: `node_modules/`, `dist/`, `build/`, `.next/`, `target/`, `vendor/`, `__pycache__/`, `.venv/`. Verify `.gitignore` before push.

⸻

Stage Completion

**Pre-condition — MANDATORY before writing gate-out:**

`pnpm type-check` must exit 0 in the project root before gate-out can be written. This is enforced automatically by `.claude/hooks/gate-out-typecheck.sh` — not self-reported. The hook runs `pnpm type-check` and blocks the Write if it fails. Workers may NOT claim "type-check passed" without the hook confirming it.

Worker must create `gate-out/stage-[N]-<domain>.md` using this template:

```
stage_id:
status:                    # PASS | FAIL
ready_for_next:            # YES | NO
modified_files:
tests_run:
dependencies_added:        # package, version, reason — or "none"
acceptance_criteria:       # list each criterion: PASS | FAIL
known_issues:              # or "none"
risks:
blockers:
recommendations:
```

All fields are required. Empty fields must be explicitly set to "none" or "N/A".

⸻

Agent Orchestration Rule — MANDATORY

Every stage that involves multiple agent calls must follow the correct orchestration pattern. Choosing the wrong pattern causes race conditions, data corruption, or wasted tokens.

---

**Pattern 1 — Single Agent (default)**

Use when: one task, one agent, one result. No routing needed.

```
User → Agent → Result
```

Apply this by default. Only move to a more complex pattern when there is a clear reason.

---

**Pattern 2 — Supervisor Pattern**

Use when: the task type is unknown at request time and needs to be routed to a specialist.

```
User → Supervisor Agent
         ├── if task = code change  → Code Agent
         ├── if task = UI/design    → Design Agent
         └── if task = data/content → Content Agent
```

Implementation: Managed Agents `multiagent: {type: "coordinator", agents: [...]}`. The coordinator reads the user request, decides which sub-agent to delegate to, and returns the result. Only one sub-agent runs per turn unless explicitly fanned out.

Rules:
- Supervisor must not execute the task itself — it only routes
- Each sub-agent must be a separately defined Anthropic Agent with its own system prompt and tools
- If the supervisor cannot determine the correct route → ask the user, do not guess

---

**Pattern 3 — Parallel Fan-out**

Use when: multiple tasks are **fully independent** — no shared state, no output of one feeds into another.

```
Coordinator → dispatch simultaneously:
  ├── Agent A: task A (independent)
  ├── Agent B: task B (independent)
  └── Agent C: task C (independent)
        ↓ wait for all
  Coordinator → merge results → User
```

Implementation: Managed Agents coordinator spawns sub-agents simultaneously using its tool. The coordinator waits for all threads to reach `session.thread_status_idle`, then merges.

**SAFE MODE — when to block parallel:**

Before choosing parallel, check every pair of tasks:
- Does task B read output from task A? → **Sequential**
- Do task A and B write to the same file? → **Sequential**
- Do task A and B modify the same DB row? → **Sequential**
- Is the order of results visible to the user? → **Sequential**

If any check above is true → use Sequential (Pattern 4), not Parallel.

If in doubt → use Sequential. Parallel is opt-in, never default.

---

**Pattern 4 — Sequential (Safe Mode)**

Use when: tasks have any dependency between them — output of one feeds into another, same resource is modified, or order matters.

```
Coordinator → Agent A → wait → Agent B → wait → Agent C → Result
```

This is always safe. Use it when:
- Agents share files
- One agent's commit must be pushed before another reads it
- The user's request has implied ordering ("first do X, then do Y")

---

**Decision flowchart (run before every multi-agent design):**

```
Is there only one task?
  YES → Pattern 1 (Single)

Is the task type unknown at request time?
  YES → Pattern 2 (Supervisor)

Are all tasks fully independent (no shared state, no dependency)?
  YES → Pattern 3 (Parallel)
  NO  → Pattern 4 (Sequential)

If unsure → Pattern 4 (Sequential)
```

Violation: choosing Parallel when tasks have dependencies → Status: FAIL.

⸻

Observability Rule — MANDATORY

Every stage that introduces or modifies an agent call, API route, or background task MUST implement structured logging. Shipping code without observability is a violation.

**Minimum required per agent call:**
- A unique `correlation_id` linking all calls in one request chain
- Who made the request (`user_id` or equivalent)
- Input and output previews — truncated, never full content (privacy)
- Token counts and latency
- Status: success or error
- Tool names used during the run

**What workers must NOT do:**
- Log full user messages or full agent responses (privacy)
- Log API keys, tokens, or secrets (never)
- Skip logging on success — logging is not optional
- Use `console.log` as the only observability mechanism

**Implementation:** Each project defines its own logging storage and schema. Document the chosen approach in ARCHITECTURE.md and record the decision in DECISIONS.md.

Any stage that adds agent calls without structured logging → Status: FAIL.

⸻

Final Rule

Workers execute. Conductor decides. Governance overrides implementation.
