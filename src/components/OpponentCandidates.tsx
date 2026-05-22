import type { Character } from '../types';

interface OpponentCandidatesProps {
  opponents: { id: string; name: string; isBot?: boolean }[];
  resolvedByOpponent: Record<string, Character[]>;
  guessedIds: string[];
  canGuess?: boolean;
  onShowInfo?: (character: Character) => void;
  onQuickGuess?: (targetId: string, characterId: string) => void;
}

export default function OpponentCandidates({
  opponents,
  resolvedByOpponent,
  guessedIds,
  canGuess = false,
  onShowInfo,
  onQuickGuess,
}: OpponentCandidatesProps) {
  return (
    <div className="opponent-candidates">
      {opponents.map((opp) => {
        const isGuessed = guessedIds.includes(opp.id);
        const remaining = resolvedByOpponent[opp.id] ?? [];
        const count = remaining.length;

        return (
          <div key={opp.id} className={`candidate-block ${isGuessed ? 'guessed' : ''}`}>
            <div className="candidate-block-header">
              <span className="candidate-block-name">
                {opp.name}
                {opp.isBot && ' 🤖'}
              </span>
              {isGuessed ? (
                <span className="candidate-count identified">✅ Identifié</span>
              ) : (
                <span className="candidate-count">{count} restant{count > 1 ? 's' : ''}</span>
              )}
            </div>

            {!isGuessed && count > 0 && (
              <ul className="candidate-list">
                {remaining.map((char) => (
                  <li key={char.id} className="candidate-list-item">
                    <span className="candidate-list-emoji">{char.emoji}</span>
                    <span className="candidate-list-name" title={char.hint}>{char.name}</span>
                    {onShowInfo && (
                      <button
                        type="button"
                        className="candidate-list-info"
                        onClick={() => onShowInfo(char)}
                        aria-label={`Infos sur ${char.name}`}
                      >
                        ℹ️
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {!isGuessed && count === 0 && (
              <p className="candidate-empty">Aucun candidat actif — affinez vos questions</p>
            )}

            {!isGuessed && count === 1 && canGuess && (
              <button
                type="button"
                className="btn btn-sm btn-success candidate-quick-guess"
                onClick={() => onQuickGuess?.(opp.id, remaining[0].id)}
              >
                Deviner : {remaining[0].name}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
