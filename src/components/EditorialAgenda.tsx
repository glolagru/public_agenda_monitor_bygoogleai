import React, { useState } from 'react';
import {
  ExternalLink,
  Calendar,
  Clock,
  MapPin,
  User,
  AlertTriangle,
  Copy,
  Check,
  Printer,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { NormalizedEvent } from '../types';
import { EventTitleDisplay } from './EventTitleDisplay';

interface EditorialAgendaProps {
  events: NormalizedEvent[];
}

export const EditorialAgenda: React.FC<EditorialAgendaProps> = ({ events }) => {
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Group events by date (excluding any deleted events)
  const activeEvents = events.filter(
    (ev) => ev.editorialState !== 'deleted' && !ev.isDeleted
  );
  const grouped = activeEvents.reduce((acc, ev) => {
    const d = ev.sourceDate || 'Ohne Datum';
    if (!acc[d]) acc[d] = [];
    acc[d].push(ev);
    return acc;
  }, {} as Record<string, NormalizedEvent[]>);

  // Sort events within each date by time ascending
  Object.values(grouped).forEach((list) => {
    (list as NormalizedEvent[]).sort((a, b) => {
      const timeA = a.sourceTime || '99:99';
      const timeB = b.sourceTime || '99:99';
      return timeA.localeCompare(timeB);
    });
  });

  const sortedDates = Object.keys(grouped).sort();

  const formatDateHeader = (dateStr: string) => {
    if (!dateStr || dateStr === 'Ohne Datum') return 'Termine ohne festes Datum';
    try {
      const [y, m, d] = dateStr.split('-');
      const date = new Date(Number(y), Number(m) - 1, Number(d));
      const weekday = date.toLocaleDateString('de-DE', { weekday: 'long' });
      const formatted = date.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
      return `${weekday}, ${formatted}`;
    } catch {
      return dateStr;
    }
  };

  const handleCopyMorningBriefing = () => {
    let text = `# Öffentliche Agenda - Morgenlage (14-Tage-Fenster)\n\n`;
    for (const d of sortedDates) {
      text += `## ${formatDateHeader(d)}\n`;
      for (const ev of grouped[d]) {
        text += `- **${ev.sourceTime ? ev.sourceTime + ' Uhr: ' : ''}${ev.title}** (${ev.sourceName})\n`;
        if (ev.topic) text += `  Thema: ${ev.topic} | Ort: ${ev.location || 'k.A.'}\n`;
        if (ev.latestComment) text += `  Redaktionshinweis: ${ev.latestComment}\n`;
        text += `  Quelle: ${ev.sourceUrl}\n\n`;
      }
    }

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Export Actions */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#D6E1E5] pb-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E8F4EC] text-[#28734F] mb-2 border border-[#C5E3CE]">
            <Calendar className="w-3.5 h-3.5" />
            <span>Offizielle Redaktionsagenda</span>
          </div>
          <h1 className="text-2xl font-bold text-[#182B33] tracking-tight">
            Agenda-Ansicht für die Redaktion
          </h1>
          <p className="text-sm text-[#5A6D75] mt-1">
            Freigegebene Ereignisse im 14-Tage-Planungsfenster. Von Information Specialists
            geprüft und kuratiert.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyMorningBriefing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-white border border-[#D6E1E5] text-[#182B33] hover:bg-[#F4F7F8] transition-colors shadow-xs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#28734F]" /> : <Copy className="w-3.5 h-3.5 text-[#5A6D75]" />}
            <span>{copied ? 'Morgenlage kopiert!' : 'Morgenlage exportieren (Markdown)'}</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-[#1F6075] text-white hover:bg-[#164C5C] transition-colors shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Drucken</span>
          </button>
        </div>
      </div>

      {/* Events timeline / grouped calendar list */}
      {events.length === 0 ? (
        <div className="p-12 text-center bg-white border border-[#D6E1E5] rounded-xl">
          <Calendar className="w-10 h-10 text-[#5A6D75] mx-auto mb-3 opacity-60" />
          <h2 className="text-base font-bold text-[#182B33]">
            Noch keine freigegebenen Termine im Planungsfenster
          </h2>
          <p className="text-xs text-[#5A6D75] max-w-md mx-auto mt-1">
            Information Specialists können in der Prüfwarteschlange Ereignisse freigeben,
            damit sie hier in der offiziellen Redaktionsagenda erscheinen.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDates.map((dateKey) => (
            <div key={dateKey} className="space-y-3">
              {/* Date divider header */}
              <div className="sticky top-0 z-10 flex items-center gap-3 bg-[#F4F7F8] py-2 px-3 rounded-lg border border-[#D6E1E5]">
                <Calendar className="w-4 h-4 text-[#1F6075]" />
                <span className="font-bold text-sm text-[#182B33]">
                  {formatDateHeader(dateKey)}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white text-[#5A6D75] border border-[#D6E1E5]">
                  {grouped[dateKey].length} {grouped[dateKey].length === 1 ? 'Termin' : 'Termine'}
                </span>
              </div>

              {/* Event Cards */}
              <div className="grid gap-3">
                {grouped[dateKey].map((event) => {
                  const isExpanded = expandedEventId === event.id;
                  const isWarning = event.notSeenInLatestRetrieval;

                  return (
                    <div
                      key={event.id}
                      className={`bg-white border rounded-xl p-4 transition-all ${
                        isWarning
                          ? 'border-[#F2D1B8] bg-[#FFFBF7]'
                          : 'border-[#D6E1E5] hover:border-[#1F6075]/60'
                      } shadow-xs`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex-1 min-w-[280px]">
                          {/* Badges bar */}
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#E8F1F3] text-[#1F6075]">
                              {event.sourceName}
                            </span>
                            {event.topic && (
                              <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#F4F7F8] text-[#5A6D75] border border-[#D6E1E5]">
                                {event.topic}
                              </span>
                            )}
                            {event.sourceTime && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[#182B33] font-semibold bg-white border border-[#D6E1E5] px-2 py-0.5 rounded">
                                <Clock className="w-3 h-3 text-[#1F6075]" />
                                {event.sourceTime} Uhr
                              </span>
                            )}
                            {event.editorialScore && (
                              <span className="text-[11px] font-bold text-[#182B33] bg-[#E8F4EC] text-[#28734F] border border-[#C5E3CE] px-2 py-0.5 rounded">
                                Relevanz: {event.editorialScore} / 5
                              </span>
                            )}
                            {isWarning && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-[#FFF0E3] text-[#A85214] border border-[#F2D1B8]">
                                <AlertTriangle className="w-3 h-3" />
                                Prüfung nötig (Im jüngsten Abruf nicht mehr gelistet)
                              </span>
                            )}
                          </div>

                          {/* Event Title */}
                          <h2 className="text-base font-bold text-[#182B33] leading-snug">
                            <EventTitleDisplay title={event.title} />
                          </h2>

                          {/* Context metadata */}
                          <div className="flex flex-wrap items-center gap-4 text-xs text-[#5A6D75] mt-2">
                            {event.location && (
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-[#1F6075]" />
                                <span>{event.location}</span>
                              </div>
                            )}
                            {event.protagonists && (
                              <div className="flex items-center gap-1">
                                <User className="w-3.5 h-3.5 text-[#1F6075]" />
                                <span>{event.protagonists}</span>
                              </div>
                            )}
                          </div>

                          {/* Editorial Specialist Note */}
                          {event.latestComment && (
                            <div className="mt-3 p-2.5 rounded-lg bg-[#F7FAFB] border border-[#D6E1E5] text-xs text-[#182B33]">
                              <span className="font-bold text-[#1F6075]">
                                Notiz der Dokumentation:{' '}
                              </span>
                              <span>{event.latestComment}</span>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <a
                            href={event.sourceUrl}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-[#1F6075] bg-[#E8F1F3] hover:bg-[#D4E6EB] transition-colors"
                          >
                            <span>Quelle öffnen</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedEventId(isExpanded ? null : event.id)
                            }
                            className="p-1.5 text-[#5A6D75] hover:text-[#182B33] rounded-lg border border-[#D6E1E5] transition-colors"
                            title={isExpanded ? 'Details verbergen' : 'Vollständigen Text anzeigen'}
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Expanded Raw Text & Provenance */}
                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-[#D6E1E5] text-xs space-y-2">
                          <div className="font-bold text-[#182B33]">
                            Originalwortlaut der Quelle (Herkunftsnachweis):
                          </div>
                          <div className="p-3 bg-[#F4F7F8] rounded-lg border border-[#D6E1E5] text-[#47606A] whitespace-pre-wrap font-mono leading-relaxed">
                            {event.originalText}
                          </div>
                          <div className="flex justify-between items-center text-[11px] text-[#7B8E96]">
                            <span>Ereignis-Schlüssel: {event.sourceEventKey}</span>
                            <span>Erstmals erfasst: {new Date(event.firstSeenAt).toLocaleString('de-DE')}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
