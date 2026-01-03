/**
 * Project compilation utilities
 * Compiles a project into a mod folder structure
 */

import type { ProjectData, ModSettings, ScriptFile, WeaponFile, UIFile, LocalizationFile } from '../types/project';
import { DEFAULT_MOD_SETTINGS } from '../types/project';
import { generateCode } from './code-generator';
import { generateCodeMetadata, embedProjectInCode, serializeLocalizationFile } from './project-manager';
import { electronAPI, isTauri } from './tauri-api';

export interface CompileResult {
  success: boolean;
  outputPath?: string;
  error?: string;
  filesCreated?: string[];
}

export interface CompileOptions {
  outputDir: string;
  includeProjectData?: boolean;  // Embed project data in script files for later editing
}

/**
 * Generates the mod.vdf file content
 * @param settings - Mod settings
 * @param localizationFiles - Localization files from the project (for auto-including paths)
 */
export function generateModVdf(settings: ModSettings, localizationFiles: LocalizationFile[] = []): string {
  const lines = [
    '"mod"',
    '{',
    `        "name" "${settings.modName}"`,
    `        "id" "${settings.modId}"`,
    `        "description" "${settings.modDescription}"`,
    `        "version" "${settings.modVersion}"`,
    `        "author" "${settings.modAuthor}"`,
  ];

  // Collect localization file paths from project's localization files
  // Group by base name to generate %language% pattern
  const locFileGroups = new Map<string, Set<string>>();
  for (const file of localizationFiles) {
    const baseName = file.name;
    if (!locFileGroups.has(baseName)) {
      locFileGroups.set(baseName, new Set());
    }
    locFileGroups.get(baseName)!.add(file.language);
  }
  
  // Generate localization file entries with %language% pattern
  const locPaths: string[] = [];
  for (const [baseName, languages] of locFileGroups) {
    // Use %language% pattern so game can load correct language
    const path = `resource/localization/${baseName}_%language%.txt`;
    locPaths.push(path);
  }

  // Also include any manually specified localization files from settings
  const manualLocFiles = settings.localizationFiles.filter(f => f.enabled);
  for (const file of manualLocFiles) {
    if (!locPaths.includes(file.path)) {
      locPaths.push(file.path);
    }
  }

  if (locPaths.length > 0) {
    lines.push('');
    lines.push('        "LocalizationFiles"');
    lines.push('        {');
    for (const path of locPaths) {
      lines.push(`                "${path}" "1"`);
    }
    lines.push('        }');
  }

  lines.push('}');
  return lines.join('\n');
}

import { getNodeDefinition } from '../data/node-definitions';

/**
 * Analyzes nodes in a script file to determine required contexts
 */
function analyzeScriptContext(nodes: any[]): { server: boolean; client: boolean; ui: boolean } {
  let server = false;
  let client = false;
  let ui = false;
  
  for (const node of nodes) {
    const def = getNodeDefinition(node.type);
    
    if (!def) continue;
    
    // Check explicit context from node definition
    if (def.context) {
      if (def.context.includes('SERVER')) server = true;
      if (def.context.includes('CLIENT')) client = true;
      if (def.context.includes('UI')) ui = true;
    }
    
    // Check legacy flags
    if (def.serverOnly) server = true;
    if (def.clientOnly) client = true;
    if (def.uiOnly) ui = true;
    
    // Detect from node type patterns
    const nodeType = node.type.toLowerCase();
    
    // Init nodes explicitly set context
    if (nodeType === 'init-server') server = true;
    if (nodeType === 'init-client') client = true;
    if (nodeType === 'init-ui') ui = true;
    
    // UI category nodes
    if (def.category === 'ui') ui = true;
    
    // Server-specific patterns
    if (nodeType.includes('spawn') || nodeType.includes('gamemode')) {
      server = true;
    }
    
    // Client-specific patterns (particles, sounds on client, etc.)
    if (nodeType.includes('localplayer') || nodeType === 'get-local-client-player') {
      client = true;
    }
  }
  
  return { server, client, ui };
}

/**
 * Converts context flags to RSON When clause
 */
function contextToWhenClause(ctx: { server: boolean; client: boolean; ui: boolean }): string {
  const parts: string[] = [];
  if (ctx.server) parts.push('SERVER');
  if (ctx.client) parts.push('CLIENT');
  if (ctx.ui) parts.push('UI');
  
  // If nothing detected, default to SERVER || CLIENT
  if (parts.length === 0) {
    return 'SERVER || CLIENT';
  }
  
  return parts.join(' || ');
}

/**
 * Generates the scripts.rson file content
 */
export function generateScriptsRson(scriptFiles: ScriptFile[]): string {
  // Group scripts by context
  const scriptsByContext: Record<string, string[]> = {};
  
  for (const file of scriptFiles) {
    // Analyze nodes to determine context
    const ctx = analyzeScriptContext(file.nodes || []);
    const context = contextToWhenClause(ctx);
    
    if (!scriptsByContext[context]) {
      scriptsByContext[context] = [];
    }
    
    // Convert script name to path
    const scriptPath = file.name.endsWith('.nut') || file.name.endsWith('.gnut') 
      ? file.name 
      : `${file.name}.nut`;
    
    scriptsByContext[context].push(scriptPath);
  }
  
  // Generate RSON content
  const sections: string[] = [];
  
  // Sort contexts for consistent output
  const contextOrder = ['SERVER || CLIENT || UI', 'SERVER || CLIENT', 'SERVER', 'CLIENT', 'UI'];
  const sortedContexts = Object.keys(scriptsByContext).sort((a, b) => {
    const aIdx = contextOrder.indexOf(a);
    const bIdx = contextOrder.indexOf(b);
    return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx);
  });
  
  for (const context of sortedContexts) {
    const scripts = scriptsByContext[context];
    if (scripts.length === 0) continue;
    
    sections.push(`When: "${context}"`);
    sections.push('Scripts:');
    sections.push('[');
    for (const script of scripts) {
      sections.push(`\t${script}`);
    }
    sections.push(']');
    sections.push('');
  }
  
  return sections.join('\n');
}

/**
 * Compiles a project into a mod folder structure
 */
export async function compileProject(
  project: ProjectData,
  options: CompileOptions
): Promise<CompileResult> {
  const filesCreated: string[] = [];
  
  try {
    // Get mod settings or use defaults
    const modSettings = project.settings.mod || DEFAULT_MOD_SETTINGS;
    
    // Determine output path - use Author-Name format like existing mods
    const folderName = `${modSettings.modAuthor}-${modSettings.modName}`.replace(/\s+/g, '');
    const modDir = `${options.outputDir}/${folderName}`;
    const scriptsDir = `${modDir}/scripts`;
    const vscriptsDir = `${scriptsDir}/vscripts`;
    const weaponsDir = `${scriptsDir}/weapons`;
    const resourceDir = `${modDir}/resource`;
    const uiDir = `${resourceDir}/ui`;
    const menusDir = `${uiDir}/menus`;
    
    // Check if Tauri API is available
    if (!isTauri()) {
      return { 
        success: false, 
        error: 'Tauri API not available. Compile is only supported in the desktop app.' 
      };
    }
    
    // Delete existing mod folder if it exists
    await electronAPI.deleteDirectory(modDir);
    
    // Create directory structure
    await electronAPI.createDirectory(modDir);
    await electronAPI.createDirectory(scriptsDir);
    await electronAPI.createDirectory(vscriptsDir);
    
    // Create weapons directory if we have weapon files
    const weaponFiles = project.weaponFiles || [];
    if (weaponFiles.length > 0) {
      await electronAPI.createDirectory(weaponsDir);
    }
    
    // Create UI directories if we have UI files
    const uiFiles = project.uiFiles || [];
    const hasResFiles = uiFiles.some(f => f.fileType === 'res');
    const hasMenuFiles = uiFiles.some(f => f.fileType === 'menu');
    
    if (uiFiles.length > 0) {
      await electronAPI.createDirectory(resourceDir);
      await electronAPI.createDirectory(uiDir);
      if (hasMenuFiles) {
        await electronAPI.createDirectory(menusDir);
      }
    }
    
    // Create localization directory if we have localization files
    const localizationFiles = project.localizationFiles || [];
    const localizationDir = `${resourceDir}/localization`;
    
    if (localizationFiles.length > 0) {
      // Ensure resource directory exists (may not exist if no UI files)
      await electronAPI.createDirectory(resourceDir);
      await electronAPI.createDirectory(localizationDir);
    }
    
    // Create mod.vdf (pass localization files for auto-including paths)
    const vdfContent = generateModVdf(modSettings, localizationFiles);
    const vdfResult = await electronAPI.writeFile(`${modDir}/mod.vdf`, vdfContent);
    if (!vdfResult.success) {
      return { success: false, error: `Failed to write mod.vdf: ${vdfResult.error}` };
    }
    filesCreated.push(`${modDir}/mod.vdf`);
    
    // Generate and write script files
    for (const scriptFile of project.scriptFiles) {
      // Generate code for this script file (pass mod ID for correct init function names)
      const code = generateCode(scriptFile.nodes, scriptFile.connections, modSettings.modId);
      const codeWithMetadata = generateCodeMetadata(project.metadata) + code;
      
      // Optionally embed project data
      const finalCode = options.includeProjectData 
        ? embedProjectInCode(codeWithMetadata, project)
        : codeWithMetadata;
      
      // Determine file extension
      const fileName = scriptFile.name.endsWith('.nut') || scriptFile.name.endsWith('.gnut')
        ? scriptFile.name
        : `${scriptFile.name}.nut`;
      
      // Handle nested paths
      const filePath = `${vscriptsDir}/${fileName}`;
      
      // Create parent directories if needed
      const parentDir = filePath.substring(0, filePath.lastIndexOf('/'));
      if (parentDir !== vscriptsDir) {
        await electronAPI.createDirectory(parentDir);
      }
      
      // Write script file
      const writeResult = await electronAPI.writeFile(filePath, finalCode);
      if (!writeResult.success) {
        return { success: false, error: `Failed to write ${fileName}: ${writeResult.error}` };
      }
      filesCreated.push(filePath);
    }
    
    // Create scripts.rson
    const rsonContent = generateScriptsRson(project.scriptFiles);
    const rsonResult = await electronAPI.writeFile(`${vscriptsDir}/scripts.rson`, rsonContent);
    if (!rsonResult.success) {
      return { success: false, error: `Failed to write scripts.rson: ${rsonResult.error}` };
    }
    filesCreated.push(`${vscriptsDir}/scripts.rson`);
    
    // Generate and write weapon files
    for (const weaponFile of weaponFiles) {
      // Determine file name
      const fileName = weaponFile.name.endsWith('.txt')
        ? weaponFile.name
        : `${weaponFile.name}.txt`;
      
      // Handle nested paths
      const filePath = `${weaponsDir}/${fileName}`;
      
      // Create parent directories if needed
      const parentDir = filePath.substring(0, filePath.lastIndexOf('/'));
      if (parentDir !== weaponsDir) {
        await electronAPI.createDirectory(parentDir);
      }
      
      // Write weapon file
      const writeResult = await electronAPI.writeFile(filePath, weaponFile.content);
      if (!writeResult.success) {
        return { success: false, error: `Failed to write ${fileName}: ${writeResult.error}` };
      }
      filesCreated.push(filePath);
    }
    
    // Generate and write UI files
    for (const uiFile of uiFiles) {
      // Determine file name and target directory
      const isMenu = uiFile.fileType === 'menu';
      const extension = isMenu ? '.menu' : '.res';
      const fileName = uiFile.name.endsWith(extension)
        ? uiFile.name
        : `${uiFile.name}${extension}`;
      
      // Menu files go in resource/ui/menus/, res files go in resource/ui/
      const targetDir = isMenu ? menusDir : uiDir;
      
      // Handle nested paths
      const filePath = `${targetDir}/${fileName}`;
      
      // Create parent directories if needed
      const parentDir = filePath.substring(0, filePath.lastIndexOf('/'));
      if (parentDir !== targetDir) {
        await electronAPI.createDirectory(parentDir);
      }
      
      // Write UI file
      const writeResult = await electronAPI.writeFile(filePath, uiFile.content);
      if (!writeResult.success) {
        return { success: false, error: `Failed to write ${fileName}: ${writeResult.error}` };
      }
      filesCreated.push(filePath);
    }
    
    // Generate and write localization files
    for (const locFile of localizationFiles) {
      // Generate file name with language suffix: basename_language.txt
      const baseName = locFile.name.replace(/\.txt$/, '');
      const fileName = `${baseName}_${locFile.language}.txt`;
      
      // Serialize localization file content
      const content = serializeLocalizationFile(locFile);
      
      // Handle nested paths (localization files typically don't have nested paths, but support it)
      const filePath = `${localizationDir}/${fileName}`;
      
      // Create parent directories if needed
      const parentDir = filePath.substring(0, filePath.lastIndexOf('/'));
      if (parentDir !== localizationDir) {
        await electronAPI.createDirectory(parentDir);
      }
      
      // Write localization file
      const writeResult = await electronAPI.writeFile(filePath, content);
      if (!writeResult.success) {
        return { success: false, error: `Failed to write ${fileName}: ${writeResult.error}` };
      }
      filesCreated.push(filePath);
    }
    
    return {
      success: true,
      outputPath: modDir,
      filesCreated,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during compilation',
    };
  }
}

/**
 * Opens a directory picker for selecting output folder
 */
export async function selectOutputDirectory(): Promise<string | null> {
  if (!isTauri()) {
    console.error('Tauri API not available');
    return null;
  }
  
  return await electronAPI.selectDirectory();
}
