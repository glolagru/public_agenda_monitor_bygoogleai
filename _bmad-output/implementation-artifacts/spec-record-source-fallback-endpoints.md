---
title: 'Verifizierte Fallback-Feed-Endpunkte dokumentieren'
type: 'chore'
created: '2026-09-13'
status: 'done'
review_loop_iteration: 0
baseline_commit: '566a75480cca146e3143b7ea5c8e90ef0666a5be'
context:
  - '{project-root}/_bmad-output/planning-artifacts/research/technical-official-source-fallback-endpoints-2026-09-13/research.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Die Quellenverträge nennen für den RSS-Fallback des Bundespräsidenten keinen Endpunkt und verweisen für UN Women teilweise auf Feed-Informationsseiten statt auf maschinenlesbare Feed-URLs. Dadurch ist Story 1.3 nicht vollständig implementierbar.

**Approach:** Die verifizierten offiziellen Endpunkte werden in allen kanonischen Quellenvertragsdokumenten ergänzt. Die page-first-Strategie, die Lieferreihenfolge und die bestehenden Regeln für Fehlerbehandlung bleiben unverändert.

## Boundaries & Constraints

**Always:** Dokumentiere den Termin-Feed des Bundespräsidenten als `https://www.bundespraesident.de/SiteGlobals/Functions/RSSFeed/DE/RSSNewsfeed/Termine/RSSNewsfeed.xml?nn=127360`, UN-Women-News als `https://www.unwomen.org/en/feeds/news` und UN-Women-Publications als `https://www.unwomen.org/en/feeds/publications`. Halte fest, dass die Feeds nur nach einem fehlgeschlagenen oder nicht zuverlässig parsebaren page-first-Abruf verwendet werden. Beziehe alle Angaben auf den Prüfstand 13.09.2026.

**Ask First:** Keine.

**Never:** Keine neuen Quellen, Qualifikationsregeln, Abrufmethoden oder Parser erfinden; keine Quellendokumentation außerhalb der betroffenen Verträge ändern; den BVerfG-Abruf nicht von seiner website-/newsletter-Regel abweichen lassen.

</frozen-after-approval>

## Code Map

- `_bmad-output/planning-artifacts/prds/prd-Public Agenda Monitor-2026-09-12/prd.md` -- kanonischer Produktvertrag; listet Quellen und Fallback-Verhalten in FR-1.
- `_bmad-output/planning-artifacts/architecture/architecture-Public Agenda Monitor-2026-09-12/ARCHITECTURE-SPINE.md` -- Adapter-Vertrag AD-2, der die Abrufreihenfolge bindet.
- `_bmad-output/planning-artifacts/epics.md` -- Story-1.3-Akzeptanzkriterien und abgeleitete Implementierungsanforderungen.
- `_bmad-output/specs/spec-public-agenda-monitor/SPEC.md` -- kanonische BUILD-/Validierungs-Spezifikation.
- `_bmad-output/planning-artifacts/briefs/brief-Public Agenda Monitor-2026-09-12/brief.md` -- ursprüngliche Quellenübersicht; muss denselben Vertrag widerspiegeln.
- `_bmad-output/planning-artifacts/research/technical-official-source-fallback-endpoints-2026-09-13/research.md` -- verifizierte Primärquellen und Abrufdatum; nur Referenz, nicht ändern.

## Tasks & Acceptance

**Execution:**
- [x] Aktualisiere PRD, Architektur, Epic-Plan, SPEC und Brief mit den drei verifizierten Feed-Endpunkten und dem Prüfdatum.
- [x] Mache bei UN Women explizit, dass `/rss-feeds/news` und `/rss-feeds/publications` Informationsseiten sind, während `/feeds/news` und `/feeds/publications` die direkten Feed-Endpunkte sind.
- [x] Prüfe alle fünf Verträge auf identische URLs, page-first-Fallback-Semantik und unveränderte BVerfG-Regel.

**Acceptance Criteria:**
- Given a developer implements Story 1.3, when a Federal President or UN Women page-first retrieval fails or cannot be parsed reliably, then the canonical contract supplies exactly one verified fallback URL for the Federal President and one per UN Women channel.
- Given a reader compares the PRD, architecture, epic plan, SPEC, and brief, when they inspect source retrieval, then all five record the same three fallback endpoints and retain the existing delivery order and BVerfG website/newsletter rule.

## Design Notes

Dies ist eine Vertragskorrektur, keine Implementierung: Der direkte Feed wird als URL dokumentiert, seine HTTP-Erreichbarkeit und Item-Struktur bleiben Runtime- und Parser-Tests der späteren Adapter-Story.

## Verification

**Commands:**
- `rg -n 'RSSNewsfeed/Termine/RSSNewsfeed.xml\?nn=127360|https://www.unwomen.org/en/feeds/(news|publications)' _bmad-output/planning-artifacts _bmad-output/specs` -- expected: all five canonical contracts contain the verified endpoints.
- `rg -n 'page-first|Terminkalender page first|official News and Publications pages first|weekly outlook.*newsletter' _bmad-output/planning-artifacts _bmad-output/specs` -- expected: fallback and BVerfG rules remain explicit.

## Suggested Review Order

**Canonical source contract**

- The PRD defines exact primary and fallback retrieval URLs.
  [prd.md:73](../planning-artifacts/prds/prd-Public%20Agenda%20Monitor-2026-09-12/prd.md#L73)

- The adapter rule makes the same fallback behavior architectural.
  [ARCHITECTURE-SPINE.md:59](../planning-artifacts/architecture/architecture-Public%20Agenda%20Monitor-2026-09-12/ARCHITECTURE-SPINE.md#L59)

- Story acceptance criteria bind implementation to the direct feeds.
  [epics.md:147](../planning-artifacts/epics.md#L147)

**Contract propagation**

- The canonical SPEC mirrors the exact retrieval contract.
  [SPEC.md:40](../specs/spec-public-agenda-monitor/SPEC.md#L40)

- The product brief keeps initial planning consistent.
  [brief.md:45](../planning-artifacts/briefs/brief-Public%20Agenda%20Monitor-2026-09-12/brief.md#L45)
