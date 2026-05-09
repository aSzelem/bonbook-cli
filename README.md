# bonbook (CLI)

## What BonBook CLI does

**BonBook CLI** is a **terminal front-end for BonBook**. You describe what you want in **natural language**—search flights, compare options, adjust travel plans, or ask about existing bookings—and BonBook answer's via a remote **HTTPS bridge**. While the backend works, you see status in the terminal; when it finishes, you get a response and, for offers, **itineraries with prices** and shortened **booking links** to open and book in one click.

The CLI stores only your **`cli-key`** locally ( **`bonbook set-key`** ), which is linked to your member profile and saved preferences after you first checkout.

**Repo:** [github.com/aSzelem/bonbook-cli](https://github.com/aSzelem/bonbook-cli)

This package is **not on the npm registry** (`private` in **`package.json`**). Install it **from GitHub** (see below). The **`bin`** name is **`bonbook`**.

**Agent skill:** [`bonbook/SKILL.md`](bonbook/SKILL.md) — one AgentSkills-compatible folder in this repo; copy or symlink the `bonbook/` directory into your agent’s skills path (Cursor, Claude Code, OpenClaw destinations are listed in that file).

## Install from GitHub

**Global `bonbook` command** (recommended once you’re happy with the install):

```bash
npm install -g "git+https://github.com/aSzelem/bonbook-cli.git"
```

**Or clone** and run with Node (no global install):

```bash
git clone https://github.com/aSzelem/bonbook-cli.git
cd bonbook-cli
npm install
node bin/bonbook.js set-key '<cli-key>'
node bin/bonbook.js ask 'flight from seattle to sf tmrw'
```

From a clone you can also run **`npm link`** (or **`npm install -g .`**) once to get **`bonbook`** on your `PATH`.

## Quick start

After a **global** install from GitHub:

```bash
bonbook set-key '<cli-key>'
bonbook ask 'flight from seattle to sf tmrw'
bonbook ask 'push my flight back 3hrs'
```

Example session:

```text
$ bonbook set-key '<cli-key>'
cliKey saved (****x7f2).

$ bonbook ask 'best flight from seattle to sf tmrw'
I checked 1610 options and found nine one-way flights for you from PAE/SEA to SFO starting at 349 USD. Here they are.
Options: 9 · trip one-way · $348.40–$348.40
Dates: 2026-05-01
07:10 (SEA) -> 09:27 (SFO) * 2h 17m * Nonstop
    $348.40 - Alaska or American   < link: https://m.bonbook.co/hrkuw8 >

07:20 (PAE) -> 09:29 (SFO) * 2h 9m * Nonstop
    $348.40 - Alaska   < link: https://m.bonbook.co/LykvDq >

… (additional rows in the terminal) …
```

The **`cliKey saved`** line echoes only the **last four characters** of the key.

## Behaviour

- Sends **`POST /v1/ask`**, then polls **`GET /v1/jobs/:correlationId`** every **2s** by default until **`complete`** or **`failed`** (spinner + interim status text from BonBook).
- Env: **`BONBOOK_POLL_INTERVAL_MS`** (default **`2000`**), **`BONBOOK_POLL_TIMEOUT_MS`** (default **`120000`**).
- Offer/checkout links in output may already be shortened for readability; open them in a browser to complete purchase flows.
- Auth: only the **`cli-key`** is stored locally via **`set-key`**; broader BonBook API credentials are **not** in the client.

