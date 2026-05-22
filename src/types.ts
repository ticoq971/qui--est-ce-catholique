export type CharacterCategory =
  | 'saint'
  | 'sainte'
  | 'pape'
  | 'apotre'
  | 'docteur'
  | 'mystique'
  | 'martyr'
  | 'biblique';

export type AttributeKey =
  | 'homme'
  | 'pape'
  | 'apotre'
  | 'martyr'
  | 'religieux'
  | 'eveque'
  | 'avant1000'
  | 'europeen'
  | 'fondateurOrdre'
  | 'docteurEglise'
  | 'biblique'
  | 'canonise'
  | 'mystique'
  | 'roi'
  | 'siecle20'
  | 'sainte';

export interface Character {
  id: string;
  name: string;
  category: CharacterCategory;
  emoji: string;
  hint: string;
  attributes: Record<AttributeKey, boolean>;
}

export type SpecialCardType =
  | 'miracle'
  | 'revelation'
  | 'intercession'
  | 'concile'
  | 'martyre';

export interface AttributeQuestion {
  key: AttributeKey;
  label: string;
  description: string;
}

export const ATTRIBUTE_QUESTIONS: AttributeQuestion[] = [
  { key: 'homme', label: 'Homme ?', description: 'Est-ce un homme ?' },
  { key: 'pape', label: 'Pape ?', description: 'Est-ce un pape ?' },
  { key: 'apotre', label: 'Apôtre ?', description: 'Est-ce un apôtre ?' },
  { key: 'martyr', label: 'Martyr ?', description: 'Est-ce un martyr ?' },
  { key: 'religieux', label: 'Religieux ?', description: 'Est-ce un moine, une religieuse ou un frère/m sœur ?' },
  { key: 'eveque', label: 'Évêque ?', description: 'Est-ce un évêque ou archevêque ?' },
  { key: 'avant1000', label: 'Avant l\'an 1000 ?', description: 'A-t-il/elle vécu avant l\'an 1000 ?' },
  { key: 'europeen', label: 'Européen ?', description: 'Est-ce une figure d\'origine européenne ?' },
  { key: 'fondateurOrdre', label: 'Fondateur d\'ordre ?', description: 'A-t-il/elle fondé un ordre religieux ?' },
  { key: 'docteurEglise', label: 'Docteur de l\'Église ?', description: 'Est-ce un Docteur de l\'Église ?' },
  { key: 'biblique', label: 'Dans la Bible ?', description: 'Est-il/elle mentionné(e) dans la Bible ?' },
  { key: 'canonise', label: 'Canonisé ?', description: 'A-t-il/elle été canonisé(e) ?' },
  { key: 'mystique', label: 'Mystique ?', description: 'Est-ce une figure mystique ?' },
  { key: 'sainte', label: 'Sainte (femme) ?', description: 'Est-ce une sainte ou une femme canonisée ?' },
  { key: 'roi', label: 'Roi ou reine ?', description: 'Est-ce un roi, une reine ou un souverain ?' },
  { key: 'siecle20', label: 'XXe siècle ?', description: 'A-t-il/elle vécu au XXe siècle ?' },
];

export const SPECIAL_CARDS: Record<SpecialCardType, { name: string; emoji: string; description: string }> = {
  miracle: {
    name: 'Miracle',
    emoji: '✨',
    description: 'Posez une deuxième question lors de votre tour.',
  },
  revelation: {
    name: 'Révélation',
    emoji: '👁️',
    description: 'Découvrez une caractéristique du personnage d\'un adversaire.',
  },
  intercession: {
    name: 'Intercession',
    emoji: '🙏',
    description: 'Bloquez la question en cours d\'un adversaire.',
  },
  concile: {
    name: 'Concile',
    emoji: '⛪',
    description: 'Tous les joueurs répondent à la même question en même temps.',
  },
  martyre: {
    name: 'Martyre',
    emoji: '🔥',
    description: 'Après une mauvaise identification, reprenez un tour de question.',
  },
};

export const CATEGORY_LABELS: Record<CharacterCategory, string> = {
  saint: 'Saint',
  sainte: 'Sainte',
  pape: 'Pape',
  apotre: 'Apôtre',
  docteur: 'Docteur de l\'Église',
  mystique: 'Mystique',
  martyr: 'Martyr',
  biblique: 'Personnage biblique',
};

export interface QuestionHistoryEntry {
  id: string;
  turnNumber: number;
  askerId: string;
  askerName: string;
  attributeKey: AttributeKey | null;
  attributeLabel: string;
  customText?: string | null;
  isCustom: boolean;
  isConcile: boolean;
  blocked: boolean;
  answers: Record<string, boolean>;
  answerNames?: Record<string, string>;
}

export interface PlayerPublic {
  id: string;
  name: string;
  isHost: boolean;
  isBot?: boolean;
  connected: boolean;
  guessesCorrect: string[];
  specialCardsUsed: SpecialCardType[];
  hasAnswered: boolean;
  answeredYes: boolean | null;
  hasSelectedCharacter?: boolean;
}

export interface GameStatePublic {
  roomCode: string;
  status: 'waiting' | 'selecting' | 'playing' | 'finished';
  isVsAI?: boolean;
  players: PlayerPublic[];
  currentTurnPlayerId: string | null;
  turnNumber: number;
  winnerId: string | null;
  winnerName: string | null;
  pendingQuestion: {
    askerId: string;
    askerName: string;
    attributeKey: AttributeKey | null;
    attributeLabel: string;
    customText: string | null;
    isCustom: boolean;
    isConcile: boolean;
    blocked: boolean;
    manualAnswers: boolean;
    answers: Record<string, boolean>;
  } | null;
  lastAction: string | null;
  revelationResult: {
    targetPlayerId: string;
    attributeKey: AttributeKey;
    value: boolean;
    forPlayerId: string;
  } | null;
  activeCharacters: string[];
  takenCharacterIds?: string[];
  questionHistory: QuestionHistoryEntry[];
  aiThinking?: boolean;
}

export interface PlayerPrivate {
  characterId: string | null;
  characterName: string | null;
  eliminated: string[];
  specialCards: SpecialCardType[];
  canAskSecondQuestion: boolean;
  canRetryTurn: boolean;
  opponentCandidates: Record<string, string[]>;
}

export interface RoomJoinedPayload {
  playerId: string;
  gameState: GameStatePublic;
  privateState: PlayerPrivate;
  allCharacters: Character[];
}

export interface GuessResult {
  success: boolean;
  targetPlayerId: string;
  targetPlayerName: string;
  guessedCharacterId: string;
  guessedCharacterName: string;
  actualCharacterName: string;
  message: string;
}
