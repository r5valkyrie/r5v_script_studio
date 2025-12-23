export interface WeaponTxtProperty {
  key: string;
  value: string | number;
  type: 'string' | 'number';
  section?: string;
  line?: number;
}

export interface WeaponTxtData {
  properties: WeaponTxtProperty[];
  sections: {
    general: Record<string, any>;
    damage: Record<string, any>;
    behavior: Record<string, any>;
    ammo: Record<string, any>;
    sounds: Record<string, any>;
    ui: Record<string, any>;
    models: Record<string, any>;
    npc: Record<string, any>;
    other: Record<string, any>;
  };
  basePaths: string[];
}

export function parseWeaponTxt(content: string): WeaponTxtData {
  const data: WeaponTxtData = {
    properties: [],
    sections: {
      general: {},
      damage: {},
      behavior: {},
      ammo: {},
      sounds: {},
      ui: {},
      models: {},
      npc: {},
      other: {},
    },
    basePaths: [],
  };

  const lines = content.split('\n');
  let currentSection = 'general';
  let inWeaponData = false;
  let braceCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('//')) continue;

    // Extract #base paths
    if (trimmed.startsWith('#base')) {
      const match = trimmed.match(/#base\s+"([^"]+)"/);
      if (match) {
        data.basePaths.push(match[1]);
      }
      continue;
    }

    // Track WeaponData section
    if (trimmed === 'WeaponData') {
      inWeaponData = true;
      continue;
    }

    // Track braces to know when we exit WeaponData
    if (trimmed === '{') {
      braceCount++;
      continue;
    }
    if (trimmed === '}') {
      braceCount--;
      if (braceCount === 0 && inWeaponData) {
        inWeaponData = false;
      }
      continue;
    }

    if (!inWeaponData) continue;

    // Parse key-value pairs
    const keyValueMatch = trimmed.match(/^"([^"]+)"\s+(.+)$/);
    if (keyValueMatch) {
      let [, key, valueStr] = keyValueMatch;
      
      // Remove trailing comment
      valueStr = valueStr.replace(/\/\/.*$/, '').trim();
      
      // Extract value from quotes if present
      const quotedMatch = valueStr.match(/^"([^"]*)"/);
      let value: string | number = quotedMatch ? quotedMatch[1] : valueStr;
      
      // Determine type
      let type: 'string' | 'number' = 'string';
      if (!quotedMatch && !isNaN(Number(value)) && value !== '') {
        value = Number(value);
        type = 'number';
      }

      // Categorize into sections
      const keyLower = key.toLowerCase();
      if (keyLower.includes('damage') || keyLower.includes('rodeo')) {
        currentSection = 'damage';
      } else if (
        keyLower.includes('fire_rate') ||
        keyLower.includes('reload') ||
        keyLower.includes('deploy') ||
        keyLower.includes('holster') ||
        keyLower.includes('zoom') ||
        keyLower.includes('burst') ||
        keyLower.includes('rest_time')
      ) {
        currentSection = 'behavior';
      } else if (
        keyLower.includes('ammo') ||
        keyLower.includes('clip') ||
        keyLower.includes('stockpile')
      ) {
        currentSection = 'ammo';
      } else if (keyLower.includes('sound') || keyLower.includes('fx_')) {
        currentSection = 'sounds';
      } else if (
        keyLower.includes('icon') ||
        keyLower.includes('menu') ||
        keyLower.includes('hud') ||
        keyLower.includes('stat_')
      ) {
        currentSection = 'ui';
      } else if (
        keyLower.includes('model') ||
        keyLower.includes('viewmodel') ||
        keyLower.includes('playermodel')
      ) {
        currentSection = 'models';
      } else if (keyLower.includes('npc') || keyLower.includes('proficiency')) {
        currentSection = 'npc';
      } else if (
        keyLower === 'printname' ||
        keyLower === 'shortprintname' ||
        keyLower === 'description' ||
        keyLower === 'longdesc' ||
        keyLower === 'weaponclass' ||
        keyLower === 'weaponsubclass' ||
        keyLower === 'weapontype' ||
        keyLower === 'fire_mode' ||
        keyLower === 'weapon_type_flags'
      ) {
        currentSection = 'general';
      } else if (!data.sections.general[key]) {
        currentSection = 'other';
      }

      // Store in sections
      data.sections[currentSection as keyof typeof data.sections][key] = value;

      // Store in flat properties list
      data.properties.push({
        key,
        value,
        type,
        section: currentSection,
        line: i + 1,
      });
    }
  }

  return data;
}

// Helper to get common editable properties
export function getEditableWeaponProperties(data: WeaponTxtData): WeaponTxtProperty[] {
  const editableKeys = [
    'printname',
    'shortprintname',
    'description',
    'damage_near_value',
    'damage_far_value',
    'damage_very_far_value',
    'fire_rate',
    'ammo_clip_size',
    'ammo_stockpile_max',
    'reload_time',
    'reloadempty_time',
    'projectile_launch_speed',
    'damage_leg_scale',
    'damage_headshot_scale',
  ];

  return data.properties.filter(prop => 
    editableKeys.some(key => prop.key.toLowerCase() === key.toLowerCase())
  );
}

export function serializeWeaponTxt(data: WeaponTxtData, originalContent: string): string {
  let result = originalContent;

  // Update each property value in the original content
  for (const prop of data.properties) {
    // Create regex to find and replace the specific line
    const quotedValue = typeof prop.value === 'string' ? `"${prop.value}"` : prop.value;
    const searchPattern = new RegExp(
      `("${prop.key}"\\s+)([^\\n]+)`,
      'g'
    );
    
    // Replace with updated value, preserving formatting
    result = result.replace(searchPattern, (match, prefix) => {
      if (typeof prop.value === 'number') {
        return `${prefix}${prop.value}`;
      } else {
        return `${prefix}"${prop.value}"`;
      }
    });
  }

  return result;
}
