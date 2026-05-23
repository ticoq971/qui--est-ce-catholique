import type { Character } from '../types';
import CharacterGrid from './CharacterGrid';
import BoardFilters from './BoardFilters';

interface OpponentBoardPanelProps {
  opponentId: string;
  opponentName: string;
  isBot?: boolean;
  isIdentified: boolean;
  candidateCount: number;
  characters: Character[];
  eliminated: string[];
  compact?: boolean;
  onToggle: (characterId: string) => void;
  onBulkEliminate: (characterIds: string[]) => void;
  onRestoreAll: () => void;
  onShowInfo: (character: Character) => void;
}

export default function OpponentBoardPanel({
  opponentName,
  isBot,
  isIdentified,
  candidateCount,
  characters,
  eliminated,
  compact = false,
  onToggle,
  onBulkEliminate,
  onRestoreAll,
  onShowInfo,
}: OpponentBoardPanelProps) {
  const eliminatedIds = eliminated ?? [];
  const activeCount = characters.length - eliminatedIds.length;

  return (
    <section className={`opponent-board-panel ${compact ? 'compact' : ''} ${isIdentified ? 'identified' : ''}`}>
      <header className="opponent-board-header">
        <div className="opponent-board-title">
          <span className="opponent-board-name">
            {opponentName}
            {isBot && ' 🤖'}
          </span>
          {isIdentified ? (
            <span className="opponent-board-badge identified">✅ Identifié</span>
          ) : (
            <span className="opponent-board-badge">{candidateCount} candidat{candidateCount > 1 ? 's' : ''}</span>
          )}
        </div>
        {!isIdentified && (
          <span className="opponent-board-active">{activeCount} actifs sur le plateau</span>
        )}
      </header>

      {!isIdentified && (
        <>
          <BoardFilters
            characters={characters}
            eliminated={eliminatedIds}
            onBulkEliminate={onBulkEliminate}
            onRestoreAll={onRestoreAll}
          />
          <CharacterGrid
            characters={characters}
            eliminated={eliminatedIds}
            onToggle={onToggle}
            onShowInfo={onShowInfo}
            compact={compact}
          />
        </>
      )}
    </section>
  );
}
