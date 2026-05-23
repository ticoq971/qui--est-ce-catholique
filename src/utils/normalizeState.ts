import type { GameStatePublic, PlayerPrivate, PlayerPublic, RoomJoinedPayload } from '../types';

const DEFAULT_PRIVATE: PlayerPrivate = {
  characterId: null,
  characterName: null,
  eliminatedByOpponent: {},
  specialCards: [],
  canAskSecondQuestion: false,
  canRetryTurn: false,
  hasGuessedThisTurn: false,
  opponentCandidates: {},
};

function normalizePlayer(player: PlayerPublic): PlayerPublic {
  return {
    ...player,
    guessesCorrect: player.guessesCorrect ?? [],
    eliminatedFromGame: player.eliminatedFromGame ?? false,
    specialCardsUsed: player.specialCardsUsed ?? [],
  };
}

/** Ancien format `eliminated: string[]` → plateaux par adversaire */
function normalizeEliminatedByOpponent(
  raw: Record<string, string[]> | null | undefined,
  legacyEliminated: string[] | undefined,
  opponentIds: string[],
): Record<string, string[]> {
  const boards: Record<string, string[]> = { ...(raw ?? {}) };

  if (legacyEliminated?.length) {
    for (const id of opponentIds) {
      if (!boards[id]?.length) boards[id] = [...legacyEliminated];
    }
  }

  for (const id of opponentIds) {
    if (!boards[id]) boards[id] = [];
  }

  return boards;
}

export function normalizePrivateState(
  state: Partial<PlayerPrivate> & { eliminated?: string[] } | null | undefined,
  opponentIds: string[] = [],
): PlayerPrivate {
  if (!state) return { ...DEFAULT_PRIVATE };

  const legacy = state.eliminated;
  const eliminatedByOpponent = normalizeEliminatedByOpponent(
    state.eliminatedByOpponent,
    legacy,
    opponentIds,
  );

  return {
    ...DEFAULT_PRIVATE,
    ...state,
    eliminatedByOpponent,
    specialCards: state.specialCards ?? [],
    opponentCandidates: state.opponentCandidates ?? {},
    hasGuessedThisTurn: state.hasGuessedThisTurn ?? false,
    canAskSecondQuestion: state.canAskSecondQuestion ?? false,
    canRetryTurn: state.canRetryTurn ?? false,
  };
}

export function normalizeGameState(state: GameStatePublic | null | undefined): GameStatePublic | null {
  if (!state) return null;

  return {
    ...state,
    players: (state.players ?? []).map(normalizePlayer),
    activeCharacters: state.activeCharacters ?? [],
    questionHistory: state.questionHistory ?? [],
    guessHistory: state.guessHistory ?? [],
    pendingQuestion: state.pendingQuestion
      ? {
          ...state.pendingQuestion,
          answers: state.pendingQuestion.answers ?? {},
        }
      : null,
  };
}

export function normalizeRoomPayload(payload: RoomJoinedPayload): RoomJoinedPayload {
  const gameState = normalizeGameState(payload.gameState)!;
  const opponentIds = gameState.players
    .filter((p) => p.id !== payload.playerId)
    .map((p) => p.id);

  return {
    ...payload,
    gameState,
    privateState: normalizePrivateState(payload.privateState, opponentIds),
    allCharacters: payload.allCharacters ?? [],
  };
}
