import React, { useState, useEffect } from 'react';
import {
  X,
  ExternalLink,
  Search,
  Globe,
  Check,
  Link as LinkIcon,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { NormalizedEvent } from '../types';
import { getEventSearchHelpers } from '../utils/sourceLinks';

interface SourceLinkEditModalProps {
  event: NormalizedEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveSourceUrl: (eventId: string, newSourceUrl: string, comment?: string) => Promise<void>;
}

export const SourceLinkEditModal: React.FC<SourceLinkEditModalProps> = ({
  event,
  isOpen,
  onClose,
  onSaveSourceUrl,
}) => {
  if (!isOpen || !event) return null;

  const [urlInput, setUrlInput] = useState(event.sourceUrl || '');
  const [commentInput, setCommentInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const searchHelpers = getEventSearchHelpers(event);

  useEffect(() => {
    setUrlInput(event.sourceUrl || '');
    setCommentInput('');
    setSaveSuccess(false);
    setErrorMessage(null);
  }, [event]);

  const handleSave = async () => {
    const trimmed = urlInput.trim();
    if (!trimmed) {
      setErrorMessage('Bitte eine gültige URL eingeben.');
      return;
    }
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      setErrorMessage('Die URL muss mit https:// oder http:// beginnen.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    try {
      await onSaveSourceUrl(event.id, trimmed, commentInput);
      setSaveSuccess(true);
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: any) {
      setErrorMessage(err.message || 'Fehler beim Speichern des Quellenlinks.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleApplyOfficialCalendar = () => {
    setUrlInput(searchHelpers.publicWebUrl);
    setCommentInput('Offizielle Terminsübersicht der Institution als Quellenlink hinterlegt.');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="source-link-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        className="bg-white rounded-2xl border border-[#D6E1E5] shadow-2xl max-w-xl w-full flex flex-col overflow-hidden text-xs text-[#182B33]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#D6E1E5] bg-[#F7FAFB]">
          <div className="flex items-center gap-2">
            <LinkIcon className="w-4 h-4 text-[#1F6075]" />
            <div>
              <h2 id="source-link-modal-title" className="font-bold text-sm text-[#182B33]">
                Öffentlichen Quellenlink eintragen / anpassen
              </h2>
              <p className="text-[11px] text-[#5A6D75]">
                Tatsächliche Web-Adresse für Nutzer und Redaktion hinterlegen
              </p>
            </div>
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

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Event Context Box */}
          <div className="p-3 bg-[#F4F7F8] border border-[#D6E1E5] rounded-xl space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-[#1F6075] text-white">
                {event.sourceName}
              </span>
              <span className="text-[#5A6D75] text-[11px] font-mono">
                {event.sourceDate} {event.sourceTime ? `• ${event.sourceTime} Uhr` : ''}
              </span>
            </div>
            <div className="font-bold text-xs text-[#182B33] line-clamp-2 mt-1">
              {event.title}
            </div>
          </div>

          {/* Search Helper Section */}
          <div className="space-y-2 p-3.5 bg-[#F7FAFB] border border-[#D6E1E5] rounded-xl">
            <div className="flex items-center gap-1.5 font-bold text-[#182B33] text-[11px]">
              <Search className="w-3.5 h-3.5 text-[#1F6075]" />
              <span>Tatsächlichen Web-Link auf der Quelle suchen:</span>
            </div>
            <p className="text-[11px] text-[#5A6D75]">
              Da Feeds teils technische Endpunkte liefern, kannst du hier mit einem Klick die offizielle Website nach dem Termin durchsuchen:
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <a
                href={searchHelpers.sourceSearchUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-[#D6E1E5] text-[#1F6075] hover:bg-[#E4ECEF] font-semibold text-xs transition-colors shadow-2xs"
              >
                <Search className="w-3 h-3" />
                <span>{searchHelpers.searchLabel} öffnen</span>
                <ExternalLink className="w-2.5 h-2.5 text-[#7B8E96]" />
              </a>
              <a
                href={searchHelpers.googleSiteSearchUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-[#D6E1E5] text-[#47606A] hover:bg-[#E4ECEF] font-semibold text-xs transition-colors shadow-2xs"
              >
                <Globe className="w-3 h-3" />
                <span>Google-Suche auf {searchHelpers.sourceDomain}</span>
                <ExternalLink className="w-2.5 h-2.5 text-[#7B8E96]" />
              </a>
              <button
                type="button"
                onClick={handleApplyOfficialCalendar}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-[#D6E1E5] text-[#5A6D75] hover:text-[#182B33] hover:bg-[#E4ECEF] text-xs transition-colors shadow-2xs"
              >
                <span>Terminübersicht übernehmen</span>
              </button>
            </div>
          </div>

          {/* URL Input Form */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="source-url-input" className="font-bold text-[#182B33]">
                Öffentlicher Quellenlink (Ziel-URL):
              </label>
              {urlInput && (
                <a
                  href={urlInput}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-1 text-[#1F6075] hover:underline font-semibold text-[11px]"
                >
                  <span>Link im Web testen</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
            <div className="relative">
              <input
                id="source-url-input"
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 bg-white border border-[#D6E1E5] rounded-xl text-xs text-[#182B33] font-mono focus:outline-none focus:border-[#1F6075]"
              />
            </div>
          </div>

          {/* Note / Comment */}
          <div className="space-y-1.5">
            <label htmlFor="source-url-comment" className="font-semibold text-[#5A6D75] text-[11px]">
              Optionale Revisionsnotiz zur Verlinkung:
            </label>
            <input
              id="source-url-comment"
              type="text"
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              placeholder="z.B. Offizieller Kalendereintrag verlinkt / Pressemeldung hinterlegt"
              className="w-full px-3 py-1.5 bg-white border border-[#D6E1E5] rounded-xl text-xs text-[#182B33] focus:outline-none focus:border-[#1F6075]"
            />
          </div>

          {/* Error / Success messages */}
          {errorMessage && (
            <div className="p-2.5 bg-[#FFF0E3] border border-[#F2D1B8] rounded-lg text-[#A85214] text-[11px] flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
          {saveSuccess && (
            <div className="p-2.5 bg-[#E8F4EC] border border-[#C5E3CE] rounded-lg text-[#28734F] text-[11px] flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 shrink-0" />
              <span>Quellenlink erfolgreich gespeichert!</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-3 border-t border-[#D6E1E5] bg-[#F7FAFB]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-[#D6E1E5] bg-white text-[#5A6D75] hover:text-[#182B33] font-semibold text-xs transition-colors"
          >
            Abbrechen
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || saveSuccess}
            className="px-4 py-2 rounded-lg bg-[#1F6075] text-white font-bold text-xs hover:bg-[#164C5C] disabled:opacity-50 transition-colors flex items-center gap-1.5 shadow-xs"
          >
            {isSaving ? (
              <span>Wird gespeichert...</span>
            ) : saveSuccess ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Gespeichert</span>
              </>
            ) : (
              <span>Quellenlink speichern</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
