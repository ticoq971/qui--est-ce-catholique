import { shuffleArray } from '../src/data/characters';
import type { SpecialCardType } from '../src/types';

export const ALL_SPECIAL_CARDS: SpecialCardType[] = [
  'miracle',
  'revelation',
  'intercession',
  'concile',
  'martyre',
];

function combinationsOfThree(cards: SpecialCardType[]): SpecialCardType[][] {
  const combos: SpecialCardType[][] = [];
  for (let i = 0; i < cards.length; i++) {
    for (let j = i + 1; j < cards.length; j++) {
      for (let k = j + 1; k < cards.length; k++) {
        combos.push([cards[i], cards[j], cards[k]]);
      }
    }
  }
  return combos;
}

function comboKey(cards: SpecialCardType[]): string {
  return [...cards].sort().join(',');
}

export interface SpecialCardHolder {
  specialCards: SpecialCardType[];
  specialCardsUsed: SpecialCardType[];
}

/** 3 cartes aléatoires par joueur, combinaisons distinctes quand c'est possible */
export function dealSpecialCardsToPlayers(players: SpecialCardHolder[]): void {
  const combos = shuffleArray(combinationsOfThree(ALL_SPECIAL_CARDS));
  const used = new Set<string>();
  let comboIndex = 0;

  for (const player of players) {
    let assigned: SpecialCardType[] | null = null;

    while (comboIndex < combos.length) {
      const candidate = combos[comboIndex++];
      const key = comboKey(candidate);
      if (!used.has(key)) {
        used.add(key);
        assigned = candidate;
        break;
      }
    }

    if (!assigned) {
      assigned = shuffleArray(combinationsOfThree(ALL_SPECIAL_CARDS))[0];
    }

    player.specialCards = [...assigned];
    player.specialCardsUsed = [];
  }
}
