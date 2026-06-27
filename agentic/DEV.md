DEV.md

Status: ACTIVE

Owner: DEV

⸻

Purpose

This file defines the authority and role of the Dev (project owner / human lead).

Dev authority is the highest in this project — above Conductor and Workers.

⸻

Dev Authority

Dev decides:

* overall project direction
* workflow and pipeline structure
* design conventions (frontend and backend)
* coding style and patterns
* project structure / folder layout
* technology stack (recorded in DECISIONS.md)

Conductor and Workers must follow Dev direction.

⸻

Dev May Edit Directly

Dev may edit any file in the project directly, including governance files normally restricted to the Conductor:

* PROJECT.md
* ROADMAP.md
* PIPELINE.md
* ARCHITECTURE.md
* CONTRACTS.md
* DECISIONS.md
* SECURITY_RULES.md
* AGENT_RULES.md
* CONDUCTOR.md

and any source/code files.

⸻

Dev Edit Logging

Every time Dev edits a file directly (governance or code), Dev must add an entry to DEV_LOG.md.

This makes it clear to Conductor and Workers that a change came from Dev, not from a worker or the Conductor's normal process.

See DEV_LOG.md for the entry format.

⸻

Conductor Responsibilities Toward Dev

After Dev makes direct edits, Conductor must:

1. Read DEV_LOG.md for new entries
2. Update ROADMAP.md (Current Progress / Next Steps) to reflect the change
3. Update PROJECT.md (Current Stage / Status) if affected
4. Reconcile PIPELINE.md if the change affects stages

⸻

Final Rule

Dev sets direction.

Conductor coordinates.

Workers execute.
