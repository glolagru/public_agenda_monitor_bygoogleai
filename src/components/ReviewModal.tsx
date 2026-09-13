import React, { useState, useEffect } from 'react';
import {
  X,
  ExternalLink,
  Check,
  AlertOctagon,
  Sparkles,
  Clock,
  History,
  Send,
  MessageSquare,
  AlertTriangle,
  Search,
  Globe,
  Link as LinkIcon,
} from 'lucide-react';
import { NormalizedEvent, ReviewEntry } from '../types';
import { getEventSearchHelpers } from '../utils/sourceLinks';

interface ReviewModalProps {
  event: NormalizedEvent | null;
  onClose: () => void;
  onSubmitReview: (
    eventId: string,
    decision: 'approved' | 'rejected' | 'updated' | 'deferred',
    editorialScore: number,
    comment: string,
    sourceUrl?: string
  ) => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  event,
  onClose,
  onSubmitReview,
}) => {
  if (!event) return null;

  const [selectedScore, setSelectedScore] = useState<number>(
    event.editorialScore ?? event.suggestedScore
  );
  const [comment, setComment] = useState<string>(event.latestComment || '');
  const [sourceUrlInput, setSourceUrlInput] = useState<string>(event.sourceUrl || '');
  const [reviewsHistory, setReviewsHistory] = useState<ReviewEntry[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const searchHelpers = getEventSearchHelpers(event);

  useEffect(() => {
    setSelectedScore(event.editorialScore ?? event.suggestedScore);
    setComment(event.latestComment || '');
    setSourceUrlInput(event.sourceUrl || '');

    // Fetch review history
    setIsLoadingHistory(true);
    fetch(`/api/events/${event.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.event?.reviews) {
          setReviewsHistory(data.event.reviews);
        }
      })
      .catch((err) => console.error('Error fetching reviews:', err))
      .finally(() => setIsLoadingHistory(false));
  }, [event]);

  const handleAction = (decision: 'approved' | 'rejected' | 'updated') => {
    onSubmitReview(event.id, decision, selectedScore, comment, sourceUrlInput);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        className="bg-white rounded-2xl border border-[#D6E1E5] shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden text-xs text-[#182B33]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#D6E1E5] bg-[#F7FAFB]">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full font-bold text-[11px] bg-[#1F6075] text-white">
              {event.sourceName}
            </span>
            <span className="text-[#5A6D75] font-mono text-[11px]">
              {event.sourceDate} {event.sourceTime ? `• ${event.sourceTime} Uhr` : ''}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Dialog schließen"
            className="p-1 rounded-md text-[#5A6D75] hover:text-[#182B33] hover:bg-[#E4ECEF] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Warning badge if absent in last retrieval */}
          {event.notSeenInLatestRetrieval && (
            <div className="flex items-center gap-2 p-3 bg-[#FFF0E3] border border-[#F2D1B8] rounded-xl text-[#A85214]">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <div>
                <span className="font-bold">Prüfung nötig:</span> Dieses Ereignis taucht im
                jüngsten Quellabruf nicht mehr auf. Bitte prüfen, ob der Termin verschoben oder
                abgesagt wurde.
              </div>
            </div>
          )}

          {/* Title & Metadata */}
          <div>
            <h2 id="review-modal-title" className="text-lg font-bold text-[#182B33] leading-snug">
              {event.title}
            </h2>
            <div className="flex flex-wrap items-center gap-3 text-[#5A6D75] mt-2">
              {event.topic && <span>Überthema: <strong className="text-[#182B33]">{event.topic}</strong></span>}
              {event.location && <span>Ort: <strong className="text-[#182B33]">{event.location}</strong></span>}
              {event.protagonists && <span>Beteiligte: <strong className="text-[#182B33]">{event.protagonists}</strong></span>}
            </div>
          </div>

          {/* Public Web Source Link & Search Helpers */}
          <div className="p-3.5 bg-[#F7FAFB] border border-[#D6E1E5] rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#182B33] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5 text-[#1F6075]" />
                <span>Öffentlicher Quellenlink (Tatsächliche Web-Adresse)</span>
              </span>
              {sourceUrlInput && (
                <a
                  href={sourceUrlInput}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-1 text-[#1F6075] hover:underline font-semibold text-[11px]"
                >
                  <span>Link im Web testen</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="url"
                value={sourceUrlInput}
                onChange={(e) => setSourceUrlInput(e.target.value)}
                placeholder="https://..."
                className="flex-1 px-3 py-1.5 bg-white border border-[#D6E1E5] rounded-lg text-xs font-mono text-[#182B33] focus:outline-none focus:border-[#1F6075]"
              />
            </div>

            {/* Smart Search Links */}
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              <span className="text-[11px] text-[#5A6D75]">Web-Adresse suchen:</span>
              <a
                href={searchHelpers.sourceSearchUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white border border-[#D6E1E5] text-[#1F6075] hover:bg-[#E4ECEF] font-semibold text-[11px] transition-colors shadow-2xs"
              >
                <Search className="w-2.5 h-2.5" />
                <span>{searchHelpers.searchLabel}</span>
                <ExternalLink className="w-2.5 h-2.5 text-[#7B8E96]" />
              </a>
              <a
                href={searchHelpers.googleSiteSearchUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white border border-[#D6E1E5] text-[#47606A] hover:bg-[#E4ECEF] font-semibold text-[11px] transition-colors shadow-2xs"
              >
                <Globe className="w-2.5 h-2.5" />
                <span>Google {searchHelpers.sourceDomain}</span>
                <ExternalLink className="w-2.5 h-2.5 text-[#7B8E96]" />
              </a>
              <button
                type="button"
                onClick={() => setSourceUrlInput(searchHelpers.publicWebUrl)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white border border-[#D6E1E5] text-[#5A6D75] hover:text-[#182B33] hover:bg-[#E4ECEF] text-[11px] transition-colors shadow-2xs"
              >
                <span>Terminübersicht übernehmen</span>
              </button>
            </div>
          </div>

          {/* Original Text Provenance */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#5A6D75] uppercase tracking-wider text-[11px]">
                Originaltext der Quelle (Herkunftsnachweis)
              </span>
              <a
                href={event.sourceUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1 text-[#1F6075] hover:underline font-semibold"
              >
                <span>Primärquelle öffnen</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="p-3 bg-[#F4F7F8] border border-[#D6E1E5] rounded-xl text-[#47606A] font-mono leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto">
              {event.originalText}
            </div>
          </div>

          {/* Transparent Learning Loop & Relevance Score Selection */}
          <div className="p-4 bg-[#F7FAFB] border border-[#D6E1E5] rounded-xl space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-1.5 font-bold text-[#182B33]">
                  <Sparkles className="w-4 h-4 text-[#1F6075]" />
                  <span>Transparente Relevanzbewertung & Lernschleife</span>
                </div>
                <div className="text-[#5A6D75] text-[11px] mt-0.5">
                  {event.suggestedScoreRule}
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-[#5A6D75]">Vorschlag:</span>
                <div className="font-bold text-sm text-[#1F6075]">
                  Stufe {event.suggestedScore}
                </div>
              </div>
            </div>

            {/* Score adjustment feedback */}
            {event.suggestedScoreAdjustment !== 0 && (
              <div className="p-2.5 bg-white border border-[#D6E1E5] rounded-lg text-[11px] text-[#182B33] flex items-center justify-between">
                <span>
                  Lernschleifen-Korrektur:{' '}
                  <strong>
                    {event.suggestedScoreAdjustment > 0 ? '+' : ''}
                    {event.suggestedScoreAdjustment} Stufen
                  </strong>{' '}
                  aus früheren redaktionellen Prüfungen dieser Kategorie.
                </span>
                <span className="text-[#28734F] font-bold">
                  {event.groupApprovalRate}% Freigabequote
                </span>
              </div>
            )}

            {/* 1-5 Score selector buttons */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block font-semibold text-[#182B33]">
                  Redaktionelle Relevanz festlegen:
                </label>
                <span className="text-[11px] text-[#5A6D75]">
                  (1 = Höchste, 5 = Niedrigste)
                </span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((score) => (
                  <button
                    key={score}
                    type="button"
                    onClick={() => setSelectedScore(score)}
                    className={`py-2 px-1 text-center rounded-lg border font-bold transition-all ${
                      selectedScore === score
                        ? 'bg-[#1F6075] text-white border-[#1F6075] shadow-xs scale-102'
                        : 'bg-white text-[#5A6D75] border-[#D6E1E5] hover:border-[#1F6075]'
                    }`}
                  >
                    <div className="text-sm">Stufe {score}</div>
                    <div className="text-[10px] font-normal truncate">
                      {score === 1
                        ? 'Höchste'
                        : score === 2
                        ? 'Hoch'
                        : score === 3
                        ? 'Mittel'
                        : score === 4
                        ? 'Niedrig'
                        : 'Gering'}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Comment / Editorial Pitch Note */}
          <div className="space-y-1.5">
            <label className="block font-semibold text-[#182B33]">
              Redaktionsnotiz / Relevanzbegründung (für Morgenlage):
            </label>
            <textarea
              rows={3}
              placeholder="z.B. Für Hintergrundbericht vorsehen; Thema mit Ressort Wirtschaft abstimmen..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full p-3 bg-white border border-[#D6E1E5] rounded-xl text-xs text-[#182B33] placeholder-[#7B8E96] focus:outline-none focus:border-[#1F6075]"
            />
          </div>

          {/* Append-only Review History Timeline */}
          {reviewsHistory.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-[#D6E1E5]">
              <div className="flex items-center gap-1.5 font-bold text-[#5A6D75] text-[11px] uppercase tracking-wider">
                <History className="w-3.5 h-3.5" />
                <span>Revisions- und Prüfhistorie (Chronologisch)</span>
              </div>
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {reviewsHistory.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-2.5 bg-[#F4F7F8] border border-[#D6E1E5] rounded-lg text-[11px] text-[#47606A]"
                  >
                    <div className="flex items-center justify-between font-semibold text-[#182B33]">
                      <span>Entscheidung: {rev.decision === 'approved' ? '✅ Freigegeben' : rev.decision === 'rejected' ? '❌ Abgelehnt' : '📝 Aktualisiert'}</span>
                      <span className="font-mono text-[10px] text-[#7B8E96]">
                        {new Date(rev.createdAt).toLocaleString('de-DE')}
                      </span>
                    </div>
                    {rev.editorialScore && (
                      <div className="mt-0.5 text-[#1F6075] font-semibold">
                        Relevanz: Stufe {rev.editorialScore}
                      </div>
                    )}
                    {rev.comment && (
                      <div className="mt-1 italic text-[#182B33]">
                        "{rev.comment}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 bg-[#F7FAFB] border-t border-[#D6E1E5] flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => handleAction('rejected')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg font-semibold text-[#9A2B2B] hover:bg-[#F9EBEB] border border-[#F0CECE] transition-colors"
          >
            <AlertOctagon className="w-4 h-4" />
            <span>Ablehnen / Verwerfen</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleAction('updated')}
              className="px-4 py-2 rounded-lg font-semibold text-[#182B33] hover:bg-[#E4ECEF] border border-[#D6E1E5] transition-colors"
            >
              Nur Notiz speichern
            </button>
            <button
              type="button"
              onClick={() => handleAction('approved')}
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg font-bold bg-[#1F6075] hover:bg-[#164C5C] text-white shadow-xs transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>Für Redaktion freigeben</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
