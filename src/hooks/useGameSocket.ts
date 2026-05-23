import { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type {
  Character,
  GameStatePublic,
  PlayerPrivate,
  RoomJoinedPayload,
  GuessResult,
  AttributeKey,
  SpecialCardType,
} from '../types';
import { normalizeRoomPayload } from '../utils/normalizeState';

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL?.trim() ||
  (import.meta.env.DEV ? 'http://localhost:3001' : window.location.origin);

const SESSION_KEY = 'qec-session';

interface StoredSession {
  roomCode: string;
  playerId: string;
}

function loadSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredSession;
    if (parsed.roomCode && parsed.playerId) return parsed;
  } catch {
    /* ignore */
  }
  return null;
}

function saveSession(roomCode: string, playerId: string) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ roomCode, playerId }));
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

let socket: Socket | null = null;

function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      timeout: 20000,
    });
  }
  return socket;
}

export function useGameSocket() {
  const [connected, setConnected] = useState(false);
  const [restoring, setRestoring] = useState(() => !!loadSession());
  const [gameState, setGameState] = useState<GameStatePublic | null>(null);
  const [privateState, setPrivateState] = useState<PlayerPrivate | null>(null);
  const [allCharacters, setAllCharacters] = useState<Character[]>([]);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const applyPayload = useCallback((payload: RoomJoinedPayload & { success?: boolean }) => {
    const normalized = normalizeRoomPayload(payload);
    setGameState(normalized.gameState);
    setPrivateState(normalized.privateState);
    setAllCharacters(normalized.allCharacters);
    setPlayerId(normalized.playerId);
    saveSession(normalized.gameState.roomCode, normalized.playerId);
  }, []);

  useEffect(() => {
    const s = getSocket();

    const onConnect = () => {
      setConnected(true);
      const session = loadSession();
      if (!session) {
        setRestoring(false);
        return;
      }
      s.emit('rejoinRoom', session.roomCode, session.playerId, (response: RoomJoinedPayload & { success: boolean; error?: string }) => {
        if (response.success) {
          applyPayload(response);
        } else {
          clearSession();
          setGameState(null);
          setPrivateState(null);
          setAllCharacters([]);
          setPlayerId(null);
        }
        setRestoring(false);
      });
    };

    const onDisconnect = () => setConnected(false);
    const onRoomUpdate = (payload: RoomJoinedPayload) => {
      setGameState(payload.gameState);
      setPrivateState(payload.privateState);
      setAllCharacters(payload.allCharacters);
    };

    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);
    s.on('roomUpdate', onRoomUpdate);

    if (s.connected) onConnect();
    else if (!loadSession()) setRestoring(false);

    return () => {
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
      s.off('roomUpdate', onRoomUpdate);
    };
  }, [applyPayload]);

  const createRoom = useCallback((playerName: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setError(null);
      getSocket().emit('createRoom', playerName, (response: RoomJoinedPayload & { success: boolean; error?: string }) => {
        if (response.success) {
          applyPayload(response);
          resolve(true);
        } else {
          setError(response.error ?? 'Erreur inconnue');
          resolve(false);
        }
      });
    });
  }, [applyPayload]);

  const joinRoom = useCallback((roomCode: string, playerName: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setError(null);
      getSocket().emit('joinRoom', roomCode, playerName, (response: RoomJoinedPayload & { success: boolean; error?: string }) => {
        if (response.success) {
          applyPayload(response);
          resolve(true);
        } else {
          setError(response.error ?? 'Erreur inconnue');
          resolve(false);
        }
      });
    });
  }, [applyPayload]);

  const startGame = useCallback(() => {
    getSocket().emit('startGame');
  }, []);

  const selectCharacter = useCallback((characterId: string): Promise<boolean> => {
    return new Promise((resolve) => {
      getSocket().emit('selectCharacter', characterId, (response: { success: boolean; error?: string }) => {
        if (!response.success) {
          setError(response.error ?? 'Sélection impossible.');
        }
        resolve(response.success);
      });
    });
  }, []);

  const restartGame = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      setError(null);
      getSocket().emit('restartGame', (response: { success: boolean; error?: string }) => {
        if (!response.success) {
          setError(response.error ?? 'Impossible de relancer.');
        }
        resolve(response.success);
      });
    });
  }, []);

  const askQuestion = useCallback((attributeKey: AttributeKey, targetPlayerId?: string) => {
    getSocket().emit('askQuestion', attributeKey, targetPlayerId);
  }, []);

  const askCustomQuestion = useCallback((text: string, targetPlayerId?: string) => {
    getSocket().emit('askCustomQuestion', text, targetPlayerId);
  }, []);

  const submitAnswer = useCallback((answer: boolean) => {
    getSocket().emit('submitAnswer', answer);
  }, []);

  const useSpecialCard = useCallback((cardType: SpecialCardType, targetPlayerId?: string, attributeKey?: AttributeKey) => {
    getSocket().emit('useSpecialCard', cardType, targetPlayerId, attributeKey);
  }, []);

  const toggleEliminated = useCallback((opponentId: string, characterId: string) => {
    setPrivateState((prev) => {
      if (!prev) return prev;
      const boards = { ...(prev.eliminatedByOpponent ?? {}) };
      const board = [...(boards[opponentId] ?? [])];
      const idx = board.indexOf(characterId);
      if (idx >= 0) board.splice(idx, 1);
      else board.push(characterId);
      boards[opponentId] = board;
      return { ...prev, eliminatedByOpponent: boards };
    });
    getSocket().emit('toggleEliminated', opponentId, characterId);
  }, []);

  const bulkEliminate = useCallback((opponentId: string, characterIds: string[]) => {
    if (characterIds.length === 0) return;
    setPrivateState((prev) => {
      if (!prev) return prev;
      const boards = { ...(prev.eliminatedByOpponent ?? {}) };
      const set = new Set([...(boards[opponentId] ?? []), ...characterIds]);
      boards[opponentId] = [...set];
      return { ...prev, eliminatedByOpponent: boards };
    });
    getSocket().emit('bulkEliminate', opponentId, characterIds);
  }, []);

  const restoreAllEliminated = useCallback((opponentId?: string) => {
    setPrivateState((prev) => {
      if (!prev) return prev;
      const boards = { ...(prev.eliminatedByOpponent ?? {}) };
      if (opponentId) {
        boards[opponentId] = [];
      } else {
        for (const id of Object.keys(boards)) boards[id] = [];
      }
      return { ...prev, eliminatedByOpponent: boards };
    });
    getSocket().emit('restoreAllEliminated', opponentId);
  }, []);

  const guessCharacter = useCallback((targetPlayerId: string, characterId: string): Promise<GuessResult> => {
    return new Promise((resolve) => {
      getSocket().emit('guessCharacter', targetPlayerId, characterId, (result: GuessResult) => {
        resolve(result);
      });
    });
  }, []);

  const createVsAI = useCallback((playerName: string, aiCount: number): Promise<boolean> => {
    return new Promise((resolve) => {
      setError(null);
      getSocket().emit('createVsAI', playerName, aiCount, (response: RoomJoinedPayload & { success: boolean; error?: string }) => {
        if (response.success) {
          applyPayload(response);
          resolve(true);
        } else {
          setError(response.error ?? 'Erreur inconnue');
          resolve(false);
        }
      });
    });
  }, [applyPayload]);

  const leaveRoom = useCallback(() => {
    getSocket().emit('leaveRoom');
    clearSession();
    setGameState(null);
    setPrivateState(null);
    setAllCharacters([]);
    setPlayerId(null);
  }, []);

  return {
    connected,
    restoring,
    gameState,
    privateState,
    allCharacters,
    playerId,
    error,
    setError,
    createRoom,
    joinRoom,
    createVsAI,
    startGame,
    selectCharacter,
    restartGame,
    askQuestion,
    askCustomQuestion,
    submitAnswer,
    useSpecialCard,
    toggleEliminated,
    bulkEliminate,
    restoreAllEliminated,
    guessCharacter,
    leaveRoom,
  };
}
