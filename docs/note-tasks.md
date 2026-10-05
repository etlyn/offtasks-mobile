# Tasks inside notes

Local implementation, September 26, 2026. The note editor accepts checkbox task bullets. Saving the note makes them visible in Calendar with their note title and assigned goal. New bullets start on today; Calendar editing can reschedule, assign a goal, change priority or complete them. Editing note prose preserves its tasks. Deleting a bullet removes that task; deleting a note removes its tasks, with confirmation copy explaining this.

The note owns its tasks in optional `tasks` JSON. Calendar receives derived task rows with namespaced IDs and a read-only note title; changes route back through planner persistence instead of creating duplicate rows in the tasks table. Existing notes without tasks remain valid. The existing planner sync and guest import preserve the complete note JSON, including embedded tasks. This does not migrate or rewrite existing task rows.

Focused validation: note/editor and repository tests cover adding, calendar completion/rescheduling/removal, renaming, storage reload, owner isolation, imported ownership and malformed data. Physical-device interaction and isolated real-backend import/sync acceptance remain open. The web planner does not yet project embedded note tasks; do not claim web/mobile parity. Existing whole-note sync conflict semantics also remain a separate limitation.

Next acceptance: on a simulator/device create a note task, inspect and reschedule it in Calendar, relaunch, complete from both surfaces, assign a goal and delete. Repeat on isolated accounts across import/retry and two devices before broader release.
