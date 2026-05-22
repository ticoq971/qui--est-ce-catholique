import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import { CHARACTERS, getCharacterById } from '../src/data/characters';
import {
  addBotsToRoom,
  broadcastRoom,
  buildRoomPayload,
  createEmptyRoom,
  createGameContext,
  createHumanPlayer,
  scheduleAiTurnWithBroadcast,
  startGame,
} from './gameEngine';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;

const rooms = new Map<string, import('./gameEngine').Room>();
const socketToRoom = new Map<string, string>();
const socketToPlayer = new Map<string, string>();

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

const ctx = createGameContext(io);

app.use(express.static(path.join(__dirname, '../dist')));

app.get('*', (_req, res) => {
  const indexPath = path.join(__dirname, '../dist/index.html');
  res.sendFile(indexPath, (err) => {
    if (err) res.status(404).send('Serveur en cours — lancez npm run dev pour le développement.');
  });
});

io.on('connection', (socket: Socket) => {
  socket.on('createRoom', (playerName: string, callback) => {
    let code = generateRoomCode();
    while (rooms.has(code)) code = generateRoomCode();

    const player = createHumanPlayer(socket.id, playerName, true);
    const room = createEmptyRoom(code);
    room.players.set(player.id, player);
    room.playerOrder.push(player.id);

    rooms.set(code, room);
    socketToRoom.set(socket.id, code);
    socketToPlayer.set(socket.id, player.id);
    socket.join(code);

    callback({ success: true, ...buildRoomPayload(room, player.id) });
  });

  socket.on('createVsAI', (playerName: string, aiCount: number, callback) => {
    let code = generateRoomCode();
    while (rooms.has(code)) code = generateRoomCode();

    const count = Math.min(3, Math.max(1, aiCount || 1));
    const player = createHumanPlayer(socket.id, playerName, true);
    const room = createEmptyRoom(code, true);
    room.players.set(player.id, player);
    room.playerOrder.push(player.id);
    addBotsToRoom(room, count);

    rooms.set(code, room);
    socketToRoom.set(socket.id, code);
    socketToPlayer.set(socket.id, player.id);
    socket.join(code);

    if (startGame(room)) {
      broadcastRoom(ctx, room);
      scheduleAiTurnWithBroadcast(ctx, room);
      callback({ success: true, ...buildRoomPayload(room, player.id) });
    } else {
      callback({ success: false, error: 'Impossible de démarrer la partie.' });
    }
  });

  socket.on('joinRoom', (roomCode: string, playerName: string, callback) => {
    const code = roomCode.toUpperCase().trim();
    const room = rooms.get(code);

    if (!room) {
      callback({ success: false, error: 'Partie introuvable.' });
      return;
    }
    if (room.isVsAI) {
      callback({ success: false, error: 'Cette partie est solo contre l\'IA.' });
      return;
    }
    if (room.status !== 'waiting') {
      callback({ success: false, error: 'La partie a déjà commencé.' });
      return;
    }
    if (room.players.size >= 6) {
      callback({ success: false, error: 'La salle est pleine (6 joueurs max).' });
      return;
    }

    const player = createHumanPlayer(socket.id, playerName, false);
    room.players.set(player.id, player);
    room.playerOrder.push(player.id);
    socketToRoom.set(socket.id, code);
    socketToPlayer.set(socket.id, player.id);
    socket.join(code);

    room.lastAction = `${player.name} a rejoint la partie.`;
    broadcastRoom(ctx, room);
    callback({ success: true, ...buildRoomPayload(room, player.id) });
  });

  socket.on('startGame', () => {
    const room = getRoomFromSocket(socket);
    if (!room) return;
    const playerId = socketToPlayer.get(socket.id)!;
    const player = room.players.get(playerId)!;
    if (!player.isHost || room.status !== 'waiting' || room.isVsAI) return;

    if (startGame(room)) {
      broadcastRoom(ctx, room);
      scheduleAiTurnWithBroadcast(ctx, room);
    }
  });

  socket.on('askQuestion', (attributeKey: import('../src/types').AttributeKey) => {
    const room = getRoomFromSocket(socket);
    if (!room || room.status !== 'playing') return;
    const playerId = socketToPlayer.get(socket.id)!;
    ctx.performAskQuestion(room, playerId, attributeKey);
  });

  socket.on('askCustomQuestion', (text: string) => {
    const room = getRoomFromSocket(socket);
    if (!room || room.status !== 'playing') return;
    const playerId = socketToPlayer.get(socket.id)!;
    ctx.performAskCustomQuestion(room, playerId, text);
  });

  socket.on('submitAnswer', (answer: boolean) => {
    const room = getRoomFromSocket(socket);
    if (!room || room.status !== 'playing') return;
    const playerId = socketToPlayer.get(socket.id)!;
    ctx.submitAnswer(room, playerId, answer);
  });

  socket.on('useSpecialCard', (
    cardType: import('../src/types').SpecialCardType,
    targetPlayerId?: string,
    attributeKey?: import('../src/types').AttributeKey,
  ) => {
    const room = getRoomFromSocket(socket);
    if (!room || room.status !== 'playing') return;
    const playerId = socketToPlayer.get(socket.id)!;
    ctx.performSpecialCard(room, playerId, cardType, targetPlayerId, attributeKey);
  });

  socket.on('toggleEliminated', (characterId: string) => {
    const room = getRoomFromSocket(socket);
    if (!room || room.status !== 'playing') return;

    const playerId = socketToPlayer.get(socket.id)!;
    const player = room.players.get(playerId)!;

    if (player.eliminated.includes(characterId)) {
      player.eliminated = player.eliminated.filter((id) => id !== characterId);
    } else {
      player.eliminated.push(characterId);
    }

    socket.emit('roomUpdate', buildRoomPayload(room, playerId));
  });

  socket.on('guessCharacter', (targetPlayerId: string, characterId: string, callback) => {
    const room = getRoomFromSocket(socket);
    if (!room || room.status !== 'playing') {
      callback({ success: false, message: 'Partie inactive.' });
      return;
    }

    const playerId = socketToPlayer.get(socket.id)!;
    const player = room.players.get(playerId)!;
    const target = room.players.get(targetPlayerId);

    if (!target?.characterId) {
      callback({ success: false, message: 'Joueur introuvable.' });
      return;
    }

    if (player.guessesCorrect.includes(targetPlayerId)) {
      callback({ success: false, message: 'Vous avez déjà identifié ce joueur.' });
      return;
    }

    const guessed = getCharacterById(characterId);
    const actual = getCharacterById(target.characterId)!;

    if (!guessed) {
      callback({ success: false, message: 'Personnage invalide.' });
      return;
    }

    const isCorrect = characterId === target.characterId;

    ctx.performGuess(room, playerId, targetPlayerId, characterId);

    callback({
      success: isCorrect,
      targetPlayerId,
      targetPlayerName: target.name,
      guessedCharacterId: characterId,
      guessedCharacterName: guessed.name,
      actualCharacterName: actual.name,
      message: isCorrect
        ? `Correct ! ${target.name} est bien ${actual.name}.`
        : `Incorrect. C'était ${actual.name}, pas ${guessed.name}.`,
    });
  });

  socket.on('leaveRoom', () => {
    handleDisconnect(socket);
  });

  socket.on('disconnect', () => {
    handleDisconnect(socket);
  });
});

function getRoomFromSocket(socket: Socket) {
  const code = socketToRoom.get(socket.id);
  return code ? rooms.get(code) ?? null : null;
}

function handleDisconnect(socket: Socket) {
  const code = socketToRoom.get(socket.id);
  const playerId = socketToPlayer.get(socket.id);
  if (!code || !playerId) return;

  const room = rooms.get(code);
  if (!room) return;

  const player = room.players.get(playerId);
  if (!player || player.isBot) return;

  player.connected = false;

  if (room.status === 'waiting') {
    room.players.delete(playerId);
    room.playerOrder = room.playerOrder.filter((id) => id !== playerId);

    if (room.players.size === 0) {
      rooms.delete(code);
    } else {
      if (player.isHost) {
        const newHost = [...room.players.values()].find((p) => !p.isBot);
        if (newHost) newHost.isHost = true;
      }
      room.lastAction = `${player.name} a quitté la salle.`;
      broadcastRoom(ctx, room);
    }
  } else {
    room.lastAction = `${player.name} s'est déconnecté.`;
    broadcastRoom(ctx, room);
  }

  socketToRoom.delete(socket.id);
  socketToPlayer.delete(socket.id);
}

httpServer.listen(PORT, () => {
  console.log(`✝ Serveur Qui est-ce ? Catholique sur le port ${PORT}`);
  console.log(`   ${CHARACTERS.length} personnages disponibles`);
});
