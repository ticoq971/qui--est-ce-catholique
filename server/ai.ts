import { getCharacterById } from '../src/data/characters';
import type { AttributeKey } from '../src/types';
import { ATTRIBUTE_QUESTIONS } from '../src/types';
import type { Room, Player, ServerContext } from './gameEngine';
import {
  applyAnswersToKnowledge,
  applyRevelationToKnowledge,
  findBestGuess,
  findSingleCandidate,
  initPlayerKnowledge,
  type PlayerKnowledge,
} from './deduction';

const BOT_NAMES = ['Sœur Thérèse IA', 'Frère François IA', 'Monseigneur IA'];

const aiTimers = new Map<string, ReturnType<typeof setTimeout>>();

export function createBotPlayer(name: string): Player {
  return {
    id: crypto.randomUUID(),
    socketId: '',
    name,
    isHost: false,
    isBot: true,
    connected: true,
    characterId: null,
    eliminated: [],
    specialCards: [],
    specialCardsUsed: [],
    guessesCorrect: [],
    canAskSecondQuestion: false,
    canRetryTurn: false,
    hasGuessedThisTurn: false,
  };
}

export function getBotName(index: number): string {
  return BOT_NAMES[index] ?? `Bot ${index + 1}`;
}

function getKnowledge(room: Room, playerId: string): PlayerKnowledge | undefined {
  return room.playerKnowledge.get(playerId);
}

function pickBestQuestion(knowledge: PlayerKnowledge): AttributeKey | null {
  const entries = [...knowledge.possibleByOpponent.entries()];
  if (entries.length === 0) return null;

  const primarySet = entries[0][1];
  if (primarySet.size <= 1) return null;

  let bestKey: AttributeKey | null = null;
  let bestScore = -1;

  for (const q of ATTRIBUTE_QUESTIONS) {
    let yes = 0;
    let no = 0;
    for (const id of primarySet) {
      const char = getCharacterById(id);
      if (!char) continue;
      if (char.attributes[q.key]) yes++;
      else no++;
    }

    const total = yes + no;
    if (total === 0) continue;
    const ratio = Math.min(yes, no) / total;
    if (ratio > bestScore) {
      bestScore = ratio;
      bestKey = q.key;
    }
  }

  return bestKey ?? ATTRIBUTE_QUESTIONS[0]?.key ?? null;
}

function pickRevelationTarget(knowledge: PlayerKnowledge): { oppId: string; attributeKey: AttributeKey } | null {
  for (const [oppId, possibles] of knowledge.possibleByOpponent) {
    if (possibles.size <= 3 || possibles.size >= 12) continue;
    const attr = pickBestQuestion({ possibleByOpponent: new Map([[oppId, possibles]]) });
    if (attr) return { oppId, attributeKey: attr };
  }
  return null;
}

function syncEliminationsFromKnowledge(room: Room, playerId: string, knowledge: PlayerKnowledge) {
  const player = room.players.get(playerId)!;
  const elim = new Set(player.eliminated);

  for (const id of room.activeCharacterIds) {
    if (id === player.characterId) {
      elim.add(id);
      continue;
    }
    let stillPossible = false;
    for (const possibles of knowledge.possibleByOpponent.values()) {
      if (possibles.has(id)) {
        stillPossible = true;
        break;
      }
    }
    if (!stillPossible) elim.add(id);
  }

  player.eliminated = [...elim];
}

function clearAiTimer(roomCode: string) {
  const existing = aiTimers.get(roomCode);
  if (existing) {
    clearTimeout(existing);
    aiTimers.delete(roomCode);
  }
}

function scheduleAiTurn(ctx: ServerContext, room: Room, delayMs = 1500) {
  clearAiTimer(room.code);

  const currentId = room.playerOrder[room.currentTurnIndex];
  const bot = room.players.get(currentId);
  if (!bot?.isBot || room.status !== 'playing' || room.winnerId) return;

  room.aiThinking = true;

  const timer = setTimeout(() => {
    aiTimers.delete(room.code);
    room.aiThinking = false;
    executeAiTurn(ctx, room);
  }, delayMs + Math.random() * 1000);

  aiTimers.set(room.code, timer);
}

function executeAiTurn(ctx: ServerContext, room: Room) {
  if (room.status !== 'playing' || room.winnerId) return;

  const currentId = room.playerOrder[room.currentTurnIndex];
  const bot = room.players.get(currentId);
  if (!bot?.isBot) return;
  if (room.pendingQuestion) {
    scheduleAiTurn(ctx, room, 500);
    return;
  }

  const knowledge = getKnowledge(room, bot.id);
  if (!knowledge) {
    scheduleAiTurn(ctx, room, 500);
    return;
  }

  const single = findSingleCandidate(knowledge);
  if (single) {
    ctx.performGuess(room, bot.id, single.oppId, single.characterId);
    return;
  }

  const hasRevelation = bot.specialCards.includes('revelation') && !bot.specialCardsUsed.includes('revelation');
  const stuck = [...knowledge.possibleByOpponent.values()].some((s) => s.size > 5);
  if (hasRevelation && stuck) {
    const rev = pickRevelationTarget(knowledge);
    if (rev) {
      ctx.performSpecialCard(room, bot.id, 'revelation', rev.oppId, rev.attributeKey);
      scheduleAiTurn(ctx, room, 1200);
      return;
    }
  }

  const hasMiracle = bot.specialCards.includes('miracle') && !bot.specialCardsUsed.includes('miracle');
  if (hasMiracle) {
    const avgSize = [...knowledge.possibleByOpponent.values()].reduce((s, set) => s + set.size, 0);
    if (avgSize > 8 && Math.random() < 0.3) {
      ctx.performSpecialCard(room, bot.id, 'miracle');
      scheduleAiTurn(ctx, room, 800);
      return;
    }
  }

  const question = pickBestQuestion(knowledge);
  if (question) {
    ctx.performAskQuestion(room, bot.id, question);
    return;
  }

  const bestGuess = findBestGuess(knowledge);
  if (bestGuess) {
    ctx.performGuess(room, bot.id, bestGuess.oppId, bestGuess.characterId);
    return;
  }

  const fallback = ATTRIBUTE_QUESTIONS[Math.floor(Math.random() * ATTRIBUTE_QUESTIONS.length)];
  ctx.performAskQuestion(room, bot.id, fallback.key);
}

export function runAiTurn(ctx: ServerContext, room: Room) {
  if (room.status !== 'playing' || room.winnerId) return;

  const currentId = room.playerOrder[room.currentTurnIndex];
  const bot = room.players.get(currentId);
  if (!bot?.isBot) return;

  scheduleAiTurn(ctx, room);
}

export function maybeAiIntercession(ctx: ServerContext, room: Room, humanAskerId: string) {
  if (!room.pendingQuestion || room.pendingQuestion.blocked) return;

  for (const [botId, bot] of room.players) {
    if (!bot.isBot || botId === humanAskerId) continue;
    const hasCard = bot.specialCards.includes('intercession') && !bot.specialCardsUsed.includes('intercession');
    if (!hasCard) continue;

    if (Math.random() < 0.18) {
      setTimeout(() => {
        if (room.pendingQuestion && !room.pendingQuestion.blocked && room.pendingQuestion.askerId === humanAskerId) {
          ctx.performSpecialCard(room, botId, 'intercession');
        }
      }, 800 + Math.random() * 1500);
    }
  }
}

export function onQuestionResolvedForKnowledge(
  room: Room,
  _askerId: string,
  attributeKey: AttributeKey,
  answers: Map<string, boolean>,
) {
  for (const playerId of room.playerKnowledge.keys()) {
    const knowledge = room.playerKnowledge.get(playerId);
    if (!knowledge) continue;
    applyAnswersToKnowledge(knowledge, attributeKey, answers);
    syncEliminationsFromKnowledge(room, playerId, knowledge);
  }
}

export function onRevelationForKnowledge(
  room: Room,
  playerId: string,
  targetId: string,
  attributeKey: AttributeKey,
  value: boolean,
) {
  const knowledge = getKnowledge(room, playerId);
  if (!knowledge) return;

  applyRevelationToKnowledge(knowledge, targetId, attributeKey, value);
  syncEliminationsFromKnowledge(room, playerId, knowledge);
}

export function initAllPlayerKnowledge(room: Room) {
  room.playerKnowledge.clear();
  for (const playerId of room.playerOrder) {
    const player = room.players.get(playerId)!;
    room.playerKnowledge.set(
      playerId,
      initPlayerKnowledge(playerId, room.playerOrder, player.characterId, room.activeCharacterIds),
    );
  }
}

export function cleanupRoomTimers(roomCode: string) {
  clearAiTimer(roomCode);
}

export type AiKnowledge = PlayerKnowledge;

export function initAiKnowledge(room: Room, botId: string): PlayerKnowledge {
  const bot = room.players.get(botId)!;
  return initPlayerKnowledge(botId, room.playerOrder, bot.characterId, room.activeCharacterIds);
}

export function onAiQuestionResolved(room: Room, askerId: string, attributeKey: AttributeKey, answers: Map<string, boolean>) {
  onQuestionResolvedForKnowledge(room, askerId, attributeKey, answers);
}

export function onAiRevelation(room: Room, botId: string, targetId: string, attributeKey: AttributeKey, value: boolean) {
  onRevelationForKnowledge(room, botId, targetId, attributeKey, value);
}
