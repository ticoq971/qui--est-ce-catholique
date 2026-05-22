import { useMemo, useState } from 'react';
import { CHARACTERS } from '../data/characters';
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

  const boardCharacters = useMemo(() => {
    const source = allCharacters.length > 0
      ? allCharacters
      : CHARACTERS.filter((c) => gameState.activeCharacters.includes(c.id));
    return [...source].sort((a, b) => a.name.localeCompare(b.name, 'fr'));
  }, [allCharacters, gameState.activeCharacters]);

  return (
    <div className="app character-selection-page">
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

        {!myId && me && !me.isBot && (
          <div className="selection-cta">
            👇 <strong>Cliquez sur une carte</strong> dans la grille pour choisir votre personnage
          </div>
        )}

        {myId && (
          <div className="selection-cta selected">
            ✅ Vous avez choisi <strong>{privateState.characterName}</strong>
            {allReady && !gameState.isVsAI ? ' — en attente des autres joueurs…' : ''}
          </div>
        )}

        <main className="selection-grid-panel panel">
          <h3>Personnages disponibles ({boardCharacters.length})</h3>
          {boardCharacters.length === 0 ? (
            <p className="selection-empty">
              Chargement des personnages… Si rien n&apos;apparaît, quittez et relancez la partie.
            </p>
          ) : (
            <div className="selection-grid">
              {boardCharacters.map((char) => {
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
                      onClick={(e) => {
                        e.stopPropagation();
                        setInfoCharacter(char);
                      }}
                      aria-label={`Infos sur ${char.name}`}
                    >
                      ℹ️
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </main>

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
          <button type="button" className="btn btn-outline selection-leave-btn" onClick={onLeave}>
            Quitter
          </button>
        </aside>
      </div>

      <CharacterInfoModal character={infoCharacter} onClose={() => setInfoCharacter(null)} />
    </div>
  );
}
