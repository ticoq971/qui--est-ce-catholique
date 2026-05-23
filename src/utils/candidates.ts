import type { Character } from '../types';

/**
 * Candidats affichés par adversaire :
 * déduction serveur ∩ personnages non éliminés sur le plateau de cet adversaire.
 */
export function computeOpponentCandidates(
  opponents: { id: string }[],
  activeCharacterIds: string[],
  ownCharacterId: string | null,
  eliminatedByOpponent: Record<string, string[]>,
  serverKnowledge: Record<string, string[]>,
): Record<string, string[]> {
  const result: Record<string, string[]> = {};

  for (const opp of opponents) {
    const elim = new Set(eliminatedByOpponent[opp.id] ?? []);
    const deduced = serverKnowledge[opp.id];
    const basePool = deduced?.length
      ? deduced
      : activeCharacterIds.filter((id) => id !== ownCharacterId);

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
  eliminatedByOpponent: Record<string, string[]>,
  opponentId: string | null,
): string[] {
  if (!opponentId) return [];
  return eliminatedByOpponent[opponentId] ?? [];
}

export function mergeAllEliminated(
  eliminatedByOpponent: Record<string, string[]>,
): string[] {
  const set = new Set<string>();
  for (const ids of Object.values(eliminatedByOpponent)) {
    for (const id of ids) set.add(id);
  }
  return [...set];
}
