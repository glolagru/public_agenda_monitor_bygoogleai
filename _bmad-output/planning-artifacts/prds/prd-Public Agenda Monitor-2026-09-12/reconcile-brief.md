# Brief-to-PRD Reconciliation

Reviewed: 2026-09-12  
Scope: source claims, conflicts, and changed requirements only.

## Findings requiring a decision or explicit acknowledgement

1. **German court source changed.** The Product Brief names the **Federal Administrative Court** as the second source, with qualification limited to case starts and judgment announcements. The PRD instead names the **Federal Constitutional Court** and qualifies all dates in its weekly outlook (FR-1, FR-2). This is a direct source and qualification-rule conflict. The PRD should be treated as the current requirement only if this substitution was intentional.

2. **The approved source set was materially rewritten.** The Brief's original set is Federal President, Federal Administrative Court, and UN Women. The PRD's set is Federal President, Federal Constitutional Court, UN Women News, and UN Women Publications. Treating the two UN Women feeds as one logical source preserves the total of three sources, but it expands the fixed endpoints from three to four. This is acceptable only if the two UN Women feeds are deliberately one source adapter.

3. **Source-access guardrail was narrowed.** The Brief assumes that source-specific terms and technical access rules are checked before production use. The PRD explicitly excludes any operation beyond the one-time internal hackathon. That removes the production-use condition rather than implementing it. It is consistent with the stated hackathon-only scope, but should remain explicit if the prototype is later reused.

## Source claims that landed unchanged

- Manual, user-triggered retrieval; no scheduled scanning.
- Federal President is the first complete vertical slice.
- Public official pages/feeds only, with a visible failure state and labelled fixture data.
- Stable event identity and repeat-retrieval de-duplication that preserves editorial review data.
- Candidate → human review → approved editor agenda, with suggested scores advisory rather than a hard exclusion gate.
- 1–5 transparent score, comments, manual priority, retained review history, and feedback-informed future suggestions.
- Agenda content fields, direct source links, and the two-week horizon (now precisely specified as today plus 13 following calendar days).

## No other brief requirements were found missing

Apart from the court-source substitution and the deliberate hackathon-only narrowing above, the PRD carries the Brief's product, workflow, editorial-control, resilience, and success-criteria claims forward.
