# Stage 8 — Analyze + Self-Iterate (Eval Metrics & Learning Loop)

This is the brain that makes the system improve daily. It (a) scores yesterday,
(b) updates the dials that Stage 2 uses tomorrow, (c) reports to the operator.
Numbers come from real platform APIs only — never estimate engagement.

## A. KPI tree

**North-star:** qualified attention that compounds — weekly *engaged reach growth*
+ *follower quality growth*, not vanity raw views.

| Layer | Metric | Definition | Healthy direction |
|-------|--------|------------|-------------------|
| Reach | Impressions, Reach, Reach-rate | per post & per platform | ↑ |
| Engagement | ER = (likes+comments+shares+saves)/reach | core quality signal | ↑, ≥ platform baseline |
| Resonance | Saves+Shares rate | intent to revisit/spread | ↑ (weighted 2× likes) |
| Retention | Avg watch %, thread read-through | video/thread quality | ↑ |
| Growth | Net new followers, follower→reach ratio | audience building | ↑ |
| Conversion | CTR, link clicks, leads, CVR | business outcome | ↑ |
| Efficiency | Cost/post, time-to-publish, $/1k reach | one-person scalability | ↓ cost, ↑ throughput |
| Sentiment | Avg reply sentiment, complaint rate | brand health | sentiment ↑, complaints ↓ |

Per-post composite (for ranking what worked):

```
post_score = 0.30*z(ER) + 0.25*z(saves_shares_rate) + 0.15*z(retention)
           + 0.15*z(follower_delta) + 0.15*z(conversion)
```
`z()` = z-score vs the rolling 30-day baseline **for that platform+format** (so a
LinkedIn doc isn't judged against a TikTok). Flag any post with sample/reach below
the confidence floor as low-confidence (excluded from learning).

## B. The self-iteration update (runs nightly)

Stage 2 selects content using `strategy_weight[angle_type]`, best-time models, and
`predicted_engagement`. Each night:

1. **Attribute:** join published posts → metrics → compute `post_score`.
2. **Update angle weights** (multiplicative, bounded 0.25–4.0):
   ```
   strategy_weight[type] *= clamp(1 + lr * tanh(post_score), 0.8, 1.25)
   ```
   `lr` default 0.15. Decay all weights 2%/week toward 1.0 to avoid lock-in and
   keep exploring.
3. **Exploration budget:** reserve 20% of daily slots for novel angles/formats
   regardless of weight (ε-greedy). Prevents collapse onto one winning format.
4. **Best-time model:** update per-platform optimal windows from the rolling
   engagement-by-hour heatmap (needs ≥14 days).
5. **predicted_engagement model:** refit the simple regressor (features: angle_type,
   platform, format, hook style, post hour, hashtag count) on the last 60 days.
6. **Promote exemplars:** top-decile, manually-clean posts → `brand_memory` gold set
   (feeds Brand Fit in `brand-voice.md`). Retire stale ones.
7. **Prune:** any angle_type with `post_score < -0.5` for 7 consecutive days is
   auto-retired (matches the repo's "停發規則"). Notify operator.

## C. System-level evals (is the *engine* working?)

Run weekly; these gate whether autonomy stays on.

| Eval | Target | Action if breached |
|------|--------|--------------------|
| Guardrail escape rate | 0 bad posts/replies published | pause AUTO_APPROVE, alert |
| Brand Fit pass-rate | ≥ 90% of drafts ≥ 0.75 first try | retune voice prompt/exemplars |
| Human-edit rate at gate | ≤ 20% of posts edited | drafts are off — diagnose Create stage |
| Publish success rate | ≥ 98% reach the platform | check API creds/rate caps |
| Engagement SLA | ≥ 90% of replies within 2h | scale engage frequency or triage |
| Calendar fill | 100% slots filled, 0 dead air | research/strategy throughput issue |
| ER vs baseline | trailing-7d ER ≥ 30-day baseline | if down 2 wks → strategy review |
| Cost/1k reach | within budget | throttle paid/format mix |
| Forecast accuracy | predicted vs actual MAE ↓ over time | model isn't learning → check features |

## D. Daily operator report (auto-sent ~23:45)

Telegram + Notion `marketing_report`:

- Yesterday's top 3 / bottom 3 posts with `post_score` and why.
- ER / reach / follower / conversion deltas vs 7-day & 30-day.
- What the system changed tonight (weights up/down, retired angles, new best times).
- Guardrail summary: blocks, escalations, escapes (should be 0).
- Tomorrow's planned calendar + anything awaiting the human gate.
- Any eval in the table above that's breached, in red.

Keep the report skimmable in 60 seconds — it's the one-person CEO's whole dashboard.
