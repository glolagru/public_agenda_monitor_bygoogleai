---
title: "Product Brief: Public Agenda Monitor"
status: draft
created: 2026-09-12
updated: 2026-09-13
---

# Product Brief: Public Agenda Monitor

## Executive Summary

Public Agenda Monitor is an internal browser-based editorial agenda service for documentary researchers and journalists. It turns public, scheduled-event sources into a forward-looking, human-curated two-week agenda. Its purpose is not to publish more raw events; it is to reduce the editorial risk of overlooking an event with potential news value.

The product creates one accountable chain: **public source → candidate event → documentary-researcher review → verified editorial agenda**. A user manually triggers each source retrieval; documentary researchers remain responsible for relevance and correctness before an editor sees an item.

The hackathon MVP proves this chain with narrow, source-specific adapters in this order: Federal Administrative Court, Federal President, UN Women, then Federal Constitutional Court. Build the Federal Administrative Court source as the first end-to-end slice; add each subsequent adapter only after its candidate-to-approved-agenda flow works. It is deliberately a bounded public-source monitor, not a generic web crawler or a replacement for editorial judgment.

**[ASSUMPTION] The commissioning organization is an editorial team that uses an internal, browser-based tool.**

## Problem

Editorial teams depend on fragmented manual research to discover forthcoming public events. Important appointments, court developments, meetings, panels, and reports can be missed; raw search results create noise without a trusted editorial hand-off. The result is repetitive, difficult-to-audit work that is vulnerable to omission.

## Product and User Experience

A user-triggered retrieval reads fixed public pages or feeds and normalizes qualifying events into one extensible event format. New candidates enter a visually highlighted **New since last review** queue. The system prioritizes recall: a plausible event is shown to a documentary researcher rather than silently excluded.

Documentary researchers can filter and sort candidates, create a manual priority order, approve or reject an event, add a comment, and adjust a suggested 1–5 news-value score. The review record retains the original suggestion, human adjustment, decision, and comment. This feedback must influence future relevance and priority suggestions for similar events.

Only approved events appear in the editor agenda. Each agenda item foregrounds date, optional time, event name and topic, protagonists or organizer, location, source, and a direct source link.

Each event has a stable, unique ID. On repeated retrieval, the monitor updates the matching event instead of inserting a second row.

## Users

**Documentary researchers** are the editorial gatekeepers. They need to rapidly identify new candidates, verify the source, correct relevance signals, and decide what reaches the agenda.

**Editors and journalists** use the approved agenda to plan coverage. They need a compact, trustworthy view of potentially important forthcoming events, without review controls or raw candidates.

## Initial Sources and Qualification Rules

| Source | Initial qualification rule | Retrieval method |
|---|---|---|
| Federal Administrative Court | Hearing and judgment dates. | Official RSS for hearing and judgment dates: `https://www.bverwg.de/rss/termine.rss`. |
| Federal President | All published appointments. | Supplied public appointment calendar first; official appointments RSS fallback `https://www.bundespraesident.de/SiteGlobals/Functions/RSSFeed/DE/RSSNewsfeed/Termine/RSSNewsfeed.xml?nn=127360` when automated retrieval is blocked or the page cannot be reliably parsed (officially listed, checked 2026-09-13). |
| UN Women | High-level panels, ministerial meetings, and reports on gender equality, violence, care work, and gender data. | Official News and Publications pages first; direct RSS fallbacks `https://www.unwomen.org/en/feeds/news` and `https://www.unwomen.org/en/feeds/publications` second (officially listed, checked 2026-09-13). The corresponding `/rss-feeds/...` URLs are feed-information pages, not direct feeds. |
| Federal Constitutional Court | Dates listed in its official weekly outlook. | Official website/weekly outlook: `https://www.bundesverfassungsgericht.de/DE/Aktuelles/TermineWochenausblick/termine-Wochenausblick_node.html`; separate newsletter; no RSS. |

Qualification begins as transparent, editable rules: a defined source plus a defined event class produces a review-worthy candidate. UN Women can use more contextual judgment than the two rule-led German sources.

## Relevance and Learning

The monitor proposes a configurable 1–5 news-value score against this lens: *could a respected, independent news programme in Germany plausibly cover this?* The score supports ordering and review; it must not become a hard exclusion gate in the MVP.

Initial heuristic: 5 denotes likely agenda-setting national or international significance; 4 a concrete decision, judgment, high-level meeting, or major report; 3 a plausible scheduled editorial event; 2 specialist or limited relevance; 1 low likelihood of relevance. Researchers can override both score and rationale. Their aggregated approval, rejection, comment, and score feedback improves later suggestions.

## MVP Scope

### In scope

- A browser-based, open-access hackathon demo; no authentication.
- A manual **Retrieve events** trigger for each source; scheduled scanning is not part of the MVP.
- Four narrow, public-source adapters using their documented official page, feed, or newsletter retrieval method and a shared normalized event schema.
- An end-to-end candidate, review, approval, and editor-agenda workflow.
- New-event highlighting; filtering by newness, date, event, and event type; manual ranking; comments; editable score; direct source links.
- Stable event IDs and duplicate prevention across repeated retrievals.
- Persistent review history and fallback test data for the demo.

### Delivery sequence

Build one complete vertical slice first, beginning with the Federal Administrative Court source. After it produces a candidate that a researcher can approve and an editor can see, add Federal President, UN Women, then Federal Constitutional Court through the same schema.

### Out of scope

- Reuters or dpa subscription content.
- Facebook and Instagram sources.
- Generic crawling, login-protected sources, or a full autonomous editorial decision system.
- Authentication, production-grade user management, and a final trained scoring model.

## Operational Guardrails

- Only retrieve publicly accessible pages or feeds; retain only the event metadata needed for the agenda and a direct link back to the source. **[ASSUMPTION] Source-specific terms and technical access rules are checked before any production use.**
- **[ASSUMPTION]** When a page changes or parsing fails, the adapter records a visible source-health error, preserves the last successful results, and does not silently delete events. The demo can use clearly labelled fallback fixtures.

## Success Criteria

The MVP succeeds when, during a demo:

1. All four sources — Federal Administrative Court, Federal President, UN Women, and Federal Constitutional Court — produce normalized candidate events using their explicit rules and retrieval methods.
2. A documentary researcher can review one candidate, change its suggested score, leave a comment, and approve or reject it.
3. An approved event appears in the editor agenda with its required fields and direct source link.
4. A repeated manual retrieval updates an existing event rather than creating a duplicate; a source-failure fallback can be demonstrated or verified.

## Vision

After the hackathon, Public Agenda Monitor can expand its source adapters and editorial rules while preserving the same human-in-the-loop contract. The long-term value is a continuously improving, explainable public-agenda layer that helps a newsroom discover and prioritize important forthcoming events without outsourcing editorial responsibility.
