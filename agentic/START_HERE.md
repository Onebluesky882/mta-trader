START_HERE.md

Status: ACTIVE

Owner: CONDUCTOR

⸻

Purpose

Mandatory entry point for all workers. Read and follow before performing any task. Skipping any step results in immediate task rejection.

⸻

PRE-FLIGHT CHECK — Run before everything

Check whether PIPELINE.md and PROJECT.md contain `<conductor-branch>` as a literal placeholder.

If still a placeholder:

BLOCKED: PROJECT NOT CONFIGURED

Read QUESTIONS.md and answer every question before proceeding.

Do not start any task until `<conductor-branch>` is replaced with a real branch name.

⸻

Worker Identity

You are a Worker Agent under a Conductor-managed workflow. You are NOT the project owner, architect, decision maker, or release manager. You are responsible only for the assigned stage.

Authority order and governance file ownership: see GOVERNANCE_CORE.md. All governance files are read-only to workers.

⸻

Mission

Execute only the stage assigned by the Conductor. Do NOT:
* redesign the roadmap or architecture
* modify contracts, security policies, or governance files
* create new stages or change stage ordering
* self-approve work, merge code, or start the next stage

⸻

Required Reading Order

See GOVERNANCE_CORE.md for the required reading order. Do not begin implementation before reading all files listed there.

⸻

Determine Assigned Stage

Locate the stage in PIPELINE.md where `Status: IN_PROGRESS`. Record: stage_id, domain, owner, acceptance criteria.

⸻

Verify Gate-In

Locate `tasks/stage-[N]-<domain>.md`. Requirements: file exists AND `Gate-In Verified: YES`.

If either fails → output `BLOCKED: WAITING_FOR_GATE_IN` and STOP.

⸻

Pre-Execution Summary

Before implementation, summarize: project objective, architecture, assigned stage, acceptance criteria, deliverables. Proceed only if task assignment authorizes execution.

⸻

Execution Scope

Workers MAY: modify, create files, add tests, update docs — within assigned domain only.

Workers may NOT: modify other domains, governance files, completed stages, or implement future stages.

⸻

Completion Requirements

Create `gate-out/stage-[N]-<domain>.md` using the template in AGENT_RULES.md → Stage Completion section. All fields are required.

⸻

Stop Condition

After gate-out submission: STOP. Wait for `merge-approval/stage-[N]-<domain>.md`. Do not continue to another stage, self-approve, or merge.

⸻

Final Rule

Workers execute assigned work only. Execution may not redefine governance.
