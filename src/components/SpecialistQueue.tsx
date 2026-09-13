import React, { useState, useRef, useEffect } from 'react';
import {
  ExternalLink,
  Check,
  X,
  Search,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Filter,
  Sparkles,
  AlertTriangle,
  MessageSquare,
  ChevronDown,
  Link as LinkIcon,
} from 'lucide-react';
import { NormalizedEvent, SourceKey } from '../types';
import { SourceLinkEditModal } from './SourceLinkEditModal';
import { EventTitleDisplay } from './EventTitleDisplay';

interface SpecialistQueueProps {
  events: NormalizedEvent[];
  onApprove: (event: NormalizedEvent) => void;
  onReject: (event: NormalizedEvent) => void;
  onOpenReviewModal: (event: NormalizedEvent) => void;
  onReorder: (orderedIds: string[]) => void;
  onUpdateSourceUrl?: (eventId: string, newUrl: string, comment?: string) => Promise<void>;
}

export type SortField = 'status' | 'date' | 'relevance' | 'source' | 'manual';
export type SortDirection = 'asc' | 'desc';

export const SpecialistQueue: React.FC<SpecialistQueueProps> = ({
  events,
  onApprove,
  onReject,
  onOpenReviewModal,
  onReorder,
  onUpdateSourceUrl,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'candidate' | 'approved' | 'rejected'>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [selectedRelevances, setSelectedRelevances] = useState<number[]>([1, 2, 3, 4, 5]);
  const [isRelevanceDropdownOpen, setIsRelevanceDropdownOpen] = useState(false);
  const relevanceDropdownRef = useRef<HTMLDivElement>(null);
  const [selectedForLinkEdit, setSelectedForLinkEdit] = useState<NormalizedEvent | null>(null);

  // Close relevance dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        relevanceDropdownRef.current &&
        !relevanceDropdownRef.current.contains(e.target as Node)
      ) {
        setIsRelevanceDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleRelevance = (score: number) => {
    setSelectedRelevances((prev) =>
      prev.includes(score) ? prev.filter((s) => s !== score) : [...prev, score]
    );
  };

  const selectAllRelevances = () => setSelectedRelevances([1, 2, 3, 4, 5]);
  const clearAllRelevances = () => setSelectedRelevances([]);

  // Default sorting: First status, then date, then time
  const [sortField, setSortField] = useState<SortField>('status');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Filter logic
  const filteredEvents = events.filter((ev) => {
    if (statusFilter === 'new' && !ev.isNew) return false;
    if (statusFilter === 'candidate' && ev.editorialState !== 'candidate') return false;
    if (statusFilter === 'approved' && ev.editorialState !== 'approved') return false;
    if (statusFilter === 'rejected' && ev.editorialState !== 'rejected') return false;

    if (sourceFilter !== 'all' && ev.sourceKey !== sourceFilter) return false;

    const score = Math.min(5, Math.max(1, Math.round(ev.editorialScore ?? ev.suggestedScore ?? 3)));
    if (!selectedRelevances.includes(score)) return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const match =
        ev.title.toLowerCase().includes(q) ||
        (ev.topic && ev.topic.toLowerCase().includes(q)) ||
        (ev.location && ev.location.toLowerCase().includes(q)) ||
        (ev.organizer && ev.organizer.toLowerCase().includes(q)) ||
        ev.originalText.toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  });

  // Prioritization score for status sorting
  const getStatusPriority = (event: NormalizedEvent): number => {
    // 1. Prüfung nötig (im Feed nicht mehr vorhanden)
    // 2. Neu (frisch importiert, noch ungesichtet)
    // 3. Offen / Vorgeschlagen (Kandidat)
    // 4. Freigegeben
    // 5. Abgelehnt
    if (event.editorialState === 'approved') return 4;
    if (event.editorialState === 'rejected') return 5;
    if (event.notSeenInLatestRetrieval) return 1;
    if (event.isNew) return 2;
    return 3;
  };

  // Helper for secondary date & time comparison
  const compareDateTime = (a: NormalizedEvent, b: NormalizedEvent, dateAsc: boolean = true): number => {
    const dateA = a.sourceDate || '9999-99-99';
    const dateB = b.sourceDate || '9999-99-99';
    const dateComp = dateA.localeCompare(dateB);
    if (dateComp !== 0) {
      return dateAsc ? dateComp : -dateComp;
    }
    const timeA = a.sourceTime || '99:99';
    const timeB = b.sourceTime || '99:99';
    return dateAsc ? timeA.localeCompare(timeB) : -timeA.localeCompare(timeB);
  };

  // Sort logic with mandatory secondary date/time tie-breaking
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    if (sortField === 'manual') {
      return 0; // Use current array order
    }

    if (sortField === 'status') {
      const pA = getStatusPriority(a);
      const pB = getStatusPriority(b);
      if (pA !== pB) {
        return sortDirection === 'asc' ? pA - pB : pB - pA;
      }
      // Nachrangig: immer Datum, dann Zeit
      return compareDateTime(a, b, true);
    }

    if (sortField === 'relevance') {
      const scoreA = a.editorialScore ?? a.systemRelevanceScore ?? 0;
      const scoreB = b.editorialScore ?? b.systemRelevanceScore ?? 0;
      if (scoreA !== scoreB) {
        return sortDirection === 'desc' ? scoreB - scoreA : scoreA - scoreB;
      }
      // Nachrangig: immer Datum, dann Zeit
      return compareDateTime(a, b, true);
    }

    if (sortField === 'source') {
      const sA = a.sourceKey.toLowerCase();
      const sB = b.sourceKey.toLowerCase();
      const comp = sA.localeCompare(sB);
      if (comp !== 0) {
        return sortDirection === 'asc' ? comp : -comp;
      }
      // Nachrangig: immer Datum, dann Zeit
      return compareDateTime(a, b, true);
    }

    if (sortField === 'date') {
      // Primär Datum (aufst./abst.), im nächsten Schritt Uhrzeit
      return compareDateTime(a, b, sortDirection === 'asc');
    }

    return 0;
  });

  const handleSortClick = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      if (field === 'relevance') {
        setSortDirection('desc'); // High relevance first
      } else {
        setSortDirection('asc');
      }
    }
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sortedEvents.length) return;

    const newOrder = [...sortedEvents];
    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIndex];
    newOrder[targetIndex] = temp;

    // Moving items switches to manual mode to preserve exact user rank
    setSortField('manual');
    onReorder(newOrder.map((e) => e.id));
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    try {
      const [year, month, day] = dateStr.split('-');
      if (!day || !month) return dateStr;
      const months = [
        'Jan.',
        'Feb.',
        'März',
        'Apr.',
        'Mai',
        'Juni',
        'Juli',
        'Aug.',
        'Sept.',
        'Okt.',
        'Nov.',
        'Dez.',
      ];
      return `${parseInt(day, 10)}. ${months[parseInt(month, 10) - 1]}`;
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = (event: NormalizedEvent) => {
    // 1. Redaktioneller Status hat oberste Priorität
    if (event.editorialState === 'approved') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-[#E8F4EC] text-[#28734F] border border-[#C5E3CE]">
          <Check className="w-3 h-3" />
          Freigegeben
        </span>
      );
    }
    if (event.editorialState === 'rejected') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-[#F9EBEB] text-[#9A2B2B] border border-[#F0CECE]">
          <X className="w-3 h-3" />
          Abgelehnt
        </span>
      );
    }

    // 2. Feed-Diskrepanz: Im letzten Abruf nicht mehr in der Quelle enthalten
    if (event.notSeenInLatestRetrieval) {
      return (
        <span
          title="Dieses Ereignis war beim letzten Abruf in der Originalquelle nicht mehr auffindbar (z. B. verschoben oder entfallen). Redaktionelle Prüfung nötig."
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-[#FFF0E3] text-[#A85214] border border-[#F2D1B8]"
        >
          <AlertTriangle className="w-3 h-3" />
          Prüfung nötig
        </span>
      );
    }

    // 3. Neu importiertes Ereignis vor erster Sichtung
    if (event.isNew) {
      return (
        <span
          title="Neu importierter Termin, der bisher noch nicht durch die Fachredaktion geprüft wurde."
          className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-[#E8F1F3] text-[#1F6075] border border-[#C8DCE2]"
        >
          Neu
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[#F0F4F6] text-[#47606A]">
        Vorgeschlagen
      </span>
    );
  };

  const formatEventType = (type: string) => {
    switch (type) {
      case 'hearing':
        return 'Verhandlung';
      case 'judgment':
        return 'Urteil';
      case 'appointment':
        return 'Kalendertermin';
      case 'panel':
        return 'Konferenz / Panel';
      case 'report':
        return 'Publikation / Report';
      case 'outlook':
        return 'Wochenausblick';
      default:
        return type;
    }
  };

  return (
    <div className="space-y-4">
      {/* Title & Context Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#182B33] tracking-tight">
            Prüfwarteschlange für Information Specialists
          </h1>
          <p className="text-xs sm:text-sm text-[#5A6D75] mt-1">
            Öffentliche Ereignisse sichten, Relevanz bewerten, priorisieren und für die
            Redaktionsagenda freigeben.
          </p>
        </div>
        <div className="text-right text-xs text-[#5A6D75] bg-[#F4F7F8] px-3 py-1.5 rounded-md border border-[#D6E1E5]">
          <div className="font-semibold text-[#182B33]">
            {sortedEvents.length} von {events.length} Ereignissen
          </div>
          <div className="text-[11px] font-medium text-[#1F6075]">
            {sortField === 'status' && 'Sortiert: Status → Datum → Uhrzeit'}
            {sortField === 'date' && `Sortiert: Datum (${sortDirection === 'asc' ? 'aufst.' : 'abst.'}) → Uhrzeit`}
            {sortField === 'relevance' && `Sortiert: Relevanz (${sortDirection === 'desc' ? 'höchste zuerst' : 'niedrigste zuerst'}) → Datum → Uhrzeit`}
            {sortField === 'source' && `Sortiert: Quelle (${sortDirection === 'asc' ? 'A-Z' : 'Z-A'}) → Datum → Uhrzeit`}
            {sortField === 'manual' && 'Manuelle Reihung aktiv'}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[#F4F7F8] border border-[#D6E1E5] rounded-xl text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick status filters */}
          <div className="flex items-center bg-white border border-[#D6E1E5] rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                statusFilter === 'all'
                  ? 'bg-[#1F6075] text-white font-semibold'
                  : 'text-[#5A6D75] hover:text-[#182B33]'
              }`}
            >
              Alle ({events.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('new')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                statusFilter === 'new'
                  ? 'bg-[#A85214] text-white font-semibold'
                  : 'text-[#5A6D75] hover:text-[#182B33]'
              }`}
            >
              Nur Neu ({events.filter((e) => e.isNew).length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('candidate')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                statusFilter === 'candidate'
                  ? 'bg-[#1F6075] text-white font-semibold'
                  : 'text-[#5A6D75] hover:text-[#182B33]'
              }`}
            >
              Offen ({events.filter((e) => e.editorialState === 'candidate').length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('approved')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                statusFilter === 'approved'
                  ? 'bg-[#28734F] text-white font-semibold'
                  : 'text-[#5A6D75] hover:text-[#182B33]'
              }`}
            >
              Freigegeben ({events.filter((e) => e.editorialState === 'approved').length})
            </button>
          </div>

          {/* Source dropdown */}
          <div className="flex items-center gap-1.5 bg-white border border-[#D6E1E5] px-2.5 py-1 rounded-lg">
            <Filter className="w-3.5 h-3.5 text-[#5A6D75]" />
            <select
              aria-label="Quelle filtern"
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="bg-transparent text-xs text-[#182B33] focus:outline-none cursor-pointer"
            >
              <option value="all">Alle Quellen</option>
              <option value="bverwg">Bundesverwaltungsgericht</option>
              <option value="bundespraesident">Bundespräsident</option>
              <option value="un_women_news">UN Women News</option>
              <option value="un_women_publications">UN Women Publikationen</option>
              <option value="bverfg">Bundesverfassungsgericht</option>
            </select>
          </div>

          {/* Relevance multi-select dropdown */}
          <div className="relative" ref={relevanceDropdownRef}>
            <button
              type="button"
              onClick={() => setIsRelevanceDropdownOpen((prev) => !prev)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors ${
                selectedRelevances.length < 5
                  ? 'bg-[#1F6075] text-white border-[#1F6075]'
                  : 'bg-white text-[#182B33] border-[#D6E1E5] hover:border-[#1F6075]'
              }`}
              title="Relevanzstufen filtern oder abwählen"
            >
              <Sparkles className={`w-3.5 h-3.5 ${selectedRelevances.length < 5 ? 'text-white' : 'text-[#5A6D75]'}`} />
              <span>
                {selectedRelevances.length === 5
                  ? 'Alle Relevanzen (1–5)'
                  : selectedRelevances.length === 0
                  ? 'Keine Relevanz'
                  : `Relevanz: ${[...selectedRelevances].sort((a, b) => b - a).join(', ')}`}
              </span>
              <ChevronDown
                className={`w-3 h-3 transition-transform ${isRelevanceDropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {isRelevanceDropdownOpen && (
              <div className="absolute left-0 mt-1.5 w-56 bg-white border border-[#D6E1E5] rounded-xl shadow-lg p-2.5 z-40 text-xs animate-in fade-in-50 duration-150">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#E8EFF1]">
                  <span className="font-bold text-[#182B33]">Relevanzen</span>
                  <div className="flex items-center gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={selectAllRelevances}
                      className="text-[#1F6075] hover:underline font-semibold"
                    >
                      Alle
                    </button>
                    <span className="text-[#A3B3BA]">|</span>
                    <button
                      type="button"
                      onClick={clearAllRelevances}
                      className="text-[#5A6D75] hover:text-[#9A2B2B] hover:underline"
                    >
                      Keine
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  {[5, 4, 3, 2, 1].map((score) => {
                    const isChecked = selectedRelevances.includes(score);
                    const count = events.filter((e) => {
                      const s = Math.min(5, Math.max(1, Math.round(e.editorialScore ?? e.suggestedScore ?? 3)));
                      return s === score;
                    }).length;
                    return (
                      <label
                        key={score}
                        className="flex items-center justify-between px-2 py-1 rounded-md hover:bg-[#F4F7F8] cursor-pointer select-none text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleRelevance(score)}
                            className="rounded border-[#D6E1E5] text-[#1F6075] focus:ring-0 cursor-pointer w-3.5 h-3.5"
                          />
                          <span className={`font-semibold ${isChecked ? 'text-[#182B33]' : 'text-[#7B8E96]'}`}>
                            Stufe {score}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <span className="text-[#5A6D75]">
                            {score === 5 && 'Sehr hoch'}
                            {score === 4 && 'Hoch'}
                            {score === 3 && 'Mittel'}
                            {score === 2 && 'Niedrig'}
                            {score === 1 && 'Gering'}
                          </span>
                          <span className="text-[10px] text-[#7B8E96] font-mono">({count})</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Search input */}
        <div className="relative min-w-[200px] flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 text-[#5A6D75] absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Titel, Aktenzeichen, Thema suchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-[#D6E1E5] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#182B33] placeholder-[#7B8E96] focus:outline-none focus:border-[#1F6075]"
          />
        </div>
      </div>

      {/* Horizontal Semantic Table according to DESIGN.md */}
      <div className="overflow-x-auto rounded-xl border border-[#D6E1E5] bg-white shadow-sm w-full">
        <table className="w-full border-separate border-spacing-y-2 p-3 text-left">
          <thead>
            <tr className="text-[11px] font-bold text-[#5A6D75] uppercase tracking-wider select-none">
              <th
                onClick={() => handleSortClick('date')}
                className={`px-3 py-1.5 w-32 cursor-pointer hover:text-[#182B33] transition-colors ${
                  sortField === 'date' ? 'text-[#1F6075] font-bold' : ''
                }`}
                title="Nach Datum und Uhrzeit sortieren"
              >
                <div className="flex items-center gap-1">
                  <span>Datum & Zeit</span>
                  {sortField === 'date' ? (
                    sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-[#1F6075]" /> : <ArrowDown className="w-3 h-3 text-[#1F6075]" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 opacity-30" />
                  )}
                </div>
              </th>

              <th className="px-3 py-1.5 min-w-[240px]">Ereignistitel & Details</th>
              <th className="px-3 py-1.5 w-32">Überthema</th>
              <th className="px-3 py-1.5 w-28">Ereignistyp</th>

              <th
                onClick={() => handleSortClick('source')}
                className={`px-3 py-1.5 w-36 cursor-pointer hover:text-[#182B33] transition-colors ${
                  sortField === 'source' ? 'text-[#1F6075] font-bold' : ''
                }`}
                title="Nach Quelle sortieren"
              >
                <div className="flex items-center gap-1">
                  <span>Quelle</span>
                  {sortField === 'source' ? (
                    sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-[#1F6075]" /> : <ArrowDown className="w-3 h-3 text-[#1F6075]" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 opacity-30" />
                  )}
                </div>
              </th>

              <th className="px-3 py-1.5 w-28">Quellenlink</th>

              <th
                onClick={() => handleSortClick('relevance')}
                className={`px-3 py-1.5 w-24 cursor-pointer hover:text-[#182B33] transition-colors ${
                  sortField === 'relevance' ? 'text-[#1F6075] font-bold' : ''
                }`}
                title="Nach Relevanz sortieren"
              >
                <div className="flex items-center gap-1">
                  <span>Relevanz</span>
                  {sortField === 'relevance' ? (
                    sortDirection === 'desc' ? <ArrowDown className="w-3 h-3 text-[#1F6075]" /> : <ArrowUp className="w-3 h-3 text-[#1F6075]" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 opacity-30" />
                  )}
                </div>
              </th>

              <th
                onClick={() => handleSortClick('status')}
                className={`px-3 py-1.5 w-28 cursor-pointer hover:text-[#182B33] transition-colors ${
                  sortField === 'status' ? 'text-[#1F6075] font-bold' : ''
                }`}
                title="Nach Status sortieren"
              >
                <div className="flex items-center gap-1">
                  <span>Status</span>
                  {sortField === 'status' ? (
                    sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-[#1F6075]" /> : <ArrowDown className="w-3 h-3 text-[#1F6075]" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 opacity-30" />
                  )}
                </div>
              </th>

              <th className="px-3 py-1.5 w-36 text-right">Freigabe / Aktion</th>
            </tr>
          </thead>
          <tbody>
            {sortedEvents.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-xs text-[#5A6D75]">
                  Keine Ereignisse für die gewählten Filterkriterien gefunden.
                </td>
              </tr>
            ) : (
              sortedEvents.map((event, index) => {
                const isOrangeNew = event.isNew;
                const isWarning = event.notSeenInLatestRetrieval;

                // Styling row classes according to DESIGN.md
                // Blue (#DCECF0) for existing candidate, subtle orange (#FFF0E3) for new
                const rowBg = isOrangeNew
                  ? 'bg-[#FFF0E3] hover:bg-[#FFE8D6]'
                  : isWarning
                  ? 'bg-[#FFF6ED] hover:bg-[#FFEDDC]'
                  : 'bg-[#DCECF0] hover:bg-[#CEE3E8]';

                return (
                  <tr
                    key={event.id}
                    id={`event-row-${event.id}`}
                    className={`transition-colors group text-xs text-[#182B33]`}
                  >
                    {/* Date & Time */}
                    <td className={`px-3 py-2.5 rounded-l-lg align-top ${rowBg}`}>
                      <div className="font-semibold text-[#182B33] text-xs whitespace-nowrap">
                        {formatDate(event.sourceDate)}
                      </div>
                      <div className="text-[11px] font-mono text-[#5A6D75] mt-0.5 whitespace-nowrap">
                        {event.sourceTime ? `${event.sourceTime} Uhr` : '—'}
                      </div>
                    </td>

                    {/* Title & Details */}
                    <td className={`px-3 py-2.5 align-top ${rowBg}`}>
                      <div className="font-bold text-[#182B33] text-[13px] leading-snug">
                        <EventTitleDisplay title={event.title} />
                      </div>
                      <div className="text-[11px] text-[#47606A] mt-0.5 line-clamp-2">
                        {event.location && (
                          <span className="font-medium mr-2">📍 {event.location}</span>
                        )}
                        {event.protagonists && (
                          <span className="mr-2">👤 {event.protagonists}</span>
                        )}
                        {event.fixture && (
                          <span className="inline-block px-1 rounded bg-[#E4ECEF] text-[#47606A] font-semibold text-[10px]">
                            Demo-Fixture
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Overarching Topic */}
                    <td className={`px-3 py-2.5 align-top text-[#47606A] font-medium ${rowBg}`}>
                      {event.topic || '—'}
                    </td>

                    {/* Event Type */}
                    <td className={`px-3 py-2.5 align-top ${rowBg}`}>
                      <span className="px-2 py-0.5 rounded bg-white/70 border border-[#D6E1E5]/60 text-[11px] font-medium text-[#182B33]">
                        {formatEventType(event.eventType)}
                      </span>
                    </td>

                    {/* Source Name */}
                    <td className={`px-3 py-2.5 align-top font-medium text-[#182B33] ${rowBg}`}>
                      {event.sourceName}
                    </td>

                    {/* Source Link */}
                    <td className={`px-3 py-2.5 align-top ${rowBg}`}>
                      <div className="flex flex-col gap-1 items-start">
                        <a
                          href={event.sourceUrl}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="inline-flex items-center gap-1 text-[#18566A] hover:text-[#113E4D] font-bold text-xs hover:underline whitespace-nowrap"
                          title={`Öffentliche Web-Adresse aufrufen: ${event.sourceUrl}`}
                        >
                          <span>Web-Link</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                        {onUpdateSourceUrl && (
                          <button
                            type="button"
                            onClick={() => setSelectedForLinkEdit(event)}
                            className="inline-flex items-center gap-1 text-[11px] text-[#5A6D75] hover:text-[#1F6075] hover:underline transition-colors"
                            title="Tatsächlichen Web-Link suchen oder anpassen"
                          >
                            <Search className="w-2.5 h-2.5 text-[#1F6075]" />
                            <span>Link prüfen</span>
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Relevance & Learning Loop */}
                    <td className={`px-3 py-2.5 align-top ${rowBg}`}>
                      <div className="flex items-center gap-1.5 font-bold">
                        <span className="text-[13px] text-[#182B33]">
                          {event.editorialScore ?? event.suggestedScore} / 5
                        </span>
                        {event.suggestedScoreAdjustment !== 0 && (
                          <span
                            title={`Lernschleife: ${event.suggestedScoreAdjustment > 0 ? '+' : ''}${
                              event.suggestedScoreAdjustment
                            } basierend auf früheren Prüfungen (${event.groupApprovalRate}% Freigabequote)`}
                            className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded text-[10px] font-semibold bg-[#1F6075] text-white"
                          >
                            <Sparkles className="w-2.5 h-2.5" />
                            {event.suggestedScoreAdjustment > 0 ? '+' : ''}
                            {event.suggestedScoreAdjustment}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-[#5A6D75] truncate max-w-[90px]" title={event.suggestedScoreRule}>
                        {event.editorialScore !== null ? 'Redaktionell bewertet' : 'Vorschlag'}
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className={`px-3 py-2.5 align-top ${rowBg}`}>
                      {getStatusBadge(event)}
                    </td>

                    {/* Release / Review Action buttons */}
                    <td
                      className={`px-3 py-2.5 rounded-r-lg align-middle text-right whitespace-nowrap ${rowBg}`}
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        {event.editorialState !== 'approved' ? (
                          <button
                            type="button"
                            onClick={() => onApprove(event)}
                            className="bg-[#1F6075] hover:bg-[#164C5C] text-white text-[11px] font-bold px-2.5 py-1 rounded-md transition-colors shadow-xs"
                          >
                            Freigeben
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onReject(event)}
                            className="border border-[#9A2B2B] text-[#9A2B2B] hover:bg-[#F9EBEB] text-[11px] font-semibold px-2 py-1 rounded-md transition-colors"
                          >
                            Entziehen
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => onOpenReviewModal(event)}
                          title="Prüfen, bewerten und kommentieren"
                          className="bg-white/80 hover:bg-white text-[#1F6075] border border-[#D6E1E5] p-1.5 rounded-md transition-colors"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="text-xs text-[#5A6D75] flex items-center justify-between px-1">
        <div>
          <span className="font-semibold text-[#182B33]">Hinweis:</span> Farben kennzeichnen
          Zustände unterstützend zur Textbeschriftung (Orange = Neu hinzugefügt, Blau = Bereits
          vorhanden).
        </div>
        <div className="italic">
          Prüfentscheidungen fließen transparent in künftige Relevanzvorschläge ein.
        </div>
      </div>

      {selectedForLinkEdit && onUpdateSourceUrl && (
        <SourceLinkEditModal
          event={selectedForLinkEdit}
          isOpen={!!selectedForLinkEdit}
          onClose={() => setSelectedForLinkEdit(null)}
          onSaveSourceUrl={onUpdateSourceUrl}
        />
      )}
    </div>
  );
};
