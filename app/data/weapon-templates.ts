/**
 * Built-in weapon templates for common weapon types
 * These are based on Apex Legends weapon definitions
 */

export interface WeaponTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  baseWeapon: string;
  content: string;
}

export const WEAPON_TEMPLATES: WeaponTemplate[] = [
  // Assault Rifles
  {
    id: 'custom-assault-rifle',
    name: 'Custom Assault Rifle',
    description: 'A balanced assault rifle template based on the R-301',
    category: 'assault-rifles',
    baseWeapon: '_base_assault_rifle',
    content: `#base "_base_assault_rifle.txt"

WeaponData
{
    // General
    "printname"                   "#WPN_CUSTOM_AR"
    "shortprintname"              "#WPN_CUSTOM_AR_SHORT"
    "description"                 "#WPN_CUSTOM_AR_DESC"
    "longdesc"                    "#WPN_CUSTOM_AR_LONGDESC"
    
    "weapon_type_flags"           "WPT_PRIMARY"
    "fire_mode"                   "automatic"
    
    // Menu
    "menu_category"               "assault"
    "menu_anim_class"             "medium"
    
    // Models
    "viewmodel"                   "mdl/weapons/rspn101/ptpov_rspn101.rmdl"
    "playermodel"                 "mdl/weapons/rspn101/w_rspn101.rmdl"
    
    // Ammo
    "ammo_clip_size"              "28"
    "ammo_stockpile_max"          "280"
    
    // Damage
    "damage_near_value"           "14"
    "damage_far_value"            "14"
    "damage_very_far_value"       "14"
    
    // Behavior
    "fire_rate"                   "13.5"
    "reload_time"                 "2.4"
    "reloadempty_time"            "3.2"
    
    // Spread
    "spread_stand_hip"            "2.0"
    "spread_stand_ads"            "0.25"
    
    // View Kick
    "viewkick_pitch_base"         "1.0"
    "viewkick_yaw_base"           "0.5"
}
`
  },
  
  // SMGs
  {
    id: 'custom-smg',
    name: 'Custom SMG',
    description: 'A high fire-rate SMG template based on the R-99',
    category: 'smgs',
    baseWeapon: '_base_smg',
    content: `#base "_base_smg.txt"

WeaponData
{
    // General
    "printname"                   "#WPN_CUSTOM_SMG"
    "shortprintname"              "#WPN_CUSTOM_SMG_SHORT"
    "description"                 "#WPN_CUSTOM_SMG_DESC"
    
    "weapon_type_flags"           "WPT_PRIMARY"
    "fire_mode"                   "automatic"
    
    // Menu
    "menu_category"               "smg"
    
    // Models
    "viewmodel"                   "mdl/weapons/r97/ptpov_r97.rmdl"
    "playermodel"                 "mdl/weapons/r97/w_r97.rmdl"
    
    // Ammo
    "ammo_clip_size"              "20"
    "ammo_stockpile_max"          "180"
    
    // Damage
    "damage_near_value"           "11"
    "damage_far_value"            "11"
    "damage_very_far_value"       "11"
    
    // Behavior
    "fire_rate"                   "18"
    "reload_time"                 "1.8"
    "reloadempty_time"            "2.45"
    
    // Spread
    "spread_stand_hip"            "3.0"
    "spread_stand_ads"            "0.5"
}
`
  },
  
  // Snipers
  {
    id: 'custom-sniper',
    name: 'Custom Sniper',
    description: 'A powerful sniper rifle template based on the Longbow',
    category: 'snipers',
    baseWeapon: '_base_sniper',
    content: `#base "_base_sniper.txt"

WeaponData
{
    // General
    "printname"                   "#WPN_CUSTOM_SNIPER"
    "shortprintname"              "#WPN_CUSTOM_SNIPER_SHORT"
    "description"                 "#WPN_CUSTOM_SNIPER_DESC"
    
    "weapon_type_flags"           "WPT_PRIMARY"
    "fire_mode"                   "semi-auto"
    
    // Menu
    "menu_category"               "sniper"
    
    // Models
    "viewmodel"                   "mdl/weapons/dmr/ptpov_dmr.rmdl"
    "playermodel"                 "mdl/weapons/dmr/w_dmr.rmdl"
    
    // Ammo
    "ammo_clip_size"              "6"
    "ammo_stockpile_max"          "48"
    
    // Damage
    "damage_near_value"           "55"
    "damage_far_value"            "55"
    "damage_very_far_value"       "55"
    "damage_headshot_scale"       "2.15"
    
    // Behavior
    "fire_rate"                   "1.6"
    "reload_time"                 "2.66"
    "reloadempty_time"            "3.66"
    
    // Spread
    "spread_stand_ads"            "0.0"
    
    // Zoom
    "zoom_fov"                    "35"
}
`
  },
  
  // Shotguns
  {
    id: 'custom-shotgun',
    name: 'Custom Shotgun',
    description: 'A close-range shotgun template based on the EVA-8',
    category: 'shotguns',
    baseWeapon: '_base_shotgun',
    content: `#base "_base_shotgun.txt"

WeaponData
{
    // General
    "printname"                   "#WPN_CUSTOM_SHOTGUN"
    "shortprintname"              "#WPN_CUSTOM_SHOTGUN_SHORT"
    "description"                 "#WPN_CUSTOM_SHOTGUN_DESC"
    
    "weapon_type_flags"           "WPT_PRIMARY"
    "fire_mode"                   "automatic"
    
    // Menu
    "menu_category"               "shotgun"
    
    // Models
    "viewmodel"                   "mdl/weapons/shotgun/ptpov_shotgun.rmdl"
    "playermodel"                 "mdl/weapons/shotgun/w_shotgun.rmdl"
    
    // Ammo
    "ammo_clip_size"              "8"
    "ammo_stockpile_max"          "64"
    
    // Damage (per pellet, 9 pellets)
    "damage_near_value"           "7"
    "damage_far_value"            "7"
    "damage_very_far_value"       "4"
    
    // Pellet count
    "blast_pattern"               "shotgun_eva8"
    
    // Behavior
    "fire_rate"                   "2.0"
    "reload_time"                 "2.75"
    "reloadempty_time"            "2.75"
}
`
  },
  
  // Pistols
  {
    id: 'custom-pistol',
    name: 'Custom Pistol',
    description: 'A secondary pistol template based on the P2020',
    category: 'pistols',
    baseWeapon: '_base_handgun',
    content: `#base "_base_handgun.txt"

WeaponData
{
    // General
    "printname"                   "#WPN_CUSTOM_PISTOL"
    "shortprintname"              "#WPN_CUSTOM_PISTOL_SHORT"
    "description"                 "#WPN_CUSTOM_PISTOL_DESC"
    
    "weapon_type_flags"           "WPT_SECONDARY"
    "fire_mode"                   "semi-auto"
    
    // Menu
    "menu_category"               "pistol"
    
    // Models
    "viewmodel"                   "mdl/weapons/semipistol/ptpov_semipistol.rmdl"
    "playermodel"                 "mdl/weapons/semipistol/w_semipistol.rmdl"
    
    // Ammo
    "ammo_clip_size"              "18"
    "ammo_stockpile_max"          "72"
    
    // Damage
    "damage_near_value"           "18"
    "damage_far_value"            "18"
    "damage_very_far_value"       "18"
    
    // Behavior
    "fire_rate"                   "6.25"
    "reload_time"                 "1.25"
    "reloadempty_time"            "1.25"
}
`
  },
  
  // LMGs
  {
    id: 'custom-lmg',
    name: 'Custom LMG',
    description: 'A high-capacity LMG template based on the Spitfire',
    category: 'lmgs',
    baseWeapon: '_base_lmg',
    content: `#base "_base_lmg.txt"

WeaponData
{
    // General
    "printname"                   "#WPN_CUSTOM_LMG"
    "shortprintname"              "#WPN_CUSTOM_LMG_SHORT"
    "description"                 "#WPN_CUSTOM_LMG_DESC"
    
    "weapon_type_flags"           "WPT_PRIMARY"
    "fire_mode"                   "automatic"
    
    // Menu
    "menu_category"               "lmg"
    
    // Models
    "viewmodel"                   "mdl/weapons/lmg/ptpov_lmg.rmdl"
    "playermodel"                 "mdl/weapons/lmg/w_lmg.rmdl"
    
    // Ammo
    "ammo_clip_size"              "35"
    "ammo_stockpile_max"          "280"
    
    // Damage
    "damage_near_value"           "18"
    "damage_far_value"            "18"
    "damage_very_far_value"       "18"
    
    // Behavior
    "fire_rate"                   "9"
    "reload_time"                 "2.8"
    "reloadempty_time"            "3.33"
    
    // Spread (less accurate than AR)
    "spread_stand_hip"            "3.5"
    "spread_stand_ads"            "0.5"
}
`
  },
  
  // Abilities
  {
    id: 'custom-tactical',
    name: 'Custom Tactical Ability',
    description: 'A tactical ability template',
    category: 'abilities',
    baseWeapon: '_base_ability_tactical',
    content: `#base "_base_ability_tactical.txt"

WeaponData
{
    // General
    "printname"                   "#ABILITY_CUSTOM_TACTICAL"
    "shortprintname"              "#ABILITY_CUSTOM_TACTICAL_SHORT"
    "description"                 "#ABILITY_CUSTOM_TACTICAL_DESC"
    
    // Behavior
    "fire_mode"                   "offhand"
    "offhand_default_inventory_slot" "0"
    
    // Cooldown (30 seconds)
    "regen_ammo_refill_rate"      "0.033"
    "ammo_clip_size"              "1"
    "ammo_default_total"          "1"
    
    // Projectile (optional)
    // "projectile_launch_speed"   "2000"
    
    // VFX/SFX
    // "fire_sound_1_player_1p"    "Ability_Custom_Fire_1P"
    // "fire_sound_1_player_3p"    "Ability_Custom_Fire_3P"
}
`
  },
  
  {
    id: 'custom-ultimate',
    name: 'Custom Ultimate Ability',
    description: 'An ultimate ability template with longer cooldown',
    category: 'abilities',
    baseWeapon: '_base_ability_ultimate',
    content: `#base "_base_ability_ultimate.txt"

WeaponData
{
    // General
    "printname"                   "#ABILITY_CUSTOM_ULTIMATE"
    "shortprintname"              "#ABILITY_CUSTOM_ULTIMATE_SHORT"
    "description"                 "#ABILITY_CUSTOM_ULTIMATE_DESC"
    
    // Behavior
    "fire_mode"                   "offhand"
    "offhand_default_inventory_slot" "1"
    
    // Cooldown (180 seconds / 3 minutes)
    "regen_ammo_refill_rate"      "0.0055"
    "ammo_clip_size"              "1"
    "ammo_default_total"          "1"
    
    // Mark as ultimate
    "is_ultimate_ability"         "1"
}
`
  },
  
  // Melee
  {
    id: 'custom-melee',
    name: 'Custom Melee Weapon',
    description: 'A melee weapon template',
    category: 'melee',
    baseWeapon: '_base_melee',
    content: `#base "_base_melee.txt"

WeaponData
{
    // General
    "printname"                   "#WPN_CUSTOM_MELEE"
    "shortprintname"              "#WPN_CUSTOM_MELEE_SHORT"
    "description"                 "#WPN_CUSTOM_MELEE_DESC"
    
    // Melee properties
    "melee_damage"                "50"
    "melee_range"                 "75"
    "melee_attack_animtime"       "0.6"
    
    // Lunge
    "melee_lunge_target_range"    "128"
}
`
  },
];

// Group templates by category
export const WEAPON_TEMPLATE_CATEGORIES = [
  { id: 'assault-rifles', name: 'Assault Rifles', icon: '🔫' },
  { id: 'smgs', name: 'SMGs', icon: '💨' },
  { id: 'snipers', name: 'Snipers', icon: '🎯' },
  { id: 'shotguns', name: 'Shotguns', icon: '💥' },
  { id: 'pistols', name: 'Pistols', icon: '🔫' },
  { id: 'lmgs', name: 'LMGs', icon: '⚙️' },
  { id: 'abilities', name: 'Abilities', icon: '✨' },
  { id: 'melee', name: 'Melee', icon: '🗡️' },
];

export function getWeaponTemplatesByCategory(categoryId: string): WeaponTemplate[] {
  return WEAPON_TEMPLATES.filter(t => t.category === categoryId);
}

export function getWeaponTemplateById(id: string): WeaponTemplate | undefined {
  return WEAPON_TEMPLATES.find(t => t.id === id);
}
