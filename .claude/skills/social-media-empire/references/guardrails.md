# Stages 4 & 7 — Guardrails (Review gate + Engagement safety)

Autonomy without guardrails is a liability. Every publish and every auto-reply
passes these checks. Order matters: **kill-switch → hard blocks → soft flags →
human gate**.

## 0. Kill-switch (checked first, always)

- `EMERGENCY_STOP=true` → halt all publish + engage immediately, notify operator.
- Per-account `paused` flag in brand kit → skip that account.
- Platform API returning auth/policy errors → pause that platform, alert, do not
  retry-spam (max 3 backoff retries, then stop).

## 1. Hard blocks (auto-reject, regenerate or drop — never publish)

A post or reply is blocked if it:

- Contains any `banned_terms` from the brand kit.
- Makes unverifiable claims: medical cures, guaranteed financial returns, "best /
  #1 / 100%" superlatives without a cited source.
- Targets protected categories or includes hate/harassment/violent content.
- Is **newsjacking the blocklist**: death/tragedy, active disasters, partisan
  politics, ongoing legal cases, religion, war. (Stage 1 should already filter;
  this is the backstop.)
- Reveals secrets/PII (API keys, customer data, internal links).
- Omits a `required_disclaimer` when the post type demands one (#ad/sponsored,
  affiliate, health, finance, AI-generated-image label per platform policy).
- Is a near-duplicate (≥0.9 cosine) of anything published in the last 30 days.

Hard block → log reason to `engagement_log`/`content_queue`, attempt **one**
guided regeneration, then route to human if still blocked.

## 2. Soft flags (publishable only after human gate)

Flag (don't block) when: sensitive-but-allowed topic, brand_fit 0.60–0.75,
sentiment risk on a reply, a claim that *could* be sourced, first time using a new
format, or predicted_engagement in the bottom decile (likely waste).

## 3. The daily human gate (Stage 4)

Exactly **one** approval touchpoint per day keeps it a one-person operation.

- 08:30 the engine sends the operator (Telegram default) a **digest**: today's N
  posts with thumbnail, platform, slot, caption, any soft flags, and predicted
  engagement.
- Operator actions: `approve all` / `approve except [ids]` / `edit [id]` /
  `reject [id]` / `pause`. Inline edits write back to `content_queue`.
- Posts not explicitly rejected and carrying no hard block move to `approved`.
- `AUTO_APPROVE=true` skips the gate **only** for posts with zero flags and
  brand_fit ≥ 0.85; flagged posts still wait. Default is `false`.
- No response by the slot time → posts hold (fail-safe), not publish.

## 4. Engagement safety (Stage 7)

Auto-reply is the highest-risk surface. Rules:

- **Triage tiers:**
  - *Auto-reply:* simple positive/neutral comments, FAQs with kit-approved
    answers, thank-yous. Max 1 reply per user per thread.
  - *Draft-for-approval:* questions needing a claim, pricing, partnership/DM,
    mixed sentiment.
  - *Escalate to human, never auto:* complaints, legal/refund, crisis, anything
    matching the hard-block list, or sentiment < −0.5.
- **Rate limits:** ≤ N auto-replies/hour/platform (default 20) and ≤ M/day to
  look human and avoid spam detection; jitter timing 30–180s.
- **No DMs to people who didn't message first.** No mass unsolicited outreach.
- Every auto-reply runs through the same hard-block + brand-voice checks as posts.
- Never argue, never engage trolls — like or ignore per policy, escalate if abusive.
- Log every action with the triggering message + chosen tier to `engagement_log`
  for the nightly audit.

## 5. Platform-policy compliance

- Honor each platform's automation/ToS limits (no fake engagement, no
  follow/unfollow churn, label AI media where required).
- Respect API rate caps (`n8n-integration.md`) — exceeding them risks bans.
- Keep an audit trail: every published post + auto-reply is logged with timestamp,
  inputs, model, and approver. This is both compliance and the data Stage 8 learns from.

## Guardrail eval (must stay green)

Track weekly in the dashboard (`eval-metrics.md`): block-precision (blocked items
that truly should've been blocked), escape rate (bad posts that got through — target
0), false-block rate, and human-override rate. A rising escape rate pauses
`AUTO_APPROVE` automatically.
