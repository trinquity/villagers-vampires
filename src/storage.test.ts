import { createGame, getExpectedRoleCounts, type Role, type SetupPlayerInput } from './game';
import { loadGameState, saveGameState, STORAGE_KEY } from './storage';

function buildPlayers(playerCount: number): SetupPlayerInput[] {
  const config = getExpectedRoleCounts(playerCount);
  const roles: Role[] = [
    ...Array.from({ length: config.vampireCount }, () => 'vampire' as const),
    'cleric',
    ...Array.from({ length: playerCount - config.vampireCount - 1 }, () => 'villager' as const),
  ];

  return roles.map((role, index) => ({
    name: `Test ${index + 1}`,
    role,
  }));
}

describe('storage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('persists and restores the current game state', () => {
    const gameState = createGame(buildPlayers(8), () => 0);
    saveGameState(gameState);

    const restored = loadGameState();
    expect(restored?.config.playerCount).toBe(8);
    expect(restored?.players).toHaveLength(8);
    expect(window.localStorage.getItem(STORAGE_KEY)).not.toBeNull();
  });

  it('clears local storage when a new game starts cleanly', () => {
    const gameState = createGame(buildPlayers(8), () => 0);
    saveGameState(gameState);
    saveGameState(null);

    expect(loadGameState()).toBeNull();
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
