import { buildKnownAnswersByPlayer } from '../utils/knownAnswers';
import type { QuestionHistoryEntry } from '../types';

interface KnownAnswersPanelProps {
  history: QuestionHistoryEntry[];
  playerId: string;
}

export default function KnownAnswersPanel({ history, playerId }: KnownAnswersPanelProps) {
  const byPlayer = buildKnownAnswersByPlayer(history);
  const entries = Object.entries(byPlayer).filter(([pid]) => pid !== playerId);

  if (entries.length === 0) {
    return (
      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: '0.75rem' }}>
        Les réponses des adversaires apparaîtront ici au fil des questions.
      </p>
    );
  }

  return (
    <div className="known-answers-panel">
      {entries.map(([pid, data]) => (
        <details key={pid} className="known-answers-player" open>
          <summary>{data.name} ({data.answers.length} réponse{data.answers.length > 1 ? 's' : ''})</summary>
          <ul>
            {data.answers.map((a, i) => (
              <li key={`${pid}-${i}`}>
                <span className="known-answers-turn">T{a.turnNumber}</span>
                <span className={`answer-badge ${a.answer ? 'yes' : 'no'}`}>
                  {a.answer ? 'Oui' : 'Non'}
                </span>
                <span className="known-answers-q">« {a.question} »</span>
                <span className="known-answers-asker">({a.askerName})</span>
              </li>
            ))}
          </ul>
        </details>
      ))}
    </div>
  );
}
