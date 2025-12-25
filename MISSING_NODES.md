# Missing Visual Scripting Nodes

This document lists all functions from the R5V game scripts that should be implemented as visual scripting nodes but are currently missing from the project.

## Priority Legend
- 🔴 **HIGH**: Critical game systems that modders need frequently
- 🟡 **MEDIUM**: Important systems that are commonly used
- 🟢 **LOW**: Specialized systems or less frequently needed functions

---

## 1. Survival/Loot System (`sh_survival_loot.gnut`)

### 🔴 HIGH PRIORITY - Loot Management
| Function | Description |
|----------|-------------|
| `SURVIVAL_Loot_GetAllLoot()` | Get array of all loot entities in level |
| `Survival_PickupItem(entity loot, entity player)` | Attempt to pick up loot item |
| `SURVIVAL_AddToPlayerInventory(entity player, string ref, int count)` | Add item to player inventory |
| `SURVIVAL_RemoveFromPlayerInventory(entity player, string ref, int count)` | Remove item from inventory |
| `SURVIVAL_GetPlayerInventory(entity player)` | Get player's inventory table |
| `SURVIVAL_CountItemsInInventory(entity player, string ref)` | Count specific item in inventory |
| `SURVIVAL_HasSpecificItemInInventory(entity player, string ref)` | Check if player has item |

### 🔴 HIGH PRIORITY - Weapon/Attachment
| Function | Description |
|----------|-------------|
| `SURVIVAL_GetActiveWeapon(entity player)` | Get player's currently equipped weapon |
| `SURVIVAL_GetWeaponBySlot(entity player, int slot)` | Get weapon in specific slot |
| `SURVIVAL_GetActiveWeaponSlot(entity player)` | Get current weapon slot index |
| `SURVIVAL_GetPrimaryWeaponRefs(entity player)` | Get all primary weapon references |
| `SURVIVAL_CountPrimaryWeapons(entity player)` | Count primary weapons carried |
| `SURVIVAL_GetWeaponAttachmentForPoint(entity weapon, string point)` | Get attachment on weapon slot |
| `GetAttachPointsForAttachment(string attachmentRef)` | Get valid attachment points for mod |
| `GetAttachPointForAttachmentOnWeapon(string attachment, string weapon)` | Get attachment point on weapon |
| `CanAttachmentEquipToAttachPoint(string mod, string point)` | Check if mod fits slot |
| `IsAttachmentAmbiguousForWeapon(string mod, string weapon, array points)` | Check if attachment is ambiguous |
| `GetWeaponAmmoType(entity weapon)` | Get ammo type for weapon |
| `GetWeaponAmmoTypeFromWeaponEnt(entity weapon)` | Get ammo type from weapon entity |
| `IsValidAttachment(string ref)` | Validate attachment reference |
| `GetAttachmentData(string ref)` | Get attachment data struct |
| `GetInstalledWeaponAttachmentForPoint(entity weapon, string point)` | Get installed attachment |
| `GetAllWeaponAttachments(entity weapon)` | Get all attachments on weapon |
| `IsAttachmentAnUpgrade(string mod, entity player, entity weapon)` | Check if mod is upgrade |
| `IsAttachmentAnUpgradeForWeapon(string mod, string weaponRef)` | Check if mod upgrades weapon |
| `CanPlayerLoot(entity player)` | Check if player can loot |
| `SURVIVAL_CanPlayerPickup(entity player, entity loot)` | Check if player can pickup |
| `SURVIVAL_PlayerAllowedToPickup(entity player, entity loot)` | Check pickup permission |

### 🟡 MEDIUM PRIORITY - Loot Data & Types
| Function | Description |
|----------|-------------|
| `SURVIVAL_Loot_GetGeneralTypeStringFromType(int lootType)` | Get type string for loot type |
| `SURVIVAL_Loot_GetDetailTypeStringFromRef(string ref)` | Get detailed type string from ref |
| `SURVIVAL_Loot_GetHealthPickupTypeFromRef(string ref)` | Get health pickup type |
| `SURVIVAL_Loot_GetHealthPickupRefFromType(int type)` | Get ref from health pickup type |
| `SURVIVAL_Loot_GetHealthKitDataFromStruct(int kitType)` | Get health kit data |
| `SURVIVAL_Loot_GetTotalHealthItems(entity player, int checkType)` | Count health items |
| `SURVIVAL_GetBestHealthPickupType(entity player)` | Get best health pickup for player |
| `SURVIVAL_GetPotentialAppliedHealing(entity player)` | Calculate potential healing |
| `SURVIVAL_CreateKitHealData(entity player, int kitType)` | Create healing data struct |
| `GetCategoryTitleFromPriority(int priority)` | Get title for priority |
| `SortByPriorityThenTier(array loot)` | Sort loot by priority then tier |
| `GetPriorityForLootType(int lootType)` | Get priority for loot type |
| `IsAmmoInUse(string ammoRef)` | Check if ammo type in use |
| `FS_GetWeaponsThatUseThisAmmo(string ammoRef)` | Get weapons using ammo |
| `SURVIVAL_IsLootIrrelevant(entity player, entity loot)` | Check if loot irrelevant |
| `SURVIVAL_IsLootAnUpgrade(entity player, entity loot)` | Check if loot is upgrade |
| `SURVIVAL_IsLootRefAnUpgrade(entity player, string ref)` | Check if ref is upgrade |

### 🟡 MEDIUM PRIORITY - Actions & UI
| Function | Description |
|----------|-------------|
| `SURVIVAL_GetActionForGroundItem(entity loot)` | Get action for ground item |
| `SURVIVAL_GetActionForEquipment(entity equipment)` | Get action for equipment |
| `SURVIVAL_GetAltActionForEquipment(entity equipment)` | Get alt action for equipment |
| `SURVIVAL_GetActionForBackpackItem(entity item)` | Get action for backpack item |
| `SURVIVAL_GetAltActionForBackpackItem(entity item)` | Get alt backpack action |
| `SURVIVAL_GetActionForAttachment(string attachment)` | Get action for attachment |
| `SURVIVAL_GetActionForItem(string ref)` | Get action for item |
| `SURVIVAL_GetActionForBackpackItem(entity item)` | Get backpack action |
| `SURVIVAL_CreateLootRef(entity lootEnt, int count, LootData data)` | Create loot ref struct |
| `SURVIVAL_GetPlayerShieldHealthFromArmor(entity player)` | Get shield from armor |
| `SURVIVAL_GetArmorShieldCapacity(int armorTier)` | Get shield capacity for tier |
| `SURVIVAL_GetInventorySlotCountForPlayer(entity player)` | Get total inventory slots |
| `SURVIVAL_GetMaxInventoryLimit(entity player)` | Get max inventory limit |
| `SURVIVAL_GetInventoryLimit(entity player)` | Get current inventory limit |
| `SURVIVAL_GetInventoryCount(entity player)` | Get used inventory count |
| `SURVIVAL_CountSquaresInInventory(entity player)` | Count inventory squares |

### 🟢 LOW PRIORITY - Advanced Inventory
| Function | Description |
|----------|-------------|
| `SURVIVAL_AltUseSwapsWeapon()` | Check if alt use swaps weapon |
| `SURVIVAL_GetCountToFillStack(entity player, string ref)` | Get items to fill stack |
| `SURVIVAL_CanDismantleMods(entity player)` | Check if can dismantle mods |
| `SURVIVAL_CanReplaceWeapon(entity player, string newWeapon)` | Check weapon replacement |
| `SURVIVAL_GetModToRemoveForAttachment(entity player, string attachment)` | Get mod to remove |
| `SURVIVAL_CanQuickAttach(entity player, string attachment)` | Check quick attach |
| `SURVIVAL_CanQuickAttachWithMod(entity player, string attachment)` | Check quick attach with mod |
| `SURVIVAL_CanAddModToWeapon(entity player, string weapon, string mod)` | Check if can add mod |
| `SURVIVAL_GetLootDataFromWeapon(entity weapon)` | Get loot data from weapon |
| `SURVIVAL_Weapon_IsAttachmentLocked(entity weapon, string mod)` | Check if attachment locked |
| `SURVIVAL_IsAttachmentPointLocked(entity weapon, string point)` | Check if point locked |
| `SURVIVAL_Weapon_IsFullyKitted(entity weapon)` | Check if weapon fully kitted |
| `SURVIVAL_Weapon_GetBaseMods(string weaponRef)` | Get base mods for weapon |
| `SURVIVAL_GetStowedWeaponSlot(entity player)` | Get stowed weapon slot |
| `SURVIVAL_GetPrimaryWeapons(entity player)` | Get all primary weapons |
| `SURVIVAL_GetPrimaryWeaponsSorted(entity player)` | Get sorted primary weapons |
| `SURVIVAL_GetAllPlayerOrdnance(entity player)` | Get all ordnance for player |
| `SURVIVAL_PlayerCanUse_AnimatedInteraction(entity player, entity target)` | Check animated interaction |
| `SURVIVAL_PlayerCanSwitchOrdnance(entity player)` | Check ordnance switch |
| `SURVIVAL_IsPlayerCarryingLoot(entity player)` | Check if carrying loot |
| `SURVIVAL_IsKnownLootItem(string ref)` | Check if loot item is known |
| `GetStringForTagId(int tagId)` | Get string for tag ID |
| `GetCompatibleAttachmentsFromInventory(entity player, string weapon)` | Get compatible mods |
| `GetCompatibleAttachmentsFromWeapon(string weaponRef, string point)` | Get compatible mods for weapon |
| `GetCompatibleAttachmentMap(entity player)` | Get full compatibility map |
| `GetOpticAttachmentFromMods(array mods)` | Get optic from mods list |
| `SURVIVAL_GetRefFromProp(entity prop)` | Get loot ref from prop |

### 🟢 LOW PRIORITY - Death Boxes
| Function | Description |
|----------|-------------|
| `GetAllDeathBoxes()` | Get all death boxes in level |
| `GetAllDeathBoxesSMEA()` | Get all death boxes (SMEA) |
| `ShouldPickupDNAFromDeathBox(entity player, entity box)` | Check DNA pickup |
| `IsPlayerCloseEnoughToDeathBoxToLoot(entity player)` | Check death box proximity |
| `IsPlayerWithinStandardDeathBoxUseDistance(entity player)` | Check use distance |
| `IsValidAndUsableDeathBoxEnt(entity ent)` | Validate death box |
| `IsLootEntAccessibleViaDeathBox(entity loot, entity box)` | Check loot accessibility |
| `IsValidAndStandardGrabbableLootEnt(entity loot)` | Validate grabbable loot |
| `IsLootEntInsideDeathBox(entity loot)` | Check if loot inside box |
| `OnDeathBoxUse(entity player, entity box)` | Handle death box use |

### 🟢 LOW PRIORITY - Callbacks (Server)
| Function | Description |
|----------|-------------|
| `SetPlayerInventory(entity player, table inventory)` | Set player inventory |
| `SURVIVAL_AddCallback_OnInventoryChanged(func callback)` | Add inventory callback |
| `SURVIVAL_AddCallback_OnHealingItemCountChanged(func callback)` | Add healing callback |
| `Dev_SpawnAllLootTypes()` | DEV: Spawn all loot types |
| `SURVIVAL_Loot_GetByType_InLevel(int type, int maxTier, int minTier)` | Get loot by type in level |
| `SURVIVAL_Loot_GetByType_FixedTier(int type, int tier)` | Get loot by type and tier |
| `SURVIVAL_ConsolidateInventoryItems(entity player)` | Consolidate inventory |
| `SURVIVAL_ClearExcessInventoryItems(entity player)` | Clear excess items |
| `BroadcastItemPickup(entity player, string ref, int count)` | Broadcast item pickup |
| `BroadcastItemDrop(entity player, string ref, int count, vector origin)` | Broadcast item drop |
| `BroadcastItemDrop_Retail(entity player, string ref, int count, vector origin)` | Retail item drop |
| `Inventory_SetPlayerEquipment(entity player, string slot, string ref)` | Set equipment slot |
| `Inventory_GetPlayerEquipment(entity player, string slot)` | Get equipment slot |

### 🟢 LOW PRIORITY - Constants & Enums
| Constant | Description |
|----------|-------------|
| `WEAPON_LOCKEDSET_SUFFIX_*` | Weapon locked set suffixes |
| `WEAPON_SET_STRINGS_FOR_TIER` | Weapon set strings array |
| `MIN_LOOT_TIER`, `MAX_LOOT_TIER` | Loot tier range |
| `eLootSortCategories` | Loot sort categories enum |
| `eLootContext` | Loot context enum |
| `eHealthPickupType` | Health pickup types enum |
| `eHealthPickupCategory` | Health pickup categories enum |
| `eAttachmentTag` | Attachment tags enum |
| `SURVIVAL_PICKUP_ALL_MAX_RANGE` | Max pickup range |
| `SURVIVAL_GROUNDLIST_NEARBY_RADIUS` | Ground list radius |

---

## 2. Weapons System (`sh_weapons.gnut`)

### 🔴 HIGH PRIORITY
| Function | Description |
|----------|-------------|
| `GetWeaponItemFlavorByClass(string classname)` | Get weapon flavor by class |
| `GetAllWeaponItemFlavors()` | Get all weapon flavors |
| `GetAllWeaponCategories()` | Get all weapon categories |
| `GetWeaponsInCategory(ItemFlavor category)` | Get weapons in category |
| `GetAllWeaponsInCategory(ItemFlavor category)` | Get all in category |
| `MainWeapon_GetIsShippingWeapon(ItemFlavor flavor)` | Check if shipping weapon |

### 🟡 MEDIUM PRIORITY
| Function | Description |
|----------|-------------|
| `WeaponItemFlavor_GetClassname(ItemFlavor weapon)` | Get weapon classname |
| `WeaponItemFlavor_GetCategory(ItemFlavor weapon)` | Get weapon category |
| `WeaponItemFlavor_GetStatsCategory(ItemFlavor weapon)` | Get stats category |
| `WeaponItemFlavor_GetArmoryScale(ItemFlavor weapon)` | Get armory scale |
| `WeaponItemFlavor_GetLootCeremonyScale(ItemFlavor weapon)` | Get ceremony scale |
| `WeaponItemFlavor_GetBattlePassScale(ItemFlavor weapon)` | Get BP scale |
| `WeaponItemFlavor_GetHudIcon(ItemFlavor weapon)` | Get HUD icon |
| `WeaponCategoryFlavor_GetMenuZoomOffset(ItemFlavor category)` | Get zoom offset |

---

## 3. Character Abilities (`sh_character_abilities.gnut`)

### 🔴 HIGH PRIORITY
| Function | Description |
|----------|-------------|
| `CharacterAbility_GetWeaponClassname(ItemFlavor ability)` | Get ability weapon |
| `CharacterAbility_GetPassiveIndex(ItemFlavor ability)` | Get passive index |

---

### 🟡 MEDIUM PRIORITY - Specific Passives
| Function | Description |
|----------|-------------|
| `PlayerHasStealthMovement(entity player)` | Check stealth movement passive |
| `AttemptDecoyDrop(entity player)` | Trigger decoy drop (Mirage) |
| `EnableQuickHeal(entity player)` | Enable quick heal |
| `DisableQuickHeal(entity player)` | Disable quick heal |

### 🟢 LOW PRIORITY
| Constant | Description |
|----------|-------------|
| `ePassives` enum | All passive enum values |

---

## 5. Damage System (`sh_damage_utility.gnut`)

### 🔴 HIGH PRIORITY
| Function | Description |
|----------|-------------|
| `CloneScriptDamageInfo(var src)` | Clone damage info |
| `GetWeaponClassNameFromDamageInfo(var damageInfo)` | Get weapon from damage |
| `GetWeaponClassNameFromDamageInfoClone(ScriptDamageInfoClone dic)` | Get weapon from clone |
| `IsInstantDeath(var damageInfo)` | Check if instant death |
| `IsTitanCrushDamage(var damageInfo)` | Check titan crush |
| `IsMaxRangeShot(var damageInfo)` | Check max range shot |
| `IsMidRangeShot(var damageInfo)` | Check mid range shot |
| `IsSuicide(entity attacker, entity victim, int damageSourceId)` | Check suicide |
| `GetWeaponHeadshotDistance(entity weapon)` | Get headshot distance |
| `GetProjectileHeadshotDistance(entity projectile)` | Get projectile headshot dist |

### 🟡 MEDIUM PRIORITY - Critical Hits
| Function | Description |
|----------|-------------|
| `CritWeaponInDamageInfo(var damageInfo)` | Check crit weapon |
| `GetCriticalScaler(entity ent, var damageInfo)` | Get critical scaler |
| `HeavyArmorCriticalHitRequired(var damageInfo)` | Check heavy armor req |
| `IsValidHeadShot(var damageInfo, entity victim, entity attacker, entity weapon, int hitGroup, float attackDist, entity inflictor)` | Validate headshot |
| `IsLegDamage(entity ent, var damageInfo)` | Check leg damage |

---

## 6. Items/Flavors (`sh_items.gnut`)

### 🔴 HIGH PRIORITY
| Function | Description |
|----------|-------------|
| `GetItemFlavorByGUID(SettingsAssetGUID guid)` | Get flavor by GUID |
| `GetItemFlavorOrNullByGUID(SettingsAssetGUID guid, int expectedType)` | Get flavor or null |
| `GetItemFlavorByHumanReadableRef(string ref)` | Get flavor by ref |
| `GetItemFlavorByAsset(asset itemAsset)` | Get flavor by asset |
| `GetAllItemFlavors()` | Get all flavors |
| `GetAllItemFlavorsOfType(int typeIndex)` | Get flavors by type |
| `GetItemFlavorsWithTags(array<ItemFlavor> tagList)` | Get flavors with tags |
| `IsValidItemFlavorGUID(SettingsAssetGUID guid)` | Validate GUID |
| `IsValidItemFlavorHumanReadableRef(string ref)` | Validate human ref |
| `IsValidItemFlavorSettingsAsset(asset itemAsset)` | Validate asset |
| `ItemFlavor_GetType(ItemFlavor flavor)` | Get flavor type |
| `ItemFlavor_GetAsset(ItemFlavor flavor)` | Get flavor asset |
| `ItemFlavor_GetHumanReadableRef(ItemFlavor flavor)` | Get human ref |
| `ItemFlavor_GetTags(ItemFlavor flavor)` | Get flavor tags |
| `ItemFlavor_HasTag(ItemFlavor item, ItemFlavor tag)` | Check has tag |
| `ItemFlavor_GetQuality(ItemFlavor flavor)` | Get flavor quality |
| `ItemFlavor_HasQuality(ItemFlavor flavor)` | Check has quality |
| `ItemFlavor_ShouldBeVisible(ItemFlavor flavor, entity player)` | Check visibility |
| `ItemFlavor_IsAvailableInPlaylist(ItemFlavor flavor)` | Check playlist avail |

### 🟡 MEDIUM PRIORITY
| Function | Description |
|----------|-------------|
| `AddCallback_RegisterRootItemFlavors(func callback)` | Add root flavor callback |
| `AddCallback_OnItemFlavorRegistered(int itemType, func callback)` | Add registration callback |
| `AddCallbackOrMaybeCallNow_OnAllItemFlavorsRegistered(func callback)` | Add all registered callback |
| `IsItemFlavorRegistrationFinished()` | Check if registration done |
| `RegisterItemFlavorFromSettingsAsset(asset settingsAsset)` | Register flavor |
| `IterateSettingsAssetArray(asset settingsAsset, string arrayFieldName)` | Iterate settings array |
| `ItemFlavor_GetPlaylistOpinion(ItemFlavor flavor)` | Get playlist opinion |
| `GetItemFlavorAssociatedCharacterOrWeapon(ItemFlavor item)` | Get associated char/weapon |
| `ItemTypeHasDefault(int itemType)` | Check if type has default |
| `ItemTypeHasRandom(int itemType)` | Check if type has random |

### 🟢 LOW PRIORITY
| Function | Description |
|----------|-------------|
| `ConvertItemFlavorGUIDStringToGUID(string guidString)` | Convert GUID string |
| `ItemFlavor_CheckType(ItemFlavor flavor, int expectedType)` | Check flavor type |
| `ItemFlavor_IsTheDefault(ItemFlavor flavor)` | Check if default |
| `ItemFlavor_IsTheRandom(ItemFlavor flavor)` | Check if random |
| `ItemFlavor_GetQualityName(ItemFlavor flavor)` | Get quality name |
| `ItemFlavor_GetQualityColor(ItemFlavor flavor)` | Get quality color |
| `IsItemFlavorBagValid(ItemFlavorBag bag, bool allowEmpty)` | Validate flavor bag |
| `MakeItemFlavorBag(table contents)` | Create flavor bag |
| `ItemFlavorBag_ClearZeroQuantityFlavors(ItemFlavorBag bag)` | Clear zero quantity |

---

## 7. Match State (`sh_playermatchstate.gnut`)

### 🔴 HIGH PRIORITY
| Function | Description |
|----------|-------------|
| `PlayerMatchState_GetFor(entity player)` | Get player match state |
| `AddCallback_OnPlayerMatchStateChanged(func callback)` | Add state change callback |

### 🟡 MEDIUM PRIORITY
| Function | Description |
|----------|-------------|
| `PlayerMatchState_Set(entity player, int state)` | Set match state (SERVER) |
| `PlayerMatchState_RuiTrackInt(var rui, string arg, entity player)` | Track RUI int |

### 🟢 LOW PRIORITY
| Constant | Description |
|----------|-------------|
| `ePlayerMatchState` enum | Match state values |

---

## 8. MP Utility (`sh_mp_utility.gnut`)

### 🟡 MEDIUM PRIORITY
| Function | Description |
|----------|-------------|
| `GetRoundScoreLimit_FromPlaylist()` | Get round score limit |
| `GetScoreLimit_FromPlaylist()` | Get score limit |
| `IsSuddenDeathGameMode()` | Check sudden death |
| `HasRoundScoreLimitBeenReached()` | Check score limit reached |
| `IsTitanAvailable(entity player)` | Check titan available |
| `IsRespawnAvailable(entity player)` | Check respawn available |
| `IsPrivateMatchSpectator(entity player)` | Check spectator |

---

## 9. Remote Functions (`_remote_functions_mp.gnut`)

### 🟡 MEDIUM PRIORITY
| Function | Description |
|----------|-------------|
| `FindFuncName_ByID(int funcID)` | Get function name from ID |
| `FindFuncID_ByRef(string funcRef)` | Get function ID from ref |
| `RegisterExternalRemoteFunction_ByRef(string funcName, string modSource)` | Register remote func |
| `RegisterExternalRemoteFunction_ByRef_Array(array funcs, string mod)` | Register multiple |
| `IsExternalRemoteFunction(string funcName)` | Check if external func |
| `GetRemoteFunctionModSource(string funcName)` | Get mod source |

---

## 10. AI Utility (`ai/_ai_utility.gnut`)

### 🟡 MEDIUM PRIORITY - NPC Spawning
| Function | Description |
|----------|-------------|
| `HasEnemyWithinDist(entity npc, float dist)` | Check for enemy nearby |
| `FindSpawnPointForNpcCallin(entity npc, asset model, string anim)` | Find spawn point |
| `DEV_SpawnDummyAtCrosshair(int team)` | Spawn dummy (DEV) |
| `DEV_SpawnSpectreAtCrosshair(int team)` | Spawn spectre (DEV) |
| `DEV_SpawnTitanAtCrosshair(int team)` | Spawn titan (DEV) |
| `DEV_SpawnSoldierAtCrosshair(int team)` | Spawn soldier (DEV) |
| `DEV_SpawnProwlerAtCrosshair(int team)` | Spawn prowler (DEV) |
| `DEV_SpawnSpiderAtCrosshair(int team)` | Spawn spider (DEV) |
| `DEV_SpawnMarvinAtCrosshair(int team)` | Spawn marvin (DEV) |
| `DEV_SpawnStalkerAtCrosshair(int team)` | Spawn stalker (DEV) |
| `DEV_SpawnPlasmaDroneAtCrosshair(int team)` | Spawn plasma drone (DEV) |
| `DEV_SpawnRocketDroneAtCrosshair(int team)` | Spawn rocket drone (DEV) |
| `DEV_SpawnLootBinAtCrosshair()` | Spawn loot bin (DEV) |

### 🟡 MEDIUM PRIORITY - NPC Behavior
| Function | Description |
|----------|-------------|
| `NPCFollowsPlayer(entity npc, entity leader)` | Make NPC follow player |
| `NPCFollowsNPC(entity npc, entity leader)` | Make NPC follow NPC |
| `NpcFollowsEntity(entity npc, entity leader)` | Generic NPC follow |
| `GetDefaultNPCFollowBehavior(entity npc)` | Get default follow behavior |
| `DieOnPlayerDisconnect(entity npc, entity player)` | Kill NPC on disconnect |

### 🟢 LOW PRIORITY - Editor/Dev
| Function | Description |
|----------|-------------|
| `GetPlayerCrosshairOrigin(entity player)` | Get crosshair position |
| `GetPlayerCrosshairOriginRaw(entity player)` | Get raw crosshair |
| `CreateEditorPropZero(asset model, vector pos, vector ang, bool mantle, float fade, int realm)` | Create editor prop |
| `CreateEditorEntity(string entityName, vector pos, vector ang)` | Create editor entity |
| `ent_ZipLine(vector start, vector end, bool pathfinderModel)` | Create zipline |
| `CreateInvisibleWall(asset model, vector origin, vector angles, int amount, float spacesize)` | Create invisible wall |
| `CreateDownWall(asset model, vector origin, vector angles, int amount, float spacesize)` | Create down wall |
| `CreateFX(asset FX, vector Origin, vector Angles)` | Create particle FX |
| `ApplyFX(asset FX, entity ent)` | Apply FX to entity |
| `DEV_TeleportPlayers(vector pos, vector ang)` | Teleport players (DEV) |
| `DEV_ChargePlayers()` | Charge player abilities (DEV) |
| `DEV_StatusPlayers()` | Print player status (DEV) |

---

## 11. Script Triggers (`_script_triggers.gnut`)

### 🔴 HIGH PRIORITY
| Function | Description |
|----------|-------------|
| `CreateCodeCylinderTrigger(vector origin, vector angles, float radius, float aboveHeight, float belowHeight, int flags)` | Create cylinder trigger |
| `CreateTriggerRadiusMultiple_Deprecated(vector origin, float radius, array ents, int flags, float height)` | Create radius trigger (deprecated) |
| `CreateTriggerCylinderMultiple_Deprecated(vector origin, float radius, float/nullable topDelta, float/nullable bottomDelta, array ents, int flags)` | Create cylinder trigger (deprecated) |
| `ScriptTriggerSetEnabled_Deprecated(entity trigger, bool state)` | Set trigger enabled |
| `AddCallback_ScriptTriggerEnter_Deprecated(entity trigger, func callback)` | Add enter callback |
| `AddCallback_ScriptTriggerLeave_Deprecated(entity trigger, func callback)` | Add leave callback |
| `GetAllEntitiesInTrigger_Deprecated(entity trigger)` | Get entities in trigger |

---

## 12. Player Callbacks & Events (`_codecallbacks_common.gnut`)

### 🔴 HIGH PRIORITY - Player Lifecycle
| Function | Description |
|----------|-------------|
| `AddCallback_OnPlayerRespawned(func callback)` | Called when player respawns |
| `AddCallback_OnPlayerKilled(func callback)` | Called when player is killed |
| `AddCallback_OnNPCKilled(func callback)` | Called when NPC is killed |
| `AddEntityCallback_OnPlayerRespawned(entity player, func callback)` | Add per-player respawn callback |
| `AddPlayerCallback_OnSpawned(entity player, func callback)` | Called when player spawns |
| `AddCallback_OnClientConnecting(func callback)` | Called when client connecting |
| `AddCallback_OnClientConnected(func callback)` | Called when client connected |
| `AddCallback_OnClientDisconnected(func callback)` | Called when client disconnects |
| `AddCallback_OnPreClientDisconnected(func callback)` | Called before client disconnect |

### 🔴 HIGH PRIORITY - Player Movement
| Function | Description |
|----------|-------------|
| `AddPlayerMovementEventCallback(entity player, int event, func callback)` | Add movement callback |
| `CodeCallback_OnPlayerJump(entity player)` | Player jumped |
| `CodeCallback_OnPlayerDoubleJump(entity player)` | Player double jumped |
| `CodeCallback_OnPlayerDodge(entity player)` | Player dodged |
| `CodeCallback_OnPlayerLeaveGround(entity player)` | Player left ground |
| `CodeCallback_OnPlayerTouchGround(entity player)` | Player touched ground |
| `CodeCallback_OnPlayerMantle(entity player)` | Player mantled |
| `CodeCallback_OnPlayerBeginWallrun(entity player)` | Player started wallrun |
| `CodeCallback_OnPlayerEndWallrun(entity player)` | Player ended wallrun |
| `CodeCallback_OnPlayerBeginWallhang(entity player)` | Player started wallhang |
| `CodeCallback_OnPlayerEndWallhang(entity player)` | Player ended wallhang |

### 🔴 HIGH PRIORITY - Player Damage/Death
| Function | Description |
|----------|-------------|
| `AddEntityCallback_OnDamaged(entity ent, func callback)` | Entity damaged callback |
| `AddEntityCallback_OnKilled(entity ent, func callback)` | Entity killed callback |
| `AddEntityCallback_OnPostDamaged(entity ent, func callback)` | Post-damage callback |
| `AddEntityCallback_OnShadowHealthExhausted(entity player, func callback)` | Shadow health exhausted |
| `AddEntityCallback_OnPostShieldDamage(entity ent, func callback)` | Post-shield damage |
| `AddTitanCallback_OnHealthSegmentLost(entity titan, func callback)` | Titan health segment lost |
| `AddCallback_OnTitanDoomed(func callback)` | Titan became doomed |
| `AddCallback_OnTitanHealthSegmentLost(func callback)` | Titan health segment lost |
| `AddCallback_OnPlayerAssist(func callback)` | Player got assist |

### 🔴 HIGH PRIORITY - Player Use/Interaction
| Function | Description |
|----------|-------------|
| `AddCallback_OnUseButtonPressed(entity player, func callback)` | Use button pressed |
| `AddCallback_OnUseButtonReleased(entity player, func callback)` | Use button released |
| `AddCallback_OnPlayerUsedOffhandWeapon(func callback)` | Used offhand weapon |
| `CodeCallback_OnUseEntity(entity player, entity ent, int flags)` | Player used entity |
| `AddCallback_CheckPlayerCanUse(func callback)` | Check if player can use |

### 🟡 MEDIUM PRIORITY - Player Class/Loadout
| Function | Description |
|----------|-------------|
| `AddCallback_PlayerClassChanged(func callback)` | Player class changed |
| `AddCallback_OnPlayerGetsNewPilotLoadout(func callback)` | New pilot loadout |
| `AddCallback_OnTitanGetsNewTitanLoadout(func callback)` | New titan loadout |
| `AddCallback_OnUpdateDerivedPilotLoadout(func callback)` | Derived pilot loadout updated |
| `AddCallback_OnUpdateDerivedTitanLoadout(func callback)` | Derived titan loadout updated |
| `AddCallback_OnUpdateDerivedPlayerTitanLoadout(func callback)` | Derived player titan loadout |

### 🟡 MEDIUM PRIORITY - Player Team/State
| Function | Description |
|----------|-------------|
| `AddCallback_EntityChangedTeam(string className, func callback)` | Entity changed team |
| `AddCallback_OnPlayerChangedTeam(func callback)` | Player changed team |
| `AddCallback_OnTouchHealthKit(func callback)` | Touched health kit |
| `AddCallback_OnPlayerInventoryChanged(func callback)` | Player inventory changed |
| `AddPlayerDropScriptedItemsCallback(func callback)` | Player dropped scripted items |
| `AddCallback_OnDeathBoxSpawned(func callback)` | Death box spawned |

### 🟡 MEDIUM PRIORITY - Weapon Events
| Function | Description |
|----------|-------------|
| `AddCallback_OnWeaponAttack(func callback)` | Weapon attack fired |
| `AddCallback_OnPlayerWeaponActivated(func callback)` | Player activated weapon |
| `CodeCallback_OnPlayerWeaponActivated(entity player, entity newWeapon, entity oldWeapon)` | Weapon switched |

### 🟡 MEDIUM PRIORITY - Player Observation
| Function | Description |
|----------|-------------|
| `AddCallback_OnGetBestObserverTarget(func callback)` | Get best spectate target |
| `SetDefaultObserverBehavior(func callback)` | Set default observer behavior |

### 🟡 MEDIUM PRIORITY - Client Commands
| Function | Description |
|----------|-------------|
| `AddClientCommandCallback(string command, func callback)` | Add client command |
| `AddClientCommandCallbackVoid(string command, func callback)` | Add void command |
| `RemoveClientCommandCallback(string command)` | Remove command callback |
| `RemoveClientCommandCallbackVoid(string command, func callback)` | Remove void command |

---

## 13. Shared Callbacks (`sh_codecallbacks.gnut`)

### 🔴 HIGH PRIORITY - Use System
| Function | Description |
|----------|-------------|
| `CodeCallback_CanUseEntity(entity player, entity ent)` | Check if can use entity |
| `SetCallback_CanUseEntityCallback(entity ent, func callback)` | Set use callback |
| `ClearCallback_CanUseEntityCallback(entity ent)` | Clear use callback |
| `CodeCallback_OnUseEntity(entity player, entity ent, int flags)` | Player used entity |

### 🟡 MEDIUM PRIORITY - Zipline
| Function | Description |
|----------|-------------|
| `CodeCallback_CanUseZipline(entity player, entity zipline, vector point)` | Check zipline use |
| `AddCallback_CanUseZipline(func callback)` | Add zipline use callback |
| `AddCallback_PlayerCanUseZipline(func callback)` | Add player zipline callback |

### 🟡 MEDIUM PRIORITY - Zoom/Class
| Function | Description |
|----------|-------------|
| `AddCallback_OnPlayerZoomIn(func callback)` | Player zoomed in |
| `AddCallback_OnPlayerZoomOut(func callback)` | Player zoomed out |
| `CodeCallback_OnPlayerStartZoomIn(entity player)` | Start zoom in |
| `CodeCallback_OnPlayerStartZoomOut(entity player)` | Start zoom out |

### 🟡 MEDIUM PRIORITY - Vehicle
| Function | Description |
|----------|-------------|
| `AddCallback_OnVehicleLaunch(entity ent, func callback)` | Vehicle launched |
| `AddCallback_OnVehicleCollide(entity ent, func callback)` | Vehicle collided |

### 🟡 MEDIUM PRIORITY - Reload
| Function | Description |
|----------|-------------|
| `CodeCallback_OnWeaponReload(entity weapon)` | Weapon reloaded |
| `SetCallback_OnPlayerReload(func callback)` | Set reload callback |
| `CodeCallback_OnReloadButtonPressed(entity player)` | Reload button pressed |
| `SetCallback_OnReloadButtonPressed(func callback)` | Set reload pressed callback |
| `CodeCallback_CanPlayerReload(entity player)` | Check if can reload |

---

## 14. Bleedout System (`mp/_bleedout.gnut`)

### 🔴 HIGH PRIORITY - Core Bleedout
| Function | Description |
|----------|-------------|
| `Bleedout_IsBleedingOut(entity player)` | Check if bleeding out |
| `Bleedout_StartPlayerBleedout(entity player, entity attacker, var damageInfo)` | Start bleedout |
| `Bleedout_AddCallback_OnPlayerStartBleedout(func callback)` | Bleedout start callback |
| `Bleedout_AddCallback_OnPlayerStopBleedout(func callback)` | Bleedout stop callback |

### 🔴 HIGH PRIORITY - Revive System
| Function | Description |
|----------|-------------|
| `Bleedout_AddCallback_OnPlayerStartGiveFirstAid(func callback)` | Start giving first aid |
| `Bleedout_AddCallback_OnPlayerFinishGiveFirstAid(func callback)` | Finish giving first aid |
| `Bleedout_AddCallback_OnPlayerStartGiveSelfRevive(func callback)` | Start self revive |
| `Bleedout_AddCallback_OnPlayerStartReceiveFirstAid(func callback)` | Start receiving first aid |
| `Bleedout_AddCallback_OnPlayerFirstAidInterrupted(func callback)` | First aid interrupted |
| `Bleedout_AddCallback_OnPlayerGotFirstAid(func callback)` | Got first aid |

### 🔴 HIGH PRIORITY - Revive Queries
| Function | Description |
|----------|-------------|
| `Bleedout_IsPlayerGettingFirstAid(entity player)` | Getting first aid |
| `Bleedout_IsPlayerGivingFirstAid(entity player)` | Giving first aid |
| `Bleedout_IsPlayerSelfReviving(entity player)` | Self reviving |
| `Bleedout_IsReviveButtonDown(entity player)` | Revive button held |
| `Bleedout_AnyOtherSquadmatesAliveAndNotBleedingOut(entity player)` | Squadmates alive |

### 🟡 MEDIUM PRIORITY - Bleedout Info
| Function | Description |
|----------|-------------|
| `Bleedout_GetBleedoutStartTime(entity player)` | Get bleedout start time |
| `Bleedout_GetBleedoutAttacker(entity player)` | Get bleedout attacker |
| `Bleedout_GetBleedoutAttackerWeaponEnt(entity player)` | Get attacker weapon |
| `Bleedout_GetBleedoutDamageSourceId(entity player)` | Get damage source |
| `Bleedout_GetCreditedKiller(entity player)` | Get credited killer |
| `Bleedout_GetBleedoutWaypoint(entity player)` | Get bleedout waypoint |

### 🟡 MEDIUM PRIORITY - Bleedout Control
| Function | Description |
|----------|-------------|
| `Bleedout_ForceStop(entity player)` | Force stop bleedout |
| `Bleedout_ReviveForceStop(entity player)` | Force stop revive |
| `Bleedout_SetPlayerBleedoutType(entity player, int type)` | Set bleedout type |
| `Bleedout_SetRevivedPlayerHealth(entity reviver, entity target)` | Set revived health |

### 🟡 MEDIUM PRIORITY - Team Management
| Function | Description |
|----------|-------------|
| `Bleedout_CanTeammatesSelfRevive(entity player)` | Teammates can self revive |
| `Bleedout_ShouldAIMissBleedingPlayer(entity player)` | AI should miss bleeding player |
| `Bleedout_IsReceivingFirstAid(entity player)` | Receiving first aid |

---

## 15. Animations (`_utility.gnut` - see also shared scripts)

### 🟡 MEDIUM PRIORITY - Animation Events
| Function | Description |
|----------|-------------|
| `CodeCallback_AnimationDone(entity ent)` | Animation completed |
| `CodeCallback_AnimationInterrupted(entity ent)` | Animation interrupted |
| `CodeCallback_OnServerAnimEvent(entity ent, string eventName)` | Server anim event |

### 🟡 MEDIUM PRIORITY - Animation Control
| Function | Description |
|----------|-------------|
| `PlayFirstPersonAnimation(entity player, string anim)` | Play 1P animation |
| `PlayFirstAndThirdPersonAnimation(entity player, string anim1P, string anim3P)` | Play 1P+3P animation |
| `IsPlayingFirstPersonAnimation(entity player)` | Check if playing 1P anim |
| `IsPlayingFirstAndThirdPersonAnimation(entity player)` | Check if playing 1P+3P anim |

### 🟡 MEDIUM PRIORITY - Revive Animations
| Function | Description |
|----------|-------------|
| `GetReviveAnimation_Reviver(entity reviver, bool endCrouched)` | Get reviver anim |
| `GetReviveAnimation_Victim(entity reviver, entity victim, bool endCrouched)` | Get victim anim |

---

## 16. Global Enums (`sh_consts.gnut` & shared scripts)

### 🔴 HIGH PRIORITY - Critical Game Enums
| Enum | Description | Key Values |
|------|-------------|------------|
| `eDamageSourceId` | Damage source identifiers | `invalid`, `fall`, `bleedout`, `deathField`, `melee_pilot_emptyhanded`, `mp_weapon_*`, `mp_titanweapon_*` |
| `eGameState` | Game state machine | `PREMATCH`, `PLAYING`, `WINNER_DETERMINED`, `POSTGAME` |
| `eTeam` | Team identifiers | `TEAM_IMC`, `TEAM_MILITIA`, `TEAM_SPECTATOR`, `TEAM_INVALID` |
| `eStatusEffect` | Status effect types | `move_slow`, `turn_slow`, `emp`, `cloak`, `burn` |
| `ePlayerMovementEvents` | Player movement callbacks | `JUMP`, `DOUBLE_JUMP`, `DODGE`, `MANTLE`, `BEGIN_WALLRUN`, `END_WALLRUN`, `BEGIN_WALLHANG`, `END_WALLHANG` |

### 🔴 HIGH PRIORITY - Player/Entity Structs
| Struct | Description | Key Fields |
|--------|-------------|------------|
| `PilotLoadoutDef` | Pilot loadout definition | `name`, `tactical`, `suit`, `primary`, `secondary`, `ordnance`, `passive1`, `passive2` |
| `TitanLoadoutDef` | Titan loadout definition | `name`, `titanClass`, `primary`, `special`, `ordnance`, `passive1-6` |
| `ScriptDamageInfoClone` | Cloned damage info | `damage`, `damageSourceIdentifier`, `attacker`, `inflictor` |
| `BleedoutInfo` | Bleedout state info | `bleedoutStartTime`, `attacker`, `attackerWeaponEnt` |
| `LootRef` | Loot reference | `ref`, `count`, `survivalIndex` |

### 🟡 MEDIUM PRIORITY - Game System Enums
| Enum | Description | Key Values |
|------|-------------|------------|
| `eGamemodes` | Game mode types | `SURVIVAL`, `TDM`, `CTF`, `DEATHMATCH` |
| `ePlaylists` | Playlist identifiers | `fs_dm`, `fs_aimtrainer`, `fs_snd`, `survival_firingrange` |
| `eLootType` | Loot categories | `WEAPON`, `WEAPON_ATTACHMENT`, `HEALTH`, `ARMOR`, `AMMO` |
| `eHealthPickupType` | Health item types | `SYRINGE`, `MEDKIT`, `PHoenix_KIT`, `ULTIMATE` |
| `eItemType` | Item flavor types | `WEAPON`, `WEAPON_MOD`, `CHARACTER`, `MISSION` |
| `eQuality` | Loot rarity | `COMMON`, `RARE`, `EPIC`, `LEGENDARY`, `HEIRLOOM` |

### 🟡 MEDIUM PRIORITY - UI/Communication Enums
| Enum | Description | Key Values |
|------|-------------|------------|
| `eCommsAction` | Communication ping actions | `PING_ENEMY_SPOTTED`, `PING_NEED_HELP`, `PING_LOOT`, `QUICKCHAT_GG`, `REPLY_YES` |
| `eEventNotifications` | In-game events | `Clear`, `BLEEDOUT_SelfHealPrompt`, `SURVIVAL_NewJumpmaster` |
| `eRespawnStatus` | Respawn state | `NONE`, `WAITING_FOR_PICKUP`, `WAITING_FOR_DELIVERY` |

### 🟡 MEDIUM PRIORITY - Structs for Data
| Struct | Description | Key Fields |
|--------|-------------|------------|
| `LootData` | Loot item data | `ref`, `lootType`, `rarity`, `tier` |
| `HealthPickup` | Health item info | `type`, `healAmount`, `shieldAmount` |
| `HighlightContext` | Highlight settings | `highlightId`, `contextId`, `colorID` |
| `DeployableCollisionParams` | Deployable collision | `pos`, `normal`, `hitEnt`, `radius` |
| `BurnDamageSettings` | Burn effect config | `damageSourceID`, `burnDuration`, `burnDamage` |

### 🟢 LOW PRIORITY - Specialized Enums
| Enum | Description |
|------|-------------|
| `eHitType` | Hit result types |
| `eTargetGrade` | Target assessment |
| `eWeaponProficiency` | Weapon skill level |
| `eRespawnStatus` | Respawn states |
| `eDropStyle` | Drop pod styles |
| `eEliminationMode` | Elimination rules |
| `eNPCTitanMode` | NPC titan behavior |
| `eAmmoLimit` | Ammo restrictions |
| `eGameType` | Game classification |

### 🟢 LOW PRIORITY - Structs for Advanced Systems
| Struct | Description |
|--------|-------------|
| `Cylinder` | Cylindrical area |
| `Point` | Position + angles |
| `Color` | RGB color |
| `RGBA` | RGBA color with alpha |
| `UIPos` | UI coordinates |
| `UISize` | UI dimensions |
| `VortexImpact` | Vortex shield data |
| `ShGlobals` | Shared global state |
| `UseFuncData` | Use callback data |

### 🟢 LOW PRIORITY - Constants (Bitmasks & Flags)
| Constant | Description |
|----------|-------------|
| `DF_MELEE` | Melee damage flag |
| `DF_EXPLOSION` | Explosive damage |
| `DF_BYPASS_SHIELD` | Shield bypass |
| `DF_GIB` | Gibbing damage |
| `DF_INSTANT` | Instant kill |
| `CE_FLAG_INTRO` | Cinematic flag |
| `CE_FLAG_EMBARK` | Embark flag |
| `CE_FLAG_DISEMBARK` | Disembark flag |
| `WEAPONFLAG_AMPED` | Amped weapon flag |
| `PICKUP_FLAG_AUTO` | Auto pickup flag |

---

## Summary by Priority

### 🔴 HIGH PRIORITY (85+ functions + 20+ enums/structs)
- Player lifecycle callbacks (10+)
- Player movement callbacks (15+)
- Player damage/death (15+)
- Player use/interaction (10+)
- Bleedout system core (15+)
- Bleedout revive system (10+)
- **Critical Enums**: `eDamageSourceId`, `eGameState`, `eTeam`, `eStatusEffect`, `ePlayerMovementEvents`
- **Critical Structs**: `PilotLoadoutDef`, `TitanLoadoutDef`, `ScriptDamageInfoClone`, `BleedoutInfo`
- Survival/Loot core functions (25+)
- Weapon system core (10+)
- Character abilities (5)
- Damage system core (10+)
- Item flavors core (15+)
- Script triggers (7)

### 🟡 MEDIUM PRIORITY (80+ functions + 30+ enums/structs)
- Player class/loadout (10+)
- Player team/state (10+)
- Weapon events (5+)
- Player observation (5+)
- Client commands (5+)
- Shared callbacks (20+)
- Bleedout info/control (10+)
- Animation control (10+)
- **Game System Enums**: `eGamemodes`, `ePlaylists`, `eLootType`, `eHealthPickupType`, `eItemType`, `eQuality`
- **UI Enums**: `eCommsAction`, `eEventNotifications`, `eRespawnStatus`
- **Data Structs**: `LootData`, `HealthPickup`, `HighlightContext`, `DeployableCollisionParams`
- Survival/Loot data & UI (15+)
- Weapons system (10+)
- Passives specific (5)
- Damage critical hits (5)
- Items registration (10+)
- Match state (5)
- MP utility (5)
- AI utility NPC (10+)

### 🟢 LOW PRIORITY (80+ functions + 50+ enums/structs)
- Advanced inventory (25+)
- Death boxes (10+)
- Constants/enums (30+)
- **Specialized Enums**: `eHitType`, `eTargetGrade`, `eWeaponProficiency`, `eDropStyle`, `eEliminationMode`
- **Advanced Structs**: `Cylinder`, `Point`, `Color`, `RGBA`, `VortexImpact`, `ShGlobals`
- **Bitmask Constants**: Damage flags, cinematic flags, weapon flags
- Editor/dev tools (20+)
- Remote functions (5+)

---

## Notes

1. This list is generated from analyzing the R5V game scripts in `/home/zee/Games/R5VLibrary/LIVE/platform/scripts/vscripts/`

2. Functions marked with (SERVER) or (CLIENT) may have context restrictions

3. Some functions may be duplicates or already partially implemented

4. DEV functions are typically debugging tools and may not be needed for visual scripting

5. Deprecated functions marked `_Deprecated` should be avoided in favor of newer implementations

6. All structs (e.g., `LootRef`, `HealthPickup`, `ScriptDamageInfoClone`) should also have node representations for their fields

7. Player-specific nodes are critical for modders - they cover the most common modding scenarios like detecting player deaths, respawns, movement, damage, and interactions

8. **Global Enums and Structs** are essential for visual scripting - they enable condition checking, data access, and type-safe operations without needing to remember constant values or struct layouts
