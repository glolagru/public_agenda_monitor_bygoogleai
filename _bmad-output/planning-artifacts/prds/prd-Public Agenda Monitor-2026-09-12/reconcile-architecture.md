# PRD / Architecture Reconciliation

Reviewed 2026-09-12 against `prd.md` and `ARCHITECTURE-SPINE.md`. Later product decisions in the PRD take precedence over the original brief.

## Findings requiring resolution before implementation

| Priority | Finding | Evidence | Required resolution |
| --- | --- | --- | --- |
| P1 | The Architecture Spine does not enforce the PRD's defined agenda window. | FR-11 limits the Editor Agenda to today plus the following 13 calendar days. AD-5/AD-9 say the agenda selects approved events, without the date predicate. | Add the 14-calendar-day predicate to the agenda read model / architecture contract. Approved events outside that range must not appear in the default Editor Agenda. |
| P1 | The architecture makes learning feedback optional although the PRD makes it an MVP requirement. | FR-9 requires accumulated Review Entries to improve later Suggested Scores and priority suggestions. AD-10 says aggregate feedback “may adjust” later suggestions. | Make the defined simple aggregate feedback loop mandatory, or explicitly reduce FR-9 to a deferred/non-MVP capability. |
| P1 | Source-text retention is contradictory. | FR-3 requires original Source text needed for verification to remain available. The PRD's data-integrity guardrail and AD-8 support this; the Architecture Spine's cross-cutting rule says to retain only event metadata and a direct Source link. | Amend the architecture data-retention statement to permit retaining the bounded original source text required by FR-3, or change FR-3 to direct-link-only verification. |

## Implementation-critical omissions

| Priority | Omission | Why it matters | Required resolution |
| --- | --- | --- | --- |
| P1 | The exact Federal President appointments RSS endpoint is not recorded. | Both documents require that official RSS feed as the fallback, but neither gives a retrievable endpoint or configuration value. | Record the canonical feed URL (and a verification date) in source-adapter configuration or the PRD/source register. |
| P1 | The supplied UN Women fallback URLs are named as feeds but not verified as their machine-readable endpoints. | The adapter needs the final canonical feed URL(s), not only a feed-directory or landing-page URL. | Resolve and record the final official news and publications feed endpoints before implementing the UN Women adapter. |

## Aligned decisions

- The three-source scope, including the two distinct UN Women news/publications feeds, is consistent.
- Retrieval is manual; the Federal President page is attempted first and has an RSS fallback. UN Women pages likewise have per-feed RSS fallbacks.
- The Federal President-first vertical-slice delivery sequence is consistent.
- There is one Next.js application with server-side actions, no separate API/backend service, and no authentication for the internal hackathon MVP.
- Duplicate prevention, retained review history/manual ranking, non-destructive source failure handling, labelled fixtures, and human editorial approval are consistent.
- A successful later retrieval that no longer lists an event marks it for verification rather than deleting or unapproving it.

No other true product or architecture conflicts were found.
