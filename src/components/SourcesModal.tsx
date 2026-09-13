import React, { useState, useEffect } from 'react';
import {
  X,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Database,
  RotateCcw,
  Activity,
} from 'lucide-react';
import { RetrievalRun, SourceDefinition, SourceKey } from '../types';

interface SourcesModalProps {
  isOpen: boolean;
  onClose: () => void;
  sources: SourceDefinition[];
  onTriggerRetrieval: (sourceKey?: SourceKey, forceFixture?: boolean) => Promise<void>;
  onResetDemo: () => Promise<void>;
}

export const SourcesModal: React.FC<SourcesModalProps> = ({
  isOpen,
  onClose,
  sources,
  onTriggerRetrieval,
  onResetDemo,
}) => {
  const [runs, setRuns] = useState<RetrievalRun[]>([]);
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/runs')
        .then((res) => res.json())
        .then((data) => {
          if (data?.runs) setRuns(data.runs);
        })
        .catch((err) => console.error('Error fetching runs:', err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTriggerSingle = async (key: SourceKey, forceFixture = false) => {
    setLoadingKey(key);
    try {
      await onTriggerRetrieval(key, forceFixture);
      const res = await fetch('/api/runs');
      const data = await res.json();
      if (data?.runs) setRuns(data.runs);
    } finally {
      setLoadingKey(null);
    }
  };

  const handleReset = async () => {
    setIsResetting(true);
    try {
      await onResetDemo();
      const res = await fetch('/api/runs');
      const data = await res.json();
      if (data?.runs) setRuns(data.runs);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="sources-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        className="bg-white rounded-2xl border border-[#D6E1E5] shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden text-xs text-[#182B33]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#D6E1E5] bg-[#F7FAFB]">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#1F6075]" />
            <div>
              <h2 id="sources-modal-title" className="font-bold text-sm text-[#182B33]">
                Quellenverwaltung & Abruf-Infrastruktur
              </h2>
              <p className="text-[11px] text-[#5A6D75]">
                Status der öffentlichen Datenquellen, Endpunkte und Abrufprotokoll
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Sources List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#5A6D75] uppercase tracking-wider text-[11px]">
                Überwachte Quellen ({sources.length})
              </span>
              <button
                type="button"
                onClick={handleReset}
                disabled={isResetting}
                className="flex items-center gap-1 text-[11px] text-[#A85214] hover:underline font-semibold"
              >
                <RotateCcw className={`w-3 h-3 ${isResetting ? 'animate-spin' : ''}`} />
                <span>Demo-Fixtures zurücksetzen</span>
              </button>
            </div>

            <div className="grid gap-3">
              {sources.map((src) => {
                const isLoading = loadingKey === src.key;

                return (
                  <div
                    key={src.id}
                    className="p-4 bg-[#F7FAFB] border border-[#D6E1E5] rounded-xl flex flex-wrap items-center justify-between gap-3"
                  >
                    <div className="space-y-1 max-w-md">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            src.healthStatus === 'healthy'
                              ? 'bg-[#28734F]'
                              : src.healthStatus === 'warning'
                              ? 'bg-[#C78726]'
                              : 'bg-[#9A2B2B]'
                          }`}
                        />
                        <span className="font-bold text-sm text-[#182B33]">{src.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white text-[#5A6D75] border border-[#D6E1E5]">
                          {src.category}
                        </span>
                      </div>
                      <div className="text-[#5A6D75] text-[11px]">
                        {src.qualificationRule}
                      </div>
                      <div className="space-y-1 pt-1">
                        {/* Public Web URL */}
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <span className="text-[#5A6D75] shrink-0 font-medium">Öffentliche Website:</span>
                          <a
                            href={src.publicWebUrl || src.primaryUrl}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="text-[#1F6075] font-semibold hover:underline inline-flex items-center gap-1 truncate max-w-[320px]"
                            title="Öffentliche Website im Browser aufrufen"
                          >
                            <span className="truncate">{src.publicWebUrl || src.primaryUrl}</span>
                            <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                          </a>
                        </div>

                        {/* Technical Feed / Ingestion Endpoint */}
                        <div className="flex items-center gap-1.5 text-[10px] text-[#7B8E96]">
                          <span className="shrink-0">Technischer Feed:</span>
                          <span className="font-mono truncate max-w-[320px]">{src.primaryUrl}</span>
                        </div>
                      </div>
                      {src.lastErrorMessage && (
                        <div className="text-[10px] text-[#A85214] pt-0.5">
                          Hinweis: {src.lastErrorMessage}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleTriggerSingle(src.key, false)}
                        disabled={isLoading}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-[#D6E1E5] text-[#182B33] hover:bg-[#E4ECEF] disabled:opacity-50 transition-colors shadow-xs"
                      >
                        <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                        <span>Jetzt abrufen</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTriggerSingle(src.key, true)}
                        disabled={isLoading}
                        title="Offizielles Demo-Fixture laden (getestet für verlässliche Präsentation)"
                        className="text-[10px] text-[#5A6D75] hover:text-[#182B33] px-2 py-1.5 rounded-lg border border-[#D6E1E5] bg-white transition-colors"
                      >
                        Fixture
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Retrieval Runs Audit Log */}
          <div className="space-y-2">
            <span className="font-bold text-[#5A6D75] uppercase tracking-wider text-[11px]">
              Jüngste Abrufprotokolle (Audit-Log)
            </span>

            {runs.length === 0 ? (
              <div className="p-4 text-center text-[#5A6D75] bg-[#F4F7F8] rounded-xl border border-[#D6E1E5]">
                Noch keine Abrufe protokolliert.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {runs.slice(0, 10).map((r) => (
                  <div
                    key={r.id}
                    className="p-2.5 bg-[#F4F7F8] border border-[#D6E1E5] rounded-lg flex items-center justify-between text-[11px]"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          r.outcome === 'succeeded'
                            ? 'bg-[#28734F]'
                            : r.outcome === 'running'
                            ? 'bg-[#1F6075] animate-pulse'
                            : 'bg-[#9A2B2B]'
                        }`}
                      />
                      <span className="font-semibold text-[#182B33]">{r.sourceName}</span>
                      <span className="text-[#5A6D75] truncate max-w-sm">{r.message}</span>
                    </div>
                    <div className="font-mono text-[10px] text-[#7B8E96]">
                      {new Date(r.startedAt).toLocaleTimeString('de-DE')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#F7FAFB] border-t border-[#D6E1E5] flex items-center justify-between">
          <div className="text-[11px] text-[#5A6D75]">
            Gemäß BMAD Architecture-Spine (AD-1 bis AD-12) entkoppelt & idempotent.
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#1F6075] text-white font-semibold hover:bg-[#164C5C] transition-colors"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};
