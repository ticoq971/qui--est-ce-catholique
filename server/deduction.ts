import { getCharacterById } from '../src/data/characters';
import type { AttributeKey } from '../src/types';

export interface PlayerKnowledge {
  possibleByOpponent: Map<string, Set<string>>;
}

export function initPlayerKnowledge(
  playerId: string,
  playerOrder: string[],
  ownCharacterId: string | null,
  activeCharacterIds: string[],
): PlayerKnowledge {
  const candidates = activeCharacterIds.filter((id) => id !== ownCharacterId);
  const possibleByOpponent = new Map<string, Set<string>>();

  for (const oppId of playerOrder) {
    if (oppId === playerId) continue;
    possibleByOpponent.set(oppId, new Set(candidates));
  }

  return { possibleByOpponent };
}

export function filterByAttribute(ids: Set<string>, key: AttributeKey, value: boolean): Set<string> {
  const next = new Set<string>();
  for (const id of ids) {
    const char = getCharacterById(id);
    if (char && char.attributes[key] === value) next.add(id);
  }
  return next;
}

export function applyAnswersToKnowledge(
  knowledge: PlayerKnowledge,
  attributeKey: AttributeKey,
  answers: Map<string, boolean>,
) {
  for (const [responderId, answer] of answers) {
    const current = knowledge.possibleByOpponent.get(responderId);
    if (!current) continue;
    knowledge.possibleByOpponent.set(responderId, filterByAttribute(current, attributeKey, answer));
  }
}

export function applyRevelationToKnowledge(
  knowledge: PlayerKnowledge,
  targetId: string,
  attributeKey: AttributeKey,
  value: boolean,
) {
  const current = knowledge.possibleByOpponent.get(targetId);
  if (!current) return;
  knowledge.possibleByOpponent.set(targetId, filterByAttribute(current, attributeKey, value));
}

export function knowledgeToRecord(knowledge: PlayerKnowledge): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const [oppId, ids] of knowledge.possibleByOpponent) {
    result[oppId] = [...ids];
  }
  return result;
}

export function findSingleCandidate(knowledge: PlayerKnowledge): { oppId: string; characterId: string } | null {
  for (const [oppId, possibles] of knowledge.possibleByOpponent) {
    if (possibles.size === 1) {
      return { oppId, characterId: [...possibles][0] };
    }
  }
  return null;
}

export function findBestGuess(knowledge: PlayerKnowledge): { oppId: string; characterId: string } | null {
  let best: { oppId: string; ids: string[] } | null = null;

  for (const [oppId, possibles] of knowledge.possibleByOpponent) {
    if (possibles.size === 0) continue;
    if (!best || possibles.size < best.ids.length) {
      best = { oppId, ids: [...possibles] };
    }
  }

  if (!best) return null;
  return {
    oppId: best.oppId,
    characterId: best.ids[Math.floor(Math.random() * best.ids.length)],
  };
}
