import { useState } from 'react';
import { useGameSocket } from './hooks/useGameSocket';
import Home from './components/Home';
import Lobby from './components/Lobby';
import Game from './components/Game';

export default function App() {
  const game = useGameSocket();
  const [screen, setScreen] = useState<'home' | 'game'>('home');

  const handleCreate = async (name: string) => {
    const ok = await game.createRoom(name);
    if (ok) setScreen('game');
  };

  const handleJoin = async (code: string, name: string) => {
    const ok = await game.joinRoom(code, name);
    if (ok) setScreen('game');
  };

  const handlePlayVsAI = async (name: string, aiCount: number) => {
    const ok = await game.createVsAI(name, aiCount);
    if (ok) setScreen('game');
  };

  const handleLeave = () => {
    game.leaveRoom();
    setScreen('home');
  };

  if (screen === 'home' || !game.gameState) {
    return (
      <Home
        onCreate={handleCreate}
        onJoin={handleJoin}
        onPlayVsAI={handlePlayVsAI}
        error={game.error}
        connected={game.connected}
      />
    );
  }

  if (game.gameState.status === 'waiting') {
    return (
      <Lobby
        gameState={game.gameState}
        playerId={game.playerId}
        onStart={game.startGame}
        onLeave={handleLeave}
      />
    );
  }

  return (
    <Game
      gameState={game.gameState}
      privateState={game.privateState!}
      allCharacters={game.allCharacters}
      playerId={game.playerId!}
      onAskQuestion={game.askQuestion}
      onAskCustomQuestion={game.askCustomQuestion}
      onSubmitAnswer={game.submitAnswer}
      onUseSpecialCard={game.useSpecialCard}
      onToggleEliminated={game.toggleEliminated}
      onGuessCharacter={game.guessCharacter}
      onLeave={handleLeave}
    />
  );
}
