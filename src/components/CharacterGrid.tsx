import type { Character } from '../types';

interface CharacterGridProps {
  characters: Character[];
  eliminated: string[];
  onToggle: (id: string) => void;
}

export default function CharacterGrid({ characters, eliminated, onToggle }: CharacterGridProps) {
  return (
    <div className="character-grid">
      {characters.map((char) => (
        <button
          key={char.id}
          className={`character-card ${eliminated.includes(char.id) ? 'eliminated' : ''}`}
          onClick={() => onToggle(char.id)}
          title={char.hint}
        >
          <span className="emoji">{char.emoji}</span>
          <span className="name">{char.name}</span>
        </button>
      ))}
    </div>
  );
}
