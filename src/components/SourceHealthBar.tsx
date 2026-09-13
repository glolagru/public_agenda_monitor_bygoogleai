import React from 'react';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { SourceDefinition } from '../types';

interface SourceHealthBarProps {
  sources: SourceDefinition[];
  onOpenSourcesModal: () => void;
}

export const SourceHealthBar: React.FC<SourceHealthBarProps> = ({
  sources,
  onOpenSourcesModal,
}) => {
  const total = sources.length;
  const healthyCount = sources.filter((s) => s.healthStatus === 'healthy').length;
  const warningCount = sources.filter((s) => s.healthStatus === 'warning').length;
  const errorCount = sources.filter((s) => s.healthStatus === 'error').length;

  const hasIssues = errorCount > 0;
  const hasWarnings = warningCount > 0;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-[#F7FAFB] border border-[#D6E1E5] rounded-lg text-xs text-[#5A6D75] mb-5">
      <div className="flex items-center gap-2">
        <span
          className={`inline-block w-2.5 h-2.5 rounded-full ${
            hasIssues
              ? 'bg-[#A85214]'
              : hasWarnings
              ? 'bg-[#C78726]'
              : 'bg-[#28734F]'
          }`}
        />
        <span className="font-semibold text-[#182B33]">
          {healthyCount} von {total} Quellen aktiv & erreichbar
        </span>
        <span className="hidden sm:inline text-[#7B8E96]">|</span>
        <span className="hidden sm:inline">
          BVerwG, Bundespräsident, UN Women (News/Publ.), BVerfG
        </span>
      </div>

      <button
        type="button"
        id="open-source-health-details-btn"
        onClick={onOpenSourcesModal}
        className="flex items-center gap-1 font-semibold text-[#1F6075] hover:underline"
      >
        <Info className="w-3.5 h-3.5" />
        <span>Quellenstatus & Endpunkte anzeigen</span>
      </button>
    </div>
  );
};
