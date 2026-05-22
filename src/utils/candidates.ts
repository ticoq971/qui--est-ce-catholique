import type { Character } from '../types';

/**
 * Candidats affichés pour un adversaire :
 * déduction serveur ∩ personnages encore actifs sur votre plateau (non éliminés).
 */
export function computeOpponentCandidates(
  opponents: { id: string }[],
  activeCharacterIds: string[],
  ownCharacterId: string | null,
  eliminated: string[],
  serverKnowledge: Record<string, string[]>,
): Record<string, string[]> {
  const elim = new Set(eliminated);
  const result: Record<string, string[]> = {};

  for (const opp of opponents) {
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

/** @deprecated Utiliser computeOpponentCandidates */
export function filterCandidatesByEliminated(
  candidates: Record<string, string[]>,
  eliminated: string[],
): Record<string, string[]> {
  if (eliminated.length === 0) return candidates;
  const elim = new Set(eliminated);
  const result: Record<string, string[]> = {};
  for (const [oppId, ids] of Object.entries(candidates)) {
    result[oppId] = ids.filter((id) => !elim.has(id));
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
