import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db';
import {
  initializeDatabaseWithSeed,
  retrieveAllSources,
  retrieveSource,
} from './server/retrieval';
import { SourceKey } from './src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Sources list & health
app.get('/api/sources', (req, res) => {
  try {
    const sources = db.getSources();
    res.json({ sources });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Retrieval runs log
app.get('/api/runs', (req, res) => {
  try {
    const runs = db.getRuns();
    res.json({ runs });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Events (Specialist Queue or filtered)
app.get('/api/events', (req, res) => {
  try {
    const events = db.getEvents();
    res.json({ events });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Single event details & full review history
app.get('/api/events/:id', (req, res) => {
  try {
    const event = db.getEventById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Ereignis nicht gefunden' });
    }
    const reviews = db.getReviewsForEvent(event.id);
    res.json({ event: { ...event, reviews } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Redaktion 14-day agenda view
app.get('/api/agenda', (req, res) => {
  try {
    const allEvents = db.getEvents();
    const approved = allEvents.filter((e) => e.editorialState === 'approved');

    // 14 calendar days window: today through today + 13 days
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + 14);
    const endDateStr = endDate.toISOString().slice(0, 10);

    // In demo mode or if dates are slightly offset, include approved events in range
    const inWindow = approved.filter((e) => {
      return e.sourceDate >= todayStr && e.sourceDate <= endDateStr;
    });

    // If dates in demo dataset are in the future or past, also provide approved events so agenda is never empty in demo
    const finalAgenda = inWindow.length > 0 ? inWindow : approved;

    res.json({
      agenda: finalAgenda,
      windowStart: todayStr,
      windowEnd: endDateStr,
      totalApproved: approved.length,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Trigger retrieval
app.post('/api/retrieval', async (req, res) => {
  try {
    const { sourceKey, forceFixture } = req.body;
    if (sourceKey) {
      const result = await retrieveSource(sourceKey as SourceKey, Boolean(forceFixture));
      return res.json({ result });
    }
    const results = await retrieveAllSources(Boolean(forceFixture));
    res.json({ results });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Review action (Approve / Reject / Comment / Score / Quellenlink)
app.post('/api/events/:id/review', (req, res) => {
  try {
    const { decision, editorialScore, comment, sourceUrl } = req.body;
    if (!['approved', 'rejected', 'updated', 'deferred'].includes(decision)) {
      return res.status(400).json({ error: 'Ungültige Entscheidung' });
    }
    const parsedScore =
      editorialScore !== undefined && editorialScore !== null ? Number(editorialScore) : null;
    const result = db.addReview(req.params.id, decision, parsedScore, comment, sourceUrl);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update source URL (Quellenlink) directly
app.patch('/api/events/:id/source-url', (req, res) => {
  try {
    const { sourceUrl, comment } = req.body;
    if (!sourceUrl || typeof sourceUrl !== 'string') {
      return res.status(400).json({ error: 'sourceUrl ist erforderlich' });
    }
    const result = db.updateEventSourceUrl(req.params.id, sourceUrl, comment);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/events/:id', (req, res) => {
  try {
    const { sourceUrl, comment } = req.body;
    if (sourceUrl) {
      const result = db.updateEventSourceUrl(req.params.id, sourceUrl, comment);
      return res.json(result);
    }
    const ev = db.getEventById(req.params.id);
    res.json({ event: ev });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Reorder priority
app.post('/api/events/reorder', (req, res) => {
  try {
    const { orderedIds } = req.body;
    if (!Array.isArray(orderedIds)) {
      return res.status(400).json({ error: 'orderedIds muss ein Array sein' });
    }
    db.updateManualPriority(orderedIds);
    res.json({ success: true, count: orderedIds.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Reset demo seed
app.post('/api/reset-demo', async (req, res) => {
  try {
    await retrieveAllSources(true);
    res.json({ success: true, message: 'Demo-Daten erfolgreich zurückgesetzt' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Server boot & Vite middleware
async function startServer() {
  await initializeDatabaseWithSeed();

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Public Agenda Monitor server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
