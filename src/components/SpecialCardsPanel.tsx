import type { SpecialCardType } from '../types';
import { SPECIAL_CARDS } from '../types';

interface SpecialCardsPanelProps {
  cards: SpecialCardType[];
  isMyTurn: boolean;
  canBlock: boolean;
  onUse: (card: SpecialCardType) => void;
}

export default function SpecialCardsPanel({ cards, isMyTurn, canBlock, onUse }: SpecialCardsPanelProps) {
  const allCards: SpecialCardType[] = ['miracle', 'revelation', 'intercession', 'concile', 'martyre'];

  return (
    <div className="special-cards">
      {allCards.map((cardType) => {
        const info = SPECIAL_CARDS[cardType];
        const available = cards.includes(cardType);
        const canUse =
          available &&
          ((cardType === 'miracle' && isMyTurn) ||
            (cardType === 'revelation') ||
            (cardType === 'intercession' && canBlock) ||
            (cardType === 'concile' && isMyTurn) ||
            (cardType === 'martyre'));

        return (
          <button
            key={cardType}
            className={`special-card ${!available ? 'used' : ''}`}
            disabled={!canUse}
            onClick={() => onUse(cardType)}
            title={info.description}
          >
            <span className="emoji">{info.emoji}</span>
            <div className="special-card-info">
              <strong>{info.name}</strong>
              <span>{available ? info.description : 'Utilisée'}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
