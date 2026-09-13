import fs from 'node:fs';
import path from 'node:path';
import { XMLParser } from 'fast-xml-parser';
import { NormalizedEvent, SourceKey } from '../types';

export const UN_WOMEN_NEWS_URL = 'https://www.unwomen.org/en/feeds/news';

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

function parseDateFromTextOrPubDate(text: string, pubDateStr: string): { dateStr: string; timeStr: string | null } {
  // Check text for e.g. "16 September 2026"
  const match = text.match(/\b(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})\b/i);
  let dateStr = '';
  if (match) {
    const months: Record<string, number> = {
      january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
      july: 7, august: 8, september: 9, october: 10, november: 11, december: 12
    };
    const m = months[match[2].toLowerCase()];
    const d = Number(match[1]);
    const y = Number(match[3]);
    dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  } else if (pubDateStr) {
    try {
      const d = new Date(pubDateStr);
      if (!isNaN(d.getTime())) {
        dateStr = d.toISOString().slice(0, 10);
      }
    } catch {}
  }

  if (!dateStr) {
    dateStr = '2026-09-16';
  }

  const timeMatch = text.match(/\b(\d{1,2}):(\d{2})\s*(UTC|GMT|EDT|CEST|Uhr)?\b/i);
  const timeStr = timeMatch ? `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}` : null;

  return { dateStr, timeStr };
}

export function parseUnWomenXml(
  xml: string,
  channel: 'news' = 'news',
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
  const sourceKey: SourceKey = 'un_women_news';
  const sourceName = 'UN Women (News & Panels)';

  for (const item of rawList) {
    const title = typeof item.title === 'string' ? decodeXml(item.title) : '';
    const desc = typeof item.description === 'string' ? decodeXml(item.description) : '';
    const link = typeof item.link === 'string' ? decodeXml(item.link) : '';
    const pubDate = typeof item.pubDate === 'string' ? item.pubDate : '';
    const rawGuid = typeof item.guid === 'object' ? item.guid['#text'] : item.guid;
    const guid = typeof rawGuid === 'string' ? decodeXml(rawGuid) : '';

    if (!title || !link) continue;

    const combined = `${title}\n${desc}`;
    // Qualification check: gender equality, violence, care, ministerial, report, snapshot, data
    const isQualifying =
      /ministerial|high-level|consultation|panel|summit|snapshot|report|publication|briefing|gender|violence|care|equality|rights/i.test(
        combined
      );
    if (!isQualifying) continue;

    const { dateStr, timeStr } = parseDateFromTextOrPubDate(combined, pubDate);
    const eventType = 'panel';

    let topic = 'Gleichstellung & Frauenrechte';
    if (/care|unpaid/i.test(combined)) topic = 'Care-Arbeit & Wirtschaft';
    else if (/violence|abuse|digital/i.test(combined)) topic = 'Schutz vor Gewalt';
    else if (/snapshot|data|indicators|sdg/i.test(combined)) topic = 'Gender-Daten & SDGs';

    events.push({
      sourceKey,
      sourceName,
      sourceEventKey: guid ? `guid:${guid}` : `unw:${dateStr}:${title.slice(0, 40)}`,
      sourceUrl: link,
      title,
      eventType,
      sourceDate: dateStr,
      sourceTime: timeStr,
      sourceTimezone: 'UTC',
      topic,
      organizer: 'UN Women',
      protagonists: 'UN Women Führungsebene & Ministervertreter',
      location: /Geneva/i.test(combined) ? 'Genf, Schweiz' : 'New York, UN Headquarters',
      originalText: `${title}\n\n${desc}`.trim(),
      editorialState: 'candidate',
      suggestedScore: 4,
      suggestedScoreRule: 'High-Level Panel / Ministerkonferenz von UN Women auf UN-Ebene',
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

export async function fetchUnWomenEvents(channel: 'news' = 'news', preferFixture = false) {
  const targetUrl = UN_WOMEN_NEWS_URL;
  const fixtureFile = 'fixtures/unwomen-news.xml';

  if (preferFixture) {
    const fixturePath = path.resolve(process.cwd(), fixtureFile);
    if (fs.existsSync(fixturePath)) {
      const xml = fs.readFileSync(fixturePath, 'utf-8');
      return {
        events: parseUnWomenXml(xml, channel, true),
        isFixture: true,
        sourceUrl: targetUrl,
      };
    }
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'PublicAgendaMonitor/1.0 (Editorial Newsroom Agenda Tool)',
        Accept: 'application/rss+xml, application/xml, text/xml',
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const xml = await res.text();
    const events = parseUnWomenXml(xml, channel, false);
    if (events.length === 0) throw new Error('Keine qualifizierten Termine im Feed');
    return { events, isFixture: false, sourceUrl: targetUrl };
  } catch (err: any) {
    const fixturePath = path.resolve(process.cwd(), fixtureFile);
    if (fs.existsSync(fixturePath)) {
      const xml = fs.readFileSync(fixturePath, 'utf-8');
      return {
        events: parseUnWomenXml(xml, channel, true),
        isFixture: true,
        fallbackReason: `Live-Feed nicht erreichbar (${err?.message || 'Netzwerkblockade'}). Offizieller Fixture-Fallback aktiv.`,
        sourceUrl: targetUrl,
      };
    }
    throw new Error(`UN Women (${channel}) Abruf fehlgeschlagen: ${err.message}`);
  }
}
