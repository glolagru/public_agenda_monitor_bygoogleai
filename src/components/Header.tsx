import React from 'react';
import { RefreshCw, Shield, Calendar, Newspaper } from 'lucide-react';

interface HeaderProps {
  activeRole: 'specialist' | 'editorial';
  onSelectRole: (role: 'specialist' | 'editorial') => void;
  onRefreshSources: () => void;
  isRefreshing: boolean;
  onOpenSourcesModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeRole,
  onSelectRole,
  onRefreshSources,
  isRefreshing,
  onOpenSourcesModal,
}) => {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#D6E1E5] px-6 py-4 bg-white">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#1F6075] text-white font-bold text-sm">
          PAM
        </div>
        <div>
          <div className="text-lg font-bold tracking-tight text-[#182B33]">
            Public Agenda Monitor
          </div>
          <p className="text-xs text-[#5A6D75]">
            Redaktionelles Ereignis-Monitoring & Agenda-Planung
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Role Switcher */}
        <div
          role="group"
          aria-label="App-Zugang auswählen"
          className="flex items-center p-1 bg-[#F4F7F8] border border-[#D6E1E5] rounded-lg"
        >
          <button
            type="button"
            id="role-specialist-btn"
            onClick={() => onSelectRole('specialist')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeRole === 'specialist'
                ? 'bg-[#1F6075] text-white shadow-sm'
                : 'text-[#5A6D75] hover:text-[#182B33]'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Information Specialists</span>
          </button>
          <button
            type="button"
            id="role-editorial-btn"
            onClick={() => onSelectRole('editorial')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeRole === 'editorial'
                ? 'bg-[#1F6075] text-white shadow-sm'
                : 'text-[#5A6D75] hover:text-[#182B33]'
            }`}
          >
            <Newspaper className="w-3.5 h-3.5" />
            <span>Redaktion</span>
          </button>
        </div>

        {/* Action button */}
        {activeRole === 'specialist' && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              id="refresh-sources-btn"
              onClick={onRefreshSources}
              disabled={isRefreshing}
              className="flex items-center gap-2 bg-[#1F6075] hover:bg-[#164C5C] active:scale-[0.98] text-white text-xs font-semibold px-4 py-2 rounded-lg transition-all disabled:opacity-60 shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Ruft ab...' : 'Quellen abrufen'}</span>
            </button>
            <button
              type="button"
              id="source-management-btn"
              onClick={onOpenSourcesModal}
              title="Quellen & Abrufstatus verwalten"
              className="text-xs text-[#1F6075] border border-[#D6E1E5] hover:bg-[#F4F7F8] px-3 py-2 rounded-lg font-medium transition-colors"
            >
              Quellenübersicht
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
