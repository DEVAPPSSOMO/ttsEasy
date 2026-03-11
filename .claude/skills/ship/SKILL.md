---
name: ship
description: Update progress doc, commit all changes with an auto-generated message, and push. Use when the user says "ship it", "commit and push", "deploy changes", or invokes /ship.
argument-hint: [optional override message]
allowed-tools: Bash, Read, Edit, Write, Glob, Grep
---

Update the progress document, commit, and push. Follow these steps exactly:

## 1. Analyze changes

Run these commands in parallel:
- `git status` to see all modified and untracked files (never use -uall)
- `git diff` and `git diff --cached` to see staged and unstaged changes
- `git log --oneline -5` to see recent commit message style

## 2. Update docs/PROGRESO.md

Read `docs/PROGRESO.md` and update it based on the changes being committed. This document tracks project progress and must stay in sync with each commit.

### What to update:

**Tablas de tareas por fase:**
- If a committed change completes a task listed as "Pendiente", change its status to "Completado", set the date to today, and add a brief note about what was done.
- If the changes correspond to a new task not yet in the table, add a new row in the appropriate phase.
- Do NOT change tasks that are unrelated to the current changes.

**Log de Cambios:**
- Add a new date section at the bottom (if today's date doesn't exist yet) or append to today's existing section.
- Add concise bullet points describing what was done in this commit.
- Use the same style as existing log entries: short, factual, no fluff.

### Rules:
- Keep the existing document structure intact (headers, table format, separators).
- Only touch rows/sections relevant to the current changes.
- Write in Spanish, matching the existing tone.
- If `docs/PROGRESO.md` doesn't exist, create it following the structure of the template in [progreso-template.md](progreso-template.md).

## 3. Stage files

- Stage all relevant changed files individually (`git add <file> ...`)
- **Include `docs/PROGRESO.md` in the staged files**
- Do NOT stage files that contain secrets (.env, credentials, tokens, etc.)
- Do NOT use `git add -A` or `git add .`

## 4. Generate commit message

If the user provided an override message via `$ARGUMENTS`, use that as the commit message.

Otherwise, auto-generate a concise commit message:
- Analyze the diff to understand the nature of the changes
- Write a short summary line (max 72 chars) in imperative mood (e.g. "Add X", "Fix Y", "Update Z")
- If the changes span multiple concerns, add bullet points in the body
- Follow the style of recent commits in the repo
- Always end the message with: `Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>`
- Use a HEREDOC to pass the message:

```
git commit -m "$(cat <<'EOF'
Summary line here

Optional body here.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

## 5. Push

- Push to the current remote tracking branch with `git push`
- If no upstream is set, use `git push -u origin <current-branch>`
- Report the result to the user

## 6. Report

Show a brief summary:
- Number of files changed
- Commit hash (short)
- Branch pushed to
- The commit message used
- Changes made to docs/PROGRESO.md
