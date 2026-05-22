import type { GameStatePublic } from '../types';

interface LobbyProps {
  gameState: GameStatePublic;
  playerId: string | null;
  onStart: () => void;
  onLeave: () => void;
}

export default function Lobby({ gameState, playerId, onStart, onLeave }: LobbyProps) {
  const me = gameState.players.find((p) => p.id === playerId);
  const isHost = me?.isHost ?? false;
  const canStart = gameState.players.length >= 2;

  return (
    <div className="app">
      <div className="lobby">
        <div className="lobby-card">
          <div className="room-code">
            <span>Code de la salle — partagez-le avec vos amis</span>
            <strong>{gameState.roomCode}</strong>
          </div>

          <h3 style={{ marginBottom: '1rem', color: 'var(--burgundy)' }}>
            Joueurs ({gameState.players.length}/6)
          </h3>

          <ul className="players-list">
            {gameState.players.map((player) => (
              <li key={player.id}>
                <div className="player-avatar">{player.name.charAt(0).toUpperCase()}</div>
                <span>{player.name}</span>
                {player.isHost && <span className="host-badge">Hôte</span>}
              </li>
            ))}
          </ul>

          <div className="lobby-actions">
            {isHost ? (
              <>
                <button
                  className="btn btn-primary"
                  onClick={onStart}
                  disabled={!canStart}
                >
                  {canStart ? 'Commencer la partie' : 'En attente de joueurs (min. 2)'}
                </button>
                {!canStart && (
                  <p className="waiting-msg">Invitez au moins un autre joueur pour commencer.</p>
                )}
              </>
            ) : (
              <p className="waiting-msg">En attente que l'hôte lance la partie…</p>
            )}
            <button className="btn btn-outline" onClick={onLeave}>
              Quitter la salle
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
