import { useState } from 'react';
import type { Character, GameStatePublic, PlayerPrivate } from '../types';
import CharacterInfoModal from './CharacterInfoModal';

interface CharacterSelectionProps {
  gameState: GameStatePublic;
  privateState: PlayerPrivate;
  allCharacters: Character[];
  playerId: string;
  onSelect: (characterId: string) => void;
  onLeave: () => void;
}

export default function CharacterSelection({
  gameState,
  privateState,
  allCharacters,
  playerId,
  onSelect,
  onLeave,
}: CharacterSelectionProps) {
  const [infoCharacter, setInfoCharacter] = useState<Character | null>(null);
  const taken = new Set(gameState.takenCharacterIds ?? []);
  const myId = privateState.characterId;
  const humans = gameState.players.filter((p) => !p.isBot);
  const allReady = humans.every((p) => p.hasSelectedCharacter);
  const me = gameState.players.find((p) => p.id === playerId);

  const sorted = [...allCharacters].sort((a, b) => a.name.localeCompare(b.name, 'fr'));

  return (
    <div className="app">
      <div className="character-selection">
        <header className="selection-header">
          <h2>Choisissez votre personnage</h2>
          <p className="selection-subtitle">
            {gameState.isVsAI
              ? 'Sélectionnez qui vous incarnez — l\'IA prendra les personnages restants.'
              : 'Chaque joueur choisit un personnage unique. La partie démarre quand tout le monde a choisi.'}
          </p>
          {gameState.lastAction && (
            <p className="selection-status">{gameState.lastAction}</p>
          )}
        </header>

        <div className="selection-layout">
          <aside className="selection-sidebar panel">
            <h3>Joueurs</h3>
            <ul className="selection-players">
              {gameState.players.map((player) => (
                <li key={player.id} className={player.hasSelectedCharacter ? 'ready' : ''}>
                  <div className="player-avatar">{player.name.charAt(0).toUpperCase()}</div>
                  <span>
                    {player.name}
                    {player.isBot && ' 🤖'}
                    {player.id === playerId && ' (vous)'}
                  </span>
                  <span className="selection-ready-badge">
                    {player.isBot ? '—' : player.hasSelectedCharacter ? '✅' : '…'}
                  </span>
                </li>
              ))}
            </ul>
            {myId && (
              <div className="selection-my-choice">
                <strong>Votre choix</strong>
                <div className="selection-my-choice-card">
                  <span>{allCharacters.find((c) => c.id === myId)?.emoji}</span>
                  <span>{privateState.characterName}</span>
                </div>
              </div>
            )}
            {!myId && me && !me.isBot && (
              <p className="selection-hint">Cliquez sur un personnage disponible ci-dessous.</p>
            )}
            {allReady && !gameState.isVsAI && (
              <p className="selection-hint success">Tous les joueurs ont choisi — la partie va commencer…</p>
            )}
            <button type="button" className="btn btn-outline" style={{ marginTop: '1rem', width: '100%' }} onClick={onLeave}>
              Quitter
            </button>
          </aside>

          <main className="selection-grid-panel panel">
            <h3>Personnages disponibles ({allCharacters.length})</h3>
            <div className="selection-grid">
              {sorted.map((char) => {
                const isTaken = taken.has(char.id) && char.id !== myId;
                const isMine = char.id === myId;

                return (
                  <div
                    key={char.id}
                    className={`selection-card-wrap ${isTaken ? 'taken' : ''} ${isMine ? 'selected' : ''}`}
                  >
                    <button
                      type="button"
                      className="selection-card"
                      disabled={isTaken}
                      onClick={() => onSelect(char.id)}
                      title={isTaken ? 'Déjà choisi par un autre joueur' : 'Choisir ce personnage'}
                    >
                      <span className="emoji">{char.emoji}</span>
                      <span className="name">{char.name}</span>
                      {isTaken && <span className="taken-label">Pris</span>}
                      {isMine && <span className="mine-label">Votre choix</span>}
                    </button>
                    <button
                      type="button"
                      className="character-info-btn"
                      onClick={() => setInfoCharacter(char)}
                      aria-label={`Infos sur ${char.name}`}
                    >
                      ℹ️
                    </button>
                  </div>
                );
              })}
            </div>
          </main>
        </div>
      </div>

      <CharacterInfoModal character={infoCharacter} onClose={() => setInfoCharacter(null)} />
    </div>
  );
}
