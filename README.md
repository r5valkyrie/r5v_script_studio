# R5V Script Studio

<p align="center">
  <img src="public/favicon.svg" alt="R5V Script Studio" width="120" height="120">
</p>

<p align="center">
  A visual scripting and modding tool for <a href="https://playvalkyrie.org/">R5Valkyrie</a> (Apex Legends)
</p>

<p align="center">
  <a href="https://github.com/r5valkyrie/r5v_script_studio/releases">Download</a> •
  <a href="#features">Features</a> •
  <a href="#installation">Installation</a> •
  <a href="#usage">Usage</a> •
  <a href="#keybindings">Keybindings</a>
</p>

---

## Features

### Visual Scripting
- **Node-Based Editor** - Create Squirrel scripts using a visual node graph
- **200+ Node Types** - Extensive library covering core flow, entities, weapons, NPCs, UI, events, and more
- **Node Spotlight** - Quick search (`Ctrl+Space`) to add nodes instantly
- **Multi-File Projects** - Organize your mod with multiple script files and folders
- **Live Code Preview** - See generated Squirrel code in real-time as you build

### Mod Compilation
- **Direct Export** - Compile directly to R5Valkyrie mod format
- **Auto-Generated Files** - Creates `mod.vdf` and `scripts.rson` automatically  
- **Context Detection** - Automatically detects SERVER/CLIENT/UI contexts from your nodes
- **Custom Export Path** - Configure your mods output directory

### Editor Features
- **Customizable Appearance** - Themes, accent colors, and multiple grid styles (dots, lines, blueprint, hexagons, etc.)
- **Flexible Connections** - Multiple connection styles (bezier, straight, metro, step)
- **Customizable Keybindings** - Rebind all shortcuts to your preference
- **Project Persistence** - Auto-save, recent projects, and UI state restoration
- **Undo/Redo** - Full history support for all actions

### Node Categories
| Category | Description |
|----------|-------------|
| Core Flow | Init nodes, loops, branches, signals, custom functions |
| Events | Weapon callbacks, animation events, entity events |
| Callbacks | Player events, game state, inventory changes |
| Entity | Entity manipulation, properties, spawning |
| NPC | AI creation, manipulation, and behaviors |
| Weapons | Weapon operations and modifications |
| Passives | Passive ability system |
| Survival | Loot and inventory system |
| Status Effects | Status effect management |
| Particles | Particle and FX systems |
| Audio | Sound and audio playback |
| Damage | Damage system and traces |
| UI | RUI system and HUD elements |
| Math | Vectors, angles, math operations |
| String | String manipulation and formatting |
| Data | Constants, variables, arrays, tables |
| Structures | Structs, enums, typedefs |
| Gamemodes | Gamemode registration and configuration |

## Installation

### From Release

1. Download the latest release from the [Releases page](https://github.com/r5valkyrie/r5v_script_studio/releases)
2. Run the installer or extract the archive
3. Launch R5V Script Studio

### From Source

Prerequisites: [Node.js](https://nodejs.org/) (v18+) and npm

```bash
# Clone the repository
git clone https://github.com/r5valkyrie/r5v_script_studio.git
cd r5v_script_studio

# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build
```

## Usage

### Creating a Project

1. Launch R5V Script Studio
2. Click **New Project** or press `Ctrl+N`
3. Add nodes from the sidebar by clicking or dragging them onto the canvas
4. Use **Node Spotlight** (`Ctrl+Space`) for quick node search
5. Connect nodes by dragging from output ports to input ports
6. Save your project with `Ctrl+S`

### Working with Multiple Files

1. Use the **Project Panel** to manage script files and folders
2. Create new script files with the **+** button
3. Organize files into folders for larger mods
4. Switch between files by clicking them in the project tree

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
| Copy | `Ctrl+C` |
| Paste | `Ctrl+V` |
| Cut | `Ctrl+X` |
| Select All | `Ctrl+A` |
| Search | `Ctrl+F` |
| Node Spotlight | `Ctrl+Space` |
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

### Tech Stack

- **Framework**: [Astro](https://astro.build/) + [React](https://react.dev/)
- **Desktop**: [Electron](https://www.electronjs.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [DaisyUI](https://daisyui.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)

### Project Structure

```
r5v_script_studio/
├── electron/          # Electron main process (bundled from js/)
├── js/                # Electron source files
│   ├── main.js        # Main process
│   └── preload.cjs    # Preload script
├── src/
│   ├── components/    # React components
│   │   └── visual-scripting/  # Editor components
│   ├── data/          # Node definitions (200+ nodes)
│   ├── hooks/         # React hooks (project management)
│   ├── types/         # TypeScript types
│   └── utils/         # Utility functions (code gen, compiler)
├── public/            # Static assets
└── scripts/           # Build scripts
```

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## License

MIT License - see [LICENSE](LICENSE) for details.
