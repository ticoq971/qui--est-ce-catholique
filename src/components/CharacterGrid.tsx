import type { Character } from '../types';

interface CharacterGridProps {
  characters: Character[];
  eliminated: string[];
  onToggle: (id: string) => void;
  onShowInfo: (character: Character) => void;
}

export default function CharacterGrid({ characters, eliminated, onToggle, onShowInfo }: CharacterGridProps) {
  return (
    <div className="character-grid">
      {characters.map((char) => (
        <div
          key={char.id}
          className={`character-card-wrap ${eliminated.includes(char.id) ? 'eliminated' : ''}`}
        >
          <button
            type="button"
            className={`character-card ${eliminated.includes(char.id) ? 'eliminated' : ''}`}
            onClick={() => onToggle(char.id)}
            title="Cliquer pour éliminer / restaurer"
          >
            <span className="emoji">{char.emoji}</span>
            <span className="name">{char.name}</span>
          </button>
          <button
            type="button"
            className="character-info-btn"
            onClick={(e) => {
              e.stopPropagation();
              onShowInfo(char);
            }}
            title="En savoir plus"
            aria-label={`Infos sur ${char.name}`}
          >
            ℹ️
          </button>
        </div>
      ))}
    </div>
  );
}
