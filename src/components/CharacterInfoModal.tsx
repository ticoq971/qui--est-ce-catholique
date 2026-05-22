import type { Character } from '../types';
import { CATEGORY_LABELS } from '../types';
import { getCharacterBio, getCharacterTraits } from '../data/characterInfo';
import { getCharacterLifeYears } from '../data/characterLifeDates';

interface CharacterInfoModalProps {
  character: Character | null;
  onClose: () => void;
}

export default function CharacterInfoModal({ character, onClose }: CharacterInfoModalProps) {
  if (!character) return null;

  const bio = getCharacterBio(character);
  const traits = getCharacterTraits(character);
  const lifeYears = getCharacterLifeYears(character.id);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal character-info-modal" onClick={(e) => e.stopPropagation()}>
        <div className="character-info-header">
          <span className="character-info-emoji">{character.emoji}</span>
          <div>
            <h3>{character.name}</h3>
            <span className="character-info-category">{CATEGORY_LABELS[character.category]}</span>
            {lifeYears && (
              <span className="character-info-dates">📅 {lifeYears}</span>
            )}
          </div>
        </div>

        <p className="character-info-bio">{bio}</p>

        <div className="character-info-traits">
          {traits.map((trait) => (
            <span key={trait} className="character-info-trait">{trait}</span>
          ))}
        </div>

        <button className="btn btn-primary" onClick={onClose} style={{ marginTop: '1rem', width: '100%' }}>
          Fermer
        </button>
      </div>
    </div>
  );
}
