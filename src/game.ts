import type { Locale } from './i18n';

export type Role = 'vampire' | 'cleric' | 'villager';
export type Team = 'village' | 'vampires';
export type Phase = 'night' | 'day' | 'finished';

export type EventEffectType =
  | 'none'
  | 'openDoors'
  | 'twinPrayer'
  | 'sharedRitual'
  | 'bloodyPersistence'
  | 'lunarEclipse'
  | 'silentDawn';

type LocalizedText = Record<Locale, string>;

export interface GameConfig {
  playerCount: number;
  vampireCount: number;
  hasCleric: boolean;
}

export interface Player {
  id: string;
  name: string;
  role: Role;
  alive: boolean;
  eliminatedAt: {
    phase: 'night' | 'day';
    round: number;
  } | null;
  roleRevealDeferred: boolean;
}

export interface EventCard {
  id: string;
  title: LocalizedText;
  publicText: LocalizedText;
  moderatorText: LocalizedText;
  effectType: EventEffectType;
}

export interface NightInput {
  vampirePrimaryTargetId: string | null;
  vampireBackupTargetId?: string | null;
  clericTargetIds: string[];
  clericHelperId?: string | null;
}

export type NightSummaryKind =
  | 'blocked'
  | 'lunarNoDeath'
  | 'noDeath'
  | 'hiddenDeath'
  | 'visibleDeath';

export interface NightResult {
  deaths: string[];
  protectionApplied: boolean;
  roleRevealDeferred: boolean;
  summary: string;
  summaryKind: NightSummaryKind;
  revealPendingIds: string[];
}

export type DayNoteKind = 'lynched' | 'noLynch';

export interface GameLogEntry {
  nightNumber: number;
  eventId: string | null;
  inputs: NightInput;
  result: NightResult;
}

export interface DayLogEntry {
  dayNumber: number;
  lynchTargetId: string | null;
  roleRevealIds: string[];
  note: string;
  noteKind: DayNoteKind;
}

export interface NightState extends NightInput {
  nightNumber: number;
  activeEventId: string | null;
  alivePlayerIds: string[];
  clericLastTargetId: string | null;
  deckRemaining: number;
  resolved: boolean;
}

export interface GameState {
  version: 2;
  config: GameConfig;
  players: Player[];
  nightNumber: number;
  phase: Phase;
  deckOrder: string[];
  deckIndex: number;
  activeEventId: string | null;
  currentNight: NightState | null;
  lastNightResult: NightResult | null;
  clericId: string | null;
  clericLastTargetId: string | null;
  clericLastTargetIds: string[];
  logs: GameLogEntry[];
  dayLogs: DayLogEntry[];
  pendingRevealIds: string[];
  winner: Team | null;
}

export interface SetupPlayerInput {
  name: string;
  role: Role;
}

interface NightRules {
  allowSelfTarget: boolean;
  allowRepeatedTarget: boolean;
  requiredTargetCount: number;
  requiresHelper: boolean;
  requiresBackup: boolean;
  protectionDisabled: boolean;
}

const GAME_COPY = {
  tr: {
    invalidPlayerCount: 'Oyun 6 ile 10 kişi arasında olmalıdır.',
    missingNames: 'Tüm oyuncuların adı doldurulmalıdır.',
    duplicateNames: 'Oyuncu isimleri benzersiz olmalıdır.',
    wrongPlayerCount: 'Oyuncu sayısı eksik ya da fazla.',
    noCleric: 'Cleric bulunamadı.',
    requireVampires: (count: number) => `${count} vampir seçilmelidir.`,
    maxCleric: 'En fazla 1 Cleric seçilebilir.',
    requireVillagers: 'Kalan bütün roller köylü olmalıdır.',
    nightNotStarted: 'Gece başlatılmadı.',
    primaryTarget: 'Vampirler için geçerli bir ana hedef seçilmelidir.',
    backupTarget: 'Bu event için yedek hedef seçilmelidir.',
    distinctBackup: 'Ana hedef ve yedek hedef farklı olmalıdır.',
    twoClericTargets: 'Cleric iki farklı hedef seçmelidir.',
    oneClericTarget: 'Cleric bir hedef seçmelidir.',
    distinctClericTargets: 'Cleric aynı kişiyi iki kez seçemez.',
    aliveClericTarget: 'Cleric yalnızca hayatta olan birini koruyabilir.',
    noSelfProtect: 'Cleric normal gecede kendini koruyamaz.',
    noRepeatProtect: 'Cleric bir önceki gece koruduğu kişiyi tekrar seçemez.',
    helperRequired: 'Ortak Ayin için geçerli bir yardımcı seçilmelidir.',
    helperCannotBeCleric: 'Ortak Ayin yardımcısı Cleric olamaz.',
    missingNightState: 'Gece durumu bulunamadı.',
    blockedSummary: 'Cleric saldırıyı tamamen durdurdu. Bu gece ölen yok.',
    lunarNoDeath: 'Ay Tutulması aktifti, fakat vampirler etkili bir ölüm üretemedi.',
    noDeath: 'Bu gece ölen yok.',
    hiddenDeath: (names: string) => `${names} gece öldü, fakat roller gündüz bitene kadar gizli kalacak.`,
    visibleDeath: (names: string) => `${names} gece boyunca hayatta kalamadı.`,
    lynched: (name: string) => `${name} gündüz oylamasında elendi.`,
    noLynch: 'Eşit oy veya pas geçme nedeniyle kimse elenmedi.',
    roleLabels: {
      vampire: 'Vampir',
      cleric: 'Cleric',
      villager: 'Köylü',
    },
    teamLabels: {
      village: 'Köylü Tarafı',
      vampires: 'Vampirler',
    },
  },
  en: {
    invalidPlayerCount: 'The game must have between 6 and 10 players.',
    missingNames: 'Every player name must be filled in.',
    duplicateNames: 'Player names must be unique.',
    wrongPlayerCount: 'The player count is missing or incorrect.',
    noCleric: 'No cleric was found.',
    requireVampires: (count: number) => `You must assign ${count} vampires.`,
    maxCleric: 'You can assign at most 1 cleric.',
    requireVillagers: 'All remaining roles must be villagers.',
    nightNotStarted: 'The night has not started.',
    primaryTarget: 'Choose a valid primary target for the vampires.',
    backupTarget: 'This event requires a valid backup target.',
    distinctBackup: 'Primary and backup targets must be different.',
    twoClericTargets: 'The cleric must choose two different targets.',
    oneClericTarget: 'The cleric must choose one target.',
    distinctClericTargets: 'The cleric cannot choose the same player twice.',
    aliveClericTarget: 'The cleric can only protect a living player.',
    noSelfProtect: 'The cleric cannot protect themselves on a normal night.',
    noRepeatProtect: 'The cleric cannot choose the same player from the previous night.',
    helperRequired: 'Shared Ritual requires a valid helper.',
    helperCannotBeCleric: 'The cleric cannot be the Shared Ritual helper.',
    missingNightState: 'The night state could not be found.',
    blockedSummary: 'The cleric completely blocked the attack. Nobody died tonight.',
    lunarNoDeath: 'Lunar Eclipse was active, but the vampires still produced no kill.',
    noDeath: 'Nobody died tonight.',
    hiddenDeath: (names: string) => `${names} died in the night, but their roles stay hidden until day ends.`,
    visibleDeath: (names: string) => `${names} did not survive the night.`,
    lynched: (name: string) => `${name} was eliminated in the day vote.`,
    noLynch: 'No one was eliminated because of a tie or a skipped vote.',
    roleLabels: {
      vampire: 'Vampire',
      cleric: 'Cleric',
      villager: 'Villager',
    },
    teamLabels: {
      village: 'Village Side',
      vampires: 'Vampires',
    },
  },
} as const;

export const EVENT_CARDS: EventCard[] = [
  {
    id: 'open-doors',
    title: {
      tr: 'Açık Kapılar',
      en: 'Open Doors',
    },
    publicText: {
      tr: 'Bu gece Cleric normal yasaklarını yok sayabilir. Kendini veya dün koruduğu kişiyi seçmesi serbest.',
      en: 'Tonight the cleric may ignore the normal restrictions. They may protect themselves or the same player as last night.',
    },
    moderatorText: {
      tr: 'Cleric hedef kuralları gevşer. Tek hedef seçmeye devam eder.',
      en: 'The cleric target rules loosen. They still choose only one target.',
    },
    effectType: 'openDoors',
  },
  {
    id: 'twin-prayer',
    title: {
      tr: 'İkiz Dua',
      en: 'Twin Prayer',
    },
    publicText: {
      tr: 'Bu gece Cleric iki farklı kişiyi korur.',
      en: 'Tonight the cleric protects two different players.',
    },
    moderatorText: {
      tr: 'Cleric iki hedef seçer. Diğer kısıtlar devam eder.',
      en: 'The cleric chooses two targets. All other restrictions still apply.',
    },
    effectType: 'twinPrayer',
  },
  {
    id: 'shared-ritual',
    title: {
      tr: 'Ortak Ayin',
      en: 'Shared Ritual',
    },
    publicText: {
      tr: 'Cleric gizlice bir yardımcı ve bir hedef seçer. Yardımcı vampir değilse hedef korunur.',
      en: 'The cleric secretly chooses a helper and a target. If the helper is not a vampire, the target is protected.',
    },
    moderatorText: {
      tr: 'Yardımcı Cleric olamaz. Yardımcı vampirse koruma boşa gider.',
      en: 'The helper cannot be the cleric. If the helper is a vampire, the protection fails.',
    },
    effectType: 'sharedRitual',
  },
  {
    id: 'bloody-persistence',
    title: {
      tr: 'Kanlı Israr',
      en: 'Bloody Persistence',
    },
    publicText: {
      tr: 'Vampirler bu gece bir ana hedef ve bir yedek hedef belirler.',
      en: 'Tonight the vampires choose both a primary target and a backup target.',
    },
    moderatorText: {
      tr: 'Ana hedef korunursa yedek hedef ölmeye çalışır.',
      en: 'If the primary target is protected, the backup target dies instead.',
    },
    effectType: 'bloodyPersistence',
  },
  {
    id: 'lunar-eclipse',
    title: {
      tr: 'Ay Tutulması',
      en: 'Lunar Eclipse',
    },
    publicText: {
      tr: 'Bu gece hiçbir koruma çalışmaz.',
      en: 'No protection works tonight.',
    },
    moderatorText: {
      tr: 'Cleric yine seçim yapar ama etkisi olmaz.',
      en: 'The cleric still makes a choice, but it has no effect.',
    },
    effectType: 'lunarEclipse',
  },
  {
    id: 'silent-dawn',
    title: {
      tr: 'Sessiz Şafak',
      en: 'Silent Dawn',
    },
    publicText: {
      tr: 'Bu gece ölen olursa rolü sabah açıklanmaz. Gerçek rol gündüz turu bittiğinde açılır.',
      en: 'If someone dies tonight, their role is not revealed in the morning. It is revealed after the day phase ends.',
    },
    moderatorText: {
      tr: 'Gece ölenlerin rolü gizli kalır. Günün sonunda otomatik açılır.',
      en: 'Night victims keep their role hidden. Reveal it automatically at the end of the day.',
    },
    effectType: 'silentDawn',
  },
  {
    id: 'silent-night-1',
    title: {
      tr: 'Sessiz Gece',
      en: 'Silent Night',
    },
    publicText: {
      tr: 'Bu gece koşullar normal. Hiçbir özel event yok.',
      en: 'Tonight is normal. There is no special event.',
    },
    moderatorText: {
      tr: 'Normal gece akışını uygula.',
      en: 'Use the normal night flow.',
    },
    effectType: 'none',
  },
  {
    id: 'silent-night-2',
    title: {
      tr: 'Sessiz Gece',
      en: 'Silent Night',
    },
    publicText: {
      tr: 'Bu gece koşullar normal. Hiçbir özel event yok.',
      en: 'Tonight is normal. There is no special event.',
    },
    moderatorText: {
      tr: 'Normal gece akışını uygula.',
      en: 'Use the normal night flow.',
    },
    effectType: 'none',
  },
  {
    id: 'silent-night-3',
    title: {
      tr: 'Sessiz Gece',
      en: 'Silent Night',
    },
    publicText: {
      tr: 'Bu gece koşullar normal. Hiçbir özel event yok.',
      en: 'Tonight is normal. There is no special event.',
    },
    moderatorText: {
      tr: 'Normal gece akışını uygula.',
      en: 'Use the normal night flow.',
    },
    effectType: 'none',
  },
  {
    id: 'silent-night-4',
    title: {
      tr: 'Sessiz Gece',
      en: 'Silent Night',
    },
    publicText: {
      tr: 'Bu gece koşullar normal. Hiçbir özel event yok.',
      en: 'Tonight is normal. There is no special event.',
    },
    moderatorText: {
      tr: 'Normal gece akışını uygula.',
      en: 'Use the normal night flow.',
    },
    effectType: 'none',
  },
];

export const EVENT_CARD_IDS = EVENT_CARDS.map((card) => card.id);

function copy(locale: Locale) {
  return GAME_COPY[locale];
}

function playerNamesFromIds(players: Player[], playerIds: string[]): string {
  return playerIds
    .map((playerId) => players.find((player) => player.id === playerId)?.name)
    .filter((name): name is string => Boolean(name))
    .join(', ');
}

function createPlayerId(random: () => number = Math.random): string {
  if (typeof globalThis.crypto !== 'undefined') {
    if (typeof globalThis.crypto.randomUUID === 'function') {
      return globalThis.crypto.randomUUID();
    }

    if (typeof globalThis.crypto.getRandomValues === 'function') {
      const bytes = globalThis.crypto.getRandomValues(new Uint8Array(16));
      bytes[6] = (bytes[6] & 0x0f) | 0x40;
      bytes[8] = (bytes[8] & 0x3f) | 0x80;
      const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
      return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
    }
  }

  return `player-${Math.round(random() * 1_000_000_000)}-${Date.now()}`;
}

export function getExpectedRoleCounts(playerCount: number, locale: Locale = 'tr'): GameConfig {
  if (playerCount < 6 || playerCount > 10) {
    throw new Error(copy(locale).invalidPlayerCount);
  }

  let vampireCount = 2;
  if (playerCount === 6) {
    vampireCount = 1;
  } else if (playerCount === 10) {
    vampireCount = 3;
  }

  return {
    playerCount,
    vampireCount,
    hasCleric: false,
  };
}

export function buildSetupRoles(playerCount: number): Role[] {
  const config = getExpectedRoleCounts(playerCount);
  return [
    ...Array.from({ length: config.vampireCount }, () => 'vampire' as const),
    'cleric',
    ...Array.from({ length: playerCount - config.vampireCount - 1 }, () => 'villager' as const),
  ];
}

export function randomizeSetupPlayers(
  playerInputs: SetupPlayerInput[],
  playerCount: number,
  random: () => number = Math.random,
): SetupPlayerInput[] {
  const roles = [...buildSetupRoles(playerCount)];

  for (let index = roles.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [roles[index], roles[swapIndex]] = [roles[swapIndex], roles[index]];
  }

  return Array.from({ length: playerCount }, (_, index) => ({
    name: playerInputs[index]?.name ?? '',
    role: roles[index],
  }));
}

export function getRoleLabel(role: Role, locale: Locale = 'tr'): string {
  return copy(locale).roleLabels[role];
}

export function getTeamLabel(team: Team, locale: Locale = 'tr'): string {
  return copy(locale).teamLabels[team];
}

export function getEventCard(eventId: string | null): EventCard | null {
  if (!eventId) {
    return null;
  }

  return EVENT_CARDS.find((card) => card.id === eventId) ?? null;
}

export function shuffleDeck(ids: string[] = EVENT_CARD_IDS, random: () => number = Math.random): string[] {
  const deck = [...ids];

  for (let index = deck.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [deck[index], deck[swapIndex]] = [deck[swapIndex], deck[index]];
  }

  return deck;
}

export function drawEventCard(
  deckOrder: string[],
  deckIndex: number,
  random: () => number = Math.random,
): {
  deckOrder: string[];
  deckIndex: number;
  eventId: string;
} {
  let nextDeckOrder = deckOrder;
  let nextDeckIndex = deckIndex;

  if (nextDeckIndex >= nextDeckOrder.length) {
    nextDeckOrder = shuffleDeck(EVENT_CARD_IDS, random);
    nextDeckIndex = 0;
  }

  const eventId = nextDeckOrder[nextDeckIndex];
  nextDeckIndex += 1;

  return {
    deckOrder: nextDeckOrder,
    deckIndex: nextDeckIndex,
    eventId,
  };
}

export function validateSetupPlayers(
  playerInputs: SetupPlayerInput[],
  playerCount: number,
  locale: Locale = 'tr',
): string | null {
  const text = copy(locale);

  if (playerInputs.length !== playerCount) {
    return text.wrongPlayerCount;
  }

  const counts = getExpectedRoleCounts(playerCount);
  const trimmedNames = playerInputs.map((player) => player.name.trim());

  if (trimmedNames.some((name) => !name)) {
    return text.missingNames;
  }

  if (new Set(trimmedNames.map((name) => name.toLocaleLowerCase(locale))).size !== trimmedNames.length) {
    return text.duplicateNames;
  }

  const vampires = playerInputs.filter((player) => player.role === 'vampire').length;
  const clerics = playerInputs.filter((player) => player.role === 'cleric').length;
  const villagers = playerInputs.filter((player) => player.role === 'villager').length;

  if (vampires !== counts.vampireCount) {
    return text.requireVampires(counts.vampireCount);
  }

  if (clerics > 1) {
    return text.maxCleric;
  }

  if (villagers !== playerCount - counts.vampireCount - clerics) {
    return text.requireVillagers;
  }

  return null;
}

export function createGame(
  playerInputs: SetupPlayerInput[],
  random: () => number = Math.random,
  locale: Locale = 'tr',
): GameState {
  const validationError = validateSetupPlayers(playerInputs, playerInputs.length, locale);
  if (validationError) {
    throw new Error(validationError);
  }

  const expectedConfig = getExpectedRoleCounts(playerInputs.length);
  const players = playerInputs.map((player) => ({
    id: createPlayerId(random),
    name: player.name.trim(),
    role: player.role,
    alive: true,
    eliminatedAt: null,
    roleRevealDeferred: false,
  }));
  const cleric = players.find((player) => player.role === 'cleric');

  return {
    version: 2,
    config: {
      ...expectedConfig,
      hasCleric: Boolean(cleric),
    },
    players,
    nightNumber: 1,
    phase: 'night',
    deckOrder: shuffleDeck(EVENT_CARD_IDS, random),
    deckIndex: 0,
    activeEventId: null,
    currentNight: null,
    lastNightResult: null,
    clericId: cleric?.id ?? null,
    clericLastTargetId: null,
    clericLastTargetIds: [],
    logs: [],
    dayLogs: [],
    pendingRevealIds: [],
    winner: null,
  };
}

export function getAlivePlayers(players: Player[]): Player[] {
  return players.filter((player) => player.alive);
}

export function getLivingVampireTargets(players: Player[]): Player[] {
  return players.filter((player) => player.alive && player.role !== 'vampire');
}

export function getNightRules(eventId: string | null): NightRules {
  const effectType = getEventCard(eventId)?.effectType ?? 'none';

  switch (effectType) {
    case 'openDoors':
      return {
        allowSelfTarget: true,
        allowRepeatedTarget: true,
        requiredTargetCount: 1,
        requiresHelper: false,
        requiresBackup: false,
        protectionDisabled: false,
      };
    case 'twinPrayer':
      return {
        allowSelfTarget: false,
        allowRepeatedTarget: false,
        requiredTargetCount: 2,
        requiresHelper: false,
        requiresBackup: false,
        protectionDisabled: false,
      };
    case 'sharedRitual':
      return {
        allowSelfTarget: false,
        allowRepeatedTarget: false,
        requiredTargetCount: 1,
        requiresHelper: true,
        requiresBackup: false,
        protectionDisabled: false,
      };
    case 'bloodyPersistence':
      return {
        allowSelfTarget: false,
        allowRepeatedTarget: false,
        requiredTargetCount: 1,
        requiresHelper: false,
        requiresBackup: true,
        protectionDisabled: false,
      };
    case 'lunarEclipse':
      return {
        allowSelfTarget: false,
        allowRepeatedTarget: false,
        requiredTargetCount: 1,
        requiresHelper: false,
        requiresBackup: false,
        protectionDisabled: true,
      };
    case 'silentDawn':
    case 'none':
      return {
        allowSelfTarget: false,
        allowRepeatedTarget: false,
        requiredTargetCount: 1,
        requiresHelper: false,
        requiresBackup: false,
        protectionDisabled: false,
      };
  }
}

export function beginNight(gameState: GameState, random: () => number = Math.random): GameState {
  if (gameState.winner || gameState.phase !== 'night' || gameState.currentNight) {
    return gameState;
  }

  let activeEventId: string | null = null;
  let deckOrder = gameState.deckOrder;
  let deckIndex = gameState.deckIndex;

  if (gameState.nightNumber > 1) {
    const draw = drawEventCard(deckOrder, deckIndex, random);
    deckOrder = draw.deckOrder;
    deckIndex = draw.deckIndex;
    activeEventId = draw.eventId;
  }

  return {
    ...gameState,
    deckOrder,
    deckIndex,
    activeEventId,
    currentNight: {
      nightNumber: gameState.nightNumber,
      activeEventId,
      alivePlayerIds: getAlivePlayers(gameState.players).map((player) => player.id),
      clericLastTargetId: gameState.clericLastTargetId,
      deckRemaining: deckOrder.length - deckIndex,
      vampirePrimaryTargetId: null,
      vampireBackupTargetId: null,
      clericTargetIds: [],
      clericHelperId: null,
      resolved: false,
    },
  };
}

export function updateNightInput(gameState: GameState, patch: Partial<NightInput>): GameState {
  if (!gameState.currentNight || gameState.phase !== 'night') {
    return gameState;
  }

  return {
    ...gameState,
    currentNight: {
      ...gameState.currentNight,
      ...patch,
      clericTargetIds: patch.clericTargetIds ?? gameState.currentNight.clericTargetIds,
    },
  };
}

export function getNightValidationError(gameState: GameState, locale: Locale = 'tr'): string | null {
  const text = copy(locale);
  const { currentNight } = gameState;
  if (!currentNight) {
    return text.nightNotStarted;
  }

  const alivePlayers = getAlivePlayers(gameState.players);
  const alivePlayerIds = new Set(alivePlayers.map((player) => player.id));
  const validVampireTargetIds = new Set(getLivingVampireTargets(gameState.players).map((player) => player.id));
  const rules = getNightRules(currentNight.activeEventId);
  const clericAlive = gameState.clericId
    ? alivePlayers.some((player) => player.id === gameState.clericId)
    : false;

  if (!currentNight.vampirePrimaryTargetId || !validVampireTargetIds.has(currentNight.vampirePrimaryTargetId)) {
    return text.primaryTarget;
  }

  if (rules.requiresBackup) {
    if (
      !currentNight.vampireBackupTargetId ||
      !validVampireTargetIds.has(currentNight.vampireBackupTargetId)
    ) {
      return text.backupTarget;
    }

    if (currentNight.vampireBackupTargetId === currentNight.vampirePrimaryTargetId) {
      return text.distinctBackup;
    }
  }

  if (!clericAlive) {
    return null;
  }

  if (currentNight.clericTargetIds.length !== rules.requiredTargetCount) {
    return rules.requiredTargetCount === 2 ? text.twoClericTargets : text.oneClericTarget;
  }

  if (new Set(currentNight.clericTargetIds).size !== currentNight.clericTargetIds.length) {
    return text.distinctClericTargets;
  }

  for (const targetId of currentNight.clericTargetIds) {
    if (!alivePlayerIds.has(targetId)) {
      return text.aliveClericTarget;
    }

    if (!rules.allowSelfTarget && targetId === gameState.clericId) {
      return text.noSelfProtect;
    }

    if (!rules.allowRepeatedTarget && gameState.clericLastTargetIds.includes(targetId)) {
      return text.noRepeatProtect;
    }
  }

  if (rules.requiresHelper) {
    if (!currentNight.clericHelperId || !alivePlayerIds.has(currentNight.clericHelperId)) {
      return text.helperRequired;
    }

    if (currentNight.clericHelperId === gameState.clericId) {
      return text.helperCannotBeCleric;
    }
  }

  return null;
}

function markPlayersDead(
  players: Player[],
  playerIds: string[],
  phase: 'night' | 'day',
  round: number,
  deferRoleReveal: boolean,
): Player[] {
  const targetSet = new Set(playerIds);

  return players.map((player) => {
    if (!targetSet.has(player.id) || !player.alive) {
      return player;
    }

    return {
      ...player,
      alive: false,
      eliminatedAt: {
        phase,
        round,
      },
      roleRevealDeferred: deferRoleReveal,
    };
  });
}

function revealRoles(players: Player[], playerIds: string[]): Player[] {
  const revealSet = new Set(playerIds);
  return players.map((player) =>
    revealSet.has(player.id)
      ? {
          ...player,
          roleRevealDeferred: false,
        }
      : player,
  );
}

function revealAllDeadRoles(players: Player[]): Player[] {
  return players.map((player) =>
    !player.alive
      ? {
          ...player,
          roleRevealDeferred: false,
        }
      : player,
  );
}

export function determineWinner(players: Player[]): Team | null {
  const alivePlayers = getAlivePlayers(players);
  const aliveVampires = alivePlayers.filter((player) => player.role === 'vampire').length;
  const aliveVillageSide = alivePlayers.length - aliveVampires;

  if (aliveVampires === 0) {
    return 'village';
  }

  if (aliveVampires >= aliveVillageSide) {
    return 'vampires';
  }

  return null;
}

export function getNightSummaryText(
  result: NightResult,
  players: Player[],
  locale: Locale = 'tr',
): string {
  const text = copy(locale);
  const names = playerNamesFromIds(players, result.deaths);

  switch (result.summaryKind) {
    case 'blocked':
      return text.blockedSummary;
    case 'lunarNoDeath':
      return text.lunarNoDeath;
    case 'noDeath':
      return text.noDeath;
    case 'hiddenDeath':
      return text.hiddenDeath(names);
    case 'visibleDeath':
      return text.visibleDeath(names);
  }
}

export function getDayNoteText(
  log: DayLogEntry,
  players: Player[],
  locale: Locale = 'tr',
): string {
  const text = copy(locale);

  if (log.noteKind === 'noLynch' || !log.lynchTargetId) {
    return text.noLynch;
  }

  const playerName = players.find((player) => player.id === log.lynchTargetId)?.name ?? '';
  return text.lynched(playerName);
}

function getNightSummaryKind(
  deaths: string[],
  roleRevealDeferred: boolean,
  primaryProtected: boolean,
  effectType: EventEffectType,
): NightSummaryKind {
  if (deaths.length === 0 && primaryProtected) {
    return 'blocked';
  }

  if (deaths.length === 0) {
    if (effectType === 'lunarEclipse') {
      return 'lunarNoDeath';
    }

    return 'noDeath';
  }

  return roleRevealDeferred ? 'hiddenDeath' : 'visibleDeath';
}

export function resolveNight(gameState: GameState, locale: Locale = 'tr'): GameState {
  const validationError = getNightValidationError(gameState, locale);
  if (validationError) {
    throw new Error(validationError);
  }

  const { currentNight } = gameState;
  if (!currentNight) {
    throw new Error(copy(locale).missingNightState);
  }

  const alivePlayers = getAlivePlayers(gameState.players);
  const clericAlive = gameState.clericId
    ? alivePlayers.some((player) => player.id === gameState.clericId)
    : false;
  const rules = getNightRules(currentNight.activeEventId);
  const protectedIds = new Set<string>();

  if (clericAlive && !rules.protectionDisabled) {
    if (getEventCard(currentNight.activeEventId)?.effectType === 'sharedRitual') {
      const helper = gameState.players.find((player) => player.id === currentNight.clericHelperId);
      const targetId = currentNight.clericTargetIds[0];

      if (helper && helper.role !== 'vampire' && targetId) {
        protectedIds.add(targetId);
      }
    } else {
      currentNight.clericTargetIds.forEach((targetId) => protectedIds.add(targetId));
    }
  }

  const primaryTargetId = currentNight.vampirePrimaryTargetId;
  const backupTargetId = currentNight.vampireBackupTargetId ?? null;
  const primaryProtected = primaryTargetId ? protectedIds.has(primaryTargetId) : false;
  const backupProtected = backupTargetId ? protectedIds.has(backupTargetId) : false;
  const deaths: string[] = [];

  if (primaryTargetId) {
    if (primaryProtected) {
      if (rules.requiresBackup && backupTargetId && !backupProtected) {
        deaths.push(backupTargetId);
      }
    } else {
      deaths.push(primaryTargetId);
    }
  }

  const effectType = getEventCard(currentNight.activeEventId)?.effectType ?? 'none';
  const roleRevealDeferred = effectType === 'silentDawn' && deaths.length > 0;
  const revealPendingIds = roleRevealDeferred ? deaths : [];
  let players = markPlayersDead(gameState.players, deaths, 'night', gameState.nightNumber, roleRevealDeferred);
  let pendingRevealIds = [...gameState.pendingRevealIds, ...revealPendingIds];
  const protectionApplied = primaryProtected || (Boolean(backupTargetId) && primaryProtected && backupProtected);
  const summaryKind = getNightSummaryKind(deaths, roleRevealDeferred, primaryProtected, effectType);

  const nightResult: NightResult = {
    deaths,
    protectionApplied,
    roleRevealDeferred,
    summaryKind,
    summary: '',
    revealPendingIds,
  };
  nightResult.summary = getNightSummaryText(nightResult, gameState.players, locale);

  const nextClericLastTargetIds = clericAlive ? [...currentNight.clericTargetIds] : gameState.clericLastTargetIds;
  const nextClericLastTargetId = nextClericLastTargetIds[0] ?? null;
  const winner = determineWinner(players);

  if (winner) {
    players = revealAllDeadRoles(players);
    pendingRevealIds = [];
  }

  return {
    ...gameState,
    players,
    phase: winner ? 'finished' : 'day',
    activeEventId: currentNight.activeEventId,
    currentNight: {
      ...currentNight,
      resolved: true,
    },
    lastNightResult: nightResult,
    clericLastTargetId: nextClericLastTargetId,
    clericLastTargetIds: nextClericLastTargetIds,
    pendingRevealIds,
    winner,
    logs: [
      ...gameState.logs,
      {
        nightNumber: gameState.nightNumber,
        eventId: currentNight.activeEventId,
        inputs: {
          vampirePrimaryTargetId: currentNight.vampirePrimaryTargetId,
          vampireBackupTargetId: currentNight.vampireBackupTargetId,
          clericTargetIds: currentNight.clericTargetIds,
          clericHelperId: currentNight.clericHelperId,
        },
        result: nightResult,
      },
    ],
  };
}

export function resolveDay(
  gameState: GameState,
  lynchTargetId: string | null,
  locale: Locale = 'tr',
): GameState {
  if (gameState.phase !== 'day') {
    return gameState;
  }

  const alivePlayers = getAlivePlayers(gameState.players);
  const validTarget =
    lynchTargetId && alivePlayers.some((player) => player.id === lynchTargetId) ? lynchTargetId : null;
  let players = validTarget
    ? markPlayersDead(gameState.players, [validTarget], 'day', gameState.nightNumber, false)
    : gameState.players;
  const roleRevealIds = [...gameState.pendingRevealIds];
  players = revealRoles(players, roleRevealIds);

  const winner = determineWinner(players);
  if (winner) {
    players = revealAllDeadRoles(players);
  }

  const dayLog: DayLogEntry = {
    dayNumber: gameState.nightNumber,
    lynchTargetId: validTarget,
    roleRevealIds,
    noteKind: validTarget ? 'lynched' : 'noLynch',
    note: '',
  };
  dayLog.note = getDayNoteText(dayLog, players, locale);

  return {
    ...gameState,
    players,
    nightNumber: winner ? gameState.nightNumber : gameState.nightNumber + 1,
    phase: winner ? 'finished' : 'night',
    activeEventId: winner ? gameState.activeEventId : null,
    currentNight: null,
    pendingRevealIds: [],
    winner,
    dayLogs: [...gameState.dayLogs, dayLog],
  };
}
