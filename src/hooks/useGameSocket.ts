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

const SOCKET_URL = import.meta.env.DEV ? 'http://localhost:3001' : window.location.origin;

let socket: Socket | null = null;

function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, { autoConnect: true });
  }
  return socket;
}

export function useGameSocket() {
  const [connected, setConnected] = useState(false);
  const [gameState, setGameState] = useState<GameStatePublic | null>(null);
  const [privateState, setPrivateState] = useState<PlayerPrivate | null>(null);
  const [allCharacters, setAllCharacters] = useState<Character[]>([]);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const s = getSocket();

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    const onRoomUpdate = (payload: RoomJoinedPayload) => {
      setGameState(payload.gameState);
      setPrivateState(payload.privateState);
      setAllCharacters(payload.allCharacters);
    };

    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);
    s.on('roomUpdate', onRoomUpdate);

    if (s.connected) setConnected(true);

    return () => {
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
      s.off('roomUpdate', onRoomUpdate);
    };
  }, []);

  const applyPayload = useCallback((payload: RoomJoinedPayload & { success?: boolean }) => {
    setGameState(payload.gameState);
    setPrivateState(payload.privateState);
    setAllCharacters(payload.allCharacters);
    setPlayerId(payload.playerId);
  }, []);

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

  const askQuestion = useCallback((attributeKey: AttributeKey) => {
    getSocket().emit('askQuestion', attributeKey);
  }, []);

  const askCustomQuestion = useCallback((text: string) => {
    getSocket().emit('askCustomQuestion', text);
  }, []);

  const submitAnswer = useCallback((answer: boolean) => {
    getSocket().emit('submitAnswer', answer);
  }, []);

  const useSpecialCard = useCallback((cardType: SpecialCardType, targetPlayerId?: string, attributeKey?: AttributeKey) => {
    getSocket().emit('useSpecialCard', cardType, targetPlayerId, attributeKey);
  }, []);

  const toggleEliminated = useCallback((characterId: string) => {
    getSocket().emit('toggleEliminated', characterId);
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
    setGameState(null);
    setPrivateState(null);
    setAllCharacters([]);
    setPlayerId(null);
  }, []);

  return {
    connected,
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
    askQuestion,
    askCustomQuestion,
    submitAnswer,
    useSpecialCard,
    toggleEliminated,
    guessCharacter,
    leaveRoom,
  };
}
