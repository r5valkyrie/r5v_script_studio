import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ChevronRight, ChevronDown, Crosshair, Copy, Code, Eye, Search, RotateCcw, Plus, X, Settings, Zap, Box, Volume2, Sparkles, Target, Palette, Brain, Layers, Wand2, Trash2 } from 'lucide-react';
import type { WeaponFile } from '../../types/project';
import { VIEWKICK_PATTERNS, VIEWKICK_PATTERN_OPTIONS } from '../../data/viewkick-patterns';

interface WeaponEditorProps {
  weaponFile: WeaponFile | null;
  onContentChange: (fileId: string, content: string) => void;
  isModified?: boolean;
  accentColor?: string;
}

// Property definition type
interface PropertyDef {
  key: string;
  label: string;
  type: 'string' | 'number' | 'select';
  description?: string;
  options?: string[];
  step?: number;
}

interface CategoryDef {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  properties: PropertyDef[];
}

// Special blocks that can be added
interface SpecialBlockDef {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  template: string;
}

const SPECIAL_BLOCKS: SpecialBlockDef[] = [
  {
    id: 'mods',
    name: 'Mods',
    description: 'Weapon modifications and attachments',
    icon: <Wand2 size={14} />,
    template: `\tMods
\t{
\t\tgold
\t\t{
\t\t}

\t\tsurvival_finite_ammo
\t\t{
\t\t\t"uses_ammo_pool"\t\t\t\t"1"
\t\t}
\t}`
  },
  {
    id: 'rui_crosshair',
    name: 'RUI_CrosshairData',
    description: 'Crosshair configuration and UI',
    icon: <Target size={14} />,
    template: `\tRUI_CrosshairData
\t{
\t\tDefaultArgs
\t\t{
\t\t\tadjustedSpread\t\tweapon_spread
\t\t\tadsFrac\t\t\t\tplayer_zoomFrac
\t\t\tisSprinting\t\t\tplayer_is_sprinting
\t\t\tisReloading\t\t\tweapon_is_reloading
\t\t\tteamColor\t\t\tcrosshair_team_color
\t\t\tisAmped\t\t\t\tweapon_is_amped
\t\t\tcrosshairMovementX\tcrosshair_movement_x
\t\t\tcrosshairMovementY\tcrosshair_movement_y
\t\t}

\t\tCrosshair_1
\t\t{
\t\t\t"ui"\t\t\t"ui/crosshair_plus_dot"
\t\t\t"base_spread"\t"0"

\t\t\tArgs
\t\t\t{
\t\t\t\tisFiring\tweapon_is_firing
\t\t\t}
\t\t}
\t}`
  },
  {
    id: 'uidata1',
    name: 'UiData1',
    description: 'Primary weapon UI element',
    icon: <Layers size={14} />,
    template: `\t"ui1_enable"\t\t\t\t\t\t\t\t   "1"
\t"ui1_draw_cloaked"\t\t\t\t\t\t\t   "1"
\tUiData1
\t{
\t\t"ui"\t\t\t\t\t\t\t"ui/weapon_hud"
\t\t"mesh"\t\t\t\t\t\t  "models/weapons/attachments/weapon_rui_reticle"

\t\tArgs
\t\t{
\t\t\tvis\t\t\t\t\t\tplayer_zoomfrac
\t\t\tammo\t\t\t\t\tweapon_ammo
\t\t\tclipSize\t\t\t\tweapon_clipSize
\t\t}
\t}`
  },
  {
    id: 'uidata2',
    name: 'UiData2',
    description: 'Secondary weapon UI element',
    icon: <Layers size={14} />,
    template: `\t"ui2_enable"\t\t\t\t\t\t\t\t   "1"
\t"ui2_draw_cloaked"\t\t\t\t\t\t\t   "1"
\tUiData2
\t{
\t\t"ui"\t\t\t\t\t\t\t"ui/ammo_counter"
\t\t"mesh"\t\t\t\t\t\t  "models/weapons/attachments/weapon_rui_ammo"

\t\tArgs
\t\t{
\t\t\t"vis"\t\t\t"player_zoomfrac"
\t\t\t"ammo"\t\t  "weapon_ammo"
\t\t\t"clipSize"  "weapon_clipSize"
\t\t}
\t}`
  }
];

// Property categories with their key patterns and editable properties
const PROPERTY_CATEGORIES: CategoryDef[] = [
  {
    id: 'general',
    name: 'General',
    icon: <Settings size={14} />,
    description: 'Basic weapon info and identification',
    properties: [
      { key: 'printname', label: 'Display Name', type: 'string', description: 'Localization key for weapon name' },
      { key: 'shortprintname', label: 'Short Name', type: 'string', description: 'Abbreviated name for HUD' },
      { key: 'description', label: 'Description', type: 'string', description: 'Localization key for description' },
      { key: 'longdesc', label: 'Long Description', type: 'string', description: 'Extended description text' },
      { key: 'weapon_type_flags', label: 'Weapon Type', type: 'select', options: ['WPT_PRIMARY', 'WPT_SECONDARY', 'WPT_SIDEARM'], description: 'Primary, secondary, or sidearm' },
      { key: 'fire_mode', label: 'Fire Mode', type: 'select', options: ['automatic', 'semi-auto', 'burst', 'offhand', 'offhandHybrid'], description: 'How the weapon fires' },
      { key: 'is_semi_auto', label: 'Semi-Auto Only', type: 'select', options: ['0', '1'], description: 'Force semi-auto fire mode' },
      { key: 'ammo_pool_type', label: 'Ammo Type', type: 'select', options: ['bullet', 'special', 'highcal', 'shotgun', 'sniper', 'arrow', 'rocket'], description: 'Type of ammunition' },
      { key: 'menu_category', label: 'Menu Category', type: 'string', description: 'Category for menu (ar, smg, sniper, etc.)' },
      { key: 'menu_anim_class', label: 'Anim Class', type: 'select', options: ['small', 'medium', 'large'], description: 'Animation class for weapon' },
      { key: 'stat_damage', label: 'Stat Damage', type: 'number', description: 'Menu stat display for damage' },
      { key: 'stat_range', label: 'Stat Range', type: 'number', description: 'Menu stat display for range' },
      { key: 'stat_accuracy', label: 'Stat Accuracy', type: 'number', description: 'Menu stat display for accuracy' },
      { key: 'stat_rof', label: 'Stat ROF', type: 'number', description: 'Menu stat display for fire rate' },
      { key: 'holster_type', label: 'Holster Type', type: 'string', description: 'Holster slot type (rifle, pistol, etc.)' },
    ]
  },
  {
    id: 'damage',
    name: 'Damage',
    icon: <Zap size={14} />,
    description: 'Damage values and multipliers',
    properties: [
      { key: 'damage_near_value', label: 'Near Damage', type: 'number', description: 'Damage at close range' },
      { key: 'damage_far_value', label: 'Far Damage', type: 'number', description: 'Damage at medium range' },
      { key: 'damage_very_far_value', label: 'Very Far Damage', type: 'number', description: 'Damage at long range' },
      { key: 'damage_near_value_titanarmor', label: 'Near Damage (Titan)', type: 'number', description: 'Damage vs titan armor at close range' },
      { key: 'damage_far_value_titanarmor', label: 'Far Damage (Titan)', type: 'number', description: 'Damage vs titan armor at range' },
      { key: 'damage_very_far_value_titanarmor', label: 'Very Far Damage (Titan)', type: 'number', description: 'Damage vs titan armor at long range' },
      { key: 'damage_near_distance', label: 'Near Distance', type: 'number', description: 'Distance for near damage falloff' },
      { key: 'damage_far_distance', label: 'Far Distance', type: 'number', description: 'Distance for far damage falloff' },
      { key: 'damage_very_far_distance', label: 'Very Far Distance', type: 'number', description: 'Distance for very far damage falloff' },
      { key: 'damage_headshot_scale', label: 'Headshot Multiplier', type: 'number', step: 0.01, description: 'Damage multiplier for headshots' },
      { key: 'damage_leg_scale', label: 'Leg Multiplier', type: 'number', step: 0.01, description: 'Damage multiplier for leg shots' },
      { key: 'damage_shield_scale', label: 'Shield Multiplier', type: 'number', step: 0.01, description: 'Damage multiplier vs shields' },
      { key: 'critical_hit', label: 'Critical Hits', type: 'select', options: ['0', '1'], description: 'Enable critical hit damage' },
      { key: 'critical_hit_damage_scale', label: 'Critical Multiplier', type: 'number', step: 0.1, description: 'Critical hit damage multiplier' },
      { key: 'titanarmor_critical_hit_required', label: 'Titan Crit Required', type: 'select', options: ['0', '1'], description: 'Require critical hit for titan damage' },
      { key: 'damage_rodeo', label: 'Rodeo Damage', type: 'number', description: 'Damage when rodeoing titans' },
      { key: 'damage_flags', label: 'Damage Flags', type: 'string', description: 'Special damage flags (DF_BULLET, etc.)' },
      { key: 'headshot_distance', label: 'Headshot Distance', type: 'number', description: 'Max distance for headshots' },
    ]
  },
  {
    id: 'ammo',
    name: 'Ammo & Reload',
    icon: <Box size={14} />,
    description: 'Magazine size and reload timing',
    properties: [
      { key: 'ammo_clip_size', label: 'Magazine Size', type: 'number', description: 'Rounds per magazine' },
      { key: 'ammo_stockpile_max', label: 'Max Reserve', type: 'number', description: 'Maximum reserve ammo' },
      { key: 'ammo_default_total', label: 'Starting Ammo', type: 'number', description: 'Initial ammo on pickup' },
      { key: 'ammo_min_to_fire', label: 'Min to Fire', type: 'number', description: 'Minimum ammo required to fire' },
      { key: 'low_ammo_fraction', label: 'Low Ammo %', type: 'number', step: 0.01, description: 'Fraction for low ammo warning' },
      { key: 'reload_time', label: 'Reload Time', type: 'number', step: 0.01, description: 'Tactical reload time (seconds)' },
      { key: 'reload_time_late1', label: 'Reload Late 1', type: 'number', step: 0.01, description: 'Tactical reload late animation time' },
      { key: 'reloadempty_time', label: 'Empty Reload', type: 'number', step: 0.01, description: 'Full reload time (seconds)' },
      { key: 'reloadempty_time_late1', label: 'Empty Reload Late 1', type: 'number', step: 0.01, description: 'Full reload late animation time 1' },
      { key: 'reloadempty_time_late2', label: 'Empty Reload Late 2', type: 'number', step: 0.01, description: 'Full reload late animation time 2' },
      { key: 'rechamber_time', label: 'Rechamber Time', type: 'number', step: 0.01, description: 'Time to rechamber after fire' },
      { key: 'ammo_no_remove_from_stockpile', label: 'No Remove Stockpile', type: 'select', options: ['0', '1'], description: 'Do not remove ammo from stockpile' },
      { key: 'uses_ammo_pool', label: 'Uses Ammo Pool', type: 'select', options: ['0', '1'], description: 'Use shared ammo pool' },
      { key: 'reload_enabled', label: 'Reload Enabled', type: 'select', options: ['0', '1'], description: 'Allow reloading' },
      { key: 'allow_empty_click', label: 'Allow Empty Click', type: 'select', options: ['0', '1'], description: 'Click sound when empty' },
      { key: 'empty_reload_only', label: 'Empty Reload Only', type: 'select', options: ['0', '1'], description: 'Only allow empty reloads' },
      { key: 'ammo_per_shot', label: 'Ammo Per Shot', type: 'number', description: 'Ammo consumed per shot' },
      { key: 'reload_is_segmented', label: 'Segmented Reload', type: 'select', options: ['0', '1'], description: 'Reload is done in segments' },
      { key: 'ammo_suck_behavior', label: 'Ammo Suck Behavior', type: 'string', description: 'How ammo is pulled from pool' },
    ]
  },
  {
    id: 'behavior',
    name: 'Fire Behavior',
    icon: <Crosshair size={14} />,
    description: 'Fire rate, burst, and projectile settings',
    properties: [
      { key: 'fire_rate', label: 'Fire Rate', type: 'number', step: 0.1, description: 'Rounds per second' },
      { key: 'projectile_launch_speed', label: 'Bullet Speed', type: 'number', description: 'Projectile velocity' },
      { key: 'projectile_lifetime', label: 'Projectile Lifetime', type: 'number', step: 0.1, description: 'How long projectile lasts (seconds)' },
      { key: 'projectile_gravity_scale', label: 'Projectile Gravity', type: 'number', step: 0.1, description: 'Gravity effect on projectile' },
      { key: 'projectiles_per_shot', label: 'Projectiles Per Shot', type: 'number', description: 'Pellets per shot (shotguns)' },
      { key: 'impulse_force', label: 'Impulse Force', type: 'number', description: 'Force applied to hit target' },
      { key: 'zoom_fov', label: 'ADS FOV', type: 'number', description: 'Field of view when aiming' },
      { key: 'zoom_toggle_fov', label: 'Toggle Zoom FOV', type: 'number', description: 'FOV for zoom toggle' },
      { key: 'zoom_time_in', label: 'ADS Time In', type: 'number', step: 0.01, description: 'Time to aim down sights' },
      { key: 'zoom_time_out', label: 'ADS Time Out', type: 'number', step: 0.01, description: 'Time to exit ADS' },
      { key: 'zoom_toggle_lerp_time', label: 'Toggle Lerp Time', type: 'number', step: 0.01, description: 'Time to lerp between zoom levels' },
      { key: 'ads_move_speed_scale', label: 'ADS Move Scale', type: 'number', step: 0.1, description: 'Movement speed multiplier while ADS' },
      { key: 'burst_fire_count', label: 'Burst Count', type: 'number', description: 'Shots per burst' },
      { key: 'burst_fire_delay', label: 'Burst Delay', type: 'number', step: 0.01, description: 'Delay between burst shots' },
      { key: 'deploy_time', label: 'Deploy Time', type: 'number', step: 0.01, description: 'Time to deploy weapon' },
      { key: 'deployfirst_time', label: 'First Deploy Time', type: 'number', step: 0.01, description: 'Time for first deploy' },
      { key: 'raise_time', label: 'Raise Time', type: 'number', step: 0.01, description: 'Time to raise weapon' },
      { key: 'lower_time', label: 'Lower Time', type: 'number', step: 0.01, description: 'Time to lower weapon' },
      { key: 'holster_time', label: 'Holster Time', type: 'number', step: 0.01, description: 'Time to holster weapon' },
      { key: 'allow_empty_fire', label: 'Allow Empty Fire', type: 'select', options: ['0', '1'], description: 'Fire even when empty' },
      { key: 'allow_headshots', label: 'Allow Headshots', type: 'select', options: ['0', '1'], description: 'Enable headshot damage' },
      { key: 'primary_fire_does_not_block_sprint', label: 'Fire No Block Sprint', type: 'select', options: ['0', '1'], description: 'Fire does not block sprinting' },
    ]
  },
  {
    id: 'spread',
    name: 'Spread',
    icon: <Target size={14} />,
    description: 'Hipfire and ADS spread settings',
    properties: [
      { key: 'spread_stand_hip', label: 'Hip Spread (Standing)', type: 'number', step: 0.1, description: 'Hipfire spread while standing' },
      { key: 'spread_stand_hip_run', label: 'Hip Spread (Running)', type: 'number', step: 0.1, description: 'Hipfire spread while running' },
      { key: 'spread_stand_hip_sprint', label: 'Hip Spread (Sprinting)', type: 'number', step: 0.1, description: 'Hipfire spread while sprinting' },
      { key: 'spread_crouch_hip', label: 'Hip Spread (Crouching)', type: 'number', step: 0.1, description: 'Hipfire spread while crouching' },
      { key: 'spread_air_hip', label: 'Hip Spread (Air)', type: 'number', step: 0.1, description: 'Hipfire spread in air' },
      { key: 'spread_stand_ads', label: 'ADS Spread (Standing)', type: 'number', step: 0.1, description: 'Spread while aiming standing' },
      { key: 'spread_crouch_ads', label: 'ADS Spread (Crouching)', type: 'number', step: 0.1, description: 'Spread while aiming crouching' },
      { key: 'spread_air_ads', label: 'ADS Spread (Air)', type: 'number', step: 0.1, description: 'Spread while aiming in air' },
      { key: 'spread_decay_rate', label: 'Spread Decay Rate', type: 'number', description: 'How fast spread decreases' },
      { key: 'spread_decay_delay', label: 'Spread Decay Delay', type: 'number', step: 0.01, description: 'Delay before spread decays' },
      { key: 'spread_moving_increase_rate', label: 'Move Increase Rate', type: 'number', description: 'Spread increase rate when moving' },
      { key: 'spread_moving_decay_rate', label: 'Move Decay Rate', type: 'number', description: 'Spread decay rate when moving' },
      { key: 'spread_kick_on_fire_stand_hip', label: 'Kick Fire Stand', type: 'number', step: 0.1, description: 'Spread kick on fire standing hip' },
      { key: 'spread_kick_on_fire_crouch_hip', label: 'Kick Fire Crouch', type: 'number', step: 0.1, description: 'Spread kick on fire crouching hip' },
      { key: 'spread_kick_on_fire_air_hip', label: 'Kick Fire Air', type: 'number', step: 0.1, description: 'Spread kick on fire in air' },
      { key: 'spread_max_kick_stand_hip', label: 'Max Kick Stand', type: 'number', step: 0.1, description: 'Maximum spread kick standing hip' },
      { key: 'spread_max_kick_crouch_hip', label: 'Max Kick Crouch', type: 'number', step: 0.1, description: 'Maximum spread kick crouching hip' },
      { key: 'spread_max_kick_air_hip', label: 'Max Kick Air', type: 'number', step: 0.1, description: 'Maximum spread kick in air' },
    ]
  },
  {
    id: 'recoil',
    name: 'Recoil',
    icon: <Zap size={14} />,
    description: 'View kick and recoil patterns',
    properties: [
      { key: 'viewkick_pattern', label: 'Recoil Pattern', type: 'select', options: VIEWKICK_PATTERN_OPTIONS, description: 'Named recoil pattern to use' },
      { key: 'viewkick_spring', label: 'Recoil Spring', type: 'string', description: 'Recoil spring curve name' },
      { key: 'viewkick_pitch_base', label: 'Pitch Base', type: 'number', step: 0.1, description: 'Base vertical recoil' },
      { key: 'viewkick_pitch_random', label: 'Pitch Random', type: 'number', step: 0.1, description: 'Random vertical variation' },
      { key: 'viewkick_pitch_softScale', label: 'Pitch Soft Scale', type: 'number', step: 0.1, description: 'Soft scale for pitch' },
      { key: 'viewkick_pitch_hardScale', label: 'Pitch Hard Scale', type: 'number', step: 0.1, description: 'Hard scale for pitch' },
      { key: 'viewkick_yaw_base', label: 'Yaw Base', type: 'number', step: 0.1, description: 'Base horizontal recoil' },
      { key: 'viewkick_yaw_random', label: 'Yaw Random', type: 'number', step: 0.1, description: 'Random horizontal variation' },
      { key: 'viewkick_yaw_random_innerexclude', label: 'Yaw Inner Exclude', type: 'number', step: 0.01, description: 'Inner exclusion for yaw random' },
      { key: 'viewkick_yaw_softScale', label: 'Yaw Soft Scale', type: 'number', step: 0.1, description: 'Soft scale for yaw' },
      { key: 'viewkick_yaw_hardScale', label: 'Yaw Hard Scale', type: 'number', step: 0.1, description: 'Hard scale for yaw' },
      { key: 'viewkick_roll_base', label: 'Roll Base', type: 'number', step: 0.1, description: 'Base roll recoil' },
      { key: 'viewkick_roll_randomMin', label: 'Roll Min', type: 'number', step: 0.1, description: 'Minimum roll random' },
      { key: 'viewkick_roll_randomMax', label: 'Roll Max', type: 'number', step: 0.1, description: 'Maximum roll random' },
      { key: 'viewkick_roll_softScale', label: 'Roll Soft Scale', type: 'number', step: 0.1, description: 'Soft scale for roll' },
      { key: 'viewkick_roll_hardScale', label: 'Roll Hard Scale', type: 'number', step: 0.1, description: 'Hard scale for roll' },
      { key: 'viewkick_hipfire_weaponFraction', label: 'Hipfire Fraction', type: 'number', step: 0.1, description: 'Recoil fraction for hipfire' },
      { key: 'viewkick_ads_weaponFraction', label: 'ADS Fraction', type: 'number', step: 0.1, description: 'Recoil fraction for ADS' },
      { key: 'viewkick_air_scale_ads', label: 'Air Scale ADS', type: 'number', step: 0.1, description: 'Recoil scale multiplier for air' },
      { key: 'viewkick_scale_firstshot_hipfire', label: 'First Shot Hip', type: 'number', step: 0.1, description: 'First shot scale hipfire' },
      { key: 'viewkick_scale_firstshot_ads', label: 'First Shot ADS', type: 'number', step: 0.1, description: 'First shot scale ADS' },
      { key: 'viewkick_scale_min_hipfire', label: 'Min Scale Hip', type: 'number', step: 0.1, description: 'Minimum scale hipfire' },
      { key: 'viewkick_scale_max_hipfire', label: 'Max Scale Hip', type: 'number', step: 0.1, description: 'Maximum scale hipfire' },
      { key: 'viewkick_scale_min_ads', label: 'Min Scale ADS', type: 'number', step: 0.1, description: 'Minimum scale ADS' },
      { key: 'viewkick_scale_max_ads', label: 'Max Scale ADS', type: 'number', step: 0.1, description: 'Maximum scale ADS' },
      { key: 'viewkick_scale_valuePerShot', label: 'Scale Value Per Shot', type: 'number', step: 0.01, description: 'Scale increase per shot' },
      { key: 'viewkick_scale_pitch_valueLerpStart', label: 'Pitch Lerp Start', type: 'number', step: 0.1, description: 'Pitch scale lerp start' },
      { key: 'viewkick_scale_pitch_valueLerpEnd', label: 'Pitch Lerp End', type: 'number', step: 0.1, description: 'Pitch scale lerp end' },
      { key: 'viewkick_scale_yaw_valueLerpStart', label: 'Yaw Lerp Start', type: 'number', step: 0.1, description: 'Yaw scale lerp start' },
      { key: 'viewkick_scale_yaw_valueLerpEnd', label: 'Yaw Lerp End', type: 'number', step: 0.1, description: 'Yaw scale lerp end' },
      { key: 'viewkick_scale_valueDecayDelay', label: 'Scale Decay Delay', type: 'number', step: 0.01, description: 'Delay before scale decay' },
      { key: 'viewkick_scale_valueDecayRate', label: 'Scale Decay Rate', type: 'number', description: 'Rate of scale decay' },
    ]
  },
  {
    id: 'viewmodel',
    name: 'Viewmodel',
    icon: <Eye size={14} />,
    description: 'Viewmodel offsets, shake, and attachments',
    properties: [
      { key: 'viewmodel', label: 'Viewmodel', type: 'string', description: 'First-person weapon model' },
      { key: 'playermodel', label: 'Playermodel', type: 'string', description: 'Third-person weapon model' },
      { key: 'viewmodel_offset_hip', label: 'Offset Hip', type: 'string', description: 'Viewmodel offset when hipfiring (x y z)' },
      { key: 'viewmodel_offset_ads', label: 'Offset ADS', type: 'string', description: 'Viewmodel offset when aiming (x y z)' },
      { key: 'viewmodel_shake_forward', label: 'Shake Forward', type: 'number', step: 0.1, description: 'Viewmodel shake forward amount' },
      { key: 'viewmodel_shake_up', label: 'Shake Up', type: 'number', step: 0.1, description: 'Viewmodel shake up amount' },
      { key: 'viewmodel_shake_right', label: 'Shake Right', type: 'number', step: 0.1, description: 'Viewmodel shake right amount' },
      { key: 'viewmodel_ads_rui_bottomleft_attachment', label: 'RUI BL Attachment', type: 'string', description: 'RUI bottom left attachment point' },
      { key: 'viewmodel_ads_centerpoint_attachment', label: 'RUI Center Attachment', type: 'string', description: 'RUI center attachment point' },
      { key: 'holster_offset', label: 'Holster Offset', type: 'string', description: 'Offset when holstered' },
    ]
  },
  {
    id: 'ui',
    name: 'UI & Icons',
    icon: <Palette size={14} />,
    description: 'Menu icons, HUD icons, and RUI',
    properties: [
      { key: 'menu_icon', label: 'Menu Icon', type: 'string', description: 'Icon shown in menus' },
      { key: 'hud_icon', label: 'HUD Icon', type: 'string', description: 'Icon shown in HUD' },
      { key: 'rui_crosshair_index', label: 'Crosshair Index', type: 'number', description: 'RUI crosshair index' },
      { key: 'active_crosshair_count', label: 'Crosshair Count', type: 'number', description: 'Number of crosshairs' },
      { key: 'red_crosshair_range', label: 'Red Crosshair Range', type: 'number', description: 'Range for red crosshair indicator' },
    ]
  },
  {
    id: 'sounds',
    name: 'Sounds',
    icon: <Volume2 size={14} />,
    description: 'Audio events and sound effects',
    properties: [
      { key: 'fire_sound_1_player_1p', label: 'Fire Sound 1P', type: 'string', description: 'First-person fire sound' },
      { key: 'fire_sound_2_player_1p', label: 'Fire Sound 2 1P', type: 'string', description: 'Second first-person fire sound' },
      { key: 'fire_sound_1_player_3p', label: 'Fire Sound 3P', type: 'string', description: 'Third-person fire sound' },
      { key: 'fire_sound_2_player_3p', label: 'Fire Sound 2 3P', type: 'string', description: 'Second third-person fire sound' },
      { key: 'fire_sound_partial_burst_player_1p', label: 'Burst Sound 1P', type: 'string', description: 'Burst fire sound 1P' },
      { key: 'sound_dryfire', label: 'Dryfire Sound', type: 'string', description: 'Sound when out of ammo' },
      { key: 'sound_pickup', label: 'Pickup Sound', type: 'string', description: 'Sound when picking up weapon' },
      { key: 'sound_zoom_in', label: 'Zoom In Sound', type: 'string', description: 'Sound when aiming in' },
      { key: 'sound_zoom_out', label: 'Zoom Out Sound', type: 'string', description: 'Sound when aiming out' },
      { key: 'sound_trigger_pull', label: 'Trigger Pull Sound', type: 'string', description: 'Sound when pulling trigger' },
      { key: 'looping_sounds', label: 'Looping Fire', type: 'select', options: ['0', '1'], description: 'Use looping fire sounds' },
      { key: 'low_ammo_sound_name_1', label: 'Low Ammo Sound', type: 'string', description: 'Low ammo warning sound' },
      { key: 'fire_rumble', label: 'Fire Rumble', type: 'string', description: 'Controller rumble on fire' },
      { key: 'burst_or_looping_fire_sound_start_1p', label: 'Loop Start 1P', type: 'string', description: 'Looping fire start sound 1P' },
      { key: 'burst_or_looping_fire_sound_middle_1p', label: 'Loop Middle 1P', type: 'string', description: 'Looping fire middle sound 1P' },
      { key: 'burst_or_looping_fire_sound_end_1p', label: 'Loop End 1P', type: 'string', description: 'Looping fire end sound 1P' },
    ]
  },
  {
    id: 'fx',
    name: 'Effects',
    icon: <Sparkles size={14} />,
    description: 'Visual effects and impacts',
    properties: [
      { key: 'fx_muzzle_flash_view', label: 'Muzzle Flash View', type: 'string', description: 'First-person muzzle flash effect' },
      { key: 'fx_muzzle_flash_world', label: 'Muzzle Flash World', type: 'string', description: 'Third-person muzzle flash effect' },
      { key: 'fx_muzzle_flash_attach', label: 'Muzzle Flash Attach', type: 'string', description: 'Muzzle flash attachment point' },
      { key: 'fx_shell_eject_view', label: 'Shell Eject View', type: 'string', description: 'First-person shell eject effect' },
      { key: 'fx_shell_eject_world', label: 'Shell Eject World', type: 'string', description: 'Third-person shell eject effect' },
      { key: 'fx_shell_eject_attach', label: 'Shell Eject Attach', type: 'string', description: 'Shell eject attachment point' },
      { key: 'tracer_effect', label: 'Tracer Effect', type: 'string', description: 'Projectile tracer effect' },
      { key: 'impact_effect_table', label: 'Impact Effect', type: 'string', description: 'Impact effect table name' },
      { key: 'projectile_trail_effect_0', label: 'Trail Effect', type: 'string', description: 'Projectile trail effect' },
      { key: 'chroma_color', label: 'Chroma Color', type: 'string', description: 'Weapon chroma color (r g b)' },
    ]
  },
  {
    id: 'npc',
    name: 'NPC Settings',
    icon: <Brain size={14} />,
    description: 'AI and NPC behavior',
    properties: [
      { key: 'npc_damage_near_value', label: 'NPC Near Damage', type: 'number', description: 'Damage when used by NPCs' },
      { key: 'npc_damage_far_value', label: 'NPC Far Damage', type: 'number', description: 'NPC damage at range' },
      { key: 'npc_damage_near_value_titanarmor', label: 'NPC Near Damage Titan', type: 'number', description: 'NPC damage vs titan armor near' },
      { key: 'npc_damage_far_value_titanarmor', label: 'NPC Far Damage Titan', type: 'number', description: 'NPC damage vs titan armor far' },
      { key: 'npc_max_range', label: 'NPC Max Range', type: 'number', description: 'Maximum NPC engagement range' },
      { key: 'npc_min_engage_range', label: 'NPC Min Engage', type: 'number', description: 'Minimum NPC engagement range' },
      { key: 'npc_max_engage_range', label: 'NPC Max Engage', type: 'number', description: 'Maximum NPC engagement range' },
      { key: 'npc_min_engage_range_heavy_armor', label: 'NPC Min Engage Heavy', type: 'number', description: 'NPC min range vs heavy armor' },
      { key: 'npc_max_engage_range_heavy_armor', label: 'NPC Max Engage Heavy', type: 'number', description: 'NPC max range vs heavy armor' },
      { key: 'npc_min_burst', label: 'NPC Min Burst', type: 'number', description: 'Minimum shots per burst' },
      { key: 'npc_max_burst', label: 'NPC Max Burst', type: 'number', description: 'Maximum shots per burst' },
      { key: 'npc_rest_time_between_bursts_min', label: 'NPC Burst Rest Min', type: 'number', step: 0.1, description: 'Min rest between bursts' },
      { key: 'npc_rest_time_between_bursts_max', label: 'NPC Burst Rest Max', type: 'number', step: 0.1, description: 'Max rest between bursts' },
      { key: 'proficiency_poor_spreadscale', label: 'NPC Poor Spread', type: 'number', description: 'Spread scale for poor proficiency' },
      { key: 'proficiency_average_spreadscale', label: 'NPC Avg Spread', type: 'number', description: 'Spread scale for average proficiency' },
      { key: 'proficiency_good_spreadscale', label: 'NPC Good Spread', type: 'number', description: 'Spread scale for good proficiency' },
      { key: 'proficiency_very_good_spreadscale', label: 'NPC VGood Spread', type: 'number', description: 'Spread scale for very good proficiency' },
      { key: 'proficiency_perfect_spreadscale', label: 'NPC Perfect Spread', type: 'number', description: 'Spread scale for perfect proficiency' },
    ]
  },
  {
    id: 'advanced',
    name: 'Advanced',
    icon: <Settings size={14} />,
    description: 'Advanced settings and gameplay modifiers',
    properties: [
      { key: 'damage_type', label: 'Damage Type', type: 'string', description: 'Type of damage (bullet, etc.)' },
      { key: 'pass_through_depth', label: 'Pass Through Depth', type: 'number', description: 'How far projectile passes through' },
      { key: 'pass_through_damage_preserved_scale', label: 'Pass Through Scale', type: 'number', step: 0.1, description: 'Damage preserved on pass through' },
      { key: 'disable_zoomed_rechamber', label: 'Disable Zoom Rechamber', type: 'select', options: ['0', '1'], description: 'Disable rechamber while zoomed' },
      { key: 'trigger_snipercam', label: 'Trigger Sniper Cam', type: 'select', options: ['0', '1'], description: 'Enable sniper camera on fire' },
      { key: 'vortex_refire_behavior', label: 'Vortex Refire', type: 'string', description: 'Vortex refire behavior type' },
      { key: 'weaponClass', label: 'Weapon Class', type: 'string', description: 'Weapon class (human, etc.)' },
      { key: 'weaponSubClass', label: 'Weapon SubClass', type: 'string', description: 'Weapon subclass (rifle, etc.)' },
      { key: 'body_type', label: 'Body Type', type: 'string', description: 'Weapon body type' },
      { key: 'pickup_hold_prompt', label: 'Pickup Hold Prompt', type: 'string', description: 'Hold pickup prompt text' },
      { key: 'pickup_press_prompt', label: 'Pickup Press Prompt', type: 'string', description: 'Press pickup prompt text' },
      { key: 'minimap_reveal_distance', label: 'Minimap Reveal', type: 'number', description: 'Distance to reveal on minimap' },
      { key: 'leveled_pickup', label: 'Leveled Pickup', type: 'select', options: ['0', '1'], description: 'Is a leveled pickup' },
      { key: 'sprintcycle_time', label: 'Sprint Cycle Time', type: 'number', step: 0.1, description: 'Sprint cycle animation time' },
      { key: 'sprint_fractional_anims', label: 'Sprint Fractional', type: 'select', options: ['0', '1'], description: 'Use fractional sprint animations' },
    ]
  },
  {
    id: 'dof',
    name: 'Depth of Field',
    icon: <Eye size={14} />,
    description: 'Camera depth of field settings',
    properties: [
      { key: 'dof_zoom_nearDepthStart', label: 'Zoom Near Start', type: 'number', step: 0.1, description: 'DoF near depth start when zoomed' },
      { key: 'dof_zoom_nearDepthEnd', label: 'Zoom Near End', type: 'number', step: 0.1, description: 'DoF near depth end when zoomed' },
      { key: 'dof_nearDepthStart', label: 'Near Start', type: 'number', step: 0.1, description: 'DoF near depth start' },
      { key: 'dof_nearDepthEnd', label: 'Near End', type: 'number', step: 0.1, description: 'DoF near depth end' },
      { key: 'dof_zoom_focusArea_horizontal', label: 'Focus Area H', type: 'number', step: 0.001, description: 'DoF focus area horizontal' },
      { key: 'dof_zoom_focusArea_top', label: 'Focus Area Top', type: 'number', step: 0.001, description: 'DoF focus area top' },
      { key: 'dof_zoom_focusArea_bottom', label: 'Focus Area Bottom', type: 'number', step: 0.001, description: 'DoF focus area bottom' },
    ]
  },
  {
    id: 'sway',
    name: 'Sway',
    icon: <Crosshair size={14} />,
    description: 'Weapon sway and view drift',
    properties: [
      { key: 'sway_min_pitch_zoomed', label: 'Sway Min Pitch', type: 'number', step: 0.001, description: 'Minimum pitch sway zoomed' },
      { key: 'sway_max_pitch_zoomed', label: 'Sway Max Pitch', type: 'number', step: 0.001, description: 'Maximum pitch sway zoomed' },
      { key: 'sway_min_yaw_zoomed', label: 'Sway Min Yaw', type: 'number', step: 0.001, description: 'Minimum yaw sway zoomed' },
      { key: 'sway_max_yaw_zoomed', label: 'Sway Max Yaw', type: 'number', step: 0.001, description: 'Maximum yaw sway zoomed' },
      { key: 'viewdrift_ads_delay', label: 'View Drift Delay', type: 'number', step: 0.1, description: 'View drift delay when ADS' },
      { key: 'viewdrift_ads_speed_pitch', label: 'View Drift Pitch Speed', type: 'number', step: 0.1, description: 'View drift pitch speed' },
      { key: 'viewdrift_ads_speed_yaw', label: 'View Drift Yaw Speed', type: 'number', step: 0.1, description: 'View drift yaw speed' },
      { key: 'viewdrift_ads_stand_scale_pitch', label: 'View Drift Stand Pitch', type: 'number', step: 0.1, description: 'View drift pitch scale standing' },
      { key: 'viewdrift_ads_stand_scale_yaw', label: 'View Drift Stand Yaw', type: 'number', step: 0.1, description: 'View drift yaw scale standing' },
      { key: 'viewdrift_ads_crouch_scale_pitch', label: 'View Drift Crouch Pitch', type: 'number', step: 0.1, description: 'View drift pitch scale crouching' },
      { key: 'viewdrift_ads_crouch_scale_yaw', label: 'View Drift Crouch Yaw', type: 'number', step: 0.1, description: 'View drift yaw scale crouching' },
      { key: 'viewdrift_ads_air_scale_pitch', label: 'View Drift Air Pitch', type: 'number', step: 0.1, description: 'View drift pitch scale in air' },
      { key: 'viewdrift_ads_air_scale_yaw', label: 'View Drift Air Yaw', type: 'number', step: 0.1, description: 'View drift yaw scale in air' },
    ]
  },
  {
    id: 'bob',
    name: 'Bobbing',
    icon: <Layers size={14} />,
    description: 'Weapon bobbing settings',
    properties: [
      { key: 'bob_cycle_time', label: 'Bob Cycle Time', type: 'number', step: 0.1, description: 'Bob cycle animation time' },
      { key: 'bob_vert_dist', label: 'Bob Vert Dist', type: 'number', step: 0.01, description: 'Vertical bob distance' },
      { key: 'bob_horz_dist', label: 'Bob Horz Dist', type: 'number', step: 0.01, description: 'Horizontal bob distance' },
      { key: 'bob_max_speed', label: 'Bob Max Speed', type: 'number', description: 'Maximum bob speed' },
      { key: 'bob_pitch', label: 'Bob Pitch', type: 'number', step: 0.1, description: 'Bob pitch amount' },
      { key: 'bob_yaw', label: 'Bob Yaw', type: 'number', step: 0.1, description: 'Bob yaw amount' },
      { key: 'bob_roll', label: 'Bob Roll', type: 'number', step: 0.1, description: 'Bob roll amount' },
      { key: 'bob_cycle_time_zoomed', label: 'Bob Cycle Time Zoomed', type: 'number', step: 0.1, description: 'Bob cycle time when zoomed' },
      { key: 'bob_vert_dist_zoomed', label: 'Bob Vert Dist Zoomed', type: 'number', step: 0.01, description: 'Vertical bob distance zoomed' },
      { key: 'bob_horz_dist_zoomed', label: 'Bob Horz Dist Zoomed', type: 'number', step: 0.01, description: 'Horizontal bob distance zoomed' },
      { key: 'bob_max_speed_zoomed', label: 'Bob Max Speed Zoomed', type: 'number', description: 'Maximum bob speed zoomed' },
    ]
  },
  {
    id: 'aimassist',
    name: 'Aim Assist',
    icon: <Target size={14} />,
    description: 'Aim assist settings',
    properties: [
      { key: 'aimassist_adspull_weaponclass', label: 'AA Weapon Class', type: 'string', description: 'Aim assist weapon class' },
      { key: 'aimassist_adspull_zoomStart', label: 'AA Zoom Start', type: 'number', step: 0.1, description: 'Aim assist zoom start fraction' },
      { key: 'aimassist_adspull_zoomEnd', label: 'AA Zoom End', type: 'number', step: 0.1, description: 'Aim assist zoom end fraction' },
      { key: 'aimassist_disable_hipfire', label: 'Disable AA Hipfire', type: 'select', options: ['0', '1'], description: 'Disable aim assist hipfire' },
      { key: 'aimassist_disable_ads', label: 'Disable AA ADS', type: 'select', options: ['0', '1'], description: 'Disable aim assist ADS' },
    ]
  },
  {
    id: 'blast',
    name: 'Blast Pattern',
    icon: <Sparkles size={14} />,
    description: 'Shotgun blast pattern settings',
    properties: [
      { key: 'blast_pattern', label: 'Blast Pattern', type: 'string', description: 'Named blast pattern' },
      { key: 'blast_pattern_default_scale', label: 'Default Scale', type: 'number', step: 0.1, description: 'Default blast pattern scale' },
      { key: 'blast_pattern_ads_scale', label: 'ADS Scale', type: 'number', step: 0.1, description: 'Blast pattern scale when ADS' },
      { key: 'blast_pattern_zero_distance', label: 'Zero Distance', type: 'number', description: 'Distance for zero spread' },
      { key: 'blast_pattern_npc_scale', label: 'NPC Scale', type: 'number', step: 0.1, description: 'Blast pattern scale for NPCs' },
    ]
  },
];

// Existing keys in PROPERTY_CATEGORIES for quick reference
export const EXISTING_PROPERTY_KEYS = PROPERTY_CATEGORIES.flatMap(cat => cat.properties.map(p => p.key));

const VIEWKICK_PATTERN_MAP = new Map(VIEWKICK_PATTERNS.map(pattern => [pattern.name, pattern]));

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return hash >>> 0;
}

function mulberry32(seed: number): () => number {
  let t = seed;
  return () => {
    t += 0x6d2b79f5;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

// Parse KeyValue content into a structured object
function parseKeyValues(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  const lines = content.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed === '{' || trimmed === '}' || !trimmed) continue;
    if (trimmed === 'WeaponData' || trimmed === 'Mods') continue;
    
    const match = trimmed.match(/^"([^"]+)"\s+(?:"([^"]*)"|(\S+))/);
    if (match) {
      const key = match[1];
      const value = match[2] !== undefined ? match[2] : match[3];
      result[key] = value;
    }
  }
  
  return result;
}

// Parse Mods block - returns array of mod names
interface ModEntry {
  name: string;
  properties: Record<string, string>;
}

function parseModsBlock(content: string): ModEntry[] {
  const mods: ModEntry[] = [];
  // Match both quoted "Mods" and unquoted Mods
  const modsMatch = content.match(/^\s*"?Mods"?\s*\n\s*\{([\s\S]*?)^\s*\}/m);
  if (!modsMatch) return mods;
  
  const modsContent = modsMatch[1];
  const lines = modsContent.split('\n');
  
  let currentMod: ModEntry | null = null;
  let braceDepth = 0;
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('//')) continue;
    
    if (trimmed === '{') {
      braceDepth++;
      continue;
    }
    
    if (trimmed === '}') {
      braceDepth--;
      if (braceDepth === 0 && currentMod) {
        mods.push(currentMod);
        currentMod = null;
      }
      continue;
    }
    
    // Mod name (unquoted or quoted)
    if (braceDepth === 0) {
      const modName = trimmed.replace(/^"|"$/g, '');
      if (modName && !modName.includes(' ')) {
        currentMod = { name: modName, properties: {} };
      }
    } else if (braceDepth === 1 && currentMod) {
      // Property inside mod
      const propMatch = trimmed.match(/^"([^"]+)"\s+(?:"([^"]*)"|(\S+))/);
      if (propMatch) {
        currentMod.properties[propMatch[1]] = propMatch[2] !== undefined ? propMatch[2] : propMatch[3];
      }
    }
  }
  
  return mods;
}

// Parse RUI_CrosshairData block
interface CrosshairEntry {
  name: string;
  ui?: string;
  baseSpread?: string;
  args: Record<string, string>;
}

interface RUICrosshairData {
  defaultArgs: Record<string, string>;
  crosshairs: CrosshairEntry[];
}

function parseRUICrosshairData(content: string): RUICrosshairData | null {
  const result: RUICrosshairData = { defaultArgs: {}, crosshairs: [] };
  
  // Match both quoted "RUI_CrosshairData" and unquoted
  const blockMatch = content.match(/"?RUI_CrosshairData"?\s*\n\s*\{([\s\S]*?)^\s*\}/m);
  if (!blockMatch) return null;
  
  const blockContent = blockMatch[1];
  
  // Parse DefaultArgs
  const defaultArgsMatch = blockContent.match(/DefaultArgs\s*\n\s*\{([\s\S]*?)\n\s*\}/);
  if (defaultArgsMatch) {
    const argsLines = defaultArgsMatch[1].split('\n');
    for (const line of argsLines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('//')) continue;
      const parts = trimmed.split(/\s+/);
      if (parts.length >= 2) {
        result.defaultArgs[parts[0].replace(/"/g, '')] = parts.slice(1).join(' ').replace(/"/g, '');
      }
    }
  }
  
  // Parse Crosshair_N entries
  const crosshairPattern = /Crosshair_(\d+)\s*\n\s*\{([\s\S]*?)\n\s*\}/g;
  let crosshairMatch;
  while ((crosshairMatch = crosshairPattern.exec(blockContent)) !== null) {
    const crosshair: CrosshairEntry = {
      name: `Crosshair_${crosshairMatch[1]}`,
      args: {}
    };
    
    const crosshairContent = crosshairMatch[2];
    const lines = crosshairContent.split('\n');
    
    let inArgs = false;
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('//')) continue;
      
      if (trimmed === 'Args' || trimmed === '"Args"') {
        inArgs = true;
        continue;
      }
      if (trimmed === '{') continue;
      if (trimmed === '}') {
        inArgs = false;
        continue;
      }
      
      if (inArgs) {
        const parts = trimmed.split(/\s+/);
        if (parts.length >= 2) {
          crosshair.args[parts[0].replace(/"/g, '')] = parts.slice(1).join(' ').replace(/"/g, '');
        }
      } else {
        const propMatch = trimmed.match(/^"([^"]+)"\s+(?:"([^"]*)"|(\S+))/);
        if (propMatch) {
          if (propMatch[1] === 'ui') crosshair.ui = propMatch[2] || propMatch[3];
          else if (propMatch[1] === 'base_spread') crosshair.baseSpread = propMatch[2] || propMatch[3];
        }
      }
    }
    
    result.crosshairs.push(crosshair);
  }
  
  return result;
}

// Update a value in the raw content
function updateKeyValue(content: string, key: string, newValue: string): string {
  const lines = content.split('\n');
  const keyPattern = new RegExp(`^(\\s*)"${key}"\\s+(?:"[^"]*"|\\S+)(.*)$`);
  let found = false;
  
  const newLines = lines.map(line => {
    const match = line.match(keyPattern);
    if (match) {
      found = true;
      const indent = match[1];
      const trailing = match[2] || '';
      const formattedValue = /^-?\d*\.?\d+$/.test(newValue) ? newValue : `"${newValue}"`;
      return `${indent}"${key}"${' '.repeat(Math.max(1, 40 - key.length - indent.length))}${formattedValue}${trailing}`;
    }
    return line;
  });
  
  if (!found && newValue) {
    const closingIndex = newLines.findLastIndex(line => line.trim() === '}');
    if (closingIndex > 0) {
      const formattedValue = /^-?\d*\.?\d+$/.test(newValue) ? newValue : `"${newValue}"`;
      newLines.splice(closingIndex, 0, `    "${key}"${' '.repeat(Math.max(1, 40 - key.length - 4))}${formattedValue}`);
    }
  }
  
  return newLines.join('\n');
}

export default function WeaponEditor({
  weaponFile,
  onContentChange,
  isModified = false,
  accentColor = '#f59e0b',
}: WeaponEditorProps) {
  const [content, setContent] = useState('');
  const [isRawMode, setIsRawMode] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [enabledSections, setEnabledSections] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddSectionMenu, setShowAddSectionMenu] = useState(false);
  const [showAddBlockMenu, setShowAddBlockMenu] = useState(false);
  const [recoilViewMode, setRecoilViewMode] = useState<'hipfire' | 'ads'>('ads');
  const [recoilAirborne, setRecoilAirborne] = useState(false);
  const [recoilVariantCount, setRecoilVariantCount] = useState(10);
  const [recoilHighlightIndex, setRecoilHighlightIndex] = useState<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);

  // Parse properties from content
  const parsedProperties = useMemo(() => parseKeyValues(content), [content]);

  // Parse special blocks
  const parsedMods = useMemo(() => parseModsBlock(content), [content]);
  const parsedCrosshair = useMemo(() => parseRUICrosshairData(content), [content]);

  const recoilPreview = useMemo(() => {
    const readNumber = (key: string, fallback: number) => {
      const raw = parsedProperties[key];
      const parsed = raw !== undefined ? Number(raw) : Number.NaN;
      return Number.isFinite(parsed) ? parsed : fallback;
    };

    const patternName = parsedProperties.viewkick_pattern;
    const pattern = patternName ? VIEWKICK_PATTERN_MAP.get(patternName) : undefined;
    if (!pattern) {
      return {
        patternName,
        shots: 0,
        points: [] as Array<{ x: number; y: number }>,
        bounds: null as null | { minX: number; maxX: number; minY: number; maxY: number },
      };
    }

    const shotCountRaw = Math.round(readNumber('ammo_clip_size', 30)) || 30;
    const shots = clamp(shotCountRaw, 1, 60);
    const fireRate = readNumber('fire_rate', 0);
    const dt = fireRate > 0 ? 1 / fireRate : 0.1;

    const pitchBase = readNumber('viewkick_pitch_base', 1);
    const pitchRandom = readNumber('viewkick_pitch_random', 1);
    const pitchSoft = readNumber('viewkick_pitch_softScale', 0);
    const pitchHard = readNumber('viewkick_pitch_hardScale', 0);

    const yawBase = readNumber('viewkick_yaw_base', 1);
    const yawRandom = readNumber('viewkick_yaw_random', 1);
    const yawInnerExclude = Math.max(0, readNumber('viewkick_yaw_random_innerexclude', 0));
    const yawSoft = readNumber('viewkick_yaw_softScale', 0);
    const yawHard = readNumber('viewkick_yaw_hardScale', 0);

    const hipFraction = readNumber('viewkick_hipfire_weaponFraction', 1);
    const adsFractionModifier = readNumber('viewkick_ads_weaponFraction', 0);
    const airScale = recoilViewMode === 'ads' && recoilAirborne
      ? readNumber('viewkick_air_scale_ads', 1)
      : 1;
    const hipFirstShotScale = readNumber('viewkick_scale_firstshot_hipfire', 1);
    const adsFirstShotModifier = readNumber('viewkick_scale_firstshot_ads', 1);
    const hipMinScale = readNumber('viewkick_scale_min_hipfire', 1);
    const hipMaxScale = readNumber('viewkick_scale_max_hipfire', 1);
    const adsMinModifier = readNumber('viewkick_scale_min_ads', 1);
    const adsMaxModifier = readNumber('viewkick_scale_max_ads', 1);
    const valuePerShot = readNumber('viewkick_scale_valuePerShot', 0);
    const pitchLerpStart = readNumber('viewkick_scale_pitch_valueLerpStart', 0);
    const pitchLerpEnd = readNumber('viewkick_scale_pitch_valueLerpEnd', 0);
    const yawLerpStart = readNumber('viewkick_scale_yaw_valueLerpStart', 0);
    const yawLerpEnd = readNumber('viewkick_scale_yaw_valueLerpEnd', 0);
    const decayDelay = readNumber('viewkick_scale_valueDecayDelay', 0);
    const decayRate = readNumber('viewkick_scale_valueDecayRate', 0);

    const yawScale = yawSoft + yawHard;
    const pitchScale = pitchSoft + pitchHard;
    const fraction = recoilViewMode === 'ads'
      ? hipFraction + adsFractionModifier
      : hipFraction;
    const firstShotScale = recoilViewMode === 'ads'
      ? hipFirstShotScale * adsFirstShotModifier
      : hipFirstShotScale;
    const minScale = recoilViewMode === 'ads'
      ? hipMinScale * adsMinModifier
      : hipMinScale;
    const maxScale = recoilViewMode === 'ads'
      ? hipMaxScale * adsMaxModifier
      : hipMaxScale;

    const seed = hashString(`${pattern.name}:${recoilViewMode}:${recoilAirborne ? 'air' : 'ground'}:${shots}`);
    const loopStart = Math.min(pattern.loopOffset, Math.max(0, pattern.bullets.length - 1));
    const loopLength = Math.max(1, pattern.bullets.length - loopStart);

    const simulate = (seedOffset: number, yawRandomScale: number, pitchRandomScale: number) => {
      const rng = mulberry32(seed + seedOffset);
      const points: Array<{ x: number; y: number }> = [];
      let yaw = 0;
      let pitch = 0;
      let minX = 0;
      let maxX = 0;
      let minY = 0;
      let maxY = 0;

      for (let i = 0; i < shots; i += 1) {
        const index = i < pattern.bullets.length
          ? i
          : loopStart + ((i - loopStart) % loopLength);
        const [baseYaw, basePitch, yawRand, pitchRand] = pattern.bullets[index];

        let randYaw = (rng() * 2 - 1) * yawRand * yawRandom * yawRandomScale;
        if (yawInnerExclude > 0 && Math.abs(randYaw) < yawInnerExclude) {
          randYaw = (randYaw < 0 ? -1 : 1) * yawInnerExclude;
        }

        const randPitch = (rng() * 2 - 1) * pitchRand * pitchRandom * pitchRandomScale;

        const scaleValue = 1 + valuePerShot * i;
        const clampedScale = clamp(scaleValue, minScale, maxScale);
        const pitchLerp = pitchLerpEnd > pitchLerpStart
          ? clamp((scaleValue - pitchLerpStart) / (pitchLerpEnd - pitchLerpStart), 0, 1)
          : 1;
        const yawLerp = yawLerpEnd > yawLerpStart
          ? clamp((scaleValue - yawLerpStart) / (yawLerpEnd - yawLerpStart), 0, 1)
          : 1;
        const pitchAxisScale = pitchLerpEnd > pitchLerpStart
          ? minScale + (maxScale - minScale) * pitchLerp
          : clampedScale;
        const yawAxisScale = yawLerpEnd > yawLerpStart
          ? minScale + (maxScale - minScale) * yawLerp
          : clampedScale;
        const time = i * dt;
        const decayScale = decayRate > 0 && time > decayDelay
          ? Math.max(0, 1 - (time - decayDelay) * decayRate * 0.01)
          : 1;
        const firstShot = i === 0 ? firstShotScale : 1;
        const shotScale = fraction * airScale * firstShot * decayScale;

        const adjustedYaw = (baseYaw * yawBase + randYaw) * yawScale * yawAxisScale * shotScale;
        const adjustedPitch = (basePitch * pitchBase + randPitch) * pitchScale * pitchAxisScale * shotScale;

        yaw += adjustedYaw;
        pitch += adjustedPitch;

        const point = { x: yaw, y: -pitch };
        points.push(point);

        minX = Math.min(minX, point.x);
        maxX = Math.max(maxX, point.x);
        minY = Math.min(minY, point.y);
        maxY = Math.max(maxY, point.y);
      }

      return {
        points,
        bounds: { minX, maxX, minY, maxY },
      };
    };

    const clampedCount = clamp(Math.round(recoilVariantCount), 1, 10);
    const main = simulate(0, 0.85, 0.85);
    const variants = Array.from({ length: Math.max(0, clampedCount - 1) }, (_, idx) =>
      simulate(idx + 1, 0.55, 0.7).points
    );

    return {
      patternName: pattern.name,
      shots,
      points: main.points,
      variants,
      bounds: main.bounds,
    };
  }, [parsedProperties, recoilViewMode, recoilAirborne, recoilVariantCount]);

  const recoilPlot = useMemo(() => {
    if (!recoilPreview.bounds || recoilPreview.points.length === 0) return null;
    const { minX, maxX, minY, maxY } = recoilPreview.bounds;
    const padX = (maxX - minX) * 0.1 || 0.5;
    const padY = (maxY - minY) * 0.1 || 0.5;
    const viewMinX = minX - padX;
    const viewMaxX = maxX + padX;
    const viewMinY = minY - padY;
    const viewMaxY = maxY + padY;
    const width = 320;
    const height = 420;
    const scaleX = width / Math.max(1e-6, viewMaxX - viewMinX);
    const scaleY = height / Math.max(1e-6, viewMaxY - viewMinY);

    const toSvg = (point: { x: number; y: number }) => ({
      x: (point.x - viewMinX) * scaleX,
      y: height - (point.y - viewMinY) * scaleY,
    });

    const svgPoints = recoilPreview.points.map(toSvg);
    const path = svgPoints
      .map((point, idx) => `${idx === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
      .join(' ');
    const variantPaths = (recoilPreview.variants || []).map(points => {
      const variantPoints = points.map(toSvg);
      return variantPoints
        .map((point, idx) => `${idx === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
        .join(' ');
    });
    const colorRng = mulberry32(hashString(`${recoilPreview.patternName || 'none'}:${recoilPreview.shots}:variant-colors`));
    const variantColors = variantPaths.map(() => {
      const hue = 38 + (colorRng() - 0.5) * 16;
      const light = 55 + (colorRng() - 0.5) * 12;
      return `hsl(${hue.toFixed(1)} 90% ${light.toFixed(1)}%)`;
    });
    const origin = toSvg({ x: 0, y: 0 });

    return {
      width,
      height,
      path,
      points: svgPoints,
      variantPaths,
      variantColors,
      origin,
    };
  }, [recoilPreview]);

  // Detect which special blocks exist in content
  const existingBlocks = useMemo(() => {
    const blocks: Set<string> = new Set();
    if (/^\s*"?Mods"?\s*$/m.test(content)) blocks.add('mods');
    if (/^\s*"?RUI_CrosshairData"?\s*$/m.test(content)) blocks.add('rui_crosshair');
    if (/^\s*"?UiData1"?\s*$/m.test(content)) blocks.add('uidata1');
    if (/^\s*"?UiData2"?\s*$/m.test(content)) blocks.add('uidata2');
    return blocks;
  }, [content]);

  // Auto-detect sections that have values and enable them
  useEffect(() => {
    if (weaponFile) {
      const detected = new Set<string>();
      for (const category of PROPERTY_CATEGORIES) {
        if (category.properties.some(p => parsedProperties[p.key])) {
          detected.add(category.id);
        }
      }
      // Always enable general if nothing else
      if (detected.size === 0) detected.add('general');
      setEnabledSections(detected);
      // Expand first detected section
      if (detected.size > 0) {
        setExpandedCategories(new Set([Array.from(detected)[0]]));
      }
    }
  }, [weaponFile?.id]);

  // Load content when weapon file changes
  useEffect(() => {
    if (weaponFile) {
      setContent(weaponFile.content);
    } else {
      setContent('');
    }
  }, [weaponFile?.id]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-menu]')) {
        setShowAddSectionMenu(false);
        setShowAddBlockMenu(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Sync scroll between textarea and highlight overlay
  const handleScroll = useCallback(() => {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }, []);

  // Handle raw content changes
  const handleRawChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    if (weaponFile) {
      onContentChange(weaponFile.id, newContent);
    }
  }, [weaponFile, onContentChange]);

  // Handle property change from visual editor
  const handlePropertyChange = useCallback((key: string, value: string) => {
    const newContent = updateKeyValue(content, key, value);
    setContent(newContent);
    if (weaponFile) {
      onContentChange(weaponFile.id, newContent);
    }
  }, [content, weaponFile, onContentChange]);

  // Toggle category expansion
  const toggleCategory = useCallback((categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  }, []);

  // Add a section to the editor
  const addSection = useCallback((categoryId: string) => {
    setEnabledSections(prev => new Set(prev).add(categoryId));
    setExpandedCategories(prev => new Set(prev).add(categoryId));
    setShowAddSectionMenu(false);
  }, []);

  // Remove a section from the editor
  const removeSection = useCallback((categoryId: string) => {
    setEnabledSections(prev => {
      const next = new Set(prev);
      next.delete(categoryId);
      return next;
    });
    setExpandedCategories(prev => {
      const next = new Set(prev);
      next.delete(categoryId);
      return next;
    });
  }, []);

  // Add a special block to the content
  const addSpecialBlock = useCallback((blockId: string) => {
    const block = SPECIAL_BLOCKS.find(b => b.id === blockId);
    if (!block || !weaponFile) return;
    
    // Find the last closing brace (end of WeaponData)
    const lines = content.split('\n');
    const lastBraceIndex = lines.findLastIndex(line => line.trim() === '}');
    
    if (lastBraceIndex > 0) {
      lines.splice(lastBraceIndex, 0, '', block.template);
      const newContent = lines.join('\n');
      setContent(newContent);
      onContentChange(weaponFile.id, newContent);
    }
    setShowAddBlockMenu(false);
  }, [content, weaponFile, onContentChange]);

  // Get sections available to add (not already enabled)
  const availableSections = useMemo(() => {
    return PROPERTY_CATEGORIES.filter(cat => !enabledSections.has(cat.id));
  }, [enabledSections]);

  // Get blocks available to add (not already in content)
  const availableBlocks = useMemo(() => {
    return SPECIAL_BLOCKS.filter(block => !existingBlocks.has(block.id));
  }, [existingBlocks]);

  // Filter categories based on search AND enabled sections
  const filteredCategories = useMemo(() => {
    let categories = PROPERTY_CATEGORIES.filter(cat => enabledSections.has(cat.id));
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      categories = categories.map(cat => ({
        ...cat,
        properties: cat.properties.filter(p => 
          p.key.toLowerCase().includes(query) ||
          p.label.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query)
        )
      })).filter(cat => cat.properties.length > 0);
    }
    return categories;
  }, [searchQuery, enabledSections]);

  // Render a property input based on its type
  const renderPropertyInput = useCallback((prop: PropertyDef) => {
    const value = parsedProperties[prop.key] || '';
    
    if (prop.type === 'select' && prop.options) {
      const options = value && !prop.options.includes(value)
        ? [value, ...prop.options]
        : prop.options;
      return (
        <select
          value={value}
          onChange={(e) => handlePropertyChange(prop.key, e.target.value)}
          className="flex-1 bg-[#121212] border border-white/8 rounded px-2 py-1.5 text-xs text-white focus:border-[#2196F3] focus:ring-1 focus:ring-[#2196F3]/30 focus:outline-none"
        >
          <option value="">-- Select --</option>
          {options.map((opt: string) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      );
    }
    
    if (prop.type === 'number') {
      return (
        <input
          type="number"
          value={value}
          step={prop.step || 1}
          onChange={(e) => handlePropertyChange(prop.key, e.target.value)}
          className="flex-1 bg-[#121212] border border-white/8 rounded px-2 py-1.5 text-xs text-white focus:border-[#2196F3] focus:ring-1 focus:ring-[#2196F3]/30 focus:outline-none"
          placeholder="0"
        />
      );
    }
    
    return (
      <input
        type="text"
        value={value}
        onChange={(e) => handlePropertyChange(prop.key, e.target.value)}
        className="flex-1 bg-[#121212] border border-white/8 rounded px-2 py-1.5 text-xs text-white focus:border-[#2196F3] focus:ring-1 focus:ring-[#2196F3]/30 focus:outline-none"
        placeholder={prop.description || ''}
      />
    );
  }, [parsedProperties, handlePropertyChange]);

  // Syntax highlighting for raw mode
  const getHighlightedContent = useCallback(() => {
    if (!content) return '';
    return content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/(\/\/.*$)/gm, '<span class="text-gray-500">$1</span>')
      .replace(/(#base\s+"[^"]*")/g, '<span class="text-[#64B5F6]">$1</span>')
      .replace(/^(\s*)(WeaponData|Mods)(\s*$)/gm, '$1<span class="text-yellow-400 font-semibold">$2</span>$3')
      .replace(/([{}])/g, '<span class="text-gray-400">$1</span>')
      .replace(/"([^"]+)"(\s+)("[^"]*"|[\d.]+)/g, 
        '<span class="text-cyan-400">"$1"</span>$2<span class="text-green-400">$3</span>');
  }, [content]);

  if (!weaponFile) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#121212] text-gray-400">
        <Crosshair size={48} className="mb-4 opacity-30" />
        <p className="text-lg">No weapon file selected</p>
        <p className="text-sm mt-2">Create or select a weapon file to edit</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#121212]">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-2 bg-[#1e1e1e] border-b border-white/8">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded" style={{ backgroundColor: '#f59e0b20' }}>
            <Crosshair size={16} className="text-amber-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-white">{weaponFile.name}.txt</span>
              {isModified && (
                <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" title="Unsaved changes" />
              )}
            </div>
            {weaponFile.baseWeapon && (
              <span className="text-xs text-gray-500">
                extends {weaponFile.baseWeapon}
              </span>
            )}
          </div>
        </div>
        
        {/* Mode Toggle */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#121212] rounded-lg p-0.5 border border-white/8">
            <button
              onClick={() => setIsRawMode(false)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                !isRawMode 
                  ? 'bg-amber-500/20 text-amber-400' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Eye size={12} />
              Visual
            </button>
            <button
              onClick={() => setIsRawMode(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                isRawMode 
                  ? 'bg-amber-500/20 text-amber-400' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Code size={12} />
              Raw
            </button>
          </div>
          <button
            onClick={() => navigator.clipboard.writeText(content)}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
            title="Copy to clipboard"
          >
            <Copy size={14} />
          </button>
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        {isRawMode ? (
          /* Raw Text Editor */
          <div className="flex-1 relative overflow-hidden">
            {/* Line numbers */}
            <div className="absolute left-0 top-0 bottom-0 w-12 bg-[#121212] border-r border-white/8 overflow-hidden pointer-events-none z-10">
              <div className="pt-3 text-right pr-2">
                {content.split('\n').map((_, i) => (
                  <div key={i} className="text-xs text-gray-600 leading-5 h-5">
                    {i + 1}
                  </div>
                ))}
              </div>
            </div>

            {/* Syntax highlighted background */}
            <div
              ref={highlightRef}
              className="absolute inset-0 pl-14 pr-4 pt-3 pb-4 overflow-auto pointer-events-none font-mono text-sm leading-5 whitespace-pre"
              dangerouslySetInnerHTML={{ __html: getHighlightedContent() }}
            />

            {/* Actual textarea */}
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleRawChange}
              onScroll={handleScroll}
              className="absolute inset-0 w-full h-full pl-14 pr-4 pt-3 pb-4 bg-transparent text-transparent font-mono text-sm leading-5 resize-none outline-none caret-white selection:bg-amber-500/30"
              spellCheck={false}
              placeholder="// Enter weapon properties here..."
            />
          </div>
        ) : (
          /* Visual Property Editor */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Toolbar */}
            <div className="flex-shrink-0 px-4 py-3 border-b border-white/8 bg-[#1e1e1e]">
              <div className="flex items-center gap-3">
                {/* Search */}
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search properties..."
                    className="w-full bg-[#121212] border border-white/8 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:border-[#2196F3]/50 focus:ring-1 focus:ring-[#2196F3]/30 focus:outline-none"
                  />
                </div>
                
                {/* Add Section Button */}
                <div className="relative" data-menu>
                  <button
                    onClick={() => { setShowAddSectionMenu(!showAddSectionMenu); setShowAddBlockMenu(false); }}
                    className="flex items-center gap-1.5 px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg text-xs font-medium transition-colors"
                  >
                    <Plus size={14} />
                    Add Section
                  </button>
                  
                  {showAddSectionMenu && availableSections.length > 0 && (
                    <div className="absolute right-0 top-full mt-1 w-64 bg-[#212121] border border-white/8 rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto">
                      <div className="p-2 border-b border-white/8">
                        <span className="text-xs text-gray-400">Add property section</span>
                      </div>
                      {availableSections.map(section => (
                        <button
                          key={section.id}
                          onClick={() => addSection(section.id)}
                          className="w-full flex items-center gap-3 px-3 py-2 hover:bg-white/5 transition-colors text-left"
                        >
                          <span className="text-amber-400">{section.icon}</span>
                          <div>
                            <div className="text-sm text-white">{section.name}</div>
                            <div className="text-xs text-gray-500">{section.description}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Add Block Button */}
                <div className="relative" data-menu>
                  <button
                    onClick={() => { setShowAddBlockMenu(!showAddBlockMenu); setShowAddSectionMenu(false); }}
                    className="flex items-center gap-1.5 px-3 py-2 bg-[#2196F3]/10 hover:bg-[#2196F3]/20 text-[#64B5F6] rounded-lg text-xs font-medium transition-colors"
                  >
                    <Plus size={14} />
                    Add Block
                  </button>
                  
                  {showAddBlockMenu && availableBlocks.length > 0 && (
                    <div className="absolute right-0 top-full mt-1 w-64 bg-[#212121] border border-white/8 rounded-lg shadow-xl z-50">
                      <div className="p-2 border-b border-white/8">
                        <span className="text-xs text-gray-400">Add special block</span>
                      </div>
                      {availableBlocks.map(block => (
                        <button
                          key={block.id}
                          onClick={() => addSpecialBlock(block.id)}
                          className="w-full flex items-center gap-3 px-3 py-2 hover:bg-white/5 transition-colors text-left"
                        >
                          <span className="text-[#64B5F6]">{block.icon}</span>
                          <div>
                            <div className="text-sm text-white">{block.name}</div>
                            <div className="text-xs text-gray-500">{block.description}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {showAddBlockMenu && availableBlocks.length === 0 && (
                    <div className="absolute right-0 top-full mt-1 w-64 bg-[#212121] border border-white/8 rounded-lg shadow-xl z-50 p-3">
                      <span className="text-xs text-gray-400">All blocks already added</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Active Sections Pills */}
              {enabledSections.size > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {Array.from(enabledSections).map(sectionId => {
                    const section = PROPERTY_CATEGORIES.find(c => c.id === sectionId);
                    if (!section) return null;
                    return (
                      <div
                        key={sectionId}
                        className="flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded-full text-xs"
                      >
                        <span className="text-amber-400">{section.icon}</span>
                        <span className="text-gray-300">{section.name}</span>
                        <button
                          onClick={() => removeSection(sectionId)}
                          className="p-0.5 hover:bg-white/10 rounded-full text-gray-500 hover:text-red-400 transition-colors"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
              
              {/* Existing Blocks Indicator */}
              {existingBlocks.size > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {Array.from(existingBlocks).map(blockId => {
                    const block = SPECIAL_BLOCKS.find(b => b.id === blockId);
                    if (!block) return null;
                    return (
                      <div
                        key={blockId}
                        className="flex items-center gap-1.5 px-2 py-1 bg-[#2196F3]/10 rounded-full text-xs"
                      >
                        <span className="text-[#64B5F6]">{block.icon}</span>
                        <span className="text-purple-300">{block.name}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Property Categories */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {filteredCategories.length === 0 && !searchQuery && (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <Plus size={32} className="mb-3 opacity-30" />
                  <p className="text-sm">No sections added yet</p>
                  <p className="text-xs mt-1">Click "Add Section" to start building your weapon</p>
                </div>
              )}
              
              {filteredCategories.map(category => {
                const isExpanded = expandedCategories.has(category.id);
                const hasValues = category.properties.some(p => parsedProperties[p.key]);
                
                return (
                  <div 
                    key={category.id} 
                    className="bg-[#1e1e1e] rounded-lg border border-white/5 overflow-hidden"
                  >
                    {/* Category Header */}
                    <div className="flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors">
                      <button
                        onClick={() => toggleCategory(category.id)}
                        className="flex-1 flex items-center gap-3 text-left"
                      >
                        <span className="text-amber-400">{category.icon}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-white">{category.name}</span>
                            {hasValues && (
                              <span className="w-2 h-2 bg-amber-400 rounded-full" title="Has values" />
                            )}
                          </div>
                          <span className="text-xs text-gray-500">{category.description}</span>
                        </div>
                      </button>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); removeSection(category.id); }}
                          className="p-1 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                          title="Remove section"
                        >
                          <Trash2 size={12} />
                        </button>
                        <ChevronDown 
                          size={16} 
                          className={`text-gray-400 transition-transform ${isExpanded ? '' : '-rotate-90'}`} 
                        />
                      </div>
                    </div>

                    {/* Properties */}
                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-white/5 pt-3">
                        {category.id === 'recoil' ? (
                          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_520px]">
                            <div className="space-y-2.5">
                              {(() => {
                                const propMap = new Map(category.properties.map(prop => [prop.key, prop]));
                                const renderProp = (key: string) => {
                                  const prop = propMap.get(key);
                                  if (!prop) return null;
                                  return (
                                    <div key={prop.key} className="rounded border border-white/5 bg-[#212121] p-2.5">
                                      <label className="text-[11px] font-medium text-gray-300 block">
                                        {prop.label}
                                      </label>
                                      {prop.description && (
                                        <span className="text-[9px] text-gray-500 block mt-0.5">
                                          {prop.description}
                                        </span>
                                      )}
                                      <div className="mt-2 flex items-center gap-2">
                                        {renderPropertyInput(prop)}
                                        {parsedProperties[prop.key] && (
                                          <button
                                            onClick={() => handlePropertyChange(prop.key, '')}
                                            className="p-1 text-gray-500 hover:text-red-400 transition-colors"
                                            title="Clear value"
                                          >
                                            <RotateCcw size={12} />
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  );
                                };

                                const coreKeys = [
                                  'viewkick_pattern',
                                  'viewkick_spring',
                                  'viewkick_pitch_base',
                                  'viewkick_pitch_random',
                                  'viewkick_pitch_softScale',
                                  'viewkick_pitch_hardScale',
                                ];
                                const yawKeys = [
                                  'viewkick_yaw_base',
                                  'viewkick_yaw_random',
                                  'viewkick_yaw_random_innerexclude',
                                  'viewkick_yaw_softScale',
                                  'viewkick_yaw_hardScale',
                                ];
                                const rollKeys = [
                                  'viewkick_roll_base',
                                  'viewkick_roll_randomMin',
                                  'viewkick_roll_randomMax',
                                  'viewkick_roll_softScale',
                                  'viewkick_roll_hardScale',
                                ];
                                const scaleKeys = [
                                  'viewkick_hipfire_weaponFraction',
                                  'viewkick_ads_weaponFraction',
                                  'viewkick_air_scale_ads',
                                  'viewkick_scale_firstshot_hipfire',
                                  'viewkick_scale_firstshot_ads',
                                  'viewkick_scale_min_hipfire',
                                  'viewkick_scale_max_hipfire',
                                  'viewkick_scale_min_ads',
                                  'viewkick_scale_max_ads',
                                  'viewkick_scale_valuePerShot',
                                  'viewkick_scale_pitch_valueLerpStart',
                                  'viewkick_scale_pitch_valueLerpEnd',
                                  'viewkick_scale_yaw_valueLerpStart',
                                  'viewkick_scale_yaw_valueLerpEnd',
                                  'viewkick_scale_valueDecayDelay',
                                  'viewkick_scale_valueDecayRate',
                                ];

                                const renderSection = (title: string, keys: string[]) => (
                                  <div className="rounded border border-white/5 bg-[#212121]">
                                    <div className="px-2.5 pt-2.5 pb-2 text-[11px] font-medium text-amber-400">
                                      {title}
                                    </div>
                                    <div className="grid grid-cols-1 gap-2.5 px-2.5 pb-2.5 md:grid-cols-2 xl:grid-cols-3">
                                      {keys.map(renderProp)}
                                    </div>
                                  </div>
                                );

                                return (
                                  <>
                                    {renderSection('Core', coreKeys)}
                                    {renderSection('Yaw Settings', yawKeys)}
                                    {renderSection('Roll Settings', rollKeys)}
                                    {renderSection('Scale Settings', scaleKeys)}
                                  </>
                                );
                              })()}
                            </div>
                            <div className="rounded border border-amber-500/10 bg-[#212121] p-3">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2 text-xs text-amber-400">
                                  <Target size={12} />
                                  Recoil Visualizer
                                </div>
                                <div className="flex items-center gap-2">
                                  <select
                                    value={recoilViewMode}
                                    onChange={(e) => setRecoilViewMode(e.target.value as 'hipfire' | 'ads')}
                                    className="bg-[#121212] border border-white/8 rounded px-2 py-1 text-[10px] text-white focus:border-[#2196F3] focus:outline-none"
                                  >
                                    <option value="hipfire">Hipfire</option>
                                    <option value="ads">ADS</option>
                                  </select>
                                  <label className="flex items-center gap-1 text-[10px] text-gray-400">
                                    <input
                                      type="checkbox"
                                      checked={recoilAirborne}
                                      onChange={(e) => setRecoilAirborne(e.target.checked)}
                                      className="accent-amber-400"
                                    />
                                    Airborne
                                  </label>
                                </div>
                              </div>
                              {recoilPlot ? (
                                <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_150px]">
                                  <div className="bg-[#121212] border border-white/8 rounded-lg p-2">
                                    <svg
                                      viewBox={`0 0 ${recoilPlot.width} ${recoilPlot.height}`}
                                      className="w-full h-96"
                                    >
                                      <rect
                                        x="0"
                                        y="0"
                                        width={recoilPlot.width}
                                        height={recoilPlot.height}
                                        fill="none"
                                        stroke="#1f2937"
                                        strokeWidth="1"
                                      />
                                      <line
                                        x1={recoilPlot.origin.x}
                                        y1={0}
                                        x2={recoilPlot.origin.x}
                                        y2={recoilPlot.height}
                                        stroke="#1f2937"
                                        strokeWidth="1"
                                      />
                                      <line
                                        x1={0}
                                        y1={recoilPlot.origin.y}
                                        x2={recoilPlot.width}
                                        y2={recoilPlot.origin.y}
                                        stroke="#1f2937"
                                        strokeWidth="1"
                                      />
                                      {recoilPlot.variantPaths.map((variantPath, idx) => {
                                        const lineIndex = idx + 1;
                                        const isActive = recoilHighlightIndex === lineIndex;
                                        return (
                                          <path
                                            key={idx}
                                            d={variantPath}
                                            fill="none"
                                            stroke={recoilPlot.variantColors[idx] || '#f59e0b'}
                                            strokeOpacity={isActive ? 0.5 : 0.06}
                                            strokeWidth={isActive ? 2 : 1}
                                            onMouseEnter={() => setRecoilHighlightIndex(lineIndex)}
                                            onMouseLeave={() => setRecoilHighlightIndex(null)}
                                            className="cursor-pointer"
                                          />
                                        );
                                      })}
                                      <path
                                        d={recoilPlot.path}
                                        fill="none"
                                        stroke="#f59e0b"
                                        strokeWidth={recoilHighlightIndex === 0 ? 2.2 : 1.5}
                                        strokeOpacity={recoilHighlightIndex === null || recoilHighlightIndex === 0 ? 1 : 0.5}
                                        onMouseEnter={() => setRecoilHighlightIndex(0)}
                                        onMouseLeave={() => setRecoilHighlightIndex(null)}
                                        className="cursor-pointer"
                                      />
                                      {recoilPlot.points.map((point, idx) => (
                                        <circle
                                          key={idx}
                                          cx={point.x}
                                          cy={point.y}
                                          r={idx === 0 ? 2.6 : 2}
                                          fill={idx === 0 ? '#f59e0b' : '#fcd34d'}
                                        />
                                      ))}
                                    </svg>
                                  </div>
                                  <div className="text-[10px] text-gray-400 space-y-2">
                                    <div>
                                      <div className="text-[11px] text-white">Pattern</div>
                                      <div className="text-amber-400">{recoilPreview.patternName}</div>
                                    </div>
                                    <div>
                                      <div className="text-[11px] text-white">Shots</div>
                                      <div>{recoilPreview.shots} (from `ammo_clip_size`)</div>
                                    </div>
                                    <div>
                                      <div className="text-[11px] text-white">Scaling</div>
                                      <div>Soft+Hard with base/random, fraction, first shot, decay</div>
                                    </div>
                                    <div>
                                      <div className="text-[11px] text-white">Variant</div>
                                      <div>
                                        {recoilHighlightIndex === null
                                          ? 'None'
                                          : recoilHighlightIndex + 1}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-[11px] text-gray-500">
                                  Select a `viewkick_pattern` to preview recoil.
                                </div>
                              )}
                              {recoilPlot && (
                                <div className="mt-3 space-y-2">
                                  <label className="text-[10px] text-gray-400">
                                    Number of recoil patterns to show
                                  </label>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="range"
                                      min={1}
                                      max={10}
                                      value={recoilVariantCount}
                                      onChange={(e) => setRecoilVariantCount(Number(e.target.value))}
                                      className="w-full accent-amber-400"
                                    />
                                    <span className="text-[10px] text-gray-300 w-6 text-right">
                                      {recoilVariantCount}
                                    </span>
                                  </div>
                                  <div className="flex flex-wrap gap-1.5">
                                    {Array.from({ length: recoilVariantCount }, (_, idx) => {
                                      const isActive = recoilHighlightIndex === idx;
                                      return (
                                        <button
                                          key={idx}
                                          onClick={() => setRecoilHighlightIndex(idx)}
                                          onMouseEnter={() => setRecoilHighlightIndex(idx)}
                                          onMouseLeave={() => setRecoilHighlightIndex(null)}
                                          className={`text-[10px] px-2 py-0.5 rounded border ${
                                            isActive
                                              ? 'border-amber-400 text-amber-300 bg-amber-500/10'
                                              : 'border-white/8 text-gray-400 hover:text-white hover:border-white/30'
                                          }`}
                                          title={idx === 0 ? 'Main path' : `Variant ${idx + 1}`}
                                        >
                                          {idx + 1}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                              <div className="mt-3 text-[10px] text-gray-500">
                                Preview is approximate and does not fully match engine-side recoil or randomization.
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {category.properties.map(prop => (
                              <div key={prop.key} className="flex items-start gap-3">
                                <div className="w-36 flex-shrink-0 pt-1.5">
                                  <label className="text-xs font-medium text-gray-300 block">
                                    {prop.label}
                                  </label>
                                  {prop.description && (
                                    <span className="text-[10px] text-gray-500 block mt-0.5">
                                      {prop.description}
                                    </span>
                                  )}
                                </div>
                                <div className="flex-1 flex items-center gap-2">
                                  {renderPropertyInput(prop)}
                                  {parsedProperties[prop.key] && (
                                    <button
                                      onClick={() => handlePropertyChange(prop.key, '')}
                                      className="p-1 text-gray-500 hover:text-red-400 transition-colors"
                                      title="Clear value"
                                    >
                                      <RotateCcw size={12} />
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Other Properties (not in categories) */}
              {Object.keys(parsedProperties).filter(key => 
                !PROPERTY_CATEGORIES.some(cat => cat.properties.some(p => p.key === key))
              ).length > 0 && (
                <div className="bg-[#1e1e1e] rounded-lg border border-white/5 overflow-hidden">
                  <button
                    onClick={() => toggleCategory('other')}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-cyan-400"><Settings size={14} /></span>
                      <div className="text-left">
                        <span className="text-sm font-medium text-white">Other Properties</span>
                        <span className="text-xs text-gray-500 block">Properties not in standard categories</span>
                      </div>
                    </div>
                    <ChevronDown 
                      size={16} 
                      className={`text-gray-400 transition-transform ${expandedCategories.has('other') ? '' : '-rotate-90'}`} 
                    />
                  </button>
                  
                  {expandedCategories.has('other') && (
                    <div className="px-4 pb-4 space-y-2 border-t border-white/5 pt-3">
                      {Object.entries(parsedProperties)
                        .filter(([key]) => !PROPERTY_CATEGORIES.some(cat => cat.properties.some(p => p.key === key)))
                        .map(([key, value]) => (
                          <div key={key} className="flex items-center gap-3">
                            <div className="w-48 flex-shrink-0">
                              <span className="text-xs font-mono text-cyan-400">{key}</span>
                            </div>
                            <input
                              type="text"
                              value={value}
                              onChange={(e) => handlePropertyChange(key, e.target.value)}
                              className="flex-1 bg-[#121212] border border-white/8 rounded px-2 py-1.5 text-xs text-white focus:border-[#2196F3] focus:outline-none font-mono"
                            />
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}

              {/* Visual Mods Block Editor */}
              {existingBlocks.has('mods') && parsedMods.length > 0 && (
                <div className="bg-[#1e1e1e] rounded-lg border border-[#2196F3]/20 overflow-hidden">
                  <button
                    onClick={() => toggleCategory('mods_visual')}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-[#64B5F6]"><Wand2 size={14} /></span>
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white">Mods</span>
                          <span className="text-xs bg-[#2196F3]/20 text-purple-300 px-1.5 py-0.5 rounded">{parsedMods.length} mods</span>
                        </div>
                        <span className="text-xs text-gray-500 block">Weapon modifications and attachments</span>
                      </div>
                    </div>
                    <ChevronDown 
                      size={16} 
                      className={`text-gray-400 transition-transform ${expandedCategories.has('mods_visual') ? '' : '-rotate-90'}`} 
                    />
                  </button>
                  
                  {expandedCategories.has('mods_visual') && (
                    <div className="px-4 pb-4 space-y-2 border-t border-[#2196F3]/10 pt-3">
                      {parsedMods.map((mod, idx) => (
                        <div key={idx} className="bg-[#121212] rounded-lg border border-white/5 p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-medium text-[#64B5F6]">{mod.name}</span>
                            {Object.keys(mod.properties).length > 0 && (
                              <span className="text-[10px] bg-white/5 text-gray-400 px-1.5 py-0.5 rounded">
                                {Object.keys(mod.properties).length} properties
                              </span>
                            )}
                          </div>
                          {Object.keys(mod.properties).length > 0 ? (
                            <div className="space-y-1.5">
                              {Object.entries(mod.properties).map(([key, value]) => (
                                <div key={key} className="flex items-center gap-2 text-xs">
                                  <span className="text-cyan-400 font-mono w-40 flex-shrink-0 truncate">{key}</span>
                                  <span className="text-green-400 font-mono truncate">{value}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-500 italic">Empty mod (inherits all defaults)</span>
                          )}
                        </div>
                      ))}
                      <p className="text-xs text-gray-500 mt-2">
                        To edit mods, switch to Raw mode
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Visual RUI_CrosshairData Block Editor */}
              {existingBlocks.has('rui_crosshair') && parsedCrosshair && (
                <div className="bg-[#1e1e1e] rounded-lg border border-[#2196F3]/20 overflow-hidden">
                  <button
                    onClick={() => toggleCategory('crosshair_visual')}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-[#64B5F6]"><Target size={14} /></span>
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white">RUI_CrosshairData</span>
                          <span className="text-xs bg-[#2196F3]/20 text-purple-300 px-1.5 py-0.5 rounded">
                            {parsedCrosshair.crosshairs.length} crosshair{parsedCrosshair.crosshairs.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500 block">Crosshair configuration and UI</span>
                      </div>
                    </div>
                    <ChevronDown 
                      size={16} 
                      className={`text-gray-400 transition-transform ${expandedCategories.has('crosshair_visual') ? '' : '-rotate-90'}`} 
                    />
                  </button>
                  
                  {expandedCategories.has('crosshair_visual') && (
                    <div className="px-4 pb-4 space-y-3 border-t border-purple-500/10 pt-3">
                      {/* DefaultArgs */}
                      {Object.keys(parsedCrosshair.defaultArgs).length > 0 && (
                        <div className="bg-[#121212] rounded-lg border border-white/5 p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-medium text-yellow-400">DefaultArgs</span>
                          </div>
                          <div className="space-y-1">
                            {Object.entries(parsedCrosshair.defaultArgs).map(([key, value]) => (
                              <div key={key} className="flex items-center gap-2 text-xs">
                                <span className="text-cyan-400 font-mono w-32 flex-shrink-0">{key}</span>
                                <span className="text-green-400 font-mono">{value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Crosshairs */}
                      {parsedCrosshair.crosshairs.map((crosshair, idx) => (
                        <div key={idx} className="bg-[#121212] rounded-lg border border-white/5 p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-medium text-[#64B5F6]">{crosshair.name}</span>
                          </div>
                          <div className="space-y-1.5">
                            {crosshair.ui && (
                              <div className="flex items-center gap-2 text-xs">
                                <span className="text-cyan-400 font-mono w-24">ui</span>
                                <span className="text-green-400 font-mono">{crosshair.ui}</span>
                              </div>
                            )}
                            {crosshair.baseSpread && (
                              <div className="flex items-center gap-2 text-xs">
                                <span className="text-cyan-400 font-mono w-24">base_spread</span>
                                <span className="text-green-400 font-mono">{crosshair.baseSpread}</span>
                              </div>
                            )}
                            {Object.keys(crosshair.args).length > 0 && (
                              <div className="mt-2 pt-2 border-t border-white/5">
                                <span className="text-[10px] text-gray-500 block mb-1">Args:</span>
                                {Object.entries(crosshair.args).map(([key, value]) => (
                                  <div key={key} className="flex items-center gap-2 text-xs pl-2">
                                    <span className="text-cyan-400/70 font-mono w-32 flex-shrink-0">{key}</span>
                                    <span className="text-green-400/70 font-mono">{value}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      <p className="text-xs text-gray-500 mt-2">
                        To edit crosshair data, switch to Raw mode
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-1.5 bg-[#1e1e1e] border-t border-white/8 text-xs text-gray-500">
        <div className="flex items-center gap-4">
          <span>Properties: {Object.keys(parsedProperties).length}</span>
          <span>Sections: {enabledSections.size}</span>
          {existingBlocks.size > 0 && <span>Blocks: {existingBlocks.size}</span>}
          <span>Lines: {content.split('\n').length}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-amber-400">Weapon Definition</span>
          <span className="text-gray-600">•</span>
          <span>scripts/weapons/{weaponFile.name}.txt</span>
        </div>
      </div>
    </div>
  );
}
