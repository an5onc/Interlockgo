# Interlock Go — Facebook posting agent

Generates an on-brand Facebook post each morning, lets you review/edit/approve it from a small
local web page (works from your phone too), and posts it to your Page via Meta's official Graph API.

Text-only for now. Image generation (Google Imagen) is stubbed and can be added later.

## How it works
```
8:00 AM cron  ->  generate.js   picks a topic, writes caption via `claude -p` (your Max plan)
                                 saves a draft to drafts/YYYY-MM-DD.json + macOS notification
you           ->  review.js     localhost:4500 dashboard: edit, Approve&Post, or Reject
on approve    ->  publish.js     posts to your Facebook Page (Graph API)
```
No password automation. No separate Claude API key (captions use the Claude Code CLI under your
Max plan). The only external credential is your Facebook Page token.

## One-time setup
1. **Facebook token:** follow [setup-meta.md](setup-meta.md), then fill in `secrets.env`.
2. **Install the schedule + review server:**
   ```bash
   ./install-cron.sh
   ```
   This starts the review dashboard (auto-restarts at login) and the 8 AM daily generator.

## Daily use
- Each morning you get a notification + the dashboard opens. Review the draft, tweak wording,
  hit **Approve & Post** (or **Reject**).
- Open the dashboard anytime at http://localhost:4500 — or from your phone on the same wifi at
  the LAN address printed when the server starts.

## Manual commands
```bash
node generate.js            # make today's draft now
node generate.js 2026-05-21 # make a draft for a specific date
node generate.js --force    # regenerate today's draft
node review.js              # run the dashboard in the foreground
node publish.js 2026-05-20  # post a specific approved draft from the CLI
./install-cron.sh uninstall # remove the launchd agents
```

## Customizing
- **Voice & rules:** edit `config/brand.md` (hard rules keep posts supportive and non-stigmatizing).
- **Topics:** edit `config/topics.json` to add/remove themes.
- **Post time:** change the `Hour`/`Minute` in `install-cron.sh`, then re-run it.

## Files
- `config/brand.md` — brand voice + hard content rules
- `config/topics.json` — rotating content calendar
- `generate.js` — caption generation
- `review.js` — local approval dashboard
- `publish.js` — Graph API publisher
- `daily.sh` / `install-cron.sh` — scheduling
- `secrets.env` — your tokens (gitignored)
