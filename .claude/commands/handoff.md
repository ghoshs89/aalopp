---
description: End-of-session handoff. Verify state against the repo, rewrite docs/HANDOFF.md, append decisions and milestones to docs/DEVLOG.md.
argument-hint: [optional one line summary of this session]
allowed-tools: Bash(npm test:*), Bash(npm run typecheck:*), Bash(npm run lint:*), Bash(npm run content:check:*), Bash(git status:*), Bash(git diff:*), Bash(git log:*), Bash(date:*), Read, Edit, Write
---

# Session handoff

You are closing out a development session on AALOPP and preparing a handoff for the next session, which may be a different model with no memory of this one. The handoff must be resumable from the repo alone.

Orientation (current repo state):

- git status: !`git status --short`
- changed files, staged and unstaged: !`git diff HEAD --stat`
- recent commits: !`git log --oneline -10`
- today: !`date +%Y-%m-%d`

Existing handoff to overwrite (use its structure): @docs/HANDOFF.md

Existing dev log to append to (match its format, newest at top, never delete entries): @docs/DEVLOG.md

Optional summary supplied by the user for this session: $ARGUMENTS

## Do this, in order

1. Verify, do not assume. Run each of these and record the real result. Do not claim a pass you did not observe.
   - `npm test`
   - `npm run content:check`
   - `npm run typecheck`
   - `npm run lint`
   If any fail, capture the symptom. A failing check is not a reason to skip the handoff; it is state the next session must know.

2. Reconcile the log. Review this session's work and confirm every non trivial decision and every verified milestone is already in `docs/DEVLOG.md`. Append any that are missing, in the file's existing format, dated with today's date from the orientation list above, newest at top. For decisions include reason and alternatives rejected. Do not invent a rationale you were not given; if a reason is unknown, say so rather than guessing.

3. Rewrite `docs/HANDOFF.md` in full, following the section structure already in that file:
   - Fill the "How this was verified" section with the actual command results from step 1.
   - Populate current state, decisions, constraints, prioritized next steps with acceptance criteria and starting pointers, open questions and blockers, dead ends, and orientation for a cold reader.
   - In every section, separate what you verified from what you are assuming. Mark assumptions explicitly.
   - Omit any section that genuinely has no content this session rather than padding it.
   - Use the user's summary above for the title line if provided; otherwise write a one line summary yourself.

4. Keep `CLAUDE.md` honest. If a decision this session changes a rule a future coding session must follow, update the relevant line in `CLAUDE.md` and keep the full record in `docs/DEVLOG.md`. If the "Current focus" block is now stale, update it. Do not paste session history into `CLAUDE.md`.

5. Do not commit. Stop after writing the files and report a short summary of what changed, the verification results, and the exact `git add` and `git commit` command for the user to run. Committing is the user's step.

## Constraints

- Plain markdown, no em dashes anywhere, no assistant specific assumptions. Any model or human should be able to read the output.
- Prefer file paths, function names, and exact commands over vague description.
- Treat repo state as the source of truth over this conversation wherever they disagree.
