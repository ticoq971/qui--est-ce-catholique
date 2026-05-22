import { useGameSocket } from './hooks/useGameSocket';
import Home from './components/Home';
import Lobby from './components/Lobby';
import CharacterSelection from './components/CharacterSelection';
import Game from './components/Game';

export default function App() {
  const game = useGameSocket();

  if (game.restoring) {
    return (
      <div className="app">
        <div className="home" style={{ textAlign: 'center', padding: '3rem' }}>
          <span className="cross">✝</span>
          <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Reconnexion à la partie…</p>
        </div>
      </div>
    );
  }

  if (!game.gameState) {
    return (
      <Home
        onCreate={game.createRoom}
        onJoin={game.joinRoom}
        onPlayVsAI={game.createVsAI}
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
        onLeave={game.leaveRoom}
      />
    );
  }

  if (game.gameState.status === 'selecting') {
    const privateState = game.privateState ?? {
      characterId: null,
      characterName: null,
      eliminated: [],
      specialCards: [],
      canAskSecondQuestion: false,
      canRetryTurn: false,
      opponentCandidates: {},
    };
    return (
      <CharacterSelection
        gameState={game.gameState}
        privateState={privateState}
        allCharacters={game.allCharacters}
        playerId={game.playerId!}
        onSelect={game.selectCharacter}
        onLeave={game.leaveRoom}
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
      onBulkEliminate={game.bulkEliminate}
      onRestoreAllEliminated={game.restoreAllEliminated}
      onGuessCharacter={game.guessCharacter}
      onRestart={game.restartGame}
      onLeave={game.leaveRoom}
    />
  );
}
