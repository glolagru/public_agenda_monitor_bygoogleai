import fs from 'node:fs';
import path from 'node:path';
import { XMLParser } from 'fast-xml-parser';
import { EventType, NormalizedEvent } from '../types';

export const BVERWG_SOURCE_URL = 'https://www.bverwg.de/rss/termine.rss';

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

function normalizedTitle(title: string): string {
  return title.replace(/\s+/g, ' ').trim();
}

function eventTypeFor(text: string): EventType | null {
  if (/\b(urteils?|entscheidungs?)termin\b/i.test(text) || /\burteil\b/i.test(text)) return 'judgment';
  if (/\b(verhandlungs?|anhörungs?)termin\b/i.test(text) || /\bverhandlung\b/i.test(text) || /\btermin\b/i.test(text)) return 'hearing';
  return null;
}

function validDate(year: number, month: number, day: number): boolean {
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function sourceDateFor(text: string): string | null {
  const numeric = text.match(/\b(\d{1,2})\.(\d{1,2})\.(\d{4})\b/);
  if (numeric) {
    const y = Number(numeric[3]);
    const m = Number(numeric[2]);
    const d = Number(numeric[1]);
    return validDate(y, m, d)
      ? `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      : null;
  }

  const named = text.match(
    /\b(\d{1,2})\.\s*(Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember)\s+(\d{4})\b/i
  );
  if (!named) return null;

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
  return validDate(year, month, day)
    ? `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    : null;
}

function timeFor(text: string): string | null | false {
  const match = text.match(/\b(\d{1,2}):(\d{2})\s*Uhr\b/i);
  if (!match) return null;
  const hours = Number(match[1]);
  const mins = Number(match[2]);
  return hours < 24 && mins < 60
    ? `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
    : false;
}

function normalizeDetailUrl(link: string): string {
  try {
    const url = new URL(link);
    url.protocol = url.protocol.toLowerCase();
    url.hostname = url.hostname.toLowerCase();
    url.hash = '';
    for (const key of [...url.searchParams.keys()]) {
      if (/^utm_/i.test(key) || /^(gclid|fbclid)$/i.test(key)) {
        url.searchParams.delete(key);
      }
    }
    url.searchParams.sort();
    return url.toString();
  } catch {
    return link;
  }
}

export function keyForBverwg({
  guid,
  link,
  title,
  sourceDate,
}: {
  guid?: string;
  link?: string;
  title: string;
  sourceDate: string;
}): string {
  if (guid && guid.trim()) return `guid:${guid.trim()}`;
  if (link && link.trim()) return `url:${normalizeDetailUrl(link)}`;
  return `fallback:${BVERWG_SOURCE_URL}|${normalizedTitle(title).toLocaleLowerCase('de-DE')}|${sourceDate}`;
}

export function cleanBverwgSubject(s: string): string {
  return s
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/;+\s*hier:\s*/gi, ': ')
    .replace(/,\s*hier:\s*/gi, ': ')
    .replace(/\s+hier:\s*/gi, ': ')
    .replace(/[;,]+\s*:\s*/g, ': ')
    .replace(/;+/g, ';')
    .replace(/;(?=\S)/g, '; ')
    .replace(/^[:;,\s]+|[:;,\s]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function formatBverwgExpressiveTitle(
  rawTitle: string,
  rawDesc: string,
  eventType: EventType | string
): string {
  const text = `${rawTitle}\n${rawDesc}`;
  const caseMatch = text.match(/BVerwG\s+([0-9]+\s+[A-Z]+\s+[0-9]+\.[0-9]+)/i) ||
                    text.match(/BVerwG\s+([0-9A-Z\s\.\/]+)/i);
  const caseNumber = caseMatch ? caseMatch[0].trim() : (rawTitle.match(/BVerwG\s+([0-9A-Z\s\.\/]+)/i) || ['', 'BVerwG'])[0].trim();

  const isJudgment = eventType === 'judgment' || /Urteil|Verkündung|Urteilstermin/i.test(text);
  const prefix = isJudgment ? 'Urteil' : 'Prozessstart';

  if (text.includes('humanitären Aufenthaltserlaubnis')) {
    return `${prefix}: Klage auf Erteilung einer humanitären Aufenthaltserlaubnis (${caseNumber})`;
  }
  if (text.includes('Versetzungsverfügung')) {
    return `${prefix}: Beamtenrechtliche Versetzungsverfügung (${caseNumber})`;
  }

  const cleanLines = text
    .replace(/<br\s*\/?>/gi, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  let subject = '';
  for (let i = 0; i < cleanLines.length; i++) {
    const line = cleanLines[i];
    if (line.includes('./.') && i + 1 < cleanLines.length) {
      const candidate = cleanLines[i + 1];
      if (!candidate.startsWith('Termin:') && !candidate.startsWith('BVerwG')) {
        subject = candidate;
        if (i + 2 < cleanLines.length && /^(hier:|;\s*hier:|,\s*hier:)/i.test(cleanLines[i + 2])) {
          subject += ': ' + cleanLines[i + 2].replace(/^[;,]?\s*hier:\s*/i, '');
        }
        break;
      }
    }
  }

  if (!subject) {
    for (const line of cleanLines) {
      if (/Klage|Recht der|Rechte des|Unterhalt|Ausbildung|Presserecht|Abfallrecht|Wirtschaft|Streit|Antragsbefugnis|Zur Reichweite|Orientierung|Abzug|Versetzung|Aufenthalt/i.test(line)) {
        if (!line.includes('./.') && !line.startsWith('BVerwG') && !line.startsWith('Termin:')) {
          subject = line;
          break;
        }
      }
    }
  }

  const cleaned = cleanBverwgSubject(subject || 'Verwaltungsverfahren');
  return `${prefix}: ${cleaned} (${caseNumber})`;
}

export function parseBverwgXml(
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
    const rawTitle = typeof item.title === 'string' ? decodeXml(item.title) : '';
    const rawDesc = typeof item.description === 'string' ? decodeXml(item.description) : '';
    const rawLink = typeof item.link === 'string' ? decodeXml(item.link) : '';
    const rawGuid = typeof item.guid === 'object' ? item.guid['#text'] : item.guid;
    const guid = typeof rawGuid === 'string' ? decodeXml(rawGuid) : '';

    const baseTitle = normalizedTitle(rawTitle);
    const combined = `${baseTitle}\n${rawDesc}`;
    const eventType = eventTypeFor(combined);
    const sourceDate = sourceDateFor(combined);
    const timeRes = timeFor(combined);

    if (!baseTitle || !eventType || !sourceDate || timeRes === false || !rawLink) {
      continue;
    }

    const title = formatBverwgExpressiveTitle(baseTitle, rawDesc, eventType);
    const sourceTime = typeof timeRes === 'string' ? timeRes : null;
    const sourceEventKey = keyForBverwg({ guid, link: rawLink, title, sourceDate });

    // Ensure direct specific case link in BVerwG database
    let resolvedUrl = rawLink.replace(/&amp;/g, '&');
    const caseMatch = combined.match(/BVerwG\s+[0-9A-Z\s\.\/]+/i);
    if (resolvedUrl.includes('suche?q=')) {
      try {
        const urlObj = new URL(resolvedUrl);
        const rawQ = urlObj.searchParams.get('q') || (caseMatch ? caseMatch[0].trim() : '');
        // Strip duplicate BVerwG prefix and use '+' for spaces to avoid literal %20 in BVerwG search
        const cleanQ = rawQ.replace(/^BVerwG\s+/i, '').trim();
        const queryParam = cleanQ.split(/\s+/).map(encodeURIComponent).join('+');
        resolvedUrl = `https://www.bverwg.de/suche?q=${queryParam}`;
      } catch {
        // Fallback
      }
    } else if (resolvedUrl === 'https://www.bverwg.de/rechtsprechung/termine' || !resolvedUrl.startsWith('http')) {
      if (caseMatch) {
        const cleanQ = caseMatch[0].replace(/^BVerwG\s+/i, '').trim();
        const queryParam = cleanQ.split(/\s+/).map(encodeURIComponent).join('+');
        resolvedUrl = `https://www.bverwg.de/suche?q=${queryParam}`;
      }
    }

    events.push({
      sourceKey: 'bverwg',
      sourceName: 'Bundesverwaltungsgericht',
      sourceEventKey,
      sourceUrl: resolvedUrl,
      title,
      eventType,
      sourceDate,
      sourceTime,
      sourceTimezone: 'Europe/Berlin',
      topic: 'Verwaltungsrecht',
      organizer: 'Bundesverwaltungsgericht',
      protagonists: 'Senat des BVerwG',
      location: 'Leipzig, Bundesverwaltungsgericht',
      originalText: `${title}\n\n${rawDesc}`.trim(),
      editorialState: 'candidate',
      suggestedScore: eventType === 'judgment' ? 4 : 3,
      suggestedScoreRule:
        eventType === 'judgment'
          ? 'Urteilsverkündung des Bundesverwaltungsgerichts mit Leitentscheidungscharakter'
          : 'Mündliche Verhandlung vor dem Bundesverwaltungsgericht',
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

export async function fetchBverwgEvents(preferFixture = false) {
  if (preferFixture) {
    const fixturePath = path.resolve(process.cwd(), 'fixtures/bverwg-termine.rss');
    if (fs.existsSync(fixturePath)) {
      const xml = fs.readFileSync(fixturePath, 'utf-8');
      return {
        events: parseBverwgXml(xml, true),
        isFixture: true,
        sourceUrl: BVERWG_SOURCE_URL,
      };
    }
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(BVERWG_SOURCE_URL, {
      headers: { Accept: 'application/rss+xml, application/xml;q=0.9, text/xml' },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const xml = await res.text();
    const events = parseBverwgXml(xml, false);
    if (events.length === 0) throw new Error('Keine Termine im Feed gefunden');
    return { events, isFixture: false, sourceUrl: BVERWG_SOURCE_URL };
  } catch (err: any) {
    // Fallback to fixture
    const fixturePath = path.resolve(process.cwd(), 'fixtures/bverwg-termine.rss');
    if (fs.existsSync(fixturePath)) {
      const xml = fs.readFileSync(fixturePath, 'utf-8');
      return {
        events: parseBverwgXml(xml, true),
        isFixture: true,
        fallbackReason: `Live-Abruf nicht erreichbar (${err?.message || 'Timeout'}). Demo-Fixture verwendet.`,
        sourceUrl: BVERWG_SOURCE_URL,
      };
    }
    throw new Error(`Bundesverwaltungsgericht Abruf fehlgeschlagen: ${err.message}`);
  }
}
