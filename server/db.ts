import fs from 'node:fs';
import path from 'node:path';
import {
  EditorialState,
  EventType,
  NormalizedEvent,
  RetrievalRun,
  ReviewEntry,
  SourceDefinition,
  SourceKey,
} from '../src/types';
import { evaluateUnWomenRelevance } from '../src/adapters/un_women';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'agenda_monitor.json');

export interface DatabaseState {
  sources: SourceDefinition[];
  events: NormalizedEvent[];
  reviews: ReviewEntry[];
  runs: RetrievalRun[];
  lastSpecialistReviewAt: string | null;
}

export function getDateWindow(): { minDate: string; maxDate: string } {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Berlin',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const todayStr = formatter.format(new Date());

  // 4-week window (28 calendar days ahead)
  const maxDateObj = new Date();
  maxDateObj.setDate(maxDateObj.getDate() + 28);
  const maxDateStr = formatter.format(maxDateObj);

  return { minDate: todayStr, maxDate: maxDateStr };
}

const DEFAULT_SOURCES: SourceDefinition[] = [
  {
    id: 'src-bverwg',
    key: 'bverwg',
    name: 'Bundesverwaltungsgericht',
    category: 'Gerichte',
    publicWebUrl: 'https://www.bverwg.de/aktuelles/verhandlungstermine',
    primaryUrl: 'https://www.bverwg.de/rss/termine.rss',
    qualificationRule: 'Verhandlungs- und Urteilstermine der Senate',
    defaultTopic: 'Verwaltungsrecht',
    defaultScore: 2,
    healthStatus: 'healthy',
    lastRetrievalAt: null,
    lastErrorMessage: null,
    eventsCount: 0,
  },
  {
    id: 'src-bundespraesident',
    key: 'bundespraesident',
    name: 'Bundespräsident',
    category: 'Staat & Politik',
    publicWebUrl: 'https://www.bundespraesident.de/DE/termine/termine-node.html',
    primaryUrl: 'https://www.bundespraesident.de/DE/termine/termine-node.html',
    fallbackUrl:
      'https://www.bundespraesident.de/SiteGlobals/Functions/RSSFeed/DE/RSSNewsfeed/Termine/RSSNewsfeed.xml?nn=127360',
    qualificationRule: 'Öffentliche Termine des Bundespräsidenten laut Terminkalender/Feed',
    defaultTopic: 'Staatsoberhaupt & Repräsentation',
    defaultScore: 2,
    healthStatus: 'healthy',
    lastRetrievalAt: null,
    lastErrorMessage: null,
    eventsCount: 0,
  },
  {
    id: 'src-un-women-news',
    key: 'un_women_news',
    name: 'UN Women (News & Panels)',
    category: 'Internationale Organisationen',
    publicWebUrl: 'https://www.unwomen.org/en/news-stories',
    primaryUrl: 'https://www.unwomen.org/en/feeds/news',
    qualificationRule: 'High-Level Panels, Ministertreffen zu Gleichstellung & Krisenberichte',
    defaultTopic: 'Gleichstellung & Menschenrechte',
    defaultScore: 4,
    healthStatus: 'healthy',
    lastRetrievalAt: null,
    lastErrorMessage: null,
    eventsCount: 0,
  },
];

class DatabaseService {
  private state: DatabaseState;

  constructor() {
    this.state = this.loadState();
  }

  private loadState(): DatabaseState {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.sources && parsed.events && parsed.reviews) {
          // Ensure all sources have publicWebUrl and exclude deleted sources (bverfg, un_women_publications)
          parsed.sources = parsed.sources
            .filter((s: SourceDefinition) => (s.key as string) !== 'bverfg' && (s.key as string) !== 'un_women_publications')
            .map((s: SourceDefinition) => {
              const def = DEFAULT_SOURCES.find((d) => d.key === s.key);
              return {
                ...s,
                publicWebUrl: s.publicWebUrl || def?.publicWebUrl || s.primaryUrl,
              };
            });

          // Ensure all events have clean, reachable public web URLs and deleted events lose isNew status
          for (const ev of parsed.events) {
            if (ev.editorialState === 'deleted' || ev.isDeleted) {
              ev.isNew = false;
            }
            if (ev.sourceKey === 'bverwg' && (ev.sourceUrl?.includes('240926U1C1.25.0') || ev.sourceUrl?.includes('250926U2C2.25.0') || ev.sourceUrl?.endsWith('.rss') || ev.sourceUrl?.includes('rechtsprechung/termine'))) {
              ev.sourceUrl = 'https://www.bverwg.de/aktuelles/verhandlungstermine';
            } else if (ev.sourceKey === 'bundespraesident' && (ev.sourceUrl?.includes('RSSNewsfeed') || ev.sourceUrl?.includes('rss-feeds'))) {
              ev.sourceUrl = 'https://www.bundespraesident.de/DE/termine/termine-node.html';
            } else if (ev.sourceKey === 'un_women_news') {
              if (ev.sourceUrl?.includes('/feeds/')) {
                ev.sourceUrl = 'https://www.unwomen.org/en/news-stories';
              }
              // Differentiated relevance evaluation based on Tagesschau reporting likelihood (1 = highest, 5 = lowest)
              const evaluation = evaluateUnWomenRelevance(ev.title, ev.originalText || '', ev.sourceUrl || '');
              ev.suggestedScore = evaluation.score;
              ev.suggestedScoreRule = evaluation.rule;
              if (evaluation.eventType) {
                ev.eventType = evaluation.eventType;
              }
            } else if (ev.sourceKey === 'bundespraesident') {
              ev.suggestedScore = 2;
              ev.suggestedScoreRule = 'Stufe 2 (Hohe Relevanz): Öffentlicher offizieller Termin des Bundespräsidenten mit bundespolitischer Außenwirkung';
            } else if (ev.sourceKey === 'bverwg') {
              ev.suggestedScore = ev.eventType === 'judgment' ? 2 : 3;
              ev.suggestedScoreRule =
                ev.eventType === 'judgment'
                  ? 'Stufe 2 (Hohe Relevanz): Urteilsverkündung des Bundesverwaltungsgerichts mit Leitentscheidungscharakter'
                  : 'Stufe 3 (Mittlere Relevanz): Mündliche Verhandlung vor dem Bundesverwaltungsgericht';
            }
          }

          // Strict 14-day window: only retain events taking place from today until 2 weeks ahead (no past events, active sources only)
          const { minDate, maxDate } = getDateWindow();
          parsed.events = parsed.events.filter(
            (ev: NormalizedEvent) =>
              (ev.sourceKey as string) !== 'bverfg' &&
              (ev.sourceKey as string) !== 'un_women_publications' &&
              ev.sourceDate >= minDate &&
              ev.sourceDate <= maxDate
          );

          return parsed;
        }
      }
    } catch (err) {
      console.error('Error loading data file, initializing fresh:', err);
    }

    const initial: DatabaseState = {
      sources: DEFAULT_SOURCES,
      events: [],
      reviews: [],
      runs: [],
      lastSpecialistReviewAt: null,
    };
    this.saveState(initial);
    return initial;
  }

  private saveState(state = this.state) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving data file:', err);
    }
  }

  public pruneExpiredEvents(): boolean {
    const { minDate, maxDate } = getDateWindow();
    const originalCount = this.state.events.length;
    this.state.events = this.state.events.filter(
      (ev) => ev.sourceDate >= minDate && ev.sourceDate <= maxDate
    );
    if (this.state.events.length !== originalCount) {
      this.saveState();
      return true;
    }
    return false;
  }

  public getSources(): SourceDefinition[] {
    const { minDate, maxDate } = getDateWindow();
    return this.state.sources.map((s) => {
      const count = this.state.events.filter(
        (e) =>
          e.sourceKey === s.key &&
          e.sourceDate >= minDate &&
          e.sourceDate <= maxDate &&
          e.editorialState !== 'deleted' &&
          !e.isDeleted
      ).length;
      return { ...s, eventsCount: count };
    });
  }

  public getSourceByKey(key: SourceKey): SourceDefinition | undefined {
    return this.state.sources.find((s) => s.key === key);
  }

  public updateSourceHealth(
    key: SourceKey,
    health: 'healthy' | 'warning' | 'error',
    errorMessage: string | null = null
  ) {
    const src = this.state.sources.find((s) => s.key === key);
    if (src) {
      src.healthStatus = health;
      src.lastRetrievalAt = new Date().toISOString();
      src.lastErrorMessage = errorMessage;
      this.saveState();
    }
  }

  public getLearningStats(sourceKey: SourceKey, eventType: EventType) {
    const matchingReviewed = this.state.events.filter(
      (e) => e.sourceKey === sourceKey && e.eventType === eventType && e.reviewCount > 0
    );

    if (matchingReviewed.length < 3) {
      return {
        hasAdjustment: false,
        adjustment: 0,
        approvedCount: 0,
        totalReviewed: matchingReviewed.length,
        approvalRate: 0,
        explanation: 'Standard-Relevanzregel (weniger als 3 geprüfte Ereignisse in dieser Kategorie)',
      };
    }

    const approvedCount = matchingReviewed.filter((e) => e.editorialState === 'approved').length;
    const approvalRate = Math.round((approvedCount / matchingReviewed.length) * 100);

    // Rounded difference between prior editorial scores and suggested scores
    let diffSum = 0;
    let countWithScore = 0;
    for (const ev of matchingReviewed) {
      if (ev.editorialScore !== null) {
        diffSum += ev.editorialScore - ev.suggestedScore;
        countWithScore++;
      }
    }

    const avgDiff = countWithScore > 0 ? diffSum / countWithScore : 0;
    const roundedAdjustment = Math.round(avgDiff);

    return {
      hasAdjustment: roundedAdjustment !== 0,
      adjustment: roundedAdjustment,
      approvedCount,
      totalReviewed: matchingReviewed.length,
      approvalRate,
      explanation: `Lernschleife aktiv: ${roundedAdjustment >= 0 ? '+' : ''}${roundedAdjustment} Stufen-Anpassung basierend auf ${matchingReviewed.length} redaktionellen Prüfungen (${approvalRate}% Freigabequote).`,
    };
  }

  public upsertEvents(
    sourceKey: SourceKey,
    newItems: Omit<NormalizedEvent, 'id' | 'sourceId'>[],
    isFixture = false
  ): { added: number; updated: number; total: number } {
    const { minDate, maxDate } = getDateWindow();
    // Only accept events taking place from today until 2 weeks ahead (no past events)
    const validItems = newItems.filter(
      (item) => item.sourceDate >= minDate && item.sourceDate <= maxDate
    );

    const source = this.state.sources.find((s) => s.key === sourceKey);
    const sourceId = source ? source.id : `src-${sourceKey}`;
    const now = new Date().toISOString();

    let added = 0;
    let updated = 0;
    const seenKeys = new Set<string>();

    for (const item of validItems) {
      seenKeys.add(item.sourceEventKey);
      const existing = this.state.events.find(
        (e) => e.sourceKey === sourceKey && e.sourceEventKey === item.sourceEventKey
      );

      // Learning loop calculation for suggested score
      const learning = this.getLearningStats(sourceKey, item.eventType);
      let calculatedSuggestedScore = Math.max(
        1,
        Math.min(5, item.suggestedScore + learning.adjustment)
      );

      if (existing) {
        // Safe update: retain editorial state, score, comments, priority, and original review entries
        existing.sourceUrl = item.sourceUrl;
        existing.title = item.title;
        existing.sourceDate = item.sourceDate;
        existing.sourceTime = item.sourceTime;
        existing.topic = item.topic || existing.topic;
        existing.organizer = item.organizer || existing.organizer;
        existing.location = item.location || existing.location;
        existing.originalText = item.originalText;
        existing.lastSeenAt = now;
        existing.notSeenInLatestRetrieval = false;
        existing.fixture = isFixture;
        // Do NOT overwrite editorialState or editorialScore
        updated++;
      } else {
        const id = `ev-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        const maxPriority = this.state.events.reduce(
          (max, e) => (e.manualPriority > max ? e.manualPriority : max),
          0
        );

        this.state.events.push({
          ...item,
          id,
          sourceId,
          suggestedScore: calculatedSuggestedScore,
          suggestedScoreRule: learning.hasAdjustment
            ? `${item.suggestedScoreRule} (${learning.explanation})`
            : item.suggestedScoreRule,
          suggestedScoreAdjustment: learning.adjustment,
          groupApprovalRate: learning.approvalRate,
          manualPriority: maxPriority + 1,
          firstSeenAt: now,
          lastSeenAt: now,
          notSeenInLatestRetrieval: false,
          isNew: true,
          reviewCount: 0,
          latestComment: null,
          fixture: isFixture,
        });
        added++;
      }
    }

    // AD-11: Events of this source not in this run become notSeenInLatestRetrieval = true (for unreviewed candidates)
    for (const e of this.state.events) {
      if (e.sourceKey === sourceKey && !seenKeys.has(e.sourceEventKey)) {
        if (e.editorialState !== 'approved') {
          e.notSeenInLatestRetrieval = true;
        }
      }
    }

    // Prune any events that might now be outside the 14-day window
    this.pruneExpiredEvents();
    this.saveState();
    return { added, updated, total: this.state.events.length };
  }

  public recordRun(run: Omit<RetrievalRun, 'id'>): RetrievalRun {
    const id = `run-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const fullRun: RetrievalRun = { ...run, id };
    this.state.runs.unshift(fullRun);
    if (this.state.runs.length > 50) this.state.runs.pop();
    this.saveState();
    return fullRun;
  }

  public getRuns(): RetrievalRun[] {
    return this.state.runs;
  }

  public getEvents(): NormalizedEvent[] {
    const { minDate, maxDate } = getDateWindow();
    // Return only events taking place today until 2 weeks ahead, default sorted chronologically by date & time
    return this.state.events
      .filter((e) => e.sourceDate >= minDate && e.sourceDate <= maxDate)
      .sort((a, b) => {
        const dateComp = a.sourceDate.localeCompare(b.sourceDate);
        if (dateComp !== 0) return dateComp;
        const timeA = a.sourceTime || '99:99';
        const timeB = b.sourceTime || '99:99';
        const timeComp = timeA.localeCompare(timeB);
        if (timeComp !== 0) return timeComp;
        return a.id.localeCompare(b.id);
      });
  }

  public getEventById(id: string): NormalizedEvent | undefined {
    return this.state.events.find((e) => e.id === id);
  }

  public getReviewsForEvent(eventId: string): ReviewEntry[] {
    return this.state.reviews
      .filter((r) => r.eventId === eventId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  public addReview(
    eventId: string,
    decision: 'approved' | 'rejected' | 'updated' | 'deferred',
    editorialScore?: number | null,
    comment?: string | null,
    sourceUrl?: string | null
  ): { event: NormalizedEvent; review: ReviewEntry } {
    const event = this.state.events.find((e) => e.id === eventId);
    if (!event) throw new Error(`Event mit ID ${eventId} nicht gefunden`);

    if (sourceUrl && sourceUrl.trim() && sourceUrl.trim() !== event.sourceUrl) {
      event.sourceUrl = sourceUrl.trim();
    }

    const reviewId = `rev-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const newReview: ReviewEntry = {
      id: reviewId,
      eventId,
      decision,
      editorialScore: editorialScore ?? event.editorialScore,
      comment: comment?.trim() || null,
      createdAt: new Date().toISOString(),
    };

    this.state.reviews.push(newReview);

    // Apply to event
    if (decision === 'approved') {
      event.editorialState = 'approved';
      event.notSeenInLatestRetrieval = false;
    } else if (decision === 'rejected') {
      event.editorialState = 'rejected';
      event.notSeenInLatestRetrieval = false;
    }

    if (editorialScore !== undefined && editorialScore !== null) {
      event.editorialScore = editorialScore;
    }

    if (comment?.trim()) {
      event.latestComment = comment.trim();
    }

    event.isNew = false;
    event.notSeenInLatestRetrieval = false;
    event.reviewCount = (event.reviewCount || 0) + 1;
    this.state.lastSpecialistReviewAt = new Date().toISOString();

    this.saveState();
    return { event, review: newReview };
  }

  public updateEventSourceUrl(
    eventId: string,
    sourceUrl: string,
    comment?: string | null
  ): { event: NormalizedEvent; review: ReviewEntry } {
    const event = this.state.events.find((e) => e.id === eventId);
    if (!event) throw new Error(`Event mit ID ${eventId} nicht gefunden`);

    const trimmedUrl = sourceUrl.trim();
    if (!trimmedUrl) throw new Error('Quellenlink darf nicht leer sein');

    const prevUrl = event.sourceUrl;
    event.sourceUrl = trimmedUrl;

    const reviewId = `rev-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const note =
      comment?.trim() ||
      `Öffentlicher Quellenlink aktualisiert auf: ${trimmedUrl}`;
    const newReview: ReviewEntry = {
      id: reviewId,
      eventId,
      decision: 'updated',
      editorialScore: event.editorialScore,
      comment: note,
      createdAt: new Date().toISOString(),
    };

    this.state.reviews.push(newReview);
    event.latestComment = note;
    event.reviewCount = (event.reviewCount || 0) + 1;
    this.state.lastSpecialistReviewAt = new Date().toISOString();

    this.saveState();
    return { event, review: newReview };
  }

  public updateEventScore(
    eventId: string,
    score: number
  ): { event: NormalizedEvent; review: ReviewEntry } {
    const event = this.state.events.find((e) => e.id === eventId);
    if (!event) throw new Error(`Event mit ID ${eventId} nicht gefunden`);

    const validScore = Math.min(5, Math.max(1, Math.round(score)));
    event.editorialScore = validScore;

    const reviewId = `rev-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const note = `Relevanz angepasst auf ${validScore}`;
    const newReview: ReviewEntry = {
      id: reviewId,
      eventId,
      decision: 'updated',
      editorialScore: validScore,
      comment: note,
      createdAt: new Date().toISOString(),
    };

    this.state.reviews.push(newReview);
    event.latestComment = note;
    event.reviewCount = (event.reviewCount || 0) + 1;
    this.state.lastSpecialistReviewAt = new Date().toISOString();

    this.saveState();
    return { event, review: newReview };
  }

  public deleteEvent(eventId: string): NormalizedEvent {
    const event = this.state.events.find((e) => e.id === eventId);
    if (!event) throw new Error(`Event mit ID ${eventId} nicht gefunden`);
    event.editorialState = 'deleted';
    event.isDeleted = true;
    event.isNew = false;

    const reviewId = `rev-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    this.state.reviews.push({
      id: reviewId,
      eventId,
      decision: 'deleted',
      editorialScore: event.editorialScore,
      comment: 'Ereignis gelöscht (in den Papierkorb verschoben)',
      createdAt: new Date().toISOString(),
    });
    this.saveState();
    return event;
  }

  public restoreEvent(eventId: string): NormalizedEvent {
    const event = this.state.events.find((e) => e.id === eventId);
    if (!event) throw new Error(`Event mit ID ${eventId} nicht gefunden`);
    event.editorialState = 'candidate';
    event.isDeleted = false;
    event.isNew = false;

    const reviewId = `rev-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    this.state.reviews.push({
      id: reviewId,
      eventId,
      decision: 'updated',
      editorialScore: event.editorialScore,
      comment: 'Ereignis wiederhergestellt',
      createdAt: new Date().toISOString(),
    });
    this.saveState();
    return event;
  }

  public updateManualPriority(orderedIds: string[]) {
    orderedIds.forEach((id, index) => {
      const ev = this.state.events.find((e) => e.id === id);
      if (ev) {
        ev.manualPriority = index + 1;
      }
    });
    this.saveState();
  }

  public clearAllAndSeedWithFixtures(events: NormalizedEvent[]) {
    this.state.events = events;
    this.saveState();
  }

  public resetAllEventMarkings(): { count: number } {
    this.state.reviews = [];
    this.state.lastSpecialistReviewAt = null;

    let index = 1;
    for (const ev of this.state.events) {
      ev.editorialState = 'candidate';
      ev.editorialScore = null;
      ev.latestComment = null;
      ev.reviewCount = 0;
      ev.isNew = true;
      ev.isDeleted = false;
      ev.notSeenInLatestRetrieval = false;
      ev.suggestedScoreAdjustment = 0;
      ev.groupApprovalRate = 0;
      ev.manualPriority = index++;

      if (ev.sourceKey === 'un_women_news') {
        const evaluation = evaluateUnWomenRelevance(ev.title, ev.originalText || '', ev.sourceUrl || '');
        ev.suggestedScore = evaluation.score;
        ev.suggestedScoreRule = evaluation.rule;
        if (evaluation.eventType) {
          ev.eventType = evaluation.eventType;
        }
      } else if (ev.sourceKey === 'bundespraesident') {
        ev.suggestedScore = 2;
        ev.suggestedScoreRule = 'Stufe 2 (Hohe Relevanz): Öffentlicher offizieller Termin des Bundespräsidenten mit bundespolitischer Außenwirkung';
      } else if (ev.sourceKey === 'bverwg') {
        ev.suggestedScore = ev.eventType === 'judgment' ? 2 : 3;
        ev.suggestedScoreRule =
          ev.eventType === 'judgment'
            ? 'Stufe 2 (Hohe Relevanz): Urteilsverkündung des Bundesverwaltungsgerichts mit Leitentscheidungscharakter'
            : 'Stufe 3 (Mittlere Relevanz): Mündliche Verhandlung vor dem Bundesverwaltungsgericht';
      }
    }

    for (const s of this.state.sources) {
      s.healthStatus = 'healthy';
      s.lastErrorMessage = null;
    }

    this.saveState();
    return { count: this.state.events.length };
  }
}

export const db = new DatabaseService();
