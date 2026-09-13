---
stepsCompleted: [1, 2]
inputDocuments:
  - "prds/prd-Public Agenda Monitor-2026-09-12/prd.md"
  - "architecture/architecture-Public Agenda Monitor-2026-09-12/ARCHITECTURE-SPINE.md"
  - "../specs/spec-public-agenda-monitor/SPEC.md"
  - "ux-designs/ux-Public Agenda Monitor-2026-09-12/DESIGN.md"
  - "ux-designs/ux-Public Agenda Monitor-2026-09-12/EXPERIENCE.md"
---

# Public Agenda Monitor - Epic Breakdown

## Overview

This document records the requirements extraction for the internal Public Agenda Monitor MVP. Epic design and story decomposition begin only after the user confirms this inventory.

## Requirements Inventory

### Functional Requirements

- FR-1: A Documentary Researcher can manually retrieve each approved official source on demand, delivering the Federal Administrative Court vertical slice first, followed by Federal President, UN Women, and Federal Constitutional Court.
- FR-2: The system creates Candidate Events only for documented qualification rules, while keeping plausible events available for human review.
- FR-3: The system preserves normalized event facts, source identity/link, original verification text, and supplied optional facts without guessing.
- FR-4: A repeat retrieval updates the matching source event without duplicates or loss of editorial decision, score, rank, or comment.
- FR-5: The specialist queue visibly identifies and filters new Candidate Events until a review action occurs.
- FR-6: A specialist can filter/sort candidates by newness, date, title/keyword, and type, and retain a manual priority order.
- FR-7: A specialist can inspect the transparent suggested 1–5 score/explanation and set an editorial 1–5 score; no score auto-decides.
- FR-8: A specialist can record a comment and explicit approval or rejection; append-only review history remains visible.
- FR-9: After three comparable reviewed events, feedback adjusts later suggestions and exposes approval rate, always as advisory.
- FR-10: Redaktion shows approved events only, using the same approval state as the specialist queue.
- FR-11: Redaktion shows planning facts (date, optional time, title/topic, organizer/protagonists/location when known, source and direct source link) for today through the following 13 days.
- FR-12: Redaktion visibly flags an approved event needing verification after it disappears from a later successful retrieval.
- FR-13: Specialists can see source health, a comprehensible failure and time, while prior events remain intact.
- FR-14: The demo may use visibly labelled fixtures when a real source is unavailable.

### NonFunctional Requirements

- NFR-1: Internal browser-based hackathon MVP; no authentication, role management, public access, scheduled scans, jobs, alerts, or separate API/backend service.
- NFR-2: Use only the four approved public sources in this order: Federal Administrative Court, Federal President, UN Women (News and Publications channels), and Federal Constitutional Court.
- NFR-3: Human approval is the sole path to the Redaktion agenda; all scoring and feedback is transparent and advisory.
- NFR-4: Preserve review history, manual ordering, source facts needed for verification, and earlier data across repeat retrievals and source failures.
- NFR-5: Use a 14-calendar-day agenda window and never silently delete an event that a source no longer lists.
- NFR-6: Fixtures must be visibly distinguished from real retrieval data.
- NFR-7: Use accessible, semantic, keyboard-operable responsive web UI with WCAG 2.2 AA contrast.

### Additional Requirements

- Start with the official Supabase Next.js starter, Next.js 16.3.3, TypeScript, Supabase PostgreSQL, and Vercel; pin implementation versions in the starter lockfile.
- Build one modular monolith: Next.js screens/server actions; retrieval, review and agenda modules; replaceable source adapters; server-only database access.
- Store database changes as ordered Supabase migrations; use preview deployments and fixture-tested migrations.
- Enforce stable identity with source_id plus source_event_key, derived from canonical detail URL/RSS GUID or the defined fallback.
- Use server-side mutations only; adapters return normalized events or structured source-health results and never write the database directly.
- Persist candidate, approved and rejected status; append review entries rather than overwriting them; derive one current editorial view for all screens.
- Preserve UTC timestamps plus the original supplied date/time/timezone; mark source disappearance with not_seen_in_latest_retrieval.
- Federal Administrative Court retrieval uses `https://www.bverwg.de/rss/termine.rss` for hearing and judgment dates; Federal President is page-first with `https://www.bundespraesident.de/SiteGlobals/Functions/RSSFeed/DE/RSSNewsfeed/Termine/RSSNewsfeed.xml?nn=127360` as the official RSS fallback; UN Women is page-first for News and Publications with direct RSS fallbacks `https://www.unwomen.org/en/feeds/news` and `https://www.unwomen.org/en/feeds/publications` respectively. The corresponding UN Women `/rss-feeds/...` URLs are information pages, not direct feeds. These fallback endpoints were officially listed and checked on 2026-09-13. Federal Constitutional Court uses `https://www.bundesverfassungsgericht.de/DE/Aktuelles/TermineWochenausblick/termine-Wochenausblick_node.html` as its official website/weekly outlook and a separate newsletter, with no RSS.

### UX Design Requirements

- UX-DR1: Build a landing page with two clearly named entries: Information Specialists and Redaktion.
- UX-DR2: Render a desktop-first, horizontally scrollable semantic event table with date, optional time, title, overarching topic, type, source, direct source link, relevance, and status.
- UX-DR3: In the Information Specialists view, put the final-column Freigeben action at the end of each row; omit this column and action completely in Redaktion.
- UX-DR4: Render known existing events with calm blue and newly retrieved events with subtle orange, always paired with explicit state text.
- UX-DR5: Support manual queue priority via drag-and-drop and an equivalent keyboard action.
- UX-DR6: Preserve direct source links, accessible table headers, role selection, release controls, and complete factual columns at narrow widths.
- UX-DR7: Do not include comments in the first visual draft; retain comment/review capability in the implementation scope required by FR-8.
- UX-DR8: Show source-health, fixture, verification-needed, candidate/approved/rejected and unknown-time states with explicit text.

### FR Coverage Map

FR-1: Epic 1 — Manual retrieval from approved official sources.
FR-2: Epic 1 — Qualification of retrieved Candidate Events.
FR-3: Epic 1 — Normalized, verifiable event records.
FR-4: Epic 1 — Duplicate-safe repeat retrieval.
FR-5: Epic 2 — New-event identification and filtering.
FR-6: Epic 2 — Candidate finding, sorting, and retained manual priority.
FR-7: Epic 2 — Suggested and editorial relevance scoring.
FR-8: Epic 2 — Append-only review comments and explicit decisions.
FR-9: Epic 2 — Transparent feedback-based suggestion improvement.
FR-10: Epic 3 — Approved events only in the Redaktion agenda.
FR-11: Epic 3 — 14-day planning facts and direct source links.
FR-12: Epic 3 — Verification flag for later-missing approved events.
FR-13: Epic 1 — Visible source health without destructive failure handling.
FR-14: Epic 1 — Clearly labelled fallback fixture data.

## Epic List

### Epic 1: Verlässliche Ereignisgewinnung

Documentary Researchers can manually retrieve qualifying official events and retain a trustworthy, verifiable Candidate Event base even if a source fails.

**FRs covered:** FR-1, FR-2, FR-3, FR-4, FR-13, FR-14.

### Epic 2: Redaktionelle Prüfwarteschlange

Information Specialists can find, prioritize, score, explain, and explicitly decide Candidate Events without automated editorial decisions.

**FRs covered:** FR-5, FR-6, FR-7, FR-8, FR-9.

### Epic 3: Planungsagenda für die Redaktion

Editors and journalists can plan coverage from a compact, trustworthy 14-day agenda of approved events only.

**FRs covered:** FR-10, FR-11, FR-12.

## Epic 1: Verlässliche Ereignisgewinnung

Documentary Researchers can manually retrieve qualifying official events and retain a trustworthy, verifiable Candidate Event base even if a source fails.

### Story 1.1: Erster vollständiger Quellenabruf für das Bundesverwaltungsgericht

As a Documentary Researcher,
I want to manually retrieve Federal Administrative Court hearing and judgment dates into a Candidate Event list,
So that I can replace repeated manual searching with a verifiable first source slice.

**Acceptance Criteria:**

**Given** the application is initialized from the approved Next.js and Supabase starter,
**When** a Documentary Researcher selects the Federal Administrative Court retrieval action,
**Then** a server-side workflow reads `https://www.bverwg.de/rss/termine.rss` for hearing and judgment dates,
**And** qualifying hearing and judgment dates appear as normalized Candidate Events with source, direct source link, title, event type, date, stable identity, and supplied optional facts without guessing.

### Story 1.2: Sichere Wiederholung, Quellenstatus und Demo-Fallback

As a Documentary Researcher,
I want to repeat a retrieval and understand source problems without losing prior research,
So that the candidate base stays trustworthy during normal work and the hackathon demo.

**Acceptance Criteria:**

**Given** a source has previously supplied Candidate Events,
**When** its retrieval is repeated,
**Then** matching source_id plus source_event_key records are updated rather than duplicated and retained source facts remain verifiable,
**And** a failed retrieval shows an understandable Source Health result and time while preserving earlier events,
**And** an unavailable source may show visibly labelled Fixture data rather than presenting it as a successful retrieval.

### Story 1.3: Erweiterung auf die weiteren vereinbarten Quellen

As a Documentary Researcher,
I want to retrieve Federal President, UN Women, and Federal Constitutional Court through the same candidate workflow,
So that the agreed four-source research base is complete.

**Acceptance Criteria:**

**Given** the Federal Administrative Court vertical slice is working,
**When** the researcher manually retrieves the other approved sources,
**Then** Federal President, UN Women News and Publications channels, and Federal Constitutional Court return qualifying normalized Candidate Events through the shared adapter interface in that delivery order,
**And** Federal President uses `https://www.bundespraesident.de/SiteGlobals/Functions/RSSFeed/DE/RSSNewsfeed/Termine/RSSNewsfeed.xml?nn=127360` as its official appointments RSS fallback only when its official appointment calendar cannot be retrieved or reliably parsed,
**And** UN Women uses `https://www.unwomen.org/en/feeds/news` for News or `https://www.unwomen.org/en/feeds/publications` for Publications as its corresponding direct RSS fallback only when its official page cannot be retrieved or reliably parsed,
**And** Federal Constitutional Court uses `https://www.bundesverfassungsgericht.de/DE/Aktuelles/TermineWochenausblick/termine-Wochenausblick_node.html` as its official website/weekly outlook and a separate newsletter, with no RSS.

## Epic 2: Redaktionelle Prüfwarteschlange

Information Specialists can find, prioritize, score, explain, and explicitly decide Candidate Events without automated editorial decisions.

### Story 2.1: Zugang und rollenklare Prüfwarteschlange

As an Information Specialist,
I want to enter a role-specific review queue from the landing page,
So that I can inspect Candidate Events in a clear, bounded working context.

**Acceptance Criteria:**

**Given** the app opens on its landing page,
**When** an Information Specialist selects the specialist entry,
**Then** the app shows a desktop-first, horizontally scrollable semantic table with date, optional time, title, overarching topic, type, source, direct source link, relevance, and status,
**And** the final table column offers the Freigeben action only in this specialist context,
**And** existing and new events use calm blue and subtle orange respectively alongside explicit text labels.

### Story 2.2: Kandidaten finden und priorisieren

As an Information Specialist,
I want to identify, filter, and manually prioritize Candidate Events,
So that I can focus my review work on the most relevant events first.

**Acceptance Criteria:**

**Given** Candidate Events are visible in the specialist queue,
**When** the specialist filters by newness, date, title or keyword, or event type and changes a priority,
**Then** the queue applies the selected filter or sort using the current editorial view,
**And** a new marker remains until a review action,
**And** priority can be changed by drag-and-drop and an equivalent keyboard interaction and is retained after repeat retrieval.

### Story 2.3: Relevanz bewerten und redaktionell entscheiden

As an Information Specialist,
I want to assess a suggested score, set my editorial score, and explicitly approve or reject a Candidate Event,
So that only accountable editorial decisions can reach the Redaktion agenda.

**Acceptance Criteria:**

**Given** a Candidate Event is available for review,
**When** the specialist records a score, comment, approval, or rejection,
**Then** the app shows the transparent suggested score and explanation and accepts an editorial score from 1 through 5,
**And** it records an append-only Review Entry with decision, changed score where applicable, comment, and time,
**And** no score or priority suggestion can automatically decide an event,
**And** comments remain outside the first horizontal table mockup while remaining available through the review interaction.

### Story 2.4: Transparente Lernschleife für Vorschläge

As an Information Specialist,
I want to understand how earlier comparable reviews affect later suggestions,
So that I can rely on the tool as transparent assistance rather than an autonomous decision-maker.

**Acceptance Criteria:**

**Given** at least three reviewed Candidate Events share a source and event type,
**When** a later comparable event is retrieved,
**Then** the suggested score adjustment uses the documented rounded prior score difference and remains within 1 through 5,
**And** the app shows the rule or feedback behind the suggestion plus the comparable group's approval rate,
**And** the adjusted suggestion remains advisory only.

## Epic 3: Planungsagenda für die Redaktion

Editors and journalists can plan coverage from a compact, trustworthy 14-day agenda of approved events only.

### Story 3.1: Redaktionszugang und freigegebene Agenda

As an Editor or Journalist,
I want to open a role-specific agenda containing approved events only,
So that candidate and review controls do not distract from coverage planning.

**Acceptance Criteria:**

**Given** the app opens on its landing page,
**When** an Editor or Journalist selects the Redaktion entry,
**Then** the app shows the Redaktion heading and the same horizontal factual table structure,
**And** it excludes Candidate Events and rejected events,
**And** it omits the Freigeben column and every other review action.

### Story 3.2: Vollständige 14-Tage-Planungsdaten und Prüfhinweise

As an Editor or Journalist,
I want to see complete available planning facts and verification warnings for upcoming approved events,
So that I can make informed coverage decisions.

**Acceptance Criteria:**

**Given** approved events exist,
**When** the Redaktion agenda is viewed,
**Then** it shows only events from today through the following 13 calendar days with date, optional time, title, overarching topic, type, source, direct link, and supplied organizer, protagonists, or location,
**And** unknown source facts remain blank rather than guessed,
**And** an approved event absent from a later successful retrieval remains visible with an explicit “Prüfung nötig” marker.
