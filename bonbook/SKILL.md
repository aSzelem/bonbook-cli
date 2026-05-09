---
name: bonbook-cli
description: Agent skill — install, configure, and run bonbook-cli (workspace-local by default), then execute travel queries via bonbook ask. Use for BonBook, bonbook-cli, terminal flight search, or booking. Branch on setup state—skip clone/install/set-key when the CLI and cli-key are already present; only run full setup when something is missing or ask fails auth.
---

# BonBook CLI — Agent Skill

**Audience:** AI agents (e.g. Openclaw, Claude Code, Cursor). **Goal:** You install and run **bonbook-cli** in the user’s environment, wire **authentication**, run **`ask`** queries they describe, and troubleshoot failures — without asking the user to copy-paste long shell recipes unless unavoidable.

**What bonbook-cli is:** A Node CLI that sends natural-language travel requests to BonBook over HTTPS, polls for job completion, and prints itineraries with **short booking links** (`m.bonbook.co`). The user’s loyalty, prefs, KTN, and payment live in **BonBook (web)**; the CLI only stores a **`cli-key`** locally (via `conf`, keyed by project name `bonbook-cli`) to act as that member.

---

## Where to store this skill

**In this repository** the skill is stored only as **`bonbook/SKILL.md`** beside the CLI. There are no extra copies under `.cursor/`, `.claude/`, or `.agents/`. After **`git clone`**, place the skill where your tool loads skills—copy or symlink the whole **`bonbook/`** folder (or follow the absolute paths below). Example from the clone root: `cp -R bonbook ~/.cursor/skills/` (Cursor, personal scope); adjust the destination per product.

Each product loads **AgentSkills-style** folders: a directory (here **`bonbook/`**) whose main file must be **`SKILL.md`** (this exact capitalisation) plus YAML frontmatter.

Once the skill is installed in the right place for the tool you use, do **not** repeat placement steps on later chats—only follow the **operational** branch below.

### Cursor

| Scope | Path |
|------|------|
| **Project** | `<workspace-root>/.cursor/skills/bonbook/SKILL.md` |
| **Personal** (all projects on this machine) | `~/.cursor/skills/bonbook/SKILL.md` |

**Do not** put custom skills under `~/.cursor/skills-cursor/` — reserved for Cursor’s built-in skills.

### Claude Code

| Scope | Path |
|------|------|
| **Project** (team / repo, commit to git) | `<workspace-root>/.claude/skills/bonbook/SKILL.md` |
| **Personal** | `~/.claude/skills/bonbook/SKILL.md` |

On Windows, `~/.claude` is typically `%USERPROFILE%\.claude`. If **`CLAUDE_CONFIG_DIR`** is set, personal paths resolve under that directory instead of `~/.claude`.

### OpenClaw

OpenClaw merges [AgentSkills](https://agentskills.io/)-compatible folders from several roots (**highest precedence wins** if the same skill name appears twice). Install this skill as **`bonbook/SKILL.md`** under one of these:

| Precedence | Scope | Path |
|---|------|------|
| 1 (highest) | Workspace (per-agent workspace) | `<agent-workspace>/skills/bonbook/SKILL.md` |
| 2 | Project agent | `<project-root>/.agents/skills/bonbook/SKILL.md` |
| 3 | Personal agent | `~/.agents/skills/bonbook/SKILL.md` |
| 4 | Managed / local overrides | `~/.openclaw/skills/bonbook/SKILL.md` |
| 5 | Bundled | shipped with OpenClaw |
| 6 | Extra dirs | `skills.load.extraDirs` in `openclaw.json` |

`openclaw skills install …` from ClawHub typically installs into the active workspace’s **`skills/`** directory (picked up as workspace skills). See [OpenClaw: Skills](https://docs.openclaw.ai/tools/skills) for precedence, allowlists, and config.

---

### Required order of operations (branch on setup state)

1. **Finish reading this skill** so you know clone paths, `set-key`, storage locations, and safety rules.
2. **Decide which branch applies** (see **First invocation vs repeat invocations** below). Prefer the **repeat** path whenever the workspace already contains a working `bonbook-cli` clone.
3. Only on the **full setup** branch: ask for the BonBook **`cli-key`** before `git clone` / `npm install` in the cloned repo (unless the user already pasted or confirmed the key in this conversation). After install, run **`set-key`** then **`ask`**.
4. On the **repeat** branch: go straight to **`ask`** with the user’s natural-language request (use **`set-key`** only if `ask` fails with the missing-key message or auth errors).

### First invocation vs repeat invocations

**Full setup (first time in this workspace, or CLI missing/broken)** — Run **Installation** below, then **`set-key`** (after obtaining **`cli-key`** from the user when needed), then **`ask`**. Do **not** assume the cli-key is already on disk unless the user says so.

**Repeat invocations (CLI already present and usable)** — Treat setup as done:

- **Skip** `git clone`, `npm install`, and smoke tests unless `bonbook-cli/bin/bonbook.js` is missing or `--help` fails.
- **Skip** prompting for **`cli-key`** until proven necessary: run **`ask`** with the user’s query via `npm run bonbook -- ask '…'` or `node bonbook-cli/bin/bonbook.js ask …`. The CLI prints `Run bonbook set-key <key> first.` when no key is stored (key is persisted per machine in the CLI’s local config store, not necessarily inside the repo).
- **Only if** that error appears (or BonBook returns an auth error): ask for **`cli-key`**, run **`set-key`**, then **`ask`** again.
- **Do not** re-copy or re-explain **Where to store this skill** on every chat; that section is for one-time placement of `SKILL.md` only.

---

## What you need from the user or environment

- **Node.js 18+** and **npm** on the machine where you run commands (verify or install before cloning).
- The user’s **`cli-key`** from their BonBook member profile (obtain per **Required order of operations** above). **Never** echo the full key in chat, commit it, or log it. If it leaks, tell them to rotate it in BonBook and run `set-key` again with the new value.

---

## Installation (prefer workspace-local)

**When:** Only for the **full setup** branch—when `bonbook-cli` is not yet cloned in this workspace or `node bonbook-cli/bin/bonbook.js --help` fails.

The package is **not** on the public npm registry. Install from GitHub.

**Default approach:** Clone into the **user’s workspace root** (or a subdirectory they use for tools). Avoid **`npm install -g`** first — it often fails with **EACCES** when npm’s global prefix is not user-writable.

```bash
cd /path/to/workspace
git clone https://github.com/aSzelem/bonbook-cli.git
cd bonbook-cli && npm install && cd ..
```

Smoke-test:

```bash
node bonbook-cli/bin/bonbook.js --help
```

**Optional:** If the workspace has a root `package.json`, add a script so you can run the CLI without repeating the path (merge with existing `scripts`):

```json
{
  "private": true,
  "scripts": {
    "bonbook": "node bonbook-cli/bin/bonbook.js"
  }
}
```

Then:

```bash
npm run bonbook -- --help
npm run bonbook -- set-key '<cli-key>'
npm run bonbook -- ask 'earliest flight seattle to sf tomorrow'
```

**Critical:** The **`--` after `npm run bonbook`** forwards remaining args to the CLI.

Inside the clone only, `node bin/bonbook.js` is equivalent to `node bonbook-cli/bin/bonbook.js` from the parent.

**Fallbacks:** If the user insists on a global command, try `npm install -g "git+https://github.com/aSzelem/bonbook-cli.git"` or `cd bonbook-cli && npm link` — but fall back to workspace-local on permission errors.

---

## Configuration — `set-key`

**When:** During **full setup** after install, or on **repeat** invocations only when `ask` fails because no key is stored or key is invalid.

Before any successful `ask`, persist the key (network call to BonBook):

```bash
bonbook set-key '<cli-key>'
# or from workspace root:
node bonbook-cli/bin/bonbook.js set-key '<cli-key>'
npm run bonbook -- set-key '<cli-key>'
```

Success looks like (last four chars only):

```
cliKey saved (****a7af).
```

---

## Running queries — `ask`

**Default on repeat invocations:** Jump here after confirming the CLI binary exists—do not walk through Installation or `set-key` unless a prior step failed.

All travel interaction is **`bonbook ask '<natural language>'`**. Encode the user’s intent clearly (earliest, nonstop, dates, airports, one-way vs return, etc.):

```bash
npm run bonbook -- ask 'earliest one-way seattle to san francisco tomorrow nonstop preferred'
```

**Latency:** Expect roughly **15–60 seconds** per query while the job polls. Use a generous tool/shell timeout; default **`BONBOOK_POLL_TIMEOUT_MS`** is **120000** and is usually enough.

**Output:** Lines like `< link: https://m.bonbook.co/... >` are booking URLs. Summarize options for the user; when they want to book, open the chosen URL: **macOS** `open 'https://…'`, **Linux** `xdg-open`, **Windows** `start`.

Example shape (wording may include a personalized greeting):

```
I checked … options …
Dates: 2026-05-09
05:00 (SEA) -> 07:23 (SFO) * 2h 23m * Nonstop
    $348.40 - United   < link: https://m.bonbook.co/… >
```

---

## How it works (for debugging)

1. `POST /v1/ask` to BonBook.
2. Poll `GET /v1/jobs/:correlationId` every **2s** until `complete` or `failed`.
3. Spinner / status in the terminal until done.

| Variable | Default | Meaning |
|---|---|---|
| `BONBOOK_POLL_INTERVAL_MS` | `2000` | Poll interval (ms) |
| `BONBOOK_POLL_TIMEOUT_MS` | `120000` | Max wait (ms) |

---

## Troubleshooting

| Symptom | What to do |
|---|---|
| `bonbook: command not found` | Use `node bonbook-cli/bin/bonbook.js` or `npm run bonbook -- …` from the local clone |
| `Run bonbook set-key <key> first.` | Normal on first use of this machine; run **`set-key`** once, then **`ask`** — do not re-run Installation |
| `EACCES` on global npm install | Stay workspace-local; or fix npm prefix permissions |
| Clone `npm install` fails | Node 18+, network to GitHub |
| Auth / key errors | Re-run `set-key` with the key from the user’s BonBook profile |
| Timeout | Retry; optionally raise `BONBOOK_POLL_TIMEOUT_MS` |

---

## Quick reference

- **Skill on disk:** Install **`bonbook/SKILL.md`** under the tool you use—**Cursor:** `.cursor/skills/` or `~/.cursor/skills/`; **Claude Code:** `.claude/skills/` or `~/.claude/skills/`; **OpenClaw:** workspace `skills/`, `.agents/skills/`, `~/.agents/skills/`, or `~/.openclaw/skills/` (see **Where to store this skill**). After installation, skip re-explaining placement on later runs.
- **Repeat runs:** Existing `bonbook-cli` + successful **`ask`** ⇒ skip clone, npm install, and proactive **`set-key`**.
- **Entrypoint:** `bonbook-cli/bin/bonbook.js` (global binary name: `bonbook`).
- **Repo:** `https://github.com/aSzelem/bonbook-cli` (git URL install; not an npm package name on the registry).
- **Auth:** Local **`cli-key`** only; ties CLI to the same web profile as BonBook checkout.
- **Primary command:** `ask` with natural language; **`set-key`** once per machine/profile location when missing or rotated.
