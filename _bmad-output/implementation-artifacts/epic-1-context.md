# Epic 1 Context: Verlässliche Ereignisgewinnung

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Establish a trustworthy candidate-event foundation: Documentary Researchers can manually retrieve qualifying events from the four approved official sources, inspect their provenance, and retain them safely across repeat retrievals or source failures. This replaces repeated manual searching while preserving human editorial control for later review and agenda inclusion.

## Stories

- Story 1.1: Erster vollständiger Quellenabruf für das Bundesverwaltungsgericht
- Story 1.2: Sichere Wiederholung, Quellenstatus und Demo-Fallback
- Story 1.3: Erweiterung auf die weiteren vereinbarten Quellen

## Requirements & Constraints

- Support only the agreed public sources, delivered in order: Federal Administrative Court, Federal President, UN Women (News and Publications channels), then Federal Constitutional Court. Retrieval is manual only; scheduled scans, background jobs, generic crawling, login-protected sources, and a separate API/backend service are out of scope.
- Start with the Federal Administrative Court vertical slice. Retrieve its official RSS feed for hearing and judgment dates; create Candidate Events only when the documented source qualification rule is met, while retaining plausible events for human review rather than silently excluding them.
- Preserve verifiable normalized facts: source identity, direct official source URL, original source text needed for verification, title, event type, date, and supplied optional topic, time/timezone, organizer or protagonists, and location. Keep unknown optional facts empty; never infer them.
- A repeat retrieval must update the matching source event without duplicates or loss of its editorial decision, manual score, rank, or comment. Retain prior events and reviews after failed retrievals.
- Show the most recent source-health outcome to researchers with a comprehensible failure message and time. A failed retrieval must not silently delete data. Demo fixtures are allowed only when explicitly and visibly labelled as demo data, never as a successful real retrieval.
- A successful retrieval that no longer finds a known event marks it as not seen in the latest retrieval; it does not delete it or change its editorial state.
- The MVP is an internal browser-based demo with no authentication. Use accessible, semantic, keyboard-operable responsive UI and WCAG 2.2 AA contrast; state must always be expressed in text as well as color.

## Technical Decisions

- Build the official Supabase Next.js starter as a Next.js 16.3.3/TypeScript modular monolith, deployed on Vercel. Keep screens and server actions in `app`, workflows in `modules`, source connectors in `adapters`, shared domain/database code in `lib`, and ordered schema changes in Supabase migrations. Test migrations against fixtures and use preview deployments.
- Retrieval is a server-side workflow: a browser action calls a Next.js server action, which invokes a replaceable adapter and persists its result. Adapters return either normalized events or a structured source-health result; they never write the database directly. The browser must not receive privileged database credentials or write tables directly.
- Give every event an opaque internal UUID and enforce unique stable identity on `source_id + source_event_key`. Derive the key from canonical detail URL or RSS GUID; only if neither exists, use source, normalized title, and source date. Upsert current source facts only.
- Persist source, retrieval-run, event, and review-entry records. A retrieval run captures source, outcome, and timestamp. Event records retain first/last seen timestamps, fixture flag, and `not_seen_in_latest_retrieval`; store UTC timestamps while retaining the source-supplied date, time, and timezone.
- Use `candidate`, `approved`, and `rejected` event states. Retrieval starts events as candidates; only an explicit researcher decision changes the state. Review history is append-only and the application derives one server-side current editorial view for every screen.
- Adapter endpoints and order: Federal Administrative Court RSS `https://www.bverwg.de/rss/termine.rss`; Federal President appointment calendar first, then its official appointments RSS only if retrieval/parsing fails; UN Women News and Publications pages first, then their respective direct `/en/feeds/news` or `/en/feeds/publications` RSS fallback; Federal Constitutional Court official weekly-outlook page and separate newsletter, with no RSS. Do not use UN Women `/rss-feeds/...` information pages as feeds. Validate fallback HTTP status, content format, and parsability at runtime.

## UX & Interaction Patterns

- The specialist surface is a desktop-first, horizontally scrollable semantic event table. Keep date, optional time, title, topic, type, source, direct source link, relevance, and status available at narrow widths; direct links open the retained official detail.
- Mark newly retrieved candidates with subtle orange plus explicit “Neu”; use calm blue for existing events. Display source health failures with understandable text and their failed-retrieval time, and identify fixtures with a visible “Demo data” label.

## Cross-Story Dependencies

- Story 1.1 establishes the normalized contract, retrieval workflow, persistence, and first adapter that Stories 1.2 and 1.3 extend.
- Story 1.2 depends on stable identity and retrieval-run persistence from Story 1.1 to upsert safely, expose source health, and preserve prior data.
- Story 1.3 reuses the shared adapter interface, normalized schema, qualification approach, source-health handling, and fixture path established by the first two stories.
- Epic 2 consumes the candidate records, stable source facts, and current editorial view; Epic 3 relies on the same retained source facts and not-seen marker for its approved-event agenda.
