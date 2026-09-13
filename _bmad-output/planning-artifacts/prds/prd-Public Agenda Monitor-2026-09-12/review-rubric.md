# PRD Quality Review — Public Agenda Monitor

## Overall verdict

**Conditionally ready for the internal-hackathon MVP, but not yet ready to finalise.** The document has a clear human-in-the-loop thesis, a deliberately small scope, and an unusually usable set of testable consequences for its core journey. Two decisions still need to be made explicit before stories are created: what a “Source” means for the two UN Women feeds, and the precise, testable contract for identity/deduplication and score-feedback. Without those, different implementers can produce materially different behaviour.

## Decision-readiness — adequate

The major product choices are stated plainly: manual retrieval rather than scheduled scanning, explicit human approval, fixed official sources, and a one-time internal hackathon scope (§§1, 4.1, 6, 7.2). The no-production decision is particularly candid and correctly avoids importing production access and operations concerns.

The remaining ambiguity is a decision, not an implementation detail. §3 defines a Source as “one named official public website or feed,” while FR-1 lists UN Women news and UN Women publications separately, each with an HTML page and RSS fallback; §7.1 then calls this “the three named public Sources.” It is unclear whether source health, retrieve controls, qualification, and fixtures operate per organisation, per content stream, or per endpoint.

### Findings

- **high** Define the UN Women source boundary (§3 Glossary; FR-1; §7.1; SM-1) — The document alternates between three Sources and four individually retrieved streams/endpoints. This changes the UI, source-health model, fixture labelling, and demo metric. *Fix:* State one model explicitly, e.g. “UN Women is one Source with two independently retrievable feeds and two health states,” or make its news and publications feeds two separate Sources and update all counts.

## Substance over theater — strong

The vision is specific to replacing a manually maintained Word agenda, not generic “better research.” Personas are role-based but earn their place: their permissions and activities determine the Candidate Event queue versus read-only Editor Agenda. NFR-style guardrails are few and product-specific; the document does not make unsupported claims about scalability, production security, or AI capability.

No finding.

## Strategic coherence — strong

The product thesis holds throughout: maximise recall from a small set of official sources, preserve editorial control, and produce an approved 14-day planning agenda (§§1, 4, 6–8). Features support that arc in a natural flow—retrieve, review, publish, expose failure—and the counter-metrics explicitly prevent automation volume or approval rate from becoming perverse goals (§8). The sequence is appropriate for an internal demo rather than a production platform.

No finding.

## Done-ness clarity — adequate

Most FRs include observable consequences. FR-4 protects editorial state on repeat retrieval, FR-11 fixes the 14-day window as today plus 13 following calendar days, and FR-13 defines failure retention and visible error information. This gives story-writing a good base.

Two core behaviours are still too open for consistent implementation and verification. “Stable unique identity” does not say which facts establish a match when a source changes a title or a date; “simple aggregate feedback” does not define the input window, aggregation, or an expected effect on a later suggestion. The PRD need not choose the technical mechanism, but it does need a business-observable rule and examples/boundaries.

### Findings

- **high** Make duplicate identity observable (§FR-3, FR-4) — “Stable unique identity” is required but no source-level identity or matching rule is specified. An implementation cannot prove that a changed appointment is an update rather than a new Candidate Event. *Fix:* Define a source-provided identifier as the preferred key and a deterministic fallback (for example Source + canonical direct link), plus the expected handling when that fallback changes.
- **medium** Bound the score-feedback promise (§FR-7, FR-9) — The “shared lens” and “simple aggregate feedback by Source and event type” lack defined factors, minimum data, or expected result. That risks an opaque or effectively arbitrary MVP feature despite the explainability goal. *Fix:* List the initial rule factors and state a small deterministic feedback rule (or defer adaptive feedback from the MVP and retain only manually editable suggested-score rules).
- **medium** Clarify review-action semantics (§FR-5, FR-8) — “New” ends after “a review action,” but the set of actions is not named; it is unclear whether opening an event, changing only a score, or adding a comment ends the new state. *Fix:* Define the action(s) that create a Review Entry and therefore clear the new label.

## Scope honesty — strong

The Non-Goals and out-of-scope sections do real work (§§6–7.2), excluding accounts, scheduling, generic crawling, subscription content, production operation, and autonomous decision-making. The PRD has no unresolved product questions and contains no unindexed assumption or PM-note markers. Runtime source failure is honestly handled through visible Source Health and labelled Fixtures rather than treated as an unmentioned edge case.

No finding.

## Downstream usability — adequate

The glossary is useful, FR IDs are contiguous FR-1 through FR-14, and SM references resolve. Terms such as Candidate Event, Approved Event, Retrieval, Source Health, Suggested Score, and Fixture are consistently used. The capability-led format fits the small internal tool, so named user journeys are not necessary for extraction into stories.

However, source terminology is not yet stable enough for downstream implementation because of the three-versus-four ambiguity noted above. Also, “event” is used both as a domain record and as a filter/sort value in FR-6; story authors will need a concrete field list for that control.

### Findings

- **medium** Name the FR-6 sorting/filter fields precisely (§FR-6) — “filter and sort … by newness, date, event, and event type” does not define what “event” means as a field. *Fix:* Replace it with the intended field, such as event title, source, or approval state, and state the allowed filter values where relevant.

## Shape fit — strong

This is a capability specification for a small, internal, two-role tool. It does not over-formalise the work with elaborate personas or journey narratives, yet it specifies the meaningful role boundary and core operational flow. The level of rigor—14 scoped FRs with testable consequences, a small metric set, and explicit demo resilience—is well matched to hackathon stakes and provides a sound input for a later technical SPEC and story breakdown.

No finding.

## Mechanical notes

- Frontmatter status is correctly still `draft`; it should change to `final` only after the above findings are resolved or consciously deferred.
- FR IDs are unique and continuous (FR-1 to FR-14); SM and counter-metric IDs are unique and their cited FR references resolve.
- No inline `[ASSUMPTION]` or `[NOTE FOR PM]` markers appear, so the empty Assumptions Index has no round-trip omission.
- No UJs are present. This is appropriate for the stated capability-spec shape of a small internal tool, rather than a defect.
- “Federal President Source” / “Federal President appointments” are understandable but should retain one exact label throughout any derived stories; “Federal Constitutional Court” and “UN Women” are already consistent.
