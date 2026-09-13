import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { SourceHealthBar } from './components/SourceHealthBar';
import { SpecialistQueue } from './components/SpecialistQueue';
import { EditorialAgenda } from './components/EditorialAgenda';
import { ReviewModal } from './components/ReviewModal';
import { SourcesModal } from './components/SourcesModal';
import { NormalizedEvent, SourceDefinition, SourceKey } from './types';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export function App() {
  const [activeRole, setActiveRole] = useState<'specialist' | 'editorial'>('specialist');
  const [events, setEvents] = useState<NormalizedEvent[]>([]);
  const [sources, setSources] = useState<SourceDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [reviewModalEvent, setReviewModalEvent] = useState<NormalizedEvent | null>(null);
  const [isSourcesModalOpen, setIsSourcesModalOpen] = useState(false);
  const [toast, setToast] = useState<{
    type: 'success' | 'info' | 'error';
    message: string;
  } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = useCallback(async () => {
    try {
      const [sourcesRes, eventsRes] = await Promise.all([
        fetch('/api/sources').then((r) => r.json()),
        fetch('/api/events').then((r) => r.json()),
      ]);

      if (sourcesRes?.sources) setSources(sourcesRes.sources);
      if (eventsRes?.events) setEvents(eventsRes.events);
    } catch (err) {
      console.error('Error loading data:', err);
      showToast('Fehler beim Laden der Ereignisse', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefreshSources = async (sourceKey?: SourceKey, forceFixture = false) => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/retrieval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceKey, forceFixture }),
      });
      const data = await res.json();

      await loadData();
      if (sourceKey) {
        showToast(`Quelle ${sourceKey} erfolgreich aktualisiert.`);
      } else {
        showToast('Alle 4 Quellen erfolgreich abgerufen und normalisiert.');
      }
    } catch (err: any) {
      showToast(`Abruf-Fehler: ${err.message}`, 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleApprove = async (event: NormalizedEvent) => {
    // Optimistic local state update for instantaneous toggle animation
    setEvents((prev) =>
      prev.map((e) =>
        e.id === event.id
          ? {
              ...e,
              editorialState: 'approved',
              editorialScore: e.editorialScore ?? e.suggestedScore,
              notSeenInLatestRetrieval: false,
            }
          : e
      )
    );

    try {
      const res = await fetch(`/api/events/${event.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision: 'approved',
          editorialScore: event.editorialScore ?? event.suggestedScore,
        }),
      });
      if (!res.ok) throw new Error('Fehler beim Freigeben');
      showToast(`„${event.title.slice(0, 35)}...“ freigegeben.`);
      await loadData();
    } catch (err: any) {
      showToast(err.message, 'error');
      await loadData();
    }
  };

  const handleReject = async (event: NormalizedEvent) => {
    // Optimistic local state update for instantaneous toggle animation
    setEvents((prev) =>
      prev.map((e) =>
        e.id === event.id
          ? {
              ...e,
              editorialState: 'rejected',
              notSeenInLatestRetrieval: false,
            }
          : e
      )
    );

    try {
      const res = await fetch(`/api/events/${event.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision: 'rejected',
        }),
      });
      if (!res.ok) throw new Error('Fehler beim Zurücknehmen der Freigabe');
      showToast(`„${event.title.slice(0, 35)}...“ nicht freigegeben.`);
      await loadData();
    } catch (err: any) {
      showToast(err.message, 'error');
      await loadData();
    }
  };

  const handleDelete = async (event: NormalizedEvent) => {
    try {
      setEvents((prev) =>
        prev.map((e) =>
          e.id === event.id ? { ...e, isNew: false, isDeleted: true, editorialState: 'deleted' } : e
        )
      );
      const res = await fetch(`/api/events/${event.id}/delete`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Fehler beim Löschen');
      showToast(`„${event.title.slice(0, 35)}...“ gelöscht (im Filter „Gelöscht“ auffindbar).`);
      await loadData();
    } catch (err: any) {
      showToast(err.message, 'error');
      await loadData();
    }
  };

  const handleRestore = async (event: NormalizedEvent) => {
    try {
      setEvents((prev) =>
        prev.map((e) =>
          e.id === event.id ? { ...e, isNew: false, isDeleted: false, editorialState: 'candidate' } : e
        )
      );
      const res = await fetch(`/api/events/${event.id}/restore`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Fehler beim Wiederherstellen');
      showToast(`„${event.title.slice(0, 35)}...“ wiederhergestellt.`);
      await loadData();
    } catch (err: any) {
      showToast(err.message, 'error');
      await loadData();
    }
  };

  const handleSubmitReview = async (
    eventId: string,
    decision: 'approved' | 'rejected' | 'updated' | 'deferred',
    editorialScore: number,
    comment: string,
    sourceUrl?: string
  ) => {
    try {
      const res = await fetch(`/api/events/${eventId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision,
          editorialScore,
          comment,
          sourceUrl,
        }),
      });
      if (!res.ok) throw new Error('Fehler beim Speichern der Prüfung');
      showToast(
        decision === 'approved'
          ? 'Ereignis freigegeben und bewertet.'
          : decision === 'rejected'
          ? 'Ereignis verworfen.'
          : 'Redaktionsnotiz & Quellenlink gespeichert.'
      );
      await loadData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleUpdateSourceUrl = async (
    eventId: string,
    sourceUrl: string,
    comment?: string
  ) => {
    try {
      const res = await fetch(`/api/events/${eventId}/source-url`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceUrl, comment }),
      });
      if (!res.ok) throw new Error('Fehler beim Aktualisieren des Quellenlinks');
      showToast('Öffentlicher Quellenlink aktualisiert.');
      await loadData();
    } catch (err: any) {
      showToast(err.message, 'error');
      throw err;
    }
  };

  const handleUpdateScore = async (eventId: string, score: number) => {
    // Optimistic local state update
    setEvents((prev) =>
      prev.map((e) => (e.id === eventId ? { ...e, editorialScore: score } : e))
    );

    try {
      const res = await fetch(`/api/events/${eventId}/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score }),
      });
      if (!res.ok) throw new Error('Fehler beim Aktualisieren der Relevanz');
      showToast(`Relevanz auf Stufe ${score} gesetzt.`);
      await loadData();
    } catch (err: any) {
      showToast(err.message, 'error');
      await loadData(); // rollback on error
    }
  };

  const handleReorder = async (orderedIds: string[]) => {
    // Optimistic local update
    const idMap = new Map(orderedIds.map((id, index) => [id, index + 1]));
    setEvents((prev) =>
      [...prev].sort((a, b) => {
        const orderA = idMap.get(a.id) ?? a.manualPriority;
        const orderB = idMap.get(b.id) ?? b.manualPriority;
        return orderA - orderB;
      })
    );

    try {
      await fetch('/api/events/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds }),
      });
    } catch (err) {
      console.error('Error saving priority order:', err);
    }
  };

  const handleTestReset = async () => {
    setIsResetting(true);
    try {
      const res = await fetch('/api/test-reset', { method: 'POST' });
      if (!res.ok) throw new Error('Fehler beim Zurücksetzen der Kennzeichnungen');
      await loadData();
      showToast('Test Reset erfolgreich: Alle Kennzeichnungen und Bewertungen wurden zurückgesetzt.');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsResetting(false);
    }
  };

  const handleResetDemo = async () => {
    try {
      const res = await fetch('/api/reset-demo', { method: 'POST' });
      if (!res.ok) throw new Error('Fehler beim Zurücksetzen');
      await loadData();
      showToast('Demo-Fixtures für alle Quellen erfolgreich geladen.');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Filter approved events for Redaktion view (excluding deleted events)
  const approvedAgendaEvents = events.filter(
    (e) => e.editorialState === 'approved' && !e.isDeleted
  );

  return (
    <div className="min-h-screen bg-[#F4F7F8] py-2 sm:py-4 px-2 sm:px-4 lg:px-6 font-sans antialiased selection:bg-[#DCECF0] selection:text-[#182B33]">
      {/* Restrained Application Shell as mandated in DESIGN.md */}
      <div className="w-full max-w-[1600px] mx-auto bg-white border border-[#D6E1E5] rounded-[14px] shadow-sm overflow-hidden flex flex-col">
        {/* Header with brand and role toggle */}
        <Header
          activeRole={activeRole}
          onSelectRole={setActiveRole}
          onRefreshSources={() => handleRefreshSources()}
          isRefreshing={isRefreshing}
          onOpenSourcesModal={() => setIsSourcesModalOpen(true)}
          onTestReset={handleTestReset}
          isResetting={isResetting}
        />

        {/* Main Content Area */}
        <main className="p-4 sm:p-6 flex-1">
          {isLoading ? (
            <div className="py-24 text-center text-xs text-[#5A6D75]">
              Lade Agenda-Monitor Daten...
            </div>
          ) : activeRole === 'specialist' ? (
            <div>
              <SourceHealthBar
                sources={sources}
                onOpenSourcesModal={() => setIsSourcesModalOpen(true)}
              />
              <SpecialistQueue
                events={events}
                onApprove={handleApprove}
                onReject={handleReject}
                onDelete={handleDelete}
                onRestore={handleRestore}
                onOpenReviewModal={(ev) => setReviewModalEvent(ev)}
                onReorder={handleReorder}
                onUpdateSourceUrl={handleUpdateSourceUrl}
                onUpdateScore={handleUpdateScore}
              />
            </div>
          ) : (
            <EditorialAgenda events={approvedAgendaEvents} />
          )}
        </main>

        {/* Quiet Footer */}
        <footer className="border-t border-[#D6E1E5] px-6 py-3.5 bg-[#F7FAFB] flex flex-wrap items-center justify-between text-xs text-[#5A6D75]">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#182B33]">Public Agenda Monitor</span>
            <span>—</span>
            <span>
              Entwickelt nach dem BMAD-Plan (Bundesverwaltungsgericht, Bundespräsident, UN Women,
              BVerfG)
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleResetDemo}
              className="text-[#1F6075] hover:underline font-medium"
            >
              Demo-Daten zurücksetzen
            </button>
            <span>•</span>
            <span>Architektur: Entkoppelte Adapter & Idempotente Identity</span>
          </div>
        </footer>
      </div>

      {/* Review Modal for Information Specialists */}
      <ReviewModal
        event={reviewModalEvent}
        onClose={() => setReviewModalEvent(null)}
        onSubmitReview={handleSubmitReview}
      />

      {/* Sources & Health Management Modal */}
      <SourcesModal
        isOpen={isSourcesModalOpen}
        onClose={() => setIsSourcesModalOpen(false)}
        sources={sources}
        onTriggerRetrieval={handleRefreshSources}
        onResetDemo={handleResetDemo}
      />

      {/* Toast Notification */}
      {toast && (
        <div
          role="status"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold animate-in slide-in-from-bottom-2 duration-200 bg-white border-[#D6E1E5] text-[#182B33]"
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-[#9A2B2B]" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-[#28734F]" />
          )}
          <span>{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="ml-2 text-[#7B8E96] hover:text-[#182B33]"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
