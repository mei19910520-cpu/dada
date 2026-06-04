---
name: social-media-empire
description: >-
  Runs a fully autonomous one-person social-media operation across Facebook,
  Instagram, X, TikTok, and LinkedIn. Use when the user wants to research
  trending topics, generate brand-consistent copy and graphics, schedule and
  publish posts, auto-engage with replies/comments/DMs, analyze performance, and
  self-iterate the strategy on a daily loop. Also use for setting up the n8n
  workflows, brand kit, guardrails, or KPI/eval dashboards that power this
  pipeline. Trigger phrases: "social media empire", "autonomous content engine",
  "auto-post to FB/IG/X/TikTok/LinkedIn", "schedule + publish + engage",
  "daily content loop", "social growth automation".
---

# Social Media Empire — Autonomous One-Person Content Engine

## What this skill does

Operates an end-to-end, self-iterating social-media department for a single
operator. One human approval gate per day; everything else is automated through
n8n + LLM agents. The skill turns trends into published, brand-consistent posts
across **Facebook, Instagram, X, TikTok, LinkedIn**, engages with the audience,
measures results, and rewrites tomorrow's plan from what worked.

```
RESEARCH → STRATEGIZE → CREATE → REVIEW(human gate) → SCHEDULE → PUBLISH
    ↑                                                                │
    └──────────── SELF-ITERATE ←── ANALYZE ←── ENGAGE ←─────────────┘
```

## When to use it

Invoke this skill when the user wants to **build, run, debug, or tune** any part
of the autonomous social pipeline — not for one-off single posts (write those
directly). Typical requests: "set up the daily engine", "add LinkedIn to the
rotation", "why did engagement drop", "tighten the brand voice", "wire the n8n
webhooks", "give me the guardrails and eval metrics".

## How to operate it

Work the eight stages below in order. Each stage has a dedicated reference file —
**read the reference before implementing that stage**, don't reconstruct it from
memory. All stages share the same brand kit and state stores.

| # | Stage | What happens | Reference |
|---|-------|--------------|-----------|
| 1 | **Research** | Pull trends, competitor moves, hashtags, news per platform | `references/workflow-pipeline.md` |
| 2 | **Strategize** | Rank angles, assign to platforms, fill the calendar | `references/workflow-pipeline.md` |
| 3 | **Create** | Generate copy + image/video prompts, render graphics | `references/platform-specs.md`, `references/brand-voice.md` |
| 4 | **Review** | Guardrail scan + single daily human approval gate | `references/guardrails.md` |
| 5 | **Schedule** | Slot posts into per-platform optimal windows | `references/platform-specs.md` |
| 6 | **Publish** | Push to each platform API at the scheduled time | `references/n8n-integration.md` |
| 7 | **Engage** | Triage + draft replies to comments/mentions/DMs | `references/guardrails.md` |
| 8 | **Analyze + Iterate** | Score yesterday, update strategy weights | `references/eval-metrics.md` |

## Quick start (new deployment)

1. Read `references/n8n-integration.md` and confirm the env vars + Notion/Sheets
   tables exist (extends the repo's existing `MARKETING_DEPARTMENT.md` schema).
2. Copy `assets/brand_kit.template.json` → fill in voice, palette, banned terms,
   accounts. This single file drives brand consistency for every stage.
3. Import the repo's `workflows/16_Social_Empire_Orchestrator.json` into n8n
   (after the `10–15` marketing workflows) and attach credentials.
4. Set the human-approval channel (Telegram by default) so the daily gate in
   Stage 4 reaches the operator.
5. Dry-run with `PUBLISH_MODE=dry_run` for 3 days, read `references/eval-metrics.md`,
   then flip to `live` once the eval gates pass.

## Non-negotiables (always enforce)

- **Never auto-publish past the daily human gate** unless the user has explicitly
  set `AUTO_APPROVE=true` AND the post cleared every guardrail in
  `references/guardrails.md`.
- **Brand kit is the source of truth.** Every generated asset is validated
  against `assets/brand_kit.template.json` (voice, banned terms, disclaimers).
- **Kill-switch first.** Honor `EMERGENCY_STOP` / paused accounts before any
  publish or engage action.
- **No fabricated metrics or claims.** Stage 8 reports real API numbers only;
  flag low-sample results as low-confidence.

For full rules see `references/guardrails.md`. For the n8n node graph and
webhooks see `references/n8n-integration.md`.
