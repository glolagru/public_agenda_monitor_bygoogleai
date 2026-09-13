import { fetchBverwgEvents } from '../src/adapters/bverwg';
import { fetchBundespraesidentEvents } from '../src/adapters/bundespraesident';
import { fetchUnWomenEvents } from '../src/adapters/un_women';
import { SourceKey } from '../src/types';
import { db } from './db';

export async function retrieveSource(
  sourceKey: SourceKey,
  forceFixture = false
) {
  const source = db.getSourceByKey(sourceKey);
  const sourceName = source ? source.name : sourceKey;
  const startedAt = new Date().toISOString();

  let run = db.recordRun({
    sourceId: source ? source.id : `src-${sourceKey}`,
    sourceName,
    outcome: 'running',
    message: `Abruf gestartet für ${sourceName}`,
    eventsCount: 0,
    isFixture: forceFixture,
    startedAt,
    completedAt: null,
  });

  try {
    let result: {
      events: any[];
      isFixture: boolean;
      fallbackReason?: string;
      sourceUrl: string;
    };

    switch (sourceKey) {
      case 'bverwg':
        result = await fetchBverwgEvents(forceFixture);
        break;
      case 'bundespraesident':
        result = await fetchBundespraesidentEvents(forceFixture);
        break;
      case 'un_women_news':
        result = await fetchUnWomenEvents('news', forceFixture);
        break;
      default:
        throw new Error(`Unbekannter Quellenschlüssel: ${sourceKey}`);
    }

    const upsertRes = db.upsertEvents(sourceKey, result.events, result.isFixture);
    db.updateSourceHealth(
      sourceKey,
      result.isFixture && result.fallbackReason ? 'warning' : 'healthy',
      result.fallbackReason || null
    );

    run.outcome = 'succeeded';
    run.message = result.fallbackReason
      ? `${upsertRes.added} neue, ${upsertRes.updated} aktualisierte Ereignisse (${result.fallbackReason})`
      : `${upsertRes.added} neue, ${upsertRes.updated} aktualisierte Ereignisse erfolgreich normalisiert.`;
    run.eventsCount = upsertRes.total;
    run.isFixture = result.isFixture;
    run.completedAt = new Date().toISOString();

    return {
      success: true,
      sourceKey,
      sourceName,
      added: upsertRes.added,
      updated: upsertRes.updated,
      total: upsertRes.total,
      isFixture: result.isFixture,
      fallbackReason: result.fallbackReason,
    };
  } catch (err: any) {
    db.updateSourceHealth(sourceKey, 'error', err?.message || 'Unbekannter Netzwerkfehler');
    run.outcome = 'failed';
    run.message = err?.message || 'Fehler beim Abruf';
    run.completedAt = new Date().toISOString();

    return {
      success: false,
      sourceKey,
      sourceName,
      error: err?.message || 'Fehler beim Abruf',
      added: 0,
      updated: 0,
    };
  }
}

export async function retrieveAllSources(forceFixture = false) {
  const sources: SourceKey[] = [
    'bverwg',
    'bundespraesident',
    'un_women_news',
  ];

  const results = [];
  for (const s of sources) {
    const res = await retrieveSource(s, forceFixture);
    results.push(res);
  }
  return results;
}

export async function initializeDatabaseWithSeed() {
  const existingEvents = db.getEvents();
  if (existingEvents.length === 0) {
    console.log('[Seed] Datenbank ist leer. Lade initiale Fixtures für alle Quellen...');
    await retrieveAllSources(true);

    // Approve two events as initial demonstration for Redaktion agenda
    const events = db.getEvents();
    if (events.length > 0) {
      db.addReview(
        events[0].id,
        'approved',
        4,
        'Für die politische Wochenberichterstattung freigegeben.'
      );
    }
    if (events.length > 2) {
      db.addReview(
        events[2].id,
        'approved',
        5,
        'Hohe redaktionelle Relevanz – Termin für Hintergrundbericht vormerken.'
      );
    }
  }
}

export async function testReset() {
  if (db.getEvents().length === 0) {
    await retrieveAllSources(true);
  }
  return db.resetAllEventMarkings();
}
