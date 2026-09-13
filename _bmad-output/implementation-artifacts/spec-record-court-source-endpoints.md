---
title: 'Record confirmed court source endpoints'
type: 'chore'
created: '2026-09-12'
status: 'done'
route: 'one-shot'
---

# Record confirmed court source endpoints

## Intent

**Problem:** The source plan named the two court retrieval methods without their confirmed endpoints.

**Approach:** Record the user-confirmed BVerwG RSS feed and BVerfG weekly-outlook page in every current source-contract document, while keeping the BVerfG newsletter separate and confirming it has no RSS feed.

## Suggested Review Order

**Source registry**

- Establishes the exact two court endpoints for implementation.
  [prd.md:72](../planning-artifacts/prds/prd-Public%20Agenda%20Monitor-2026-09-12/prd.md#L72)

**Canonical contract**

- Carries the endpoints into the MVP-wide retrieval rule.
  [SPEC.md:40](../specs/spec-public-agenda-monitor/SPEC.md#L40)

**Delivery and architecture**

- Binds the endpoints to the adapter sequence and stories.
  [epics.md:55](../planning-artifacts/epics.md#L55)

- Defines the adapter contract without treating the newsletter as the page URL.
  [ARCHITECTURE-SPINE.md:59](../planning-artifacts/architecture/architecture-Public%20Agenda%20Monitor-2026-09-12/ARCHITECTURE-SPINE.md#L59)

- Keeps the product-level source table reviewable.
  [brief.md:44](../planning-artifacts/briefs/brief-Public%20Agenda%20Monitor-2026-09-12/brief.md#L44)
