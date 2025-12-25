# R5V Mod Studio

<p align="center">
  <img src="public/favicon.svg" alt="R5V Mod Studio" width="120" height="120">
</p>

<p align="center">
  A visual scripting and modding tool for <a href="https://r5reloaded.com/">R5Reloaded</a> (Apex Legends)
</p>

<p align="center">
  <a href="https://github.com/r5valkyrie/r5v_mod_studio/releases">Download</a> •
  <a href="#features">Features</a> •
  <a href="#installation">Installation</a> •
  <a href="#usage">Usage</a> •
  <a href="#keybindings">Keybindings</a>
</p>

---

## Features

- **Visual Scripting** - Create Squirrel scripts using a node-based visual editor
- **Multi-File Projects** - Organize your mod with multiple script files and folders
- **Live Code Preview** - See generated code in real-time as you build
- **Mod Compilation** - Export directly to R5Reloaded mod format with `mod.vdf` and `scripts.rson`
- **Context Detection** - Automatically detects SERVER/CLIENT/UI contexts from your nodes
- **Customizable** - Themes, accent colors, grid settings, and keybindings
- **Project Persistence** - Auto-save, recent projects, and UI state restoration

## Installation

### From Release

1. Download the latest release from the [Releases page](https://github.com/r5valkyrie/r5v_mod_studio/releases)
2. Run the installer or extract the archive
3. Launch R5V Mod Studio

### From Source

Prerequisites: [Node.js](https://nodejs.org/) (v18+) and npm

```bash
# Clone the repository
git clone https://github.com/r5valkyrie/r5v_mod_studio.git
cd r5v_mod_studio

# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build
```

## Usage

### Creating a Project

1. Launch R5V Mod Studio
2. Click **New Project** or press `Ctrl+N`
3. Add nodes from the sidebar by dragging them onto the canvas
4. Connect nodes by dragging from output ports to input ports
5. Save your project with `Ctrl+S`

### Compiling a Mod

1. Go to **File → Project Settings** to configure your mod metadata
2. Set your export path in **File → Settings → General**
3. Click the **Compile** button or press `Ctrl+B`
4. Your mod will be created in the export folder with the structure:
   ```
   Author-ModName/
   ├── mod.vdf
   └── scripts/
       └── vscripts/
           ├── scripts.rson
           └── your_scripts.nut
   ```

### Project Settings

Configure your mod's `mod.vdf` file:
- **Mod ID** - Unique identifier (e.g., `my.awesome.mod`)
- **Name** - Display name
- **Version** - Semantic version (e.g., `1.0.0`)
- **Author** - Your name or team
- **Description** - What your mod does

## Keybindings

All keybindings are customizable in **Settings → Keybindings**

| Action | Default |
|--------|---------|
| New Project | `Ctrl+N` |
| Open Project | `Ctrl+O` |
| Save | `Ctrl+S` |
| Save As | `Ctrl+Shift+S` |
| Compile | `Ctrl+B` |
| Undo | `Ctrl+Z` |
| Redo | `Ctrl+Shift+Z` |
| Delete Selected | `Delete` |
| Toggle Code Panel | `Ctrl+Shift+C` |
| Toggle Sidebar | `Ctrl+\` |

## Development

```bash
# Run development server with hot reload
npm run dev

# Build web assets only
npm run build:web

# Build full Electron app
npm run build
```

### Project Structure

```
r5v_mod_studio/
├── electron/          # Electron main process (bundled from js/)
├── js/                # Electron source files
│   ├── main.js        # Main process
│   └── preload.cjs    # Preload script
├── src/
│   ├── components/    # React components
│   ├── data/          # Node definitions
│   ├── hooks/         # React hooks
│   ├── types/         # TypeScript types
│   └── utils/         # Utility functions
├── public/            # Static assets
└── scripts/           # Build scripts
```

## License

MIT License - see [LICENSE](LICENSE) for details.

## Links

- [R5Reloaded](https://r5reloaded.com/) - The Apex Legends mod
- [R5Valkyrie](https://github.com/r5valkyrie) - Project organization