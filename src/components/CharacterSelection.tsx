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
          <h2>Choisissez votre personnage secret</h2>
          <p className="selection-subtitle">
            {gameState.isVsAI
              ? `${boardCharacters.length} personnages disponibles. Votre choix reste secret — plusieurs joueurs peuvent incarner le même personnage.`
              : `${boardCharacters.length} personnages disponibles. Votre choix reste secret — la partie démarre quand tout le monde a confirmé.`}
          </p>
          {gameState.lastAction && (
            <p className="selection-status">{gameState.lastAction}</p>
          )}
        </header>

        {!myId && me && !me.isBot && (
          <div className="selection-cta">
            👇 <strong>Cliquez sur une carte</strong> — seul vous verrez votre choix
          </div>
        )}

        {myId && (
          <div className="selection-cta selected">
            ✅ Votre personnage secret : <strong>{privateState.characterName}</strong>
            {allReady && !gameState.isVsAI ? ' — en attente des autres joueurs…' : ''}
          </div>
        )}

        <main className="selection-grid-panel panel">
          <h3>Personnages ({boardCharacters.length})</h3>
          {boardCharacters.length === 0 ? (
            <p className="selection-empty">
              Chargement des personnages… Si rien n&apos;apparaît, quittez et relancez la partie.
            </p>
          ) : (
            <div className="selection-grid">
              {boardCharacters.map((char) => {
                const isMine = char.id === myId;

                return (
                  <div
                    key={char.id}
                    className={`selection-card-wrap ${isMine ? 'selected' : ''}`}
                  >
                    <button
                      type="button"
                      className="selection-card"
                      onClick={() => onSelect(char.id)}
                      title="Choisir ce personnage (secret)"
                    >
                      <span className="emoji">{char.emoji}</span>
                      <span className="name">{char.name}</span>
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
                  {player.isBot ? '—' : player.hasSelectedCharacter ? '✅ Prêt' : '…'}
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
