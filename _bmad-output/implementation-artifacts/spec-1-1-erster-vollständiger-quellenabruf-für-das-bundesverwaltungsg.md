---
title: 'Story 1.1: Bundesverwaltungsgericht vollständig abrufen'
type: 'feature'
created: '2026-09-13'
status: 'done'
review_loop_iteration: 0
baseline_commit: 'c3062453f89e3be3b7f48287cddc3a9a470fb827'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Das Repository enthält noch keine Anwendung. Documentary Researchers können deshalb die RSS-Termine des Bundesverwaltungsgerichts nicht manuell abrufen oder als verifizierbare Candidate Events verwenden.

**Approach:** Initialisiere den vereinbarten Next.js-/Supabase-Starter als modularen Monolithen und liefere den ersten vertikalen Slice: eine serverseitige Abrufaktion liest den offiziellen RSS-Feed, normalisiert die qualifizierten Hearing- und Judgment-Termine und speichert sie als Candidate Events mit stabiler Identität und Quellenbezug.

## Boundaries & Constraints

**Always:** Verwende nur `https://www.bverwg.de/rss/termine.rss` für diesen Slice. Der Browser ruft ausschließlich eine Server Action auf; Adapter schreiben nie direkt in die Datenbank. Persistiere Source, Retrieval Run und Event über versionierte Supabase-Migrationen. Jeder Event enthält mindestens Source, direkten Link, Titel, Event-Typ, Datum, `source_id`, `source_event_key`, Originaltext und unbekannte optionale Felder als leer. Leite den Schlüssel aus RSS-GUID oder kanonischer Detail-URL ab; erfinde keine Fakten. Neue Events beginnen als `candidate`.

**Ask First:** Frage nur nach einem Supabase-Projekt bzw. dessen Umgebungswerten, wenn eine Migration gegen eine gehostete Datenbank angewendet oder ein Live-Ende-zu-Ende-Abruf außerhalb von Tests durchgeführt werden soll. Geheimnisse nie in Dateien oder Commits aufnehmen.

**Never:** Keine weiteren Quellen, RSS-Fallbacks, Fixtures, Reviewentscheidungen, Authentifizierung, Zeitplanung oder Hintergrundjobs umsetzen. Keine clientseitigen Datenbankschlüssel verwenden und keine Event-Fakten aus Überschriften oder fehlenden RSS-Feldern erraten.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|---------------|----------------------------|----------------|
| Erfolgreicher Abruf | RSS enthält Hearing- und Judgment-Termine | Normalisierte Candidate Events mit Quelle, Link, Titel, Typ, Datum und stabiler Identität | Nicht benötigte optionale Felder bleiben leer |
| Nicht qualifizierter Eintrag | RSS-Item ist kein Hearing- oder Judgment-Termin | Kein Candidate Event wird erzeugt | Der Ausschluss ist nachvollziehbar testbar |
| Fehlende GUID und URL | RSS-Item hat keine stabile Fremdkennung | Schlüssel aus Source, normalisiertem Titel und Datum | Keine erfundenen zusätzlichen Fakten |

</frozen-after-approval>

## Code Map

- `package.json` -- fehlt; der offizielle Supabase-Next.js-Starter muss die Projektbasis liefern.
- `app/` -- fehlt; enthält anschließend die serverseitige Abrufaktion und die minimale Researcher-Oberfläche.
- `adapters/federal-administrative-court/` -- neuer, austauschbarer RSS-Adapter; alleinige Quelle für Feed-Parsing.
- `modules/retrieval/` -- neuer serverseitiger Workflow zur Validierung, Normalisierung und Persistierung.
- `lib/domain/` -- neue gemeinsame Typen für normalisierte Events und Retrieval-Ergebnisse.
- `lib/db/` -- neue server-only Datenbankgrenze; keine Browser-Schreibpfade.
- `supabase/migrations/` -- neue geordnete Schema-Migrationen für Source, Retrieval Run und Event.
- `fixtures/` und Tests -- neue RSS-Testsamples und Unit-Tests; ohne Netz- oder Supabase-Abhängigkeit ausführbar.
- `_bmad-output/implementation-artifacts/epic-1-context.md` -- gültiger Epic-1-Kontext und unveränderliche Entscheidungsgrundlage.

## Tasks & Acceptance

**Execution:**
- [x] Initialisiere den offiziellen Supabase-Next.js-Starter mit Next.js 16.3.3 und richte server-only Supabase-Konfiguration sowie eine `.env.example` ohne Geheimnisse ein.
- [x] Erstelle Migrationen und Domain-Typen für Sources, Retrieval Runs und Events; erzwinge die Unique-Identity `source_id + source_event_key`.
- [x] Implementiere den BVerwG-Adapter mit RSS-Abruf, Qualifikation für Hearing/Judgment und verlustfreier Normalisierung in einen Adapter-Output.
- [x] Implementiere den serverseitigen Retrieval-Workflow und eine minimale manuelle Researcher-Aktion, die Source, Run und Candidate Events persistiert.
- [x] Ergänze Fixture-basierte Tests für Erfolgs-, Ausschluss- und Fallback-Identity-Szenarien sowie für die fehlende clientseitige DB-Schreibberechtigung.

**Acceptance Criteria:**
- Given the initialized application and a fixture of the BVerwG official RSS feed, when a Documentary Researcher triggers the retrieval action, then hearing and judgment entries are returned as normalized Candidate Events with the required source facts and stable identities.
- Given an RSS item without a GUID or canonical detail URL, when it qualifies, then its event key is derived only from source, normalized title, and source date.
- Given a non-qualifying RSS item, when the adapter parses the feed, then it creates no Candidate Event and does not invent missing facts.
- Given a browser request, when the retrieval is executed, then all source access and database mutation occur only in server-side code.

## Design Notes

Die Story schafft bewusst den wiederverwendbaren Adapter- und Persistenzpfad. Source Health, sichere Wiederholungen und Fixtures für einen Quellenfehler gehören erst zu Story 1.2; diese Story liefert nur die Struktur, die sie erweitert.

## Verification

**Commands:**
- `npm test` -- expected: Parser-, Qualifikations- und Identitätstests bestehen ohne Netz.
- `npm run lint` -- expected: keine Lint-Fehler.
- `npm run build` -- expected: Next.js-Anwendung baut ohne Zugriff auf Geheimnisse.
- `supabase db lint` -- expected: Migrationen und Schema sind valide, sofern die CLI verfügbar ist.

**Manual checks:**
- Prüfe, dass die Researcher-Aktion als Server Action ausgeführt wird und die Datenbankkonfiguration nicht an Browser-Code exportiert wird.

## Suggested Review Order

**Manual retrieval boundary**

- The Server Action keeps browser requests away from database credentials.
  [`retrieve-bverwg.ts:1`](../../app/actions/retrieve-bverwg.ts#L1)

- The workflow records each run before fetching and preserves failed outcomes.
  [`run-retrieval.js:1`](../../modules/retrieval/run-retrieval.js#L1)

**Source normalization**

- The adapter filters, validates, and gives court appointments stable source identities.
  [`rss.js:20`](../../adapters/federal-administrative-court/rss.js#L20)

- Network responses are constrained to timely, successful RSS/XML responses.
  [`rss.js:54`](../../adapters/federal-administrative-court/rss.js#L54)

**Persistence boundary**

- The service-role client exists only on the server and upserts candidate events.
  [`supabase-server.ts:1`](../../lib/db/supabase-server.ts#L1)

- The schema protects source-event uniqueness and defaults new events to candidates.
  [`202609130001_initial_retrieval.sql:1`](../../supabase/migrations/202609130001_initial_retrieval.sql#L1)

**Verification and configuration**

- Fixture tests cover qualification, identities, boundary behavior, and workflow outcomes.
  [`bverwg-rss.test.mjs:1`](../../tests/bverwg-rss.test.mjs#L1)

- The committed example documents server-only configuration without exposing secrets.
  [`.env.example:1`](../../.env.example#L1)
