import type { Character } from '../types';

interface CharacterGridProps {
  characters: Character[];
  eliminated: string[];
  onToggle: (id: string) => void;
  onShowInfo: (character: Character) => void;
  compact?: boolean;
}

export default function CharacterGrid({ characters, eliminated, onToggle, onShowInfo, compact = false }: CharacterGridProps) {
  const eliminatedSet = eliminated ?? [];
  return (
    <div className={`character-grid ${compact ? 'character-grid-compact' : ''}`}>
      {characters.map((char) => (
        <div
          key={char.id}
          className={`character-card-wrap ${eliminatedSet.includes(char.id) ? 'eliminated' : ''}`}
        >
          <button
            type="button"
            className={`character-card ${eliminatedSet.includes(char.id) ? 'eliminated' : ''}`}
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
