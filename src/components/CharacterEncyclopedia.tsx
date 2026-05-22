import { useMemo, useState } from 'react';
import type { Character, CharacterCategory } from '../types';
import { CATEGORY_LABELS } from '../types';
import { getCharacterLifeYears } from '../data/characterLifeDates';

interface CharacterEncyclopediaProps {
  characters: Character[];
  onSelect: (character: Character) => void;
}

export default function CharacterEncyclopedia({ characters, onSelect }: CharacterEncyclopediaProps) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');

  const categories = useMemo(() => {
    const set = new Set(characters.map((c) => c.category));
    return ['all', ...Array.from(set)];
  }, [characters]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return characters
      .filter((c) => category === 'all' || c.category === category)
      .filter((c) => !q || c.name.toLowerCase().includes(q) || c.hint.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name, 'fr'));
  }, [characters, search, category]);

  return (
    <div className="encyclopedia">
      <input
        type="search"
        className="encyclopedia-search"
        placeholder="Rechercher un personnage…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="encyclopedia-filters">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            className={`encyclopedia-filter ${category === cat ? 'active' : ''}`}
            onClick={() => setCategory(cat)}
          >
            {cat === 'all' ? 'Tous' : CATEGORY_LABELS[cat as CharacterCategory]}
          </button>
        ))}
      </div>
      <div className="encyclopedia-list">
        {filtered.map((char) => {
          const lifeYears = getCharacterLifeYears(char.id);
          return (
          <button
            key={char.id}
            type="button"
            className="encyclopedia-item"
            onClick={() => onSelect(char)}
          >
            <span className="emoji">{char.emoji}</span>
            <div className="encyclopedia-text">
              <span className="name">{char.name}</span>
              {lifeYears && (
                <span className="dates">{lifeYears}</span>
              )}
              <span className="hint">{char.hint}</span>
            </div>
            <span className="info-icon">ℹ️</span>
          </button>
          );
        })}
        {filtered.length === 0 && (
          <p className="candidate-empty">Aucun personnage trouvé.</p>
        )}
      </div>
    </div>
  );
}
