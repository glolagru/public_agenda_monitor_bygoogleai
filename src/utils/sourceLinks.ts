import { NormalizedEvent, SourceKey } from '../types';

export interface SourceLinkMeta {
  sourceKey: SourceKey;
  sourceDomain: string;
  publicWebUrl: string;
  sourceSearchUrl: string;
  googleSiteSearchUrl: string;
  searchLabel: string;
}

/**
 * Returns canonical public website URLs (human-readable) for official sources.
 */
export function getSourcePublicWebUrl(sourceKey: SourceKey): string {
  switch (sourceKey) {
    case 'bverwg':
      return 'https://www.bverwg.de/aktuelles/verhandlungstermine';
    case 'bundespraesident':
      return 'https://www.bundespraesident.de/DE/termine/termine-node.html';
    case 'un_women_news':
      return 'https://www.unwomen.org/en/news-stories';
    default:
      return 'https://www.bverwg.de';
  }
}

/**
 * Extracts searchable identifiers (case number, keywords) from an event.
 */
export function extractSearchQuery(event: NormalizedEvent): string {
  // Check for German court case numbers, e.g. "2 BvR 1342/24", "1 BvL 8/25", "4 C 2.26"
  const caseMatch = event.title.match(/\b\d+\s+[A-Za-z]+(?:\s+[A-Za-z]+)?\s+\d+(?:\.\d+)?(?:\/\d+)?\b/);
  if (caseMatch) {
    return caseMatch[0];
  }

  // If no case number, take clean title without date prefix
  const cleanTitle = event.title
    .replace(/^\d{1,2}\.?\s*(?:Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember|\d{1,2}\.)?\s*\d{4}?,?\s*(?:\d{1,2}:\d{2}\s*Uhr:?)?\s*/i, '')
    .trim();

  return cleanTitle.slice(0, 60);
}

/**
 * Generates search helpers and verified public URLs for any event.
 */
export function getEventSearchHelpers(event: NormalizedEvent): SourceLinkMeta {
  const query = extractSearchQuery(event);

  let sourceDomain = 'bverwg.de';
  let sourceSearchUrl = '';
  let searchLabel = 'BVerwG Terminsuche';

  switch (event.sourceKey) {
    case 'bverwg': {
      sourceDomain = 'bverwg.de';
      const cleanBverwG = query.replace(/^BVerwG\s+/i, '').trim();
      const bverwgPlus = cleanBverwG.split(/\s+/).map(encodeURIComponent).join('+');
      sourceSearchUrl = `https://www.bverwg.de/suche?q=${bverwgPlus}`;
      searchLabel = 'BVerwG Suche (alle Datenbanken)';
      break;
    }
    case 'bundespraesident':
      sourceDomain = 'bundespraesident.de';
      sourceSearchUrl = `https://www.bundespraesident.de/SiteGlobals/Forms/Suche/Expertensuche_Formular.html?nn=127360&templateQueryString=${encodeURIComponent(query)}`;
      searchLabel = 'Bundespräsident Terminsuche';
      break;
    case 'un_women_news':
      sourceDomain = 'unwomen.org';
      sourceSearchUrl = `https://www.unwomen.org/en/search?text=${encodeURIComponent(query)}`;
      searchLabel = 'UN Women News-Suche';
      break;
  }

  const googleSiteSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(`site:${sourceDomain} ${query}`)}`;
  const publicWebUrl = getSourcePublicWebUrl(event.sourceKey);

  return {
    sourceKey: event.sourceKey,
    sourceDomain,
    publicWebUrl,
    sourceSearchUrl,
    googleSiteSearchUrl,
    searchLabel,
  };
}
