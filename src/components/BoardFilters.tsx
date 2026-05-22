import { useState } from 'react';
import type { AttributeKey, Character } from '../types';
import { ATTRIBUTE_QUESTIONS, CATEGORY_LABELS } from '../types';
import type { CharacterCategory } from '../types';

interface BoardFiltersProps {
  characters: Character[];
  eliminated: string[];
  onBulkEliminate: (characterIds: string[]) => void;
  onRestoreAll: () => void;
}

export default function BoardFilters({
  characters,
  eliminated,
  onBulkEliminate,
  onRestoreAll,
}: BoardFiltersProps) {
  const [filterMode, setFilterMode] = useState<'attribute' | 'category'>('attribute');
  const [selectedAttr, setSelectedAttr] = useState<AttributeKey>('homme');
  const [selectedCategory, setSelectedCategory] = useState<CharacterCategory | 'all'>('all');

  const activeCount = characters.length - eliminated.length;

  const eliminateWhere = (predicate: (c: Character) => boolean) => {
    const ids = characters
      .filter((c) => predicate(c) && !eliminated.includes(c.id))
      .map((c) => c.id);
    if (ids.length > 0) onBulkEliminate(ids);
  };

  /** Réponse OUI → le personnage secret a ce trait → éliminer ceux qui ne l'ont pas */
  const handleAnswerYes = (key: AttributeKey) => {
    eliminateWhere((c) => !c.attributes[key]);
  };

  /** Réponse NON → éliminer ceux qui ont ce trait */
  const handleAnswerNo = (key: AttributeKey) => {
    eliminateWhere((c) => c.attributes[key]);
  };

  const handleCategoryEliminate = () => {
    if (selectedCategory === 'all') return;
    eliminateWhere((c) => c.category !== selectedCategory);
  };

  const categories = [...new Set(characters.map((c) => c.category))];

  return (
    <div className="board-filters">
      <div className="board-filters-header">
        <span className="board-filters-title">Élimination rapide</span>
        <span className="board-filters-count">{activeCount} actifs</span>
      </div>

      <div className="board-filters-tabs">
        <button
          type="button"
          className={filterMode === 'attribute' ? 'active' : ''}
          onClick={() => setFilterMode('attribute')}
        >
          Par trait
        </button>
        <button
          type="button"
          className={filterMode === 'category' ? 'active' : ''}
          onClick={() => setFilterMode('category')}
        >
          Par catégorie
        </button>
      </div>

      {filterMode === 'attribute' ? (
        <>
          <select
            className="board-filters-select"
            value={selectedAttr}
            onChange={(e) => setSelectedAttr(e.target.value as AttributeKey)}
          >
            {ATTRIBUTE_QUESTIONS.map((q) => (
              <option key={q.key} value={q.key}>{q.label}</option>
            ))}
          </select>
          <div className="board-filters-actions">
            <button
              type="button"
              className="btn btn-sm btn-danger"
              onClick={() => handleAnswerNo(selectedAttr)}
              title="Si la réponse à cette question est NON"
            >
              Réponse NON → éliminer
            </button>
            <button
              type="button"
              className="btn btn-sm btn-success"
              onClick={() => handleAnswerYes(selectedAttr)}
              title="Si la réponse à cette question est OUI"
            >
              Réponse OUI → éliminer
            </button>
          </div>
        </>
      ) : (
        <>
          <select
            className="board-filters-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as CharacterCategory | 'all')}
          >
            <option value="all">Choisir une catégorie…</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
            ))}
          </select>
          <button
            type="button"
            className="btn btn-sm btn-danger board-filters-full"
            disabled={selectedCategory === 'all'}
            onClick={handleCategoryEliminate}
          >
            Éliminer les autres catégories
          </button>
        </>
      )}

      <button type="button" className="btn btn-sm btn-outline board-filters-restore" onClick={onRestoreAll}>
        ↺ Tout restaurer
      </button>
    </div>
  );
}
