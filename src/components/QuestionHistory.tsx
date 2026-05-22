import type { QuestionHistoryEntry } from '../types';

interface QuestionHistoryProps {
  history: QuestionHistoryEntry[];
  playerId: string;
}

export default function QuestionHistory({ history, playerId }: QuestionHistoryProps) {
  if (history.length === 0) {
    return (
      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
        Aucune question posée pour l'instant.
      </p>
    );
  }

  const reversed = [...history].reverse();

  return (
    <div className="question-history">
      {reversed.map((entry) => (
        <div key={entry.id} className={`history-entry ${entry.askerId === playerId ? 'mine' : ''}`}>
          <div className="history-entry-header">
            <span className="history-turn">T{entry.turnNumber}</span>
            <strong>{entry.askerName}</strong>
            {entry.blocked && <span className="history-blocked">🙏 Bloquée</span>}
            {entry.isConcile && <span className="history-concile">⛪ Concile</span>}
            {entry.isCustom && <span className="history-custom">✏️ Libre</span>}
          </div>
          <p className="history-question">« {entry.attributeLabel} »</p>
          {!entry.blocked && Object.keys(entry.answers).length > 0 && (
            <div className="history-answers">
              {Object.entries(entry.answers).map(([pid, val]) => (
                <span key={pid} className={`answer-badge ${val ? 'yes' : 'no'}`}>
                  {entry.answerNames?.[pid] ?? pid}: {val ? 'Oui' : 'Non'}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
