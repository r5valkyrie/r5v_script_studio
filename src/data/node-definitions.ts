import type { NodeDefinition } from '../types/visual-scripting';

export const NODE_DEFINITIONS: NodeDefinition[] = [
  // Init Nodes
  {
    type: 'init-server',
    category: 'init',
    label: 'Init: Server',
    description: 'Server initialization (#if SERVER)',
    color: '#E67E22',
    inputs: [],
    outputs: [
      { label: 'Exec', type: 'exec', isInput: false },
    ],
    defaultData: { functionName: 'CodeCallback_ModInit' },
    documentation: {
      longDescription: 'Entry point for server-side script initialization. This node is called when the server loads your mod. Use it to register callbacks, precache assets, and set up server-side game logic.',
      codeExample: `#if SERVER
void function CodeCallback_ModInit()
{
    // Register callbacks
    AddCallback_OnPlayerKilled( OnPlayerKilled )
    
    // Precache assets
    PrecacheWeapon( $"mp_weapon_custom" )
}
#endif`,
      tips: [
        'Always precache weapons and models here to avoid runtime errors',
        'Register all server callbacks in this function',
        'Use AddSpawnCallback for entity spawn handling',
        'This runs before any players connect'
      ],
      useCases: [
        'Registering player kill/death callbacks',
        'Setting up gamemode-specific logic',
        'Precaching custom weapons and models',
        'Initializing global server variables'
      ],
      relatedNodes: ['init-client', 'init-ui', 'on-entities-did-load', 'add-spawn-callback'],
      exampleDiagram: {
        nodes: [
          { type: 'init-server', position: { x: 50, y: 50 } },
          { type: 'precache-weapon', position: { x: 250, y: 50 } },
          { type: 'add-spawn-callback', position: { x: 450, y: 50 } }
        ],
        connections: [
          { fromNode: 0, fromPort: 'Exec', toNode: 1, toPort: 'In' },
          { fromNode: 1, fromPort: 'Out', toNode: 2, toPort: 'In' }
        ],
        description: 'Typical server init: precache assets then register callbacks'
      }
    }
  },
  {
    type: 'init-client',
    category: 'init',
    label: 'Init: Client',
    description: 'Client initialization (#if CLIENT)',
    color: '#3498DB',
    inputs: [],
    outputs: [
      { label: 'Exec', type: 'exec', isInput: false },
    ],
    defaultData: { functionName: 'ClientCodeCallback_ModInit' },
    documentation: {
      longDescription: 'Entry point for client-side script initialization. Called when a client loads your mod. Use it for registering client-side callbacks, setting up HUD elements, and client-specific precaching.',
      codeExample: `#if CLIENT
void function ClientCodeCallback_ModInit()
{
    // Register client callbacks
    AddCallback_OnClientScriptInit( OnClientScriptInit )
    
    // Setup HUD elements
    RegisterHUDElement( CreateCustomHUD )
}
#endif`,
      tips: [
        'Client code cannot access server-only functions',
        'Use this for visual effects and HUD setup',
        'Client callbacks see local player events',
        'Precache particle effects here'
      ],
      useCases: [
        'Setting up custom HUD elements',
        'Registering client-side visual effects',
        'Initializing client-only variables',
        'Setting up local player callbacks'
      ],
      relatedNodes: ['init-server', 'init-ui', 'get-local-player']
    }
  },
  {
    type: 'init-ui',
    category: 'init',
    label: 'Init: UI',
    description: 'UI initialization (#if UI)',
    color: '#9B59B6',
    inputs: [],
    outputs: [
      { label: 'Exec', type: 'exec', isInput: false },
    ],
    defaultData: { functionName: 'UICodeCallback_ModInit' },
    documentation: {
      longDescription: 'Entry point for UI script initialization. Called when UI scripts are loaded. Use for menu modifications, lobby UI changes, and UI-specific callbacks.',
      codeExample: `#if UI
void function UICodeCallback_ModInit()
{
    // Add custom menu button
    AddMenuButton( "Custom Mode", OpenCustomModeMenu )
    
    // Register UI callbacks
    AddCallback_OnLobbyCreated( OnLobbyCreated )
}
#endif`,
      tips: [
        'UI context is separate from CLIENT context',
        'Use for lobby and menu modifications',
        'Cannot access in-game entities',
        'Good for pre-game configuration'
      ],
      useCases: [
        'Adding custom menu buttons',
        'Modifying lobby UI',
        'Setting up gamemode selection',
        'Pre-game player configuration'
      ],
      relatedNodes: ['init-server', 'init-client']
    }
  },

  // Gamemode Nodes
  {
    type: 'gamemode-create',
    category: 'gamemodes',
    label: 'GameMode Create',
    description: 'Create or reset a gamemode definition',
    color: '#C0392B',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Gamemode', type: 'data', dataType: 'string', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { gamemode: 'MY_MODE' },
    documentation: {
      longDescription: 'Creates a new gamemode definition or resets an existing one. This is the first step in registering a custom gamemode. The gamemode ID must be unique and is typically uppercase with underscores.',
      codeExample: `// Create a new gamemode
GameMode_Create( "CUSTOM_MODE" )

// This initializes the gamemode structure
// Configure with additional nodes after this`,
      tips: [
        'Call this first before other gamemode functions',
        'Gamemode ID should be uppercase (e.g., "DEATHMATCH")',
        'ID must be unique across all gamemodes',
        'Reset existing gamemodes to reconfigure them'
      ],
      useCases: [
        'Creating a new game mode',
        'Resetting gamemode state',
        'Initializing custom mode infrastructure',
        'Setting up mode-specific rules'
      ],
      relatedNodes: ['gamemode-register', 'gamemode-set-name', 'gamemode-set-desc']
    }
  },
  {
    type: 'gamemode-set-name',
    category: 'gamemodes',
    label: 'GameMode Set Name',
    description: 'Set localized display name for a gamemode',
    color: '#C0392B',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Gamemode', type: 'data', dataType: 'string', isInput: true },
      { label: 'Name', type: 'data', dataType: 'string', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { gamemode: 'MY_MODE', name: '#GAMEMODE_MY_MODE' },
    documentation: {
      longDescription: 'Sets the display name shown in the mode selection menu. Use a localization string (starting with #) to support multiple languages. The string should match a key in your localization files.',
      codeExample: `// Set the display name
GameMode_SetName( "CUSTOM_MODE", "#GAMEMODE_CUSTOM_MODE" )

// In localization file:
// #GAMEMODE_CUSTOM_MODE "Custom Mode"`,
      tips: [
        'Use localization strings for multi-language support',
        'The name appears in the mode selection screen',
        'Keep names concise and descriptive',
        'Must be called after GameMode_Create'
      ],
      useCases: [
        'Setting mode display names',
        'Localized mode names',
        'Mode branding',
        'Multi-language support'
      ],
      relatedNodes: ['gamemode-create', 'gamemode-set-desc', 'gamemode-register']
    }
  },
  {
    type: 'gamemode-set-desc',
    category: 'gamemodes',
    label: 'GameMode Set Description',
    description: 'Set localized description text for a gamemode',
    color: '#C0392B',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Gamemode', type: 'data', dataType: 'string', isInput: true },
      { label: 'Description', type: 'data', dataType: 'string', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { gamemode: 'MY_MODE', description: '#MY_MODE_DESC' },
    documentation: {
      longDescription: 'Sets the description shown in the mode selection menu. Use a localization string to support multiple languages. Describe the mode\'s rules and gameplay.',
      codeExample: `// Set the mode description
GameMode_SetDesc( "CUSTOM_MODE", "#MY_MODE_DESC" )

// In localization file:
// #MY_MODE_DESC "Eliminate all opponents to win!"`,
      tips: [
        'Use localization strings for multi-language support',
        'Briefly describe mode rules',
        'Mention win conditions',
        'Include any special features'
      ],
      useCases: [
        'Setting mode descriptions',
        'Explaining rules to players',
        'Marketing the mode',
        'Multi-language support'
      ],
      relatedNodes: ['gamemode-create', 'gamemode-set-name', 'gamemode-register']
    }
  },
  {
    type: 'gamemode-set-score-limits',
    category: 'gamemodes',
    label: 'GameMode Set Score Limits',
    description: 'Configure score and round score limits',
    color: '#C0392B',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Gamemode', type: 'data', dataType: 'string', isInput: true },
      { label: 'Score Limit', type: 'data', dataType: 'int', isInput: true },
      { label: 'Round Score Limit', type: 'data', dataType: 'int', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { gamemode: 'MY_MODE', scoreLimit: 50, roundScoreLimit: 0 },
    documentation: {
      longDescription: 'Sets the winning score threshold and per-round score limit. When a team or player reaches the score limit, the match ends. Set roundScoreLimit to 0 for unlimited.',
      codeExample: `// Set score limits for a deathmatch mode
GameMode_SetScoreLimit( "CUSTOM_DM", 100, 0 )

// Teams earn points throughout the match
// First to 100 points wins`,
      tips: [
        'Score Limit is the winning threshold',
        'Round Score Limit for per-round scoring',
        'Set to 0 for no limit',
        'Works with built-in score tracking'
      ],
      useCases: [
        'Setting win conditions',
        'Scoring-based modes',
        'Round-based scoring',
        'Competitive mode setup'
      ],
      relatedNodes: ['gamemode-create', 'gamemode-register', 'gamemode-set-time-limits']
    }
  },
  {
    type: 'gamemode-set-time-limits',
    category: 'gamemodes',
    label: 'GameMode Set Time Limits',
    description: 'Configure time and round time limits',
    color: '#C0392B',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Gamemode', type: 'data', dataType: 'string', isInput: true },
      { label: 'Time Limit', type: 'data', dataType: 'int', isInput: true },
      { label: 'Round Time Limit', type: 'data', dataType: 'float', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { gamemode: 'MY_MODE', timeLimit: 15, roundTimeLimit: 0.0 },
    documentation: {
      longDescription: 'Sets the match duration in minutes. Time Limit is the total match duration. Round Time Limit is for per-round timers. Set to 0 for no time limit.',
      codeExample: `// Set 10 minute match
GameMode_SetTimeLimit( "CUSTOM_MODE", 10, 0 )

// Match ends when time expires
// Scores are compared to determine winner`,
      tips: [
        'Time is in minutes',
        'Use 0 for no limit',
        'Works with built-in timer UI',
        'Combined with score limit for sudden death'
      ],
      useCases: [
        'Setting match duration',
        'Timed rounds',
        'Countdown modes',
        'Competitive play'
      ],
      relatedNodes: ['gamemode-create', 'gamemode-set-score-limits', 'gamemode-register']
    }
  },
  {
    type: 'gamemode-add-scoreboard-column',
    category: 'gamemodes',
    label: 'GameMode Add Scoreboard Column',
    description: 'Add custom scoreboard column data for a gamemode',
    color: '#C0392B',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Gamemode', type: 'data', dataType: 'string', isInput: true },
      { label: 'Title', type: 'data', dataType: 'string', isInput: true },
      { label: 'Score Type', type: 'data', dataType: 'int', isInput: true },
      { label: 'Num Digits', type: 'data', dataType: 'int', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { gamemode: 'MY_MODE', title: '#SCOREBOARD_KILLS', scoreType: 0, numDigits: 2 },
    documentation: {
      longDescription: 'Adds a custom column to the scoreboard for this gamemode. Score Type determines what metric to display (kills, score, etc.). Num Digits controls padding for the display.',
      codeExample: `// Add kills column to scoreboard
GameMode_AddScoreboardColumn( "CUSTOM_DM", "#SCOREBOARD_KILLS", 0, 3 )

// Score Type 0 = Kills
// Score Type 1 = Score
// etc.`,
      tips: [
        'Use localization string for column title',
        'Multiple columns can be added',
        'Score Type determines the data shown',
        'Num Digits for alignment'
      ],
      useCases: [
        'Custom scoreboard displays',
        'Mode-specific stats',
        'Leaderboard columns',
        'Team scoring'
      ],
      relatedNodes: ['gamemode-register', 'gamemode-create']
    }
  },
  {
    type: 'gamemode-add-shared-init',
    category: 'gamemodes',
    label: 'GameMode Add Shared Init',
    description: 'Add shared init function for a gamemode',
    color: '#C0392B',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Gamemode', type: 'data', dataType: 'string', isInput: true },
      { label: 'Function', type: 'data', dataType: 'function', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { gamemode: 'MY_MODE', function: 'GamemodeShared_Init' },
    documentation: {
      longDescription: 'Registers a shared initialization function that runs on both server and client. This is called once when the gamemode is initialized, before player connections.',
      codeExample: `// Shared initialization
void function GamemodeCustom_Init()
{
    // Runs on both server and client
    // Set up shared game rules
    // Register shared callbacks
}

// Register it
GameMode_AddSharedInitFunction( "CUSTOM_MODE", GamemodeCustom_Init )`,
      tips: [
        'Runs on both server and client',
        'Use for shared game state',
        'Don\'t use for player-specific logic',
        'Runs before players join'
      ],
      useCases: [
        'Setting shared rules',
        'Initializing global state',
        'Shared entity setup',
        'Cross-client logic'
      ],
      relatedNodes: ['gamemode-add-server-init', 'gamemode-add-client-init', 'init-server']
    }
  },
  {
    type: 'gamemode-add-server-init',
    category: 'gamemodes',
    label: 'GameMode Add Server Init',
    description: 'Add server-only init function for a gamemode',
    color: '#C0392B',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Gamemode', type: 'data', dataType: 'string', isInput: true },
      { label: 'Function', type: 'data', dataType: 'function', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { gamemode: 'MY_MODE', function: 'GamemodeServer_Init' },
    serverOnly: true,
    documentation: {
      longDescription: 'Registers a server-only initialization function. This runs only on the server when the gamemode starts. Use for server-side logic like spawn points, scoring, and player management.',
      codeExample: `// Server-side initialization
void function GamemodeCustom_InitServer()
{
    // Server-only setup
    AddCallback_OnPlayerKilled( OnPlayerKilled )
    
    // Set up spawn points
    // Initialize scoring
}

// Register it
GameMode_AddServerInitFunction( "CUSTOM_MODE", GamemodeCustom_InitServer )`,
      tips: [
        'Server-only execution',
        'Use for player callbacks',
        'Manage spawns and scoring',
        'Can\'t be called from client'
      ],
      useCases: [
        'Player event handling',
        'Server-side scoring',
        'Spawn management',
        'Server-only rules'
      ],
      relatedNodes: ['gamemode-add-shared-init', 'gamemode-add-client-init', 'init-server']
    }
  },
  {
    type: 'gamemode-add-client-init',
    category: 'gamemodes',
    label: 'GameMode Add Client Init',
    description: 'Add client-only init function for a gamemode',
    color: '#C0392B',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Gamemode', type: 'data', dataType: 'string', isInput: true },
      { label: 'Function', type: 'data', dataType: 'function', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { gamemode: 'MY_MODE', function: 'GamemodeClient_Init' },
    clientOnly: true,
    documentation: {
      longDescription: 'Registers a client-only initialization function. This runs on each client when the gamemode starts. Use for UI, effects, and client-side state management.',
      codeExample: `// Client-side initialization
void function GamemodeCustom_InitClient()
{
    // Client-only setup
    RegisterHUDElement( CustomHUD )
    
    // Play intro effects
    // Set up client callbacks
}

// Register it
GameMode_AddClientInitFunction( "CUSTOM_MODE", GamemodeCustom_InitClient )`,
      tips: [
        'Client-only execution',
        'Use for UI and effects',
        'Can\'t access server functions',
        'Runs for each connected client'
      ],
      useCases: [
        'UI setup',
        'Client effects',
        'Local player state',
        'HUD elements'
      ],
      relatedNodes: ['gamemode-add-shared-init', 'gamemode-add-server-init', 'init-client']
    }
  },
  {
    type: 'gamemode-set-evac',
    category: 'gamemodes',
    label: 'GameMode Set Evac Enabled',
    description: 'Toggle evac for a gamemode',
    color: '#C0392B',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Gamemode', type: 'data', dataType: 'string', isInput: true },
      { label: 'Enabled', type: 'data', dataType: 'boolean', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { gamemode: 'MY_MODE', enabled: false },
    documentation: {
      longDescription: 'Enables or disables the evac plane for this gamemode. When enabled, players can evac from the dropship during the match. Common in survival-style modes.',
      codeExample: `// Enable evac for survival mode
GameMode_SetEvac( "CUSTOM_SURVIVAL", true )

// Players can call evac during match
// Evac plane appears when called`,
      tips: [
        'Works with survival game modes',
        'Enables evac drop functionality',
        'Disable for fixed-position modes',
        'Related to survival zone logic'
      ],
      useCases: [
        'Survival mode evac',
        'Extraction mechanics',
        'Dynamic zone modes',
        'Battle royale style'
      ],
      relatedNodes: ['gamemode-register', 'gamemode-create']
    }
  },
  {
    type: 'gamemode-register-spawn-func',
    category: 'gamemodes',
    label: 'Register Gamemode Spawn Func',
    description: 'Register spawn rating function for pilots or titans',
    color: '#C0392B',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Gamemode', type: 'data', dataType: 'string', isInput: true },
      { label: 'Function', type: 'data', dataType: 'function', isInput: true },
      { label: 'Is Pilot Spawn', type: 'data', dataType: 'boolean', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { gamemode: 'MY_MODE', function: 'RateSpawnpoints_Generic', isPilot: true },
    serverOnly: true,
    documentation: {
      longDescription: 'Registers a spawn point rating function that determines where players/NPCs spawn. The function returns a rating for each spawn point, and the highest-rated valid point is chosen. Separate functions can be registered for pilots and titans.',
      codeExample: `// Custom spawn rating
float function CustomSpawnRating( entity spawnPoint, array entities )
{
    // Rate spawn points based on distance from enemies
    float rating = 1000.0
    
    foreach ( entity player in entities )
    {
        if ( player.GetTeam() != GetLocalTeam() )
        {
            float dist = Distance( spawnPoint.GetOrigin(), player.GetOrigin() )
            if ( dist < 500 )
                rating -= 100
        }
    }
    
    return rating
}

// Register for pilots
GameMode_AddSpawnFunc( "CUSTOM_MODE", CustomSpawnRating, true )`,
      tips: [
        'Higher rating = more likely to spawn',
        'Return -1 to mark point as invalid',
        'Separate functions for pilot vs titan',
        'Called for each potential spawn point'
      ],
      useCases: [
        'Balanced spawn systems',
        'Avoiding spawn kills',
        'Team-based spawn logic',
        'Objective-based spawning'
      ],
      relatedNodes: ['gamemode-add-server-init', 'gamemode-register']
    }
  },
  {
    type: 'gamemode-register',
    category: 'gamemodes',
    label: 'Register Gamemode',
    description: 'Register a custom gamemode and playlist entry',
    color: '#C0392B',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Gamemode', type: 'data', dataType: 'string', isInput: true },
      { label: 'Mod Name', type: 'data', dataType: 'string', isInput: true },
      { label: 'Display Name', type: 'data', dataType: 'string', isInput: true },
      { label: 'Description', type: 'data', dataType: 'string', isInput: true },
      { label: 'Custom Scoreboard', type: 'data', dataType: 'boolean', isInput: true },
      { label: 'Shared Init Fn', type: 'data', dataType: 'string', isInput: true },
      { label: 'Server Init Fn', type: 'data', dataType: 'string', isInput: true },
      { label: 'Client Init Fn', type: 'data', dataType: 'string', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: {
      gamemode: 'MY_MODE',
      modName: 'my_mod',
      displayName: 'My Mode',
      description: 'Custom mode description',
      customScoreboard: false,
      sharedInitFn: 'GamemodeSurvivalShared_Init',
      serverInitFn: '',
      clientInitFn: '',
    },
    documentation: {
      longDescription: 'Registers a complete custom gamemode with all necessary configuration. This is the main node for creating new gamemodes that appear in the playlist.',
      codeExample: `// In shared init\nGameMode_Create( "CUSTOM_MODE" )\nGameMode_SetName( "CUSTOM_MODE", "#GAMEMODE_CUSTOM" )\nGameMode_SetDesc( "CUSTOM_MODE", "#GAMEMODE_CUSTOM_DESC" )\nGameMode_SetScoreLimit( "CUSTOM_MODE", 50 )\nGameMode_AddSharedInitFunction( "CUSTOM_MODE", GamemodeSurvival_Init )\nGameMode_AddServerInitFunction( "CUSTOM_MODE", GamemodeSurvival_Init_Server )`,
      tips: [
        'Gamemode ID should be UPPERCASE with underscores',
        'Display name should use localization string (#)',
        'Provide both shared and server init functions',
        'Use Custom Scoreboard for non-standard scoring'
      ],
      useCases: [
        'Creating a new multiplayer mode',
        'Setting up survival variants',
        'Building custom competitive modes',
        'Defining gamemode with custom rules'
      ],
      relatedNodes: ['gamemode-create', 'gamemode-set-name', 'gamemode-set-score-limits', 'init-server'],
      exampleDiagram: {
        nodes: [
          { type: 'init-server', position: { x: 50, y: 80 } },
          { type: 'gamemode-register', position: { x: 250, y: 50 } }
        ],
        connections: [
          { fromNode: 0, fromPort: 'Exec', toNode: 1, toPort: 'In' }
        ],
        description: 'Register custom gamemode during server initialization'
      }
    }
  },
  {
    type: 'get-game-state',
    category: 'gamemodes',
    label: 'GetGameState',
    description: 'Get current game state',
    color: '#C0392B',
    inputs: [],
    outputs: [
      { label: 'State', type: 'data', dataType: 'int', isInput: false },
    ],
    defaultData: {},
    tags: ['gamestate', 'state', 'gamemode'],
    documentation: {
      longDescription: 'Returns the current game state enum value. Game states include playing, intermission, Sudden Death, etc. Use with Game State Enter callback to detect state changes.',
      codeExample: `// Check current game state
int state = GetGameState()

if ( state == eGameState.Playing )
{
    print( "Match is in progress" )
}
else if ( state == eGameState.SuddenDeath )
{
    print( "Sudden Death!" )
}`,
      tips: [
        'Returns int enum value',
        'Common states: Playing, Intermission, SuddenDeath',
        'Use with OnGameStatePostEnter callback',
        'Check eGameState enum for values'
      ],
      useCases: [
        'Checking match status',
        'Conditional game logic',
        'State-based behaviors',
        'UI state display'
      ],
      relatedNodes: ['set-game-state', 'on-game-state-enter']
    }
  },
  {
    type: 'set-game-state',
    category: 'gamemodes',
    label: 'SetGameState',
    description: 'Set game state',
    color: '#C0392B',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'State', type: 'data', dataType: 'int', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { state: 0 },
    tags: ['gamestate', 'state', 'gamemode'],
    documentation: {
      longDescription: 'Sets the game to a new state. This triggers the OnGameStatePostEnter callback on all clients. Use this to manually advance game states for custom mode logic.',
      codeExample: `// Advance to Sudden Death
SetGameState( eGameState.SuddenDeath )

// This triggers callbacks on all clients
// UI and logic can react to state change`,
      tips: [
        'Triggers state change callbacks',
        'Use eGameState enum values',
        'Works with built-in game state logic',
        'Use for custom mode state machines'
      ],
      useCases: [
        'Starting matches',
        'Transitioning to intermission',
        'Sudden Death triggers',
        'Custom state machines'
      ],
      relatedNodes: ['get-game-state', 'on-game-state-enter']
    }
  },

  // Core Flow Nodes
  {
    type: 'sequence',
    category: 'flow',
    label: 'Sequence',
    description: 'Execute actions in sequence',
    color: '#4A90E2',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
    ],
    outputs: [
      { label: 'Out 1', type: 'exec', isInput: false },
      { label: 'Out 2', type: 'exec', isInput: false },
      { label: 'Out 3', type: 'exec', isInput: false },
    ],
    defaultData: {},
    documentation: {
      longDescription: 'Executes multiple output paths in order. Each output fires after the previous one completes. Use Exec Sequence for dynamic output count.',
      codeExample: `// Generated code structure:
DoFirstThing()   // Out 1
DoSecondThing()  // Out 2
DoThirdThing()   // Out 3`,
      tips: [
        'All outputs execute synchronously in order',
        'Use Exec Sequence node for variable output count',
        'Great for initialization chains',
        'Each path completes before the next starts'
      ],
      useCases: [
        'Running multiple setup operations in order',
        'Chaining related function calls',
        'Breaking complex logic into steps'
      ],
      relatedNodes: ['exec-sequence', 'branch', 'delay'],
      exampleDiagram: {
        nodes: [
          { type: 'sequence', position: { x: 50, y: 50 } },
          { type: 'print', position: { x: 250, y: 20 }, label: 'Print "Step 1"' },
          { type: 'print', position: { x: 250, y: 80 }, label: 'Print "Step 2"' },
          { type: 'print', position: { x: 250, y: 140 }, label: 'Print "Step 3"' }
        ],
        connections: [
          { fromNode: 0, fromPort: 'Out 1', toNode: 1, toPort: 'In' },
          { fromNode: 0, fromPort: 'Out 2', toNode: 2, toPort: 'In' },
          { fromNode: 0, fromPort: 'Out 3', toNode: 3, toPort: 'In' }
        ],
        description: 'Execute three print statements in order'
      }
    }
  },
  {
    type: 'exec-sequence',
    category: 'flow',
    label: 'Exec Sequence',
    description: 'Split execution into multiple outputs that fire in order. Click + to add outputs, - to remove.',
    color: '#6B5B95',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
    ],
    outputs: [
      { label: 'Then 0', type: 'exec', isInput: false },
      { label: 'Then 1', type: 'exec', isInput: false },
    ],
    defaultData: {
      outputCount: 2,
    },
    documentation: {
      longDescription: 'Splits execution flow into multiple sequential outputs. Unlike the fixed 3-output Sequence node, this allows dynamically adding or removing outputs to chain multiple operations in order.',
      codeExample: `// Chain multiple operations
DoFirstThing()          // Then 0
DoSecondThing()         // Then 1
DoThirdThing()          // Then 2 (add via + button)`,
      tips: [
        'Use + and - buttons to add/remove output ports',
        'Each output fires sequentially after the previous one completes',
        'Great for initialization sequences and setup chains',
        'Each connected node runs to completion before the next fires'
      ],
      useCases: [
        'Initializing multiple game systems in order',
        'Setting up entities with multiple properties',
        'Chaining animation or effect sequences',
        'Sequential spawn operations'
      ],
      relatedNodes: ['sequence', 'delay', 'thread']
    }
  },
  {
    type: 'branch',
    category: 'flow',
    label: 'Branch',
    description: 'Conditional branch based on boolean',
    color: '#4A90E2',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Condition', type: 'data', dataType: 'boolean', isInput: true },
    ],
    outputs: [
      { label: 'True', type: 'exec', isInput: false },
      { label: 'False', type: 'exec', isInput: false },
    ],
    defaultData: {},
    documentation: {
      longDescription: 'Executes one of two paths based on a boolean condition. Connect comparison or boolean nodes to the Condition input.',
      codeExample: `if ( condition )
{
    // True path
    DoSomething()
}
else
{
    // False path
    DoSomethingElse()
}`,
      tips: [
        'Only one path will execute',
        'Connect comparison nodes for complex conditions',
        'Use for player state checks, health thresholds, etc.',
        'Nest branches for multiple conditions'
      ],
      useCases: [
        'Check if player is alive before action',
        'Different behavior for different teams',
        'Health threshold triggers',
        'Game state validation'
      ],
      relatedNodes: ['sequence', 'switch', 'compare-equal', 'compare-greater'],
      exampleDiagram: {
        nodes: [
          { type: 'is-alive', position: { x: 50, y: 50 }, label: 'Is Alive?' },
          { type: 'branch', position: { x: 220, y: 50 } },
          { type: 'print', position: { x: 400, y: 20 }, label: 'Player alive!' },
          { type: 'print', position: { x: 400, y: 100 }, label: 'Player dead!' }
        ],
        connections: [
          { fromNode: 0, fromPort: 'Result', toNode: 1, toPort: 'Condition' },
          { fromNode: 1, fromPort: 'True', toNode: 2, toPort: 'In' },
          { fromNode: 1, fromPort: 'False', toNode: 3, toPort: 'In' }
        ],
        description: 'Check if entity is alive and branch accordingly'
      }
    }
  },
  {
    type: 'delay',
    category: 'flow',
    label: 'Delay',
    description: 'Wait for specified duration (wait)',
    color: '#4A90E2',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Duration', type: 'data', dataType: 'number', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { duration: 1.0 },
    documentation: {
      longDescription: 'Pauses execution for the specified duration in seconds. Uses the wait() function which yields the current thread. The code after the delay continues on the same thread.',
      codeExample: `// Wait for 2 seconds
wait 2.0

// Continue execution
DoNextThing()`,
      tips: [
        'Duration is in seconds (1.0 = 1 second)',
        'Use for timed sequences and cooldowns',
        'Delays block the current thread only',
        'Combine with Thread node for non-blocking delays'
      ],
      useCases: [
        'Timed ability cooldowns',
        'Delayed spawn sequences',
        'Animation timing',
        'Countdown implementations'
      ],
      relatedNodes: ['wait', 'thread', 'sequence', 'loop-for']
    }
  },
  {
    type: 'loop-for',
    category: 'flow',
    label: 'For Loop',
    description: 'Loop from start to end with step',
    color: '#4A90E2',
    documentation: {
      longDescription: 'Iterates from a start value to an end value with a configurable step. The Loop Body output fires once per iteration with the current index value available.',
      codeExample: `for ( int i = 0; i < 10; i++ )
{
    // Loop body executes 10 times
    print( "Index: " + i )
}`,
      tips: [
        'Index starts at Start value and increments by Step',
        'Loop terminates when Index >= End',
        'Use the Index output to access current iteration number',
        'Completed output fires after all iterations'
      ],
      useCases: [
        'Spawning multiple entities',
        'Iterating through player arrays',
        'Creating timed sequences',
        'Processing batches of data'
      ],
      relatedNodes: ['loop-foreach', 'loop-while', 'array-get']
    },
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Start', type: 'data', dataType: 'number', isInput: true },
      { label: 'End', type: 'data', dataType: 'number', isInput: true },
      { label: 'Step', type: 'data', dataType: 'number', isInput: true },
    ],
    outputs: [
      { label: 'Loop', type: 'exec', isInput: false },
      { label: 'Index', type: 'data', dataType: 'number', isInput: false },
      { label: 'Done', type: 'exec', isInput: false },
    ],
    defaultData: { start: 0, end: 10, step: 1 },
  },
  {
    type: 'loop-foreach',
    category: 'flow',
    label: 'For Each',
    description: 'Iterate over array elements',
    color: '#4A90E2',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Array', type: 'data', dataType: 'array', isInput: true },
    ],
    outputs: [
      { label: 'Loop', type: 'exec', isInput: false },
      { label: 'Element', type: 'data', dataType: 'any', isInput: false },
      { label: 'Index', type: 'data', dataType: 'number', isInput: false },
      { label: 'Done', type: 'exec', isInput: false },
    ],
    defaultData: {},
    documentation: {
      longDescription: 'Iterates through each element in an array. The Loop output fires once per element with the current element and its index available. The Done output fires after all elements have been processed.',
      codeExample: `foreach ( entity player in GetPlayerArray() )
{
    // Process each player
    print( "Found player: " + player.GetPlayerName() )
}`,
      tips: [
        'Element output changes each iteration - connect to where you need the current value',
        'Index starts at 0 and increments for each element',
        'Done fires after the Loop has fired for all elements',
        'Modifying the array during iteration can cause unexpected behavior'
      ],
      useCases: [
        'Processing all players in the game',
        'Applying effects to multiple entities',
        'Validating or modifying array contents',
        'Searching for specific elements'
      ],
      relatedNodes: ['loop-for', 'loop-while', 'array-get', 'array-length']
    }
  },
  {
    type: 'loop-while',
    category: 'flow',
    label: 'While Loop',
    description: 'Loop while condition is true',
    color: '#4A90E2',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Condition', type: 'data', dataType: 'boolean', isInput: true },
    ],
    outputs: [
      { label: 'Loop', type: 'exec', isInput: false },
      { label: 'Done', type: 'exec', isInput: false },
    ],
    defaultData: {},
    documentation: {
      longDescription: 'Continuously executes the Loop output while the Condition remains true. The condition is re-evaluated before each iteration. Use carefully as infinite loops can freeze the game.',
      codeExample: `bool condition = true
int count = 0

while ( condition && count < 10 )
{
    count++
    // Do something each iteration
    if ( count >= 10 )
        condition = false`,
      tips: [
        'Always ensure the condition can become false to avoid infinite loops',
        'Consider adding a counter or timeout for safety',
        'The condition is checked before each Loop iteration',
        'Done fires immediately if condition is false when starting'
      ],
      useCases: [
        'Waiting for a condition to become true',
        'Repeatedly checking entity states',
        'Polling for player actions',
        'Animation loops with exit conditions'
      ],
      relatedNodes: ['loop-for', 'loop-foreach', 'branch', 'delay']
    }
  },
  {
    type: 'wait',
    category: 'flow',
    label: 'Wait',
    description: 'Wait for duration in thread',
    color: '#4A90E2',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Duration', type: 'data', dataType: 'number', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { duration: 0.0 },
    documentation: {
      longDescription: 'Pauses execution for the specified duration. Unlike the Delay node which uses wait(), this uses the Wait() function for more explicit control. The calling thread yields and resumes after the duration.',
      codeExample: `// Wait for 3 seconds
wait 3.0

// Continue execution
print( "3 seconds have passed!" )`,
      tips: [
        'Duration is in seconds (1.0 = 1 second)',
        'Use Wait() for clearer intent in threaded code',
        'Combined with loops for timed intervals',
        'Consider using coroutines for complex timing'
      ],
      useCases: [
        'Creating cooldown timers',
        'Delaying respawns',
        'Animation timing',
        'Periodic updates or checks'
      ],
      relatedNodes: ['delay', 'thread', 'loop-while']
    }
  },
  {
    type: 'signal',
    category: 'flow',
    label: 'Signal',
    description: 'Send signal to entity (Signal)',
    color: '#4A90E2',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Entity', type: 'data', dataType: 'entity', isInput: true },
      { label: 'Signal', type: 'data', dataType: 'string', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { signal: 'MySignal' },
    documentation: {
      longDescription: 'Sends a signal to an entity, which triggers any registered signal handlers. Signals are used for entity-to-entity communication and event handling.',
      codeExample: `// Send a signal to an NPC
entity npc = GetEntByScriptName( "my_npc" )
Signal( npc, "Attack" )

// In the NPC's code, this would trigger:
// void function OnSignal( string signalName )
// {
//     if ( signalName == "Attack" )
//         StartAttack()
// }`,
      tips: [
        'Use Register Signal to set up signal handlers first',
        'Signal names are case-sensitive',
        'Multiple entities can respond to the same signal',
        'EndSignal cancels a signal before it fires'
      ],
      useCases: [
        'Triggering AI behaviors',
        'Coordinating entity actions',
        'Animation triggers',
        'State machine transitions'
      ],
      relatedNodes: ['register-signal', 'wait-signal', 'end-signal']
    }
  },
  {
    type: 'end-signal',
    category: 'flow',
    label: 'End Signal',
    description: 'End signal on entity (EndSignal)',
    color: '#4A90E2',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Entity', type: 'data', dataType: 'entity', isInput: true },
      { label: 'Signal', type: 'data', dataType: 'string', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { signal: 'MySignal' },
    documentation: {
      longDescription: 'Cancels a pending signal on an entity. If the signal was queued but not yet processed, EndSignal prevents it from executing. Useful for interrupting signal-based behaviors.',
      codeExample: `// Prevent a signal from firing
entity npc = GetEntByScriptName( "my_npc" )

// If "Attack" was queued, this cancels it
EndSignal( npc, "Attack" )`,
      tips: [
        'Use to prevent queued signals from executing',
        'Works on signals sent via Signal() or threaded signals',
        'Signal handlers must use WaitSignal() to be cancellable',
        'Does not affect signals already being processed'
      ],
      useCases: [
        'Cancelling queued animations',
        'Interrupting AI behaviors',
        'Preventing duplicate signal handlers',
        'State machine cleanup'
      ],
      relatedNodes: ['signal', 'wait-signal', 'register-signal']
    }
  },
  {
    type: 'wait-signal',
    category: 'flow',
    label: 'Wait Signal',
    description: 'Wait for signal on entity (WaitSignal)',
    color: '#4A90E2',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Entity', type: 'data', dataType: 'entity', isInput: true },
      { label: 'Signal', type: 'data', dataType: 'string', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { signal: 'MySignal' },
    documentation: {
      longDescription: 'Pauses execution until the specified signal is received by the entity. The current thread yields and resumes when Signal() is called with a matching signal name. Can be cancelled with EndSignal().',
      codeExample: `// Wait for a signal on an NPC
entity npc = GetEntByScriptName( "my_npc" )

// This will pause until Signal(npc, "Ready") is called
WaitSignal( npc, "Ready" )

// After signal is received, execution continues
print( "NPC is ready!" )`,
      tips: [
        'The thread yields until the signal is received',
        'Use EndSignal() to cancel and prevent hanging',
        'Signal handlers must be registered first',
        'Multiple WaitSignals can wait for different signals'
      ],
      useCases: [
        'Waiting for entity initialization',
        'Synchronizing entity behaviors',
        'Creating sequential animations',
        'Coordinating multi-step events'
      ],
      relatedNodes: ['signal', 'end-signal', 'register-signal', 'delay']
    }
  },
  {
    type: 'register-signal',
    category: 'flow',
    label: 'Register Signal',
    description: 'Register signal on entity',
    color: '#4A90E2',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Entity', type: 'data', dataType: 'entity', isInput: true },
      { label: 'Signal', type: 'data', dataType: 'string', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { signal: 'MySignal' },
    documentation: {
      longDescription: 'Registers a signal name on an entity, allowing it to receive and handle that signal. Must be called before using WaitSignal() to wait for signals on that entity.',
      codeExample: `// Register that an entity can receive the "Move" signal
entity npc = GetEntByScriptName( "my_npc" )
RegisterSignal( npc, "Move" )
RegisterSignal( npc, "Attack" )

// Now these can be used:
// WaitSignal( npc, "Move" )
// Signal( npc, "Attack" )`,
      tips: [
        'Register signals during entity initialization',
        'Each signal name must be registered separately',
        'Allows WaitSignal() to work with that entity',
        'Signal names should be descriptive'
      ],
      useCases: [
        'Setting up entity communication',
        'Preparing for async signal handling',
        'Creating extensible entity behaviors',
        'Implementing observer patterns'
      ],
      relatedNodes: ['signal', 'wait-signal', 'end-signal']
    }
  },
  {
    type: 'reroute',
    category: 'flow',
    label: 'Reroute',
    description: 'Reroute connections for cleaner wire organization',
    color: '#6B7280',
    inputs: [
      { label: 'In', type: 'data', dataType: 'any', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'data', dataType: 'any', isInput: false },
    ],
    defaultData: { isExec: false },
    documentation: {
      longDescription: 'A utility node that passes through data or execution flow to help organize complex graphs. Useful for creating cleaner visual layouts by rerouting wires around other nodes.',
      codeExample: `// Reroute doesn't change the data
// It just provides a visual way to organize connections

// Input -> Reroute -> Output
// Value passes through unchanged`,
      tips: [
        'Use to clean up crossing wires',
        'Can handle both data and exec flow (toggle isExec)',
        'Chain multiple reroutes for complex paths',
        'Does not modify or transform the data'
      ],
      useCases: [
        'Cleaning up complex node graphs',
        'Creating visual separation in graphs',
        'Grouping related functionality',
        'Avoiding wire spaghetti'
      ],
      relatedNodes: ['comment', 'sequence']
    }
  },
  {
    type: 'return',
    category: 'flow',
    label: 'Return',
    description: 'Return value from function',
    color: '#4A90E2',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Value', type: 'data', dataType: 'any', isInput: true },
    ],
    outputs: [],
    defaultData: {},
    documentation: {
      longDescription: 'Returns a value from the current function context. Used in custom functions to output results back to the calling code. Terminates function execution.',
      codeExample: `// In a custom function that calculates distance
float function CalculateDistance( vector a, vector b )
{
    vector diff = b - a
    return diff.Length()
}

// Or in visual scripting:
// Return node sends value back to caller`,
      tips: [
        'Terminates function execution immediately',
        'Can return any data type',
        'Use with Custom Function nodes',
        'Value output must be connected to function output'
      ],
      useCases: [
        'Returning calculation results',
        'Early exit from functions',
        'Returning entity references',
        'Error handling with null returns'
      ],
      relatedNodes: ['custom-function', 'call-function']
    }
  },
  {
    type: 'call-function',
    category: 'flow',
    label: 'Call Function',
    description: 'Call a function by name with optional arguments and return value. Use +/- to add arguments.',
    color: '#4A90E2',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { functionName: 'MyFunction', returnType: 'none', argCount: 0, threaded: false },
    documentation: {
      longDescription: 'Calls an existing function by name, passing optional arguments. The function must be defined and GlobalizeFunction() called to make it accessible. The Return output provides the function\'s return value.',
      codeExample: `// Call a previously defined and globalized function
function MyFunction( int value ) => string
{
    return "Value is: " + value
}

// In visual scripting:
// Call Function -> MyFunction
// Arguments connected -> Return value available`,
      tips: [
        'Function must be globalized to be callable',
        'Use Function Reference node to connect the function',
        'Return output provides the function\'s return value',
        'Threaded mode runs function in separate thread'
      ],
      useCases: [
        'Calling utility functions',
        'Reusing common logic',
        'Integrating with existing scripts',
        'Organizing complex operations'
      ],
      relatedNodes: ['custom-function', 'function-ref', 'globalize-function']
    }
  },
  {
    type: 'custom-function',
    category: 'flow',
    label: 'Define Function',
    description: 'User-defined function entry point. Use +/- to add parameters.',
    color: '#4A90E2',
    inputs: [],
    outputs: [
      { label: 'Exec', type: 'exec', isInput: false },
    ],
    defaultData: { functionName: 'MyFunction', returnType: 'void', paramCount: 0, paramNames: [], paramTypes: [], isGlobal: false },
    documentation: {
      longDescription: 'Defines a reusable function that can be called from other nodes. Functions can have parameters and return values. When called, the Exec output triggers the function body.',
      codeExample: `// Function definition in visual scripting:
// Custom Function: CalculateDistance
// Parameters: Vector A, Vector B
// Returns: float

void function CalculateDistance( vector a, vector b )
{
    float dist = (b - a).Length()
    return dist
}`,
      tips: [
        'Use + to add parameters',
        'Functions can be global or local',
        'GlobalizeFunction to call from other scripts',
        'Return type void means no return value'
      ],
      useCases: [
        'Creating reusable logic blocks',
        'Encapsulating complex operations',
        'Abstracting common calculations',
        'Creating library functions'
      ],
      relatedNodes: ['call-function', 'function-ref', 'globalize-function', 'return']
    }
  },
  {
    type: 'comment',
    category: 'utilities',
    label: 'Comment',
    description: 'Add a resizable comment box to organize nodes (stays behind other nodes)',
    color: '#F39C12',
    inputs: [],
    outputs: [],
    defaultData: { comment: 'Comment', commentColor: '#6C7A89' },
    documentation: {
      longDescription: 'Adds a text label that can be resized to annotate sections of your graph. Comments appear behind other nodes and are purely for documentation purposes.',
      codeExample: `// Comments help document your visual scripting graph
// Use them to explain complex logic
// Document assumptions and requirements
// Mark sections for easy navigation`,
      tips: [
        'Comments stay behind other nodes',
        'Can be resized by dragging edges',
        'Use to document complex logic',
        'Helps team members understand the graph'
      ],
      useCases: [
        'Documenting complex logic',
        'Marking sections of graphs',
        'Adding context to algorithms',
        'Organizing collaborative projects'
      ],
      relatedNodes: ['reroute']
    }
  },
  {
    type: 'custom-code',
    category: 'flow',
    label: 'Custom Code',
    description: 'Write custom Squirrel code directly',
    color: '#2ECC71',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { code: '// Your code here' },
    documentation: {
      longDescription: 'Allows writing raw Squirrel code for operations not covered by other nodes. Use this when you need specific functionality or optimizations that visual scripting doesn\'t provide.',
      codeExample: `// Custom Squirrel code examples:

// Simple calculation
float healthPercent = player.GetHealth() / player.GetMaxHealth() * 100

// Loop through players
foreach ( entity p in GetPlayerArray() )
{
    if ( p.GetTeam() == TEAM_IMC )
        p.SetHealth( 100 )
}

// Complex logic
if ( entity.IsValid() && entity.IsAlive() )
{
    print( "Entity is ready!" )
}`,
      tips: [
        'Use standard Squirrel syntax',
        'Can access all game APIs',
        'Great for complex logic or algorithms',
        'Use Custom Code sparingly - prefer nodes for readability'
      ],
      useCases: [
        'Complex mathematical calculations',
        'Special game API access',
        'Performance-critical code',
        'Custom algorithms'
      ],
      relatedNodes: ['call-function', 'custom-function']
    }
  },
  {
    type: 'set-portal',
    category: 'utilities',
    label: 'Set Portal',
    description: 'Store a value in a named portal for use elsewhere without wires',
    color: '#F39C12',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Value', type: 'data', dataType: 'any', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { portalName: 'MyPortal' },
    documentation: {
      longDescription: 'Stores a value in a named "portal" that can be retrieved anywhere in the graph without wire connections. Useful for sharing data across distant parts of a complex graph.',
      codeExample: `// Store a value
SetPortal( "playerScore", 100 )

// Later, retrieve it
int score = GetPortal( "playerScore" )
print( "Current score: " + score )`,
      tips: [
        'Portal names are case-sensitive',
        'Use descriptive names for portals',
        'Can store any data type',
        'Get Portal retrieves the value by name'
      ],
      useCases: [
        'Sharing data across distant nodes',
        'Global state management',
        'Reducing wire clutter',
        'Sharing values between parallel branches'
      ],
      relatedNodes: ['get-portal', 'variable-set', 'variable-get']
    }
  },
  {
    type: 'get-portal',
    category: 'utilities',
    label: 'Get Portal',
    description: 'Retrieve a value from a named portal',
    color: '#F39C12',
    inputs: [],
    outputs: [
      { label: 'Value', type: 'data', dataType: 'any', isInput: false },
    ],
    defaultData: { portalName: 'MyPortal' },
    documentation: {
      longDescription: 'Retrieves a value previously stored in a named portal by Set Portal. Allows accessing stored data without physical wire connections.',
      codeExample: `// Store and retrieve
SetPortal( "spawnPoint", player.GetOrigin() )

// Later...
vector spawn = GetPortal( "spawnPoint" )
CreatePropDynamic( model, spawn, angles )`,
      tips: [
        'Portal must be set before getting',
        'Returns null if portal doesn\'t exist',
        'Use consistent naming across the graph',
        'Works across different execution contexts'
      ],
      useCases: [
        'Accessing values set in different graph areas',
        'Sharing configuration data',
        'Storing global references',
        'Cross-branch communication'
      ],
      relatedNodes: ['set-portal', 'variable-get']
    }
  },

  // ==================== SWITCH ====================
  {
    type: 'switch',
    category: 'flow',
    label: 'Switch',
    description: 'Multi-way branch based on value. Add cases with switch-case nodes.',
    color: '#4A90E2',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Value', type: 'data', dataType: 'any', isInput: true },
    ],
    outputs: [
      { label: 'Default', type: 'exec', isInput: false },
    ],
    defaultData: { caseCount: 2 },
    tags: ['switch', 'case', 'branch', 'select'],
    documentation: {
      longDescription: 'Creates a multi-way branch that routes execution based on the value of the input. Each Case node specifies a value to match. If no case matches, the Default output fires.',
      codeExample: `// Switch on player team
switch ( player.GetTeam() )
{
    case TEAM_IMC:
        // IMC team logic
        break
    
    case TEAM_MILITIA:
        // Militia team logic
        break
    
    default:
        // Unknown team
        break
}`,
      tips: [
        'Add Case nodes for each value to check',
        'Default fires when no cases match',
        'Case nodes connect to the Switch\'s Value input',
        'Each case should have a Break unless fallthrough is wanted'
      ],
      useCases: [
        'Different behavior per team',
        'State machine implementations',
        'Menu navigation logic',
        'Entity type handling'
      ],
      relatedNodes: ['switch-case', 'branch', 'compare-equal']
    }
  },
  {
    type: 'switch-case',
    category: 'flow',
    label: 'Case',
    description: 'A case branch for a switch statement',
    color: '#4A90E2',
    inputs: [
      { label: 'Switch', type: 'exec', isInput: true },
      { label: 'Match', type: 'data', dataType: 'any', isInput: true },
    ],
    outputs: [
      { label: 'Exec', type: 'exec', isInput: false },
    ],
    defaultData: { caseValue: 0 },
    tags: ['switch', 'case'],
    documentation: {
      longDescription: 'Defines a single case for a Switch node. When the Switch\'s value matches this case\'s Match value, the Exec output fires. Chain multiple Case nodes together.',
      codeExample: `// Switch with multiple cases
Switch node -> Value input
Case(0) -> Match: 1 -> Exec: IMC logic
Case(1) -> Match: 2 -> Exec: Militia logic
Case(2) -> Match: 3 -> Exec: Neutral logic`,
      tips: [
        'Connect Exec output to next Case\'s Switch input',
        'Match value must match Switch\'s value exactly',
        'Use Break to exit after case logic',
        'Add Case nodes for each condition'
      ],
      useCases: [
        'Multiple value matching',
        'Enum-based branching',
        'State handling',
        'Type-based dispatch'
      ],
      relatedNodes: ['switch', 'break', 'branch']
    }
  },
  {
    type: 'break',
    category: 'flow',
    label: 'Break',
    description: 'Break out of a loop or switch statement',
    color: '#4A90E2',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
    ],
    outputs: [],
    defaultData: {},
    tags: ['break', 'loop', 'switch'],
    documentation: {
      longDescription: 'Immediately exits the nearest enclosing loop or switch statement. For loops, execution continues after the loop. For switches, prevents fallthrough to next case.',
      codeExample: `// Break out of a loop
for ( int i = 0; i < 10; i++ )
{
    if ( i == 5 )
        break  // Exit loop when i is 5
    
    print( "Index: " + i )
}

// In a switch
switch ( value )
{
    case 1:
        DoSomething()
        break  // Don\'t fall through to case 2
    
    case 2:
        DoOtherThing()
        break
}`,
      tips: [
        'Only exits one level of nesting',
        'Required after each case (unless fallthrough wanted)',
        'Use with For Loop, For Each, While Loop',
        'Execution continues after the loop/switch'
      ],
      useCases: [
        'Early exit from loops when condition met',
        'Preventing switch fallthrough',
        'Search optimization',
        'Error handling'
      ],
      relatedNodes: ['loop-for', 'loop-foreach', 'loop-while', 'switch', 'continue']
    }
  },
  {
    type: 'continue',
    category: 'flow',
    label: 'Continue',
    description: 'Skip to next iteration of a loop',
    color: '#4A90E2',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
    ],
    outputs: [],
    defaultData: {},
    tags: ['continue', 'loop'],
    documentation: {
      longDescription: 'Skips the remainder of the current loop iteration and proceeds to the next iteration. For For Loops, increments the counter and checks the condition. For While Loops, re-evaluates the condition.',
      codeExample: `// Skip certain values in a loop
for ( int i = 0; i < 10; i++ )
{
    if ( i % 2 == 0 )
        continue  // Skip even numbers
    
    print( "Odd number: " + i )
}

// Output: Odd numbers 1, 3, 5, 7, 9`,
      tips: [
        'Skips remaining code in current iteration',
        'Proceeds to next loop iteration',
        'Useful for filtering in loops',
        'More efficient than nested if-break'
      ],
      useCases: [
        'Skipping unwanted values',
        'Filtering array elements',
        'Conditional processing',
        'Validation loops'
      ],
      relatedNodes: ['loop-for', 'loop-foreach', 'loop-while', 'break']
    }
  },

  // ==================== STRUCTS & ENUMS ====================
  {
    type: 'struct-define',
    category: 'structures',
    label: 'Define Struct',
    description: 'Define a new struct type with fields. Use +/- to add fields. Optionally add an accessor name to access fields like name.field',
    color: '#16A085',
    inputs: [],
    outputs: [],
    defaultData: {
      structName: 'MyStruct',
      accessorName: '',
      isGlobal: false,
      fieldCount: 2,
      fieldNames: ['field1', 'field2'],
      fieldTypes: ['var', 'var'],
      fieldDefaults: ['', ''],
    },
    tags: ['struct', 'structure', 'type', 'define'],
    documentation: {
      longDescription: 'Defines a new struct type for organizing related data. Structs allow you to group multiple pieces of data together and pass them as a single unit. Each struct has fields with specific types and optional default values.',
      codeExample: `// Define a PlayerStats struct
// Fields: name (string), score (int), health (float)

// Later create and use:
PlayerStats stats
stats.name = "Player1"
stats.score = 100
stats.health = 75.5

// Pass as single unit
ProcessPlayerStats( stats )`,
      tips: [
        'Use meaningful names for struct and fields',
        'Field types determine what data can be stored',
        'Global structs can be accessed from anywhere',
        'Use with Create Struct to make instances'
      ],
      useCases: [
        'Player data grouping',
        'Game state storage',
        'Configuration objects',
        'Data serialization'
      ],
      relatedNodes: ['struct-create', 'struct-get-field', 'struct-set-field']
    }
  },
  {
    type: 'struct-create',
    category: 'structures',
    label: 'Create Struct',
    description: 'Create an instance of a struct type',
    color: '#16A085',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
      { label: 'Instance', type: 'data', dataType: 'struct', isInput: false },
    ],
    defaultData: { structName: 'MyStruct' },
    tags: ['struct', 'create', 'instance', 'new'],
    documentation: {
      longDescription: 'Creates a new instance of a previously defined struct type. The instance will have all the fields defined in the struct, initialized to their default values.',
      codeExample: `// Create a PlayerStats instance
PlayerStats stats = {
    name = "",
    score = 0,
    health = 100.0
}

// Set field values
stats.name = "Player1"
stats.score = 500
stats.health = 75.0

// Use the instance
ProcessStats( stats )`,
      tips: [
        'Struct must be defined first',
        'Fields are initialized to defaults',
        'Use Set Struct Field to modify fields',
        'Get Struct Field to read values'
      ],
      useCases: [
        'Creating player data objects',
        'Game state instances',
        'Configuration objects',
        'Data passing between functions'
      ],
      relatedNodes: ['struct-define', 'struct-get-field', 'struct-set-field']
    }
  },
  {
    type: 'struct-get-field',
    category: 'structures',
    label: 'Get Struct Field',
    description: 'Get a field value from a struct instance',
    color: '#16A085',
    inputs: [
      { label: 'Struct', type: 'data', dataType: 'struct', isInput: true },
    ],
    outputs: [
      { label: 'Value', type: 'data', dataType: 'any', isInput: false },
    ],
    defaultData: { fieldName: 'field1' },
    tags: ['struct', 'get', 'field', 'property'],
    documentation: {
      longDescription: 'Retrieves the value of a specific field from a struct instance. The field name must match one defined in the struct.',
      codeExample: `// Get field from struct
PlayerStats stats = CreatePlayerStats()

// Get individual fields
string playerName = stats.name
int playerScore = stats.score
float playerHealth = stats.health

// Use in expressions
if ( playerHealth < 25.0 )
{
    print( playerName + " needs healing!" )
}`,
      tips: [
        'Returns the field\'s current value',
        'Field must exist in struct definition',
        'Type matches the field\'s defined type',
        'Can be used directly in expressions'
      ],
      useCases: [
        'Reading player stats',
        'Accessing configuration values',
        'Conditional checks',
        'Data aggregation'
      ],
      relatedNodes: ['struct-set-field', 'struct-create', 'branch']
    }
  },
  {
    type: 'struct-set-field',
    category: 'structures',
    label: 'Set Struct Field',
    description: 'Set a field value on a struct instance',
    color: '#16A085',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Struct', type: 'data', dataType: 'struct', isInput: true },
      { label: 'Value', type: 'data', dataType: 'any', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { fieldName: 'field1' },
    tags: ['struct', 'set', 'field', 'property'],
    documentation: {
      longDescription: 'Modifies the value of a specific field in a struct instance. The value type must match the field\'s defined type.',
      codeExample: `// Create and modify struct
PlayerStats stats

// Set field values
stats.name = "Player1"
stats.score = stats.score + 100  // Add points
stats.health = 100.0  // Full heal

// Update multiple fields
stats.kills++
stats.deaths = stats.deaths + 1`,
      tips: [
        'Modifies the struct instance in place',
        'Value type must match field definition',
        'Can be chained with other nodes',
        'Changes persist for the struct lifetime'
      ],
      useCases: [
        'Updating player stats',
        'Modifying configuration',
        'Tracking game state changes',
        'Building complex data'
      ],
      relatedNodes: ['struct-get-field', 'struct-create', 'loop-foreach']
    }
  },
  {
    type: 'enum-define',
    category: 'structures',
    label: 'Define Enum',
    description: 'Define an enumeration type. Use +/- to add values. Values auto-increment from 0 or can use explicit values/bit flags.',
    color: '#16A085',
    inputs: [],
    outputs: [],
    defaultData: {
      enumName: 'MyEnum',
      isGlobal: true,
      valueCount: 3,
      valueNames: ['VALUE_A', 'VALUE_B', 'VALUE_C'],
      explicitValues: [null, null, null], // null = auto-increment, number = explicit, string = expression like "(1 << 0)"
    },
    tags: ['enum', 'enumeration', 'type', 'define', 'flags'],
  },
  {
    type: 'enum-value',
    category: 'structures',
    label: 'Enum Value',
    description: 'Get a value from an enum',
    color: '#16A085',
    inputs: [],
    outputs: [
      { label: 'Value', type: 'data', dataType: 'int', isInput: false },
    ],
    defaultData: { enumName: 'eGameState', valueName: 'Playing' },
    tags: ['enum', 'value', 'constant'],
  },

  // ==================== EVENTS ====================
  // Weapon Events
  {
    type: 'on-weapon-charge-begin',
    category: 'callbacks',
    label: 'EnergyChargeWeapon_OnWeaponChargeBegin',
    description: 'Called when weapon starts charging',
    color: '#E8A838',
    inputs: [],
    outputs: [
      { label: 'Exec', type: 'exec', isInput: false },
      { label: 'Weapon', type: 'data', dataType: 'weapon', isInput: false },
    ],
    defaultData: { functionName: 'EnergyChargeWeapon_OnWeaponChargeBegin' },
  },
  {
    type: 'on-weapon-charge-end',
    category: 'callbacks',
    label: 'EnergyChargeWeapon_OnWeaponChargeEnd',
    description: 'Called when weapon finishes charging',
    color: '#E8A838',
    inputs: [],
    outputs: [
      { label: 'Exec', type: 'exec', isInput: false },
      { label: 'Weapon', type: 'data', dataType: 'weapon', isInput: false },
    ],
    defaultData: { functionName: 'EnergyChargeWeapon_OnWeaponChargeEnd' },
  },
  {
    type: 'on-weapon-reload',
    category: 'callbacks',
    label: 'CodeCallback_OnWeaponReload',
    description: 'Called when weapon reloads',
    color: '#E8A838',
    inputs: [],
    outputs: [
      { label: 'Exec', type: 'exec', isInput: false },
      { label: 'Weapon', type: 'data', dataType: 'weapon', isInput: false },
    ],
    defaultData: { functionName: 'CodeCallback_OnWeaponReload' },
  },
  {
    type: 'on-weapon-zoom-fov',
    category: 'weapons',
    label: 'GetWeaponZoomFOV',
    description: 'Called to get weapon zoom FOV',
    color: '#E8A838',
    inputs: [],
    outputs: [
      { label: 'Exec', type: 'exec', isInput: false },
      { label: 'Weapon', type: 'data', dataType: 'weapon', isInput: false },
    ],
    defaultData: { functionName: 'GetWeaponZoomFOV' },
  },
  // Entity Events
  {
    type: 'on-spawn',
    category: 'callbacks',
    label: 'CodeCallback_OnSpawned',
    description: 'Called when entity spawns',
    color: '#E8A838',
    inputs: [],
    outputs: [
      { label: 'Exec', type: 'exec', isInput: false },
      { label: 'Entity', type: 'data', dataType: 'entity', isInput: false },
    ],
    defaultData: { functionName: 'CodeCallback_OnSpawned' },
  },
  {
    type: 'on-death',
    category: 'callbacks',
    label: 'ClientCodeCallback_OnDeath',
    description: 'Called when entity dies',
    color: '#E8A838',
    inputs: [],
    outputs: [
      { label: 'Exec', type: 'exec', isInput: false },
      { label: 'Entity', type: 'data', dataType: 'entity', isInput: false },
      { label: 'Attacker', type: 'data', dataType: 'entity', isInput: false },
      { label: 'DamageInfo', type: 'data', dataType: 'table', isInput: false },
    ],
    defaultData: { functionName: 'ClientCodeCallback_OnDeath' },
  },
  {
    type: 'on-damage',
    category: 'callbacks',
    label: 'AddEntityCallback_OnDamaged',
    description: 'Called when entity takes damage',
    color: '#E8A838',
    inputs: [],
    outputs: [
      { label: 'Exec', type: 'exec', isInput: false },
      { label: 'Entity', type: 'data', dataType: 'entity', isInput: false },
      { label: 'DamageInfo', type: 'data', dataType: 'table', isInput: false },
    ],
    defaultData: { functionName: 'AddEntityCallback_OnDamaged' },
  },
  {
    type: 'on-killed',
    category: 'callbacks',
    label: 'AddEntityCallback_OnKilled',
    description: 'Called when entity is killed',
    color: '#E8A838',
    inputs: [],
    outputs: [
      { label: 'Exec', type: 'exec', isInput: false },
      { label: 'Victim', type: 'data', dataType: 'entity', isInput: false },
      { label: 'Attacker', type: 'data', dataType: 'entity', isInput: false },
      { label: 'DamageInfo', type: 'data', dataType: 'table', isInput: false },
    ],
    defaultData: { functionName: 'AddEntityCallback_OnKilled' },
  },
  // Server Callback Events (with exec input to register in init flow)
  {
    type: 'on-entities-did-load',
    category: 'callbacks',
    label: 'AddCallback_EntitiesDidLoad',
    description: 'Callback for when all map entities have loaded (SERVER)',
    color: '#E8A838',
    inputs: [
      { label: 'Register', type: 'exec', isInput: true },
    ],
    outputs: [
      { label: 'Next', type: 'exec', isInput: false },
      { label: 'Exec', type: 'exec', isInput: false },
    ],
    defaultData: { functionName: 'OnEntitiesDidLoad' },
  },
  {
    type: 'on-client-connected',
    category: 'callbacks',
    label: 'AddCallback_OnClientConnected',
    description: 'Callback for when a player connects to the server (SERVER)',
    color: '#E8A838',
    inputs: [
      { label: 'Register', type: 'exec', isInput: true },
    ],
    outputs: [
      { label: 'Next', type: 'exec', isInput: false },
      { label: 'Exec', type: 'exec', isInput: false },
      { label: 'Player', type: 'data', dataType: 'entity', isInput: false },
    ],
    defaultData: { functionName: 'OnClientConnected' },
    serverOnly: true,
    documentation: {
      longDescription: 'Called when a player connects to the server. Use this to welcome players, initialize player-specific data, set up per-player callbacks, or track connection count.',
      codeExample: `// Handle player connection
void function OnClientConnected( entity player )
{
    // Welcome the player
    SendHudMessage( player, "Welcome to the server!", -1, -1, 255, 0, 0 )
    
    // Initialize player data
    InitPlayerScore( player )
    
    // Track connections
    print( player.GetPlayerName() + " connected" )
    
    // Announce to others
    NotifyAll( player.GetPlayerName() + " has joined" )
}`, 
      tips: [
        'Server-side only',
        'Player is fully connected at this point',
        'Good place to initialize player variables',
        'Player can immediately interact with game'
      ],
      useCases: [
        'Welcome messages',
        'Player initialization',
        'Connection tracking',
        'Loadout assignment'
      ],
      relatedNodes: ['on-client-disconnected', 'loop-foreach', 'get-player-by-index', 'on-player-respawned']
    }
  },
  {
    type: 'on-client-disconnected',
    category: 'callbacks',
    label: 'AddCallback_OnClientDisconnected',
    description: 'Callback for when a player disconnects from the server (SERVER)',
    color: '#E8A838',
    inputs: [
      { label: 'Register', type: 'exec', isInput: true },
    ],
    outputs: [
      { label: 'Next', type: 'exec', isInput: false },
      { label: 'Exec', type: 'exec', isInput: false },
      { label: 'Player', type: 'data', dataType: 'entity', isInput: false },
    ],
    defaultData: { functionName: 'OnClientDisconnected' },
    serverOnly: true,
    documentation: {
      longDescription: 'Called when a player disconnects from the server. Use this to clean up player data, announce departure, update team counts, or handle AFK tracking.',
      codeExample: `// Handle player disconnection
void function OnClientDisconnected( entity player )
{
    string name = player.GetPlayerName()
    
    // Announce departure
    NotifyAll( name + " has disconnected" )
    
    // Clean up player data
    ClearPlayerScore( player )
    
    // Check if game needs to end
    if ( GetPlayerArray().len() < 2 )
    {
        EndGame( "Not enough players" )
    }
}`, 
      tips: [
        'Server-side only',
        'Player entity may become invalid shortly',
        'Good for cleanup operations',
        'Track disconnection reasons if needed'
      ],
      useCases: [
        'Departure announcements',
        'Player data cleanup',
        'AFK tracking',
        'Game end conditions'
      ],
      relatedNodes: ['on-client-connected', 'loop-foreach', 'set-game-state']
    }
  },
  {
    type: 'on-player-killed',
    category: 'callbacks',
    label: 'AddCallback_OnPlayerKilled',
    description: 'Callback for when a player is killed (SERVER)',
    color: '#E8A838',
    inputs: [
      { label: 'Register', type: 'exec', isInput: true },
    ],
    outputs: [
      { label: 'Next', type: 'exec', isInput: false },
      { label: 'Exec', type: 'exec', isInput: false },
      { label: 'Victim', type: 'data', dataType: 'entity', isInput: false },
      { label: 'Attacker', type: 'data', dataType: 'entity', isInput: false },
      { label: 'DamageInfo', type: 'data', dataType: 'var', isInput: false },
    ],
    defaultData: { functionName: 'OnPlayerKilled' },
    serverOnly: true,
    documentation: {
      longDescription: 'Called when a player is killed. Use this to track kills, update scores, implement custom death mechanics, or trigger events on player death. The callback provides the victim, attacker, and damage information.',
      codeExample: `// Track player kills
void function OnPlayerKilled( entity victim, entity attacker, var damageInfo )
{
    if ( IsValid( attacker ) && attacker.IsPlayer() )
    {
        print( attacker.GetPlayerName() + " killed " + victim.GetPlayerName() )
        
        // Award points
        ScoreEvent_Kill( attacker )
    }
    
    // Check for last kill
    if ( GetPlayerArray().len() == 1 )
        AnnounceWinner( survivor )
}`, 
      tips: [
        'Server-side only',
        'Victim and attacker may be invalid if disconnected',
        'Use DamageInfo to get damage amount and type',
        'Combine with OnPlayerRespawned for full lifecycle'
      ],
      useCases: [
        'Kill tracking and scoring',
        'Death announcements',
        'Custom death mechanics',
        'Achievement systems'
      ],
      relatedNodes: ['on-player-respawned', 'on-npc-killed', 'on-death', 'get-all-players']
    }
  },
  {
    type: 'on-player-respawned',
    category: 'callbacks',
    label: 'AddCallback_OnPlayerRespawned',
    description: 'Callback for when a player respawns (SERVER)',
    color: '#E8A838',
    inputs: [
      { label: 'Register', type: 'exec', isInput: true },
    ],
    outputs: [
      { label: 'Next', type: 'exec', isInput: false },
      { label: 'Exec', type: 'exec', isInput: false },
      { label: 'Player', type: 'data', dataType: 'entity', isInput: false },
    ],
    defaultData: { functionName: 'OnPlayerRespawned' },
    serverOnly: true,
    documentation: {
      longDescription: 'Called when a player respawns. Use this to set spawn loadout, apply buffs, initialize spawn location, or trigger respawn events.',
      codeExample: `// Handle player respawn
void function OnPlayerRespawned( entity player )
{
    // Give loadout
    GiveRespawnLoadout( player )
    
    // Apply spawn protection
    StatusEffect_AddEndless( player, eStatusEffect.invulnerable, 1.0 )
    
    // Move to spawn point
    vector spawnPos = GetSpawnPoint( player )
    player.SetOrigin( spawnPos )
    
    // Remove protection after delay
    wait 3.0
    StatusEffect_StopAll( player )
}`, 
      tips: [
        'Server-side only',
        'Player is alive when this fires',
        'Good place to apply spawn loadouts',
        'Combine with spawn protection effects'
      ],
      useCases: [
        'Spawn loadout assignment',
        'Spawn protection',
        'Spawn point selection',
        'Respawn events'
      ],
      relatedNodes: ['on-player-killed', 'give-weapon', 'status-effect-add', 'get-health']
    }
  },
  {
    type: 'on-npc-killed',
    category: 'callbacks',
    label: 'AddCallback_OnNPCKilled',
    description: 'Callback for when an NPC is killed (SERVER)',
    color: '#E8A838',
    inputs: [
      { label: 'Register', type: 'exec', isInput: true },
    ],
    outputs: [
      { label: 'Next', type: 'exec', isInput: false },
      { label: 'Exec', type: 'exec', isInput: false },
      { label: 'NPC', type: 'data', dataType: 'entity', isInput: false },
      { label: 'Attacker', type: 'data', dataType: 'entity', isInput: false },
      { label: 'DamageInfo', type: 'data', dataType: 'var', isInput: false },
    ],
    defaultData: { functionName: 'OnNPCKilled' },
    serverOnly: true,
    documentation: {
      longDescription: 'Called when an NPC is killed. Use this to track NPC kills, implement NPC-specific death effects, or handle quest objectives involving NPCs.',
      codeExample: `// Handle NPC death
void function OnNPCKilled( entity npc, entity attacker, var damageInfo )
{
    // Track NPC kills
    print( "NPC killed by: " + (attacker.IsPlayer() ? attacker.GetPlayerName() : "NPC") )
    
    // Check if player killed it
    if ( IsValid( attacker ) && attacker.IsPlayer() )
    {
        // Award points or track stats
        player.AddNPCKill()
    }
    
    // Spawn death effects
    vector deathPos = npc.GetOrigin()
    PlayFXOnEntity( deathEffect, npc, "" )
}`, 
      tips: [
        'Server-side only',
        'NPCs include soldiers, prowlers, drones, etc.',
        'Can check attacker type with IsPlayer/IsNPC',
        'Good for tracking kill challenges'
      ],
      useCases: [
        'NPC kill tracking',
        'Quest objectives',
        'Death effects',
        'Bounty systems'
      ],
      relatedNodes: ['on-player-killed', 'on-death', 'loop-foreach', 'get-all-players']
    }
  },
  {
    type: 'on-client-connecting',
    category: 'callbacks',
    label: 'AddCallback_OnClientConnecting',
    description: 'Callback for when a client is connecting',
    color: '#E8A838',
    inputs: [
      { label: 'Register', type: 'exec', isInput: true },
    ],
    outputs: [
      { label: 'Next', type: 'exec', isInput: false },
      { label: 'Exec', type: 'exec', isInput: false },
      { label: 'Player', type: 'data', dataType: 'entity', isInput: false },
    ],
    defaultData: { functionName: 'OnClientConnecting' },
  },
  {
    type: 'on-entity-changed-team',
    category: 'callbacks',
    label: 'AddCallback_EntityChangedTeam',
    description: 'Callback for when an entity changes team',
    color: '#E8A838',
    inputs: [
      { label: 'Register', type: 'exec', isInput: true },
    ],
    outputs: [
      { label: 'Next', type: 'exec', isInput: false },
      { label: 'Exec', type: 'exec', isInput: false },
      { label: 'Entity', type: 'data', dataType: 'entity', isInput: false },
    ],
    defaultData: { functionName: 'OnEntityChangedTeam' },
  },
  {
    type: 'on-player-assist',
    category: 'callbacks',
    label: 'AddCallback_OnPlayerAssist',
    description: 'Callback for when a player gets an assist',
    color: '#E8A838',
    inputs: [
      { label: 'Register', type: 'exec', isInput: true },
    ],
    outputs: [
      { label: 'Next', type: 'exec', isInput: false },
      { label: 'Exec', type: 'exec', isInput: false },
      { label: 'Player', type: 'data', dataType: 'entity', isInput: false },
      { label: 'Victim', type: 'data', dataType: 'entity', isInput: false },
    ],
    defaultData: { functionName: 'OnPlayerAssist' },
  },
  {
    type: 'on-player-inventory-changed',
    category: 'callbacks',
    label: 'AddCallback_OnPlayerInventoryChanged',
    description: 'Callback for when player inventory changes',
    color: '#E8A838',
    inputs: [
      { label: 'Register', type: 'exec', isInput: true },
    ],
    outputs: [
      { label: 'Next', type: 'exec', isInput: false },
      { label: 'Exec', type: 'exec', isInput: false },
      { label: 'Player', type: 'data', dataType: 'entity', isInput: false },
    ],
    defaultData: { functionName: 'OnPlayerInventoryChanged' },
  },
  {
    type: 'on-weapon-attack',
    category: 'callbacks',
    label: 'AddCallback_OnWeaponAttack',
    description: 'Callback for when a weapon attacks',
    color: '#E8A838',
    inputs: [
      { label: 'Register', type: 'exec', isInput: true },
    ],
    outputs: [
      { label: 'Next', type: 'exec', isInput: false },
      { label: 'Exec', type: 'exec', isInput: false },
      { label: 'Weapon', type: 'data', dataType: 'entity', isInput: false },
      { label: 'Player', type: 'data', dataType: 'entity', isInput: false },
    ],
    defaultData: { functionName: 'OnWeaponAttack' },
  },
  {
    type: 'on-death-box-spawned',
    category: 'callbacks',
    label: 'AddCallback_OnDeathBoxSpawned',
    description: 'Callback for when a death box spawns',
    color: '#E8A838',
    inputs: [
      { label: 'Register', type: 'exec', isInput: true },
    ],
    outputs: [
      { label: 'Next', type: 'exec', isInput: false },
      { label: 'Exec', type: 'exec', isInput: false },
      { label: 'DeathBox', type: 'data', dataType: 'entity', isInput: false },
    ],
    defaultData: { functionName: 'OnDeathBoxSpawned' },
  },
  {
    type: 'on-game-state-enter',
    category: 'callbacks',
    label: 'AddCallback_GameStatePostEnter',
    description: 'Callback for when game state changes (SERVER)',
    color: '#E8A838',
    inputs: [
      { label: 'Register', type: 'exec', isInput: true },
    ],
    outputs: [
      { label: 'Next', type: 'exec', isInput: false },
      { label: 'Exec', type: 'exec', isInput: false },
      { label: 'GameState', type: 'data', dataType: 'int', isInput: false },
    ],
    defaultData: { functionName: 'OnGameStatePostEnter' },
    serverOnly: true,
    documentation: {
      longDescription: 'Called when the game state changes. Use this to trigger mode-specific logic when the match transitions between states like playing, intermission, or Sudden Death.',
      codeExample: `// Handle game state changes
void function OnGameStatePostEnter( int newState )
{
    if ( newState == eGameState.Playing )
    {
        print( "Match started!" )
        StartMatchTimer()
    }
    else if ( newState == eGameState.SuddenDeath )
    {
        // Enable sudden death mechanics
        AnnounceSuddenDeath()
        ShrinkPlayArea()
    }
    else if ( newState == eGameState.Intermission )
    {
        // Match ended
        ShowScoreboard()
    }
}`, 
      tips: [
        'Use eGameState enum for state values',
        'Called after state transition completes',
        'Common states: Playing, SuddenDeath, Intermission, Warmup',
        'Combine with GetGameState for current state'
      ],
      useCases: [
        'Match start/end logic',
        'Sudden Death triggers',
        'Scoreboard display',
        'Timer management'
      ],
      relatedNodes: ['get-game-state', 'set-game-state', 'gamemode-register']
    }
  },
  {
    type: 'on-player-weapon-activated',
    category: 'callbacks',
    label: 'AddCallback_OnPlayerWeaponActivated',
    description: 'Callback for when player activates a weapon',
    color: '#E8A838',
    inputs: [
      { label: 'Register', type: 'exec', isInput: true },
    ],
    outputs: [
      { label: 'Next', type: 'exec', isInput: false },
      { label: 'Exec', type: 'exec', isInput: false },
      { label: 'Player', type: 'data', dataType: 'entity', isInput: false },
      { label: 'Weapon', type: 'data', dataType: 'entity', isInput: false },
    ],
    defaultData: { functionName: 'OnPlayerWeaponActivated' },
  },
  {
    type: 'on-player-used-offhand',
    category: 'callbacks',
    label: 'AddCallback_OnPlayerUsedOffhandWeapon',
    description: 'Callback for when player uses offhand weapon',
    color: '#E8A838',
    inputs: [
      { label: 'Register', type: 'exec', isInput: true },
    ],
    outputs: [
      { label: 'Next', type: 'exec', isInput: false },
      { label: 'Exec', type: 'exec', isInput: false },
      { label: 'Player', type: 'data', dataType: 'entity', isInput: false },
      { label: 'Weapon', type: 'data', dataType: 'entity', isInput: false },
    ],
    defaultData: { functionName: 'OnPlayerUsedOffhandWeapon' },
  },
  {
    type: 'on-leave-match',
    category: 'callbacks',
    label: 'AddCallback_OnLeaveMatch',
    description: 'Callback for when player leaves match',
    color: '#E8A838',
    inputs: [
      { label: 'Register', type: 'exec', isInput: true },
    ],
    outputs: [
      { label: 'Next', type: 'exec', isInput: false },
      { label: 'Exec', type: 'exec', isInput: false },
    ],
    defaultData: { functionName: 'OnLeaveMatch' },
  },
  {
    type: 'on-use-button-pressed',
    category: 'callbacks',
    label: 'CodeCallback_OnUseButtonPressed',
    description: 'Callback for when use button is pressed',
    color: '#E8A838',
    inputs: [
      { label: 'Register', type: 'exec', isInput: true },
    ],
    outputs: [
      { label: 'Next', type: 'exec', isInput: false },
      { label: 'Exec', type: 'exec', isInput: false },
      { label: 'Player', type: 'data', dataType: 'entity', isInput: false },
    ],
    defaultData: { functionName: 'CodeCallback_OnUseButtonPressed' },
  },
  {
    type: 'on-use-button-released',
    category: 'callbacks',
    label: 'CodeCallback_OnUseButtonReleased',
    description: 'Callback for when use button is released',
    color: '#E8A838',
    inputs: [
      { label: 'Register', type: 'exec', isInput: true },
    ],
    outputs: [
      { label: 'Next', type: 'exec', isInput: false },
      { label: 'Exec', type: 'exec', isInput: false },
      { label: 'Player', type: 'data', dataType: 'entity', isInput: false },
    ],
    defaultData: { functionName: 'CodeCallback_OnUseButtonReleased' },
  },
  {
    type: 'on-player-class-changed',
    category: 'callbacks',
    label: 'CodeCallback_PlayerClassChanged',
    description: 'Callback for when player class changes',
    color: '#E8A838',
    inputs: [
      { label: 'Register', type: 'exec', isInput: true },
    ],
    outputs: [
      { label: 'Next', type: 'exec', isInput: false },
      { label: 'Exec', type: 'exec', isInput: false },
      { label: 'Player', type: 'data', dataType: 'entity', isInput: false },
    ],
    defaultData: { functionName: 'CodeCallback_PlayerClassChanged' },
  },
  {
    type: 'on-vehicle-launch',
    category: 'callbacks',
    label: 'CodeCallback_OnVehicleLaunch',
    description: 'Callback for when vehicle launches',
    color: '#E8A838',
    inputs: [
      { label: 'Register', type: 'exec', isInput: true },
    ],
    outputs: [
      { label: 'Next', type: 'exec', isInput: false },
      { label: 'Exec', type: 'exec', isInput: false },
      { label: 'Vehicle', type: 'data', dataType: 'entity', isInput: false },
    ],
    defaultData: { functionName: 'CodeCallback_OnVehicleLaunch' },
  },
  {
    type: 'on-vehicle-collide',
    category: 'callbacks',
    label: 'CodeCallback_OnVehicleCollide',
    description: 'Callback for when vehicle collides',
    color: '#E8A838',
    inputs: [
      { label: 'Register', type: 'exec', isInput: true },
    ],
    outputs: [
      { label: 'Next', type: 'exec', isInput: false },
      { label: 'Exec', type: 'exec', isInput: false },
      { label: 'Vehicle', type: 'data', dataType: 'entity', isInput: false },
    ],
    defaultData: { functionName: 'CodeCallback_OnVehicleCollide' },
  },
  {
    type: 'on-player-changed-team',
    category: 'callbacks',
    label: 'AddCallback_OnPlayerChangedTeam',
    description: 'Callback for when player changes team',
    color: '#E8A838',
    inputs: [
      { label: 'Register', type: 'exec', isInput: true },
    ],
    outputs: [
      { label: 'Next', type: 'exec', isInput: false },
      { label: 'Exec', type: 'exec', isInput: false },
      { label: 'Player', type: 'data', dataType: 'entity', isInput: false },
    ],
    defaultData: { functionName: 'OnPlayerChangedTeam' },
  },
  {
    type: 'on-player-zoom-in',
    category: 'callbacks',
    label: 'CodeCallback_OnPlayerStartZoomIn',
    description: 'Callback for when player zooms in (ADS)',
    color: '#E8A838',
    inputs: [
      { label: 'Register', type: 'exec', isInput: true },
    ],
    outputs: [
      { label: 'Next', type: 'exec', isInput: false },
      { label: 'Exec', type: 'exec', isInput: false },
      { label: 'Player', type: 'data', dataType: 'entity', isInput: false },
    ],
    defaultData: { functionName: 'CodeCallback_OnPlayerStartZoomIn' },
  },
  {
    type: 'on-player-zoom-out',
    category: 'callbacks',
    label: 'CodeCallback_OnPlayerStartZoomOut',
    description: 'Callback for when player zooms out',
    color: '#E8A838',
    inputs: [
      { label: 'Register', type: 'exec', isInput: true },
    ],
    outputs: [
      { label: 'Next', type: 'exec', isInput: false },
      { label: 'Exec', type: 'exec', isInput: false },
      { label: 'Player', type: 'data', dataType: 'entity', isInput: false },
    ],
    defaultData: { functionName: 'CodeCallback_OnPlayerStartZoomOut' },
  },
  {
    type: 'on-passive-changed',
    category: 'callbacks',
    label: 'AddCallback_OnPassiveChanged',
    description: 'Callback for when passive ability state changes',
    color: '#E8A838',
    inputs: [
      { label: 'Register', type: 'exec', isInput: true },
    ],
    outputs: [
      { label: 'Next', type: 'exec', isInput: false },
      { label: 'Exec', type: 'exec', isInput: false },
      { label: 'Player', type: 'data', dataType: 'entity', isInput: false },
    ],
    defaultData: { functionName: 'OnPassiveChanged' },
  },
  {
    type: 'on-ping-created',
    category: 'callbacks',
    label: 'AddCallback_OnPingCreatedByAnyPlayer',
    description: 'Callback for when any player creates a ping',
    color: '#E8A838',
    inputs: [
      { label: 'Register', type: 'exec', isInput: true },
    ],
    outputs: [
      { label: 'Next', type: 'exec', isInput: false },
      { label: 'Exec', type: 'exec', isInput: false },
      { label: 'Player', type: 'data', dataType: 'entity', isInput: false },
    ],
    defaultData: { functionName: 'OnPingCreatedByAnyPlayer' },
  },
  {
    type: 'on-player-match-state-changed',
    category: 'callbacks',
    label: 'AddCallback_OnPlayerMatchStateChanged',
    description: 'Callback for when player match state changes',
    color: '#E8A838',
    inputs: [
      { label: 'Register', type: 'exec', isInput: true },
    ],
    outputs: [
      { label: 'Next', type: 'exec', isInput: false },
      { label: 'Exec', type: 'exec', isInput: false },
      { label: 'Player', type: 'data', dataType: 'entity', isInput: false },
    ],
    defaultData: { functionName: 'OnPlayerMatchStateChanged' },
  },
  {
    type: 'on-deathfield-stage-changed',
    category: 'callbacks',
    label: 'AddCallback_OnSurvivalDeathFieldStageChanged',
    description: 'Callback for when death field stage changes',
    color: '#E8A838',
    inputs: [
      { label: 'Register', type: 'exec', isInput: true },
    ],
    outputs: [
      { label: 'Next', type: 'exec', isInput: false },
      { label: 'Exec', type: 'exec', isInput: false },
      { label: 'Stage', type: 'data', dataType: 'int', isInput: false },
    ],
    defaultData: { functionName: 'OnSurvivalDeathFieldStageChanged' },
  },
  {
    type: 'on-bleedout-started',
    category: 'callbacks',
    label: 'AddCallback_OnBleedoutStarted',
    description: 'Callback for when player starts bleeding out',
    color: '#E8A838',
    inputs: [
      { label: 'Register', type: 'exec', isInput: true },
    ],
    outputs: [
      { label: 'Next', type: 'exec', isInput: false },
      { label: 'Exec', type: 'exec', isInput: false },
      { label: 'Player', type: 'data', dataType: 'entity', isInput: false },
    ],
    defaultData: { functionName: 'OnBleedoutStarted' },
  },
  {
    type: 'on-bleedout-ended',
    category: 'callbacks',
    label: 'AddCallback_OnBleedoutEnded',
    description: 'Callback for when player stops bleeding out',
    color: '#E8A838',
    inputs: [
      { label: 'Register', type: 'exec', isInput: true },
    ],
    outputs: [
      { label: 'Next', type: 'exec', isInput: false },
      { label: 'Exec', type: 'exec', isInput: false },
      { label: 'Player', type: 'data', dataType: 'entity', isInput: false },
    ],
    defaultData: { functionName: 'OnBleedoutEnded' },
  },
  {
    type: 'on-player-life-state-changed',
    category: 'callbacks',
    label: 'AddCallback_OnPlayerLifeStateChanged',
    description: 'Callback for when player life state changes',
    color: '#E8A838',
    inputs: [
      { label: 'Register', type: 'exec', isInput: true },
    ],
    outputs: [
      { label: 'Next', type: 'exec', isInput: false },
      { label: 'Exec', type: 'exec', isInput: false },
      { label: 'Player', type: 'data', dataType: 'entity', isInput: false },
      { label: 'OldState', type: 'data', dataType: 'int', isInput: false },
      { label: 'NewState', type: 'data', dataType: 'int', isInput: false },
    ],
    defaultData: { functionName: 'OnPlayerLifeStateChanged' },
  },
  {
    type: 'on-you-respawned',
    category: 'callbacks',
    label: 'AddCallback_OnYouRespawned',
    description: 'Callback for when local player respawns (CLIENT)',
    color: '#E8A838',
    inputs: [
      { label: 'Register', type: 'exec', isInput: true },
    ],
    outputs: [
      { label: 'Next', type: 'exec', isInput: false },
      { label: 'Exec', type: 'exec', isInput: false },
    ],
    defaultData: { functionName: 'OnYouRespawned' },
  },
  {
    type: 'on-you-died',
    category: 'callbacks',
    label: 'AddCallback_OnYouDied',
    description: 'Callback for when local player dies (CLIENT)',
    color: '#E8A838',
    inputs: [
      { label: 'Register', type: 'exec', isInput: true },
    ],
    outputs: [
      { label: 'Next', type: 'exec', isInput: false },
      { label: 'Exec', type: 'exec', isInput: false },
    ],
    defaultData: { functionName: 'OnYouDied' },
  },
  {
    type: 'on-player-scored',
    category: 'callbacks',
    label: 'AddCallback_OnPlayerScored',
    description: 'Callback for when player scores',
    color: '#E8A838',
    inputs: [
      { label: 'Register', type: 'exec', isInput: true },
    ],
    outputs: [
      { label: 'Next', type: 'exec', isInput: false },
      { label: 'Exec', type: 'exec', isInput: false },
      { label: 'Player', type: 'data', dataType: 'entity', isInput: false },
    ],
    defaultData: { functionName: 'OnPlayerScored' },
  },
  {
    type: 'on-lootbin-opened',
    category: 'callbacks',
    label: 'Survival_AddCallback_OnLootbinOpened',
    description: 'Callback for when lootbin is opened',
    color: '#E8A838',
    inputs: [
      { label: 'Register', type: 'exec', isInput: true },
    ],
    outputs: [
      { label: 'Next', type: 'exec', isInput: false },
      { label: 'Exec', type: 'exec', isInput: false },
      { label: 'Player', type: 'data', dataType: 'entity', isInput: false },
      { label: 'Lootbin', type: 'data', dataType: 'entity', isInput: false },
    ],
    defaultData: { functionName: 'OnLootbinOpened' },
  },
  {
    type: 'on-player-add-weapon-mod',
    category: 'callbacks',
    label: 'AddCallback_OnPlayerAddWeaponMod',
    description: 'Callback for when player adds a weapon mod',
    color: '#E8A838',
    inputs: [
      { label: 'Register', type: 'exec', isInput: true },
    ],
    outputs: [
      { label: 'Next', type: 'exec', isInput: false },
      { label: 'Exec', type: 'exec', isInput: false },
      { label: 'Player', type: 'data', dataType: 'entity', isInput: false },
      { label: 'Weapon', type: 'data', dataType: 'entity', isInput: false },
      { label: 'ModName', type: 'data', dataType: 'string', isInput: false },
    ],
    defaultData: { functionName: 'OnPlayerAddWeaponMod' },
  },
  {
    type: 'on-player-remove-weapon-mod',
    category: 'callbacks',
    label: 'AddCallback_OnPlayerRemoveWeaponMod',
    description: 'Callback for when player removes a weapon mod',
    color: '#E8A838',
    inputs: [
      { label: 'Register', type: 'exec', isInput: true },
    ],
    outputs: [
      { label: 'Next', type: 'exec', isInput: false },
      { label: 'Exec', type: 'exec', isInput: false },
      { label: 'Player', type: 'data', dataType: 'entity', isInput: false },
      { label: 'Weapon', type: 'data', dataType: 'entity', isInput: false },
      { label: 'ModName', type: 'data', dataType: 'string', isInput: false },
    ],
    defaultData: { functionName: 'OnPlayerRemoveWeaponMod' },
  },
  {
    type: 'on-grappled',
    category: 'callbacks',
    label: 'AddCallback_OnGrappled',
    description: 'Callback for when player grapples',
    color: '#E8A838',
    inputs: [
      { label: 'Register', type: 'exec', isInput: true },
    ],
    outputs: [
      { label: 'Next', type: 'exec', isInput: false },
      { label: 'Exec', type: 'exec', isInput: false },
      { label: 'Player', type: 'data', dataType: 'entity', isInput: false },
    ],
    defaultData: { functionName: 'OnGrappled' },
  },
  {
    type: 'on-grapple-detached',
    category: 'callbacks',
    label: 'AddCallback_OnGrappleDetached',
    description: 'Callback for when grapple detaches',
    color: '#E8A838',
    inputs: [
      { label: 'Register', type: 'exec', isInput: true },
    ],
    outputs: [
      { label: 'Next', type: 'exec', isInput: false },
      { label: 'Exec', type: 'exec', isInput: false },
      { label: 'Player', type: 'data', dataType: 'entity', isInput: false },
    ],
    defaultData: { functionName: 'OnGrappleDetached' },
  },
  // ==================== ENTITY ====================
  {
    type: 'get-origin',
    category: 'entity',
    label: 'GetOrigin',
    description: 'Get entity position',
    color: '#27AE60',
    inputs: [
      { label: 'Entity', type: 'data', dataType: 'entity', isInput: true },
    ],
    outputs: [
      { label: 'Origin', type: 'data', dataType: 'vector', isInput: false },
    ],
    defaultData: {},
    documentation: {
      longDescription: 'Returns the world position (origin) of an entity as a vector. This is the entity\'s center point in 3D space (X, Y, Z coordinates). Use this to get where an entity is located.',
      codeExample: `// Get player position
entity player = GetPlayerByIndex( 0 )
vector pos = player.GetOrigin()

// Use the position
print( "Player is at: " + pos )
CreatePropDynamic( model, pos + <0, 0, 100>, <0, 0, 0> )`,
      tips: [
        'Returns vector with X, Y, Z coordinates',
        'Y is typically forward/backward in Source engine',
        'Use with vector math nodes for calculations',
        'Origin is usually at the entity\'s center'
      ],
      useCases: [
        'Getting entity positions',
        'Distance calculations',
        'Spawning things near entities',
        'Position-based logic'
      ],
      relatedNodes: ['set-origin', 'get-angles', 'get-velocity', 'trace-line']
    }
  },
  {
    type: 'get-view-vector',
    category: 'entity',
    label: 'GetViewVector',
    description: 'Get player view vector',
    color: '#27AE60',
    inputs: [
      { label: 'Entity', type: 'data', dataType: 'entity', isInput: true },
    ],
    outputs: [
      { label: 'Vector', type: 'data', dataType: 'vector', isInput: false },
    ],
    defaultData: {},
    documentation: {
      longDescription: 'Returns the direction a player is looking as a normalized vector. This is the forward view direction from the player\'s eyes, useful for determining aim direction.',
      codeExample: `// Get where player is looking
entity player = GetLocalPlayer()
vector lookDir = player.GetViewVector()

// Use for shooting direction
vector bulletDir = player.GetOrigin() + (lookDir * 1000)`,
      tips: [
        'Returns normalized direction vector',
        'Based on eye angles, not body rotation',
        'Use for projectile aiming',
        'Works with GetEyePosition for complete ray'
      ],
      useCases: [
        'Aiming projectiles',
        'Determining player facing',
        'Raycasting from player view',
        'Visual effects direction'
      ],
      relatedNodes: ['get-eye-position', 'get-forward-vector', 'vector-to-angles']
    }
  },
  {
    type: 'set-origin',
    category: 'entity',
    label: 'SetOrigin',
    description: 'Set entity position',
    color: '#27AE60',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Entity', type: 'data', dataType: 'entity', isInput: true },
      { label: 'Origin', type: 'data', dataType: 'vector', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: {},
    documentation: {
      longDescription: 'Moves an entity to a new position in the world. The entity\'s position is instantly changed to the specified coordinates. Use this for teleportation or repositioning.',
      codeExample: `// Teleport player to spawn point
entity player = GetPlayerByIndex( 0 )
vector spawnPos = <1000, 2000, 100>

player.SetOrigin( spawnPos )

// Move with offset
entity npc = GetEntByScriptName( "guard_1" )
npc.SetOrigin( player.GetOrigin() + <0, 0, 100> )`,
      tips: [
        'Instant teleportation',
        'Can be used on any entity type',
        'Often used with GetOrigin for relative moves',
        'Use DispatchSpawn for unspawned entities'
      ],
      useCases: [
        'Teleportation',
        'Respawning entities',
        'Repositioning NPCs',
        'Checkpoint systems'
      ],
      relatedNodes: ['get-origin', 'set-angles', 'create-entity']
    }
  },
  {
    type: 'get-angles',
    category: 'entity',
    label: 'GetAngles',
    description: 'Get entity rotation angles',
    color: '#27AE60',
    inputs: [
      { label: 'Entity', type: 'data', dataType: 'entity', isInput: true },
    ],
    outputs: [
      { label: 'Angles', type: 'data', dataType: 'vector', isInput: false },
    ],
    defaultData: {},
    documentation: {
      longDescription: 'Returns the entity\'s rotation as pitch, yaw, roll angles in a vector. Pitch is X (up/down), Yaw is Y (left/right), Roll is Z (tilt). Use with AnglesToForward to get facing direction.',
      codeExample: `// Get entity orientation
entity npc = GetEntByScriptName( "guard_1" )
vector angles = npc.GetAngles()

// Get forward direction
vector forward = npc.GetForwardVector()

// Or use AnglesToForward
vector dir = AnglesToForward( angles )`,
      tips: [
        'Angles are in pitch, yaw, roll format',
        'Yaw is rotation around vertical axis',
        'Use with GetForwardVector for facing',
        'Negative angles are valid'
      ],
      useCases: [
        'Getting entity orientation',
        'Calculating facing direction',
        'Rotating entities',
        'Alignment logic'
      ],
      relatedNodes: ['set-angles', 'get-forward-vector', 'angles-to-forward']
    }
  },
  {
    type: 'set-angles',
    category: 'entity',
    label: 'SetAngles',
    description: 'Set entity rotation angles',
    color: '#27AE60',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Entity', type: 'data', dataType: 'entity', isInput: true },
      { label: 'Angles', type: 'data', dataType: 'vector', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: {},
    documentation: {
      longDescription: 'Sets the entity\'s rotation using pitch, yaw, roll angles. Changes how the entity is oriented in the world. Use <0, yaw, 0> to rotate around vertical axis.',
      codeExample: `// Face a direction
entity prop = GetEntByScriptName( "my_prop" )

// Rotate 90 degrees on Y axis
prop.SetAngles( <0, 90, 0> )

// Make entity face another
entity npc = GetEntByScriptName( "guard" )
entity target = GetEntByScriptName( "target" )
npc.SetAngles( (target.GetOrigin() - npc.GetOrigin()).ToAngles() )`,
      tips: [
        'Use <pitch, yaw, roll> format',
        'Yaw is in degrees (0-360)',
        'Can use VectorToAngles to convert direction',
        'Use LookAt for simple facing'
      ],
      useCases: [
        'Rotating entities',
        'Facing targets',
        'Orientation adjustments',
        'Door/elevator control'
      ],
      relatedNodes: ['get-angles', 'look-at', 'vector-to-angles']
    }
  },
  {
    type: 'get-velocity',
    category: 'entity',
    label: 'GetVelocity',
    description: 'Get entity velocity',
    color: '#27AE60',
    inputs: [
      { label: 'Entity', type: 'data', dataType: 'entity', isInput: true },
    ],
    outputs: [
      { label: 'Velocity', type: 'data', dataType: 'vector', isInput: false },
    ],
    defaultData: {},
    documentation: {
      longDescription: 'Returns the entity\'s current velocity as a vector. The vector represents direction and speed (units per second). A stopped entity has <0, 0, 0> velocity.',
      codeExample: `// Check if entity is moving
entity player = GetPlayerByIndex( 0 )
vector vel = player.GetVelocity()

if ( vel.Length() > 10 )
{
    print( "Player is moving at " + vel.Length() + " units/sec" )
}

// Apply knockback
entity target = GetEntByScriptName( "boulder" )
vector push = <0, 0, 500>  // Push up
target.SetVelocity( push )`,
      tips: [
        'Velocity is in units per second',
        'Z component affects height movement',
        'Use with SetVelocity for physics effects',
        'Falling objects have negative Z velocity'
      ],
      useCases: [
        'Movement detection',
        'Physics interactions',
        'Knockback effects',
        'Velocity-based logic'
      ],
      relatedNodes: ['set-velocity', 'get-origin', 'trace-line']
    }
  },
  {
    type: 'set-velocity',
    category: 'entity',
    label: 'SetVelocity',
    description: 'Set entity velocity',
    color: '#27AE60',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Entity', type: 'data', dataType: 'entity', isInput: true },
      { label: 'Velocity', type: 'data', dataType: 'vector', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: {},
    documentation: {
      longDescription: 'Sets the entity\'s velocity directly. The entity will move in the specified direction at the specified speed. Use for launch effects, knockback, or physics impulses.',
      codeExample: `// Launch player upward
entity player = GetPlayerByIndex( 0 )
player.SetVelocity( <0, 0, 1000> )

// Knockback in facing direction
entity victim = GetEntByScriptName( "hit_entity" )
vector knockback = attacker.GetForwardVector() * 500
knockback.z = 200  // Add upward pop
victim.SetVelocity( knockback )`,
      tips: [
        'Instant velocity change',
        'Physics will continue from new velocity',
        'Combine with GetForwardVector for directional launches',
        'Gravity affects Z over time'
      ],
      useCases: [
        'Launch mechanics',
        'Knockback effects',
        'Physics impulses',
        'Jump pads'
      ],
      relatedNodes: ['get-velocity', 'get-forward-vector', 'create-script-mover']
    }
  },
  {
    type: 'get-health',
    category: 'entity',
    label: 'GetHealth',
    description: 'Get entity current health',
    color: '#27AE60',
    inputs: [
      { label: 'Entity', type: 'data', dataType: 'entity', isInput: true },
    ],
    outputs: [
      { label: 'Health', type: 'data', dataType: 'number', isInput: false },
    ],
    defaultData: {},
    documentation: {
      longDescription: 'Returns the entity\'s current health value. Health decreases when damage is taken. When health reaches 0 or below, the entity dies. Use with GetMaxHealth to calculate health percentage.',
      codeExample: `// Check player health
entity player = GetPlayerByIndex( 0 )
float currentHealth = player.GetHealth()
float maxHealth = player.GetMaxHealth()
float healthPercent = (currentHealth / maxHealth) * 100

if ( currentHealth <= 0 )
{
    print( "Player is dead!" )
}`,
      tips: [
        'Returns current health value',
        'Use with GetMaxHealth for percentage',
        '0 or less means dead',
        'Returns 0 for dead entities'
      ],
      useCases: [
        'Health checks',
        'Health bar UI',
        'Death detection',
        'Regeneration logic'
      ],
      relatedNodes: ['set-health', 'get-max-health', 'set-max-health']
    }
  },
  {
    type: 'set-health',
    category: 'entity',
    label: 'SetHealth',
    description: 'Set entity health',
    color: '#27AE60',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Entity', type: 'data', dataType: 'entity', isInput: true },
      { label: 'Health', type: 'data', dataType: 'number', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { health: 100 },
    documentation: {
      longDescription: 'Sets the entity\'s current health to the specified value. This can heal, damage, or revive entities. Setting health above max is possible but may be clamped by game rules.',
      codeExample: `// Heal player
entity player = GetPlayerByIndex( 0 )
player.SetHealth( 100 )  // Full heal

// Overheal above max
player.SetHealth( 150 )

// Kill entity
entity npc = GetEntByScriptName( "target" )
npc.SetHealth( 0 )`,
      tips: [
        'Can set to any value',
        '0 health kills the entity',
        'Above max may be clamped',
        'Works on players and NPCs'
      ],
      useCases: [
        'Healing mechanics',
        'Damage over time',
        'Reviving players',
        'One-hit kill effects'
      ],
      relatedNodes: ['get-health', 'get-max-health', 'set-max-health']
    }
  },
  {
    type: 'get-max-health',
    category: 'entity',
    label: 'GetMaxHealth',
    description: 'Get entity max health',
    color: '#27AE60',
    inputs: [
      { label: 'Entity', type: 'data', dataType: 'entity', isInput: true },
    ],
    outputs: [
      { label: 'MaxHealth', type: 'data', dataType: 'number', isInput: false },
    ],
    defaultData: {},
    documentation: {
      longDescription: 'Returns the entity\'s maximum health value. This is the upper limit of health the entity can have. Default varies by entity type (players have 100, titans have more).',
      codeExample: `// Calculate health percentage
entity player = GetPlayerByIndex( 0 )
float current = player.GetHealth()
float max = player.GetMaxHealth()
float percent = (current / max) * 100

// Use for health bar UI
RuiSetFloat( hudRui, "healthPercent", percent )`,
      tips: [
        'Returns maximum health cap',
        'Used with GetHealth for percentages',
        'Can be changed with SetMaxHealth',
        'Different entity types have different defaults'
      ],
      useCases: [
        'Health percentage calculations',
        'Health bar UI',
        'Scaling damage by max health',
        'Difficulty adjustments'
      ],
      relatedNodes: ['get-health', 'set-health', 'set-max-health']
    }
  },
  {
    type: 'set-max-health',
    category: 'entity',
    label: 'SetMaxHealth',
    description: 'Set entity max health',
    color: '#27AE60',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Entity', type: 'data', dataType: 'entity', isInput: true },
      { label: 'MaxHealth', type: 'data', dataType: 'number', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { maxHealth: 100 },
    documentation: {
      longDescription: 'Sets the entity\'s maximum health value. This changes the upper limit of health. If current health exceeds the new max, it may be clamped down.',
      codeExample: `// Increase player max health (buff)
entity player = GetPlayerByIndex( 0 )
player.SetMaxHealth( 150 )
player.SetHealth( 150 )  // Also heal to new max

// Set NPC difficulty scaling
entity npc = GetEntByScriptName( "elite_enemy" )
npc.SetMaxHealth( 500 )  // Stronger enemy`,
      tips: [
        'Changes health cap',
        'May clamp current health if over',
        'Useful for buff/debuff systems',
        'Affected entities keep current health value'
      ],
      useCases: [
        'Health buffs/debuffs',
        'Difficulty scaling',
        'Elite enemy variants',
        'Game mode modifiers'
      ],
      relatedNodes: ['get-max-health', 'get-health', 'set-health']
    }
  },
  {
    type: 'get-shield-health',
    category: 'entity',
    label: 'GetShieldHealth',
    description: 'Get entity shield health',
    color: '#27AE60',
    inputs: [
      { label: 'Entity', type: 'data', dataType: 'entity', isInput: true },
    ],
    outputs: [
      { label: 'Shield', type: 'data', dataType: 'number', isInput: false },
    ],
    defaultData: {},
    documentation: {
      longDescription: 'Returns the entity\'s shield health (armor) value. Shields absorb damage before health takes effect. Common on players and titans. Returns 0 for entities without shields.',
      codeExample: `// Check shield status
entity player = GetPlayerByIndex( 0 )
float shield = player.GetShieldHealth()
float health = player.GetHealth()

print( "Shields: " + shield + " | Health: " + health )`,
      tips: [
        'Shields absorb damage first',
        'Returns 0 if no shields',
        'Use with GetMaxShield for percentage',
        'Shield break effects can be triggered'
      ],
      useCases: [
        'Shield status UI',
        'Shield break detection',
        'Damage calculation',
        'Regeneration logic'
      ],
      relatedNodes: ['set-shield-health', 'get-health', 'set-health']
    }
  },
  {
    type: 'set-shield-health',
    category: 'entity',
    label: 'SetShieldHealth',
    description: 'Set entity shield health',
    color: '#27AE60',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Entity', type: 'data', dataType: 'entity', isInput: true },
      { label: 'Shield', type: 'data', dataType: 'number', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { shield: 100 },
    documentation: {
      longDescription: 'Sets the entity\'s shield health. Shields absorb damage before health is affected. Setting to 0 breaks all shields. Use for shield regeneration or depletion mechanics.',
      codeExample: `// Regenerate shields
entity player = GetPlayerByIndex( 0 )
player.SetShieldHealth( 100 )  // Full shields

// Break shields
entity target = GetEntByScriptName( "shielded_enemy" )
target.SetShieldHealth( 0 )  // Break shields

// Partial shield restore
target.SetShieldHealth( 50 )`,
      tips: [
        'Shield must be 0 for health to take damage',
        'Can set to any value',
        'Used for shield regen mechanics',
        'Shield break triggers visuals/sounds'
      ],
      useCases: [
        'Shield regeneration',
        'Shield break effects',
        'Shield drain mechanics',
        'Buff systems'
      ],
      relatedNodes: ['get-shield-health', 'get-health', 'set-health']
    }
  },
  {
    type: 'get-team',
    category: 'entity',
    label: 'GetTeam',
    description: 'Get entity team',
    color: '#27AE60',
    inputs: [
      { label: 'Entity', type: 'data', dataType: 'entity', isInput: true },
    ],
    outputs: [
      { label: 'Team', type: 'data', dataType: 'number', isInput: false },
    ],
    defaultData: {},
    documentation: {
      longDescription: 'Returns the entity\'s team number. Common teams are TEAM_IMC (2) and TEAM_MILITIA (3). Use with Compare nodes to check team membership for friendly/hostile detection.',
      codeExample: `// Check player team
entity player = GetPlayerByIndex( 0 )
int team = player.GetTeam()

if ( team == TEAM_IMC )
{
    print( "Player is on IMC" )
}
else if ( team == TEAM_MILITIA )
{
    print( "Player is on Militia" )
}`,
      tips: [
        'Returns team enum value',
        'TEAM_IMC = 2, TEAM_MILITIA = 3',
        'Use for team-based logic',
        'Team 0/1 may be neutral or unassigned'
      ],
      useCases: [
        'Team checking',
        'Friendly fire prevention',
        'Team-based scoring',
        'Objective assignment'
      ],
      relatedNodes: ['set-team', 'get-players-on-team', 'switch']
    }
  },
  {
    type: 'freeze',
    category: 'entity',
    label: 'Freeze',
    description: 'Freeze entity in place',
    color: '#27AE60',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Entity', type: 'data', dataType: 'entity', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: {},
    tags: ['freeze', 'movement', 'physics'],
    documentation: {
      longDescription: 'Stops all physics movement on the entity, freezing it in place. The entity remains at its current position and rotation. Use Unfreeze to restore movement.',
      codeExample: `// Freeze a prop
entity crate = GetEntByScriptName( "floating_crate" )
crate.Freeze()

// Freeze player (stops movement)
entity player = GetPlayerByIndex( 0 )
player.Freeze()  // Player can still look around`,
      tips: [
        'Stops all physics',
        'Entity can still receive damage',
        'Use Unfreeze to restore',
        'Can be used for stasis effects'
      ],
      useCases: [
        'Freeze traps',
        'Cinematic freeze',
        'Stasis effects',
        'Physics puzzles'
      ],
      relatedNodes: ['unfreeze', 'set-velocity', 'is-valid']
    }
  },
  {
    type: 'unfreeze',
    category: 'entity',
    label: 'Unfreeze',
    description: 'Unfreeze entity',
    color: '#27AE60',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Entity', type: 'data', dataType: 'entity', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: {},
    tags: ['unfreeze', 'movement', 'physics'],
    documentation: {
      longDescription: 'Restores physics movement on a previously frozen entity. The entity resumes responding to forces and gravity. Use after Freeze to unfreeze.',
      codeExample: `// Unfreeze after delay
entity crate = GetEntByScriptName( "floating_crate" )
crate.Freeze()

wait 5.0  // Wait 5 seconds

crate.Unfreeze()  // Resume physics`,
      tips: [
        'Restores physics simulation',
        'Works after Freeze',
        'Entity may fall if in air',
        'Use for timed freeze effects'
      ],
      useCases: [
        'Ending freeze traps',
        'Timed stasis',
        'Physics puzzle solutions',
        'Freeze/thaw cycles'
      ],
      relatedNodes: ['freeze', 'set-velocity']
    }
  },
  {
    type: 'look-at',
    category: 'entity',
    label: 'LookAt',
    description: 'Make entity look at target',
    color: '#27AE60',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Entity', type: 'data', dataType: 'entity', isInput: true },
      { label: 'Target', type: 'data', dataType: 'entity', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: {},
    tags: ['lookat', 'rotation', 'angles'],
    documentation: {
      longDescription: 'Rotates the entity to face directly at the target entity. The entity\'s forward direction will point at the target\'s origin. Uses the shortest rotation path.',
      codeExample: `// NPC looks at player
entity npc = GetEntByScriptName( "guard_1" )
entity player = GetPlayerByIndex( 0 )

npc.LookAt( player )

// Turret tracks player
entity turret = GetEntByScriptName( "auto_turret" )
turret.LookAt( closestPlayer )`,
      tips: [
        'Rotates entity to face target',
        'Uses shortest rotation path',
        'Works on NPCs, props, turrets',
        'Can be used continuously for tracking'
      ],
      useCases: [
        'NPC facing',
        'Turret tracking',
        'Door orientation',
        'Camera pointing'
      ],
      relatedNodes: ['set-angles', 'get-angles', 'get-forward-vector']
    }
  },
  {
    type: 'get-player-name',
    category: 'entity',
    label: 'GetPlayerName',
    description: 'Get player name',
    color: '#27AE60',
    inputs: [
      { label: 'Player', type: 'data', dataType: 'entity', isInput: true },
    ],
    outputs: [
      { label: 'Name', type: 'data', dataType: 'string', isInput: false },
    ],
    defaultData: {},
    documentation: {
      longDescription: 'Returns the player\'s display name as a string. This is the name shown in the scoreboard and kill feed. Use for player identification and messaging.',
      codeExample: `// Get player name
entity player = GetPlayerByIndex( 0 )
string name = player.GetPlayerName()

print( "Player: " + name )

// Display on HUD
RuiSetString( hudRui, "playerName", name )`,
      tips: [
        'Returns display name string',
        'Available for players only',
        'Use for player identification',
        'Can be used in messages'
      ],
      useCases: [
        'Player identification',
        'Kill feed messages',
        'HUD display',
        'Log messages'
      ],
      relatedNodes: ['get-player-by-index', 'get-all-players', 'print']
    }
  },
  {
    type: 'set-team',
    category: 'entity',
    label: 'SetTeam',
    description: 'Set entity team',
    color: '#27AE60',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Entity', type: 'data', dataType: 'entity', isInput: true },
      { label: 'Team', type: 'data', dataType: 'number', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { team: 2 },
    documentation: {
      longDescription: 'Changes the entity\'s team affiliation. This affects who they are friendly with and can shoot. Common teams are TEAM_IMC (2) and TEAM_MILITIA (3). Use for team switching or bot assignment.',
      codeExample: `// Change player team
entity player = GetPlayerByIndex( 0 )
player.SetTeam( TEAM_MILITIA )  // Switch to Militia

// NPC team assignment
entity bot = GetEntByScriptName( "bot_1" )
bot.SetTeam( TEAM_IMC )  // Bot joins IMC`,
      tips: [
        'Changes team affiliation',
        'Affects friendly fire rules',
        'May trigger team change callbacks',
        'Use enum values (TEAM_IMC, TEAM_MILITIA)'
      ],
      useCases: [
        'Team switching',
        'Bot assignment',
        'Spectator mode',
        'Team-based objectives'
      ],
      relatedNodes: ['get-team', 'get-players-on-team', 'on-player-changed-team']
    }
  },
  {
    type: 'get-owner',
    category: 'entity',
    label: 'GetOwner',
    description: 'Get entity owner',
    color: '#27AE60',
    inputs: [
      { label: 'Entity', type: 'data', dataType: 'entity', isInput: true },
    ],
    outputs: [
      { label: 'Owner', type: 'data', dataType: 'entity', isInput: false },
    ],
    defaultData: {},
    documentation: {
      longDescription: 'Returns the entity\'s owner as set by SetOwner or during creation. Owners are typically the entity that created or is responsible for the owned entity. Returns invalid entity if no owner is set.',
      codeExample: `// Get projectile owner
entity projectile = GetEntByScriptName( "my_projectile" )
entity owner = projectile.GetOwner()

if ( IsValid( owner ) )
{
    // Owner created this projectile
    print( "Projectile was fired by: " + owner.GetPlayerName() )
}`,
      tips: [
        'Returns owner entity reference',
        'May be invalid if no owner set',
        'Use for damage attribution',
        'Set during entity creation'
      ],
      useCases: [
        'Damage attribution',
        'Projectile tracking',
        'Ownership chains',
        'Cleanup hierarchy'
      ],
      relatedNodes: ['set-owner', 'create-entity']
    }
  },
  {
    type: 'set-owner',
    category: 'entity',
    label: 'SetOwner',
    description: 'Set entity owner',
    color: '#27AE60',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Entity', type: 'data', dataType: 'entity', isInput: true },
      { label: 'Owner', type: 'data', dataType: 'entity', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: {},
    documentation: {
      longDescription: 'Sets the entity\'s owner. The owner is typically the entity that created this one or is responsible for it. Used for damage attribution, cleanup chains, and ownership tracking.',
      codeExample: `// Set projectile owner
entity projectile = CreateEntity( "info_target" )
projectile.SetOrigin( shooter.GetOrigin() + <0, 0, 50> )
projectile.SetOwner( shooter )  // Mark shooter as owner
DispatchSpawn( projectile )

// Later, get owner for damage
entity owner = projectile.GetOwner()
if ( IsValid( owner ) )
{
    print( "Owner: " + owner.GetPlayerName() )
}`,
      tips: [
        'Sets ownership reference',
        'Used for damage attribution',
        'Helps with cleanup hierarchy',
        'Can be retrieved with GetOwner'
      ],
      useCases: [
        'Damage attribution',
        'Projectile ownership',
        'Cleanup chains',
        'Friendly fire prevention'
      ],
      relatedNodes: ['get-owner', 'create-entity']
    }
  },
  {
    type: 'get-parent',
    category: 'entity',
    label: 'GetParent',
    description: 'Get entity parent',
    color: '#27AE60',
    inputs: [
      { label: 'Entity', type: 'data', dataType: 'entity', isInput: true },
    ],
    outputs: [
      { label: 'Parent', type: 'data', dataType: 'entity', isInput: false },
    ],
    defaultData: {},
    documentation: {
      longDescription: 'Returns the entity\'s parent if one is set. Parented entities move and rotate with their parent. Use SetParent to establish parent-child relationships.',
      codeExample: `// Check if entity is parented
entity child = GetEntByScriptName( "turret_base" )
entity parent = child.GetParent()

if ( IsValid( parent ) )
{
    print( "Turret is parented to: " + parent.GetScriptName() )
}
else
{
    print( "Turret has no parent" )
}`,
      tips: [
        'Returns parent entity reference',
        'Returns invalid if not parented',
        'Use SetParent to create relationship',
        'Parent moves child with it'
      ],
      useCases: [
        'Hierarchy checking',
        'Attachment verification',
        'Entity relationships',
        'Mount point logic'
      ],
      relatedNodes: ['set-parent', 'clear-parent']
    }
  },
  {
    type: 'set-parent',
    category: 'entity',
    label: 'SetParent',
    description: 'Set entity parent',
    color: '#27AE60',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Entity', type: 'data', dataType: 'entity', isInput: true },
      { label: 'Parent', type: 'data', dataType: 'entity', isInput: true },
      { label: 'Attachment', type: 'data', dataType: 'string', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { attachment: '' },
    documentation: {
      longDescription: 'Parents the entity to another entity. The child will move and rotate with the parent. Use an attachment point name to attach to a specific point on the parent, or empty string for origin-to-origin attachment.',
      codeExample: `// Parent turret to moving platform
entity turret = GetEntByScriptName( "moving_turret" )
entity platform = GetEntByScriptName( "elevator" )

// Attach turret to platform
turret.SetParent( platform )  // Moves with platform

// Attach with specific attachment point
entity flag = GetEntByScriptName( "team_flag" )
entity carrier = GetEntByScriptName( "flag_carrier" )
flag.SetParent( carrier, "flag_attachment" )`,
      tips: [
        'Creates parent-child relationship',
        'Child follows parent movement',
        'Attachment point is optional',
        'Use ClearParent to detach'
      ],
      useCases: [
        'Vehicle attachments',
        'Moving platforms',
        'Equipment carrying',
        'Hierarchical animations'
      ],
      relatedNodes: ['get-parent', 'clear-parent', 'create-entity']
    }
  },
  {
    type: 'clear-parent',
    category: 'entity',
    label: 'ClearParent',
    description: 'Clear entity parent',
    color: '#27AE60',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Entity', type: 'data', dataType: 'entity', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: {},
    documentation: {
      longDescription: 'Removes the parent-child relationship. The entity becomes independent and retains its current position and rotation. Use this to detach carried items or leave moving platforms.',
      codeExample: `// Drop carried item
entity carriedItem = GetEntByScriptName( "carried_object" )
carriedItem.ClearParent()  // Item stays at current position

// Detach from platform at destination
entity turret = GetEntByScriptName( "elevator_turret" )
entity elevator = GetEntByScriptName( "elevator" )

// When elevator reaches top
elevator.SetOrigin( <0, 0, 500> )
turret.ClearParent()  // Turret stays at top`,
      tips: [
        'Removes parent relationship',
        'Entity keeps current position',
        'Use after SetParent to detach',
        'Entity becomes world-relative'
      ],
      useCases: [
        'Dropping items',
        'Detaching from vehicles',
        'Leaving platforms',
        'Releasing attachments'
      ],
      relatedNodes: ['set-parent', 'get-parent']
    }
  },
  {
    type: 'is-valid',
    category: 'entity',
    label: 'IsValid',
    description: 'Check if entity is valid',
    color: '#27AE60',
    inputs: [
      { label: 'Entity', type: 'data', dataType: 'entity', isInput: true },
    ],
    outputs: [
      { label: 'Valid', type: 'data', dataType: 'boolean', isInput: false },
    ],
    defaultData: {},
    documentation: {
      longDescription: 'Checks if an entity reference is still valid. Entities become invalid after being destroyed, killed, or when the entity no longer exists. Always check before using entity references.',
      codeExample: `// Check if player is still in game
entity player = GetPlayerByIndex( 0 )

if ( IsValid( player ) )
{
    // Safe to use player
    player.SetHealth( 100 )
}
else
{
    print( "Player disconnected!" )
}

// Safe entity array iteration
foreach ( entity ent in myEntities )
{
    if ( IsValid( ent ) )
    {
        // Process valid entity
    }
}`,
      tips: [
        'Returns true if entity exists',
        'Always check before using entity',
        'Invalid after entity is killed/removed',
        'Essential for safe array iteration'
      ],
      useCases: [
        'Safe entity access',
        'Disconnection handling',
        'Array cleanup',
        'Callback validation'
      ],
      relatedNodes: ['is-alive', 'is-player', 'get-all-players']
    }
  },
  {
    type: 'is-alive',
    category: 'entity',
    label: 'IsAlive',
    description: 'Check if entity is alive',
    color: '#27AE60',
    inputs: [
      { label: 'Entity', type: 'data', dataType: 'entity', isInput: true },
    ],
    outputs: [
      { label: 'Alive', type: 'data', dataType: 'boolean', isInput: false },
    ],
    defaultData: {},
    documentation: {
      longDescription: 'Checks if an entity is currently alive. Returns true for living entities, false for dead or destroyed entities. Use this to check player/NPC status before interactions.',
      codeExample: `// Check if player is alive
entity player = GetPlayerByIndex( 0 )

if ( IsAlive( player ) )
{
    // Player is alive, can interact
    player.SetHealth( 100 )
}
else
{
    print( "Player is dead" )
}

// NPC status check
entity npc = GetEntByScriptName( "enemy_1" )
if ( IsAlive( npc ) && npc.GetTeam() == TEAM_IMC )
{
    // Attack alive IMC NPC
}`,
      tips: [
        'Returns true if entity is alive',
        'False for dead or invalid entities',
        'Use before damaging or interacting',
        'Combine with IsValid for full check'
      ],
      useCases: [
        'Death checks',
        'Respawn logic',
        'Conditional interactions',
        'Game state tracking'
      ],
      relatedNodes: ['is-valid', 'get-health', 'on-death']
    }
  },
  {
    type: 'is-player',
    category: 'entity',
    label: 'IsPlayer',
    description: 'Check if entity is a player',
    color: '#27AE60',
    inputs: [
      { label: 'Entity', type: 'data', dataType: 'entity', isInput: true },
    ],
    outputs: [
      { label: 'IsPlayer', type: 'data', dataType: 'boolean', isInput: false },
    ],
    defaultData: {},
    documentation: {
      longDescription: 'Checks if the entity is a player. Returns true for player entities, false for NPCs, props, or other non-player entities. Use to differentiate between players and AI.',
      codeExample: `// Check entity type
entity ent = GetEntByScriptName( "unknown_entity" )

if ( IsPlayer( ent ) )
{
    // Treat as player
    print( "This is a player: " + ent.GetPlayerName() )
}
else if ( IsNPC( ent ) )
{
    // Treat as NPC
    print( "This is an NPC" )
}`,
      tips: [
        'Returns true for players only',
        'False for NPCs and props',
        'Use for type-specific handling',
        'Combine with other type checks'
      ],
      useCases: [
        'Entity type checking',
        'Player-specific logic',
        'NPC filtering',
        'Damage type handling'
      ],
      relatedNodes: ['is-npc', 'is-titan', 'is-pilot']
    }
  },
  {
    type: 'is-npc',
    category: 'entity',
    label: 'IsNPC',
    description: 'Check if entity is an NPC',
    color: '#27AE60',
    inputs: [
      { label: 'Entity', type: 'data', dataType: 'entity', isInput: true },
    ],
    outputs: [
      { label: 'IsNPC', type: 'data', dataType: 'boolean', isInput: false },
    ],
    defaultData: {},
    documentation: {
      longDescription: 'Checks if the entity is an NPC (non-player character). Returns true for AI entities like soldiers, prowlers, and drones. Use to apply NPC-specific logic.',
      codeExample: `// Check if entity is NPC
entity ent = GetEntByScriptName( "creature" )

if ( IsNPC( ent ) )
{
    // Apply NPC AI logic
    ent.SetSpawnOption_AISettings( "npc_soldier" )
}

// Filter NPC from player array
array players = GetPlayerArray()
array npcs = []

foreach ( entity e in GetEntityArray() )
{
    if ( IsNPC( e ) )
        npcs.append( e )
}`,
      tips: [
        'Returns true for AI entities',
        'False for players and props',
        'Use for AI-specific handling',
        'Combine with IsTitan/IsPilot'
      ],
      useCases: [
        'NPC detection',
        'AI logic application',
        'Entity filtering',
        'Spawn system setup'
      ],
      relatedNodes: ['is-player', 'is-titan', 'is-pilot']
    }
  },
  {
    type: 'is-titan',
    category: 'entity',
    label: 'IsTitan',
    description: 'Check if entity is a titan',
    color: '#27AE60',
    inputs: [
      { label: 'Entity', type: 'data', dataType: 'entity', isInput: true },
    ],
    outputs: [
      { label: 'IsTitan', type: 'data', dataType: 'boolean', isInput: false },
    ],
    defaultData: {},
    documentation: {
      longDescription: 'Checks if the entity is a Titan. Returns true for player titans and AI titans. Use to apply titan-specific logic like doom, execute, or loadout handling.',
      codeExample: `// Check if entity is a Titan
entity ent = GetEntByScriptName( "big_enemy" )

if ( IsTitan( ent ) )
{
    // Apply titan-specific logic
    // Can use doom, execute, etc.
    print( "This is a Titan!" )
}

// Different handling for titans vs pilots
if ( IsTitan( target ) )
{
    // Titan damage handling
}
else if ( IsPilot( target ) )
{
    // Pilot damage handling
}`,
      tips: [
        'Returns true for Titans',
        'Works on player and AI titans',
        'Use for titan-specific mechanics',
        'Combine with IsPlayer for full type'
      ],
      useCases: [
        'Titan detection',
        'Execute mechanics',
        'Doom system',
        'Titan-specific damage'
      ],
      relatedNodes: ['is-player', 'is-npc', 'is-pilot']
    }
  },
  {
    type: 'is-pilot',
    category: 'entity',
    label: 'IsPilot',
    description: 'Check if entity is a pilot',
    color: '#27AE60',
    inputs: [
      { label: 'Entity', type: 'data', dataType: 'entity', isInput: true },
    ],
    outputs: [
      { label: 'IsPilot', type: 'data', dataType: 'boolean', isInput: false },
    ],
    defaultData: {},
    documentation: {
      longDescription: 'Checks if the entity is a pilot (on-foot player or NPC). Returns true for player pilots and foot-soldier NPCs. Use to apply pilot-specific handling.',
      codeExample: `// Check if entity is a pilot
entity ent = GetEntByScriptName( "soldier" )

if ( IsPilot( ent ) )
{
    // Pilot-specific handling
    // Different damage, abilities, etc.
}

// Distinguish from titan
if ( IsPilot( target ) && !IsTitan( target ) )
{
    // Definitely a pilot (not in titan)
}`,
      tips: [
        'Returns true for pilots',
        'True for both player and NPC pilots',
        'False for titans (players in titans)',
        'Use with IsPlayer for player check'
      ],
      useCases: [
        'Pilot detection',
        'Pilot-specific abilities',
        'Damage type handling',
        'Loadout handling'
      ],
      relatedNodes: ['is-player', 'is-npc', 'is-titan']
    }
  },
  {
    type: 'get-class-name',
    category: 'entity',
    label: 'GetClassName',
    description: 'Get entity class name',
    color: '#27AE60',
    inputs: [
      { label: 'Entity', type: 'data', dataType: 'entity', isInput: true },
    ],
    outputs: [
      { label: 'ClassName', type: 'data', dataType: 'string', isInput: false },
    ],
    defaultData: {},
    documentation: {
      longDescription: 'Returns the entity\'s class name as a string. Class names identify the entity type (e.g., "player", "npc_soldier", "prop_dynamic", "trigger_radius"). Use for type checking and spawning.',
      codeExample: `// Get entity class
entity ent = GetEntByScriptName( "mystery_entity" )
string className = ent.GetClassName()

if ( className == "player" )
{
    print( "It\'s a player!" )
}
else if ( className == "npc_soldier" )
{
    print( "It\'s a soldier NPC!" )
}

// Check before spawning
if ( className == "prop_dynamic" )
{
    print( "This is a dynamic prop" )
}`,
      tips: [
        'Returns the entity\'s class type string',
        'Common classes: player, npc_*, prop_*, trigger_*',
        'Use for type validation',
        'Compare with string equality'
      ],
      useCases: [
        'Entity type checking',
        'Spawn filtering',
        'Callback handling',
        'Entity classification'
      ],
      relatedNodes: ['is-player', 'is-npc', 'create-entity']
    }
  },
  {
    type: 'get-ent-index',
    category: 'entity',
    label: 'GetEntIndex',
    description: 'Get entity index',
    color: '#27AE60',
    inputs: [
      { label: 'Entity', type: 'data', dataType: 'entity', isInput: true },
    ],
    outputs: [
      { label: 'Index', type: 'data', dataType: 'number', isInput: false },
    ],
    defaultData: {},
    documentation: {
      longDescription: 'Returns the entity\'s internal index number. This is a unique identifier assigned by the engine. Use with GetEntByIndex to retrieve the entity by its index.',
      codeExample: `// Get entity index
entity player = GetPlayerByIndex( 0 )
int index = player.GetEntIndex()

print( "Player index: " + index )

// Later, retrieve by index
entity retrieved = GetEntByIndex( index )

if ( IsValid( retrieved ) )
{
    print( "Got entity back!" )
}`,
      tips: [
        'Returns unique entity index',
        'Use with GetEntByIndex to retrieve',
        'Index persists while entity exists',
        'Useful for serialization'
      ],
      useCases: [
        'Entity identification',
        'Serialization',
        'Network entity references',
        'Entity lookup'
      ],
      relatedNodes: ['get-ent-by-index', 'get-entity-by-script-name']
    }
  },
  {
    type: 'get-script-name',
    category: 'entity',
    label: 'GetScriptName',
    description: 'Get entity script name',
    color: '#27AE60',
    inputs: [
      { label: 'Entity', type: 'data', dataType: 'entity', isInput: true },
    ],
    outputs: [
      { label: 'ScriptName', type: 'data', dataType: 'string', isInput: false },
    ],
    defaultData: {},
    documentation: {
      longDescription: 'Returns the entity\'s script name as set by SetScriptName or in the map. Script names provide a way to reference entities by a custom name. Use GetEntByScriptName to find by script name.',
      codeExample: `// Get entity script name
entity prop = GetEntByScriptName( "spawn_point_1" )
string name = prop.GetScriptName()

if ( name == "spawn_point_1" )
{
    print( "Found spawn point!" )
}

// All entities have some script name
entity player = GetPlayerByIndex( 0 )
print( "Player script name: " + player.GetScriptName() )`,
      tips: [
        'Returns custom script name',
        'Set via SetScriptName or map editor',
        'Use GetEntByScriptName to find entities',
        'Names should be unique for reliable lookup'
      ],
      useCases: [
        'Entity identification',
        'Named entity lookup',
        'Level entity reference',
        'Spawn point systems'
      ],
      relatedNodes: ['set-script-name', 'get-entity-by-script-name']
    }
  },
  {
    type: 'set-script-name',
    category: 'entity',
    label: 'SetScriptName',
    description: 'Set entity script name',
    color: '#27AE60',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Entity', type: 'data', dataType: 'entity', isInput: true },
      { label: 'ScriptName', type: 'data', dataType: 'string', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { scriptName: 'my_entity' },
    documentation: {
      longDescription: 'Sets a custom script name on an entity. This allows the entity to be found later using GetEntByScriptName. Script names must be unique for reliable lookup.',
      codeExample: `// Name an entity for later lookup
entity spawnPoint = CreatePropDynamic( model, origin, angles )
spawnPoint.SetScriptName( "my_spawn_point" )

// Later, find it
entity found = GetEntByScriptName( "my_spawn_point" )

if ( IsValid( found ) )
{
    print( "Found my spawn point!" )
}`,
      tips: [
        'Sets custom identifier for entity',
        'Use unique names to avoid conflicts',
        'Can be set during creation or later',
        'Use with GetEntByScriptName for lookup'
      ],
      useCases: [
        'Naming entities for lookup',
        'Spawn point systems',
        'Checkpoint tracking',
        'Level object reference'
      ],
      relatedNodes: ['get-script-name', 'get-entity-by-script-name', 'create-entity']
    }
  },
  {
    type: 'create-entity',
    category: 'entity-creation',
    label: 'Create Entity',
    description: `Create a new entity with full setup options. All inputs are optional except ClassName. Connect KV nodes to KeyValues input for .kv.* properties.`,
    color: '#27AE60',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'ClassName', type: 'data', dataType: 'string', isInput: true },
      // Core positioning
      { label: 'Origin', type: 'data', dataType: 'vector', isInput: true },
      { label: 'Angles', type: 'data', dataType: 'vector', isInput: true },
      // Hierarchy
      { label: 'Parent', type: 'data', dataType: 'entity', isInput: true },
      { label: 'ParentAttach', type: 'data', dataType: 'string', isInput: true },
      { label: 'Owner', type: 'data', dataType: 'entity', isInput: true },
      // Trigger-specific
      { label: 'Radius', type: 'data', dataType: 'number', isInput: true },
      { label: 'AboveHeight', type: 'data', dataType: 'number', isInput: true },
      { label: 'BelowHeight', type: 'data', dataType: 'number', isInput: true },
      // Model/Asset
      { label: 'Model', type: 'data', dataType: 'asset', isInput: true },
      { label: 'Effect', type: 'data', dataType: 'asset', isInput: true },
      // Health/Team
      { label: 'Health', type: 'data', dataType: 'number', isInput: true },
      { label: 'MaxHealth', type: 'data', dataType: 'number', isInput: true },
      { label: 'Team', type: 'data', dataType: 'number', isInput: true },
      // Display
      { label: 'ScriptName', type: 'data', dataType: 'string', isInput: true },
      { label: 'Visible', type: 'data', dataType: 'boolean', isInput: true },
      { label: 'Solid', type: 'data', dataType: 'boolean', isInput: true },
      // NPC-specific
      { label: 'AISettings', type: 'data', dataType: 'string', isInput: true },
      // KeyValues - connect KV nodes here (supports multiple connections)
      { label: 'KeyValues', type: 'data', dataType: 'table', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
      { label: 'Entity', type: 'data', dataType: 'entity', isInput: false },
    ],
    defaultData: { className: 'prop_dynamic' },
    serverOnly: true,
    tags: ['CreateEntity', 'spawn', 'create', 'entity', 'prop', 'trigger', 'npc', 'particle', 'mover', 'zipline', 'SetRadius', 'SetParent', 'SetOwner', 'kv', 'keyvalue'],
    documentation: {
      longDescription: 'Creates a new entity in the world with specified properties. The entity is not spawned until DispatchSpawn is called. Use the KeyValues input with KV nodes for additional properties. Common classnames: prop_dynamic, prop_physics, trigger_radius, info_particle_system.',
      codeExample: `// Create a simple prop
entity prop = CreateEntity( "prop_dynamic" )
prop.SetValueForModelKey( $"mdl/props/cargo_container.rmdl" )
prop.SetOrigin( <0, 0, 100> )
prop.SetAngles( <0, 45, 0> )
prop.SetScriptName( "my_cargo" )
DispatchSpawn( prop )

// Create a trigger
entity trigger = CreateEntity( "trigger_radius" )
trigger.SetOrigin( player.GetOrigin() )
trigger.SetRadius( 256 )
trigger.SetAboveHeight( 128 )
trigger.SetBelowHeight( 64 )
SetTriggerEnterCallback( trigger, OnPlayerEnter )
DispatchSpawn( trigger )`,
      tips: [
        'Call DispatchSpawn after setting properties',
        'Use KV nodes for additional properties',
        'ClassName is required',
        'Origin/Angles default to <0,0,0>',
        'KeyValues input accepts multiple connections'
      ],
      useCases: [
        'Spawning dynamic props',
        'Creating trigger volumes',
        'Spawning particles',
        'Creating NPC spawners'
      ],
      relatedNodes: ['dispatch-spawn', 'set-entity-kv', 'create-prop-dynamic', 'create-trigger-cylinder']
    }
  },
  {
    type: 'entity-classname',
    category: 'entity',
    label: 'Entity ClassName',
    description: 'Select an entity class name from a dropdown list of all available entity types.',
    color: '#27AE60',
    inputs: [],
    outputs: [
      { label: 'ClassName', type: 'data', dataType: 'string', isInput: false },
    ],
    defaultData: { className: 'prop_dynamic' },
    tags: ['entity', 'classname', 'type', 'prop', 'npc', 'trigger', 'particle', 'dropdown', 'select'],
    documentation: {
      longDescription: 'Provides a dropdown list of all available entity class names for use with Create Entity. Common classes include prop_dynamic, prop_physics, trigger_radius, info_particle_system, npc_soldier, and more.',
      codeExample: `// Select entity type from dropdown
// Common choices:
// - prop_dynamic (static props)
// - prop_physics (physics-enabled props)
// - trigger_radius (trigger zone)
// - info_particle_system (particle emitter)
// - npc_soldier (soldier NPC)

entity ent = CreateEntity( "prop_dynamic" )
DispatchSpawn( ent )`,
      tips: [
        'Use dropdown to select valid class names',
        'ClassName determines entity behavior',
        'Some classes require additional setup',
        'Check game documentation for available classes'
      ],
      useCases: [
        'Entity creation',
        'Spawn point selection',
        'Trigger setup',
        'Particle system creation'
      ],
      relatedNodes: ['create-entity', 'dispatch-spawn', 'create-prop-dynamic']
    }
  },

  // ==================== KEYVALUE NODES ====================
  // These output {key, value} pairs to connect to CreateEntity's KeyValues input
  {
    type: 'kv-solid',
    category: 'entity-creation',
    label: 'KV: Solid',
    description: 'Set entity solid type. 0=not solid, 6=SOLID_VPHYSICS',
    color: '#16A085',
    inputs: [
      { label: 'Value', type: 'data', dataType: 'number', isInput: true },
    ],
    outputs: [
      { label: 'KV', type: 'data', dataType: 'table', isInput: false },
    ],
    defaultData: { key: 'solid', value: 0 },
    tags: ['kv', 'keyvalue', 'solid', 'collision'],
  },
  {
    type: 'kv-rendercolor',
    category: 'entity-creation',
    label: 'KV: RenderColor',
    description: 'Set entity render color as "R,G,B" string (0-255)',
    color: '#16A085',
    inputs: [
      { label: 'Color', type: 'data', dataType: 'string', isInput: true },
    ],
    outputs: [
      { label: 'KV', type: 'data', dataType: 'table', isInput: false },
    ],
    defaultData: { key: 'rendercolor', value: '255,255,255' },
    tags: ['kv', 'keyvalue', 'render', 'color'],
  },
  {
    type: 'kv-renderamt',
    category: 'entity-creation',
    label: 'KV: RenderAmt',
    description: 'Set entity render alpha (0-255)',
    color: '#16A085',
    inputs: [
      { label: 'Alpha', type: 'data', dataType: 'number', isInput: true },
    ],
    outputs: [
      { label: 'KV', type: 'data', dataType: 'table', isInput: false },
    ],
    defaultData: { key: 'renderamt', value: 255 },
    tags: ['kv', 'keyvalue', 'render', 'alpha', 'transparency'],
  },
  {
    type: 'kv-rendermode',
    category: 'entity-creation',
    label: 'KV: RenderMode',
    description: 'Set render mode. 0=normal, 1=color, 5=additive, 10=glow',
    color: '#16A085',
    inputs: [
      { label: 'Mode', type: 'data', dataType: 'number', isInput: true },
    ],
    outputs: [
      { label: 'KV', type: 'data', dataType: 'table', isInput: false },
    ],
    defaultData: { key: 'rendermode', value: 0 },
    tags: ['kv', 'keyvalue', 'render', 'mode'],
  },
  {
    type: 'kv-visibility-flags',
    category: 'entity-creation',
    label: 'KV: VisibilityFlags',
    description: 'Set visibility flags. ENTITY_VISIBLE_TO_OWNER=1, FRIENDLY=2, ENEMY=4',
    color: '#16A085',
    inputs: [
      { label: 'Flags', type: 'data', dataType: 'number', isInput: true },
    ],
    outputs: [
      { label: 'KV', type: 'data', dataType: 'table', isInput: false },
    ],
    defaultData: { key: 'VisibilityFlags', value: 7 },
    tags: ['kv', 'keyvalue', 'visibility', 'flags'],
  },
  {
    type: 'kv-spawnflags',
    category: 'entity-creation',
    label: 'KV: SpawnFlags',
    description: 'Set entity spawn flags (bitfield)',
    color: '#16A085',
    inputs: [
      { label: 'Flags', type: 'data', dataType: 'number', isInput: true },
    ],
    outputs: [
      { label: 'KV', type: 'data', dataType: 'table', isInput: false },
    ],
    defaultData: { key: 'spawnflags', value: 0 },
    tags: ['kv', 'keyvalue', 'spawn', 'flags'],
  },
  {
    type: 'kv-collision-group',
    category: 'entity-creation',
    label: 'KV: CollisionGroup',
    description: 'Set collision group',
    color: '#16A085',
    inputs: [
      { label: 'Group', type: 'data', dataType: 'number', isInput: true },
    ],
    outputs: [
      { label: 'KV', type: 'data', dataType: 'table', isInput: false },
    ],
    defaultData: { key: 'CollisionGroup', value: 0 },
    tags: ['kv', 'keyvalue', 'collision', 'group'],
  },
  {
    type: 'kv-start-active',
    category: 'entity-creation',
    label: 'KV: StartActive',
    description: 'Set whether entity starts active (for particles, triggers)',
    color: '#16A085',
    inputs: [
      { label: 'Active', type: 'data', dataType: 'number', isInput: true },
    ],
    outputs: [
      { label: 'KV', type: 'data', dataType: 'table', isInput: false },
    ],
    defaultData: { key: 'start_active', value: 1 },
    tags: ['kv', 'keyvalue', 'start', 'active', 'particle'],
  },
  {
    type: 'kv-fadedist',
    category: 'entity-creation',
    label: 'KV: FadeDist',
    description: 'Set fade distance. -1 = never fade',
    color: '#16A085',
    inputs: [
      { label: 'Distance', type: 'data', dataType: 'number', isInput: true },
    ],
    outputs: [
      { label: 'KV', type: 'data', dataType: 'table', isInput: false },
    ],
    defaultData: { key: 'fadedist', value: -1 },
    tags: ['kv', 'keyvalue', 'fade', 'distance'],
  },
  {
    type: 'kv-modelscale',
    category: 'entity-creation',
    label: 'KV: ModelScale',
    description: 'Set model scale multiplier',
    color: '#16A085',
    inputs: [
      { label: 'Scale', type: 'data', dataType: 'number', isInput: true },
    ],
    outputs: [
      { label: 'KV', type: 'data', dataType: 'table', isInput: false },
    ],
    defaultData: { key: 'modelscale', value: 1.0 },
    tags: ['kv', 'keyvalue', 'model', 'scale'],
  },
  {
    type: 'kv-trigger-filter',
    category: 'entity-creation',
    label: 'KV: TriggerFilter',
    description: 'Set trigger filter flags for characters/players/NPCs',
    color: '#16A085',
    inputs: [
      { label: 'FilterNonCharacter', type: 'data', dataType: 'string', isInput: true },
      { label: 'FilterPlayer', type: 'data', dataType: 'string', isInput: true },
      { label: 'FilterNpc', type: 'data', dataType: 'string', isInput: true },
    ],
    outputs: [
      { label: 'KV', type: 'data', dataType: 'table', isInput: false },
    ],
    defaultData: { filterNonCharacter: '0', filterPlayer: '1', filterNpc: '1' },
    tags: ['kv', 'keyvalue', 'trigger', 'filter', 'player', 'npc'],
  },
  {
    type: 'kv-custom',
    category: 'entity-creation',
    label: 'KV: Custom',
    description: 'Set any custom keyvalue property',
    color: '#16A085',
    inputs: [
      { label: 'Key', type: 'data', dataType: 'string', isInput: true },
      { label: 'Value', type: 'data', dataType: 'any', isInput: true },
    ],
    outputs: [
      { label: 'KV', type: 'data', dataType: 'table', isInput: false },
    ],
    defaultData: { key: 'enabled', value: '1' },
    tags: ['kv', 'keyvalue', 'custom', 'property'],
  },

  {
    type: 'create-script-mover',
    category: 'entity-creation',
    label: 'CreateScriptMover',
    description: 'Create a script mover entity. Movers can move smoothly along paths and can parent other entities.',
    color: '#27AE60',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Origin', type: 'data', dataType: 'vector', isInput: true },
      { label: 'Angles', type: 'data', dataType: 'vector', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
      { label: 'Mover', type: 'data', dataType: 'entity', isInput: false },
    ],
    defaultData: {},
    serverOnly: true,
    tags: ['create', 'mover', 'script_mover', 'movement', 'path'],
    documentation: {
      longDescription: 'Creates a ScriptMover entity that can move smoothly between positions. ScriptMovers are invisible helper entities useful for moving platforms, animated objects, or as parent points for other entities.',
      codeExample: `// Create a moving platform
entity mover = CreateScriptMover( <100, 0, 100>, <0, 0, 0> )
mover.SetScriptName( "elevator_platform" )
DispatchSpawn( mover )

// Parent objects to the mover
entity crate = GetEntByScriptName( "platform_crate" )
crate.SetParent( mover )

// Move the platform (use custom code or lerp functions)
// mover.SetOrigin( <100, 0, 300> )`,
      tips: [
        'Invisible but functional',
        'Can be parented to for moving groups',
        'Use SetOrigin/SetAngles for movement',
        'Smooth movement requires custom logic'
      ],
      useCases: [
        'Moving platforms',
        'Animated doors',
        'Parent points',
        'Elevator systems'
      ],
      relatedNodes: ['set-origin', 'set-angles', 'set-parent', 'create-entity']
    }
  },

  // ==================== SPECIALIZED ENTITY CREATION ====================
  {
    type: 'create-prop-dynamic',
    category: 'entity-creation',
    label: 'Create Prop Dynamic',
    description: 'Create a prop_dynamic entity with a model. Can be animated and have skins.',
    color: '#27AE60',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Model', type: 'data', dataType: 'asset', isInput: true },
      { label: 'Origin', type: 'data', dataType: 'vector', isInput: true },
      { label: 'Angles', type: 'data', dataType: 'vector', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
      { label: 'Prop', type: 'data', dataType: 'entity', isInput: false },
    ],
    defaultData: { model: '$"mdl/dev/empty_model.rmdl"', solid: true },
    serverOnly: true,
    tags: ['create', 'prop', 'prop_dynamic', 'model', 'spawn'],
    documentation: {
      longDescription: 'Creates a dynamic prop with the specified model. Prop_dynamics can be animated, have different skins, and respond to damage if configured. Use for scenery, obstacles, and interactive objects.',
      codeExample: `// Create a simple prop\nentity crate = CreatePropDynamic( $"mdl/props/crate_01.rmdl", <100, 200, 50>, <0, 45, 0> )\ncrate.SetScriptName( "crate_1" )\nDispatchSpawn( crate )\n\n// Make it solid\ncrate.SetSolid( true )\n\n// Set skin if available\n// crate.SetSkin( 1 )`,
      tips: [
        'Use for static and animated props',
        'Can be parented to movers',
        'Set Solid for collision',
        'Supports model skins'
      ],
      useCases: [
        'Scenery objects',
        'Obstacles',
        'Animated props',
        'Interactive objects'
      ],
      relatedNodes: ['create-prop-physics', 'set-model', 'set-solid']
    }
  },
  {
    type: 'create-prop-physics',
    category: 'entity-creation',
    label: 'Create Prop Physics',
    description: 'Create a prop_physics entity with physics simulation. Will fall and collide.',
    color: '#27AE60',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Model', type: 'data', dataType: 'asset', isInput: true },
      { label: 'Origin', type: 'data', dataType: 'vector', isInput: true },
      { label: 'Angles', type: 'data', dataType: 'vector', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
      { label: 'Prop', type: 'data', dataType: 'entity', isInput: false },
    ],
    defaultData: { model: '$"mdl/dev/empty_model.rmdl"' },
    serverOnly: true,
    tags: ['create', 'prop', 'prop_physics', 'physics', 'model', 'spawn'],
    documentation: {
      longDescription: 'Creates a physics-enabled prop that responds to gravity and collisions. Unlike prop_dynamic, physics props can be pushed, thrown, and will interact with the physics world.',
      codeExample: `// Create a physics prop\nentity ball = CreatePropPhysics( $"mdl/props/ball_01.rmdl", <0, 0, 200>, <0, 0, 0> )\nball.SetScriptName( "physics_ball" )\nDispatchSpawn( ball )\n\n// Ball will fall and roll\n// Can be pushed by players and explosions`,
      tips: [
        'Responds to gravity and collisions',
        'Can be kicked/pushed',
        'More expensive than prop_dynamic',
        'Use for throwable objects'
      ],
      useCases: [
        'Throwable objects',
        'Physics toys',
        'Obstacles',
        'Interactive physics'
      ],
      relatedNodes: ['create-prop-dynamic', 'set-velocity', 'set-solid']
    }
  },
  {
    type: 'create-info-target',
    category: 'entity-creation',
    label: 'Create Info Target',
    description: 'Create an info_target entity. Useful as a reference point, damage inflictor, or attachment point.',
    color: '#27AE60',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Origin', type: 'data', dataType: 'vector', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
      { label: 'Target', type: 'data', dataType: 'entity', isInput: false },
    ],
    defaultData: {},
    serverOnly: true,
    tags: ['create', 'info_target', 'reference', 'point', 'inflictor'],
    documentation: {
      longDescription: 'Creates an info_target entity, which is a simple point in space. Used as reference points, damage sources, attachment points, or for line-of-sight checks. Completely invisible and non-interactive except as a position.',
      codeExample: `// Create a target point
entity target = CreateInfoTarget( <100, 200, 50> )
target.SetScriptName( "shoot_target" )
DispatchSpawn( target )

// Use as damage inflictor
// DamageInfo_SetInflictor( damageInfo, target )

// Use for attachment point
entity prop = GetEntByScriptName( "flag" )
prop.SetParent( target )`,
      tips: [
        'Invisible reference point',
        'Good for damage attribution',
        'Can be parented to',
        'Lightweight entity type'
      ],
      useCases: [
        'Reference points',
        'Damage sources',
        'Attachment points',
        'Raycast targets'
      ],
      relatedNodes: ['create-entity', 'set-parent', 'trace-line']
    }
  },
  {
    type: 'create-particle-system',
    category: 'entity-creation',
    label: 'Create Particle System',
    description: 'Create an info_particle_system entity for persistent particle effects. Set effect with SetValueForEffectNameKey().',
    color: '#9B59B6',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Effect', type: 'data', dataType: 'asset', isInput: true },
      { label: 'Origin', type: 'data', dataType: 'vector', isInput: true },
      { label: 'StartActive', type: 'data', dataType: 'boolean', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
      { label: 'ParticleEnt', type: 'data', dataType: 'entity', isInput: false },
    ],
    defaultData: { effect: '$""', startActive: true },
    serverOnly: true,
    tags: ['create', 'particle', 'info_particle_system', 'fx', 'effect', 'vfx'],
  },
  {
    type: 'create-control-point',
    category: 'entity-creation',
    label: 'Create Control Point',
    description: 'Create an info_placement_helper for particle control points. Use SetOrigin to position, link via kv.cpoint1.',
    color: '#9B59B6',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Origin', type: 'data', dataType: 'vector', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
      { label: 'ControlPoint', type: 'data', dataType: 'entity', isInput: false },
    ],
    defaultData: {},
    serverOnly: true,
    tags: ['create', 'control point', 'info_placement_helper', 'cpoint', 'particle'],
  },
  {
    type: 'create-ambient-generic',
    category: 'entity-creation',
    label: 'Create Ambient Sound',
    description: 'Create an ambient_generic entity for playing sounds at a location.',
    color: '#E74C3C',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Sound', type: 'data', dataType: 'string', isInput: true },
      { label: 'Origin', type: 'data', dataType: 'vector', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
      { label: 'SoundEnt', type: 'data', dataType: 'entity', isInput: false },
    ],
    defaultData: { sound: '' },
    serverOnly: true,
    tags: ['create', 'ambient_generic', 'sound', 'audio'],
  },
  {
    type: 'create-vortex-sphere',
    category: 'entity-creation',
    label: 'Create Vortex Sphere',
    description: 'Create a vortex_sphere entity for absorbing projectiles (like Vortex Shield).',
    color: '#3498DB',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Origin', type: 'data', dataType: 'vector', isInput: true },
      { label: 'Radius', type: 'data', dataType: 'number', isInput: true },
      { label: 'Height', type: 'data', dataType: 'number', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
      { label: 'VortexSphere', type: 'data', dataType: 'entity', isInput: false },
    ],
    defaultData: { radius: 128, height: 64 },
    serverOnly: true,
    tags: ['create', 'vortex_sphere', 'vortex', 'shield', 'absorb'],
  },
  {
    type: 'create-zipline',
    category: 'entity-creation',
    label: 'Create Zipline',
    description: 'Create a zipline between two points. Creates both zipline and zipline_end entities.',
    color: '#F39C12',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'StartPos', type: 'data', dataType: 'vector', isInput: true },
      { label: 'EndPos', type: 'data', dataType: 'vector', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
      { label: 'ZiplineStart', type: 'data', dataType: 'entity', isInput: false },
      { label: 'ZiplineEnd', type: 'data', dataType: 'entity', isInput: false },
    ],
    defaultData: { autoDetachDistance: 160, material: 'cable/zipline.vmt' },
    serverOnly: true,
    tags: ['create', 'zipline', 'zipline_end', 'movement', 'travel'],
  },
  {
    type: 'create-point-viewcontrol',
    category: 'entity-creation',
    label: 'Create Camera',
    description: 'Create a point_viewcontrol for controlling player camera/view.',
    color: '#8E44AD',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Origin', type: 'data', dataType: 'vector', isInput: true },
      { label: 'Angles', type: 'data', dataType: 'vector', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
      { label: 'Camera', type: 'data', dataType: 'entity', isInput: false },
    ],
    defaultData: {},
    serverOnly: true,
    tags: ['create', 'point_viewcontrol', 'camera', 'view', 'cutscene'],
  },

  // ==================== NPC CREATION ====================
  {
    type: 'create-npc-dummie',
    category: 'npc',
    label: 'Create Dummy',
    description: 'Create a training dummy NPC. Configure with SetSpawnOption_AISettings, SetHealth, SetBehaviorSelector.',
    color: '#E67E22',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Origin', type: 'data', dataType: 'vector', isInput: true },
      { label: 'Angles', type: 'data', dataType: 'vector', isInput: true },
      { label: 'Team', type: 'data', dataType: 'number', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
      { label: 'Dummy', type: 'data', dataType: 'entity', isInput: false },
    ],
    defaultData: { aiSettings: 'npc_training_dummy', team: 99 },
    serverOnly: true,
    tags: ['create', 'npc_dummie', 'dummy', 'training', 'npc', 'ai'],
  },
  {
    type: 'create-npc-prowler',
    category: 'npc',
    label: 'Create Prowler',
    description: 'Create a prowler NPC. Can also be used for flyers with SetSpawnOption_AISettings("npc_flyer").',
    color: '#E67E22',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Origin', type: 'data', dataType: 'vector', isInput: true },
      { label: 'Angles', type: 'data', dataType: 'vector', isInput: true },
      { label: 'Team', type: 'data', dataType: 'number', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
      { label: 'Prowler', type: 'data', dataType: 'entity', isInput: false },
    ],
    defaultData: { aiSettings: 'npc_prowler', team: 99 },
    serverOnly: true,
    tags: ['create', 'npc_prowler', 'prowler', 'flyer', 'wildlife', 'npc', 'ai'],
  },
  {
    type: 'create-npc-spectre',
    category: 'npc',
    label: 'Create Spectre',
    description: 'Create a spectre NPC (robot soldier).',
    color: '#E67E22',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Origin', type: 'data', dataType: 'vector', isInput: true },
      { label: 'Angles', type: 'data', dataType: 'vector', isInput: true },
      { label: 'Team', type: 'data', dataType: 'number', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
      { label: 'Spectre', type: 'data', dataType: 'entity', isInput: false },
    ],
    defaultData: { aiSettings: 'npc_spectre', team: 99 },
    serverOnly: true,
    tags: ['create', 'npc_spectre', 'spectre', 'robot', 'soldier', 'npc', 'ai'],
  },
  {
    type: 'create-npc-marvin',
    category: 'npc',
    label: 'Create Marvin',
    description: 'Create a MRVN (Marvin) robot NPC.',
    color: '#E67E22',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Origin', type: 'data', dataType: 'vector', isInput: true },
      { label: 'Angles', type: 'data', dataType: 'vector', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
      { label: 'Marvin', type: 'data', dataType: 'entity', isInput: false },
    ],
    defaultData: { aiSettings: 'npc_marvin' },
    serverOnly: true,
    tags: ['create', 'npc_marvin', 'marvin', 'mrvn', 'robot', 'npc', 'ai'],
  },
  {
    type: 'create-npc-drone',
    category: 'npc',
    label: 'Create Drone',
    description: 'Create a drone NPC (flying unit).',
    color: '#E67E22',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Origin', type: 'data', dataType: 'vector', isInput: true },
      { label: 'Angles', type: 'data', dataType: 'vector', isInput: true },
      { label: 'Team', type: 'data', dataType: 'number', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
      { label: 'Drone', type: 'data', dataType: 'entity', isInput: false },
    ],
    defaultData: { team: 99 },
    serverOnly: true,
    tags: ['create', 'npc_drone', 'drone', 'flying', 'npc', 'ai'],
  },
  {
    type: 'create-npc-dropship',
    category: 'npc',
    label: 'Create Dropship',
    description: 'Create a dropship NPC for transporting players/NPCs.',
    color: '#E67E22',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Origin', type: 'data', dataType: 'vector', isInput: true },
      { label: 'Angles', type: 'data', dataType: 'vector', isInput: true },
      { label: 'Team', type: 'data', dataType: 'number', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
      { label: 'Dropship', type: 'data', dataType: 'entity', isInput: false },
    ],
    defaultData: { team: 99 },
    serverOnly: true,
    tags: ['create', 'npc_dropship', 'dropship', 'vehicle', 'transport', 'npc', 'ai'],
  },
  {
    type: 'create-npc-turret',
    category: 'npc',
    label: 'Create Sentry Turret',
    description: 'Create an npc_turret_sentry. Automated defense turret.',
    color: '#E67E22',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Origin', type: 'data', dataType: 'vector', isInput: true },
      { label: 'Angles', type: 'data', dataType: 'vector', isInput: true },
      { label: 'Team', type: 'data', dataType: 'number', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
      { label: 'Turret', type: 'data', dataType: 'entity', isInput: false },
    ],
    defaultData: { team: 99 },
    serverOnly: true,
    tags: ['create', 'npc_turret_sentry', 'turret', 'sentry', 'defense', 'npc', 'ai'],
  },

  // ==================== ENTITY SETUP HELPERS ====================
  {
    type: 'dispatch-spawn',
    category: 'entity',
    label: 'DispatchSpawn',
    description: 'Finalize entity creation by calling DispatchSpawn. Required after CreateEntity and setting initial properties.',
    color: '#27AE60',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Entity', type: 'data', dataType: 'entity', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: {},
    serverOnly: true,
    tags: ['DispatchSpawn', 'spawn', 'finalize', 'create'],
    documentation: {
      longDescription: 'Finalizes entity creation by spawning the entity in the world. Must be called after CreateEntity and setting any initial properties. The entity is not active until DispatchSpawn is called.',
      codeExample: `// Complete entity creation
entity prop = CreateEntity( "prop_dynamic" )
prop.SetValueForModelKey( $"mdl/props/crate.rmdl" )
prop.SetOrigin( <100, 200, 50> )
prop.SetScriptName( "my_crate" )

// This activates the entity
DispatchSpawn( prop )

// Now it exists in the world
print( "Crate spawned!" )`,
      tips: [
        'Required to activate created entities',
        'Call after all property setup',
        'Entity is not valid until this is called',
        'Triggers spawn callbacks'
      ],
      useCases: [
        'Finalizing entity creation',
        'Spawning dynamic objects',
        'Creating triggers',
        'Object pool activation'
      ],
      relatedNodes: ['create-entity', 'set-model', 'set-entity-kv']
    }
  },
  {
    type: 'set-model',
    category: 'entity',
    label: 'SetValueForModelKey',
    description: 'Set the model for a prop entity using SetValueForModelKey().',
    color: '#27AE60',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Entity', type: 'data', dataType: 'entity', isInput: true },
      { label: 'Model', type: 'data', dataType: 'asset', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { model: '$"mdl/dev/empty_model.rmdl"' },
    serverOnly: true,
    tags: ['SetValueForModelKey', 'model', 'prop', 'asset'],
  },
  {
    type: 'set-effect-name',
    category: 'entity',
    label: 'SetValueForEffectNameKey',
    description: 'Set the particle effect for an info_particle_system entity.',
    color: '#9B59B6',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Entity', type: 'data', dataType: 'entity', isInput: true },
      { label: 'Effect', type: 'data', dataType: 'asset', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { effect: '$""' },
    serverOnly: true,
    tags: ['SetValueForEffectNameKey', 'effect', 'particle', 'fx'],
  },
  {
    type: 'set-entity-kv',
    category: 'entity',
    label: 'Set KeyValue',
    description: `Set a keyvalue property on an entity via entity.kv.property. Common properties:
• solid (0=not solid, 6=SOLID_VPHYSICS)
• rendercolor ("255,255,255")
• renderamt (0-255 alpha)
• rendermode (0=normal, 1=color, 5=additive)
• fadedist (-1=never fade)
• spawnflags
• VisibilityFlags
• triggerFilterNonCharacter/triggerFilterPlayer/triggerFilterNpc`,
    color: '#27AE60',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Entity', type: 'data', dataType: 'entity', isInput: true },
      { label: 'Value', type: 'data', dataType: 'any', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { 
      property: 'solid',
      commonProperties: [
        'solid', 'rendercolor', 'renderamt', 'rendermode', 'fadedist', 'spawnflags', 'VisibilityFlags',
        'CollisionGroup', 'contents', 'enabled', 'targetname', 'teamnumber', 'origin', 'angles',
        'triggerFilterNonCharacter', 'triggerFilterPlayer', 'triggerFilterNpc', 'triggerFilterTeamOther',
        'start_active', 'cpoint1', 'Material', 'Width', 'modelscale', 'gravity',
        'ZiplineAutoDetachDistance', 'ZiplineVertical', 'ZiplineSpeedScale', 'ZiplinePreserveVelocity'
      ]
    },
    tags: ['kv', 'keyvalue', 'property', 'solid', 'render', 'visibility'],
  },
  {
    type: 'set-spawn-option-ai',
    category: 'npc',
    label: 'SetSpawnOption_AISettings',
    description: 'Set AI settings for an NPC before DispatchSpawn. Common values: npc_training_dummy, npc_prowler, npc_flyer, npc_soldier_infected, npc_spectre, npc_marvin.',
    color: '#E67E22',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'NPC', type: 'data', dataType: 'entity', isInput: true },
      { label: 'AISettings', type: 'data', dataType: 'string', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { aiSettings: 'npc_training_dummy' },
    serverOnly: true,
    tags: ['SetSpawnOption_AISettings', 'ai', 'npc', 'behavior', 'spawn option'],
  },
  {
    type: 'set-behavior-selector',
    category: 'npc',
    label: 'SetBehaviorSelector',
    description: 'Set the behavior tree for an NPC after DispatchSpawn. Common: behavior_dummy_empty, behavior_prowler, behavior_soldier.',
    color: '#E67E22',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'NPC', type: 'data', dataType: 'entity', isInput: true },
      { label: 'Behavior', type: 'data', dataType: 'string', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { behavior: 'behavior_dummy_empty' },
    serverOnly: true,
    tags: ['SetBehaviorSelector', 'behavior', 'ai', 'npc', 'behavior tree'],
  },
  {
    type: 'enable-npc-flag',
    category: 'npc',
    label: 'EnableNPCFlag',
    description: 'Enable NPC flags. Common: NPC_DISABLE_SENSING, NPC_IGNORE_ALL (combine with |).',
    color: '#E67E22',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'NPC', type: 'data', dataType: 'entity', isInput: true },
      { label: 'Flags', type: 'data', dataType: 'number', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { flags: 'NPC_DISABLE_SENSING | NPC_IGNORE_ALL' },
    serverOnly: true,
    tags: ['EnableNPCFlag', 'npc', 'flag', 'sensing', 'ignore'],
  },
  {
    type: 'set-visible',
    category: 'entity',
    label: 'SetVisible',
    description: 'Set entity visibility',
    color: '#27AE60',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Entity', type: 'data', dataType: 'entity', isInput: true },
      { label: 'Visible', type: 'data', dataType: 'boolean', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { visible: true },
    documentation: {
      longDescription: 'Controls whether the entity is visible. Invisible entities still exist and can interact, but are not rendered. Use for cloaking effects, hidden doors, or temporary invisibility.',
      codeExample: `// Make entity invisible
entity enemy = GetEntByScriptName( "stealth_enemy" )
enemy.SetVisible( false )

// Make visible again
wait 5.0
enemy.SetVisible( true )

// Toggle visibility
if ( enemy.IsVisible() )
    enemy.SetVisible( false )
else
    enemy.SetVisible( true )`,
      tips: [
        'Controls rendering only',
        'Entity still collides and interacts',
        'Use for stealth/invisibility',
        'Can be combined with physics changes'
      ],
      useCases: [
        'Stealth mechanics',
        'Hidden objects',
        'Cloaking devices',
        'Door hiding'
      ],
      relatedNodes: ['make-invisible', 'set-solid']
    }
  },
  {
    type: 'set-solid',
    category: 'entity',
    label: 'SetSolid',
    description: 'Set entity solid state',
    color: '#27AE60',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Entity', type: 'data', dataType: 'entity', isInput: true },
      { label: 'Solid', type: 'data', dataType: 'boolean', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { solid: true },
    documentation: {
      longDescription: 'Controls whether the entity has collision and blocks movement. Non-solid entities can be walked through. Use for ghost mode, trigger volumes, or collision toggling.',
      codeExample: `// Make entity non-solid (ghost mode)
entity player = GetPlayerByIndex( 0 )
player.SetSolid( false )  // Player becomes non-solid

// Can walk through walls
wait 10.0
player.SetSolid( true )  // Restore collision

// Toggle collision on prop
entity barrier = GetEntByScriptName( "temporary_wall" )
barrier.SetSolid( false )  // Walk through`,
      tips: [
        'Controls collision',
        'Non-solid entities can be walked through',
        'Players can still interact with non-solid entities',
        'Useful for trigger-like behavior'
      ],
      useCases: [
        'Ghost mode',
        'Temporary barriers',
        'Trigger volumes',
        'Collision puzzles'
      ],
      relatedNodes: ['set-visible', 'create-trigger-cylinder', 'kv-solid']
    }
  },
  {
    type: 'make-invisible',
    category: 'entity',
    label: 'MakeInvisible',
    description: 'Make entity invisible',
    color: '#27AE60',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Entity', type: 'data', dataType: 'entity', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: {},
    documentation: {
      longDescription: 'Makes the entity completely invisible. The entity still exists and can interact, but is not rendered. This is a simpler alternative to SetVisible(false) for permanent invisibility.',
      codeExample: `// Make entity invisible
entity ghost = GetEntByScriptName( "ghost_entity" )
ghost.MakeInvisible()

// Entity still collides but can't be seen
// Can still be damaged, interacts normally`,
      tips: [
        'Makes entity non-rendered',
        'Entity still functions normally',
        'Use for ghosts, spirits, hidden objects',
        'Simpler than SetVisible for permanent case'
      ],
      useCases: [
        'Ghost entities',
        'Invisible references',
        'Hidden checkpoints',
        'Debug visualization toggle'
      ],
      relatedNodes: ['set-visible', 'set-solid']
    }
  },
  {
    type: 'get-forward-vector',
    category: 'entity',
    label: 'GetForwardVector',
    description: 'Get entity forward direction',
    color: '#27AE60',
    inputs: [
      { label: 'Entity', type: 'data', dataType: 'entity', isInput: true },
    ],
    outputs: [
      { label: 'Forward', type: 'data', dataType: 'vector', isInput: false },
    ],
    defaultData: {},
    documentation: {
      longDescription: 'Returns the entity\'s forward direction as a normalized vector based on its angles. This is the direction the entity is "facing" along its X axis. Used for directional calculations.',
      codeExample: `// Get forward direction
entity player = GetPlayerByIndex( 0 )
vector forward = player.GetForwardVector()

// Calculate point in front of player
vector aimPoint = player.GetOrigin() + (forward * 100)

// Shoot in facing direction
vector bulletDir = player.GetForwardVector()
FireWeaponBullet( weapon, player.GetOrigin(), bulletDir )`,
      tips: [
        'Returns normalized direction vector',
        'Based on entity\'s yaw and pitch',
        'Use for directional calculations',
        'Combined with distance for point in front'
      ],
      useCases: [
        'Aiming calculations',
        'Directional movement',
        'Raycasting',
        'Projectile trajectory'
      ],
      relatedNodes: ['get-right-vector', 'get-up-vector', 'angles-to-forward', 'set-angles']
    }
  },
  {
    type: 'get-right-vector',
    category: 'entity',
    label: 'GetRightVector',
    description: 'Get entity right direction',
    color: '#27AE60',
    inputs: [
      { label: 'Entity', type: 'data', dataType: 'entity', isInput: true },
    ],
    outputs: [
      { label: 'Right', type: 'data', dataType: 'vector', isInput: false },
    ],
    defaultData: {},
    documentation: {
      longDescription: 'Returns the entity\'s right direction as a normalized vector. The right vector points 90 degrees from forward, along the Y axis of the entity\'s angles.',
      codeExample: `// Get right direction
entity player = GetPlayerByIndex( 0 )
vector right = player.GetRightVector()

// Move to the right
vector moveDir = right * 100

// Strafe movement
vector strafePos = player.GetOrigin() + (player.GetRightVector() * 50)`,
      tips: [
        'Returns normalized right direction',
        '90 degrees from forward',
        'Used for strafe calculations',
        'Can be used for lateral positioning'
      ],
      useCases: [
        'Strafe movement',
        'Lateral positioning',
        'Cross products',
        'Relative positioning'
      ],
      relatedNodes: ['get-forward-vector', 'get-up-vector', 'vector-cross']
    }
  },
  {
    type: 'get-up-vector',
    category: 'entity',
    label: 'GetUpVector',
    description: 'Get entity up direction',
    color: '#27AE60',
    inputs: [
      { label: 'Entity', type: 'data', dataType: 'entity', isInput: true },
    ],
    outputs: [
      { label: 'Up', type: 'data', dataType: 'vector', isInput: false },
    ],
    defaultData: {},
    documentation: {
      longDescription: 'Returns the entity\'s up direction as a normalized vector. This is the direction pointing straight up from the entity, along the Z axis of its angles.',
      codeExample: `// Get up direction
entity entity = GetEntByScriptName( "hovering_prop" )
vector up = entity.GetUpVector()

// Apply upward force
vector liftForce = up * 500
entity.SetVelocity( liftForce )

// Calculate hover height adjustment
vector currentUp = entity.GetUpVector()`,
      tips: [
        'Returns normalized up direction',
        'Based on entity\'s roll/pitch',
        'Used for vertical calculations',
        'Combine with other vectors'
      ],
      useCases: [
        'Vertical positioning',
        'Levitation effects',
        'Upward force application',
        'Orientation analysis'
      ],
      relatedNodes: ['get-forward-vector', 'get-right-vector', 'vector-cross']
    }
  },
  {
    type: 'get-eye-position',
    category: 'entity',
    label: 'EyePosition',
    description: 'Get entity eye position',
    color: '#27AE60',
    inputs: [
      { label: 'Entity', type: 'data', dataType: 'entity', isInput: true },
    ],
    outputs: [
      { label: 'EyePos', type: 'data', dataType: 'vector', isInput: false },
    ],
    defaultData: {},
    documentation: {
      longDescription: 'Returns the position of the entity\'s eyes as a vector. For players, this is the camera position. For NPCs, this is where their eyes are located. Used for line-of-sight checks and aiming.',
      codeExample: `// Get eye position for raycast
entity player = GetPlayerByIndex( 0 )
vector eyePos = player.GetEyePosition()
vector lookDir = player.GetViewVector()

// Raycast from eyes
TraceLine( eyePos, eyePos + lookDir * 1000, null, TRACE_MASK_SHOT, TRACE_COLLISION_GROUP_NONE )

// Position effects at eye level
vector muzzlePos = player.GetEyePosition() + (player.GetForwardVector() * 50)`,
      tips: [
        'Returns eye-level position',
        'Different from origin for tall entities',
        'Use for accurate raycasts',
        'Essential for shooting mechanics'
      ],
      useCases: [
        'Line-of-sight checks',
        'Muzzle position',
        'First-person effects',
        'Aiming calculations'
      ],
      relatedNodes: ['get-eye-angles', 'get-view-vector', 'trace-line']
    }
  },
  {
    type: 'get-eye-angles',
    category: 'entity',
    label: 'EyeAngles',
    description: 'Get entity eye angles',
    color: '#27AE60',
    inputs: [
      { label: 'Entity', type: 'data', dataType: 'entity', isInput: true },
    ],
    outputs: [
      { label: 'EyeAngles', type: 'data', dataType: 'vector', isInput: false },
    ],
    defaultData: {},
    documentation: {
      longDescription: 'Returns the angles the entity\'s eyes are facing. This represents the actual view direction, which may differ from body angles for players looking around without turning their body.',
      codeExample: `// Get eye angles for precise aiming
entity player = GetPlayerByIndex( 0 )
vector eyeAngles = player.GetEyeAngles()

// Convert to forward vector
vector aimDir = AnglesToForward( eyeAngles )

// Position crosshair target
vector targetPos = player.GetEyePosition() + (aimDir * 1000)`,
      tips: [
        'Returns actual view direction',
        'May differ from body angles',
        'Use for precise aiming',
        'Combined with EyePosition for complete view'
      ],
      useCases: [
        'Precise aiming',
        'View direction tracking',
        'Crosshair positioning',
        'Camera effects'
      ],
      relatedNodes: ['get-eye-position', 'get-view-vector', 'angles-to-forward']
    }
  },

  // ==================== ENTITY STRUCT PROPERTIES ====================
  // Context-aware nodes that adapt based on the init node they're connected to
  // player.p.* (ServerPlayerStruct / ClientPlayerStruct)
  {
    type: 'player-get-property',
    category: 'entity-props',
    label: 'Player: Get Property',
    description: 'Get a property from player.p (ServerPlayerStruct or ClientPlayerStruct). Automatically adapts to the context (Server/Client) based on which init node this graph is connected to.',
    color: '#16A085',
    inputs: [
      { label: 'Player', type: 'data', dataType: 'entity', isInput: true },
    ],
    outputs: [
      { label: 'Value', type: 'data', dataType: 'any', isInput: false },
    ],
    defaultData: { property: 'isAdmin' },
    tags: ['player.p', 'ServerPlayerStruct', 'ClientPlayerStruct', 'player property', 'script struct', 'context-aware'],
  },
  {
    type: 'player-set-property',
    category: 'entity-props',
    label: 'Player: Set Property',
    description: 'Set a property on player.p (ServerPlayerStruct or ClientPlayerStruct). Automatically adapts to the context based on which init node this graph is connected to.',
    color: '#16A085',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Player', type: 'data', dataType: 'entity', isInput: true },
      { label: 'Value', type: 'data', dataType: 'any', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { property: 'isAdmin' },
    tags: ['player.p', 'ServerPlayerStruct', 'ClientPlayerStruct', 'player property', 'script struct', 'context-aware'],
  },

  // entity.e.* (ServerEntityStruct / ClientEntityStruct)
  {
    type: 'entity-get-property',
    category: 'entity-props',
    label: 'Entity: Get Property',
    description: 'Get a property from entity.e (ServerEntityStruct or ClientEntityStruct). Automatically adapts to the context based on which init node this graph is connected to.',
    color: '#1ABC9C',
    inputs: [
      { label: 'Entity', type: 'data', dataType: 'entity', isInput: true },
    ],
    outputs: [
      { label: 'Value', type: 'data', dataType: 'any', isInput: false },
    ],
    defaultData: { property: 'spawnTime' },
    tags: ['entity.e', 'ServerEntityStruct', 'ClientEntityStruct', 'entity property', 'script struct', 'context-aware'],
  },
  {
    type: 'entity-set-property',
    category: 'entity-props',
    label: 'Entity: Set Property',
    description: 'Set a property on entity.e (ServerEntityStruct or ClientEntityStruct). Automatically adapts to the context based on which init node this graph is connected to.',
    color: '#1ABC9C',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Entity', type: 'data', dataType: 'entity', isInput: true },
      { label: 'Value', type: 'data', dataType: 'any', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { property: 'canBeMeleed' },
    tags: ['entity.e', 'ServerEntityStruct', 'ClientEntityStruct', 'entity property', 'script struct', 'context-aware'],
  },

  // npc.ai.* (ServerAIStruct) - Server only, no client equivalent
  {
    type: 'npc-get-property',
    category: 'entity-props',
    label: 'NPC: Get AI Property',
    description: 'Get a property from npc.ai (ServerAIStruct). Access AI/NPC script data like titanSettings, crawling, killCount, etc. Server only - no client equivalent exists.',
    color: '#2ECC71',
    inputs: [
      { label: 'NPC', type: 'data', dataType: 'entity', isInput: true },
    ],
    outputs: [
      { label: 'Value', type: 'data', dataType: 'any', isInput: false },
    ],
    defaultData: { property: 'killCount' },
    serverOnly: true,
    tags: ['npc.ai', 'ServerAIStruct', 'ai property', 'npc data', 'server', 'script struct'],
  },
  {
    type: 'npc-set-property',
    category: 'entity-props',
    label: 'NPC: Set AI Property',
    description: 'Set a property on npc.ai (ServerAIStruct). Modify AI/NPC script data. Server only - no client equivalent exists.',
    color: '#2ECC71',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'NPC', type: 'data', dataType: 'entity', isInput: true },
      { label: 'Value', type: 'data', dataType: 'any', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { property: 'buddhaMode' },
    serverOnly: true,
    tags: ['npc.ai', 'ServerAIStruct', 'ai property', 'npc data', 'server', 'script struct'],
  },

  // weapon.w.* (ServerWeaponStruct / ClientWeaponStruct)
  {
    type: 'weapon-get-struct-property',
    category: 'entity-props',
    label: 'Weapon: Get Property',
    description: 'Get a property from weapon.w (ServerWeaponStruct or ClientWeaponStruct). Automatically adapts to the context based on which init node this graph is connected to.',
    color: '#E67E22',
    inputs: [
      { label: 'Weapon', type: 'data', dataType: 'entity', isInput: true },
    ],
    outputs: [
      { label: 'Value', type: 'data', dataType: 'any', isInput: false },
    ],
    defaultData: { property: 'lastFireTime' },
    tags: ['weapon.w', 'ServerWeaponStruct', 'ClientWeaponStruct', 'weapon property', 'script struct', 'context-aware'],
  },
  {
    type: 'weapon-set-struct-property',
    category: 'entity-props',
    label: 'Weapon: Set Property',
    description: 'Set a property on weapon.w (ServerWeaponStruct or ClientWeaponStruct). Automatically adapts to the context based on which init node this graph is connected to.',
    color: '#E67E22',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Weapon', type: 'data', dataType: 'entity', isInput: true },
      { label: 'Value', type: 'data', dataType: 'any', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { property: 'wasCharged' },
    tags: ['weapon.w', 'ServerWeaponStruct', 'ClientWeaponStruct', 'weapon property', 'script struct', 'context-aware'],
  },

  // projectile.proj.* (ServerProjectileStruct / ClientProjectileStruct)
  {
    type: 'projectile-get-property',
    category: 'entity-props',
    label: 'Projectile: Get Property',
    description: 'Get a property from projectile.proj (ServerProjectileStruct or ClientProjectileStruct). Automatically adapts to the context based on which init node this graph is connected to.',
    color: '#9B59B6',
    inputs: [
      { label: 'Projectile', type: 'data', dataType: 'entity', isInput: true },
    ],
    outputs: [
      { label: 'Value', type: 'data', dataType: 'any', isInput: false },
    ],
    defaultData: { property: 'damageScale' },
    tags: ['projectile.proj', 'ServerProjectileStruct', 'ClientProjectileStruct', 'projectile property', 'script struct', 'context-aware'],
  },
  {
    type: 'projectile-set-property',
    category: 'entity-props',
    label: 'Projectile: Set Property',
    description: 'Set a property on projectile.proj (ServerProjectileStruct or ClientProjectileStruct). Automatically adapts to the context based on which init node this graph is connected to.',
    color: '#9B59B6',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Projectile', type: 'data', dataType: 'entity', isInput: true },
      { label: 'Value', type: 'data', dataType: 'any', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { property: 'damageScale' },
    tags: ['projectile.proj', 'ServerProjectileStruct', 'ClientProjectileStruct', 'projectile property', 'script struct', 'context-aware'],
  },

  // soul.soul.* (ServerTitanSoulStruct / ClientTitanSoulStruct)
  {
    type: 'soul-get-property',
    category: 'entity-props',
    label: 'Soul: Get Property',
    description: 'Get a property from soul.soul (ServerTitanSoulStruct or ClientTitanSoulStruct). Automatically adapts to the context based on which init node this graph is connected to.',
    color: '#8E44AD',
    inputs: [
      { label: 'Soul', type: 'data', dataType: 'entity', isInput: true },
    ],
    outputs: [
      { label: 'Value', type: 'data', dataType: 'any', isInput: false },
    ],
    defaultData: { property: 'upgradeCount' },
    tags: ['soul.soul', 'ServerTitanSoulStruct', 'ClientTitanSoulStruct', 'soul property', 'titan soul', 'script struct', 'context-aware'],
  },
  {
    type: 'soul-set-property',
    category: 'entity-props',
    label: 'Soul: Set Property',
    description: 'Set a property on soul.soul (ServerTitanSoulStruct or ClientTitanSoulStruct). Automatically adapts to the context based on which init node this graph is connected to.',
    color: '#8E44AD',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Soul', type: 'data', dataType: 'entity', isInput: true },
      { label: 'Value', type: 'data', dataType: 'any', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { property: 'regensHealth' },
    tags: ['soul.soul', 'ServerTitanSoulStruct', 'ClientTitanSoulStruct', 'soul property', 'titan soul', 'script struct', 'context-aware'],
  },

  // ==================== WEAPONS ====================
  {
    type: 'get-active-weapon',
    category: 'weapons',
    label: 'GetActiveWeapon',
    description: 'Get player active weapon',
    color: '#E67E22',
    inputs: [
      { label: 'Player', type: 'data', dataType: 'player', isInput: true },
    ],
    outputs: [
      { label: 'Weapon', type: 'data', dataType: 'weapon', isInput: false },
    ],
    defaultData: {},
  },
  {
    type: 'get-weapon-owner',
    category: 'weapons',
    label: 'GetWeaponOwner',
    description: 'Get weapon owner player',
    color: '#E67E22',
    inputs: [
      { label: 'Weapon', type: 'data', dataType: 'weapon', isInput: true },
    ],
    outputs: [
      { label: 'Owner', type: 'data', dataType: 'player', isInput: false },
    ],
    defaultData: {},
  },
  {
    type: 'get-weapon-class-name',
    category: 'weapons',
    label: 'GetWeaponClassName',
    description: 'Get weapon class name',
    color: '#E67E22',
    inputs: [
      { label: 'Weapon', type: 'data', dataType: 'weapon', isInput: true },
    ],
    outputs: [
      { label: 'ClassName', type: 'data', dataType: 'string', isInput: false },
    ],
    defaultData: {},
  },
  {
    type: 'register-mod-weapon',
    category: 'weapons',
    label: 'RegisterModWeapon',
    description: 'Register custom weapon data',
    color: '#E67E22',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'ClassName', type: 'data', dataType: 'string', isInput: true },
      { label: 'Name', type: 'data', dataType: 'string', isInput: true },
      { label: 'HudIcon', type: 'data', dataType: 'asset', isInput: true },
      { label: 'WeaponType', type: 'data', dataType: 'string', isInput: true },
      { label: 'PickupSound1p', type: 'data', dataType: 'string', isInput: true },
      { label: 'PickupSound3p', type: 'data', dataType: 'string', isInput: true },
      { label: 'Tier', type: 'data', dataType: 'number', isInput: true },
      { label: 'BaseMods', type: 'data', dataType: 'array', isInput: true },
      { label: 'SupportedAttachments', type: 'data', dataType: 'array', isInput: true },
      { label: 'LowWeaponChance', type: 'data', dataType: 'number', isInput: true },
      { label: 'MedWeaponChance', type: 'data', dataType: 'number', isInput: true },
      { label: 'HighWeaponChance', type: 'data', dataType: 'number', isInput: true },
      { label: 'RegisterInLoot', type: 'data', dataType: 'boolean', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: {
      className: 'mp_weapon_custom',
      name: 'Custom Weapon',
      hudIcon: '"$\"\""',
      weaponType: 'assault',
      pickupSound1p: 'survival_loot_pickup_weapon_rspn101',
      pickupSound3p: 'survival_loot_pickup_3p_weapon_rspn101',
      tier: 1,
      baseMods: [],
      supportedAttachments: [],
      lowWeaponChance: 0.0,
      medWeaponChance: 0.0,
      highWeaponChance: 0.0,
      registerInLoot: true,
    },
  },
  {
    type: 'give-weapon',
    category: 'weapons',
    label: 'GiveWeapon',
    description: 'Give a weapon to a player',
    color: '#E67E22',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Player', type: 'data', dataType: 'player', isInput: true },
      { label: 'WeaponClass', type: 'data', dataType: 'string', isInput: true },
      { label: 'Slot', type: 'data', dataType: 'int', isInput: true },
      { label: 'Mods', type: 'data', dataType: 'array', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
      { label: 'Weapon', type: 'data', dataType: 'weapon', isInput: false },
    ],
    defaultData: { weaponClass: 'mp_weapon_r97', mods: [], slot: 'WEAPON_INVENTORY_SLOT_PRIMARY_0' },
    documentation: {
      longDescription: 'Gives a weapon to a player. The weapon is added to their inventory and can be accessed later. You can specify weapon mods to attach. Returns the created weapon entity.',
      codeExample: `// Give basic weapon
giveWeapon( player, "mp_weapon_r97" )

// Give weapon with mods
array mods = ["extended_mag_lvl1", "hipfire_lvl1"]
entity weapon = GiveWeapon( player, "mp_weapon_alternator", mods )

// Give and auto-switch
GiveWeapon( player, "mp_weapon_shotgun" )
wait 0.1
SwitchToWeapon( player, "mp_weapon_shotgun" )

// Give to all players
foreach ( entity p in GetPlayerArray() )
{
    GiveWeapon( p, "mp_weapon_p2020" )
}`,
      tips: [
        'Weapon is added to inventory',
        'Mods array contains mod names as strings',
        'Returns weapon entity for further customization',
        'Use WEAPON_INVENTORY_SLOT constants for slots'
      ],
      useCases: [
        'Loadout assignment',
        'Weapon pickups',
        'Loadout customization',
        'Loadout presets'
      ],
      relatedNodes: ['take-weapon', 'switch-to-weapon', 'get-active-weapon']
    }
  },
  {
    type: 'take-weapon',
    category: 'weapons',
    label: 'TakeWeapon',
    description: 'Take weapon from player',
    color: '#E67E22',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Player', type: 'data', dataType: 'player', isInput: true },
      { label: 'WeaponClass', type: 'data', dataType: 'string', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { weaponClass: 'mp_weapon_r97' },
  },
  {
    type: 'take-all-weapons',
    category: 'weapons',
    label: 'TakeAllWeapons',
    description: 'Take all weapons from player',
    color: '#E67E22',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Player', type: 'data', dataType: 'player', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: {},
  },
  {
    type: 'switch-to-weapon',
    category: 'weapons',
    label: 'SwitchToWeapon',
    description: 'Switch player to weapon',
    color: '#E67E22',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Player', type: 'data', dataType: 'player', isInput: true },
      { label: 'Weapon', type: 'data', dataType: 'weapon', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: {},
  },
  {
    type: 'weapon-has-mod',
    category: 'weapons',
    label: 'HasMod',
    description: 'Check if weapon has mod',
    color: '#E67E22',
    inputs: [
      { label: 'Weapon', type: 'data', dataType: 'weapon', isInput: true },
      { label: 'ModName', type: 'data', dataType: 'string', isInput: true },
    ],
    outputs: [
      { label: 'HasMod', type: 'data', dataType: 'boolean', isInput: false },
    ],
    defaultData: { modName: 'burn_mod_titan' },
  },
  {
    type: 'weapon-add-mod',
    category: 'weapons',
    label: 'AddMod',
    description: 'Add mod to weapon',
    color: '#E67E22',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Weapon', type: 'data', dataType: 'weapon', isInput: true },
      { label: 'ModName', type: 'data', dataType: 'string', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { modName: 'burn_mod_titan' },
  },
  {
    type: 'weapon-remove-mod',
    category: 'weapons',
    label: 'RemoveMod',
    description: 'Remove mod from weapon',
    color: '#E67E22',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Weapon', type: 'data', dataType: 'weapon', isInput: true },
      { label: 'ModName', type: 'data', dataType: 'string', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { modName: 'burn_mod_titan' },
  },
  {
    type: 'weapon-set-mods',
    category: 'weapons',
    label: 'SetMods',
    description: 'Set weapon mods',
    color: '#E67E22',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Weapon', type: 'data', dataType: 'weapon', isInput: true },
      { label: 'Mods', type: 'data', dataType: 'array', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { mods: [] },
  },
  {
    type: 'get-weapon-setting-int',
    category: 'weapons',
    label: 'GetWeaponSettingInt',
    description: 'Get weapon int setting',
    color: '#E67E22',
    inputs: [
      { label: 'Weapon', type: 'data', dataType: 'weapon', isInput: true },
      { label: 'Setting', type: 'data', dataType: 'string', isInput: true },
    ],
    outputs: [
      { label: 'Value', type: 'data', dataType: 'number', isInput: false },
    ],
    defaultData: { setting: 'ammo_clip_size' },
  },
  {
    type: 'get-weapon-setting-float',
    category: 'weapons',
    label: 'GetWeaponSettingFloat',
    description: 'Get weapon float setting',
    color: '#E67E22',
    inputs: [
      { label: 'Weapon', type: 'data', dataType: 'weapon', isInput: true },
      { label: 'Setting', type: 'data', dataType: 'string', isInput: true },
    ],
    outputs: [
      { label: 'Value', type: 'data', dataType: 'number', isInput: false },
    ],
    defaultData: { setting: 'fire_rate' },
  },
  {
    type: 'get-weapon-setting-bool',
    category: 'weapons',
    label: 'GetWeaponSettingBool',
    description: 'Get weapon bool setting',
    color: '#E67E22',
    inputs: [
      { label: 'Weapon', type: 'data', dataType: 'weapon', isInput: true },
      { label: 'Setting', type: 'data', dataType: 'string', isInput: true },
    ],
    outputs: [
      { label: 'Value', type: 'data', dataType: 'boolean', isInput: false },
    ],
    defaultData: { setting: 'is_semi_auto' },
  },
  {
    type: 'get-weapon-setting-string',
    category: 'weapons',
    label: 'GetWeaponSettingString',
    description: 'Get weapon string setting',
    color: '#E67E22',
    inputs: [
      { label: 'Weapon', type: 'data', dataType: 'weapon', isInput: true },
      { label: 'Setting', type: 'data', dataType: 'string', isInput: true },
    ],
    outputs: [
      { label: 'Value', type: 'data', dataType: 'string', isInput: false },
    ],
    defaultData: { setting: 'printname' },
  },
  {
    type: 'get-weapon-ammo',
    category: 'weapons',
    label: 'GetWeaponAmmo',
    description: 'Get weapon ammo count',
    color: '#E67E22',
    inputs: [
      { label: 'Weapon', type: 'data', dataType: 'weapon', isInput: true },
    ],
    outputs: [
      { label: 'Ammo', type: 'data', dataType: 'number', isInput: false },
    ],
    defaultData: {},
  },
  {
    type: 'set-weapon-ammo',
    category: 'weapons',
    label: 'SetWeaponAmmo',
    description: 'Set weapon ammo count',
    color: '#E67E22',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Weapon', type: 'data', dataType: 'weapon', isInput: true },
      { label: 'Ammo', type: 'data', dataType: 'number', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { ammo: 999 },
  },
  {
    type: 'get-weapon-clip',
    category: 'weapons',
    label: 'GetWeaponClip',
    description: 'Get weapon clip count',
    color: '#E67E22',
    inputs: [
      { label: 'Weapon', type: 'data', dataType: 'weapon', isInput: true },
    ],
    outputs: [
      { label: 'Clip', type: 'data', dataType: 'number', isInput: false },
    ],
    defaultData: {},
  },
  {
    type: 'set-weapon-clip',
    category: 'weapons',
    label: 'SetWeaponClip',
    description: 'Set weapon clip count',
    color: '#E67E22',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Weapon', type: 'data', dataType: 'weapon', isInput: true },
      { label: 'Clip', type: 'data', dataType: 'number', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { clip: 30 },
  },
  {
    type: 'set-weapon-burst-fire-count',
    category: 'weapons',
    label: 'SetBurstFireCount',
    description: 'Set weapon burst fire count',
    color: '#E67E22',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Weapon', type: 'data', dataType: 'weapon', isInput: true },
      { label: 'Count', type: 'data', dataType: 'number', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { count: 3 },
  },
  {
    type: 'weapon-emit-sound-1p3p',
    category: 'weapons',
    label: 'EmitWeaponSound_1p3p',
    description: 'Emit weapon sound (1st/3rd person)',
    color: '#E67E22',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Weapon', type: 'data', dataType: 'weapon', isInput: true },
      { label: 'Sound1p', type: 'data', dataType: 'string', isInput: true },
      { label: 'Sound3p', type: 'data', dataType: 'string', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { sound1p: 'weapon_sound_1p', sound3p: 'weapon_sound_3p' },
  },
  {
    type: 'fire-weapon-bullet',
    category: 'weapons',
    label: 'FireWeaponBullet',
    description: 'Fire weapon bullet',
    color: '#E67E22',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Weapon', type: 'data', dataType: 'weapon', isInput: true },
      { label: 'Origin', type: 'data', dataType: 'vector', isInput: true },
      { label: 'Direction', type: 'data', dataType: 'vector', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: {},
    serverOnly: true,
  },
  {
    type: 'fire-weapon-bolt',
    category: 'weapons',
    label: 'FireWeaponBolt',
    description: 'Fire weapon bolt projectile',
    color: '#E67E22',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Weapon', type: 'data', dataType: 'weapon', isInput: true },
      { label: 'Origin', type: 'data', dataType: 'vector', isInput: true },
      { label: 'Direction', type: 'data', dataType: 'vector', isInput: true },
      { label: 'Speed', type: 'data', dataType: 'number', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
      { label: 'Projectile', type: 'data', dataType: 'entity', isInput: false },
    ],
    defaultData: { speed: 2500 },
    serverOnly: true,
  },
  {
    type: 'fire-weapon-grenade',
    category: 'weapons',
    label: 'FireWeaponGrenade',
    description: 'Fire weapon grenade',
    color: '#E67E22',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Weapon', type: 'data', dataType: 'weapon', isInput: true },
      { label: 'Origin', type: 'data', dataType: 'vector', isInput: true },
      { label: 'Velocity', type: 'data', dataType: 'vector', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
      { label: 'Grenade', type: 'data', dataType: 'entity', isInput: false },
    ],
    defaultData: {},
    serverOnly: true,
  },

  // ==================== STATUS EFFECTS ====================
  {
    type: 'status-effect-add',
    category: 'status-effects',
    label: 'StatusEffect_AddEndless',
    description: 'Add an endless status effect to an entity (SERVER)',
    color: '#9B59B6',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Entity', type: 'data', dataType: 'entity', isInput: true },
      { label: 'EffectID', type: 'data', dataType: 'number', isInput: true },
      { label: 'Severity', type: 'data', dataType: 'number', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
      { label: 'Handle', type: 'data', dataType: 'number', isInput: false },
    ],
    defaultData: { effectID: 0, severity: 1.0 },
    serverOnly: true,
    documentation: {
      longDescription: 'Applies an endless status effect to an entity. The effect persists until explicitly stopped with StatusEffect_Stop. Common effects include invulnerable, slowed, blind, and more. Severity controls the effect intensity.',
      codeExample: `// Make player invulnerable
StatusEffect_AddEndless( player, eStatusEffect.invulnerable, 1.0 )

// Apply slow effect
StatusEffect_AddEndless( enemy, eStatusEffect.slowed, 0.5 )

// Later stop the effect
StatusEffect_Stop( player, handle )

// Or stop all of a type
StatusEffect_StopAllOfType( player, eStatusEffect.invulnerable )`,
      tips: [
        'Effect continues until explicitly stopped',
        'Save handle to stop specific effect',
        'Use StatusEffect_StopAll to clear all',
        'Common effects: invulnerable, slowed, blind, ghost'
      ],
      useCases: [
        'Spawn protection',
        'Ability debuffs',
        'Buff mechanics',
        'Status immunity'
      ],
      relatedNodes: ['status-effect-stop', 'status-effect-stop-all', 'status-effect-has']
    }
  },
  {
    type: 'status-effect-stop',
    category: 'status-effects',
    label: 'StatusEffect_Stop',
    description: 'Stop a specific status effect by handle (SERVER)',
    color: '#9B59B6',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Entity', type: 'data', dataType: 'entity', isInput: true },
      { label: 'Handle', type: 'data', dataType: 'number', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: {},
    serverOnly: true,
    documentation: {
      longDescription: 'Stops a specific status effect that was previously applied. The handle must match the one returned when the effect was added. Use this to end temporary buffs or debuffs.',
      codeExample: `// Apply temporary invincibility
int handle = StatusEffect_AddEndless( player, eStatusEffect.invulnerable, 1.0 )

// Lasts for 5 seconds
wait 5.0

// Stop it specifically
StatusEffect_Stop( player, handle )

// Or stop all effects
StatusEffect_StopAll( player )`,
      tips: [
        'Handle comes from AddEndless/AddTimed',
        'Only stops the specific effect',
        'Use StopAllOfType for all effects of a type',
        'Use StopAll to clear everything'
      ],
      useCases: [
        'Buff expiration',
        'Debuff removal',
        'Cooldown completion',
        'Cleanup on death'
      ],
      relatedNodes: ['status-effect-add', 'status-effect-stop-all', 'status-effect-stop-all-of-type']
    }
  },
  {
    type: 'status-effect-stop-all-of-type',
    category: 'status-effects',
    label: 'StatusEffect_StopAllOfType',
    description: 'Stop all status effects of type',
    color: '#9B59B6',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Entity', type: 'data', dataType: 'entity', isInput: true },
      { label: 'EffectID', type: 'data', dataType: 'number', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { effectID: 0 },
    serverOnly: true,
  },
  {
    type: 'status-effect-get',
    category: 'status-effects',
    label: 'StatusEffect_Get',
    description: 'Get status effect severity',
    color: '#9B59B6',
    inputs: [
      { label: 'Entity', type: 'data', dataType: 'entity', isInput: true },
      { label: 'EffectID', type: 'data', dataType: 'number', isInput: true },
    ],
    outputs: [
      { label: 'Severity', type: 'data', dataType: 'number', isInput: false },
    ],
    defaultData: { effectID: 0 },
  },
  {
    type: 'status-effect-has',
    category: 'status-effects',
    label: 'StatusEffect_Has',
    description: 'Check if entity has status effect',
    color: '#9B59B6',
    inputs: [
      { label: 'Entity', type: 'data', dataType: 'entity', isInput: true },
      { label: 'EffectID', type: 'data', dataType: 'number', isInput: true },
    ],
    outputs: [
      { label: 'HasEffect', type: 'data', dataType: 'boolean', isInput: false },
    ],
    defaultData: { effectID: 0 },
  },
  {
    type: 'status-effect-stim',
    category: 'status-effects',
    label: 'Stim',
    description: 'Apply stim effect',
    color: '#9B59B6',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Entity', type: 'data', dataType: 'entity', isInput: true },
      { label: 'Duration', type: 'data', dataType: 'number', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { duration: 5.0 },
    serverOnly: true,
  },
  {
    type: 'status-effect-cloak',
    category: 'status-effects',
    label: 'Cloak',
    description: 'Apply cloak/invisibility effect',
    color: '#9B59B6',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Entity', type: 'data', dataType: 'entity', isInput: true },
      { label: 'Duration', type: 'data', dataType: 'number', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { duration: 5.0 },
    serverOnly: true,
  },
  {
    type: 'status-effect-phase',
    category: 'status-effects',
    label: 'PhaseShift',
    description: 'Apply phase shift effect',
    color: '#9B59B6',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Entity', type: 'data', dataType: 'entity', isInput: true },
      { label: 'Duration', type: 'data', dataType: 'number', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { duration: 3.0 },
    serverOnly: true,
  },
  {
    type: 'status-effect-slow',
    category: 'status-effects',
    label: 'Slow',
    description: 'Apply slow effect',
    color: '#9B59B6',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Entity', type: 'data', dataType: 'entity', isInput: true },
      { label: 'Duration', type: 'data', dataType: 'number', isInput: true },
      { label: 'Severity', type: 'data', dataType: 'number', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { duration: 3.0, severity: 0.5 },
    serverOnly: true,
  },
  {
    type: 'status-effect-speed-boost',
    category: 'status-effects',
    label: 'SpeedBoost',
    description: 'Apply speed boost effect',
    color: '#9B59B6',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Entity', type: 'data', dataType: 'entity', isInput: true },
      { label: 'Duration', type: 'data', dataType: 'number', isInput: true },
      { label: 'Multiplier', type: 'data', dataType: 'number', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { duration: 5.0, multiplier: 1.5 },
    serverOnly: true,
  },
  {
    type: 'status-effect-add-timed',
    category: 'status-effects',
    label: 'StatusEffect_AddTimed',
    description: 'Add timed status effect to entity with duration',
    color: '#9B59B6',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Entity', type: 'data', dataType: 'entity', isInput: true },
      { label: 'EffectID', type: 'data', dataType: 'number', isInput: true },
      { label: 'Severity', type: 'data', dataType: 'number', isInput: true },
      { label: 'Duration', type: 'data', dataType: 'number', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
      { label: 'Handle', type: 'data', dataType: 'number', isInput: false },
    ],
    defaultData: { effectID: 0, severity: 1.0, duration: 5.0 },
    serverOnly: true,
  },
  {
    type: 'status-effect-has-severity',
    category: 'status-effects',
    label: 'StatusEffect_HasSeverity',
    description: 'Check if entity has status effect with minimum severity',
    color: '#9B59B6',
    inputs: [
      { label: 'Entity', type: 'data', dataType: 'entity', isInput: true },
      { label: 'EffectID', type: 'data', dataType: 'number', isInput: true },
      { label: 'MinSeverity', type: 'data', dataType: 'number', isInput: true },
    ],
    outputs: [
      { label: 'HasEffect', type: 'data', dataType: 'boolean', isInput: false },
    ],
    defaultData: { effectID: 0, minSeverity: 1.0 },
  },
  {
    type: 'status-effect-get-severity',
    category: 'status-effects',
    label: 'StatusEffect_GetSeverity',
    description: 'Get severity level of a status effect',
    color: '#9B59B6',
    inputs: [
      { label: 'Entity', type: 'data', dataType: 'entity', isInput: true },
      { label: 'EffectID', type: 'data', dataType: 'number', isInput: true },
    ],
    outputs: [
      { label: 'Severity', type: 'data', dataType: 'number', isInput: false },
    ],
    defaultData: { effectID: 0 },
  },
  {
    type: 'status-effect-stop-all',
    category: 'status-effects',
    label: 'StatusEffect_StopAll',
    description: 'Stop all status effects on entity',
    color: '#9B59B6',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Entity', type: 'data', dataType: 'entity', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: {},
    serverOnly: true,
  },

  // ==================== PARTICLES ====================
  {
    type: 'precache-particle',
    category: 'utilities',
    label: 'PrecacheParticleSystem',
    description: 'Precache particle system',
    color: '#F39C12',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Asset', type: 'data', dataType: 'asset', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { asset: '$"" ' },
  },
  {
    type: 'start-particle-on-entity',
    category: 'vfx',
    label: 'StartParticleEffectOnEntity',
    description: 'Start a particle effect attached to an entity',
    color: '#F39C12',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Entity', type: 'data', dataType: 'entity', isInput: true },
      { label: 'Asset', type: 'data', dataType: 'asset', isInput: true },
      { label: 'Attachment', type: 'data', dataType: 'string', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
      { label: 'Handle', type: 'data', dataType: 'number', isInput: false },
    ],
    defaultData: { asset: '$""', attachment: '' },
    documentation: {
      longDescription: 'Spawns a particle effect that follows an entity. The effect can be attached to a specific attachment point (bone) or play at the entity\'s origin. Use the handle to later stop the effect.',
      codeExample: `// Play effect on entity
entity player = GetPlayerByIndex( 0 )

// At origin
StartParticleEffectOnEntity( player, $"P_wing_loop" )

// At specific attachment (bone)
StartParticleEffectOnEntity( player, $"P_glow_loop", "CHESTFOCUS" )

// Later stop with handle
int handle = StartParticleEffectOnEntity( player, effect )
wait 5.0
EffectStop( handle, true )`,
      tips: [
        'Effect follows entity as it moves',
        'Use empty attachment for origin',
        'Save handle to stop effect later',
        'Common attachments: CHESTFOCUS, HEAD, L_FOOT, R_FOOT'
      ],
      useCases: [
        'Character glow effects',
        'Weapon trails',
        'Ability visual feedback',
        'Status indicators'
      ],
      relatedNodes: ['stop-particle', 'set-particle-control-point', 'play-fx-on-entity']
    }
  },
  {
    type: 'start-particle-effect-in-world',
    category: 'vfx',
    label: 'StartParticleEffectInWorld',
    description: 'Start particle at world position',
    color: '#F39C12',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Asset', type: 'data', dataType: 'asset', isInput: true },
      { label: 'Origin', type: 'data', dataType: 'vector', isInput: true },
      { label: 'Angles', type: 'data', dataType: 'vector', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
      { label: 'Handle', type: 'data', dataType: 'number', isInput: false },
    ],
    defaultData: { asset: '$""' },
  },
  {
    type: 'stop-particle',
    category: 'vfx',
    label: 'EffectStop',
    description: 'Stop a particle effect using its handle',
    color: '#F39C12',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Handle', type: 'data', dataType: 'number', isInput: true },
      { label: 'StopImmediately', type: 'data', dataType: 'boolean', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { stopImmediately: false },
    documentation: {
      longDescription: 'Stops a playing particle effect. The handle must have been returned from StartParticleEffectOnEntity or StartParticleEffectInWorld. Use StopImmediately=true to kill the effect instantly, or false to let it finish its loop.',
      codeExample: `// Start effect and get handle
int handle = StartParticleEffectOnEntity( player, $"P_glow_loop" )

// Stop after delay
wait 5.0

// Graceful stop (finish current loop)
EffectStop( handle, false )

// Or immediate kill
EffectStop( handle, true )`,
      tips: [
        'Handle comes from start particle nodes',
        'false = let current loop finish',
        'true = immediate kill',
        'Use EffectStopAllOnEntity to stop all'
      ],
      useCases: [
        'Ending temporary effects',
        'Cleanup on entity death',
        'Ability cooldown visuals',
        'Timer-based effects'
      ],
      relatedNodes: ['start-particle-on-entity', 'start-particle-effect-in-world', 'effect-stop-all-on-entity']
    }
  },
  {
    type: 'effect-stop-all-on-entity',
    category: 'vfx',
    label: 'EffectStopAllOnEntity',
    description: 'Stop all effects on entity',
    color: '#F39C12',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Entity', type: 'data', dataType: 'entity', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: {},
  },
  {
    type: 'set-particle-control-point',
    category: 'vfx',
    label: 'SetControlPoint',
    description: 'Set particle control point',
    color: '#F39C12',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Handle', type: 'data', dataType: 'number', isInput: true },
      { label: 'Index', type: 'data', dataType: 'number', isInput: true },
      { label: 'Value', type: 'data', dataType: 'vector', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { index: 0 },
  },
  {
    type: 'play-fx-on-entity',
    category: 'vfx',
    label: 'PlayFXOnEntity',
    description: 'Play FX on entity',
    color: '#F39C12',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Entity', type: 'data', dataType: 'entity', isInput: true },
      { label: 'Asset', type: 'data', dataType: 'asset', isInput: true },
      { label: 'Tag', type: 'data', dataType: 'string', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
      { label: 'Handle', type: 'data', dataType: 'number', isInput: false },
    ],
    defaultData: { asset: '$""', tag: '' },
  },

  // ==================== AUDIO ====================
  {
    type: 'emit-sound-on-entity',
    category: 'audio',
    label: 'EmitSoundOnEntity',
    description: 'Play sound on entity',
    color: '#1ABC9C',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Entity', type: 'data', dataType: 'entity', isInput: true },
      { label: 'Sound', type: 'data', dataType: 'string', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { sound: 'sound_name' },
  },
  {
    type: 'emit-sound-at-position',
    category: 'audio',
    label: 'EmitSoundAtPosition',
    description: 'Play sound at world position',
    color: '#1ABC9C',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Origin', type: 'data', dataType: 'vector', isInput: true },
      { label: 'Sound', type: 'data', dataType: 'string', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { sound: 'sound_name' },
  },
  {
    type: 'emit-weapon-npc-sound',
    category: 'audio',
    label: 'EmitWeaponNpcSound',
    description: 'Emit weapon NPC sound',
    color: '#1ABC9C',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Weapon', type: 'data', dataType: 'weapon', isInput: true },
      { label: 'SoundType', type: 'data', dataType: 'number', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { soundType: 0 },
  },
  {
    type: 'stop-sound-on-entity',
    category: 'audio',
    label: 'StopSoundOnEntity',
    description: 'Stop sound on entity',
    color: '#1ABC9C',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Entity', type: 'data', dataType: 'entity', isInput: true },
      { label: 'Sound', type: 'data', dataType: 'string', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { sound: 'sound_name' },
  },
  {
    type: 'play-sound-to-player',
    category: 'audio',
    label: 'PlaySoundToPlayer',
    description: 'Play sound to specific player',
    color: '#1ABC9C',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Player', type: 'data', dataType: 'player', isInput: true },
      { label: 'Sound', type: 'data', dataType: 'string', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { sound: 'sound_name' },
  },
  {
    type: 'fade-out-sound-on-entity',
    category: 'audio',
    label: 'FadeOutSoundOnEntity',
    description: 'Fade out sound on entity',
    color: '#1ABC9C',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Entity', type: 'data', dataType: 'entity', isInput: true },
      { label: 'Sound', type: 'data', dataType: 'string', isInput: true },
      { label: 'Duration', type: 'data', dataType: 'number', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { sound: 'sound_name', duration: 1.0 },
  },

  // ==================== DAMAGE ====================
  {
    type: 'radius-damage',
    category: 'damage',
    label: 'RadiusDamage',
    description: 'Deal damage to all entities within a radius (SERVER)',
    color: '#E74C3C',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Origin', type: 'data', dataType: 'vector', isInput: true },
      { label: 'Owner', type: 'data', dataType: 'entity', isInput: true },
      { label: 'Inflictor', type: 'data', dataType: 'entity', isInput: true },
      { label: 'Damage', type: 'data', dataType: 'number', isInput: true },
      { label: 'Radius', type: 'data', dataType: 'number', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { damage: 100, radius: 200 },
    serverOnly: true,
    documentation: {
      longDescription: 'Applies damage to all entities within the specified radius from the origin point. Used for explosions, grenades, and area-of-effect abilities. Both players and NPCs are affected.',
      codeExample: `// Grenade explosion
void function OnGrenadeDetonate( entity grenade )
{
    // Damage everyone nearby
    RadiusDamage(
        grenade.GetOrigin(),  // Center of explosion
        grenade.GetOwner(),   // Who gets credit for kills
        grenade,             // The grenade itself
        100,                 // 100 damage
        300                  // 300 unit radius
    )

    // Visual and audio effects
    PlayFXOnEntity( explosionFX, grenade, "" )
    EmitSoundAtPosition( grenade.GetOrigin(), "explosion_dist" )
    
    // Knockback
    ApplyKnockbackToNearby( grenade )
}`, 
      tips: [
        'Affects all entities in radius, including teammates',
        'Use friendly fire checks for team modes',
        'Radius is in game units (typically ~100-500)',
        'Damage falls off with distance'
      ],
      useCases: [
        'Grenade explosions',
        'AOE abilities',
        'Explosive barrels',
        'Environmental hazards'
      ],
      relatedNodes: ['entity-take-damage', 'play-fx-on-entity', 'emit-sound-at-position']
    }
  },
  {
    type: 'entity-take-damage',
    category: 'damage',
    label: 'TakeDamage',
    description: 'Make an entity take damage (SERVER)',
    color: '#E74C3C',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Entity', type: 'data', dataType: 'entity', isInput: true },
      { label: 'Attacker', type: 'data', dataType: 'entity', isInput: true },
      { label: 'Inflictor', type: 'data', dataType: 'entity', isInput: true },
      { label: 'Damage', type: 'data', dataType: 'number', isInput: true },
      { label: 'DamageType', type: 'data', dataType: 'number', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { damage: 100, damageType: 0 },
    serverOnly: true,
    documentation: {
      longDescription: 'Applies damage to a specific entity. The damage will trigger death callbacks, score events, and any damage handlers. Use DamageType to specify how the damage should be categorized.',
      codeExample: `// Direct damage
entity target = GetEntByScriptName( "enemy_npc" )
entity player = GetPlayerByIndex( 0 )

// Deal 50 damage
TakeDamage(
    target,           // Entity to damage
    player,           // Attacker (gets credit)
    player.GetActiveWeapon(),  // Inflictor
    50,               // Damage amount
    DF_BULLET         // Damage type
)

// Check if killed
if ( !IsAlive( target ) )
{
    print( "Target eliminated!" )
}

// Damage types: DF_BULLET, DF_EXPLOSION, DF_MELEE, etc.`,
      tips: [
        'Attacker gets credit for kills',
        'DamageType affects death animations',
        'Triggers OnDamage and OnKilled callbacks',
        'Use DamageInfo nodes for more control'
      ],
      useCases: [
        'Direct damage abilities',
        'Environmental damage',
        'Trap damage',
        'Custom damage sources'
      ],
      relatedNodes: ['radius-damage', 'on-damage', 'on-killed', 'damageinfo-set-damage']
    }
  },
  {
    type: 'trace-line',
    category: 'debug',
    label: 'TraceLine',
    description: 'Trace a line between two points and return hit information',
    color: '#27AE60',
    inputs: [
      { label: 'Start', type: 'data', dataType: 'vector', isInput: true },
      { label: 'End', type: 'data', dataType: 'vector', isInput: true },
      { label: 'Ignore', type: 'data', dataType: 'entity', isInput: true },
      { label: 'TraceMask', type: 'data', dataType: 'number', isInput: true },
      { label: 'CollisionGroup', type: 'data', dataType: 'number', isInput: true },
    ],
    outputs: [
      { label: 'Result', type: 'data', dataType: 'table', isInput: false },
      { label: 'HitEnt', type: 'data', dataType: 'entity', isInput: false },
      { label: 'EndPos', type: 'data', dataType: 'vector', isInput: false },
      { label: 'SurfaceNormal', type: 'data', dataType: 'vector', isInput: false },
      { label: 'Fraction', type: 'data', dataType: 'number', isInput: false },
    ],
    defaultData: { traceMask: 'TRACE_MASK_SHOT', collisionGroup: 'TRACE_COLLISION_GROUP_NONE' },
    documentation: {
      longDescription: 'Shoots a ray from Start to End and returns what it hit. Used for line-of-sight checks, shooting mechanics, and collision detection. Fraction indicates how far the trace went (0-1, where 1=reached end).',
      codeExample: `// Line of sight check
entity player = GetPlayerByIndex( 0 )
vector eyePos = player.GetEyePosition()
vector targetPos = enemy.GetOrigin()

TraceLineResults result = TraceLine( eyePos, targetPos, null, TRACE_MASK_SHOT, TRACE_COLLISION_GROUP_NONE )

if ( result.hitEnt == enemy )
{
    // Clear line of sight!
    FireWeapon( player, target )
}

// Distance check
vector start = <0, 0, 0>
vector end = <1000, 0, 0>
TraceLine( start, end, null, TRACE_MASK_VISIBLE, TRACE_COLLISION_GROUP_NONE )

if ( result.fraction < 1.0 )
{
    print( "Hit something at: " + result.endPos )
}`, 
      tips: [
        'Fraction < 1.0 means something was hit',
        'HitEnt is null if nothing hit',
        'Common masks: TRACE_MASK_SHOT, TRACE_MASK_VISIBLE',
        'EyePosition is best for shooting raycasts'
      ],
      useCases: [
        'Line of sight checks',
        'Shooting mechanics',
        'Wall detection',
        'Distance calculations'
      ],
      relatedNodes: ['trace-hull', 'get-eye-position', 'fire-weapon-bullet']
    }
  },
  {
    type: 'trace-hull',
    category: 'debug',
    label: 'TraceHull',
    description: 'Trace a hull (box) between two points and return hit info',
    color: '#27AE60',
    inputs: [
      { label: 'Start', type: 'data', dataType: 'vector', isInput: true },
      { label: 'End', type: 'data', dataType: 'vector', isInput: true },
      { label: 'Mins', type: 'data', dataType: 'vector', isInput: true },
      { label: 'Maxs', type: 'data', dataType: 'vector', isInput: true },
      { label: 'Ignore', type: 'data', dataType: 'entity', isInput: true },
      { label: 'TraceMask', type: 'data', dataType: 'number', isInput: true },
      { label: 'CollisionGroup', type: 'data', dataType: 'number', isInput: true },
    ],
    outputs: [
      { label: 'Result', type: 'data', dataType: 'table', isInput: false },
      { label: 'HitEnt', type: 'data', dataType: 'entity', isInput: false },
      { label: 'EndPos', type: 'data', dataType: 'vector', isInput: false },
      { label: 'SurfaceNormal', type: 'data', dataType: 'vector', isInput: false },
      { label: 'Fraction', type: 'data', dataType: 'number', isInput: false },
    ],
    defaultData: { mins: '<-16, -16, 0>', maxs: '<16, 16, 72>', traceMask: 'TRACE_MASK_SHOT', collisionGroup: 'TRACE_COLLISION_GROUP_NONE' },
    documentation: {
      longDescription: 'Shoots a hull (axis-aligned box) from Start to End and returns what it hit. Unlike TraceLine which only checks a single point, TraceHull accounts for the size of the entity being traced, making it useful for checking if a player-sized object can fit through a space or if a movement would collide.',
      codeExample: `// Check if player can fit through a gap
vector mins = <-16, -16, 0>  // Player half-width
vector maxs = <16, 16, 72>   // Player height

vector startPos = player.GetOrigin()
vector endPos = <1000, 0, 0>  // Where player wants to go

TraceHullResults result = TraceHull( startPos, endPos, mins, maxs, null, TRACE_MASK_PLAYER, TRACE_COLLISION_GROUP_NONE )

if ( result.fraction >= 1.0 || result.hitEnt == null )
{
    // Path is clear!
    player.SetOrigin( endPos )
}
else
{
    // Hit something - don't move
    print( "Blocked by: " + result.hitEnt.GetClassName() )
}

// Check for wall penetration
vector traceStart = <0, 0, 100>
vector traceEnd = <1000, 0, 100>
TraceHull( traceStart, traceEnd, <-5, -5, -5>, <5, 5, 5>, null, TRACE_MASK_SHOT, TRACE_COLLISION_GROUP_NONE )`, 
      tips: [
        'Use player dimensions for player movement checks',
        'Mins/Maxs define the hull size (not from center)',
        'Fraction < 1.0 means the hull was blocked',
        'HitEnt is null if nothing was hit',
        'Great for collision detection and movement validation'
      ],
      useCases: [
        'Player movement collision checks',
        'Checking if entities fit through gaps',
        'Physics collision detection',
        'Wall penetration testing',
        'Movement validation'
      ],
      relatedNodes: ['trace-line', 'get-origin', 'set-origin', 'is-valid']
    }
  },
  {
    type: 'get-damage-source-identifier',
    category: 'damage',
    label: 'DamageInfo_GetDamageSourceIdentifier',
    description: 'Get damage source ID',
    color: '#E74C3C',
    inputs: [
      { label: 'DamageSource', type: 'data', dataType: 'string', isInput: true },
    ],
    outputs: [
      { label: 'ID', type: 'data', dataType: 'number', isInput: false },
    ],
    defaultData: { damageSource: 'damagedef_unknown' },
  },
  {
    type: 'damageinfo-set-damage',
    category: 'damage',
    label: 'DamageInfo_SetDamage',
    description: 'Set the damage amount on damageInfo',
    color: '#E74C3C',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'DamageInfo', type: 'data', dataType: 'any', isInput: true },
      { label: 'Damage', type: 'data', dataType: 'number', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { damage: 0 },
  },
  {
    type: 'damageinfo-get-damage',
    category: 'damage',
    label: 'DamageInfo_GetDamage',
    description: 'Get the damage amount from damageInfo',
    color: '#E74C3C',
    inputs: [
      { label: 'DamageInfo', type: 'data', dataType: 'any', isInput: true },
    ],
    outputs: [
      { label: 'Damage', type: 'data', dataType: 'number', isInput: false },
    ],
    defaultData: {},
  },
  {
    type: 'damageinfo-get-inflictor',
    category: 'damage',
    label: 'DamageInfo_GetInflictor',
    description: 'Get the inflictor entity from damageInfo',
    color: '#E74C3C',
    inputs: [
      { label: 'DamageInfo', type: 'data', dataType: 'any', isInput: true },
    ],
    outputs: [
      { label: 'Inflictor', type: 'data', dataType: 'entity', isInput: false },
    ],
    defaultData: {},
  },
  {
    type: 'damageinfo-set-damage-source-identifier',
    category: 'damage',
    label: 'DamageInfo_SetDamageSourceIdentifier',
    description: 'Set the damage source identifier on damageInfo',
    color: '#E74C3C',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'DamageInfo', type: 'data', dataType: 'any', isInput: true },
      { label: 'SourceID', type: 'data', dataType: 'number', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: {},
  },
  {
    type: 'damageinfo-get-custom-damage-type',
    category: 'damage',
    label: 'DamageInfo_GetCustomDamageType',
    description: 'Get the custom damage type flags from damageInfo',
    color: '#E74C3C',
    inputs: [
      { label: 'DamageInfo', type: 'data', dataType: 'any', isInput: true },
    ],
    outputs: [
      { label: 'DamageType', type: 'data', dataType: 'number', isInput: false },
    ],
    defaultData: {},
  },
  {
    type: 'damageinfo-add-custom-damage-type',
    category: 'damage',
    label: 'DamageInfo_AddCustomDamageType',
    description: 'Add custom damage type flags to damageInfo',
    color: '#E74C3C',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'DamageInfo', type: 'data', dataType: 'any', isInput: true },
      { label: 'DamageType', type: 'data', dataType: 'number', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { damageType: 0 },
  },
  {
    type: 'damageinfo-scale-damage',
    category: 'damage',
    label: 'DamageInfo_ScaleDamage',
    description: 'Scale the damage by a multiplier',
    color: '#E74C3C',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'DamageInfo', type: 'data', dataType: 'any', isInput: true },
      { label: 'Scale', type: 'data', dataType: 'number', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { scale: 1.0 },
  },
  {
    type: 'damageinfo-get-attacker',
    category: 'damage',
    label: 'DamageInfo_GetAttacker',
    description: 'Get the attacker entity from damageInfo',
    color: '#E74C3C',
    inputs: [
      { label: 'DamageInfo', type: 'data', dataType: 'any', isInput: true },
    ],
    outputs: [
      { label: 'Attacker', type: 'data', dataType: 'entity', isInput: false },
    ],
    defaultData: {},
  },
  {
    type: 'damageinfo-get-force-kill',
    category: 'damage',
    label: 'DamageInfo_GetForceKill',
    description: 'Check if damage should force kill',
    color: '#E74C3C',
    inputs: [
      { label: 'DamageInfo', type: 'data', dataType: 'any', isInput: true },
    ],
    outputs: [
      { label: 'ForceKill', type: 'data', dataType: 'boolean', isInput: false },
    ],
    defaultData: {},
  },
  {
    type: 'damageinfo-get-weapon',
    category: 'damage',
    label: 'DamageInfo_GetWeapon',
    description: 'Get the weapon entity from damageInfo',
    color: '#E74C3C',
    inputs: [
      { label: 'DamageInfo', type: 'data', dataType: 'any', isInput: true },
    ],
    outputs: [
      { label: 'Weapon', type: 'data', dataType: 'weapon', isInput: false },
    ],
    defaultData: {},
  },
  {
    type: 'damageinfo-print',
    category: 'damage',
    label: 'DamageInfo_Print',
    description: 'Print damageInfo to console for debugging',
    color: '#E74C3C',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'DamageInfo', type: 'data', dataType: 'any', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: {},
  },
  {
    type: 'damageinfo-get-critical-hit-scale',
    category: 'damage',
    label: 'DamageInfo_GetDamageCriticalHitScale',
    description: 'Get critical hit damage scale',
    color: '#E74C3C',
    inputs: [
      { label: 'DamageInfo', type: 'data', dataType: 'any', isInput: true },
    ],
    outputs: [
      { label: 'Scale', type: 'data', dataType: 'number', isInput: false },
    ],
    defaultData: {},
  },
  {
    type: 'damageinfo-get-shield-scale',
    category: 'damage',
    label: 'DamageInfo_GetDamageShieldScale',
    description: 'Get shield damage scale',
    color: '#E74C3C',
    inputs: [
      { label: 'DamageInfo', type: 'data', dataType: 'any', isInput: true },
    ],
    outputs: [
      { label: 'Scale', type: 'data', dataType: 'number', isInput: false },
    ],
    defaultData: {},
  },
  {
    type: 'damageinfo-get-damage-position',
    category: 'damage',
    label: 'DamageInfo_GetDamagePosition',
    description: 'Get the position where damage was dealt',
    color: '#E74C3C',
    inputs: [
      { label: 'DamageInfo', type: 'data', dataType: 'any', isInput: true },
    ],
    outputs: [
      { label: 'Position', type: 'data', dataType: 'vector', isInput: false },
    ],
    defaultData: {},
  },
  {
    type: 'damageinfo-get-hitgroup',
    category: 'damage',
    label: 'DamageInfo_GetHitGroup',
    description: 'Get the hit group (body part) that was hit',
    color: '#E74C3C',
    inputs: [
      { label: 'DamageInfo', type: 'data', dataType: 'any', isInput: true },
    ],
    outputs: [
      { label: 'HitGroup', type: 'data', dataType: 'number', isInput: false },
    ],
    defaultData: {},
  },
  {
    type: 'damageinfo-get-hitbox',
    category: 'damage',
    label: 'DamageInfo_GetHitBox',
    description: 'Get the hitbox index that was hit',
    color: '#E74C3C',
    inputs: [
      { label: 'DamageInfo', type: 'data', dataType: 'any', isInput: true },
    ],
    outputs: [
      { label: 'HitBox', type: 'data', dataType: 'number', isInput: false },
    ],
    defaultData: {},
  },
  {
    type: 'damageinfo-get-death-package',
    category: 'damage',
    label: 'DamageInfo_GetDeathPackage',
    description: 'Get the death package string',
    color: '#E74C3C',
    inputs: [
      { label: 'DamageInfo', type: 'data', dataType: 'any', isInput: true },
    ],
    outputs: [
      { label: 'DeathPackage', type: 'data', dataType: 'string', isInput: false },
    ],
    defaultData: {},
  },
  {
    type: 'damageinfo-set-death-package',
    category: 'damage',
    label: 'DamageInfo_SetDeathPackage',
    description: 'Set the death package for custom death animations',
    color: '#E74C3C',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'DamageInfo', type: 'data', dataType: 'any', isInput: true },
      { label: 'DeathPackage', type: 'data', dataType: 'string', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { deathPackage: 'instant' },
  },
  {
    type: 'damageinfo-get-viewpunch-multiplier',
    category: 'damage',
    label: 'DamageInfo_GetViewPunchMultiplier',
    description: 'Get the view punch multiplier',
    color: '#E74C3C',
    inputs: [
      { label: 'DamageInfo', type: 'data', dataType: 'any', isInput: true },
    ],
    outputs: [
      { label: 'Multiplier', type: 'data', dataType: 'number', isInput: false },
    ],
    defaultData: {},
  },
  {
    type: 'damageinfo-get-dist-from-attack-origin',
    category: 'damage',
    label: 'DamageInfo_GetDistFromAttackOrigin',
    description: 'Get distance from the attack origin',
    color: '#E74C3C',
    inputs: [
      { label: 'DamageInfo', type: 'data', dataType: 'any', isInput: true },
    ],
    outputs: [
      { label: 'Distance', type: 'data', dataType: 'number', isInput: false },
    ],
    defaultData: {},
  },
  {
    type: 'damageinfo-get-dist-from-explosion-center',
    category: 'damage',
    label: 'DamageInfo_GetDistFromExplosionCenter',
    description: 'Get distance from the explosion center',
    color: '#E74C3C',
    inputs: [
      { label: 'DamageInfo', type: 'data', dataType: 'any', isInput: true },
    ],
    outputs: [
      { label: 'Distance', type: 'data', dataType: 'number', isInput: false },
    ],
    defaultData: {},
  },
  {
    type: 'damageinfo-get-damage-force',
    category: 'damage',
    label: 'DamageInfo_GetDamageForce',
    description: 'Get the damage force vector',
    color: '#E74C3C',
    inputs: [
      { label: 'DamageInfo', type: 'data', dataType: 'any', isInput: true },
    ],
    outputs: [
      { label: 'Force', type: 'data', dataType: 'vector', isInput: false },
    ],
    defaultData: {},
  },
  {
    type: 'damageinfo-get-damage-force-direction',
    category: 'damage',
    label: 'DamageInfo_GetDamageForceDirection',
    description: 'Get the normalized damage force direction',
    color: '#E74C3C',
    inputs: [
      { label: 'DamageInfo', type: 'data', dataType: 'any', isInput: true },
    ],
    outputs: [
      { label: 'Direction', type: 'data', dataType: 'vector', isInput: false },
    ],
    defaultData: {},
  },
  {
    type: 'damageinfo-is-ragdoll-allowed',
    category: 'damage',
    label: 'DamageInfo_IsRagdollAllowed',
    description: 'Check if ragdoll is allowed for this damage',
    color: '#E74C3C',
    inputs: [
      { label: 'DamageInfo', type: 'data', dataType: 'any', isInput: true },
    ],
    outputs: [
      { label: 'Allowed', type: 'data', dataType: 'boolean', isInput: false },
    ],
    defaultData: {},
  },
  {
    type: 'damageinfo-get-damage-flags',
    category: 'damage',
    label: 'DamageInfo_GetDamageFlags',
    description: 'Get the damage flags bitmask',
    color: '#E74C3C',
    inputs: [
      { label: 'DamageInfo', type: 'data', dataType: 'any', isInput: true },
    ],
    outputs: [
      { label: 'Flags', type: 'data', dataType: 'number', isInput: false },
    ],
    defaultData: {},
  },
  {
    type: 'damageinfo-get-damage-weapon-name',
    category: 'damage',
    label: 'DamageInfo_GetDamageWeaponName',
    description: 'Get the weapon name string from damageInfo',
    color: '#E74C3C',
    inputs: [
      { label: 'DamageInfo', type: 'data', dataType: 'any', isInput: true },
    ],
    outputs: [
      { label: 'WeaponName', type: 'data', dataType: 'string', isInput: false },
    ],
    defaultData: {},
  },
  {
    type: 'damageinfo-should-record-stats',
    category: 'damage',
    label: 'DamageInfo_ShouldRecordStatsForWeapon',
    description: 'Check if stats should be recorded for this weapon damage',
    color: '#E74C3C',
    inputs: [
      { label: 'DamageInfo', type: 'data', dataType: 'any', isInput: true },
    ],
    outputs: [
      { label: 'ShouldRecord', type: 'data', dataType: 'boolean', isInput: false },
    ],
    defaultData: {},
  },
  {
    type: 'damageinfo-get-damage-type',
    category: 'damage',
    label: 'DamageInfo_GetDamageType',
    description: 'Get the damage type flags',
    color: '#E74C3C',
    inputs: [
      { label: 'DamageInfo', type: 'data', dataType: 'any', isInput: true },
    ],
    outputs: [
      { label: 'DamageType', type: 'data', dataType: 'number', isInput: false },
    ],
    defaultData: {},
  },

  // ==================== UI/RUI ====================
  {
    type: 'rui-create',
    category: 'ui',
    label: 'RuiCreate',
    description: 'Create RUI element',
    color: '#3498DB',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Asset', type: 'data', dataType: 'asset', isInput: true },
      { label: 'DrawGroup', type: 'data', dataType: 'number', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
      { label: 'Rui', type: 'data', dataType: 'any', isInput: false },
    ],
    defaultData: { asset: '$""', drawGroup: 0 },
    clientOnly: true,
  },
  {
    type: 'rui-destroy',
    category: 'ui',
    label: 'RuiDestroy',
    description: 'Destroy RUI element',
    color: '#3498DB',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Rui', type: 'data', dataType: 'any', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: {},
    clientOnly: true,
  },
  {
    type: 'rui-set-string',
    category: 'ui',
    label: 'RuiSetString',
    description: 'Set RUI string argument',
    color: '#3498DB',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Rui', type: 'data', dataType: 'any', isInput: true },
      { label: 'ArgName', type: 'data', dataType: 'string', isInput: true },
      { label: 'Value', type: 'data', dataType: 'string', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { argName: 'text' },
    clientOnly: true,
  },
  {
    type: 'rui-set-int',
    category: 'ui',
    label: 'RuiSetInt',
    description: 'Set RUI int argument',
    color: '#3498DB',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Rui', type: 'data', dataType: 'any', isInput: true },
      { label: 'ArgName', type: 'data', dataType: 'string', isInput: true },
      { label: 'Value', type: 'data', dataType: 'number', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { argName: 'count' },
    clientOnly: true,
  },
  {
    type: 'rui-set-float',
    category: 'ui',
    label: 'RuiSetFloat',
    description: 'Set RUI float argument',
    color: '#3498DB',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Rui', type: 'data', dataType: 'any', isInput: true },
      { label: 'ArgName', type: 'data', dataType: 'string', isInput: true },
      { label: 'Value', type: 'data', dataType: 'number', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { argName: 'progress' },
    clientOnly: true,
  },
  {
    type: 'rui-set-bool',
    category: 'ui',
    label: 'RuiSetBool',
    description: 'Set RUI bool argument',
    color: '#3498DB',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Rui', type: 'data', dataType: 'any', isInput: true },
      { label: 'ArgName', type: 'data', dataType: 'string', isInput: true },
      { label: 'Value', type: 'data', dataType: 'boolean', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { argName: 'isVisible' },
    clientOnly: true,
  },
  {
    type: 'rui-set-image',
    category: 'ui',
    label: 'RuiSetImage',
    description: 'Set RUI image argument',
    color: '#3498DB',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Rui', type: 'data', dataType: 'any', isInput: true },
      { label: 'ArgName', type: 'data', dataType: 'string', isInput: true },
      { label: 'Asset', type: 'data', dataType: 'asset', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { argName: 'icon', asset: '$""' },
    clientOnly: true,
  },
  {
    type: 'rui-set-float3',
    category: 'ui',
    label: 'RuiSetFloat3',
    description: 'Set RUI float3/vector argument',
    color: '#3498DB',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Rui', type: 'data', dataType: 'any', isInput: true },
      { label: 'ArgName', type: 'data', dataType: 'string', isInput: true },
      { label: 'Value', type: 'data', dataType: 'vector', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { argName: 'color' },
    clientOnly: true,
  },
  {
    type: 'announcement',
    category: 'ui',
    label: 'Announcement',
    description: 'Show announcement to player',
    color: '#3498DB',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Player', type: 'data', dataType: 'player', isInput: true },
      { label: 'Message', type: 'data', dataType: 'string', isInput: true },
      { label: 'Duration', type: 'data', dataType: 'number', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { message: 'Announcement!', duration: 3.0 },
    serverOnly: true,
  },
  {
    type: 'server-to-client-string-command',
    category: 'ui',
    label: 'ServerToClientStringCommand',
    description: 'Send string command to client',
    color: '#3498DB',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Player', type: 'data', dataType: 'player', isInput: true },
      { label: 'Command', type: 'data', dataType: 'string', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { command: 'ClientCommand' },
    serverOnly: true,
  },

  // ==================== STRING ====================
  {
    type: 'string-concat',
    category: 'string',
    label: 'String Concat',
    description: 'Concatenate two strings together',
    color: '#9B59B6',
    inputs: [
      { label: 'A', type: 'data', dataType: 'string', isInput: true },
      { label: 'B', type: 'data', dataType: 'string', isInput: true },
    ],
    outputs: [
      { label: 'Result', type: 'data', dataType: 'string', isInput: false },
    ],
    defaultData: {},
  },
  {
    type: 'string-format',
    category: 'string',
    label: 'Format String',
    description: 'Format string with values (use format() function)',
    color: '#9B59B6',
    inputs: [
      { label: 'Format', type: 'data', dataType: 'string', isInput: true },
      { label: 'Arg1', type: 'data', dataType: 'any', isInput: true },
      { label: 'Arg2', type: 'data', dataType: 'any', isInput: true },
      { label: 'Arg3', type: 'data', dataType: 'any', isInput: true },
      { label: 'Arg4', type: 'data', dataType: 'any', isInput: true },
    ],
    outputs: [
      { label: 'Result', type: 'data', dataType: 'string', isInput: false },
    ],
    defaultData: { formatStr: '%s %s' },
  },
  {
    type: 'to-string',
    category: 'string',
    label: 'To String',
    description: 'Convert any value to string using string()',
    color: '#9B59B6',
    inputs: [
      { label: 'Value', type: 'data', dataType: 'any', isInput: true },
    ],
    outputs: [
      { label: 'String', type: 'data', dataType: 'string', isInput: false },
    ],
    defaultData: {},
  },
  {
    type: 'string-builder',
    category: 'string',
    label: 'String Builder',
    description: 'Build a string from multiple parts',
    color: '#9B59B6',
    inputs: [
      { label: 'Part 0', type: 'data', dataType: 'any', isInput: true },
      { label: 'Part 1', type: 'data', dataType: 'any', isInput: true },
    ],
    outputs: [
      { label: 'Result', type: 'data', dataType: 'string', isInput: false },
    ],
    defaultData: { inputCount: 2 },
  },
  {
    type: 'string-length',
    category: 'string',
    label: 'String Length',
    description: 'Get string length (.len())',
    color: '#9B59B6',
    inputs: [
      { label: 'String', type: 'data', dataType: 'string', isInput: true },
    ],
    outputs: [
      { label: 'Length', type: 'data', dataType: 'int', isInput: false },
    ],
    defaultData: {},
    tags: ['string', 'length', 'len'],
  },
  {
    type: 'string-substring',
    category: 'string',
    label: 'Substring',
    description: 'Get substring from string (.slice)',
    color: '#9B59B6',
    inputs: [
      { label: 'String', type: 'data', dataType: 'string', isInput: true },
      { label: 'Start', type: 'data', dataType: 'int', isInput: true },
      { label: 'End', type: 'data', dataType: 'int', isInput: true },
    ],
    outputs: [
      { label: 'Result', type: 'data', dataType: 'string', isInput: false },
    ],
    defaultData: { start: 0, end: -1 },
    tags: ['string', 'substring', 'slice'],
  },
  {
    type: 'string-split',
    category: 'string',
    label: 'String Split',
    description: 'Split string by delimiter (.split)',
    color: '#9B59B6',
    inputs: [
      { label: 'String', type: 'data', dataType: 'string', isInput: true },
      { label: 'Delimiter', type: 'data', dataType: 'string', isInput: true },
    ],
    outputs: [
      { label: 'Array', type: 'data', dataType: 'array', isInput: false },
    ],
    defaultData: { delimiter: ' ' },
    tags: ['string', 'split', 'delimiter'],
  },
  {
    type: 'string-replace',
    category: 'string',
    label: 'String Replace',
    description: 'Replace text in string (.replace)',
    color: '#9B59B6',
    inputs: [
      { label: 'String', type: 'data', dataType: 'string', isInput: true },
      { label: 'Find', type: 'data', dataType: 'string', isInput: true },
      { label: 'Replace', type: 'data', dataType: 'string', isInput: true },
    ],
    outputs: [
      { label: 'Result', type: 'data', dataType: 'string', isInput: false },
    ],
    defaultData: { find: 'old', replace: 'new' },
    tags: ['string', 'replace'],
  },
  {
    type: 'string-to-lower',
    category: 'string',
    label: 'To Lower',
    description: 'Convert string to lowercase (.tolower())',
    color: '#9B59B6',
    inputs: [
      { label: 'String', type: 'data', dataType: 'string', isInput: true },
    ],
    outputs: [
      { label: 'Result', type: 'data', dataType: 'string', isInput: false },
    ],
    defaultData: {},
    tags: ['string', 'lowercase', 'tolower'],
  },
  {
    type: 'string-to-upper',
    category: 'string',
    label: 'To Upper',
    description: 'Convert string to uppercase (.toupper())',
    color: '#9B59B6',
    inputs: [
      { label: 'String', type: 'data', dataType: 'string', isInput: true },
    ],
    outputs: [
      { label: 'Result', type: 'data', dataType: 'string', isInput: false },
    ],
    defaultData: {},
    tags: ['string', 'uppercase', 'toupper'],
  },
  {
    type: 'string-trim',
    category: 'string',
    label: 'String Trim',
    description: 'Remove whitespace from both ends (.strip())',
    color: '#9B59B6',
    inputs: [
      { label: 'String', type: 'data', dataType: 'string', isInput: true },
    ],
    outputs: [
      { label: 'Result', type: 'data', dataType: 'string', isInput: false },
    ],
    defaultData: {},
    tags: ['string', 'trim', 'strip'],
  },
  {
    type: 'string-contains',
    category: 'string',
    label: 'String Contains',
    description: 'Check if string contains substring',
    color: '#9B59B6',
    inputs: [
      { label: 'String', type: 'data', dataType: 'string', isInput: true },
      { label: 'Substring', type: 'data', dataType: 'string', isInput: true },
    ],
    outputs: [
      { label: 'Contains', type: 'data', dataType: 'boolean', isInput: false },
    ],
    defaultData: { substring: 'text' },
    tags: ['string', 'contains', 'includes'],
  },
  {
    type: 'string-find',
    category: 'string',
    label: 'String Find',
    description: 'Find index of substring in string (.find)',
    color: '#9B59B6',
    inputs: [
      { label: 'String', type: 'data', dataType: 'string', isInput: true },
      { label: 'Substring', type: 'data', dataType: 'string', isInput: true },
    ],
    outputs: [
      { label: 'Index', type: 'data', dataType: 'int', isInput: false },
    ],
    defaultData: { substring: 'text' },
    tags: ['string', 'find', 'index'],
  },
  {
    type: 'string-repeat',
    category: 'string',
    label: 'String Repeat',
    description: 'Repeat string N times',
    color: '#9B59B6',
    inputs: [
      { label: 'String', type: 'data', dataType: 'string', isInput: true },
      { label: 'Count', type: 'data', dataType: 'int', isInput: true },
    ],
    outputs: [
      { label: 'Result', type: 'data', dataType: 'string', isInput: false },
    ],
    defaultData: { count: 3 },
    tags: ['string', 'repeat'],
  },
  {
    type: 'string-reverse',
    category: 'string',
    label: 'String Reverse',
    description: 'Reverse string characters',
    color: '#9B59B6',
    inputs: [
      { label: 'String', type: 'data', dataType: 'string', isInput: true },
    ],
    outputs: [
      { label: 'Result', type: 'data', dataType: 'string', isInput: false },
    ],
    defaultData: {},
    tags: ['string', 'reverse'],
  },

  // ==================== MATH ====================
  {
    type: 'vector-add',
    category: 'math',
    label: 'Vector Add',
    description: 'Add two vectors',
    color: '#95A5A6',
    inputs: [
      { label: 'A', type: 'data', dataType: 'vector', isInput: true },
      { label: 'B', type: 'data', dataType: 'vector', isInput: true },
    ],
    outputs: [
      { label: 'Result', type: 'data', dataType: 'vector', isInput: false },
    ],
    defaultData: {},
    documentation: {
      longDescription: 'Adds two vectors together component-wise (X+X, Y+Y, Z+Z). Use this to combine positions, offsets, or direction vectors.',
      codeExample: `// Add two positions
vector pos1 = <100, 200, 50>
vector pos2 = <50, 100, 25>
vector result = pos1 + pos2  // <150, 300, 75>

// Offset a position
vector offset = <0, 0, 100>
vector newPos = player.GetOrigin() + offset`,
      tips: [
        'Component-wise addition',
        'Use for position offsets',
        'Works with any vector inputs',
        'Result is also a vector'
      ],
      useCases: [
        'Position calculations',
        'Offset positioning',
        'Movement vectors',
        'Combined directions'
      ],
      relatedNodes: ['vector-subtract', 'vector-multiply', 'get-origin']
    }
  },
  {
    type: 'vector-subtract',
    category: 'math',
    label: 'Vector Subtract',
    description: 'Subtract two vectors',
    color: '#95A5A6',
    inputs: [
      { label: 'A', type: 'data', dataType: 'vector', isInput: true },
      { label: 'B', type: 'data', dataType: 'vector', isInput: true },
    ],
    outputs: [
      { label: 'Result', type: 'data', dataType: 'vector', isInput: false },
    ],
    defaultData: {},
    documentation: {
      longDescription: 'Subtracts the second vector from the first component-wise. Use this to get the direction from one point to another or find relative positions.',
      codeExample: `// Get direction from A to B
vector from = player.GetOrigin()
vector to = target.GetOrigin()
vector direction = to - from  // Points from player to target

// Calculate offset
vector offset = targetPos - origin  // How far target is from origin`,
      tips: [
        'Component-wise subtraction',
        'Result points from A to B when A is origin',
        'Use for relative positions',
        'Distance = VectorToAngles result length'
      ],
      useCases: [
        'Direction to target',
        'Relative positioning',
        'Offset calculations',
        'Movement vectors'
      ],
      relatedNodes: ['vector-add', 'vector-distance', 'vector-normalize']
    }
  },
  {
    type: 'vector-multiply',
    category: 'math',
    label: 'Vector Scale',
    description: 'Multiply vector by scalar',
    color: '#95A5A6',
    inputs: [
      { label: 'Vector', type: 'data', dataType: 'vector', isInput: true },
      { label: 'Scalar', type: 'data', dataType: 'number', isInput: true },
    ],
    outputs: [
      { label: 'Result', type: 'data', dataType: 'vector', isInput: false },
    ],
    defaultData: { scalar: 1.0 },
    documentation: {
      longDescription: 'Scales a vector by multiplying each component by a scalar value. Use this to extend vectors, apply multipliers, or adjust distances.',
      codeExample: `// Scale a direction vector
vector dir = player.GetForwardVector()
vector scaled = dir * 500  // Extend 500 units in that direction

// Point in front of player at distance
vector point = player.GetOrigin() + (player.GetForwardVector() * 100)

// Scale velocity
vector currentVel = projectile.GetVelocity()
projectile.SetVelocity( currentVel * 1.5 )  // Speed up`,
      tips: [
        'Scales all components equally',
        'Negative scalar reverses direction',
        'Use 0 to zero out vector',
        'Common for distance calculations'
      ],
      useCases: [
        'Distance scaling',
        'Velocity modification',
        'Point positioning',
        'Direction extension'
      ],
      relatedNodes: ['vector-add', 'vector-normalize', 'vector-length']
    }
  },
  {
    type: 'vector-normalize',
    category: 'math',
    label: 'Normalize',
    description: 'Normalize vector',
    color: '#95A5A6',
    inputs: [
      { label: 'Vector', type: 'data', dataType: 'vector', isInput: true },
    ],
    outputs: [
      { label: 'Result', type: 'data', dataType: 'vector', isInput: false },
    ],
    defaultData: {},
    documentation: {
      longDescription: 'Reduces a vector to its direction by scaling it to length 1. The direction is preserved but magnitude becomes 1. Use this to get pure direction from any vector.',
      codeExample: `// Get pure direction
vector offset = targetPos - playerPos
vector direction = Normalize( offset )  // Length = 1

// Use for movement at fixed speed
vector moveDir = Normalize( player.GetVelocity() )
entity.SetVelocity( moveDir * 200 )  // Move at 200 units/sec`,
      tips: [
        'Returns unit vector (length 1)',
        'Preserves direction only',
        'Use before multiplying for distance',
        'Zero vector stays zero'
      ],
      useCases: [
        'Direction extraction',
        'Fixed-speed movement',
        'Aiming calculations',
        'Movement normalization'
      ],
      relatedNodes: ['vector-length', 'vector-multiply', 'vector-distance']
    }
  },
  {
    type: 'vector-length',
    category: 'math',
    label: 'Length',
    description: 'Get vector length',
    color: '#95A5A6',
    inputs: [
      { label: 'Vector', type: 'data', dataType: 'vector', isInput: true },
    ],
    outputs: [
      { label: 'Length', type: 'data', dataType: 'number', isInput: false },
    ],
    defaultData: {},
    documentation: {
      longDescription: 'Returns the length (magnitude) of a vector. This is the distance from origin to the point represented by the vector. Use for distance checks and range calculations.',
      codeExample: `// Get distance
vector offset = targetPos - playerPos
float dist = VectorLength( offset )

if ( dist < 100 )
{
    print( "Target is close! (< 100 units)" )
}

// Distance between entities
float distBetween = VectorLength( entityA.GetOrigin() - entityB.GetOrigin() )`,
      tips: [
        'Returns distance from origin',
        'Use for range checks',
        'More efficient than Distance for relative',
        'Zero vector has length 0'
      ],
      useCases: [
        'Distance calculations',
        'Range checks',
        'Speed normalization',
        'Proximity detection'
      ],
      relatedNodes: ['vector-distance', 'vector-normalize', 'math-clamp']
    }
  },
  {
    type: 'vector-distance',
    category: 'math',
    label: 'Distance',
    description: 'Distance between two points',
    color: '#95A5A6',
    inputs: [
      { label: 'A', type: 'data', dataType: 'vector', isInput: true },
      { label: 'B', type: 'data', dataType: 'vector', isInput: true },
    ],
    outputs: [
      { label: 'Distance', type: 'data', dataType: 'number', isInput: false },
    ],
    defaultData: {},
    documentation: {
      longDescription: 'Calculates the distance between two points in 3D space. This is the length of the line connecting the two positions. Use for range checks and proximity detection.',
      codeExample: `// Distance between entities
float dist = Distance( player.GetOrigin(), enemy.GetOrigin() )

if ( dist < 200 )
{
    print( "In range! Can attack." )
}

// Distance from point
vector origin = <0, 0, 0>
float distFromCenter = Distance( origin, player.GetOrigin() )`,
      tips: [
        'Returns straight-line distance',
        'Use for attack range checks',
        'Audio falloff calculations',
        'Spawn distance validation'
      ],
      useCases: [
        'Attack range',
        'Proximity detection',
        'Spawn validation',
        'Audio/visual range'
      ],
      relatedNodes: ['vector-length', 'compare-less', 'trace-line']
    }
  },
  {
    type: 'vector-dot',
    category: 'math',
    label: 'Dot Product',
    description: 'Dot product of two vectors',
    color: '#95A5A6',
    inputs: [
      { label: 'A', type: 'data', dataType: 'vector', isInput: true },
      { label: 'B', type: 'data', dataType: 'vector', isInput: true },
    ],
    outputs: [
      { label: 'Result', type: 'data', dataType: 'number', isInput: false },
    ],
    defaultData: {},
    documentation: {
      longDescription: 'Calculates the dot product of two vectors. The result is positive if the angle between vectors is less than 90 degrees, zero if perpendicular, and negative if greater than 90 degrees. Use for angle comparisons and "facing" checks.',
      codeExample: `// Check if looking at target
vector toTarget = Normalize( targetPos - playerPos )
vector lookDir = player.GetForwardVector()
float dot = VectorDot( lookDir, toTarget )

if ( dot > 0.9 )
{
    print( "Looking directly at target!" )
}

// Cone detection
if ( dot > 0.5 )  // Within ~60 degree cone
{
    print( "In view cone" )
}`,
      tips: [
        'Result = |A| * |B| * cos(angle)',
        'Dot > 0 means same general direction',
        'Dot = 1 means parallel (same direction)',
        'Dot = -1 means opposite directions'
      ],
      useCases: [
        'View cone detection',
        'Angle comparisons',
        'Facing checks',
        'Similarity measures'
      ],
      relatedNodes: ['compare-greater', 'get-forward-vector', 'angles-to-forward']
    }
  },
  {
    type: 'vector-cross',
    category: 'math',
    label: 'Cross Product',
    description: 'Cross product of two vectors',
    color: '#95A5A6',
    inputs: [
      { label: 'A', type: 'data', dataType: 'vector', isInput: true },
      { label: 'B', type: 'data', dataType: 'vector', isInput: true },
    ],
    outputs: [
      { label: 'Result', type: 'data', dataType: 'vector', isInput: false },
    ],
    defaultData: {},
    documentation: {
      longDescription: 'Calculates the cross product of two vectors, which results in a vector perpendicular to both. The direction follows the right-hand rule. Use for calculating surface normals or finding perpendicular directions.',
      codeExample: `// Get perpendicular direction
vector up = <0, 0, 1>
vector forward = player.GetForwardVector()
vector right = CrossProduct( up, forward )  // Perpendicular to both

// Surface normal
vector surfaceNormal = CrossProduct( edge1, edge2 )

// Rotate 90 degrees
vector rotated = CrossProduct( <0, 0, 1>, originalDir )`,
      tips: [
        'Result is perpendicular to both inputs',
        'Order matters (A x B != B x A)',
        'Zero if vectors are parallel',
        'Useful for rotation math'
      ],
      useCases: [
        'Surface normals',
        'Perpendicular directions',
        'Rotation calculations',
        'Physics interactions'
      ],
      relatedNodes: ['get-forward-vector', 'get-right-vector', 'get-up-vector']
    }
  },
  {
    type: 'angles-to-forward',
    category: 'math',
    label: 'AnglesToForward',
    description: 'Get forward vector from angles',
    color: '#95A5A6',
    inputs: [
      { label: 'Angles', type: 'data', dataType: 'vector', isInput: true },
    ],
    outputs: [
      { label: 'Forward', type: 'data', dataType: 'vector', isInput: false },
    ],
    defaultData: {},
    documentation: {
      longDescription: 'Converts pitch, yaw, roll angles to a forward direction vector. The yaw determines the horizontal direction, pitch affects vertical. Use for calculating aim direction from angles.',
      codeExample: `// Get forward from angles
vector angles = <0, 90, 0>  // Pitch, Yaw, Roll
vector forward = AnglesToForward( angles )  // Points East

// Convert entity angles to direction
vector dir = AnglesToForward( player.GetAngles() )

// Use for shooting
vector aimDir = AnglesToForward( <0, player.GetAngles().y, 0> )  // Ignore pitch`,
      tips: [
        'Converts angles to direction',
        'Yaw is the most important component',
        'Result is normalized',
        'Use with SetAngles for reverse'
      ],
      useCases: [
        'Aiming calculations',
        'Angle to direction conversion',
        'Raycast direction',
        'Movement direction'
      ],
      relatedNodes: ['vector-to-angles', 'get-forward-vector', 'set-angles']
    }
  },
  {
    type: 'vector-to-angles',
    category: 'math',
    label: 'VectorToAngles',
    description: 'Convert direction to angles',
    color: '#95A5A6',
    inputs: [
      { label: 'Direction', type: 'data', dataType: 'vector', isInput: true },
    ],
    outputs: [
      { label: 'Angles', type: 'data', dataType: 'vector', isInput: false },
    ],
    defaultData: {},
    documentation: {
      longDescription: 'Converts a direction vector to pitch, yaw, roll angles. The resulting angles can be used with SetAngles to orient an entity. Use for making one entity face another.',
      codeExample: `// Make entity face another
entity npc = GetEntByScriptName( "guard" )
entity target = GetEntByScriptName( "player" )

vector toTarget = target.GetOrigin() - npc.GetOrigin()
vector angles = VectorToAngles( toTarget )
npc.SetAngles( angles )

// Convert direction to angles
vector direction = <1, 1, 0>  // 45 degrees diagonal
vector resultAngles = VectorToAngles( direction )`,
      tips: [
        'Converts direction to angles',
        'Use with SetAngles for facing',
        'Result is pitch, yaw, roll',
        'Input should be normalized ideally'
      ],
      useCases: [
        'Facing targets',
        'Angle conversion',
        'Orientation from direction',
        'Aiming setup'
      ],
      relatedNodes: ['angles-to-forward', 'set-angles', 'get-angles']
    }
  },
  {
    type: 'vector-lerp',
    category: 'math',
    label: 'Vector Lerp',
    description: 'Linear interpolation between two vectors',
    color: '#95A5A6',
    inputs: [
      { label: 'A', type: 'data', dataType: 'vector', isInput: true },
      { label: 'B', type: 'data', dataType: 'vector', isInput: true },
      { label: 'T', type: 'data', dataType: 'number', isInput: true },
    ],
    outputs: [
      { label: 'Result', type: 'data', dataType: 'vector', isInput: false },
    ],
    defaultData: { t: 0.5 },
  },
  {
    type: 'math-add',
    category: 'math',
    label: 'Add',
    description: 'Add two numbers',
    color: '#95A5A6',
    inputs: [
      { label: 'A', type: 'data', dataType: 'number', isInput: true },
      { label: 'B', type: 'data', dataType: 'number', isInput: true },
    ],
    outputs: [
      { label: 'Result', type: 'data', dataType: 'number', isInput: false },
    ],
    defaultData: {},
    documentation: {
      longDescription: 'Adds two numbers together. Use for incrementing values, combining quantities, or calculating sums.',
      codeExample: `// Simple addition
int score = 10 + 5  // 15

// Increment
int kills = 0
kills = kills + 1  // 1

// Calculate total
float healthBonus = 25.0
float armorBonus = 15.0
float totalBonus = healthBonus + armorBonus  // 40.0`,
      tips: [
        'Works with int and float',
        'Use for scoring',
        'Can chain multiple adds',
        'Use += for in-place addition'
      ],
      useCases: [
        'Score calculation',
        'Value accumulation',
        'Stat bonuses',
        'Counter increments'
      ],
      relatedNodes: ['math-subtract', 'math-multiply', 'math-clamp']
    }
  },
  {
    type: 'math-subtract',
    category: 'math',
    label: 'Subtract',
    description: 'Subtract two numbers',
    color: '#95A5A6',
    inputs: [
      { label: 'A', type: 'data', dataType: 'number', isInput: true },
      { label: 'B', type: 'data', dataType: 'number', isInput: true },
    ],
    outputs: [
      { label: 'Result', type: 'data', dataType: 'number', isInput: false },
    ],
    defaultData: {},
    documentation: {
      longDescription: 'Subtracts the second number from the first. Use for calculating differences, reducing values, or finding remainders.',
      codeExample: `// Subtraction
int remaining = 100 - 30  // 70

// Damage calculation
float damage = 50.0
float mitigation = 15.0
float finalDamage = damage - mitigation  // 35.0

// Difference
int diff = 100 - 95  // 5`,
      tips: [
        'A - B = difference',
        'Can result in negative numbers',
        'Use for damage calculations',
        'Use for stat reductions'
      ],
      useCases: [
        'Damage calculations',
        'Stat reductions',
        'Difference finding',
        'Health remaining'
      ],
      relatedNodes: ['math-add', 'math-multiply', 'set-health']
    }
  },
  {
    type: 'math-multiply',
    category: 'math',
    label: 'Multiply',
    description: 'Multiply two numbers',
    color: '#95A5A6',
    inputs: [
      { label: 'A', type: 'data', dataType: 'number', isInput: true },
      { label: 'B', type: 'data', dataType: 'number', isInput: true },
    ],
    outputs: [
      { label: 'Result', type: 'data', dataType: 'number', isInput: false },
    ],
    defaultData: {},
    documentation: {
      longDescription: 'Multiplies two numbers together. Use for scaling values, calculating areas, or applying multipliers.',
      codeExample: `// Multiplication
int doubled = 5 * 2  // 10

// Damage multiplier
float baseDamage = 50.0
float multiplier = 1.5
float finalDamage = baseDamage * multiplier  // 75.0

// Scaling
int scale = 10 * 10  // 100`,
      tips: [
        'Use for scaling and multipliers',
        'Damage amplification',
        'Speed modifiers',
        'Area calculations'
      ],
      useCases: [
        'Damage scaling',
        'Speed modifiers',
        'Area calculations',
        'Stat multipliers'
      ],
      relatedNodes: ['math-divide', 'math-add', 'math-clamp']
    }
  },
  {
    type: 'math-divide',
    category: 'math',
    label: 'Divide',
    description: 'Divide two numbers',
    color: '#95A5A6',
    inputs: [
      { label: 'A', type: 'data', dataType: 'number', isInput: true },
      { label: 'B', type: 'data', dataType: 'number', isInput: true },
    ],
    outputs: [
      { label: 'Result', type: 'data', dataType: 'number', isInput: false },
    ],
    defaultData: {},
    documentation: {
      longDescription: 'Divides the first number by the second. Use for averaging, percentages, or scaling down. Be careful of division by zero.',
      codeExample: `// Division
float half = 10.0 / 2.0  // 5.0

// Percentage
int score = 1500
int total = 3000
float percent = (float(score) / float(total)) * 100  // 50%

// Average
int sum = 10 + 20 + 30
float average = float(sum) / 3.0  // 20.0`,
      tips: [
        'A / B = quotient',
        'Avoid division by zero',
        'Convert to float for decimal results',
        'Use for percentages'
      ],
      useCases: [
        'Percentages',
        'Averaging',
        'Scaling down',
        'Ratios'
      ],
      relatedNodes: ['math-multiply', 'math-add', 'math-clamp']
    }
  },
  {
    type: 'math-clamp',
    category: 'math',
    label: 'Clamp',
    description: 'Clamp value between min and max',
    color: '#95A5A6',
    inputs: [
      { label: 'Value', type: 'data', dataType: 'number', isInput: true },
      { label: 'Min', type: 'data', dataType: 'number', isInput: true },
      { label: 'Max', type: 'data', dataType: 'number', isInput: true },
    ],
    outputs: [
      { label: 'Result', type: 'data', dataType: 'number', isInput: false },
    ],
    defaultData: { min: 0, max: 1 },
    documentation: {
      longDescription: 'Restricts a value to be within a specified range. If the value is below min, returns min. If above max, returns max. Otherwise returns the original value.',
      codeExample: `// Clamp health percentage
float healthPercent = 150.0
healthPercent = Clamp( healthPercent, 0, 100 )  // 100

// Clamp position
float x = -50.0
x = Clamp( x, 0, 1000 )  // 0 (minimum)

// Safe division result
float damage = 75.0
damage = Clamp( damage, 1.0, 100.0 )  // In range`,
      tips: [
        'Ensures value stays in range',
        'Useful for health percentages',
        'Prevents invalid values',
        'Min and Max can be swapped'
      ],
      useCases: [
        'Health percentages',
        'Progress bars',
        'Angle clamping',
        'Value validation'
      ],
      relatedNodes: ['math-min', 'math-max', 'get-health']
    }
  },
  {
    type: 'math-min',
    category: 'math',
    label: 'Min',
    description: 'Get minimum value',
    color: '#95A5A6',
    inputs: [
      { label: 'A', type: 'data', dataType: 'number', isInput: true },
      { label: 'B', type: 'data', dataType: 'number', isInput: true },
    ],
    outputs: [
      { label: 'Result', type: 'data', dataType: 'number', isInput: false },
    ],
    defaultData: {},
  },
  {
    type: 'math-max',
    category: 'math',
    label: 'Max',
    description: 'Get maximum value',
    color: '#95A5A6',
    inputs: [
      { label: 'A', type: 'data', dataType: 'number', isInput: true },
      { label: 'B', type: 'data', dataType: 'number', isInput: true },
    ],
    outputs: [
      { label: 'Result', type: 'data', dataType: 'number', isInput: false },
    ],
    defaultData: {},
  },
  {
    type: 'math-abs',
    category: 'math',
    label: 'Abs',
    description: 'Absolute value',
    color: '#95A5A6',
    inputs: [
      { label: 'Value', type: 'data', dataType: 'number', isInput: true },
    ],
    outputs: [
      { label: 'Result', type: 'data', dataType: 'number', isInput: false },
    ],
    defaultData: {},
  },
  {
    type: 'math-random-int',
    category: 'math',
    label: 'RandomInt',
    description: 'Random integer in range',
    color: '#95A5A6',
    inputs: [
      { label: 'Min', type: 'data', dataType: 'number', isInput: true },
      { label: 'Max', type: 'data', dataType: 'number', isInput: true },
    ],
    outputs: [
      { label: 'Result', type: 'data', dataType: 'number', isInput: false },
    ],
    defaultData: { min: 0, max: 100 },
  },
  {
    type: 'math-random-float',
    category: 'math',
    label: 'RandomFloat',
    description: 'Random float in range',
    color: '#95A5A6',
    inputs: [
      { label: 'Min', type: 'data', dataType: 'number', isInput: true },
      { label: 'Max', type: 'data', dataType: 'number', isInput: true },
    ],
    outputs: [
      { label: 'Result', type: 'data', dataType: 'number', isInput: false },
    ],
    defaultData: { min: 0.0, max: 1.0 },
  },
  {
    type: 'math-lerp',
    category: 'math',
    label: 'Lerp',
    description: 'Linear interpolation',
    color: '#95A5A6',
    inputs: [
      { label: 'A', type: 'data', dataType: 'number', isInput: true },
      { label: 'B', type: 'data', dataType: 'number', isInput: true },
      { label: 'T', type: 'data', dataType: 'number', isInput: true },
    ],
    outputs: [
      { label: 'Result', type: 'data', dataType: 'number', isInput: false },
    ],
    defaultData: { t: 0.5 },
  },
  {
    type: 'math-tan',
    category: 'math',
    label: 'Tan',
    description: 'Tangent function (radians)',
    color: '#95A5A6',
    inputs: [
      { label: 'Value', type: 'data', dataType: 'number', isInput: true },
    ],
    outputs: [
      { label: 'Result', type: 'data', dataType: 'number', isInput: false },
    ],
    defaultData: {},
  },
  {
    type: 'math-pow',
    category: 'math',
    label: 'Pow',
    description: 'Power function (base^exponent)',
    color: '#95A5A6',
    inputs: [
      { label: 'Base', type: 'data', dataType: 'number', isInput: true },
      { label: 'Exponent', type: 'data', dataType: 'number', isInput: true },
    ],
    outputs: [
      { label: 'Result', type: 'data', dataType: 'number', isInput: false },
    ],
    defaultData: {},
  },
  {
    type: 'graph-capped',
    category: 'math',
    label: 'GraphCapped',
    description: 'Graph capped interpolation',
    color: '#95A5A6',
    inputs: [
      { label: 'Value', type: 'data', dataType: 'number', isInput: true },
      { label: 'Start', type: 'data', dataType: 'number', isInput: true },
      { label: 'End', type: 'data', dataType: 'number', isInput: true },
      { label: 'OutStart', type: 'data', dataType: 'number', isInput: true },
      { label: 'OutEnd', type: 'data', dataType: 'number', isInput: true },
    ],
    outputs: [
      { label: 'Result', type: 'data', dataType: 'number', isInput: false },
    ],
    defaultData: { start: 0, end: 1, outStart: 0, outEnd: 1 },
  },
  {
    type: 'compare-equal',
    category: 'math',
    label: 'Equal',
    description: 'Check if values are equal',
    color: '#95A5A6',
    inputs: [
      { label: 'A', type: 'data', dataType: 'any', isInput: true },
      { label: 'B', type: 'data', dataType: 'any', isInput: true },
    ],
    outputs: [
      { label: 'Result', type: 'data', dataType: 'boolean', isInput: false },
    ],
    defaultData: {},
  },
  {
    type: 'compare-greater',
    category: 'math',
    label: 'Greater Than',
    description: 'Check if A > B',
    color: '#95A5A6',
    inputs: [
      { label: 'A', type: 'data', dataType: 'number', isInput: true },
      { label: 'B', type: 'data', dataType: 'number', isInput: true },
    ],
    outputs: [
      { label: 'Result', type: 'data', dataType: 'boolean', isInput: false },
    ],
    defaultData: {},
  },
  {
    type: 'compare-less',
    category: 'math',
    label: 'Less Than',
    description: 'Check if A < B',
    color: '#95A5A6',
    inputs: [
      { label: 'A', type: 'data', dataType: 'number', isInput: true },
      { label: 'B', type: 'data', dataType: 'number', isInput: true },
    ],
    outputs: [
      { label: 'Result', type: 'data', dataType: 'boolean', isInput: false },
    ],
    defaultData: {},
  },
  {
    type: 'logic-and',
    category: 'math',
    label: 'AND',
    description: 'Logical AND',
    color: '#95A5A6',
    inputs: [
      { label: 'A', type: 'data', dataType: 'boolean', isInput: true },
      { label: 'B', type: 'data', dataType: 'boolean', isInput: true },
    ],
    outputs: [
      { label: 'Result', type: 'data', dataType: 'boolean', isInput: false },
    ],
    defaultData: {},
  },
  {
    type: 'logic-or',
    category: 'math',
    label: 'OR',
    description: 'Logical OR',
    color: '#95A5A6',
    inputs: [
      { label: 'A', type: 'data', dataType: 'boolean', isInput: true },
      { label: 'B', type: 'data', dataType: 'boolean', isInput: true },
    ],
    outputs: [
      { label: 'Result', type: 'data', dataType: 'boolean', isInput: false },
    ],
    defaultData: {},
  },
  {
    type: 'logic-not',
    category: 'math',
    label: 'NOT',
    description: 'Logical NOT',
    color: '#95A5A6',
    inputs: [
      { label: 'Value', type: 'data', dataType: 'boolean', isInput: true },
    ],
    outputs: [
      { label: 'Result', type: 'data', dataType: 'boolean', isInput: false },
    ],
    defaultData: {},
  },

  // ==================== CALLBACKS ====================
  {
    type: 'add-client-command-callback',
    category: 'callbacks',
    label: 'AddClientCommandCallback',
    description: 'Add client command callback',
    color: '#8E44AD',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Command', type: 'data', dataType: 'string', isInput: true },
      { label: 'Function', type: 'data', dataType: 'function', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { command: 'MyCommand' },
    serverOnly: true,
  },
  {
    type: 'add-damage-callback',
    category: 'callbacks',
    label: 'AddDamageCallback',
    description: 'Add damage callback to entity',
    color: '#8E44AD',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Entity', type: 'data', dataType: 'entity', isInput: true },
      { label: 'Function', type: 'data', dataType: 'function', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: {},
    serverOnly: true,
  },
  {
    type: 'add-spawn-callback',
    category: 'callbacks',
    label: 'AddSpawnCallback',
    description: 'Add spawn callback for class',
    color: '#8E44AD',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'ClassName', type: 'data', dataType: 'string', isInput: true },
      { label: 'Function', type: 'data', dataType: 'function', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { className: 'player' },
    serverOnly: true,
    documentation: {
      longDescription: 'Registers a callback function that fires whenever an entity of the specified class spawns. Common classes include "player", "npc_soldier", "prop_dynamic", etc.',
      codeExample: `AddSpawnCallback( "player", OnPlayerSpawned )

void function OnPlayerSpawned( entity player )
{
    print( "Player spawned: " + player.GetPlayerName() )
    // Give starting equipment
    player.GiveWeapon( "mp_weapon_r97" )
}`,
      tips: [
        'Register in Server Init for best results',
        'Callback receives the spawned entity as parameter',
        'Use "player" for player spawns',
        'Fires for initial spawn and respawns'
      ],
      useCases: [
        'Give players weapons on spawn',
        'Set player properties on spawn',
        'Track entity spawns for gamemode logic',
        'Initialize entity state on creation'
      ],
      relatedNodes: ['add-death-callback', 'on-spawn', 'init-server'],
      exampleDiagram: {
        nodes: [
          { type: 'init-server', position: { x: 50, y: 50 } },
          { type: 'add-spawn-callback', position: { x: 250, y: 50 } },
          { type: 'custom-function', position: { x: 250, y: 130 }, label: 'OnPlayerSpawned' }
        ],
        connections: [
          { fromNode: 0, fromPort: 'Exec', toNode: 1, toPort: 'In' },
          { fromNode: 2, fromPort: 'Ref', toNode: 1, toPort: 'Function' }
        ],
        description: 'Register spawn callback during server initialization'
      }
    }
  },
  {
    type: 'add-death-callback',
    category: 'callbacks',
    label: 'AddDeathCallback',
    description: 'Add death callback for class',
    color: '#8E44AD',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'ClassName', type: 'data', dataType: 'string', isInput: true },
      { label: 'Function', type: 'data', dataType: 'function', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { className: 'player' },
    serverOnly: true,
    documentation: {
      longDescription: 'Registers a callback function that fires whenever an entity of the specified class dies. The callback receives the dying entity and damage info.',
      codeExample: `AddDeathCallback( "player", OnPlayerDeath )

void function OnPlayerDeath( entity player, var damageInfo )
{
    entity attacker = DamageInfo_GetAttacker( damageInfo )
    print( player.GetPlayerName() + " was killed" )
}`,
      tips: [
        'Callback receives entity and damageInfo parameters',
        'Use DamageInfo functions to get kill details',
        'Great for kill tracking and scoring',
        'Fires before entity is fully removed'
      ],
      useCases: [
        'Track player kills for scoring',
        'Drop loot on death',
        'Play death effects',
        'Notify other players of kills'
      ],
      relatedNodes: ['add-spawn-callback', 'on-death', 'on-player-killed']
    }
  },

  // ==================== DATA ====================
  {
    type: 'const-string',
    category: 'variables',
    label: 'String',
    description: 'String',
    color: '#3498DB',
    inputs: [],
    outputs: [
      { label: 'Value', type: 'data', dataType: 'string', isInput: false },
    ],
    defaultData: { value: '' },
  },
  {
    type: 'const-float',
    category: 'variables',
    label: 'Float',
    description: 'Float',
    color: '#3498DB',
    inputs: [],
    outputs: [
      { label: 'Value', type: 'data', dataType: 'float', isInput: false },
    ],
    defaultData: { value: 0.0 },
  },
  {
    type: 'const-int',
    category: 'variables',
    label: 'Int',
    description: 'Integer',
    color: '#3498DB',
    inputs: [],
    outputs: [
      { label: 'Value', type: 'data', dataType: 'int', isInput: false },
    ],
    defaultData: { value: 0 },
  },
  {
    type: 'const-bool',
    category: 'variables',
    label: 'Bool',
    description: 'Boolean',
    color: '#3498DB',
    inputs: [],
    outputs: [
      { label: 'Value', type: 'data', dataType: 'boolean', isInput: false },
    ],
    defaultData: { value: true },
  },
  {
    type: 'const-vector',
    category: 'variables',
    label: 'Vector',
    description: 'Vector',
    color: '#3498DB',
    inputs: [],
    outputs: [
      { label: 'Value', type: 'data', dataType: 'vector', isInput: false },
    ],
    defaultData: { x: 0, y: 0, z: 0 },
  },
  {
    type: 'const-asset',
    category: 'variables',
    label: 'Asset',
    description: 'Asset reference',
    color: '#3498DB',
    inputs: [],
    outputs: [
      { label: 'Asset', type: 'data', dataType: 'asset', isInput: false },
    ],
    defaultData: { value: '$""' },
  },
  {
    type: 'const-loot-tier',
    category: 'variables',
    label: 'Loot Tier',
    description: 'Loot tier enum value',
    color: '#3498DB',
    inputs: [],
    outputs: [
      { label: 'Tier', type: 'data', dataType: 'number', isInput: false },
    ],
    defaultData: { tier: 'COMMON' },
  },
  {
    type: 'const-supported-attachments',
    category: 'variables',
    label: 'Supported Attachments',
    description: 'Weapon supported attachments list',
    color: '#3498DB',
    inputs: [],
    outputs: [
      { label: 'Attachments', type: 'data', dataType: 'array', isInput: false },
    ],
    defaultData: { attachments: ['barrel', 'mag', 'sight', 'grip', 'hopup'] },
  },
  {
    type: 'const-weapon-type',
    category: 'variables',
    label: 'Weapon Type',
    description: 'Weapon type string',
    color: '#3498DB',
    inputs: [],
    outputs: [
      { label: 'Type', type: 'data', dataType: 'string', isInput: false },
    ],
    defaultData: { weaponType: 'pistol' },
  },
  {
    type: 'const-weapon-slot',
    category: 'weapons',
    label: 'Weapon Slot',
    description: 'Weapon inventory slot constant for GiveWeapon',
    color: '#E67E22',
    inputs: [],
    outputs: [
      { label: 'Slot', type: 'data', dataType: 'int', isInput: false },
    ],
    defaultData: { slot: 'WEAPON_INVENTORY_SLOT_PRIMARY_0' },
    tags: ['weapon', 'slot', 'inventory', 'primary', 'secondary', 'tactical', 'ultimate'],
  },
  {
    type: 'variable-get',
    category: 'variables',
    label: 'Get Variable',
    description: 'Get variable value',
    color: '#3498DB',
    inputs: [
      { label: 'Name', type: 'data', dataType: 'string', isInput: true },
    ],
    outputs: [
      { label: 'Value', type: 'data', dataType: 'any', isInput: false },
    ],
    defaultData: { name: 'myVar' },
  },
  {
    type: 'variable-set',
    category: 'variables',
    label: 'Set Variable',
    description: 'Set variable value',
    color: '#3498DB',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Name', type: 'data', dataType: 'string', isInput: true },
      { label: 'Value', type: 'data', dataType: 'any', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { name: 'myVar' },
  },
  {
    type: 'variable-declare',
    category: 'variables',
    label: 'Declare Variable',
    description: 'Declare a typed local variable',
    color: '#3498DB',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Initial Value', type: 'data', dataType: 'any', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
      { label: 'Variable', type: 'data', dataType: 'any', isInput: false },
    ],
    defaultData: { name: 'myVar', varType: 'var' },
    tags: ['variable', 'declare', 'local', 'let'],
  },
  {
    type: 'define-const',
    category: 'variables',
    label: 'Define Const',
    description: 'Define a constant value. Can be global or local. Generates: [global] const [type] NAME = value',
    color: '#3498DB',
    inputs: [],
    outputs: [
      { label: 'Value', type: 'data', dataType: 'any', isInput: false },
    ],
    defaultData: {
      constName: 'MY_CONSTANT',
      constType: 'int', // int, float, bool, string, vector, asset
      constValue: '100',
      isGlobal: true,
    },
    tags: ['const', 'constant', 'global', 'local', 'define'],
  },
  {
    type: 'global-variable',
    category: 'variables',
    label: 'Make Global',
    description: 'Connect to an array, table, or variable node to make it a global file-level variable (adds "global" prefix)',
    color: '#3498DB',
    inputs: [],
    outputs: [
      { label: 'Exec', type: 'exec', isInput: false },
    ],
    defaultData: {},
    tags: ['global', 'variable', 'array', 'table', 'file', 'level'],
  },
  {
    type: 'local-variable',
    category: 'variables',
    label: 'Make Local',
    description: 'Connect to an array, table, or variable node to make it a file-level variable (no global prefix)',
    color: '#3498DB',
    inputs: [],
    outputs: [
      { label: 'Exec', type: 'exec', isInput: false },
    ],
    defaultData: {},
    tags: ['local', 'variable', 'array', 'table', 'file', 'level'],
  },

  // ==================== ARRAYS ====================
  {
    type: 'array-create',
    category: 'collections',
    label: 'Create Array',
    description: 'Create an empty untyped array: array<var>',
    color: '#2ECC71',
    inputs: [],
    outputs: [
      { label: 'Array', type: 'data', dataType: 'array', isInput: false },
    ],
    defaultData: {},
    tags: ['array', 'create', 'new', 'list'],
  },
  {
    type: 'array-create-typed',
    category: 'collections',
    label: 'Create Typed Array',
    description: 'Create a typed array: array<Type>. Optionally initialize with values.',
    color: '#2ECC71',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
      { label: 'Array', type: 'data', dataType: 'array', isInput: false },
    ],
    defaultData: { 
      varName: '',
      elementType: 'entity',
      initialValues: [], // optional inline initialization
    },
    tags: ['array', 'create', 'typed', 'list'],
  },
  {
    type: 'array-append',
    category: 'collections',
    label: 'Array Append',
    description: 'Append element to end of array (.append)',
    color: '#2ECC71',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Array', type: 'data', dataType: 'array', isInput: true },
      { label: 'Element', type: 'data', dataType: 'any', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
      { label: 'Array', type: 'data', dataType: 'array', isInput: false },
    ],
    defaultData: {},
    tags: ['array', 'append', 'add', 'push'],
  },
  {
    type: 'array-extend',
    category: 'collections',
    label: 'Array Extend',
    description: 'Extend array with elements from another array (.extend)',
    color: '#2ECC71',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Array', type: 'data', dataType: 'array', isInput: true },
      { label: 'Other', type: 'data', dataType: 'array', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
      { label: 'Array', type: 'data', dataType: 'array', isInput: false },
    ],
    defaultData: {},
    tags: ['array', 'extend', 'concat', 'merge'],
  },
  {
    type: 'array-remove',
    category: 'collections',
    label: 'Array Remove',
    description: 'Remove first occurrence of element from array (.remove)',
    color: '#2ECC71',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Array', type: 'data', dataType: 'array', isInput: true },
      { label: 'Element', type: 'data', dataType: 'any', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
      { label: 'Array', type: 'data', dataType: 'array', isInput: false },
    ],
    defaultData: {},
    tags: ['array', 'remove', 'delete'],
  },
  {
    type: 'array-remove-by-index',
    category: 'collections',
    label: 'Array Remove By Index',
    description: 'Remove element at specific index (.remove)',
    color: '#2ECC71',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Array', type: 'data', dataType: 'array', isInput: true },
      { label: 'Index', type: 'data', dataType: 'int', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
      { label: 'Removed', type: 'data', dataType: 'any', isInput: false },
    ],
    defaultData: { index: 0 },
    tags: ['array', 'remove', 'index', 'delete'],
  },
  {
    type: 'array-get',
    category: 'collections',
    label: 'Array Get',
    description: 'Get array element by index (array[index])',
    color: '#2ECC71',
    inputs: [
      { label: 'Array', type: 'data', dataType: 'array', isInput: true },
      { label: 'Index', type: 'data', dataType: 'int', isInput: true },
    ],
    outputs: [
      { label: 'Element', type: 'data', dataType: 'any', isInput: false },
    ],
    defaultData: { index: 0 },
    tags: ['array', 'get', 'index', 'access'],
  },
  {
    type: 'array-set',
    category: 'collections',
    label: 'Array Set',
    description: 'Set array element at index (array[index] = value)',
    color: '#2ECC71',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Array', type: 'data', dataType: 'array', isInput: true },
      { label: 'Index', type: 'data', dataType: 'int', isInput: true },
      { label: 'Value', type: 'data', dataType: 'any', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { index: 0 },
    tags: ['array', 'set', 'index', 'assign'],
  },
  {
    type: 'array-length',
    category: 'collections',
    label: 'Array Length',
    description: 'Get number of elements in array (.len())',
    color: '#2ECC71',
    inputs: [
      { label: 'Array', type: 'data', dataType: 'array', isInput: true },
    ],
    outputs: [
      { label: 'Length', type: 'data', dataType: 'int', isInput: false },
    ],
    defaultData: {},
    tags: ['array', 'length', 'size', 'count'],
  },
  {
    type: 'array-contains',
    category: 'collections',
    label: 'Array Contains',
    description: 'Check if array contains element (.contains)',
    color: '#2ECC71',
    inputs: [
      { label: 'Array', type: 'data', dataType: 'array', isInput: true },
      { label: 'Element', type: 'data', dataType: 'any', isInput: true },
    ],
    outputs: [
      { label: 'Contains', type: 'data', dataType: 'boolean', isInput: false },
    ],
    defaultData: {},
    tags: ['array', 'contains', 'has', 'includes'],
  },
  {
    type: 'array-find',
    category: 'collections',
    label: 'Array Find',
    description: 'Find index of element in array (.find). Returns -1 if not found.',
    color: '#2ECC71',
    inputs: [
      { label: 'Array', type: 'data', dataType: 'array', isInput: true },
      { label: 'Element', type: 'data', dataType: 'any', isInput: true },
    ],
    outputs: [
      { label: 'Index', type: 'data', dataType: 'int', isInput: false },
    ],
    defaultData: {},
    tags: ['array', 'find', 'index', 'search'],
  },
  {
    type: 'array-clear',
    category: 'collections',
    label: 'Array Clear',
    description: 'Remove all elements from array (.clear())',
    color: '#2ECC71',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Array', type: 'data', dataType: 'array', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: {},
    tags: ['array', 'clear', 'empty', 'reset'],
  },
  {
    type: 'array-resize',
    category: 'collections',
    label: 'Array Resize',
    description: 'Resize array to specified length (.resize)',
    color: '#2ECC71',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Array', type: 'data', dataType: 'array', isInput: true },
      { label: 'Size', type: 'data', dataType: 'int', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { size: 10 },
    tags: ['array', 'resize', 'size'],
  },
  {
    type: 'array-randomize',
    category: 'collections',
    label: 'Array Randomize',
    description: 'Shuffle array elements randomly (.randomize)',
    color: '#2ECC71',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Array', type: 'data', dataType: 'array', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
      { label: 'Array', type: 'data', dataType: 'array', isInput: false },
    ],
    defaultData: {},
    tags: ['array', 'randomize', 'shuffle', 'random'],
  },
  {
    type: 'array-getrandom',
    category: 'collections',
    label: 'Array Get Random',
    description: 'Get random element from array (.getrandom)',
    color: '#2ECC71',
    inputs: [
      { label: 'Array', type: 'data', dataType: 'array', isInput: true },
    ],
    outputs: [
      { label: 'Element', type: 'data', dataType: 'any', isInput: false },
    ],
    defaultData: {},
    tags: ['array', 'random', 'getrandom'],
  },
  {
    type: 'array-slice',
    category: 'collections',
    label: 'Array Slice',
    description: 'Get a portion of array (.slice)',
    color: '#2ECC71',
    inputs: [
      { label: 'Array', type: 'data', dataType: 'array', isInput: true },
      { label: 'Start', type: 'data', dataType: 'int', isInput: true },
      { label: 'End', type: 'data', dataType: 'int', isInput: true },
    ],
    outputs: [
      { label: 'Slice', type: 'data', dataType: 'array', isInput: false },
    ],
    defaultData: { start: 0, end: -1 },
    tags: ['array', 'slice', 'sub', 'portion'],
  },

  // ==================== TABLES ====================
  {
    type: 'table-create',
    category: 'collections',
    label: 'Create Table',
    description: 'Create an empty untyped table: table',
    color: '#2ECC71',
    inputs: [],
    outputs: [
      { label: 'Table', type: 'data', dataType: 'table', isInput: false },
    ],
    defaultData: {},
    tags: ['table', 'create', 'new', 'dict', 'map'],
  },
  {
    type: 'table-create-typed',
    category: 'collections',
    label: 'Create Typed Table',
    description: 'Create a typed table: table<KeyType, ValueType>',
    color: '#2ECC71',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
      { label: 'Table', type: 'data', dataType: 'table', isInput: false },
    ],
    defaultData: { 
      varName: '',
      keyType: 'string',
      valueType: 'int',
    },
    tags: ['table', 'create', 'typed', 'dict', 'map'],
  },
  {
    type: 'table-get',
    category: 'collections',
    label: 'Table Get',
    description: 'Get table value by key (table[key])',
    color: '#2ECC71',
    inputs: [
      { label: 'Table', type: 'data', dataType: 'table', isInput: true },
      { label: 'Key', type: 'data', dataType: 'any', isInput: true },
    ],
    outputs: [
      { label: 'Value', type: 'data', dataType: 'any', isInput: false },
    ],
    defaultData: { key: 'key' },
    tags: ['table', 'get', 'access', 'lookup'],
  },
  {
    type: 'table-set',
    category: 'collections',
    label: 'Table Set',
    description: 'Set existing table slot value (table[key] = value). Key must exist.',
    color: '#2ECC71',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Table', type: 'data', dataType: 'table', isInput: true },
      { label: 'Key', type: 'data', dataType: 'any', isInput: true },
      { label: 'Value', type: 'data', dataType: 'any', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { key: 'key' },
    tags: ['table', 'set', 'assign', 'update'],
  },
  {
    type: 'table-add-slot',
    category: 'collections',
    label: 'Table Add Slot',
    description: 'Add new key-value pair to table (table[key] <- value)',
    color: '#2ECC71',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Table', type: 'data', dataType: 'table', isInput: true },
      { label: 'Key', type: 'data', dataType: 'any', isInput: true },
      { label: 'Value', type: 'data', dataType: 'any', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: {},
    tags: ['table', 'add', 'slot', 'insert', 'new'],
  },
  {
    type: 'table-has-key',
    category: 'collections',
    label: 'Table Has Key',
    description: 'Check if table contains key (key in table)',
    color: '#2ECC71',
    inputs: [
      { label: 'Table', type: 'data', dataType: 'table', isInput: true },
      { label: 'Key', type: 'data', dataType: 'any', isInput: true },
    ],
    outputs: [
      { label: 'Has Key', type: 'data', dataType: 'boolean', isInput: false },
    ],
    defaultData: {},
    tags: ['table', 'has', 'key', 'contains', 'in'],
  },
  {
    type: 'table-delete',
    category: 'collections',
    label: 'Table Delete',
    description: 'Remove key-value pair from table (delete table[key])',
    color: '#2ECC71',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Table', type: 'data', dataType: 'table', isInput: true },
      { label: 'Key', type: 'data', dataType: 'any', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: {},
    tags: ['table', 'delete', 'remove', 'key'],
  },
  {
    type: 'table-keys',
    category: 'collections',
    label: 'Table Keys',
    description: 'Get array of all keys in table',
    color: '#2ECC71',
    inputs: [
      { label: 'Table', type: 'data', dataType: 'table', isInput: true },
    ],
    outputs: [
      { label: 'Keys', type: 'data', dataType: 'array', isInput: false },
    ],
    defaultData: {},
    tags: ['table', 'keys', 'list'],
  },
  {
    type: 'table-values',
    category: 'collections',
    label: 'Table Values',
    description: 'Get array of all values in table',
    color: '#2ECC71',
    inputs: [
      { label: 'Table', type: 'data', dataType: 'table', isInput: true },
    ],
    outputs: [
      { label: 'Values', type: 'data', dataType: 'array', isInput: false },
    ],
    defaultData: {},
    tags: ['table', 'values', 'list'],
  },
  {
    type: 'table-clear',
    category: 'collections',
    label: 'Table Clear',
    description: 'Remove all entries from table (.clear())',
    color: '#2ECC71',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Table', type: 'data', dataType: 'table', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: {},
    tags: ['table', 'clear', 'empty', 'reset'],
  },

  // ==================== UTILITIES ====================
  {
    type: 'print',
    category: 'debug',
    label: 'Print',
    description: 'Print message to console (no newline)',
    color: '#E74C3C',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Message', type: 'data', dataType: 'string', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: {},
    tags: ['print', 'debug', 'log', 'console'],
    documentation: {
      longDescription: 'Prints a message to the game console for debugging. Does not add a newline - use Printl for newlines or Printf for formatted output.',
      codeExample: `// Simple print\nprint( "Hello World" )\n\n// Print with variable\nprint( "Player: " + player.GetPlayerName() )`,
      tips: [
        'Use for quick debugging during development',
        'Combine with string concatenation for variable output',
        'Check console with ~ key in-game',
        'Use Printl for newlines, Printf for complex formatting'
      ],
      useCases: [
        'Debug script execution flow',
        'Output variable values for testing',
        'Log events during development',
        'Trace function calls'
      ],
      relatedNodes: ['printl', 'printf', 'printt', 'code-warning']
    }
  },
  {
    type: 'printf',
    category: 'debug',
    label: 'Printf',
    description: 'Print message to console (auto-concatenates all parts)',
    color: '#E74C3C',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Part 0', type: 'data', dataType: 'any', isInput: true },
      { label: 'Part 1', type: 'data', dataType: 'any', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { partCount: 2 },
  },
  {
    type: 'printt',
    category: 'debug',
    label: 'Printt',
    description: 'Print message with table formatting (prints tables/arrays nicely)',
    color: '#E74C3C',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Value', type: 'data', dataType: 'any', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: {},
    tags: ['print', 'debug', 'table', 'array', 'log'],
  },
  {
    type: 'printl',
    category: 'debug',
    label: 'Printl',
    description: 'Print message with newline (adds \\n at end)',
    color: '#E74C3C',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Message', type: 'data', dataType: 'string', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: {},
    tags: ['print', 'debug', 'newline', 'log'],
  },
  {
    type: 'get-game-time',
    category: 'utilities',
    label: 'Time',
    description: 'Get current game time',
    color: '#F39C12',
    inputs: [],
    outputs: [
      { label: 'Time', type: 'data', dataType: 'number', isInput: false },
    ],
    defaultData: {},
  },
  {
    type: 'get-frame-time',
    category: 'utilities',
    label: 'FrameTime',
    description: 'Get frame delta time',
    color: '#F39C12',
    inputs: [],
    outputs: [
      { label: 'FrameTime', type: 'data', dataType: 'number', isInput: false },
    ],
    defaultData: {},
  },
  {
    type: 'get-map-name',
    category: 'utilities',
    label: 'GetMapName',
    description: 'Get current map name',
    color: '#F39C12',
    inputs: [],
    outputs: [
      { label: 'MapName', type: 'data', dataType: 'string', isInput: false },
    ],
    defaultData: {},
  },
  {
    type: 'get-all-players',
    category: 'utilities',
    label: 'GetPlayerArray',
    description: 'Get all players',
    color: '#F39C12',
    inputs: [],
    outputs: [
      { label: 'Players', type: 'data', dataType: 'array', isInput: false },
    ],
    defaultData: {},
  },
  {
    type: 'get-players-on-team',
    category: 'utilities',
    label: 'GetPlayersOnTeam',
    description: 'Get all players on a team',
    color: '#F39C12',
    inputs: [
      { label: 'Team', type: 'data', dataType: 'int', isInput: true },
    ],
    outputs: [
      { label: 'Players', type: 'data', dataType: 'array', isInput: false },
    ],
    defaultData: { team: 1 },
  },
  {
    type: 'get-living-players',
    category: 'utilities',
    label: 'GetLivingPlayers',
    description: 'Get all living players',
    color: '#F39C12',
    inputs: [],
    outputs: [
      { label: 'Players', type: 'data', dataType: 'array', isInput: false },
    ],
    defaultData: {},
  },
  {
    type: 'get-living-players-on-team',
    category: 'utilities',
    label: 'GetLivingPlayersOnTeam',
    description: 'Get living players on a team',
    color: '#F39C12',
    inputs: [
      { label: 'Team', type: 'data', dataType: 'int', isInput: true },
    ],
    outputs: [
      { label: 'Players', type: 'data', dataType: 'array', isInput: false },
    ],
    defaultData: { team: 1 },
  },
  {
    type: 'get-local-player',
    category: 'entity',
    label: 'GetLocalPlayer',
    description: 'Get the local client player (#if CLIENT)',
    color: '#34495E',
    inputs: [],
    outputs: [
      { label: 'Player', type: 'data', dataType: 'player', isInput: false },
    ],
    defaultData: {},
    clientOnly: true,
  },
  {
    type: 'get-local-view-player',
    category: 'entity',
    label: 'GetLocalViewPlayer',
    description: 'Get the local view player (#if CLIENT)',
    color: '#34495E',
    inputs: [],
    outputs: [
      { label: 'Player', type: 'data', dataType: 'player', isInput: false },
    ],
    defaultData: {},
    clientOnly: true,
  },
  {
    type: 'get-entity-by-script-name',
    category: 'utilities',
    label: 'GetEntByScriptName',
    description: 'Get entity by script name',
    color: '#F39C12',
    inputs: [
      { label: 'ScriptName', type: 'data', dataType: 'string', isInput: true },
    ],
    outputs: [
      { label: 'Entity', type: 'data', dataType: 'entity', isInput: false },
    ],
    defaultData: { scriptName: 'my_entity' },
  },
  {
    type: 'precache-model',
    category: 'utilities',
    label: 'PrecacheModel',
    description: 'Precache model asset',
    color: '#F39C12',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Model', type: 'data', dataType: 'asset', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { model: '$""' },
  },
  {
    type: 'precache-weapon',
    category: 'utilities',
    label: 'PrecacheWeapon',
    description: 'Precache weapon',
    color: '#F39C12',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'WeaponClass', type: 'data', dataType: 'string', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { weaponClass: 'mp_weapon_custom' },
  },
  {
    type: 'globalize-function',
    category: 'utilities',
    label: 'GlobalizeFunction',
    description: 'Make function globally accessible',
    color: '#F39C12',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Function', type: 'data', dataType: 'function', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: {},
  },
  {
    type: 'function-ref',
    category: 'utilities',
    label: 'Function Reference',
    description: 'Reference to function',
    color: '#F39C12',
    inputs: [],
    outputs: [
      { label: 'Function', type: 'data', dataType: 'function', isInput: false },
    ],
    defaultData: { functionName: 'MyFunction' },
  },
  {
    type: 'get-ent-by-index',
    category: 'utilities',
    label: 'GetEntByIndex',
    description: 'Get entity by index',
    color: '#F39C12',
    inputs: [
      { label: 'Index', type: 'data', dataType: 'int', isInput: true },
    ],
    outputs: [
      { label: 'Entity', type: 'data', dataType: 'entity', isInput: false },
    ],
    defaultData: { index: 1 },
  },
  {
    type: 'get-player-by-index',
    category: 'utilities',
    label: 'GetPlayerByIndex',
    description: 'Get player entity by index (gp()[index])',
    color: '#F39C12',
    inputs: [
      { label: 'Index', type: 'data', dataType: 'int', isInput: true },
    ],
    outputs: [
      { label: 'Player', type: 'data', dataType: 'player', isInput: false },
    ],
    defaultData: { index: 0 },
  },
  {
    type: 'get-offhand-weapon',
    category: 'weapons',
    label: 'GetOffhandWeapon',
    description: 'Get player offhand weapon by slot',
    color: '#E67E22',
    inputs: [
      { label: 'Player', type: 'data', dataType: 'player', isInput: true },
      { label: 'Slot', type: 'data', dataType: 'int', isInput: true },
    ],
    outputs: [
      { label: 'Weapon', type: 'data', dataType: 'weapon', isInput: false },
    ],
    defaultData: { slot: 0 },
  },
  {
    type: 'get-weapon-primary-clip-count',
    category: 'weapons',
    label: 'GetWeaponPrimaryClipCount',
    description: 'Get weapon primary clip count',
    color: '#E67E22',
    inputs: [
      { label: 'Weapon', type: 'data', dataType: 'weapon', isInput: true },
    ],
    outputs: [
      { label: 'Count', type: 'data', dataType: 'int', isInput: false },
    ],
    defaultData: {},
  },
  {
    type: 'get-weapon-ammo-pool-type',
    category: 'weapons',
    label: 'GetWeaponAmmoPoolType',
    description: 'Get weapon ammo pool type ID',
    color: '#E67E22',
    inputs: [
      { label: 'Weapon', type: 'data', dataType: 'weapon', isInput: true },
    ],
    outputs: [
      { label: 'PoolType', type: 'data', dataType: 'int', isInput: false },
    ],
    defaultData: {},
  },
  {
    type: 'ammo-type-get-ref-from-index',
    category: 'weapons',
    label: 'AmmoType_GetRefFromIndex',
    description: 'Get ammo type reference string from pool type index',
    color: '#E67E22',
    inputs: [
      { label: 'PoolType', type: 'data', dataType: 'int', isInput: true },
    ],
    outputs: [
      { label: 'AmmoType', type: 'data', dataType: 'string', isInput: false },
    ],
    defaultData: { poolType: 0 },
  },
  {
    type: 'create-trigger-cylinder',
    category: 'entity-creation',
    label: 'Create Trigger Cylinder',
    description: 'Create a cylindrical trigger volume',
    color: '#27AE60',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Origin', type: 'data', dataType: 'vector', isInput: true },
      { label: 'Angles', type: 'data', dataType: 'vector', isInput: true },
      { label: 'Radius', type: 'data', dataType: 'float', isInput: true },
      { label: 'AboveHeight', type: 'data', dataType: 'float', isInput: true },
      { label: 'BelowHeight', type: 'data', dataType: 'float', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
      { label: 'Trigger', type: 'data', dataType: 'entity', isInput: false },
    ],
    defaultData: { radius: 100, aboveHeight: 100, belowHeight: 100 },
    serverOnly: true,
  },
  {
    type: 'create-trigger-radius-multiple',
    category: 'entity-creation',
    label: 'Create Trigger Radius Multiple',
    description: 'Create a trigger with multiple radius points',
    color: '#27AE60',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Origin', type: 'data', dataType: 'vector', isInput: true },
      { label: 'Angles', type: 'data', dataType: 'vector', isInput: true },
      { label: 'Radius', type: 'data', dataType: 'float', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
      { label: 'Trigger', type: 'data', dataType: 'entity', isInput: false },
    ],
    defaultData: { radius: 100 },
    serverOnly: true,
  },
  {
    type: 'trigger-set-enabled',
    category: 'entity',
    label: 'SetTriggerEnabled',
    description: 'Enable or disable trigger',
    color: '#27AE60',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Trigger', type: 'data', dataType: 'entity', isInput: true },
      { label: 'Enabled', type: 'data', dataType: 'boolean', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { enabled: true },
    serverOnly: true,
  },
  {
    type: 'trigger-set-radius',
    category: 'entity',
    label: 'SetRadius',
    description: 'Set trigger radius',
    color: '#27AE60',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Trigger', type: 'data', dataType: 'entity', isInput: true },
      { label: 'Radius', type: 'data', dataType: 'float', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { radius: 100 },
    serverOnly: true,
  },
  {
    type: 'trigger-set-above-height',
    category: 'entity',
    label: 'SetAboveHeight',
    description: 'Set trigger height above origin',
    color: '#27AE60',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Trigger', type: 'data', dataType: 'entity', isInput: true },
      { label: 'Height', type: 'data', dataType: 'float', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { height: 100 },
    serverOnly: true,
  },
  {
    type: 'trigger-set-below-height',
    category: 'entity',
    label: 'SetBelowHeight',
    description: 'Set trigger height below origin',
    color: '#27AE60',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Trigger', type: 'data', dataType: 'entity', isInput: true },
      { label: 'Height', type: 'data', dataType: 'float', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { height: 100 },
    serverOnly: true,
  },
  {
    type: 'trigger-set-enter-callback',
    category: 'entity',
    label: 'SetEnterCallback',
    description: 'Set callback when entity enters trigger',
    color: '#27AE60',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Trigger', type: 'data', dataType: 'entity', isInput: true },
      { label: 'Callback', type: 'data', dataType: 'function', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { callback: 'OnTriggerEnter' },
    serverOnly: true,
  },
  {
    type: 'trigger-set-leave-callback',
    category: 'entity',
    label: 'SetLeaveCallback',
    description: 'Set callback when entity leaves trigger',
    color: '#27AE60',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Trigger', type: 'data', dataType: 'entity', isInput: true },
      { label: 'Callback', type: 'data', dataType: 'function', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { callback: 'OnTriggerLeave' },
    serverOnly: true,
  },
  {
    type: 'trigger-search-new-touching',
    category: 'entity',
    label: 'SearchForNewTouchingEntity',
    description: 'Force trigger to search for entities currently inside',
    color: '#27AE60',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Trigger', type: 'data', dataType: 'entity', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: {},
    serverOnly: true,
  },
  {
    type: 'take-primary-weapon',
    category: 'weapons',
    label: 'TakePrimaryWeapon',
    description: 'Remove primary weapon from player',
    color: '#E67E22',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Player', type: 'data', dataType: 'player', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: {},
    serverOnly: true,
  },
  {
    type: 'set-active-weapon-by-name',
    category: 'weapons',
    label: 'SetActiveWeaponByName',
    description: 'Set active weapon by slot and weapon name',
    color: '#E67E22',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Player', type: 'data', dataType: 'player', isInput: true },
      { label: 'Slot', type: 'data', dataType: 'int', isInput: true },
      { label: 'WeaponName', type: 'data', dataType: 'string', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { slot: 0, weaponName: 'mp_weapon_r97' },
    serverOnly: true,
  },

  // ==================== PASSIVES ====================
  {
    type: 'give-passive',
    category: 'passives',
    label: 'GivePassive',
    description: 'Give passive ability to player',
    color: '#9B59B6',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Player', type: 'data', dataType: 'player', isInput: true },
      { label: 'Passive', type: 'data', dataType: 'int', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { passive: 'ePassives.PAS_FAST_HEAL' },
    serverOnly: true,
  },
  {
    type: 'take-passive',
    category: 'passives',
    label: 'TakePassive',
    description: 'Remove passive ability from player',
    color: '#9B59B6',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Player', type: 'data', dataType: 'player', isInput: true },
      { label: 'Passive', type: 'data', dataType: 'int', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { passive: 'ePassives.PAS_FAST_HEAL' },
    serverOnly: true,
  },
  {
    type: 'take-all-passives',
    category: 'passives',
    label: 'TakeAllPassives',
    description: 'Remove all passive abilities from player',
    color: '#9B59B6',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Player', type: 'data', dataType: 'player', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: {},
    serverOnly: true,
  },
  {
    type: 'get-all-passives-for-player',
    category: 'passives',
    label: 'GetAllPassivesForPlayer',
    description: 'Get array of all passive ability indices for player',
    color: '#9B59B6',
    inputs: [
      { label: 'Player', type: 'data', dataType: 'player', isInput: true },
    ],
    outputs: [
      { label: 'Passives', type: 'data', dataType: 'array', isInput: false },
    ],
    defaultData: {},
    serverOnly: true,
  },
  {
    type: 'player-has-passive',
    category: 'passives',
    label: 'PlayerHasPassive',
    description: 'Check if player has a specific passive ability',
    color: '#9B59B6',
    inputs: [
      { label: 'Player', type: 'data', dataType: 'player', isInput: true },
      { label: 'Passive', type: 'data', dataType: 'int', isInput: true },
    ],
    outputs: [
      { label: 'HasPassive', type: 'data', dataType: 'boolean', isInput: false },
    ],
    defaultData: { passive: 'ePassives.PAS_FAST_HEAL' },
  },

  // ==================== CHARACTER ABILITIES ====================
  {
    type: 'character-get-tactical-ability',
    category: 'character',
    label: 'CharacterClass_GetTacticalAbility',
    description: 'Get tactical ability ItemFlavor for a character',
    color: '#3498DB',
    inputs: [
      { label: 'Character', type: 'data', dataType: 'itemflavor', isInput: true },
    ],
    outputs: [
      { label: 'Ability', type: 'data', dataType: 'itemflavor', isInput: false },
    ],
    defaultData: {},
  },
  {
    type: 'character-get-ultimate-ability',
    category: 'character',
    label: 'CharacterClass_GetUltimateAbility',
    description: 'Get ultimate ability ItemFlavor for a character',
    color: '#3498DB',
    inputs: [
      { label: 'Character', type: 'data', dataType: 'itemflavor', isInput: true },
    ],
    outputs: [
      { label: 'Ability', type: 'data', dataType: 'itemflavor', isInput: false },
    ],
    defaultData: {},
  },
  {
    type: 'character-get-passive-ability',
    category: 'character',
    label: 'CharacterClass_GetPassiveAbility',
    description: 'Get passive ability ItemFlavor for a character',
    color: '#3498DB',
    inputs: [
      { label: 'Character', type: 'data', dataType: 'itemflavor', isInput: true },
    ],
    outputs: [
      { label: 'Ability', type: 'data', dataType: 'itemflavor', isInput: false },
    ],
    defaultData: {},
  },

  // ==================== SURVIVAL LOOT ====================
  {
    type: 'survival-get-all-loot',
    category: 'survival',
    label: 'SURVIVAL_Loot_GetAllLoot',
    description: 'Get array of all loot entities in the level',
    color: '#27AE60',
    inputs: [],
    outputs: [
      { label: 'LootArray', type: 'data', dataType: 'array', isInput: false },
    ],
    defaultData: {},
  },
  {
    type: 'survival-pickup-item',
    category: 'survival',
    label: 'Survival_PickupItem',
    description: 'Attempt to pick up a loot item for a player',
    color: '#27AE60',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Loot', type: 'data', dataType: 'entity', isInput: true },
      { label: 'Player', type: 'data', dataType: 'player', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
      { label: 'Success', type: 'data', dataType: 'boolean', isInput: false },
    ],
    defaultData: {},
    serverOnly: true,
  },
  {
    type: 'survival-add-to-inventory',
    category: 'survival',
    label: 'SURVIVAL_AddToPlayerInventory',
    description: 'Add item to player inventory by reference',
    color: '#27AE60',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Player', type: 'data', dataType: 'player', isInput: true },
      { label: 'ItemRef', type: 'data', dataType: 'string', isInput: true },
      { label: 'Count', type: 'data', dataType: 'int', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
      { label: 'AmountAdded', type: 'data', dataType: 'int', isInput: false },
    ],
    defaultData: { itemRef: '', count: 1 },
    serverOnly: true,
  },
  {
    type: 'survival-remove-from-inventory',
    category: 'survival',
    label: 'SURVIVAL_RemoveFromPlayerInventory',
    description: 'Remove item from player inventory by reference',
    color: '#27AE60',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Player', type: 'data', dataType: 'player', isInput: true },
      { label: 'ItemRef', type: 'data', dataType: 'string', isInput: true },
      { label: 'Count', type: 'data', dataType: 'int', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { itemRef: '', count: 1 },
    serverOnly: true,
  },
  {
    type: 'survival-get-player-inventory',
    category: 'survival',
    label: 'SURVIVAL_GetPlayerInventory',
    description: 'Get player inventory as array of ConsumableInventoryItem',
    color: '#27AE60',
    inputs: [
      { label: 'Player', type: 'data', dataType: 'player', isInput: true },
    ],
    outputs: [
      { label: 'Inventory', type: 'data', dataType: 'array', isInput: false },
    ],
    defaultData: {},
  },
  {
    type: 'survival-count-items-in-inventory',
    category: 'survival',
    label: 'SURVIVAL_CountItemsInInventory',
    description: 'Count how many of a specific item player has in inventory',
    color: '#27AE60',
    inputs: [
      { label: 'Player', type: 'data', dataType: 'player', isInput: true },
      { label: 'ItemRef', type: 'data', dataType: 'string', isInput: true },
    ],
    outputs: [
      { label: 'Count', type: 'data', dataType: 'int', isInput: false },
    ],
    defaultData: { itemRef: '' },
  },
  {
    type: 'survival-has-item-in-inventory',
    category: 'survival',
    label: 'SURVIVAL_HasSpecificItemInInventory',
    description: 'Check if player has at least a certain count of an item',
    color: '#27AE60',
    inputs: [
      { label: 'Player', type: 'data', dataType: 'player', isInput: true },
      { label: 'ItemRef', type: 'data', dataType: 'string', isInput: true },
      { label: 'Count', type: 'data', dataType: 'int', isInput: true },
    ],
    outputs: [
      { label: 'HasItem', type: 'data', dataType: 'boolean', isInput: false },
    ],
    defaultData: { itemRef: '', count: 1 },
  },

  // ==================== ASSERT NODES ====================
  {
    type: 'assert',
    category: 'debug',
    label: 'Assert',
    description: 'Assert that a condition is true. If false, halts execution with error message.',
    color: '#E74C3C',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Condition', type: 'data', dataType: 'boolean', isInput: true },
      { label: 'Message', type: 'data', dataType: 'string', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { message: 'Assertion failed' },
    tags: ['assert', 'debug', 'validation', 'error'],
  },
  {
    type: 'assert-true',
    category: 'debug',
    label: 'Assert True',
    description: 'Assert that a boolean value is true',
    color: '#E74C3C',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Value', type: 'data', dataType: 'boolean', isInput: true },
      { label: 'Message', type: 'data', dataType: 'string', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { message: 'Value must be true' },
    tags: ['assert', 'debug', 'validation', 'boolean'],
  },
  {
    type: 'assert-false',
    category: 'debug',
    label: 'Assert False',
    description: 'Assert that a boolean value is false',
    color: '#E74C3C',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Value', type: 'data', dataType: 'boolean', isInput: true },
      { label: 'Message', type: 'data', dataType: 'string', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { message: 'Value must be false' },
    tags: ['assert', 'debug', 'validation', 'boolean'],
  },
  {
    type: 'assert-not-null',
    category: 'debug',
    label: 'Assert Not Null',
    description: 'Assert that a value is not null',
    color: '#E74C3C',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Value', type: 'data', dataType: 'any', isInput: true },
      { label: 'Message', type: 'data', dataType: 'string', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { message: 'Value must not be null' },
    tags: ['assert', 'debug', 'validation', 'null'],
  },
  {
    type: 'assert-not-equal',
    category: 'debug',
    label: 'Assert Not Equal',
    description: 'Assert that two values are not equal',
    color: '#E74C3C',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Value A', type: 'data', dataType: 'any', isInput: true },
      { label: 'Value B', type: 'data', dataType: 'any', isInput: true },
      { label: 'Message', type: 'data', dataType: 'string', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { message: 'Values must not be equal' },
    tags: ['assert', 'debug', 'validation', 'comparison'],
  },
  {
    type: 'assert-equal',
    category: 'debug',
    label: 'Assert Equal',
    description: 'Assert that two values are equal',
    color: '#E74C3C',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Value A', type: 'data', dataType: 'any', isInput: true },
      { label: 'Value B', type: 'data', dataType: 'any', isInput: true },
      { label: 'Message', type: 'data', dataType: 'string', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { message: 'Values must be equal' },
    tags: ['assert', 'debug', 'validation', 'comparison'],
  },
  {
    type: 'assert-valid',
    category: 'debug',
    label: 'Assert Valid',
    description: 'Assert that an entity is valid',
    color: '#E74C3C',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Entity', type: 'data', dataType: 'entity', isInput: true },
      { label: 'Message', type: 'data', dataType: 'string', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { message: 'Entity must be valid' },
    serverOnly: true,
    tags: ['assert', 'debug', 'validation', 'entity', 'isvalid'],
  },
  {
    type: 'assert-alive',
    category: 'debug',
    label: 'Assert Alive',
    description: 'Assert that an entity is alive',
    color: '#E74C3C',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Entity', type: 'data', dataType: 'entity', isInput: true },
      { label: 'Message', type: 'data', dataType: 'string', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { message: 'Entity must be alive' },
    serverOnly: true,
    tags: ['assert', 'debug', 'validation', 'entity', 'isalive'],
  },
  {
    type: 'assert-is-player',
    category: 'debug',
    label: 'Assert Is Player',
    description: 'Assert that an entity is a player',
    color: '#E74C3C',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Entity', type: 'data', dataType: 'entity', isInput: true },
      { label: 'Message', type: 'data', dataType: 'string', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { message: 'Entity must be a player' },
    serverOnly: true,
    tags: ['assert', 'debug', 'validation', 'entity', 'isplayer'],
  },
  {
    type: 'assert-is-npc',
    category: 'debug',
    label: 'Assert Is NPC',
    description: 'Assert that an entity is an NPC',
    color: '#E74C3C',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Entity', type: 'data', dataType: 'entity', isInput: true },
      { label: 'Message', type: 'data', dataType: 'string', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { message: 'Entity must be an NPC' },
    serverOnly: true,
    tags: ['assert', 'debug', 'validation', 'entity', 'isnpc'],
  },
  {
    type: 'assert-is-titan',
    category: 'debug',
    label: 'Assert Is Titan',
    description: 'Assert that an entity is a Titan',
    color: '#E74C3C',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Entity', type: 'data', dataType: 'entity', isInput: true },
      { label: 'Message', type: 'data', dataType: 'string', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { message: 'Entity must be a Titan' },
    serverOnly: true,
    tags: ['assert', 'debug', 'validation', 'entity', 'istitan'],
  },
  {
    type: 'assert-is-pilot',
    category: 'debug',
    label: 'Assert Is Pilot',
    description: 'Assert that an entity is a Pilot',
    color: '#E74C3C',
    inputs: [
      { label: 'In', type: 'exec', isInput: true },
      { label: 'Entity', type: 'data', dataType: 'entity', isInput: true },
      { label: 'Message', type: 'data', dataType: 'string', isInput: true },
    ],
    outputs: [
      { label: 'Out', type: 'exec', isInput: false },
    ],
    defaultData: { message: 'Entity must be a Pilot' },
    serverOnly: true,
    tags: ['assert', 'debug', 'validation', 'entity', 'ispilot'],
  },
];

export function getNodeDefinition(type: string): NodeDefinition | undefined {
  return NODE_DEFINITIONS.find(def => def.type === type);
}

export function getNodesByCategory(category: string): NodeDefinition[] {
  return NODE_DEFINITIONS
    .filter(def => def.category === category)
    .sort((a, b) => a.label.localeCompare(b.label));
}
