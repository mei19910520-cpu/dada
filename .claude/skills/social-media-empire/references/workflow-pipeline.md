# The Daily Autonomous Loop — Stages 1–2 (Research → Strategize)

This file details the front half of the pipeline: how the engine decides *what*
to say each day. Stages 3–8 are covered in `platform-specs.md`,
`guardrails.md`, and `eval-metrics.md`.

## Daily clock (default, operator timezone)

| Time | Stage | Workflow / agent |
|------|-------|------------------|
| 06:30 | Research | Trend & Competitor Scout |
| 07:00 | Strategize | Strategy Brain (fills calendar) |
| 07:30 | Create | Content + Creative agents |
| 08:30 | Review | Guardrail scan → **human gate** |
| per-slot | Schedule/Publish | Publisher (platform queues) |
| every 30 min | Engage | Engagement triage agent |
| 23:30 | Analyze + Iterate | Growth Analyst → weight update |

Weekly (Mon 06:00): full strategy re-baseline + competitor deep-dive.
Monthly (1st 06:00): reuse repo's `10_Monthly_Marketing_Brain` for theme pillars.

## Stage 1 — Research

**Goal:** produce a ranked `trend_pool` of 15–30 candidate angles with evidence.

Inputs per run:
- Platform trending APIs / scrapers: X trends, TikTok Creative Center, IG/FB
  hashtag volume, LinkedIn news, Google Trends (rising queries).
- Competitor feed (reuse `competitor_feed` table from `MARKETING_DEPARTMENT.md`).
- Brand pillars from the monthly brain + last 30 days of own top performers.

Each candidate angle is a JSON object:

```json
{
  "angle": "short framing of the idea",
  "evidence": ["trend source + metric", "competitor signal"],
  "momentum": 0.0,            // 0–1, how fast it's rising
  "brand_fit": 0.0,           // 0–1, alignment to brand pillars
  "platforms": ["IG", "TikTok"],
  "freshness_hours": 0,       // age of the trend; <48h preferred
  "saturation": 0.0           // 0–1, how crowded already (penalize)
}
```

**Anti-chase rule:** never act on a trend with `saturation > 0.8` unless
`brand_fit > 0.7`. Avoid news involving tragedy, politics, or protected
categories (see `guardrails.md` → newsjacking blocklist).

## Stage 2 — Strategize

**Goal:** convert `trend_pool` into a concrete, slotted `content_calendar` for
the next 24h (and a rolling 7-day draft).

Selection score (higher = scheduled sooner):

```
priority = 0.30*momentum + 0.30*brand_fit + 0.20*predicted_engagement
         + 0.10*(1 - saturation) + 0.10*strategy_weight[angle_type]
```

- `predicted_engagement` comes from Stage 8's learned model (cold-start = 0.5).
- `strategy_weight[angle_type]` is the self-iteration dial updated nightly in
  `eval-metrics.md`. It is how the system "learns".

**Platform allocation** (default mix per day, tune in brand kit):

| Platform | Posts/day | Primary format |
|----------|-----------|----------------|
| Instagram | 1–2 | Reel + carousel |
| TikTok | 1–2 | Short video |
| X | 3–5 | Text/thread + image |
| Facebook | 1 | Link/image post |
| LinkedIn | 1 | Document/text (B2B) |

Cross-posting: the same angle may be **adapted** (not duplicated) across
platforms — copy, aspect ratio, hook, and hashtags are re-generated per platform
per `platform-specs.md`. Hard rule: no identical caption on two platforms.

Output written to `content_queue` (Notion/Sheets), status `drafted`, one row per
post with: `platform, slot_time, angle, hook, caption, cta, hashtags,
visual_prompt, source_evidence, predicted_engagement`.

## State stores used across the loop

| Store | Backend | Purpose |
|-------|---------|---------|
| `trend_pool` | Qdrant `market_trends` + Sheets | today's candidates |
| `content_queue` | Notion `content_queue` | drafted → approved → published |
| `performance_daily` | Notion `performance_daily` | metrics per post |
| `strategy_weights` | Postgres `strategy_weights` | self-iteration dials |
| `engagement_log` | Postgres `engagement_log` | replies sent + sentiment |
| `brand_memory` | Qdrant `long_term_memory` | what works, voice exemplars |

Hand-off contract between stages is always the JSON shapes above — keep them
stable so each n8n node can be developed and tested independently.
