export interface VDFModData {
  name?: string;
  description?: string;
  version?: string;
  author?: string;
  requiredOnClient?: string;
  convars?: Record<string, string>;
  localization?: Record<string, string>;
}

export function parseVDF(content: string): VDFModData {
  const data: VDFModData = {
    convars: {},
    localization: {},
  };

  try {
    // Remove comments
    const lines = content.split('\n').map(line => {
      const commentIndex = line.indexOf('//');
      return commentIndex >= 0 ? line.substring(0, commentIndex) : line;
    });

    let inConvars = false;
    let inLocalization = false;

    for (const line of lines) {
      const trimmed = line.trim();
      
      // Skip empty lines and braces
      if (!trimmed || trimmed === '{' || trimmed === '}') {
        continue;
      }

      // Check for sections
      if (trimmed.toLowerCase().includes('convar')) {
        inConvars = true;
        inLocalization = false;
        continue;
      }
      if (trimmed.toLowerCase().includes('localization')) {
        inLocalization = true;
        inConvars = false;
        continue;
      }

      // Parse key-value pairs
      const match = trimmed.match(/"([^"]+)"\s+"([^"]*)"/);
      if (match) {
        const [, key, value] = match;
        const lowerKey = key.toLowerCase();

        if (inConvars) {
          data.convars![key] = value;
        } else if (inLocalization) {
          data.localization![key] = value;
        } else {
          // Main properties
          if (lowerKey === 'name') data.name = value;
          else if (lowerKey === 'description') data.description = value;
          else if (lowerKey === 'version') data.version = value;
          else if (lowerKey === 'author') data.author = value;
          else if (lowerKey === 'requiredonclient') data.requiredOnClient = value;
        }
      }
    }
  } catch (error) {
    console.error('VDF parsing error:', error);
  }

  return data;
}

export function serializeVDF(data: VDFModData, modId: string): string {
  let output = `"${modId}"\n{\n`;

  // Main properties
  if (data.name) output += `    "Name"              "${data.name}"\n`;
  if (data.description) output += `    "Description"       "${data.description}"\n`;
  if (data.version) output += `    "Version"           "${data.version}"\n`;
  if (data.author) output += `    "Author"            "${data.author}"\n`;
  if (data.requiredOnClient) output += `    "RequiredOnClient"  "${data.requiredOnClient}"\n`;

  // ConVars
  if (data.convars && Object.keys(data.convars).length > 0) {
    output += '\n    "ConVars"\n    {\n';
    for (const [key, value] of Object.entries(data.convars)) {
      output += `        "${key}"  "${value}"\n`;
    }
    output += '    }\n';
  }

  // Localization
  if (data.localization && Object.keys(data.localization).length > 0) {
    output += '\n    "Localization"\n    {\n';
    for (const [key, value] of Object.entries(data.localization)) {
      output += `        "${key}"  "${value}"\n`;
    }
    output += '    }\n';
  }

  output += '}\n';
  return output;
}
