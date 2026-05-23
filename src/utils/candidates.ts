import type { Character } from '../types';

/**
 * Candidats affichés par adversaire :
 * déduction serveur ∩ personnages non éliminés sur le plateau de cet adversaire.
 */
export function computeOpponentCandidates(
  opponents: { id: string }[],
  activeCharacterIds: string[] | undefined,
  ownCharacterId: string | null,
  eliminatedByOpponent: Record<string, string[]> | undefined,
  serverKnowledge: Record<string, string[]> | undefined,
): Record<string, string[]> {
  const activeIds = activeCharacterIds ?? [];
  const elimBoards = eliminatedByOpponent ?? {};
  const knowledge = serverKnowledge ?? {};
  const result: Record<string, string[]> = {};

  for (const opp of opponents) {
    const elim = new Set(elimBoards[opp.id] ?? []);
    const deduced = knowledge[opp.id];
    const basePool = deduced?.length
      ? deduced
      : activeIds.filter((id) => id !== ownCharacterId);

    result[opp.id] = basePool.filter(
      (id) => id !== ownCharacterId && !elim.has(id),
    );
  }

  return result;
}

export function countCandidates(candidates: Record<string, string[]>, oppId: string): number {
  return candidates[oppId]?.length ?? 0;
}

export function resolveOpponentCharacters(
  candidates: Record<string, string[]>,
  allCharacters: Character[],
): Record<string, Character[]> {
  const charMap = new Map(allCharacters.map((c) => [c.id, c]));
  const result: Record<string, Character[]> = {};
  for (const [oppId, ids] of Object.entries(candidates)) {
    result[oppId] = ids
      .map((id) => charMap.get(id))
      .filter((c): c is Character => !!c);
  }
  return result;
}

export function resolveOpponentCharactersForAll(
  opponents: { id: string }[],
  candidates: Record<string, string[]>,
  allCharacters: Character[],
): Record<string, Character[]> {
  const resolved = resolveOpponentCharacters(candidates, allCharacters);
  const result: Record<string, Character[]> = {};
  for (const opp of opponents) {
    result[opp.id] = resolved[opp.id] ?? [];
  }
  return result;
}

/** Plateau solo / vs IA : premier adversaire ou fusion de tous les plateaux */
export function getPrimaryOpponentId(
  opponents: { id: string }[],
): string | null {
  return opponents[0]?.id ?? null;
}

export function getEliminatedForOpponent(
  eliminatedByOpponent: Record<string, string[]> | null | undefined,
  opponentId: string | null,
): string[] {
  if (!opponentId || !eliminatedByOpponent) return [];
  return eliminatedByOpponent[opponentId] ?? [];
}

export function mergeAllEliminated(
  eliminatedByOpponent: Record<string, string[]> | null | undefined,
): string[] {
  if (!eliminatedByOpponent) return [];
  const set = new Set<string>();
  for (const ids of Object.values(eliminatedByOpponent)) {
    for (const id of ids) set.add(id);
  }
  return [...set];
}
