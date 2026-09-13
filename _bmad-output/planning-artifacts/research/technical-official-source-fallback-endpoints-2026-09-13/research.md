---
title: 'Technical research: Official source fallback endpoints'
type: technical
topic: 'Official source fallback endpoints'
decision: 'Record canonical, retrievable official fallback endpoints for Epic 1 source adapters.'
source: native web research
status: complete
preset: standard
validation: normal
claims_verified: 3
claims_unverified: 0
created: 2026-09-13
updated: 2026-09-13
---

# Technical research: Official source fallback endpoints

**Decision this research serves:** Record canonical, retrievable official fallback endpoints for Epic 1 source adapters.

## Zusammenfassung

Die fehlenden Endpunkte können verbindlich ergänzt werden. Der offizielle RSS-Katalog des Bundespräsidenten verlinkt den Termin-Feed direkt. UN Women unterscheidet zwischen einer Informationsseite zu Feeds (`/rss-feeds/...`) und den eigentlichen maschinenlesbaren Feeds (`/feeds/...`). Für Epic 1 sollten daher genau die folgenden drei URLs verwendet werden. [1][2]

| Quelle | Zweck | Kanonischer Fallback-Endpunkt |
| --- | --- | --- |
| Bundespräsident | Termine | `https://www.bundespraesident.de/SiteGlobals/Functions/RSSFeed/DE/RSSNewsfeed/Termine/RSSNewsfeed.xml?nn=127360` |
| UN Women | News | `https://www.unwomen.org/en/feeds/news` |
| UN Women | Publications | `https://www.unwomen.org/en/feeds/publications` |

## Befunde

### Bundespräsident

Die offizielle RSS-Seite bezeichnet den ersten Endpunkt ausdrücklich als „RSS-Feed der Termine des Bundespräsidenten“. Er ist damit der zu dokumentierende Fallback nach einem fehlgeschlagenen oder nicht zuverlässig parsebaren Abruf des Terminkalenders. [1]

### UN Women

Die offizielle Seite „Web feeds“ verlinkt für News direkt auf `/en/feeds/news` und für Publications direkt auf `/en/feeds/publications`. Die vorher in den Planungsartefakten verwendeten Pfade `/en/rss-feeds/news` und `/en/rss-feeds/publications` sind jeweils Informationsseiten, nicht die direkten Feed-Endpunkte. [2]

## Empfehlung

Ergänze diese drei Endpunkte samt Prüfdatum **13.09.2026** in einem versionierten Source-Adapter-Register oder im PRD. Behalte die page-first-Strategie unverändert bei und nutze die Feeds ausschließlich als Fallback. Jeder Adapter soll HTTP-Status, Inhaltsformat und Parsbarkeit zur Laufzeit prüfen und bei Fehlern den vorhandenen Source-Health-Pfad verwenden.

## Offene Fragen

- Die Recherche validiert die offiziellen Endpunkte, nicht die aktuelle Struktur jedes einzelnen Feed-Items. Story 1.3 sollte deshalb je Quelle Parser- und Fixture-Tests enthalten.
- Der Browser blockierte den direkten Aufruf des Bundespräsidenten-XMLs clientseitig. Die offizielle RSS-Seite selbst verlinkt den Endpunkt eindeutig; die Anwendbarkeit muss zusätzlich im Server-Runtime-Test bestätigt werden.

## Quellen

| Ref. | Befund | Herausgeber | Abruf | Vertrauensniveau |
| --- | --- | --- | --- | --- |
| [1] | Direkter RSS-Endpunkt für Termine des Bundespräsidenten | [Bundespräsidialamt](https://www.bundespraesident.de/DE/service/rss-feeds/rss-feeds_node.html) | 2026-09-13 | Hoch |
| [2] | Direkte News- und Publications-Feeds von UN Women | [UN Women](https://www.unwomen.org/en/rss-feeds) | 2026-09-13 | Hoch |

## Aktualitätsprüfung

Die Endpunkte und ihr Inhaltsformat sollten vor Beginn der Implementierung von Story 1.3 sowie bei jedem Feed-Fehler erneut geprüft werden. Spätestens am **01.10.2026** ist eine erneute Prüfung fällig.
