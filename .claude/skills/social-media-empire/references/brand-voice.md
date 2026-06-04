# Stage 3 — Brand Consistency System

Every piece of copy and every graphic must pass through the brand kit. The kit
(`assets/brand_kit.template.json`) is the single source of truth — when in
doubt, the kit wins over the trend.

## What the brand kit controls

| Field | Drives | Enforced where |
|-------|--------|----------------|
| `voice.tone` / `voice.traits` | Copy style, sentence length, emoji policy | Copy gen prompt + Brand Fit eval |
| `voice.do` / `voice.dont` | Phrasing rules | Copy gen prompt |
| `banned_terms` | Hard text filter | Guardrail scan (Stage 4) |
| `required_disclaimers` | Compliance lines (e.g. #ad, medical/finance) | Appended pre-publish |
| `palette` / `fonts` / `logo` | Graphic look | Visual prompt enrichment |
| `templates` | Layout per format (quote, carousel, reel cover) | Renderer |
| `pillars` | Allowed topic territory | Strategy scoring (`brand_fit`) |
| `accounts` | Handles, @-mentions, links per platform | Publisher |

## Voice generation contract

When generating copy, inject the kit into the system prompt like this:

```
You are the brand's voice. Tone: {voice.tone}. Traits: {voice.traits}.
ALWAYS: {voice.do}. NEVER: {voice.dont}. Banned words: {banned_terms}.
Write for {platform} per platform-specs.md. Output JSON:
{ "hook", "caption", "cta", "hashtags", "alt_text", "first_comment" }
```

`alt_text` is mandatory for accessibility and is generated for every image.

## Brand Fit score (0–1)

Computed for copy and graphics; gates the Create stage (threshold 0.75).

```
brand_fit = 0.35*tone_match      // LLM-judge vs voice exemplars in brand_memory
          + 0.25*lexicon         // uses approved terms, avoids banned (hard 0 if banned hit)
          + 0.20*pillar_align    // topic inside allowed pillars
          + 0.20*visual_match    // palette/logo/layout adherence (graphics only)
```

- Any `banned_terms` hit forces `brand_fit = 0` → blocked, regenerate.
- Maintain 5–10 "gold" exemplar posts in `brand_memory` (Qdrant) as the
  tone-match reference. Update them whenever a post scores top-decile engagement
  AND passes manual spot-check — this is how voice improves over time.

## Cross-platform consistency vs adaptation

Consistent (never changes): pillars, palette, logo, disclaimers, core claims,
handle/links. Adapted per platform (always changes): hook, caption length, format,
hashtag set, CTA phrasing, aspect ratio. See `platform-specs.md` for the per-platform
rules the Create stage applies on top of the kit.
