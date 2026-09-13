import fs from 'node:fs';
import path from 'node:path';
import { NormalizedEvent } from '../types';

export const BVERFG_WOCHENAUSBLICK_URL =
  'https://www.bundesverfassungsgericht.de/DE/Aktuelles/TermineWochenausblick/termine-Wochenausblick_node.html';

function parseGermanDate(text: string): { dateStr: string | null; timeStr: string | null } {
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
        januar: 1, februar: 2, märz: 3, april: 4, mai: 5, juni: 6,
        juli: 7, august: 8, september: 9, oktober: 10, november: 11, dezember: 12
      };
      const m = months[named[2].toLowerCase()];
      const d = Number(named[1]);
      const y = Number(named[3]);
      dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
  }

  const timeMatch = text.match(/\b(\d{1,2}):(\d{2})\s*Uhr\b/i);
  const timeStr = timeMatch ? `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}` : null;

  return { dateStr, timeStr };
}

export function parseBverfgHtml(
  html: string,
  isFixture = false
): Omit<NormalizedEvent, 'id' | 'sourceId'>[] {
  const events: Omit<NormalizedEvent, 'id' | 'sourceId'>[] = [];

  // Match entries from weekly outlook HTML
  const entryRegex =
    /(?:<div class="appointment-entry">|<article[^>]*>|<tr[^>]*>)([\s\S]*?)(?:<\/div>\s*<\/div>|<\/article>|<\/tr>)/gi;
  let matches = [...html.matchAll(entryRegex)];

  // If no wrapper matches, check for headers with dates
  if (matches.length === 0) {
    const sectionRegex = /(<h[2-4][^>]*>[\s\S]*?<\/h[2-4]>[\s\S]*?(?=<h[2-4]|$))/gi;
    matches = [...html.matchAll(sectionRegex)];
  }

  for (const match of matches) {
    const block = match[1] || match[0];
    const textOnly = block.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

    if (!textOnly) continue;

    // Check if it's a court event
    const isHearing = /verhandlung/i.test(textOnly);
    const isJudgment = /urteil|verkündung|entscheidung/i.test(textOnly);
    if (!isHearing && !isJudgment) continue;

    const { dateStr, timeStr } = parseGermanDate(textOnly);
    if (!dateStr) continue;

    const titleMatch = block.match(/<h[2-4][^>]*>([\s\S]*?)<\/h[2-4]>/i);
    const rawTitle = titleMatch
      ? titleMatch[1].replace(/<[^>]+>/g, '').trim()
      : textOnly.slice(0, 70);

    const linkMatch = block.match(/href="([^"]+)"/i);
    let link = linkMatch ? linkMatch[1] : BVERFG_WOCHENAUSBLICK_URL;
    if (link.startsWith('/')) {
      link = `https://www.bundesverfassungsgericht.de${link}`;
    }

    const azMatch = textOnly.match(/\b\d\s+Bv[A-Z]\s+\d+\/\d+\b/i);
    const aktenzeichen = azMatch ? azMatch[0] : null;

    const eventType = isJudgment ? 'judgment' : 'hearing';
    const sourceEventKey = aktenzeichen
      ? `bverfg:${aktenzeichen.replace(/\s+/g, '_')}`
      : `bverfg:${dateStr}:${rawTitle.slice(0, 35).toLowerCase().replace(/\s+/g, '_')}`;

    events.push({
      sourceKey: 'bverfg',
      sourceName: 'Bundesverfassungsgericht',
      sourceEventKey,
      sourceUrl: link,
      title: aktenzeichen ? `${rawTitle} (${aktenzeichen})` : rawTitle,
      eventType,
      sourceDate: dateStr,
      sourceTime: timeStr,
      sourceTimezone: 'Europe/Berlin',
      topic: 'Verfassungsrecht & Grundrechte',
      organizer: 'Bundesverfassungsgericht',
      protagonists: /Zweiter Senat/i.test(textOnly)
        ? 'Zweiter Senat des BVerfG'
        : /Erster Senat/i.test(textOnly)
        ? 'Erster Senat des BVerfG'
        : 'Bundesverfassungsgericht',
      location: 'Karlsruhe, Bundesverfassungsgericht',
      originalText: textOnly,
      editorialState: 'candidate',
      suggestedScore: 5,
      suggestedScoreRule:
        'Leitentscheidung / Verhandlung des Bundesverfassungsgerichts mit höchster nationaler Relevanz',
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

export async function fetchBverfgEvents(preferFixture = false) {
  if (preferFixture) {
    const fixturePath = path.resolve(process.cwd(), 'fixtures/bverfg-wochenausblick.html');
    if (fs.existsSync(fixturePath)) {
      const html = fs.readFileSync(fixturePath, 'utf-8');
      return {
        events: parseBverfgHtml(html, true),
        isFixture: true,
        sourceUrl: BVERFG_WOCHENAUSBLICK_URL,
      };
    }
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(BVERFG_WOCHENAUSBLICK_URL, {
      headers: {
        'User-Agent': 'PublicAgendaMonitor/1.0 (Editorial Newsroom Research)',
        Accept: 'text/html,application/xhtml+xml',
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    const events = parseBverfgHtml(html, false);
    if (events.length === 0) throw new Error('Keine Termine im Wochenausblick gefunden');
    return { events, isFixture: false, sourceUrl: BVERFG_WOCHENAUSBLICK_URL };
  } catch (err: any) {
    const fixturePath = path.resolve(process.cwd(), 'fixtures/bverfg-wochenausblick.html');
    if (fs.existsSync(fixturePath)) {
      const html = fs.readFileSync(fixturePath, 'utf-8');
      return {
        events: parseBverfgHtml(html, true),
        isFixture: true,
        fallbackReason: `Live-Webseite nicht erreichbar (${err?.message || 'Blockade'}). Offizieller Wochenausblick-Fixture verwendet.`,
        sourceUrl: BVERFG_WOCHENAUSBLICK_URL,
      };
    }
    throw new Error(`Bundesverfassungsgericht Abruf fehlgeschlagen: ${err.message}`);
  }
}
