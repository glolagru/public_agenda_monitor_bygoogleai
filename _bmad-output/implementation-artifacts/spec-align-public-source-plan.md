---
title: 'Align the Public Agenda Monitor source plan'
type: 'chore'
created: '2026-09-12'
status: 'done'
review_loop_iteration: 0
baseline_commit: 'd5021b097b9636e34285cbbec61bf920869c2591'
context:
  - '_bmad-output/specs/spec-public-agenda-monitor/SPEC.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The planning artifacts disagree about which courts belong to the MVP, how many sources exist, their retrieval methods, and the order in which they are tested. This makes the future implementation plan unreliable.

**Approach:** Align the current source-contract documents to the confirmed four-stage order: Federal Administrative Court, Federal President, UN Women, then Federal Constitutional Court. State each source's known access method without fabricating endpoints.

## Boundaries & Constraints

**Always:** Preserve the human editorial gate, manual retrieval, and existing Federal President and UN Women fallback rules. Describe the Federal Administrative Court as using its official RSS for hearing and judgment dates. Describe the Federal Constitutional Court as its official website/weekly outlook and newsletter, explicitly with no RSS. Use no unverified or invented URLs. Keep the change in current source-contract documents.

**Ask First:** Adding any further source, changing qualification rules beyond the confirmed court rules, or asserting a concrete RSS URL not already verified by the user or an authoritative source.

**Never:** Change application code, mocks, historical review/reconciliation records, or the product's editorial-decision model.

</frozen-after-approval>

## Code Map

- `_bmad-output/planning-artifacts/briefs/brief-Public Agenda Monitor-2026-09-12/brief.md` -- product-source table, delivery sequence, and success condition currently describe three sources and a Federal-President-first rollout.
- `_bmad-output/planning-artifacts/prds/prd-Public Agenda Monitor-2026-09-12/prd.md` -- primary requirements registry; must list all four sources, their source-specific access methods, qualifications, and staged delivery order.
- `_bmad-output/planning-artifacts/epics.md` -- implementation requirements and Epic 1 stories; the first vertical slice and subsequent source-expansion story define the test sequence.
- `_bmad-output/planning-artifacts/architecture/architecture-Public Agenda Monitor-2026-09-12/ARCHITECTURE-SPINE.md` -- AD-2 defines replaceable source adapters and fallback behavior.
- `_bmad-output/specs/spec-public-agenda-monitor/SPEC.md` -- canonical contract and success signal; must remain aligned with its companions.
- `_bmad-output/planning-artifacts/prds/prd-Public Agenda Monitor-2026-09-12/reconcile-brief.md` and `review-*` files -- historical analysis; read-only evidence, not current source-contract artifacts.

## Tasks & Acceptance

**Execution:**
- [x] `_bmad-output/planning-artifacts/briefs/brief-Public Agenda Monitor-2026-09-12/brief.md` -- align the source table, delivery sequence, and success criterion to the confirmed four-source order.
- [x] `_bmad-output/planning-artifacts/prds/prd-Public Agenda Monitor-2026-09-12/prd.md` -- make the source registry, qualifications, source methods, and rollout sequence explicit and consistent.
- [x] `_bmad-output/planning-artifacts/epics.md` -- make requirements and Epic 1 stories implement the BVerwG-first sequence and the source-specific retrieval rules.
- [x] `_bmad-output/planning-artifacts/architecture/architecture-Public Agenda Monitor-2026-09-12/ARCHITECTURE-SPINE.md` -- update AD-2's adapter set and retrieval contract without adding endpoints.
- [x] `_bmad-output/specs/spec-public-agenda-monitor/SPEC.md` -- align capabilities, constraints, and success signal with the four-source contract.
- [x] Source-contract files above -- inspect their source names, counts, sequence, and RSS/website distinctions after editing; leave historic review records unchanged.

**Acceptance Criteria:**
- Given a reader starts in any current source-contract document, when they inspect the MVP sources, then they find exactly four sources in this sequence: Federal Administrative Court, Federal President, UN Women, Federal Constitutional Court.
- Given a reader inspects source retrieval behavior, when they compare documents, then Federal Administrative Court uses official RSS for hearing and judgment dates; Federal Constitutional Court uses its website/weekly outlook and newsletter with no RSS; and the existing Federal President and UN Women fallback behavior is retained.
- Given implementation begins from Epic 1, when the vertical slices are followed, then the Federal Administrative Court is tested first and the Federal Constitutional Court is added last.
- Given the documents are updated, when historic review or reconciliation artifacts are inspected, then their prior findings have not been rewritten as current requirements.

## Spec Change Log

## Design Notes

This is a contract-alignment change, not an adapter implementation. The canonical SPEC, PRD, architecture, epics, and brief form a closed source-planning set; updating only one would preserve the contradiction.

## Verification

**Commands:**
- `rg -n -i 'Federal (Administrative|Constitutional) Court|Federal President|UN Women|RSS|weekly outlook|newsletter' _bmad-output/planning-artifacts _bmad-output/specs` -- expected: all current source-contract artifacts use the same four-source order and distinguish the two court retrieval methods.

**Manual checks:**
- Inspect the five source-contract documents and confirm there is no BVerfG RSS claim, no missing BVerwG source, and no remaining three-source or Federal-President-first delivery statement.

## Suggested Review Order

**Canonical contract**

- Establishes the four-source MVP boundary and source-specific retrieval rules.
  [SPEC.md:39](../specs/spec-public-agenda-monitor/SPEC.md#L39)

**Requirements and delivery**

- Makes the ordered source registry, fallbacks, and qualifications testable.
  [prd.md:71](../planning-artifacts/prds/prd-Public%20Agenda%20Monitor-2026-09-12/prd.md#L71)

- Makes BVerwG the first vertical slice and BVerfG the final expansion.
  [epics.md:109](../planning-artifacts/epics.md#L109)

**Product and architecture alignment**

- Aligns product scope, source methods, and the rollout narrative.
  [brief.md:40](../planning-artifacts/briefs/brief-Public%20Agenda%20Monitor-2026-09-12/brief.md#L40)

- Defines the adapter contract without inventing unverified endpoints.
  [ARCHITECTURE-SPINE.md:55](../planning-artifacts/architecture/architecture-Public%20Agenda%20Monitor-2026-09-12/ARCHITECTURE-SPINE.md#L55)
