import { app, BrowserWindow, protocol, shell, ipcMain, dialog } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import zlib from 'node:zlib';
import { promisify } from 'node:util';

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

// Magic bytes to identify compressed R5V project files
const R5V_MAGIC = Buffer.from([0x52, 0x35, 0x56, 0x50]); // "R5VP"

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
let mainWindow;

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1150,
    height: 800,
    minWidth: 1150,
    minHeight: 800,
    frame: false,
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: path.join(__dirname, '..', 'electron', 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) {
    await mainWindow.loadURL(devUrl);
  } else {
    const indexPath = path.join(__dirname, '..', 'dist', 'index.html');
    await mainWindow.loadFile(indexPath);
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    try { shell.openExternal(url); } catch {}
    return { action: 'deny' };
  });

  const show = () => {
    if (!mainWindow) return;
    if (!mainWindow.isVisible()) mainWindow.show();
    if (!mainWindow.isFocused()) mainWindow.focus();
  };
  mainWindow.once('ready-to-show', show);
  mainWindow.webContents.once('did-finish-load', show);
  
  // Disable Electron's built-in zoom
  mainWindow.webContents.setZoomLevel(0);
  mainWindow.webContents.setVisualZoomLevelLimits(1, 1); // Disable pinch-to-zoom
  
  // Fallback: show window after a short delay if events don't fire
  setTimeout(show, 0);
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.whenReady().then(async () => {
  const distPath = path.join(__dirname, '..', 'dist');
  
  protocol.interceptFileProtocol('file', (request, callback) => {
    try {
      const url = new URL(request.url);
      let filePath = decodeURIComponent(url.pathname);
      
      // Remove leading slash on Windows
      if (process.platform === 'win32' && /^\/[a-zA-Z]:/.test(filePath)) {
        filePath = filePath.substring(1);
      }
      
      // Handle paths starting with /_astro/
      if (filePath.includes('/_astro/')) {
        const astroFile = filePath.substring(filePath.indexOf('/_astro/') + 1);
        const fullPath = path.join(distPath, astroFile);
        return callback({ path: fullPath });
      }
      
      // If it's already an absolute path with dist in it, use as-is
      if (filePath.includes('/dist/')) {
        return callback({ path: filePath });
      }
      
      // Otherwise treat as relative to dist
      if (filePath.startsWith('/')) {
        filePath = filePath.substring(1);
      }
      const fullPath = path.join(distPath, filePath);
      callback({ path: fullPath });
    } catch (err) {
      console.error('Protocol error:', err);
      callback({ error: -6 });
    }
  });

  await createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// IPC Handlers
ipcMain.handle('select-directory', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory', 'createDirectory'],
    title: 'Select Mod Directory'
  });
  
  if (result.canceled) {
    return null;
  }
  
  return result.filePaths[0];
});

ipcMain.handle('show-save-dialog', async (event, options) => {
  const result = await dialog.showSaveDialog(mainWindow, options);
  return {
    canceled: result.canceled,
    filePath: result.filePath
  };
});

ipcMain.handle('show-open-dialog', async (event, options) => {
  const result = await dialog.showOpenDialog(mainWindow, options);
  return {
    canceled: result.canceled,
    filePaths: result.filePaths
  };
});

ipcMain.handle('read-file', async (event, { filePath }) => {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return { success: true, content };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('write-file', async (event, { filePath, content }) => {
  try {
    await fs.writeFile(filePath, content, 'utf-8');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Read project file - auto-detect compressed or plain JSON
ipcMain.handle('read-project-file', async (event, { filePath }) => {
  try {
    const buffer = await fs.readFile(filePath);
    
    // Check for R5V magic header (compressed format)
    if (buffer.length >= 4 && buffer.slice(0, 4).equals(R5V_MAGIC)) {
      // Compressed format: R5VP + gzipped JSON
      const compressedData = buffer.slice(4);
      const decompressed = await gunzip(compressedData);
      return { success: true, content: decompressed.toString('utf-8'), compressed: true };
    }
    
    // Plain JSON (legacy/uncompressed)
    return { success: true, content: buffer.toString('utf-8'), compressed: false };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Write project file - always compress
ipcMain.handle('write-project-file', async (event, { filePath, content }) => {
  try {
    // Compress the JSON content
    const compressed = await gzip(Buffer.from(content, 'utf-8'), { level: 9 });
    
    // Create buffer with magic header + compressed data
    const finalBuffer = Buffer.concat([R5V_MAGIC, compressed]);
    
    await fs.writeFile(filePath, finalBuffer);
    return { success: true, originalSize: content.length, compressedSize: finalBuffer.length };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('list-directory', async (event, { dirPath }) => {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const items = entries.map(entry => ({
      name: entry.name,
      isDirectory: entry.isDirectory(),
      path: path.join(dirPath, entry.name)
    }));
    return { success: true, items };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('create-directory', async (event, { dirPath }) => {
  try {
    await fs.mkdir(dirPath, { recursive: true });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('delete-directory', async (event, { dirPath }) => {
  try {
    await fs.rm(dirPath, { recursive: true, force: true });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('create-mod', async (event, modData) => {
  const { name, description, author, version, modId, path: modPath } = modData;
  
  try {
    const modDir = path.join(modPath, modId);
    
    // Check if directory already exists
    if (existsSync(modDir)) {
      return { success: false, error: 'Mod directory already exists' };
    }
    
    // Create directory structure
    await fs.mkdir(modDir, { recursive: true });
    await fs.mkdir(path.join(modDir, 'scripts'), { recursive: true });
    await fs.mkdir(path.join(modDir, 'scripts', 'vscripts'), { recursive: true });
    await fs.mkdir(path.join(modDir, 'paks'), { recursive: true });
    await fs.mkdir(path.join(modDir, 'audio'), { recursive: true });
    await fs.mkdir(path.join(modDir, 'resource'), { recursive: true });
    
    // Create mod.vdf
    const vdfContent = `"${modId}"
{
    "Name"              "${name}"
    "Description"       "${description}"
    "Version"           "${version}"
    "RequiredOnClient"  "1"
}`;
    await fs.writeFile(path.join(modDir, 'mod.vdf'), vdfContent, 'utf-8');
    
    // Create manifest.json
    const manifestContent = {
      name,
      description,
      version,
      author,
      modId,
      scripts: [],
      rpaks: [],
      audio: [],
      localization: {}
    };
    await fs.writeFile(
      path.join(modDir, 'manifest.json'), 
      JSON.stringify(manifestContent, null, 2), 
      'utf-8'
    );
    
    // Create README.md
    const readmeContent = `# ${name}

${description}

## Author
${author}

## Version
${version}

## Installation
Place this mod in your mods directory.
`;
    await fs.writeFile(path.join(modDir, 'README.md'), readmeContent, 'utf-8');
    
    return { success: true, path: modDir };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('open-mod-folder', async (event, { folderPath }) => {
  try {
    const entries = await fs.readdir(folderPath, { withFileTypes: true });
    
    const buildTree = async (dirPath, depth = 0) => {
      if (depth > 5) return []; // Prevent infinite recursion
      
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      const items = [];
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        const item = {
          name: entry.name,
          path: fullPath,
          type: entry.isDirectory() ? 'folder' : 'file',
        };
        
        if (entry.isDirectory() && depth < 3) {
          item.children = await buildTree(fullPath, depth + 1);
        }
        
        items.push(item);
      }
      
      return items.sort((a, b) => {
        if (a.type === b.type) return a.name.localeCompare(b.name);
        return a.type === 'folder' ? -1 : 1;
      });
    };
    
    const tree = await buildTree(folderPath);
    return { success: true, tree, rootPath: folderPath };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Window controls
ipcMain.on('window:minimize', () => mainWindow?.minimize());
ipcMain.on('window:maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});
ipcMain.on('window:close', () => mainWindow?.close());

// Reset Electron zoom level
ipcMain.on('window:resetZoom', () => {
  if (mainWindow?.webContents) {
    mainWindow.webContents.setZoomLevel(0);
  }
});
