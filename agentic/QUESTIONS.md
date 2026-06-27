QUESTIONS.md

Status: ACTIVE

Owner: CONDUCTOR

⸻

Purpose

Answer all questions below before using this template on a real project.

Conductor will use the answers to automatically update the relevant governance files.

⸻

How to Use (Conductor)

**Ask one question at a time — start immediately when the client types `start-here`.**

Rules for Conductor:
- **Read `DECISIONS.md` and `ARCHITECTURE.md` before asking any question.** These files may be empty in a fresh setup — that is expected. Read them to understand what template defaults already exist, so you can guide the client with informed suggestions rather than asking them to specify everything from scratch.
- **The very first question MUST be the Starter Question** — "Are you a developer or a business owner?" — before Q0 or anything else.
- Ask exactly one question per message. Wait for the client's answer before asking the next.
- Start asking immediately when the client types `start-here`. Do NOT start before that.
- Save the answer to the file specified in "→ Update file" as soon as it is received.
- Never bundle multiple questions into a single message.
- If the answer is unclear, ask for clarification with an example before moving on.
- If the client requests a language (Thai / Chinese / English), translate all subsequent questions and responses into that language.

Question order (strict):
1. Wait for client to type `start-here`
2. Send opening message
3. Ask language preference (English / Thai / Chinese) → apply for ALL questions from this point
4. Ask Starter Question in chosen language → determine CLIENT_TYPE → route accordingly
5. If DEVELOPER → continue Q0, Q1, Q2 … in order (in chosen language)
6. If CLIENT → stop, switch to CUSTOMER_SETUP.md

Opening message (send this before the first question):

> "I'm your Conductor assistant — here to help set up your project. Feel free to type anything at any time."

---

## Language Question — Ask immediately after opening message

> "What language would you like to use? / คุณต้องการใช้ภาษาอะไร?
> 🇬🇧 English / 🇹🇭 ไทย / 🇨🇳 中文"

| Answer | Conductor action |
|--------|-----------------|
| English | Continue all questions in English |
| ไทย / Thai | Translate ALL subsequent questions and responses to Thai |
| 中文 / Chinese | Translate ALL subsequent questions and responses to Chinese |

> Conductor must apply the chosen language for every question from this point on — including the Starter Question and all Q0–Q7.

⸻

## Starter Question ⚠️ FIRST — Ask before everything else
→ Update file: `CLIENT_TYPE.md`

Ask this question immediately after language is confirmed:

> "Are you a developer, or a business owner who wants to build a website?"

| Answer | Conductor action |
|--------|-----------------|
| Developer | Write `DEVELOPER` to `CLIENT_TYPE.md` → continue with this QUESTIONS.md |
| Business owner | Write `CLIENT` to `CLIENT_TYPE.md` → **stop QUESTIONS.md** → switch to `CUSTOMER_SETUP.md` immediately |

> If unsure, ask: "What are you planning to use this template for?"
> - Building a website for your own business → CLIENT
> - Using it as a starter for development → DEVELOPER

Answer: [TBD]

⸻

## Section 0 — Project Owner ⚠️ MANDATORY FIRST
→ Update file: PROJECT.md
→ Action: Conductor must SET role = 'owner' in the database for this email after deploy

Q0. What is the project owner's email address?

> This email will automatically receive `owner` permissions — able to manage roadmap, forum, and all system settings.
> Must match the email used to log in to the system.

Answer: [TBD]

⸻

## Section 1 — Project Identity
→ Update file: PROJECT.md

Q1. What is the project name?

Answer: [TBD]

---

Q2. What does this project do? (1–3 sentences — the core problem it solves)

Answer: [TBD]

---

Q3. Who are the target users?

Answer: [TBD]

---

Q4. What is the current status of the project?

- [ ] Greenfield — starting from scratch
- [ ] Existing codebase — building on top of existing code
- [ ] Prototype — already have a proof-of-concept

Answer: [TBD]

⸻

## Section 2 — Tech Stack
→ Update file: DECISIONS.md

Q5. What is the primary language?

> ⚠️ This template uses **TypeScript** as the primary language — recommended for compatibility with the existing codebase.

- [ ] TypeScript *(used in this template — recommended)*
- [ ] JavaScript
- [ ] Python
- [ ] Go
- [ ] Other: [specify]

Answer: [TBD]

---

Q6. Describe your project idea and what you want to achieve.

- What is the main thing users can do in it?
- What is the plan and goal of this project?
- What pages or screens do you want? (e.g. landing page, dashboard, login, settings)
- What is the expected output or result the user gets?

> Conductor: use the answers to infer the frontend framework, page structure, and feature scope. Do not ask for the framework directly — decide it from context.

Answer: [TBD]

---


Q7. Package manager?

- [ ] npm
- [ ] yarn
- [ ] pnpm
- [ ] bun

Answer: [TBD]

---

> **Template defaults (Conductor sets automatically — do not ask client):**
> - Testing: **Vitest** (unit) + **Playwright** (e2e)
> - State management: **TanStack Query** (server state) + **Zustand** (client state)
> - Linting/Formatting: **Biome**

---

## Tech Stack Summary & Cloudflare Check
→ Update file: DECISIONS.md

After Q7, Conductor must:

1. **Summarize the full tech stack** collected so far and present it clearly to the client:

   > "Here's the setup we'll use for your project:
   > - **Frontend:** [inferred from Q6]
   > - **Backend:** Hono (+ FastAPI if Python layer needed)
   > - **Database:** Cloudflare D1 (SQLite)
   > - **Auth:** packages/auth with Bearer token
   > - **Deployment:** Cloudflare Workers + Pages
   > - **Linting/Formatting:** Biome
   > - **Language:** [Q5 answer]
   > - **Package manager:** [Q7 answer]
   >
   > Does this look right, or would you like to change anything?"

2. **Ask this question:**

   > "Do you already have a Cloudflare account?"

   | Answer | Conductor action |
   |--------|-----------------|
   | Yes | Ask: "Would you like to deploy the project to Cloudflare now, or set it up later?" → continue to Section 3 either way |
   | No | Walk them through sign-up step by step (see instructions below) → wait until confirmed before continuing |

   **If client does not have a Cloudflare account — guide them:**

   > "No problem! Here's how to create a free Cloudflare account:
   >
   > 1. Go to **cloudflare.com**
   > 2. Click **"Sign Up"** in the top right corner
   > 3. Enter your email and create a password
   > 4. Verify your email address
   > 5. You're in — no credit card required
   >
   > Let me know once your account is ready and we'll continue the setup."

   Conductor waits for confirmation before proceeding to Section 3.

Answer (Cloudflare account): [TBD]

⸻

## Conductor Instructions

After the client has answered all questions, Conductor must:

0. **⚠️ SET OWNER ROLE FIRST** — run this SQL in the D1 database immediately after the first deploy:
   ```sql
   UPDATE user SET role = 'owner' WHERE email = '<answer from Q0>';
   ```
   Verify with:
   ```sql
   SELECT id, name, email, role FROM user WHERE email = '<answer from Q0>';
   ```
   Must see `role = 'owner'` before proceeding.

1. **PROJECT.md** — update: name, description, target users, status (from Q1–Q4)

2. **DECISIONS.md** — update with client answers + template defaults below:

   | Setting | Source |
   |---------|--------|
   | Language | Q5 answer |
   | Frontend framework | inferred from Q6 |
   | Backend | Hono (+ FastAPI if Python needed) |
   | Database | Cloudflare D1 (SQLite) |
   | Auth | packages/auth — Bearer token |
   | Deployment | Cloudflare Workers + Pages |
   | Package manager | Q7 answer |
   | Linting/Formatting | Biome |
   | Testing | Vitest (unit) + Playwright (e2e) |
   | State management | TanStack Query + Zustand |
   | Naming conventions | PascalCase components, camelCase functions, kebab-case files, UPPER_SNAKE_CASE constants |

3. **ARCHITECTURE.md** — infer from Q6 (project idea, pages, goals):
   - Architecture style: Monorepo (template default)
   - Modules: derive from Q6 answers
   - Folder structure: template default (`apps/web`, `apps/api`, `packages/auth`)

4. **CONTRACTS.md** — create initial contracts for modules inferred from Q6

5. **PIPELINE.md** — generate stage list from Q6 answers. Use `main` as conductor-branch (template default)

6. **ROADMAP.md** — derive goals, vision, and milestone from Q6 (plan and goal answer)

7. **SECURITY_RULES.md** — use template defaults: standard user PII protection, dev/production environments, no special compliance

8. **Replace `<conductor-branch>`** in PIPELINE.md, PROJECT.md, AGENT_RULES.md, README.md with `main`

9. **Log all changes** in DEV_LOG.md

⸻

Status

- [ ] Project Identity (Q0–Q4): not answered
- [ ] Tech Stack (Q5–Q7): not answered
- [ ] Cloudflare account: not confirmed
- [ ] Conductor updated all governance files: not done
- [ ] Setup Test PASSED: not done

⸻

## Setup Test — Run after Conductor has updated all governance files

Conductor runs this test to confirm governance is ready for use.

All passing = pipeline can start.

---

### T1 — No placeholders remaining

```bash
grep -rn "\[TBD\]\|<conductor-branch>\|\[name\]\|\[N\]" \
  PROJECT.md ROADMAP.md ARCHITECTURE.md CONTRACTS.md \
  DECISIONS.md PIPELINE.md SECURITY_RULES.md AGENT_RULES.md README.md
```

Result: must produce no output — if any, those files still need updating.

Result: [ ] PASS / [ ] FAIL

---

### T2 — conductor-branch exists in git

```bash
git branch -a | grep -F "<real conductor-branch name from Q23>"
```

Result: must find that branch — if not found, Conductor must create it first.

Result: [ ] PASS / [ ] FAIL

---

### T3 — PROJECT.md has real content

Verify manually:
- [ ] Has a real project name (not "My Project" or a placeholder)
- [ ] Has a description explaining the core problem
- [ ] Has target users
- [ ] Has current status

Result: [ ] PASS / [ ] FAIL

---

### T4 — DECISIONS.md has complete tech stack

Verify manually:
- [ ] Primary language
- [ ] Frontend framework (or noted as API-only)
- [ ] Backend framework (or noted as frontend-only)
- [ ] Database (or noted as none)
- [ ] Authentication method
- [ ] Package manager
- [ ] Testing framework
- [ ] Linting/formatting tools
- [ ] Naming conventions

Result: [ ] PASS / [ ] FAIL

---

### T5 — PIPELINE.md has real stages

```bash
grep -c "Stage\|PENDING\|IN_PROGRESS" PIPELINE.md
```

Result: must return a value greater than 0.

Verify manually:
- [ ] At least 1 stage exists
- [ ] Every stage has `Depends On` specified
- [ ] `<conductor-branch>` has been replaced with the real name

Result: [ ] PASS / [ ] FAIL

---

### T6 — ARCHITECTURE.md and CONTRACTS.md are not empty

```bash
wc -l ARCHITECTURE.md CONTRACTS.md
```

Result: both files must have more than 10 lines.

Result: [ ] PASS / [ ] FAIL

---

### T7 — DEV_LOG.md has a setup entry

Verify manually:
- [ ] At least 1 entry recording the governance update from QUESTIONS.md

Result: [ ] PASS / [ ] FAIL

---

### T8 — Worker simulation

Conductor sends this prompt to a new Worker agent:

> "Read START_HERE.md and report: what is this project, what is the tech stack, and what is the first stage to work on?"

Worker must answer correctly without asking the developer.

- [ ] Worker names the project correctly
- [ ] Worker identifies the tech stack correctly
- [ ] Worker identifies the first stage
- [ ] Worker is not BLOCKED

Result: [ ] PASS / [ ] FAIL

---

### Test Summary

| Test | Result |
|------|--------|
| T1 — No placeholders | |
| T2 — conductor-branch exists in git | |
| T3 — PROJECT.md complete | |
| T4 — DECISIONS.md complete | |
| T5 — PIPELINE.md complete | |
| T6 — ARCHITECTURE.md / CONTRACTS.md not empty | |
| T7 — DEV_LOG.md has entry | |
| T8 — Worker simulation | |

All passing → update Status checklist above, then start pipeline.

Any FAIL → fix and re-run that test before starting the pipeline.
