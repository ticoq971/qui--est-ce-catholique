import type { Character } from '../types';

interface OpponentCandidatesProps {
  opponents: { id: string; name: string; isBot?: boolean }[];
  candidates: Record<string, string[]>;
  allCharacters: Character[];
  guessedIds: string[];
  onShowInfo?: (character: Character) => void;
  onQuickGuess?: (targetId: string, characterId: string) => void;
}

export default function OpponentCandidates({
  opponents,
  candidates,
  allCharacters,
  guessedIds,
  onShowInfo,
  onQuickGuess,
}: OpponentCandidatesProps) {
  const charMap = new Map(allCharacters.map((c) => [c.id, c]));

  return (
    <div className="opponent-candidates">
      {opponents.map((opp) => {
        const isGuessed = guessedIds.includes(opp.id);
        const ids = candidates[opp.id] ?? [];
        const remaining = ids
          .map((id) => charMap.get(id))
          .filter(Boolean) as Character[];

        return (
          <div key={opp.id} className={`candidate-block ${isGuessed ? 'guessed' : ''}`}>
            <div className="candidate-block-header">
              <span>
                {opp.name}
                {opp.isBot && ' 🤖'}
              </span>
              {isGuessed ? (
                <span className="candidate-count identified">✅ Identifié</span>
              ) : (
                <span className="candidate-count">
                  {remaining.length} restant{remaining.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
            {!isGuessed && remaining.length > 0 && (
              <div className="candidate-chips">
                {remaining.map((char) => (
                  <span key={char.id} className="candidate-chip" title={char.hint}>
                    {char.emoji} {char.name}
                    {onShowInfo && (
                      <button
                        type="button"
                        className="candidate-chip-info"
                        onClick={() => onShowInfo(char)}
                        aria-label={`Infos sur ${char.name}`}
                      >
                        ℹ️
                      </button>
                    )}
                  </span>
                ))}
              </div>
            )}
            {!isGuessed && remaining.length === 0 && (
              <p className="candidate-empty">Aucun candidat — affinez vos questions</p>
            )}
            {!isGuessed && remaining.length === 1 && (
              <button
                className="btn btn-sm btn-success"
                style={{ marginTop: '0.4rem', width: '100%' }}
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
