# Adversarial review — Architecture Spine

Verdict: the MVP boundary is admirably small, but several independently built adapters, review screens, and retrieval workflows can still obey every stated AD while disagreeing in ways that affect agenda trustworthiness. Resolve the following before implementation.

## Findings

1. **Location:** AD-4 — Stable event identity and safe retrieval  
   **Trigger condition:** Each adapter invents its own `source_event_key` from mutable text, URL, or date because no derivation rule is shared.  
   **Guard snippet:** Define, per source, a documented preferred immutable key and deterministic fallback; persist the raw key components and add a uniqueness constraint on `(source_id, source_event_key)`.  
   **Potential consequence:** A renamed or rescheduled appointment becomes a duplicate despite compliant upserts, splitting review history and agenda state.

2. **Location:** AD-4 / AD-6 — retrieval lifecycle  
   **Trigger condition:** A formerly published event disappears from a successful source response (cancelled, withdrawn, or moved), but preservation of prior events is interpreted as keeping it approved and visible.  
   **Guard snippet:** Add a source-presence lifecycle such as `active`, `possibly_removed`, `withdrawn`; only a successful complete run may mark unseen source keys, and require researcher confirmation before an approved item is hidden.  
   **Potential consequence:** The editor agenda confidently shows cancelled or obsolete events.

3. **Location:** AD-6 — Source failure remains visible and non-destructive  
   **Trigger condition:** An adapter returns an empty list after a selector breaks, while another returns a health failure; both satisfy the loose normalized-events contract.  
   **Guard snippet:** Specify retrieval outcomes at least as `success`, `success_zero_events`, `partial_success`, and `failure`, with an explicit completeness signal before any absence-based update.  
   **Potential consequence:** A parsing failure can be mistaken for a valid empty calendar and lead to incorrect removal or misleading source health.

4. **Location:** AD-5 — Editorial review is the gate / data model  
   **Trigger condition:** One module treats `EVENT.status` as authoritative and another derives the latest decision from append-only `REVIEW_ENTRY` rows.  
   **Guard snippet:** Name one source of truth: append a review entry and atomically project its resulting status/score/rank onto `EVENT`; document how corrections and re-approvals are represented.  
   **Potential consequence:** The candidate queue and editor agenda can show opposite decisions for the same event.

5. **Location:** AD-5 — review history  
   **Trigger condition:** A review entry has no actor or session attribution, and the shared no-account demo has multiple people using it.  
   **Guard snippet:** Add an optional required-in-demo `reviewer_label` (entered once per browser session) plus `created_at`; later map it to an authenticated user ID.  
   **Potential consequence:** The promised accountable chain and audit trail cannot establish who approved, rejected, or changed an item.

6. **Location:** Consistency Conventions — Scores and manual ranking  
   **Trigger condition:** Review screens implement manual ranking differently because neither the event model nor review-entry model has a rank, scope, tie-breaker, or reorder operation.  
   **Guard snippet:** Define `editorial_rank` as an optional integer among active candidates with one deterministic ordering fallback (score, then event start, then ID), and an atomic reorder contract.  
   **Potential consequence:** Dragging one candidate may create duplicate ranks or reorder unrelated events after retrieval.

7. **Location:** AD-4 — repeat retrieval / AD-3 — one mutation path  
   **Trigger condition:** Two users press Retrieve events close together; both workflows read before either upserts and independently alter source health or "new" state.  
   **Guard snippet:** Enforce the database unique index, serialize one active run per source or make upserts conflict-safe, and define retrieval-run state transitions (`started` → terminal outcome).  
   **Potential consequence:** Duplicate records, misleading health results, and unstable new-event highlighting occur under ordinary demo usage.

8. **Location:** Plain-language orientation and consistency conventions — dates  
   **Trigger condition:** An adapter supplies a date-only or local-time appointment while agenda filtering uses UTC timestamps to construct the two-week window.  
   **Guard snippet:** Model `start_date`, optional `start_time`, and `source_timezone` separately; specify inclusive two-week filtering in the relevant local/source timezone and retain an `all_day` flag.  
   **Potential consequence:** Events near midnight, all-day court dates, or dates lacking a time disappear from or shift within the agenda.

9. **Location:** Structural Seed ERD / Editor agenda  
   **Trigger condition:** A normalized event only has fields shown in the ERD (`status` and scores), while the agenda needs name, topic, people/organizer, location, date/time, event type, and direct source link.  
   **Guard snippet:** Publish a minimal normalized-event contract listing required versus optional fields, validation at adapter boundaries, and an explicit rule for incomplete candidates.  
   **Potential consequence:** Three individually compliant adapters produce records that cannot render the required agenda item or link back to evidence.

10. **Location:** AD-2 — source adapters are replaceable  
    **Trigger condition:** A retrieval request can influence an adapter URL or redirect target because the adapter input and fetch policy are unspecified.  
    **Guard snippet:** Keep source base URLs and paths in trusted server configuration, allowlist hosts and redirect destinations, set request timeouts/size limits, and never accept arbitrary browser URLs.  
    **Potential consequence:** A future adapter or route can become an SSRF path, fetch unbounded data, or silently leave the agreed public source.

11. **Location:** AD-7 — MVP access boundary  
    **Trigger condition:** The deployment is reachable to everyone with the URL, so an editor or forwarded-link recipient can call mutation endpoints even if the interface hides review controls.  
    **Guard snippet:** State the demo trust model: every URL holder is a trusted researcher and no data is sensitive; constrain deployment sharing accordingly, and make authenticated authorization mandatory before any non-demo use.  
    **Potential consequence:** “Editor-only” and “researcher-only” become cosmetic distinctions, allowing accidental or malicious agenda edits during the demo.

12. **Location:** Deferred — trained relevance model / Product Brief: Relevance and Learning  
    **Trigger condition:** The architecture defers the trained model but specifies no MVP mechanism by which accumulated approval, rejection, score, and comment feedback changes future suggestions.  
    **Guard snippet:** Define the MVP learning loop as a transparent configurable heuristic (for example, source/event-type rules plus recorded rationales), its persisted configuration, and a manual way to revise it; explicitly defer only statistical training.  
    **Potential consequence:** The build can satisfy every architecture decision while missing the brief’s requirement that feedback improves subsequent relevance and priority suggestions.

13. **Location:** AD-6 — fixtures  
    **Trigger condition:** Demo fixtures share the same source key namespace as live records or are later approved, yet `is_fixture` is only a label rather than a data and agenda policy.  
    **Guard snippet:** Use a dedicated fixture source/environment and prevent fixture records from appearing in a non-demo agenda; make the banner derive from the record, not page state.  
    **Potential consequence:** Demonstration data can be mistaken for verified public events or collide with a live upsert.

14. **Location:** AD-4 / Candidate queue — New since last review  
    **Trigger condition:** “New” is implemented from event creation time by one screen and latest retrieval time by another; updated existing events lack a policy.  
    **Guard snippet:** Define `first_seen_at`, `last_source_changed_at`, and per-reviewer/session `last_reviewed_at`; state which changes re-enter the new queue.  
    **Potential consequence:** Researchers miss materially changed appointments or waste time repeatedly reviewing unchanged records.
