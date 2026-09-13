export type EventType =
  | 'hearing'
  | 'judgment'
  | 'appointment'
  | 'panel'
  | 'report'
  | 'outlook'
  | 'decision';

export type EditorialState = 'candidate' | 'approved' | 'rejected' | 'deleted';

export type SourceKey =
  | 'bverwg'
  | 'bundespraesident'
  | 'un_women_news';

export interface SourceDefinition {
  id: string;
  key: SourceKey;
  name: string;
  category: string;
  publicWebUrl: string; // Offizielle Web-Adresse für Nutzer im Browser
  primaryUrl: string; // Technischer Feed-/Abruf-Endpunkt (RSS/XML/HTML)
  fallbackUrl?: string;
  qualificationRule: string;
  defaultTopic: string;
  defaultScore: number;
  healthStatus: 'healthy' | 'warning' | 'error' | 'untested';
  lastRetrievalAt: string | null;
  lastErrorMessage: string | null;
  eventsCount: number;
}

export interface NormalizedEvent {
  id: string;
  sourceId: string;
  sourceKey: SourceKey;
  sourceName: string;
  sourceEventKey: string;
  sourceUrl: string;
  title: string;
  eventType: EventType;
  sourceDate: string; // YYYY-MM-DD
  sourceTime: string | null; // HH:MM or null
  sourceTimezone: string | null;
  topic: string | null;
  organizer: string | null;
  protagonists?: string | null;
  location: string | null;
  originalText: string;
  editorialState: EditorialState;
  suggestedScore: number; // 1-5
  suggestedScoreRule: string;
  suggestedScoreAdjustment: number;
  groupApprovalRate: number;
  editorialScore: number | null;
  manualPriority: number;
  fixture: boolean;
  firstSeenAt: string;
  lastSeenAt: string;
  notSeenInLatestRetrieval: boolean;
  isNew: boolean;
  isDeleted?: boolean;
  reviewCount: number;
  latestComment: string | null;
  reviews?: ReviewEntry[];
}

export interface ReviewEntry {
  id: string;
  eventId: string;
  decision: 'approved' | 'rejected' | 'updated' | 'deferred' | 'deleted';
  editorialScore: number | null;
  comment: string | null;
  createdAt: string;
}

export interface RetrievalRun {
  id: string;
  sourceId: string;
  sourceName: string;
  outcome: 'running' | 'succeeded' | 'failed';
  message: string | null;
  eventsCount: number;
  isFixture: boolean;
  startedAt: string;
  completedAt: string | null;
}

export interface LearningStats {
  sourceKey: string;
  eventType: string;
  totalReviewed: number;
  approvedCount: number;
  approvalRate: number;
  avgEditorialScoreDiff: number; // rounded adjustment
}
