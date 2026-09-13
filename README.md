# Public Agenda Monitor

Ein professionelles redaktionelles System zur Beobachtung, Normalisierung, Prüfung und Kuration öffentlicher Termine und Ereignisse für die journalistische Themenplanung.

Entwickelt auf Basis des detaillierten BMAD-Plans (Brainstorming, Modeling, Architecture, Design) aus dem Referenz-Repository, ohne das Original-Repository zu verändern.

---

## Architektur & Invarianten (Architecture Spine)

- **Entkoppelte Quellen-Adapter**: Eigene modulare Adapter für die 4 priorisierten Quellen:
  1. **Bundesverwaltungsgericht (BVerwG)**: RSS-Feed (`https://www.bverwg.de/rss/termine.rss`) für Verhandlungs- und Urteilstermine der Senate.
  2. **Bundespräsident**: Terminkalender Schloss Bellevue & offizieller Feed mit Prüfung bundesweiter/außenpolitischer Termine.
  3. **UN Women**: Zwei spezialisierte Kanäle (News/Panels & Publications/Global Reports) mit Qualifizierungsheuristik für ministerielle Termine und Gleichstellungsdaten.
  4. **Bundesverfassungsgericht (BVerfG)**: Wochenausblick für mündliche Verhandlungen und Urteilsverkündungen der Senate.
- **Stabile Ereignis-Identität (AD-4)**: Eindeutiger Primärschlüssel `source_id + source_event_key`. Wiederholte Abrufe sind idempotent; redaktionelle Bewertungen, Freigabestatus und manuelle Rangfolge bleiben stets erhalten.
- **Nicht-Erreichbarkeit & Verschwinden (AD-11)**: Verschwindet ein Termin aus einem Quell-Feed, wird er nicht gelöscht, sondern transparent als `⚠️ Prüfung nötig` gekennzeichnet.
- **Transparente Lernschleife (AD-10)**: Ab 3 geprüften Terminen einer Kategorie passt das System den Relevanzvorschlag nachvollziehbar an und weist die Freigabequote aus – ohne automatische Eigenmächtigkeit.
- **Zwei getrennte Sichten**:
  - **Information Specialists**: Prüfwarteschlange mit Volltext-Herkunftsnachweis, Relevanz-Scoring (1–5), Kommentaren und manueller Rangfolge.
  - **Redaktion**: 14-Tage-Planungsagenda mit freigegebenen Terminen und Exportfunktion für die morgendliche Redaktionskonferenz ("Morgenlage").

---

## Schnellstart

```bash
# Abhängigkeiten installieren
npm install

# Entwicklungsserver starten (Port 3000)
npm run dev

# Produktions-Build (Vite + esbuild Server-Bundle)
npm run build
npm start
```

---

## Hochladen in ein neues GitHub-Repository

Um dieses fertige Projekt in dein neues GitHub-Repository zu pushen:

1. **GitHub-Repository anlegen**:
   Erstelle auf GitHub ein neues, leeres Repository (z. B. `public-agenda-monitor`).

2. **Im Projektordner ausführen**:
   ```bash
   git init
   git add .
   git commit -m "feat: Initial commit of Public Agenda Monitor built from BMAD specifications"
   git branch -M main
   git remote add origin https://github.com/<DEIN-USERNAME>/<DEIN-REPO-NAME>.git
   git push -u origin main
   ```

Alternativ kannst du das gesamte Projekt über das **AI Studio Einstellungsmenü (Settings) direkt nach GitHub exportieren oder als ZIP herunterladen**.
