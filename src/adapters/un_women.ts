import fs from 'node:fs';
import path from 'node:path';
import { XMLParser } from 'fast-xml-parser';
import { EventType, NormalizedEvent, SourceKey } from '../types';

export const UN_WOMEN_NEWS_URL = 'https://www.unwomen.org/en/rss-feeds/news';

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

/**
 * Bewertet die Relevanz eines UN-Women-Eintrags nach journalistischem Nachrichtenwert
 * und der Wahrscheinlichkeit einer Berichterstattung in bundesweiten Hauptnachrichten (Tagesschau).
 * Skala: 1 = Höchste Relevanz / Top-Thema, 5 = Niedrigste Relevanz / Hintergrund/Ratgeber.
 */
export function evaluateUnWomenRelevance(
  title: string,
  desc: string,
  link: string
): { score: number; rule: string; eventType: EventType } {
  const combined = `${title}\n${desc}\n${link}`.toLowerCase();

  // 1. Stufe 1 (Höchste Relevanz / Top-Thema)
  // Tagesschau-Wahrscheinlichkeit: Sehr hoch (~85–95%) – Akute geopolitische Großkrisen & bewaffnete Konflikte
  if (
    /gaza|palestin|israel-hamas|security council resolution|zivilopfer/i.test(combined)
  ) {
    return {
      score: 1,
      rule: 'Stufe 1 (Höchste Relevanz – Tagesschau ~85–95%): Akuter geopolitischer Großkonflikt mit UN-Zivilopferbilanz',
      eventType: 'report',
    };
  }

  // 2. Stufe 2 (Hohe Relevanz / Wichtiges Nachrichtenthema)
  // Tagesschau-Wahrscheinlichkeit: Hoch (~60–75%) – UN-Generaldebatte der Staats-/Regierungschefs oder gravierende Rechtsakte
  if (
    /general assembly|unga\s*81|generaldebatte|ministerial meeting|high-level ministerial/i.test(combined)
  ) {
    return {
      score: 2,
      rule: 'Stufe 2 (Hohe Relevanz – Tagesschau ~65–75%): UN-Generalversammlung (UNGA) / hochrangiges Ministertreffen',
      eventType: 'panel',
    };
  }
  if (
    /decree\s*no\.\s*\d+|taliban|de facto authorities|morality law|sittenpolizei/i.test(combined)
  ) {
    return {
      score: 2,
      rule: 'Stufe 2 (Hohe Relevanz – Tagesschau ~60–70%): Folgenschwerer völkerrechtlicher Rechtsakt / Unterdrückungserlass',
      eventType: 'decision',
    };
  }

  // 3. Stufe 3 (Mittlere Relevanz / Vermeldung / Tagesschau24 / dpa)
  // Tagesschau-Wahrscheinlichkeit: Mäßig (~25–35%) – Schwere Naturkatastrophen / UN-Eilappelle / offizielle Briefings
  if (
    /flood|earthquake|famine|humanitarian assistance|flash flood|emergency appeal|nothilfe|katastrophe/i.test(combined)
  ) {
    return {
      score: 3,
      rule: 'Stufe 3 (Mittlere Relevanz – Tagesschau ~30%): Humanitärer UN-Eilappell / Flutkatastrophe mit Kurzmeldungspotenzial',
      eventType: 'report',
    };
  }
  if (
    /press briefing at the united nations|special representative.*briefing|press-briefing/i.test(combined)
  ) {
    return {
      score: 3,
      rule: 'Stufe 3 (Mittlere Relevanz – Tagesschau ~25%): Offizielles UN-Pressebriefing zu akuten Krisenregionen',
      eventType: 'report',
    };
  }
  if (
    /urges immediate global action|afghanistan/i.test(combined) &&
    !/feature-story|explainer/i.test(link)
  ) {
    return {
      score: 3,
      rule: 'Stufe 3 (Mittlere Relevanz – Tagesschau ~25%): Internationaler UN-Appell zu akuten Menschenrechtskrisen',
      eventType: 'report',
    };
  }

  // 4. Stufe 5 (Niedrigste Relevanz / Hintergrund, Ratgeber, Bildungsbeiträge, Kampagnen)
  // Tagesschau-Wahrscheinlichkeit: Praktisch 0% (< 2%) – Reine Hintergrundaufklärung ohne aktuellen Nachrichtenanlass
  if (
    /explainer|guide to|five things to know|how can|sustainable development goal|period poverty|workplaces free from|violence prevention a priority|sport/i.test(combined) ||
    link.includes('/explainer/')
  ) {
    return {
      score: 5,
      rule: 'Stufe 5 (Niedrigste Relevanz – Tagesschau < 2%): Allgemeiner Hintergrund-Explainer / Ratgeber / Bildungsartikel',
      eventType: 'report',
    };
  }

  // 5. Stufe 4 (Geringe Relevanz / Spezialinteresse / Fachpresse / Porträts)
  // Tagesschau-Wahrscheinlichkeit: Gering (~5–10%) – Quotenanalysen, regionale Programme, Einzelporträts, Gremienreden
  if (
    /political leadership|political participation|lgbtiq|anti-rights pushback|on the move|gender-daten/i.test(combined)
  ) {
    return {
      score: 4,
      rule: 'Stufe 4 (Geringe Relevanz – Tagesschau ~10%): Fachpolitischer Bericht / Quotenanalyse ohne akuten Eilcharakter',
      eventType: 'report',
    };
  }
  if (
    /speech.*executive board|opening of the second regular session|closing of the second regular/i.test(combined)
  ) {
    return {
      score: 4,
      rule: 'Stufe 4 (Geringe Relevanz – Tagesschau ~5%): Interne Gremienrede vor UN-Exekutivrat',
      eventType: 'panel',
    };
  }
  if (
    /feature-story|fatherhood|female genital mutilation|fgm|grassroots/i.test(combined)
  ) {
    return {
      score: 4,
      rule: 'Stufe 4 (Geringe Relevanz – Tagesschau ~5%): Regionale Porträt- und Feature-Story für Spezialformate',
      eventType: 'report',
    };
  }

  return {
    score: 4,
    rule: 'Stufe 4 (Geringe Relevanz – Tagesschau ~5%): Allgemeiner Informationsbeitrag von UN Women',
    eventType: 'report',
  };
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
    const evaluation = evaluateUnWomenRelevance(title, desc, link);
    const eventType = evaluation.eventType;

    let topic = 'Gleichstellung & Frauenrechte';
    if (/care|unpaid/i.test(combined)) topic = 'Care-Arbeit & Wirtschaft';
    else if (/violence|abuse|digital/i.test(combined)) topic = 'Schutz vor Gewalt';
    else if (/snapshot|data|indicators|sdg/i.test(combined)) topic = 'Gender-Daten & SDGs';
    else if (/gaza|palestin|israel/i.test(combined)) topic = 'Nahost & Zivilschutz';
    else if (/afghanistan|taliban/i.test(combined)) topic = 'Menschenrechte Afghanistan';
    else if (/flood|katastrophe/i.test(combined)) topic = 'Katastrophenhilfe & Nothilfe';

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
      suggestedScore: evaluation.score,
      suggestedScoreRule: evaluation.rule,
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
