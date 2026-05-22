import type { Server } from 'socket.io';
import type { AttributeKey, GameStatePublic, PlayerPrivate, PlayerPublic, QuestionHistoryEntry, RoomJoinedPayload, SpecialCardType } from '../src/types';
import { ATTRIBUTE_QUESTIONS } from '../src/types';
import { CHARACTERS, getCharacterById, shuffleArray } from '../src/data/characters';
import { knowledgeToRecord, type PlayerKnowledge } from './deduction';
import {
  createBotPlayer,
  dealBotSpecialCards,
  getBotName,
  initAllPlayerKnowledge,
  maybeAiIntercession,
  onAiQuestionResolved,
  onRevelationForKnowledge,
  runAiTurn,
} from './ai';

export interface Player {
  id: string;
  socketId: string;
  name: string;
  isHost: boolean;
  isBot: boolean;
  connected: boolean;
  characterId: string | null;
  eliminated: string[];
  specialCards: SpecialCardType[];
  specialCardsUsed: SpecialCardType[];
  guessesCorrect: string[];
  canAskSecondQuestion: boolean;
  canRetryTurn: boolean;
}

export interface PendingQuestion {
  askerId: string;
  attributeKey: AttributeKey | null;
  customText: string | null;
  isCustom: boolean;
  isConcile: boolean;
  blocked: boolean;
  manualAnswers: boolean;
  answers: Map<string, boolean>;
}

export interface Room {
  code: string;
  status: 'waiting' | 'playing' | 'finished';
  isVsAI: boolean;
  players: Map<string, Player>;
  playerOrder: string[];
  currentTurnIndex: number;
  turnNumber: number;
  winnerId: string | null;
  activeCharacterIds: string[];
  pendingQuestion: PendingQuestion | null;
  lastAction: string | null;
  revelationResult: {
    targetPlayerId: string;
    attributeKey: AttributeKey;
    value: boolean;
    forPlayerId: string;
  } | null;
  questionHistory: QuestionHistoryEntry[];
  playerKnowledge: Map<string, PlayerKnowledge>;
  aiThinking: boolean;
}

export interface ServerContext {
  io: Server;
  performAskQuestion: (room: Room, playerId: string, attributeKey: AttributeKey) => void;
  performAskCustomQuestion: (room: Room, playerId: string, text: string) => void;
  submitAnswer: (room: Room, playerId: string, answer: boolean) => void;
  performSpecialCard: (room: Room, playerId: string, cardType: SpecialCardType, targetPlayerId?: string, attributeKey?: AttributeKey) => void;
  performGuess: (room: Room, playerId: string, targetPlayerId: string, characterId: string) => void;
}

const ALL_SPECIAL_CARDS: SpecialCardType[] = ['miracle', 'revelation', 'intercession', 'concile', 'martyre'];

function getAttributeLabel(key: AttributeKey): string {
  return ATTRIBUTE_QUESTIONS.find((q) => q.key === key)?.label ?? key;
}

function allRespondersAnswered(room: Room, pq: PendingQuestion): boolean {
  const responders = getResponders(room, pq.askerId, pq.isConcile);
  return responders.every((id) => pq.answers.has(id));
}

function getQuestionLabel(pq: PendingQuestion): string {
  if (pq.isCustom && pq.customText) return pq.customText;
  if (pq.attributeKey) return getAttributeLabel(pq.attributeKey);
  return '?';
}

function getResponders(room: Room, askerId: string, isConcile: boolean): string[] {
  return isConcile ? room.playerOrder : room.playerOrder.filter((id) => id !== askerId);
}

function needsManualAnswers(room: Room): boolean {
  return !room.isVsAI;
}

function autoAnswerBots(room: Room, pq: PendingQuestion) {
  const responders = getResponders(room, pq.askerId, pq.isConcile);
  for (const id of responders) {
    const player = room.players.get(id)!;
    if (!player.isBot || !player.characterId || pq.answers.has(id)) continue;
    if (pq.attributeKey) {
      const char = getCharacterById(player.characterId)!;
      pq.answers.set(id, char.attributes[pq.attributeKey]);
    }
  }
}

function getPlayerPublic(player: Player): PlayerPublic {
  return {
    id: player.id,
    name: player.name,
    isHost: player.isHost,
    isBot: player.isBot,
    connected: player.connected,
    guessesCorrect: [...player.guessesCorrect],
    specialCardsUsed: [...player.specialCardsUsed],
    hasAnswered: false,
    answeredYes: null,
  };
}

function enrichPlayersPublic(room: Room): PlayerPublic[] {
  return room.playerOrder.map((id) => {
    const p = room.players.get(id)!;
    const pub = getPlayerPublic(p);
    if (room.pendingQuestion && !room.pendingQuestion.blocked) {
      pub.hasAnswered = room.pendingQuestion.answers.has(id);
      pub.answeredYes = room.pendingQuestion.answers.get(id) ?? null;
    }
    return pub;
  });
}

export function getGameStatePublic(room: Room): GameStatePublic {
  const pending = room.pendingQuestion;
  const asker = pending ? room.players.get(pending.askerId) : null;

  return {
    roomCode: room.code,
    status: room.status,
    isVsAI: room.isVsAI,
    players: enrichPlayersPublic(room),
    currentTurnPlayerId: room.status === 'playing' ? room.playerOrder[room.currentTurnIndex] ?? null : null,
    turnNumber: room.turnNumber,
    winnerId: room.winnerId,
    winnerName: room.winnerId ? room.players.get(room.winnerId)?.name ?? null : null,
    pendingQuestion: pending && asker
      ? {
          askerId: pending.askerId,
          askerName: asker.name,
          attributeKey: pending.attributeKey,
          attributeLabel: getQuestionLabel(pending),
          customText: pending.customText,
          isCustom: pending.isCustom,
          isConcile: pending.isConcile,
          blocked: pending.blocked,
          manualAnswers: pending.manualAnswers,
          answers: Object.fromEntries(pending.answers),
        }
      : null,
    lastAction: room.lastAction,
    revelationResult: room.revelationResult,
    activeCharacters: [...room.activeCharacterIds],
    questionHistory: [...room.questionHistory],
    aiThinking: room.aiThinking,
  };
}

function getPlayerPrivate(room: Room, player: Player): PlayerPrivate {
  const char = player.characterId ? getCharacterById(player.characterId) : null;
  const knowledge = room.playerKnowledge.get(player.id);
  return {
    characterId: player.characterId,
    characterName: char?.name ?? null,
    eliminated: [...player.eliminated],
    specialCards: player.specialCards.filter((c) => !player.specialCardsUsed.includes(c)),
    canAskSecondQuestion: player.canAskSecondQuestion,
    canRetryTurn: player.canRetryTurn,
    opponentCandidates: knowledge ? knowledgeToRecord(knowledge) : {},
  };
}

export function buildRoomPayload(room: Room, playerId: string): RoomJoinedPayload {
  return {
    playerId,
    gameState: getGameStatePublic(room),
    privateState: getPlayerPrivate(room, room.players.get(playerId)!),
    allCharacters: CHARACTERS.filter((c) => room.activeCharacterIds.includes(c.id)),
  };
}

export function broadcastRoom(ctx: ServerContext, room: Room) {
  for (const [playerId, player] of room.players) {
    if (player.connected && !player.isBot && player.socketId) {
      ctx.io.to(player.socketId).emit('roomUpdate', buildRoomPayload(room, playerId));
    }
  }
}

function getOpponents(room: Room, playerId: string): Player[] {
  return room.playerOrder.filter((id) => id !== playerId).map((id) => room.players.get(id)!);
}

function checkWinner(room: Room): string | null {
  for (const playerId of room.playerOrder) {
    const player = room.players.get(playerId)!;
    const opponents = getOpponents(room, playerId);
    if (opponents.length > 0 && opponents.every((o) => player.guessesCorrect.includes(o.id))) {
      return playerId;
    }
  }
  return null;
}

function assignCharacters(room: Room) {
  const shuffled = shuffleArray([...room.activeCharacterIds]);
  room.playerOrder.forEach((playerId, i) => {
    room.players.get(playerId)!.characterId = shuffled[i];
  });
}

function dealSpecialCards(room: Room) {
  for (const playerId of room.playerOrder) {
    const player = room.players.get(playerId)!;
    if (player.isBot) {
      dealBotSpecialCards(player);
    } else {
      const shuffled = shuffleArray(ALL_SPECIAL_CARDS);
      player.specialCards = shuffled.slice(0, 3);
      player.specialCardsUsed = [];
    }
  }
}

export function advanceTurn(room: Room) {
  room.pendingQuestion = null;
  room.revelationResult = null;

  const currentPlayer = room.players.get(room.playerOrder[room.currentTurnIndex])!;

  if (currentPlayer.canAskSecondQuestion) {
    currentPlayer.canAskSecondQuestion = false;
    room.lastAction = `${currentPlayer.name} utilise Miracle et pose une deuxième question !`;
    return 'miracle';
  }

  if (currentPlayer.canRetryTurn) {
    currentPlayer.canRetryTurn = false;
    room.lastAction = `${currentPlayer.name} reprend son tour grâce à Martyre !`;
    return 'martyre';
  }

  room.currentTurnIndex = (room.currentTurnIndex + 1) % room.playerOrder.length;
  room.turnNumber++;

  const nextPlayer = room.players.get(room.playerOrder[room.currentTurnIndex])!;
  room.lastAction = `C'est au tour de ${nextPlayer.name}.`;
  return 'next';
}

export function scheduleAiTurnWithBroadcast(ctx: ServerContext, room: Room) {
  runAiTurn(ctx, room);
  if (room.aiThinking) {
    broadcastRoom(ctx, room);
  }
}

export function startGame(room: Room): boolean {
  if (room.players.size < 2) return false;

  const boardSize = Math.min(CHARACTERS.length, Math.max(24, room.players.size * 8));
  // Le plateau doit inclure au minimum tous les personnages des joueurs
  const minSize = Math.max(boardSize, room.playerOrder.length);
  room.activeCharacterIds = shuffleArray(CHARACTERS.map((c) => c.id)).slice(0, minSize);
  assignCharacters(room);
  dealSpecialCards(room);
  initAllPlayerKnowledge(room);

  room.status = 'playing';
  room.currentTurnIndex = 0;
  room.turnNumber = 1;
  room.winnerId = null;
  room.pendingQuestion = null;
  room.questionHistory = [];
  room.aiThinking = false;
  room.lastAction = `La partie commence ! ${room.players.get(room.playerOrder[0])!.name} commence.`;

  for (const playerId of room.playerOrder) {
    const player = room.players.get(playerId)!;
    player.eliminated = [];
    player.guessesCorrect = [];
    player.canAskSecondQuestion = false;
    player.canRetryTurn = false;
  }

  return true;
}

export function createGameContext(io: Server): ServerContext {
  const ctx: ServerContext = {
    io,
    performAskQuestion: () => {},
    performAskCustomQuestion: () => {},
    submitAnswer: () => {},
    performSpecialCard: () => {},
    performGuess: () => {},
  };

  ctx.performAskQuestion = (room, playerId, attributeKey) => {
    if (room.status !== 'playing') return;
    if (room.playerOrder[room.currentTurnIndex] !== playerId) return;
    if (room.pendingQuestion && !room.pendingQuestion.blocked) return;

    const player = room.players.get(playerId)!;
    const manual = needsManualAnswers(room);

    room.pendingQuestion = {
      askerId: playerId,
      attributeKey,
      customText: null,
      isCustom: false,
      isConcile: false,
      blocked: false,
      manualAnswers: manual,
      answers: new Map(),
    };
    room.lastAction = `${player.name} demande : « ${getAttributeLabel(attributeKey)} »`;
    broadcastRoom(ctx, room);

    if (!player.isBot) {
      maybeAiIntercession(ctx, room, playerId);
    }

    if (manual) {
      autoAnswerBots(room, room.pendingQuestion);
      if (allRespondersAnswered(room, room.pendingQuestion)) {
        finalizeQuestion(ctx, room);
      }
    } else {
      setTimeout(() => {
        if (room.pendingQuestion && !room.pendingQuestion.blocked && room.pendingQuestion.askerId === playerId) {
          finalizeQuestion(ctx, room);
        }
      }, player.isBot ? 1500 : 4000);
    }
  };

  ctx.performAskCustomQuestion = (room, playerId, text) => {
    if (room.status !== 'playing' || room.isVsAI) return;
    if (room.playerOrder[room.currentTurnIndex] !== playerId) return;
    if (room.pendingQuestion && !room.pendingQuestion.blocked) return;

    const trimmed = text.trim().slice(0, 200);
    if (trimmed.length < 3) return;

    const player = room.players.get(playerId)!;
    room.pendingQuestion = {
      askerId: playerId,
      attributeKey: null,
      customText: trimmed,
      isCustom: true,
      isConcile: false,
      blocked: false,
      manualAnswers: true,
      answers: new Map(),
    };
    room.lastAction = `${player.name} demande : « ${trimmed} »`;
    broadcastRoom(ctx, room);
    maybeAiIntercession(ctx, room, playerId);
  };

  ctx.submitAnswer = (room, playerId, answer) => {
    const pq = room.pendingQuestion;
    if (!pq || pq.blocked || !pq.manualAnswers) return;

    const responders = getResponders(room, pq.askerId, pq.isConcile);
    if (!responders.includes(playerId)) return;
    if (pq.answers.has(playerId)) return;

    const player = room.players.get(playerId)!;
    if (!player.characterId) return;

    if (pq.isCustom) {
      pq.answers.set(playerId, answer);
    } else if (pq.attributeKey) {
      const char = getCharacterById(player.characterId)!;
      pq.answers.set(playerId, char.attributes[pq.attributeKey]);
    } else {
      return;
    }

    broadcastRoom(ctx, room);

    if (allRespondersAnswered(room, pq)) {
      finalizeQuestion(ctx, room);
    }
  };

  ctx.performSpecialCard = (room, playerId, cardType, targetPlayerId, attributeKey) => {
    if (room.status !== 'playing') return;
    const player = room.players.get(playerId)!;
    if (!player.specialCards.includes(cardType) || player.specialCardsUsed.includes(cardType)) return;

    switch (cardType) {
      case 'miracle': {
        if (room.playerOrder[room.currentTurnIndex] !== playerId) return;
        player.specialCardsUsed.push(cardType);
        player.canAskSecondQuestion = true;
        room.lastAction = `${player.name} joue Miracle ✨ et pourra poser une 2e question !`;
        broadcastRoom(ctx, room);
        if (player.isBot) scheduleAiTurnWithBroadcast(ctx, room);
        break;
      }
      case 'revelation': {
        if (!targetPlayerId || !attributeKey) return;
        const target = room.players.get(targetPlayerId);
        if (!target?.characterId) return;
        const char = getCharacterById(target.characterId)!;
        player.specialCardsUsed.push(cardType);
        room.revelationResult = {
          targetPlayerId,
          attributeKey,
          value: char.attributes[attributeKey],
          forPlayerId: playerId,
        };
        room.lastAction = `${player.name} joue Révélation 👁️ sur ${target.name} !`;
        onRevelationForKnowledge(room, playerId, targetPlayerId, attributeKey, char.attributes[attributeKey]);
        broadcastRoom(ctx, room);
        if (player.isBot) scheduleAiTurnWithBroadcast(ctx, room);
        break;
      }
      case 'intercession': {
        if (!room.pendingQuestion || room.pendingQuestion.askerId === playerId) return;
        player.specialCardsUsed.push(cardType);
        room.pendingQuestion.blocked = true;
        room.lastAction = `${player.name} joue Intercession 🙏 — la question est bloquée !`;
        if (room.pendingQuestion) {
          const pq = room.pendingQuestion;
          room.questionHistory.push({
            id: crypto.randomUUID(),
            turnNumber: room.turnNumber,
            askerId: pq.askerId,
            askerName: room.players.get(pq.askerId)!.name,
            attributeKey: pq.attributeKey,
            attributeLabel: getQuestionLabel(pq),
            customText: pq.customText,
            isCustom: pq.isCustom,
            isConcile: pq.isConcile,
            blocked: true,
            answers: {},
          });
        }
        broadcastRoom(ctx, room);
        setTimeout(() => {
          afterTurnChange(ctx, room);
        }, 2000);
        break;
      }
      case 'concile': {
        if (room.playerOrder[room.currentTurnIndex] !== playerId) return;
        if (!attributeKey) return;
        player.specialCardsUsed.push(cardType);
        room.pendingQuestion = {
          askerId: playerId,
          attributeKey,
          customText: null,
          isCustom: false,
          isConcile: true,
          blocked: false,
          manualAnswers: needsManualAnswers(room),
          answers: new Map(),
        };
        room.lastAction = `${player.name} convoque un Concile ⛪ : « ${getAttributeLabel(attributeKey)} » — tous répondent !`;
        broadcastRoom(ctx, room);
        if (room.pendingQuestion.manualAnswers) {
          autoAnswerBots(room, room.pendingQuestion);
          if (allRespondersAnswered(room, room.pendingQuestion)) {
            finalizeQuestion(ctx, room);
          }
        } else {
          setTimeout(() => {
            if (room.pendingQuestion && !room.pendingQuestion.blocked) {
              finalizeQuestion(ctx, room);
            }
          }, 2000);
        }
        break;
      }
      case 'martyre': {
        player.specialCardsUsed.push(cardType);
        player.canRetryTurn = true;
        room.lastAction = `${player.name} prépare Martyre 🔥 pour son prochain échec.`;
        broadcastRoom(ctx, room);
        break;
      }
    }
  };

  ctx.performGuess = (room, playerId, targetPlayerId, characterId) => {
    if (room.status !== 'playing') return;

    const player = room.players.get(playerId)!;
    const target = room.players.get(targetPlayerId);
    if (!target?.characterId) return;
    if (player.guessesCorrect.includes(targetPlayerId)) return;

    const guessed = getCharacterById(characterId);
    if (!guessed) return;

    const actual = getCharacterById(target.characterId)!;
    const isCorrect = characterId === target.characterId;

    if (isCorrect) {
      player.guessesCorrect.push(targetPlayerId);
      room.lastAction = `🎉 ${player.name} a identifié ${target.name} : ${actual.name} !`;
      const winner = checkWinner(room);
      if (winner) {
        room.winnerId = winner;
        room.status = 'finished';
        room.lastAction = `🏆 ${room.players.get(winner)!.name} remporte la partie !`;
      }
    } else {
      room.lastAction = `❌ ${player.name} s'est trompé — ce n'était pas ${guessed?.name ?? '?'}.`;
      if (player.canRetryTurn) {
        player.canRetryTurn = false;
        room.lastAction += ` Martyre 🔥 lui permet de rejouer !`;
        broadcastRoom(ctx, room);
        if (player.isBot) scheduleAiTurnWithBroadcast(ctx, room);
        return;
      }
      broadcastRoom(ctx, room);
      setTimeout(() => afterTurnChange(ctx, room), 2000);
      return;
    }

    broadcastRoom(ctx, room);
    if (player.isBot && room.status === 'playing') {
      scheduleAiTurnWithBroadcast(ctx, room);
    }
  };

  return ctx;
}

function finalizeQuestion(ctx: ServerContext, room: Room) {
  if (!room.pendingQuestion || room.pendingQuestion.blocked) return;

  const pq = room.pendingQuestion;
  const { askerId, attributeKey, isConcile } = pq;
  const responders = getResponders(room, askerId, isConcile);

  if (!pq.manualAnswers) {
    for (const id of responders) {
      const player = room.players.get(id)!;
      if (!player.characterId || !attributeKey) continue;
      const char = getCharacterById(player.characterId)!;
      pq.answers.set(id, char.attributes[attributeKey]);
    }
  }

  const label = getQuestionLabel(pq);
  const summary = responders
    .map((id) => {
      const p = room.players.get(id)!;
      const val = pq.answers.get(id);
      return `${p.name}: ${val ? 'Oui' : 'Non'}`;
    })
    .join(', ');
  room.lastAction = `Réponses à « ${label} » — ${summary}`;

  const answerNames: Record<string, string> = {};
  for (const id of responders) {
    answerNames[id] = room.players.get(id)!.name;
  }

  room.questionHistory.push({
    id: crypto.randomUUID(),
    turnNumber: room.turnNumber,
    askerId,
    askerName: room.players.get(askerId)!.name,
    attributeKey,
    attributeLabel: label,
    customText: pq.customText,
    isCustom: pq.isCustom,
    isConcile,
    blocked: false,
    answers: Object.fromEntries(pq.answers),
    answerNames,
  });

  if (attributeKey && !pq.isCustom) {
    onAiQuestionResolved(room, askerId, attributeKey, pq.answers);
  }

  broadcastRoom(ctx, room);

  setTimeout(() => {
    afterTurnChange(ctx, room);
  }, pq.isCustom ? 2000 : 3500);
}

export function afterTurnChange(ctx: ServerContext, room: Room) {
  if (room.status !== 'playing') return;

  const result = advanceTurn(room);
  broadcastRoom(ctx, room);

  if (result === 'miracle' || result === 'martyre' || result === 'next') {
    scheduleAiTurnWithBroadcast(ctx, room);
  }
}

export function addBotsToRoom(room: Room, count: number) {
  for (let i = 0; i < count; i++) {
    const bot = createBotPlayer(getBotName(i));
    room.players.set(bot.id, bot);
    room.playerOrder.push(bot.id);
  }
}

export function createHumanPlayer(socketId: string, name: string, isHost: boolean): Player {
  return {
    id: crypto.randomUUID(),
    socketId,
    name: name.trim() || 'Joueur',
    isHost,
    isBot: false,
    connected: true,
    characterId: null,
    eliminated: [],
    specialCards: [],
    specialCardsUsed: [],
    guessesCorrect: [],
    canAskSecondQuestion: false,
    canRetryTurn: false,
  };
}

export function createEmptyRoom(code: string, isVsAI = false): Room {
  return {
    code,
    status: 'waiting',
    isVsAI,
    players: new Map(),
    playerOrder: [],
    currentTurnIndex: 0,
    turnNumber: 0,
    winnerId: null,
    activeCharacterIds: [],
    pendingQuestion: null,
    lastAction: null,
    revelationResult: null,
    questionHistory: [],
    playerKnowledge: new Map(),
    aiThinking: false,
  };
}
