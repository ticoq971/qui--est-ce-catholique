import type { GuessAttemptEntry } from '../types';

interface GuessHistoryProps {
  history: GuessAttemptEntry[];
  playerId: string;
}

export default function GuessHistory({ history, playerId }: GuessHistoryProps) {
  if (history.length === 0) {
    return (
      <p className="guess-history-empty" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
        Aucune devinette pour l&apos;instant.
      </p>
    );
  }

  return (
    <ul className="guess-history">
      {[...history].reverse().map((entry) => {
        const isAboutMe = entry.targetPlayerId === playerId;
        const isMine = entry.guesserId === playerId;

        return (
          <li
            key={entry.id}
            className={`guess-history-item ${entry.success ? 'success' : 'fail'} ${isAboutMe ? 'about-me' : ''}`}
          >
            <span className="guess-history-turn">T{entry.turnNumber}</span>
            <span className="guess-history-text">
              {isMine ? 'Vous' : entry.guesserName} pense que{' '}
              {isAboutMe ? 'vous êtes' : `${entry.targetPlayerName} est`}{' '}
              <strong>{entry.guessedCharacterName}</strong>
              {entry.success ? ' ✅' : ' ❌'}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
