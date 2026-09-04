# Dev-Setup

## Voraussetzungen

- **Node.js 20+** (installiert: v24.19.0 unter `C:\Program Files\nodejs`)
- Git

## Befehle

```bash
npm install       # Abhängigkeiten
npm run dev        # Dev-Server auf http://localhost:5173
npm run build      # Produktions-Build nach dist/
npm run preview    # Build lokal ansehen
npm run typecheck  # nur TypeScript prüfen
```

## Bekannte Umgebungs-Eigenheiten (dieser Rechner)

- **PATH:** Node wurde nach dem Start der Claude-App installiert. Neue
  Terminals/Prozesse müssen ggf. neu gestartet werden, damit `node`/`npm`
  gefunden werden. Notfalls `C:\Program Files\nodejs` dem PATH voranstellen.
- **npm `allow-scripts`:** npm ist so konfiguriert, dass Install-Skripte von
  Paketen blockiert werden (Warnung `allow-scripts ... esbuild`). Der Build
  funktioniert trotzdem (esbuild bringt das passende Binary mit). Falls doch
  Probleme mit esbuild auftreten: `npm rebuild esbuild` bzw. das Skript gezielt
  freigeben.

## Deployment (GitHub Pages) – später

- Build mit gesetzter Base-URL: `VITE_BASE=/<repo-name>/ npm run build`
- `dist/` per GitHub Actions auf den `gh-pages`-Branch / Pages veröffentlichen.
- Hash-Routing ist aktiv, daher sind keine Server-Rewrite-Regeln nötig.
- Die App braucht zusätzlich `VITE_APPS_SCRIPT_URL` (URL der Apps-Script-Web-App,
  kommt in Phase 4).
