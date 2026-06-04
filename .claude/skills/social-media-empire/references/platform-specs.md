# Stages 3 & 5 — Create + Schedule: Per-Platform Specs

Use this when generating copy/graphics (Stage 3) and choosing slots (Stage 5).
Each platform gets **adapted** content, never a copy-paste. Validate every draft
against the limits below before it leaves the Create stage.

## Format & limit cheat sheet

| Platform | Caption max | Hashtags | Image ratio | Video | Notes |
|----------|-------------|----------|-------------|-------|-------|
| **Instagram** | 2,200 chars | 3–8 (in first comment ok) | 1:1, 4:5, 9:16 Reel | 3–90s Reel | Hook in first line; carousel = 1–10 slides |
| **Facebook** | ~63k (aim <250) | 1–3 | 1.91:1 link, 4:5 | up to 240s | Algorithm favors native video + 1 link |
| **X** | 280 (or thread) | 1–2 | 16:9, 1:1 | up to 140s | Thread for depth; hook tweet must stand alone |
| **TikTok** | 2,200 chars | 3–5 | 9:16 only | 9–180s | Trend audio + on-screen text hook in 1s |
| **LinkedIn** | 3,000 chars | 3–5 | 1.91:1, 1:1 | up to 10min | B2B voice; document carousels perform; no clickbait |

## Per-platform generation rules

**Instagram** — visual-first. Lead with a scroll-stopping image/Reel. Caption:
hook line → value → CTA. Save/share-optimized (how-to, lists). Emojis sparingly.

**Facebook** — community + reach. Conversational, question-led to drive comments.
One external link max; put link in comment if reach matters.

**X** — speed + opinion. Punchy, declarative. Threads for teardown/how-to. No
hashtag stuffing. Reply-bait questions at the end of hook tweets.

**TikTok** — native + trend-aware. Script = Hook(0–1s) / Payoff(build) / Loop or
CTA. Caption short, curiosity gap. Pair with a currently-trending sound from
Stage 1 research. On-screen text mandatory.

**LinkedIn** — authority + B2B. First 2 lines before "...see more" must earn the
expand. Story → insight → takeaway. No engagement-bait ("comment YES"). Document
(PDF carousel) posts get extra reach.

## Graphics generation (Stage 3)

1. The Strategy stage produced a `visual_prompt` per post.
2. Enrich it with the **brand kit** (`assets/brand_kit.template.json`): palette
   hex, font, logo placement, layout template, mood words. This is what keeps
   graphics on-brand across platforms.
3. Render via the configured image model (default `gpt-image-1` / DALL·E; SDXL or
   Midjourney via webhook as alternates). For video, output a shot-list + caption
   script for the TikTok/Reel renderer or a human/CapCut template.
4. Auto-resize to each platform ratio. Embed required disclaimers/watermark from
   brand kit. Reject any asset where text > 20% of image area (IG/FB ad heuristic)
   unless `format == "quote_card"`.
5. Run the brand-consistency check (see `eval-metrics.md` → Brand Fit score). If
   `brand_fit < 0.75`, regenerate once with stricter prompt, then flag for human.

## Scheduling windows (Stage 5)

Defaults below; **override nightly** with the learned best-time model from
`eval-metrics.md` once ≥14 days of data exist.

| Platform | Default best windows (operator local) |
|----------|---------------------------------------|
| Instagram | 11:00–13:00, 19:00–21:00 |
| Facebook | 09:00, 13:00–15:00 |
| X | 08:00–10:00, 12:00, 17:00–18:00 |
| TikTok | 12:00–13:00, 18:00–22:00 |
| LinkedIn | Tue–Thu 08:00–10:00, 12:00 |

Spacing rules: ≥3h between two posts on the same platform; never two posts in the
same 30-min window across all platforms (avoids notification fatigue and rate
limits). Respect each platform's API rate caps — see `n8n-integration.md`.
