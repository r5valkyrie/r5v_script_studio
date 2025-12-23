# R5V Mod Studio

A standalone editor for creating and editing R5Reloaded mods, built with Electron and Astro.

## Quick Start

```bash
# Install dependencies
npm install

# Development mode (Astro dev server + Electron)
npm run dev

# Build and run production
npm run build:web
node scripts/bundleElectron.cjs
npx electron .
```

## Features

- **3-Panel Workspace**: File tree, code editor, and asset inspector
- **Mod Structure**: Automatic scaffolding for mod.vdf, scripts, paks, audio, resources
- **Theme**: Matches the R5Valkyrie Launcher's glass aesthetic
- **File Management**: Browse and edit mod files in-place

## Typical Mod Structure

```
my_mod/
├── mod.vdf             # Mod metadata and ConVars
├── manifest.json       # Thunderstore metadata
├── icon.png
├── scripts/            # Squirrel scripts
│   └── vscripts/
├── paks/               # RPAK files
├── audio/              # Audio events
└── resource/           # UI resources
```

## Roadmap

- [ ] Real file I/O (open folders, read/write files)
- [ ] Monaco editor integration
- [ ] New Mod wizard
- [ ] Asset browser with image previews
- [ ] Schema documentation tooltips
- [ ] RPAK build pipeline
- [ ] Live preview for UI resources