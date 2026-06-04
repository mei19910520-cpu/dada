# n8n Integration — Wiring the Engine

This pipeline runs as n8n workflows on the repo's existing stack
(`docker-compose.yml`: n8n queue mode + Qdrant + Postgres + Redis + Ollama). It
extends the `10–15` AI-Marketing-Dept workflows; import this one **after** them.

## Workflow map

| Workflow | Stage | Trigger | Notes |
|----------|-------|---------|-------|
| `16_Social_Empire_Orchestrator.json` | all | Schedule 06:30 + webhook | Master loop; fans out to sub-flows |
| reuse `10_Monthly_Marketing_Brain` | pillars | Monthly | Theme pillars feed Stage 2 |
| reuse `11_Content_Generator` | Create-copy | called | Per-platform copy |
| reuse `12_Creative_Visual_Studio` | Create-art | called | Graphics/video prompts |
| reuse `13_Growth_Analyst_Daily` | Analyze | 23:30 | Feeds Stage 8 weights |
| reuse `14_Competitor_Intelligence_Daily` | Research | 06:00 | Competitor feed |

The orchestrator is intentionally thin: it sequences Research → Strategize →
Create → guardrail scan → human-gate (wait) → Schedule → Publish, and runs the
Engage + Analyze loops on their own schedules. Heavy lifting is delegated to the
reused sub-workflows so each stays independently testable.

## Webhook endpoints (relative to `WEBHOOK_URL`)

| Endpoint | Purpose |
|----------|---------|
| `/webhook/social-empire/run` | Kick a full daily cycle manually |
| `/webhook/social-empire/approve` | Human-gate callback (Telegram buttons post here) |
| `/webhook/social-empire/engage` | Inbound comment/mention/DM events → triage |
| `/webhook/social-empire/metrics` | Platform metric pulls land here for Stage 8 |
| `/webhook/social-empire/stop` | Emergency kill-switch |

These follow the same convention as the repo's existing `/webhook/*` endpoints
in `CLAUDE.md`.

## Environment variables (add to `.env`, extends MARKETING_DEPARTMENT.md)

```
# Existing (reused): OPENAI_API_KEY, NOTION_API_KEY, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID,
#                    NOTION_CONTENT_QUEUE_DB_ID, NOTION_MARKETING_REPORT_DB_ID

# Control
PUBLISH_MODE=dry_run            # dry_run | live
AUTO_APPROVE=false
EMERGENCY_STOP=false
OPERATOR_TZ=Asia/Taipei

# Platform API credentials
META_GRAPH_TOKEN=               # Facebook + Instagram (Graph API, long-lived)
META_IG_BUSINESS_ID=
META_FB_PAGE_ID=
X_API_KEY=
X_API_SECRET=
X_ACCESS_TOKEN=
X_ACCESS_SECRET=
TIKTOK_CLIENT_KEY=
TIKTOK_CLIENT_SECRET=
TIKTOK_ACCESS_TOKEN=
LINKEDIN_ACCESS_TOKEN=
LINKEDIN_ORG_URN=

# Media generation
IMAGE_MODEL=gpt-image-1         # or dall-e-3 / sdxl-webhook / midjourney-webhook

# Rate caps (per platform, per hour) — keep under official limits
RATE_IG=25
RATE_FB=25
RATE_X=50
RATE_TIKTOK=10
RATE_LINKEDIN=20
```

## Publishing nodes (Stage 6)

Each platform = one HTTP Request node (or community node) hitting the official API:

- **Instagram / Facebook** → Meta Graph API (`/{ig-id}/media` + `/media_publish`;
  Pages `/feed`). Handle the 2-step container/publish for IG.
- **X** → API v2 `POST /2/tweets` (+ media upload v1.1); thread = chain `reply.in_reply_to`.
- **TikTok** → Content Posting API (`/v2/post/publish/video/init/` → upload → publish).
  Direct-post requires approved scope; otherwise drop to draft/inbox.
- **LinkedIn** → `/rest/posts` (UGC) with the org URN.

Every publish node: check kill-switch → check rate cap (Redis counter) → if
`PUBLISH_MODE=dry_run` log instead of send → on success write post_id +
permalink to `content_queue` (status `published`) → on failure backoff (max 3)
then escalate.

## State backends

- **Qdrant** collections (reuse): `market_trends`, `long_term_memory`,
  `sales_insights`; add `social_posts` for published-post embeddings (dedupe +
  best-of retrieval).
- **Postgres** (add tables): `strategy_weights`, `engagement_log`,
  `best_times`, `forecast_model`.
- **Notion** (reuse `content_queue`, `performance_daily`, `marketing_report`,
  `competitor_feed`).
- **Redis**: rate-limit counters, idempotency keys (prevent double-publish).

## Credentials to attach after import

OpenAI API, Notion API, Telegram Bot, Qdrant API, Postgres, plus the five
platform OAuth apps. Validate each with a dry-run before flipping
`PUBLISH_MODE=live`.

## Testing ladder

1. `dry_run` — full loop, nothing posts; inspect `content_queue` + report.
2. One platform live (X is cheapest to iterate), others dry_run.
3. All live with `AUTO_APPROVE=false` (human gate every day) for 1 week.
4. Optionally enable `AUTO_APPROVE=true` once guardrail escape rate has held at 0
   and human-edit rate ≤ 20% (see `eval-metrics.md`).
