---
title: "PRD: Public Agenda Monitor"
status: final
created: 2026-09-12
updated: 2026-09-13
---

# PRD: Public Agenda Monitor

## 0. Document Purpose

This PRD defines the product requirements for the internal hackathon MVP of Public Agenda Monitor. It is for the editorial team and for the people implementing the MVP. It builds on the product brief and the Architecture Spine; the latter remains the source for technology and implementation decisions.

## 1. Vision

Public Agenda Monitor replaces the manual search of public event sources and the manual maintenance of the current Word agenda document. It provides one clearer, forward-looking working view of editorially relevant upcoming events.

The product keeps editorial judgment with documentary researchers. It retrieves plausible events from a small set of official public sources, presents them for review, and shows only explicitly approved items to editors and journalists. It is a research and planning aid, not an autonomous newsroom decision-maker.

## 2. Target Users

### 2.1 Documentary Researchers

Documentary Researchers need to find new potential agenda items without repeatedly searching several public websites. They need to verify each source, adjust the product's relevance suggestion, record their assessment, and decide what reaches the agenda.

**Jobs to be done**

- Discover forthcoming public events from the agreed sources without maintaining a separate Word document.
- See which Candidate Events are new and which sources need attention.
- Apply editorial judgment through a score, comment, ranking, and explicit approval or rejection.
- Verify an event quickly from its direct source link and original source text.

### 2.2 Editors and Journalists

Editors and Journalists need a compact, trustworthy agenda for coverage planning. They consume approved events only; they do not use the review controls or raw Candidate Events in the MVP.

### 2.3 Non-Users in the MVP

- The public: the MVP is an internal hackathon demo, not a public agenda service.
- External sources or contributors: they cannot submit events.
- Users needing individual accounts or permissions: authentication and role management are outside the MVP.

## 3. Glossary

- **Source** — One named publisher monitored by the product. A Source may have one or more **Channels**, which are its official web pages or feeds. UN Women is one Source with News and Publications Channels.
- **Channel** — One official web page or feed used to retrieve items for a Source.
- **Candidate Event** — A retrieved event that a Documentary Researcher has not yet approved or rejected.
- **Approved Event** — An event explicitly approved by a Documentary Researcher; it appears in the Editor Agenda.
- **Editor Agenda** — The forward-looking view of Approved Events used for editorial planning.
- **Retrieval** — A user-triggered attempt to collect events from one Source.
- **Source Health** — The visible success or failure state of a Source's most recent Retrieval.
- **Review Entry** — The recorded decision, score change, comment, and time of one editorial review action.
- **Suggested Score** — The product's transparent, editable 1–5 news-value recommendation; it is advisory only.
- **Editorial Score** — The 1–5 score set or accepted by a Documentary Researcher.
- **Fixture** — Clearly labelled demo data used when a real Source cannot be retrieved for the demo.

## 4. Features

### 4.1 Retrieve official public events

**Description:** A Documentary Researcher can manually retrieve events from each agreed Source. The product delivers the Federal Administrative Court Source as a complete vertical slice first, then Federal President, UN Women, and Federal Constitutional Court through the same user experience. The product uses only the documented official public pages, feeds, and newsletter specified below and applies transparent qualification rules. It prioritizes recall: a plausible event is presented as a Candidate Event rather than silently excluded.

**Functional Requirements**

#### FR-1: Manually retrieve a Source

A Documentary Researcher can start a Retrieval for one Source on demand.

**Consequences (testable):**

- The MVP supports only these Sources, in delivery order:
  - Federal Administrative Court: official RSS for hearing and judgment dates: `https://www.bverwg.de/rss/termine.rss`
  - Federal President: appointment calendar `https://www.bundespraesident.de/SiteGlobals/Forms/Suche/Termine/Terminsuche_Formular.html?nn=222254`; RSS fallback `https://www.bundespraesident.de/SiteGlobals/Functions/RSSFeed/DE/RSSNewsfeed/Termine/RSSNewsfeed.xml?nn=127360` (officially listed, checked 2026-09-13).
  - UN Women: News (`https://www.unwomen.org/en/news-stories`; direct RSS fallback: `https://www.unwomen.org/en/feeds/news`) and Publications (`https://www.unwomen.org/en/publications`; direct RSS fallback: `https://www.unwomen.org/en/feeds/publications`) channels (officially listed, checked 2026-09-13). The corresponding `/rss-feeds/news` and `/rss-feeds/publications` URLs are information pages, not direct feeds.
  - Federal Constitutional Court: official website/weekly outlook (`https://www.bundesverfassungsgericht.de/DE/Aktuelles/TermineWochenausblick/termine-Wochenausblick_node.html`) and separate newsletter; no RSS.
- The Federal Administrative Court retrieves `https://www.bverwg.de/rss/termine.rss` for hearing and judgment dates.
- For the Federal President, retrieve the supplied Terminkalender page first. If automated retrieval is blocked or the page cannot be reliably parsed, use `https://www.bundespraesident.de/SiteGlobals/Functions/RSSFeed/DE/RSSNewsfeed/Termine/RSSNewsfeed.xml?nn=127360` as the official appointments RSS fallback.
- For UN Women, retrieve the official News and Publications pages first. If a respective page cannot be retrieved or reliably parsed, use that channel's direct RSS fallback: `https://www.unwomen.org/en/feeds/news` for News or `https://www.unwomen.org/en/feeds/publications` for Publications.
- Scheduled scanning is not triggered by the MVP.
- The Federal Administrative Court Source is demonstrated end-to-end before Federal President, UN Women, and Federal Constitutional Court are added in that order.

#### FR-2: Apply source qualification rules

The product creates Candidate Events only when the Source's documented MVP qualification rule applies.

**Consequences (testable):**

- Federal Administrative Court hearing and judgment dates qualify.
- All published Federal President appointments qualify.
- UN Women high-level panels, ministerial meetings, and reports on gender equality, violence, care work, and gender data qualify.
- All dates listed in the Federal Constitutional Court's official weekly outlook qualify.
- The product displays a plausible event rather than using Suggested Score as a hard exclusion gate.

#### FR-3: Preserve a normalized event record

The product preserves a Candidate Event with the facts needed for research and agenda planning.

**Consequences (testable):**

- Each event includes source, direct source link, title, event type, date, and a stable unique identity.
- It retains time/timezone, topic, protagonists or organizer, and location when the Source provides them.
- Unknown Source facts remain blank and are never guessed.
- The original Source text needed to verify the event remains available to Documentary Researchers.

#### FR-4: Avoid duplicate events on repeat Retrieval

The product updates the matching event when a Source is retrieved again instead of adding a duplicate.

**Consequences (testable):**

- A repeated Retrieval of the same Source Event results in one event in the Candidate Event list or Editor Agenda.
- The product identifies a Source Event by its Source and canonical detail URL or RSS GUID. If neither is available, it uses the Source, normalised title, and source date as the fallback identity.
- A Retrieval never overwrites a Documentary Researcher's decision, Editorial Score, ranking, or comment.

### 4.2 Review and prioritise Candidate Events

**Description:** Documentary Researchers work from a clear Candidate Event queue. They can identify newly found events, filter and sort the queue, set a manual priority order, assess news value, comment, and decide the event's status. The review is the editorial gate.

**Functional Requirements**

#### FR-5: Identify newly found Candidate Events

The product visibly distinguishes a Candidate Event that has not yet received a Review Entry.

**Consequences (testable):**

- A newly retrieved Candidate Event is labelled as new until a Documentary Researcher records a comment, sets an Editorial Score, approves it, or rejects it.
- The Candidate Event queue can be filtered by newness.

#### FR-6: Find and order Candidate Events

A Documentary Researcher can filter and sort Candidate Events by newness, date, title or keyword, and event type, and can set a manual priority order.

**Consequences (testable):**

- The queue uses the same current event state for filtering, ranking, and display.
- Manual priority order is retained after a repeat Retrieval.

#### FR-7: Review editorial relevance

A Documentary Researcher can inspect a Candidate Event, see a Suggested Score and its explanation, and set an Editorial Score from 1 to 5.

**Consequences (testable):**

- The Suggested Score follows the shared lens: plausible coverage by a respected, independent German news programme.
- The original suggestion and the researcher's Editorial Score are both retained.
- The score does not automatically approve, reject, or remove an event.

#### FR-8: Record a comment and decision

A Documentary Researcher can add a comment and explicitly approve or reject a Candidate Event.

**Consequences (testable):**

- Each Review Entry retains the decision, score change where made, comment, and time.
- Review history is retained rather than overwritten.
- An Approved Event can be reviewed again if editorial information changes; its history remains visible.

#### FR-9: Use feedback to improve suggestions

The product uses accumulated Review Entries to improve later Suggested Scores and priority suggestions for similar Candidate Events.

**Consequences (testable):**

- The MVP starts with transparent, editable Source-and-event-type rules. Once at least three reviewed Candidate Events exist for the same Source and event type, stored review feedback adjusts later Suggested Scores within the 1–5 range.
- The priority suggestion also displays the approval rate for that Source-and-event-type group.
- The product identifies the rule or feedback behind a Suggested Score.
- Feedback remains advisory and never becomes autonomous editorial decision-making.

### 4.3 Publish the Editor Agenda

**Description:** The Editor Agenda is the replacement for the manually maintained Word agenda document. It is a compact, read-focused view of Approved Events for planning coverage.

**Functional Requirements**

#### FR-10: Show approved events only

An Editor or Journalist can see only Approved Events in the Editor Agenda.

**Consequences (testable):**

- Candidate Events and rejected events do not appear in the Editor Agenda.
- The Editor Agenda uses the same approval state as the Candidate Event queue.

#### FR-11: Show the information required for planning

The Editor Agenda presents the available event facts needed to assess and plan coverage.

**Consequences (testable):**

- Each Approved Event shows date; time when known; event name and topic; protagonists or organizer when known; location when known; Source; and direct source link.
- The agenda includes events whose start date is today or within the following 13 calendar days (14 calendar days in total).

#### FR-12: Flag an event that needs verification

The Editor Agenda visibly flags an Approved Event for verification when it is no longer found in a successful later Retrieval.

**Consequences (testable):**

- The product does not silently remove the event or change its approval state.
- A Documentary Researcher decides whether the event is withdrawn, remains valid, or needs further verification.

### 4.4 Make Source Health and demo resilience visible

**Description:** The product must make Source failures visible, retain prior research, and support a reliable hackathon demonstration without presenting Fixture data as real data.

**Functional Requirements**

#### FR-13: Show Source Health

A Documentary Researcher can see whether the most recent Retrieval for each Source succeeded or failed.

**Consequences (testable):**

- A failed Source displays an understandable error and the time of the failed Retrieval.
- The product retains the last successful event data after a failure.
- A failed Retrieval never silently deletes events.

#### FR-14: Use clearly labelled Fixtures

The product can use Fixture data to demonstrate the MVP when a real Source is unavailable.

**Consequences (testable):**

- Every Fixture is visibly labelled as demo data in the relevant view.
- Fixture data is not presented as a successful real Retrieval.

## 5. Cross-Cutting Requirements and Guardrails

### Reliability and data integrity

- The product preserves Review Entries and manual ordering across repeated Retrievals and failed Source access.
- A successful Retrieval that no longer finds an event marks the event for verification; it does not delete it.
- The product retains only event metadata needed for the agenda, the direct Source link, and the original Source text needed to verify the event.

### Editorial control

- Human approval is required before an event appears in the Editor Agenda.
- Suggested Scores and feedback are explainable and advisory.

### Access and Source boundaries

- The MVP is a browser-based, internal hackathon demo with no authentication.
- It retrieves only publicly accessible official pages or feeds.

## 6. Non-Goals (Explicit)

- Replacing editorial judgment or automatically deciding coverage relevance.
- A final trained or opaque scoring model.
- Generic web crawling, login-protected Sources, or Facebook and Instagram Sources.
- Reuters or dpa subscription content.
- Authentication, user management, and production-grade roles.
- Scheduled scanning, background jobs, alerts, or a separate API/backend service.
- Automatic confirmation that an event has been withdrawn.

## 7. MVP Scope

### 7.1 In Scope

- The four named public Sources, delivered in this sequence: Federal Administrative Court, Federal President, UN Women, then Federal Constitutional Court.
- Manual Retrieval, Candidate Event review, and an Editor Agenda.
- Score, comment, manual priority, approval/rejection, and retained Review Entries.
- Duplicate prevention, visible Source Health, and labelled Fixtures.

### 7.2 Out of Scope for MVP

- Any operation beyond the one-time internal hackathon, including production readiness, because it would require separate access, source-use, and operational decisions.
- Additional Sources, scheduled retrieval, and automated alerts, because the first manual vertical slice must work first.
- A generic crawler or autonomous relevance system, because these would weaken the transparent human editorial gate.

## 8. Success Metrics

**Primary**

- **SM-1:** During the demo, all four Sources produce rule-qualified Candidate Events, or an explicitly labelled Fixture demonstrates an unavailable Source. Validates FR-1, FR-2, FR-14.
- **SM-2:** A Documentary Researcher can change a Suggested Score, add a comment, and approve or reject one Candidate Event; the resulting Approved Event appears in the Editor Agenda with its required event facts and direct source link. Validates FR-7, FR-8, FR-10, FR-11.
- **SM-3:** A repeated Retrieval updates an existing event rather than producing a duplicate, and a failed Source leaves prior events visible with Source Health shown. Validates FR-4, FR-13.

**Counter-metrics**

- **SM-C1:** Do not optimise for the number of automatically filtered events; plausible events must remain available for human review. Counterbalances SM-1.
- **SM-C2:** Do not optimise for automatic approval rate; the Documentary Researcher remains accountable for approval. Counterbalances SM-2.
