import type { SpecialCardType } from '../types';
import { SPECIAL_CARDS } from '../types';

interface SpecialCardsPanelProps {
  cards: SpecialCardType[];
  isMyTurn: boolean;
  canBlock: boolean;
  onUse: (card: SpecialCardType) => void;
}

function getUsability(
  cardType: SpecialCardType,
  isMyTurn: boolean,
  canBlock: boolean,
): { canUse: boolean; hint: string } {
  switch (cardType) {
    case 'miracle':
      return isMyTurn
        ? { canUse: true, hint: SPECIAL_CARDS.miracle.description }
        : { canUse: false, hint: 'Disponible à votre tour uniquement' };
    case 'revelation':
      return { canUse: true, hint: SPECIAL_CARDS.revelation.description };
    case 'intercession':
      return canBlock
        ? { canUse: true, hint: SPECIAL_CARDS.intercession.description }
        : { canUse: false, hint: 'Quand un adversaire pose une question' };
    case 'concile':
      return isMyTurn
        ? { canUse: true, hint: SPECIAL_CARDS.concile.description }
        : { canUse: false, hint: 'Disponible à votre tour uniquement' };
    case 'martyre':
      return { canUse: true, hint: SPECIAL_CARDS.martyre.description };
    default:
      return { canUse: false, hint: '' };
  }
}

export default function SpecialCardsPanel({ cards, isMyTurn, canBlock, onUse }: SpecialCardsPanelProps) {
  if (cards.length === 0) {
    return (
      <p className="special-cards-empty">Toutes vos cartes ont été jouées.</p>
    );
  }

  return (
    <div className="special-cards">
      <p className="special-cards-note">3 cartes tirées au hasard par partie</p>
      {cards.map((cardType) => {
        const info = SPECIAL_CARDS[cardType];
        const { canUse, hint } = getUsability(cardType, isMyTurn, canBlock);

        return (
          <button
            key={cardType}
            type="button"
            className={`special-card ${canUse ? 'ready' : 'waiting'}`}
            disabled={!canUse}
            onClick={() => onUse(cardType)}
            title={hint}
          >
            <span className="emoji">{info.emoji}</span>
            <div className="special-card-info">
              <strong>{info.name}</strong>
              <span className={canUse ? 'hint-ready' : 'hint-wait'}>{hint}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
