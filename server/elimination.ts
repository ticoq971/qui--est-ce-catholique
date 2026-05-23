import type { Room } from './gameEngine';

export type EliminatedByOpponent = Record<string, string[]>;
export function initEliminatedByOpponent(room: Room, playerId: string): EliminatedByOpponent {
  const boards: EliminatedByOpponent = {};
  for (const oppId of room.playerOrder) {
    if (oppId !== playerId) boards[oppId] = [];
  }
  return boards;
}

export function ensureEliminatedBoard(player: { eliminatedByOpponent: EliminatedByOpponent }, oppId: string): string[] {
  if (!player.eliminatedByOpponent[oppId]) {
    player.eliminatedByOpponent[oppId] = [];
  }
  return player.eliminatedByOpponent[oppId];
}

export function toggleEliminatedForOpponent(
  player: { eliminatedByOpponent: EliminatedByOpponent },
  oppId: string,
  characterId: string,
): void {
  const board = ensureEliminatedBoard(player, oppId);
  const idx = board.indexOf(characterId);
  if (idx >= 0) board.splice(idx, 1);
  else board.push(characterId);
}

export function bulkEliminateForOpponent(
  player: { eliminatedByOpponent: EliminatedByOpponent },
  oppId: string,
  characterIds: string[],
): void {
  const board = ensureEliminatedBoard(player, oppId);
  const set = new Set(board);
  for (const id of characterIds) set.add(id);
  player.eliminatedByOpponent[oppId] = [...set];
}

/** Au début de partie : votre personnage secret n'est pas un candidat pour les adversaires */
export function seedOwnCharacterOnOpponentBoards(
  player: { characterId: string | null; eliminatedByOpponent: EliminatedByOpponent },
): void {
  if (!player.characterId) return;
  for (const oppId of Object.keys(player.eliminatedByOpponent)) {
    const board = ensureEliminatedBoard(player, oppId);
    if (!board.includes(player.characterId)) board.push(player.characterId);
  }
}

export function copyEliminatedByOpponent(source: EliminatedByOpponent): EliminatedByOpponent {
  const copy: EliminatedByOpponent = {};
  for (const [oppId, ids] of Object.entries(source)) {
    copy[oppId] = [...ids];
  }
  return copy;
}
