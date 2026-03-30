import { startTransition, useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import {
  beginNight,
  createGame,
  getAlivePlayers,
  getDayNoteText,
  getEventCard,
  getExpectedRoleCounts,
  getNightRules,
  getNightSummaryText,
  getNightValidationError,
  getRoleLabel,
  getTeamLabel,
  getLivingVampireTargets,
  resolveDay,
  resolveNight,
  updateNightInput,
  validateSetupPlayers,
  type GameState,
  type NightInput,
  type Player,
  type Role,
  type SetupPlayerInput,
} from './game';
import { APP_COPY, getLanguageLabel, type Locale } from './i18n';
import { loadGameState, loadLocale, saveGameState, saveLocale } from './storage';

const ROLE_OPTIONS: Role[] = ['vampire', 'cleric', 'villager'];

function buildDefaultPlayers(playerCount: number, existing: SetupPlayerInput[] = []): SetupPlayerInput[] {
  const counts = getExpectedRoleCounts(playerCount);

  return Array.from({ length: playerCount }, (_, index) => {
    let role: Role = 'villager';
    if (index < counts.vampireCount) {
      role = 'vampire';
    } else if (index === counts.vampireCount) {
      role = 'cleric';
    }

    return {
      name: existing[index]?.name ?? '',
      role: existing[index]?.role ?? role,
    };
  });
}

function getPlayerName(players: Player[], playerId: string | null, locale: Locale): string {
  const copy = APP_COPY[locale];

  if (!playerId) {
    return copy.none;
  }

  return players.find((player) => player.id === playerId)?.name ?? copy.unnamed;
}

function getCurrentEvent(gameState: GameState) {
  return getEventCard(gameState.currentNight?.activeEventId ?? gameState.activeEventId);
}

function shouldShowRole(player: Player, showRoles: boolean): boolean {
  if (showRoles) {
    return true;
  }

  return !player.alive && !player.roleRevealDeferred;
}

function roundLabel(round: number, locale: Locale, phase: 'night' | 'day'): string {
  const copy = APP_COPY[locale];
  return phase === 'night' ? `${copy.night} ${round}` : `${copy.dayLabel} ${round}`;
}

function LanguageBar({
  locale,
  onLocaleChange,
}: {
  locale: Locale;
  onLocaleChange: (locale: Locale) => void;
}) {
  const copy = APP_COPY[locale];

  return (
    <header className="topbar">
      <label className="field compact-field language-field">
        <span>{copy.languageLabel}</span>
        <select value={locale} onChange={(event) => onLocaleChange(event.target.value as Locale)}>
          {(['tr', 'en'] as Locale[]).map((value) => (
            <option key={value} value={value}>
              {getLanguageLabel(value, locale)}
            </option>
          ))}
        </select>
      </label>
    </header>
  );
}

function SetupScreen({
  locale,
  onLocaleChange,
  onCreate,
}: {
  locale: Locale;
  onLocaleChange: (locale: Locale) => void;
  onCreate: (players: SetupPlayerInput[]) => void;
}) {
  const copy = APP_COPY[locale];
  const [playerCount, setPlayerCount] = useState(8);
  const [players, setPlayers] = useState<SetupPlayerInput[]>(() => buildDefaultPlayers(8));
  const [error, setError] = useState<string | null>(null);
  const expected = getExpectedRoleCounts(playerCount);
  const currentCounts = useMemo(
    () => ({
      vampires: players.filter((player) => player.role === 'vampire').length,
      clerics: players.filter((player) => player.role === 'cleric').length,
      villagers: players.filter((player) => player.role === 'villager').length,
    }),
    [players],
  );

  function handlePlayerCountChange(event: ChangeEvent<HTMLSelectElement>) {
    const nextCount = Number(event.target.value);
    setPlayerCount(nextCount);
    setPlayers((currentPlayers) => buildDefaultPlayers(nextCount, currentPlayers));
    setError(null);
  }

  function updatePlayer(index: number, patch: Partial<SetupPlayerInput>) {
    setPlayers((currentPlayers) =>
      currentPlayers.map((player, playerIndex) =>
        playerIndex === index
          ? {
              ...player,
              ...patch,
            }
          : player,
      ),
    );
    setError(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationError = validateSetupPlayers(players, playerCount, locale);
    if (validationError) {
      setError(validationError);
      return;
    }

    onCreate(players);
  }

  return (
    <main className="app-shell">
      <LanguageBar locale={locale} onLocaleChange={onLocaleChange} />

      <section className="hero-card">
        <p className="eyebrow">{copy.heroEyebrow}</p>
        <h1>{copy.heroTitle}</h1>
        <p className="lede">{copy.heroLede}</p>
      </section>

      <section className="panel panel-accent">
        <div className="panel-head">
          <div>
            <p className="eyebrow">{copy.setupEyebrow}</p>
            <h2>{copy.setupTitle}</h2>
          </div>
          <label className="field compact-field">
            <span>{copy.playerCount}</span>
            <select value={playerCount} onChange={handlePlayerCountChange}>
              <option value={8}>8</option>
              <option value={9}>9</option>
              <option value={10}>10</option>
            </select>
          </label>
        </div>

        <div className="count-strip">
          <div className="count-pill">
            <strong>{expected.vampireCount}</strong>
            <span>{copy.vampiresTarget}</span>
          </div>
          <div className="count-pill">
            <strong>1</strong>
            <span>{copy.clericTarget}</span>
          </div>
          <div className="count-pill">
            <strong>{playerCount - expected.vampireCount - 1}</strong>
            <span>{copy.villagerTarget}</span>
          </div>
        </div>

        <form className="setup-form" onSubmit={handleSubmit}>
          <div className="player-grid">
            {players.map((player, index) => (
              <div className="player-card" key={`setup-${index + 1}`}>
                <div className="player-card-head">
                  <span className="seat-index">
                    {copy.seat} {index + 1}
                  </span>
                  <span className="role-chip">{getRoleLabel(player.role, locale)}</span>
                </div>
                <label className="field">
                  <span>{copy.playerName}</span>
                  <input
                    value={player.name}
                    onChange={(event) => updatePlayer(index, { name: event.target.value })}
                    placeholder={`${copy.playerNamePlaceholder} ${index + 1}`}
                  />
                </label>
                <label className="field">
                  <span>{copy.role}</span>
                  <select
                    value={player.role}
                    onChange={(event) => updatePlayer(index, { role: event.target.value as Role })}
                  >
                    {ROLE_OPTIONS.map((role) => (
                      <option key={role} value={role}>
                        {getRoleLabel(role, locale)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            ))}
          </div>

          <div className="footer-actions">
            <div className="meta-note">
              <p>{copy.selectedDistribution}</p>
              <strong>
                {currentCounts.vampires} {getRoleLabel('vampire', locale)}, {currentCounts.clerics}{' '}
                {getRoleLabel('cleric', locale)}, {currentCounts.villagers} {getRoleLabel('villager', locale)}
              </strong>
            </div>
            <button className="primary-button" type="submit">
              {copy.startGame}
            </button>
          </div>

          {error ? <p className="error-box">{error}</p> : null}
        </form>
      </section>
    </main>
  );
}

function StatusPanel({
  gameState,
  locale,
  showRoles,
  onToggleRoles,
  onReset,
}: {
  gameState: GameState;
  locale: Locale;
  showRoles: boolean;
  onToggleRoles: () => void;
  onReset: () => void;
}) {
  const copy = APP_COPY[locale];
  const activeEvent = getCurrentEvent(gameState);
  const alivePlayers = getAlivePlayers(gameState.players);
  const aliveVampires = alivePlayers.filter((player) => player.role === 'vampire').length;
  const aliveVillage = alivePlayers.length - aliveVampires;

  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <p className="eyebrow">{copy.tableStateEyebrow}</p>
          <h2>{copy.gameSummaryTitle}</h2>
        </div>
        <div className="inline-actions">
          <button className="ghost-button" type="button" onClick={onToggleRoles}>
            {showRoles ? copy.hideRoles : copy.showRoles}
          </button>
          <button className="ghost-button danger-button" type="button" onClick={onReset}>
            {copy.newGame}
          </button>
        </div>
      </div>

      <div className="status-grid">
        <article className="metric-card">
          <span>{copy.phase}</span>
          <strong>
            {gameState.phase === 'night'
              ? copy.phaseNight
              : gameState.phase === 'day'
                ? copy.phaseDay
                : copy.phaseFinished}
          </strong>
        </article>
        <article className="metric-card">
          <span>{copy.night}</span>
          <strong>{gameState.nightNumber}</strong>
        </article>
        <article className="metric-card">
          <span>{copy.deck}</span>
          <strong>
            {gameState.deckOrder.length - gameState.deckIndex} {copy.cardsRemaining}
          </strong>
        </article>
        <article className="metric-card">
          <span>{copy.activeEvent}</span>
          <strong>{activeEvent?.title[locale] ?? copy.nightOneNoEvent}</strong>
        </article>
      </div>

      <div className="status-grid secondary">
        <article className="metric-card">
          <span>{copy.alivePlayers}</span>
          <strong>{alivePlayers.length}</strong>
        </article>
        <article className="metric-card">
          <span>{copy.vampires}</span>
          <strong>{aliveVampires}</strong>
        </article>
        <article className="metric-card">
          <span>{copy.villageSide}</span>
          <strong>{aliveVillage}</strong>
        </article>
        <article className="metric-card winner-card">
          <span>{copy.status}</span>
          <strong>{gameState.winner ? getTeamLabel(gameState.winner, locale) : copy.inProgress}</strong>
        </article>
      </div>
    </section>
  );
}

function NightPanel({
  gameState,
  locale,
  onStartNight,
  onUpdateNightInput,
  onResolveNight,
}: {
  gameState: GameState;
  locale: Locale;
  onStartNight: () => void;
  onUpdateNightInput: (patch: Partial<NightInput>) => void;
  onResolveNight: () => void;
}) {
  const copy = APP_COPY[locale];

  if (gameState.phase !== 'night') {
    return null;
  }

  const activeNight = gameState.currentNight;
  const clericAlive = getAlivePlayers(gameState.players).some((player) => player.id === gameState.clericId);

  if (!activeNight) {
    return (
      <section className="panel panel-feature">
        <div className="panel-head">
          <div>
            <p className="eyebrow">{copy.startNightEyebrow}</p>
            <h2>
              {copy.night} {gameState.nightNumber}
            </h2>
          </div>
          <button className="primary-button" type="button" onClick={onStartNight}>
            {gameState.nightNumber === 1 ? copy.openFirstNight : copy.drawEvent}
          </button>
        </div>
        <p className="lede">{gameState.nightNumber === 1 ? copy.firstNightLead : copy.drawLead}</p>
      </section>
    );
  }

  const currentNight = activeNight;
  const event = getEventCard(currentNight.activeEventId);
  const rules = getNightRules(currentNight.activeEventId);
  const vampireTargets = getLivingVampireTargets(gameState.players);
  const alivePlayers = getAlivePlayers(gameState.players);
  const validationError = getNightValidationError(gameState, locale);
  const blockedNames = gameState.clericLastTargetIds.map((playerId) =>
    getPlayerName(gameState.players, playerId, locale),
  );

  function updateClericTarget(index: number, nextValue: string) {
    const nextTargets = Array.from(
      { length: rules.requiredTargetCount },
      (_, targetIndex) => currentNight.clericTargetIds[targetIndex] ?? '',
    );
    nextTargets[index] = nextValue;
    onUpdateNightInput({
      clericTargetIds: nextTargets.filter(Boolean),
    });
  }

  return (
    <section className="panel panel-feature">
      <div className="panel-head">
        <div>
          <p className="eyebrow">{copy.activeNightEyebrow}</p>
          <h2>
            {copy.night} {currentNight.nightNumber}
          </h2>
        </div>
        <span className="role-chip event-chip">{event?.title[locale] ?? copy.standardNight}</span>
      </div>

      <div className="event-banner">
        <div>
          <p className="small-label">{copy.publicReadLabel}</p>
          <strong>{event?.publicText[locale] ?? copy.defaultFirstNightPublic}</strong>
        </div>
        <div>
          <p className="small-label">{copy.moderatorNoteLabel}</p>
          <span>{event?.moderatorText[locale] ?? copy.defaultModeratorNote}</span>
        </div>
      </div>

      <div className="step-list">
        {copy.nightSteps.map((step, index) => (
          <div className="step-item" key={step}>
            <span>{index + 1}</span>
            <strong>{step}</strong>
          </div>
        ))}
      </div>

      <div className="flow-grid">
        <article className="flow-card">
          <h3>{copy.vampireChoice}</h3>
          <label className="field">
            <span>{copy.primaryTarget}</span>
            <select
              value={currentNight.vampirePrimaryTargetId ?? ''}
              onChange={(event) =>
                onUpdateNightInput({
                  vampirePrimaryTargetId: event.target.value || null,
                })
              }
            >
              <option value="">{copy.selectTarget}</option>
              {vampireTargets.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.name}
                </option>
              ))}
            </select>
          </label>

          {rules.requiresBackup ? (
            <label className="field">
              <span>{copy.backupTarget}</span>
              <select
                value={currentNight.vampireBackupTargetId ?? ''}
                onChange={(event) =>
                  onUpdateNightInput({
                    vampireBackupTargetId: event.target.value || null,
                  })
                }
              >
                <option value="">{copy.selectBackupTarget}</option>
                {vampireTargets.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </article>

        <article className="flow-card">
          <h3>{copy.clericChoice}</h3>
          {clericAlive ? (
            <>
              <p className="mini-note">{copy.clericRule}</p>
              <div className="rule-pills">
                <span className={`mini-chip ${rules.allowSelfTarget ? 'enabled' : ''}`}>
                  {copy.selfProtection} {rules.allowSelfTarget ? copy.enabled : copy.disabled}
                </span>
                <span className={`mini-chip ${rules.allowRepeatedTarget ? 'enabled' : ''}`}>
                  {copy.repeatTarget} {rules.allowRepeatedTarget ? copy.enabled : copy.disabled}
                </span>
                <span className={`mini-chip ${rules.protectionDisabled ? 'warning' : ''}`}>
                  {copy.protection} {rules.protectionDisabled ? copy.protectionDisabled : copy.active}
                </span>
              </div>

              {blockedNames.length > 0 && !rules.allowRepeatedTarget ? (
                <p className="mini-note">
                  {copy.blockedTargets} <strong>{blockedNames.join(', ')}</strong>
                </p>
              ) : null}

              {Array.from({ length: rules.requiredTargetCount }, (_, index) => (
                <label className="field" key={`cleric-target-${index + 1}`}>
                  <span>
                    {rules.requiredTargetCount === 2
                      ? `${copy.protectionLabel} ${index + 1}`
                      : copy.protectedTarget}
                  </span>
                  <select
                    value={currentNight.clericTargetIds[index] ?? ''}
                    onChange={(event) => updateClericTarget(index, event.target.value)}
                  >
                    <option value="">{copy.selectTarget}</option>
                    {alivePlayers.map((player) => (
                      <option key={player.id} value={player.id}>
                        {player.name}
                      </option>
                    ))}
                  </select>
                </label>
              ))}

              {rules.requiresHelper ? (
                <label className="field">
                  <span>{copy.sharedRitualHelper}</span>
                  <select
                    value={currentNight.clericHelperId ?? ''}
                    onChange={(event) =>
                      onUpdateNightInput({
                        clericHelperId: event.target.value || null,
                      })
                    }
                  >
                    <option value="">{copy.selectHelper}</option>
                    {alivePlayers.map((player) => (
                      <option key={player.id} value={player.id}>
                        {player.name}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
            </>
          ) : (
            <p className="mini-note">{copy.clericMissing}</p>
          )}
        </article>
      </div>

      {validationError ? <p className="error-box">{validationError}</p> : null}

      <div className="footer-actions">
        <div className="meta-note">
          <p>{copy.deckState}</p>
          <strong>
            {currentNight.deckRemaining} {copy.reshuffleAfter}
          </strong>
        </div>
        <button className="primary-button" type="button" onClick={onResolveNight} disabled={Boolean(validationError)}>
          {copy.resolveNight}
        </button>
      </div>
    </section>
  );
}

function DayPanel({
  gameState,
  locale,
  onResolveDay,
}: {
  gameState: GameState;
  locale: Locale;
  onResolveDay: (lynchTargetId: string | null) => void;
}) {
  const copy = APP_COPY[locale];
  const [lynchTargetId, setLynchTargetId] = useState('');

  useEffect(() => {
    setLynchTargetId('');
  }, [gameState.phase, gameState.nightNumber]);

  if (gameState.phase !== 'day') {
    return null;
  }

  const alivePlayers = getAlivePlayers(gameState.players);
  const lastNightResult = gameState.lastNightResult;
  const lastNightDeaths = lastNightResult?.deaths ?? [];

  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <p className="eyebrow">{copy.dayEyebrow}</p>
          <h2>{copy.daySummaryTitle}</h2>
        </div>
        <span className="role-chip">
          {copy.dayLabel} {gameState.nightNumber}
        </span>
      </div>

      <div className="day-layout">
        <article className="flow-card">
          <h3>{copy.morningAnnouncement}</h3>
          <p className="mini-note">
            {lastNightResult ? getNightSummaryText(lastNightResult, gameState.players, locale) : copy.noNightSummary}
          </p>
          <ul className="compact-list">
            {lastNightDeaths.length > 0 ? (
              lastNightDeaths.map((playerId) => {
                const player = gameState.players.find((item) => item.id === playerId);
                if (!player) {
                  return null;
                }

                return (
                  <li key={player.id}>
                    <strong>{player.name}</strong>
                    <span>{player.roleRevealDeferred ? copy.hiddenRole : getRoleLabel(player.role, locale)}</span>
                  </li>
                );
              })
            ) : (
              <li>
                <strong>{copy.nobodyDied}</strong>
                <span>{copy.noLossAtTable}</span>
              </li>
            )}
          </ul>

          {gameState.pendingRevealIds.length > 0 ? (
            <p className="mini-note">
              {copy.dayEndReveal}{' '}
              <strong>
                {gameState.pendingRevealIds.map((playerId) => getPlayerName(gameState.players, playerId, locale)).join(', ')}
              </strong>
            </p>
          ) : null}
        </article>

        <article className="flow-card">
          <h3>{copy.voteTitle}</h3>
          <label className="field">
            <span>{copy.lynchTarget}</span>
            <select value={lynchTargetId} onChange={(event) => setLynchTargetId(event.target.value)}>
              <option value="">{copy.noLynch}</option>
              {alivePlayers.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.name}
                </option>
              ))}
            </select>
          </label>
          <p className="mini-note">{copy.noLynchDescription}</p>
          <button className="primary-button" type="button" onClick={() => onResolveDay(lynchTargetId || null)}>
            {copy.finishDay}
          </button>
        </article>
      </div>
    </section>
  );
}

function OutcomePanel({ gameState, locale }: { gameState: GameState; locale: Locale }) {
  const copy = APP_COPY[locale];

  if (gameState.phase !== 'finished' || !gameState.winner) {
    return null;
  }

  const winnerText = getTeamLabel(gameState.winner, locale);
  const finalNote = gameState.winner === 'village' ? copy.villageCleaned : copy.vampiresParity;

  return (
    <section className="panel panel-accent">
      <div className="panel-head">
        <div>
          <p className="eyebrow">{copy.finalEyebrow}</p>
          <h2>
            {winnerText} {copy.won}
          </h2>
        </div>
      </div>
      <p className="lede">{finalNote}</p>
    </section>
  );
}

function PlayersPanel({
  players,
  locale,
  showRoles,
}: {
  players: Player[];
  locale: Locale;
  showRoles: boolean;
}) {
  const copy = APP_COPY[locale];
  const alivePlayers = players.filter((player) => player.alive);
  const eliminatedPlayers = players.filter((player) => !player.alive);

  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <p className="eyebrow">{copy.playersEyebrow}</p>
          <h2>{copy.playersTitle}</h2>
        </div>
      </div>

      <div className="players-layout">
        <article className="flow-card">
          <h3>{copy.alive}</h3>
          <ul className="player-list">
            {alivePlayers.map((player) => (
              <li key={player.id}>
                <div>
                  <strong>{player.name}</strong>
                  <span>{copy.atTable}</span>
                </div>
                <span className="role-chip muted">
                  {shouldShowRole(player, showRoles) ? getRoleLabel(player.role, locale) : copy.roleHidden}
                </span>
              </li>
            ))}
          </ul>
        </article>

        <article className="flow-card">
          <h3>{copy.eliminated}</h3>
          <ul className="player-list">
            {eliminatedPlayers.length > 0 ? (
              eliminatedPlayers.map((player) => (
                <li key={player.id}>
                  <div>
                    <strong>{player.name}</strong>
                    <span>
                      {player.eliminatedAt
                        ? roundLabel(player.eliminatedAt.round, locale, player.eliminatedAt.phase)
                        : copy.none}
                    </span>
                  </div>
                  <span className="role-chip muted">
                    {player.roleRevealDeferred && !showRoles ? copy.roleDelayed : getRoleLabel(player.role, locale)}
                  </span>
                </li>
              ))
            ) : (
              <li className="empty-state">{copy.nobodyEliminatedYet}</li>
            )}
          </ul>
        </article>
      </div>
    </section>
  );
}

function HistoryPanel({ gameState, locale }: { gameState: GameState; locale: Locale }) {
  const copy = APP_COPY[locale];

  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <p className="eyebrow">{copy.historyEyebrow}</p>
          <h2>{copy.historyTitle}</h2>
        </div>
      </div>

      <div className="history-stack">
        {gameState.logs.length === 0 ? (
          <p className="empty-state">{copy.noNightLogs}</p>
        ) : (
          gameState.logs
            .slice()
            .reverse()
            .map((log) => {
              const event = getEventCard(log.eventId);
              return (
                <article className="history-card" key={`night-log-${log.nightNumber}`}>
                  <div className="history-card-head">
                    <strong>
                      {copy.night} {log.nightNumber}
                    </strong>
                    <span>{event?.title[locale] ?? copy.standardNight}</span>
                  </div>
                  <p>{getNightSummaryText(log.result, gameState.players, locale)}</p>
                  <ul className="compact-list">
                    <li>
                      <strong>{copy.vampirePrimary}</strong>
                      <span>{getPlayerName(gameState.players, log.inputs.vampirePrimaryTargetId, locale)}</span>
                    </li>
                    {log.inputs.vampireBackupTargetId ? (
                      <li>
                        <strong>{copy.vampireBackup}</strong>
                        <span>{getPlayerName(gameState.players, log.inputs.vampireBackupTargetId, locale)}</span>
                      </li>
                    ) : null}
                    <li>
                      <strong>{copy.clericTargets}</strong>
                      <span>
                        {log.inputs.clericTargetIds.length > 0
                          ? log.inputs.clericTargetIds
                              .map((playerId) => getPlayerName(gameState.players, playerId, locale))
                              .join(', ')
                          : copy.noSelection}
                      </span>
                    </li>
                    {log.inputs.clericHelperId ? (
                      <li>
                        <strong>{copy.sharedRitualHelper}</strong>
                        <span>{getPlayerName(gameState.players, log.inputs.clericHelperId, locale)}</span>
                      </li>
                    ) : null}
                  </ul>
                </article>
              );
            })
        )}

        {gameState.dayLogs.length > 0
          ? gameState.dayLogs
              .slice()
              .reverse()
              .map((log) => (
                <article className="history-card secondary-card" key={`day-log-${log.dayNumber}`}>
                  <div className="history-card-head">
                    <strong>
                      {copy.dayLabel} {log.dayNumber}
                    </strong>
                    <span>{copy.dayVote}</span>
                  </div>
                  <p>{getDayNoteText(log, gameState.players, locale)}</p>
                  {log.roleRevealIds.length > 0 ? (
                    <p className="mini-note">
                      {copy.revealedRoles}{' '}
                      <strong>
                        {log.roleRevealIds.map((playerId) => getPlayerName(gameState.players, playerId, locale)).join(', ')}
                      </strong>
                    </p>
                  ) : null}
                </article>
              ))
          : null}
      </div>
    </section>
  );
}

export default function App() {
  const [gameState, setGameState] = useState<GameState | null>(() => loadGameState());
  const [locale, setLocale] = useState<Locale>(() => loadLocale());
  const [showRoles, setShowRoles] = useState(false);

  useEffect(() => {
    saveGameState(gameState);
  }, [gameState]);

  useEffect(() => {
    saveLocale(locale);
  }, [locale]);

  function applyGameUpdate(updater: (currentGame: GameState) => GameState) {
    startTransition(() => {
      setGameState((currentGame) => (currentGame ? updater(currentGame) : currentGame));
    });
  }

  function handleCreateGame(players: SetupPlayerInput[]) {
    startTransition(() => {
      setShowRoles(false);
      setGameState(createGame(players, Math.random, locale));
    });
  }

  function handleResetGame() {
    const confirmed = window.confirm(APP_COPY[locale].resetConfirm);
    if (!confirmed) {
      return;
    }

    startTransition(() => {
      setShowRoles(false);
      setGameState(null);
    });
  }

  if (!gameState) {
    return <SetupScreen locale={locale} onLocaleChange={setLocale} onCreate={handleCreateGame} />;
  }

  return (
    <main className="app-shell">
      <LanguageBar locale={locale} onLocaleChange={setLocale} />

      <StatusPanel
        gameState={gameState}
        locale={locale}
        showRoles={showRoles}
        onToggleRoles={() => setShowRoles((currentValue) => !currentValue)}
        onReset={handleResetGame}
      />

      <NightPanel
        gameState={gameState}
        locale={locale}
        onStartNight={() => applyGameUpdate((currentGame) => beginNight(currentGame))}
        onUpdateNightInput={(patch) =>
          applyGameUpdate((currentGame) => updateNightInput(currentGame, patch))
        }
        onResolveNight={() => applyGameUpdate((currentGame) => resolveNight(currentGame, locale))}
      />

      <DayPanel
        gameState={gameState}
        locale={locale}
        onResolveDay={(lynchTargetId) =>
          applyGameUpdate((currentGame) => resolveDay(currentGame, lynchTargetId, locale))
        }
      />

      <OutcomePanel gameState={gameState} locale={locale} />
      <PlayersPanel players={gameState.players} locale={locale} showRoles={showRoles} />
      <HistoryPanel gameState={gameState} locale={locale} />
    </main>
  );
}
