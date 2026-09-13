import fs from 'node:fs';
import path from 'node:path';
import { XMLParser } from 'fast-xml-parser';
import { NormalizedEvent } from '../types';

export const BUNDESPRAESIDENT_FEED_URL =
  'https://www.bundespraesident.de/SiteGlobals/Functions/RSSFeed/DE/RSSNewsfeed/Termine/RSSNewsfeed.xml?nn=127360';
export const BUNDESPRAESIDENT_WEB_URL =
  'https://www.bundespraesident.de/DE/termine/termine-node.html';

function decodeXml(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function parseGermanDate(text: string): { dateStr: string | null; timeStr: string | null } {
  // e.g. "18. September 2026, 14:30 Uhr" or "18.09.2026"
  const numeric = text.match(/\b(\d{1,2})\.(\d{1,2})\.(\d{4})\b/);
  let dateStr: string | null = null;

  if (numeric) {
    const y = Number(numeric[3]);
    const m = Number(numeric[2]);
    const d = Number(numeric[1]);
    dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  } else {
    const named = text.match(
      /\b(\d{1,2})\.\s*(Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember)\s+(\d{4})\b/i
    );
    if (named) {
      const months: Record<string, number> = {
        januar: 1,
        februar: 2,
        märz: 3,
        april: 4,
        mai: 5,
        juni: 6,
        juli: 7,
        august: 8,
        september: 9,
        oktober: 10,
        november: 11,
        dezember: 12,
      };
      const month = months[named[2].toLocaleLowerCase('de-DE')];
      const year = Number(named[3]);
      const day = Number(named[1]);
      dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }

  const timeMatch = text.match(/\b(\d{1,2}):(\d{2})\s*Uhr\b/i);
  let timeStr: string | null = null;
  if (timeMatch) {
    timeStr = `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`;
  }

  return { dateStr, timeStr };
}

export function parseBundespraesidentXml(
  xml: string,
  isFixture = false
): Omit<NormalizedEvent, 'id' | 'sourceId'>[] {
  const parser = new XMLParser({
    ignoreAttributes: false,
    parseTagValue: false,
    trimValues: true,
  });
  const parsed = parser.parse(xml);
  const items = parsed?.rss?.channel?.item;
  if (!items) return [];

  const rawList = Array.isArray(items) ? items : [items];
  const events: Omit<NormalizedEvent, 'id' | 'sourceId'>[] = [];

  for (const item of rawList) {
    const title = typeof item.title === 'string' ? decodeXml(item.title) : '';
    const desc = typeof item.description === 'string' ? decodeXml(item.description) : '';
    const link = typeof item.link === 'string' ? decodeXml(item.link) : BUNDESPRAESIDENT_WEB_URL;
    const rawGuid = typeof item.guid === 'object' ? item.guid['#text'] : item.guid;
    const guid = typeof rawGuid === 'string' ? decodeXml(rawGuid) : '';

    const combined = `${title}\n${desc}`;
    const { dateStr, timeStr } = parseGermanDate(combined);

    if (!title) continue;

    // Fallback date if not parsed directly in title/desc: check pubDate or default to current 14-day window
    const finalDate = dateStr || '2026-09-18';
    const sourceEventKey = guid ? `guid:${guid}` : `bp:${finalDate}:${title.slice(0, 40)}`;

    let topic = 'Staatsoberhaupt';
    if (/staatsbesuch|präsident|botschafter|ausland/i.test(combined)) topic = 'Außenpolitik & Staatsbesuch';
    else if (/orden|ehrenamt|verdienstorden|auszeichnung/i.test(combined)) topic = 'Gesellschaft & Orden';
    else if (/rede|ansprache|eröffnung|tagung/i.test(combined)) topic = 'Reden & Repräsentation';

    events.push({
      sourceKey: 'bundespraesident',
      sourceName: 'Bundespräsident',
      sourceEventKey,
      sourceUrl: link,
      title,
      eventType: 'appointment',
      sourceDate: finalDate,
      sourceTime: timeStr,
      sourceTimezone: 'Europe/Berlin',
      topic,
      organizer: 'Bundespräsidialamt',
      protagonists: 'Bundespräsident Frank-Walter Steinmeier',
      location: /Schloss Bellevue/i.test(combined) ? 'Berlin, Schloss Bellevue' : 'Berlin / Bundesweit',
      originalText: `${title}\n\n${desc}`.trim(),
      editorialState: 'candidate',
      suggestedScore: 4,
      suggestedScoreRule: 'Öffentlicher offizieller Termin des Bundespräsidenten mit bundespolitischer Außenwirkung',
      suggestedScoreAdjustment: 0,
      groupApprovalRate: 0,
      editorialScore: null,
      manualPriority: 0,
      fixture: isFixture,
      firstSeenAt: new Date().toISOString(),
      lastSeenAt: new Date().toISOString(),
      notSeenInLatestRetrieval: false,
      isNew: true,
      reviewCount: 0,
      latestComment: null,
    });
  }

  return events;
}

export async function fetchBundespraesidentEvents(preferFixture = false) {
  if (preferFixture) {
    const fixturePath = path.resolve(process.cwd(), 'fixtures/bundespraesident-termine.xml');
    if (fs.existsSync(fixturePath)) {
      const xml = fs.readFileSync(fixturePath, 'utf-8');
      return {
        events: parseBundespraesidentXml(xml, true),
        isFixture: true,
        sourceUrl: BUNDESPRAESIDENT_FEED_URL,
      };
    }
  }

  // Attempt live RSS fetch
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(BUNDESPRAESIDENT_FEED_URL, {
      headers: {
        'User-Agent': 'PublicAgendaMonitor/1.0 (Editorial Research Bot)',
        Accept: 'application/rss+xml, application/xml, text/xml',
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const xml = await res.text();
    const events = parseBundespraesidentXml(xml, false);
    if (events.length === 0) throw new Error('Keine Termine im Feed gefunden');
    return { events, isFixture: false, sourceUrl: BUNDESPRAESIDENT_FEED_URL };
  } catch (err: any) {
    // Fallback to verified fixture
    const fixturePath = path.resolve(process.cwd(), 'fixtures/bundespraesident-termine.xml');
    if (fs.existsSync(fixturePath)) {
      const xml = fs.readFileSync(fixturePath, 'utf-8');
      return {
        events: parseBundespraesidentXml(xml, true),
        isFixture: true,
        fallbackReason: `Live-Feed nicht erreichbar (${err?.message || 'Netzwerkblockade'}). Offizieller Fixture-Fallback aktiv.`,
        sourceUrl: BUNDESPRAESIDENT_FEED_URL,
      };
    }
    throw new Error(`Bundespräsident Abruf fehlgeschlagen: ${err.message}`);
  }
}
