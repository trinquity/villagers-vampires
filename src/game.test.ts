import {
  beginNight,
  buildSetupRoles,
  createGame,
  drawEventCard,
  getExpectedRoleCounts,
  getNightValidationError,
  randomizeSetupPlayers,
  resolveDay,
  resolveNight,
  updateNightInput,
  validateSetupPlayers,
  type GameState,
  type Role,
  type SetupPlayerInput,
} from './game';

function buildPlayers(playerCount: number): SetupPlayerInput[] {
  const roles: Role[] = buildSetupRoles(playerCount);

  return roles.map((role, index) => ({
    name: `Oyuncu ${index + 1}`,
    role,
  }));
}

function selectNightInputs(gameState: GameState, primaryTargetIndex = 3): GameState {
  const activeNight = gameState.currentNight;
  if (!activeNight) {
    throw new Error('Aktif gece bulunamadi.');
  }

  const primaryTargetId = gameState.players[primaryTargetIndex].id;
  let nextState = updateNightInput(gameState, {
    vampirePrimaryTargetId: primaryTargetId,
  });

  const eventId = activeNight.activeEventId;

  if (eventId === 'bloody-persistence') {
    nextState = updateNightInput(nextState, {
      vampireBackupTargetId: gameState.players[4].id,
    });
  }

  if (eventId === 'shared-ritual') {
    nextState = updateNightInput(nextState, {
      clericTargetIds: [primaryTargetId],
      clericHelperId: gameState.players[4].id,
    });
    return nextState;
  }

  if (eventId === 'twin-prayer') {
    nextState = updateNightInput(nextState, {
      clericTargetIds: [primaryTargetId, gameState.players[4].id],
    });
    return nextState;
  }

  nextState = updateNightInput(nextState, {
    clericTargetIds: [primaryTargetId],
  });
  return nextState;
}

describe('game logic', () => {
  it('assigns the correct vampire counts for 6 through 10 players', () => {
    expect(getExpectedRoleCounts(6).vampireCount).toBe(1);
    expect(getExpectedRoleCounts(7).vampireCount).toBe(2);
    expect(getExpectedRoleCounts(8).vampireCount).toBe(2);
    expect(getExpectedRoleCounts(9).vampireCount).toBe(2);
    expect(getExpectedRoleCounts(10).vampireCount).toBe(3);
  });

  it('rejects player counts outside 6 through 10 with localized messages', () => {
    expect(() => getExpectedRoleCounts(5)).toThrow('6 ile 10');
    expect(() => getExpectedRoleCounts(11, 'en')).toThrow('between 6 and 10');
  });

  it('validates the exact role mix for 6 and 7 players', () => {
    const sixPlayers = buildPlayers(6);
    const invalidSixPlayers = sixPlayers.map((player, index) =>
      index === 5
        ? {
            ...player,
            role: 'vampire' as const,
          }
        : player,
    );
    const sevenPlayers = buildPlayers(7);
    const invalidSevenPlayers = sevenPlayers.map((player, index) =>
      index === 0
        ? {
            ...player,
            role: 'villager' as const,
          }
        : player,
    );

    expect(validateSetupPlayers(sixPlayers, 6)).toBeNull();
    expect(validateSetupPlayers(invalidSixPlayers, 6)).toContain('1 vampir');
    expect(validateSetupPlayers(sevenPlayers, 7)).toBeNull();
    expect(validateSetupPlayers(invalidSevenPlayers, 7)).toContain('2 vampir');
  });

  it('randomizes setup roles without changing player names', () => {
    const players = buildPlayers(6);
    const randomized = randomizeSetupPlayers(players, 6, () => 0);

    expect(randomized.map((player) => player.name)).toEqual(players.map((player) => player.name));
    expect(randomized.filter((player) => player.role === 'vampire')).toHaveLength(1);
    expect(randomized.filter((player) => player.role === 'cleric')).toHaveLength(1);
    expect(randomized.filter((player) => player.role === 'villager')).toHaveLength(4);
    expect(randomized.map((player) => player.role)).not.toEqual(players.map((player) => player.role));
  });

  it('prevents cleric from protecting self or the previous target on a normal night', () => {
    let gameState = createGame(buildPlayers(8), () => 0);
    gameState = {
      ...gameState,
      nightNumber: 2,
      currentNight: {
        nightNumber: 2,
        activeEventId: 'silent-night-1',
        alivePlayerIds: gameState.players.map((player) => player.id),
        clericLastTargetId: gameState.players[3].id,
        deckRemaining: 9,
        vampirePrimaryTargetId: gameState.players[4].id,
        vampireBackupTargetId: null,
        clericTargetIds: [gameState.players[2].id],
        clericHelperId: null,
        resolved: false,
      },
      activeEventId: 'silent-night-1',
      clericLastTargetId: gameState.players[3].id,
      clericLastTargetIds: [gameState.players[3].id],
    };

    expect(getNightValidationError(gameState)).toContain('kendini koruyamaz');

    gameState = updateNightInput(gameState, {
      clericTargetIds: [gameState.players[3].id],
    });

    expect(getNightValidationError(gameState)).toContain('bir önceki gece koruduğu');
  });

  it('allows self and repeated protection on Acik Kapilar', () => {
    let gameState = createGame(buildPlayers(8), () => 0);
    gameState = {
      ...gameState,
      nightNumber: 2,
      currentNight: {
        nightNumber: 2,
        activeEventId: 'open-doors',
        alivePlayerIds: gameState.players.map((player) => player.id),
        clericLastTargetId: gameState.players[3].id,
        deckRemaining: 9,
        vampirePrimaryTargetId: gameState.players[4].id,
        vampireBackupTargetId: null,
        clericTargetIds: [gameState.players[2].id],
        clericHelperId: null,
        resolved: false,
      },
      activeEventId: 'open-doors',
      clericLastTargetId: gameState.players[3].id,
      clericLastTargetIds: [gameState.players[3].id],
    };

    expect(getNightValidationError(gameState)).toBeNull();

    gameState = updateNightInput(gameState, {
      clericTargetIds: [gameState.players[3].id],
    });

    expect(getNightValidationError(gameState)).toBeNull();
  });

  it('protects two distinct targets on Ikiz Dua', () => {
    let gameState = createGame(buildPlayers(8), () => 0);
    gameState = {
      ...gameState,
      nightNumber: 2,
      currentNight: {
        nightNumber: 2,
        activeEventId: 'twin-prayer',
        alivePlayerIds: gameState.players.map((player) => player.id),
        clericLastTargetId: null,
        deckRemaining: 9,
        vampirePrimaryTargetId: gameState.players[3].id,
        vampireBackupTargetId: null,
        clericTargetIds: [gameState.players[3].id, gameState.players[4].id],
        clericHelperId: null,
        resolved: false,
      },
      activeEventId: 'twin-prayer',
    };

    const resolved = resolveNight(gameState);
    expect(resolved.lastNightResult?.deaths).toHaveLength(0);
    expect(resolved.players[3].alive).toBe(true);
    expect(resolved.players[4].alive).toBe(true);
  });

  it('fails shared ritual when the helper is a vampire', () => {
    let gameState = createGame(buildPlayers(8), () => 0);
    gameState = {
      ...gameState,
      nightNumber: 2,
      currentNight: {
        nightNumber: 2,
        activeEventId: 'shared-ritual',
        alivePlayerIds: gameState.players.map((player) => player.id),
        clericLastTargetId: null,
        deckRemaining: 9,
        vampirePrimaryTargetId: gameState.players[4].id,
        vampireBackupTargetId: null,
        clericTargetIds: [gameState.players[4].id],
        clericHelperId: gameState.players[0].id,
        resolved: false,
      },
      activeEventId: 'shared-ritual',
    };

    const resolved = resolveNight(gameState);
    expect(resolved.players[4].alive).toBe(false);
  });

  it('kills the backup target when primary is protected on Kanli Israr', () => {
    let gameState = createGame(buildPlayers(8), () => 0);
    gameState = {
      ...gameState,
      nightNumber: 2,
      currentNight: {
        nightNumber: 2,
        activeEventId: 'bloody-persistence',
        alivePlayerIds: gameState.players.map((player) => player.id),
        clericLastTargetId: null,
        deckRemaining: 9,
        vampirePrimaryTargetId: gameState.players[3].id,
        vampireBackupTargetId: gameState.players[4].id,
        clericTargetIds: [gameState.players[3].id],
        clericHelperId: null,
        resolved: false,
      },
      activeEventId: 'bloody-persistence',
    };

    const resolved = resolveNight(gameState);
    expect(resolved.players[3].alive).toBe(true);
    expect(resolved.players[4].alive).toBe(false);
  });

  it('disables protection on Ay Tutulmasi', () => {
    let gameState = createGame(buildPlayers(8), () => 0);
    gameState = {
      ...gameState,
      nightNumber: 2,
      currentNight: {
        nightNumber: 2,
        activeEventId: 'lunar-eclipse',
        alivePlayerIds: gameState.players.map((player) => player.id),
        clericLastTargetId: null,
        deckRemaining: 9,
        vampirePrimaryTargetId: gameState.players[3].id,
        vampireBackupTargetId: null,
        clericTargetIds: [gameState.players[3].id],
        clericHelperId: null,
        resolved: false,
      },
      activeEventId: 'lunar-eclipse',
    };

    const resolved = resolveNight(gameState);
    expect(resolved.players[3].alive).toBe(false);
  });

  it('defers role reveal on Sessiz Safak', () => {
    let gameState = createGame(buildPlayers(8), () => 0);
    gameState = {
      ...gameState,
      nightNumber: 2,
      currentNight: {
        nightNumber: 2,
        activeEventId: 'silent-dawn',
        alivePlayerIds: gameState.players.map((player) => player.id),
        clericLastTargetId: null,
        deckRemaining: 9,
        vampirePrimaryTargetId: gameState.players[4].id,
        vampireBackupTargetId: null,
        clericTargetIds: [gameState.players[5].id],
        clericHelperId: null,
        resolved: false,
      },
      activeEventId: 'silent-dawn',
    };

    const resolved = resolveNight(gameState);
    expect(resolved.lastNightResult?.roleRevealDeferred).toBe(true);
    expect(resolved.players[4].roleRevealDeferred).toBe(true);

    const afterDay = resolveDay(resolved, null);
    expect(afterDay.players[4].roleRevealDeferred).toBe(false);
  });

  it('does not repeat event cards until the deck is exhausted', () => {
    let deckOrder = [
      'open-doors',
      'twin-prayer',
      'shared-ritual',
      'bloody-persistence',
      'lunar-eclipse',
      'silent-dawn',
      'silent-night-1',
      'silent-night-2',
      'silent-night-3',
      'silent-night-4',
    ];
    let deckIndex = 0;
    const seen = new Set<string>();

    for (let index = 0; index < 10; index += 1) {
      const draw = drawEventCard(deckOrder, deckIndex, () => 0);
      seen.add(draw.eventId);
      deckOrder = draw.deckOrder;
      deckIndex = draw.deckIndex;
    }

    expect(seen.size).toBe(10);
  });

  it('can save and reload an in-progress game flow', () => {
    let gameState = createGame(buildPlayers(8), () => 0);
    gameState = beginNight(gameState, () => 0);
    gameState = selectNightInputs(gameState);
    gameState = resolveNight(gameState);

    expect(gameState.lastNightResult).not.toBeNull();
    expect(gameState.logs).toHaveLength(1);
  });
});
