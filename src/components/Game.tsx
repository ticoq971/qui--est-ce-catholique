import { useState, useMemo } from 'react';
import type {
  Character,
  GameStatePublic,
  PlayerPrivate,
  AttributeKey,
  SpecialCardType,
  GuessResult,
} from '../types';
import { ATTRIBUTE_QUESTIONS } from '../types';
import { computeOpponentCandidates, resolveOpponentCharactersForAll, getPrimaryOpponentId, getEliminatedForOpponent } from '../utils/candidates';
import OpponentBoardPanel from './OpponentBoardPanel';
import KnownAnswersPanel from './KnownAnswersPanel';
import GuessHistory from './GuessHistory';
import SpecialCardsPanel from './SpecialCardsPanel';
import QuestionHistory from './QuestionHistory';
import OpponentCandidates from './OpponentCandidates';
import AnswerPanel from './AnswerPanel';
import CharacterInfoModal from './CharacterInfoModal';
import CharacterEncyclopedia from './CharacterEncyclopedia';

interface GameProps {
  gameState: GameStatePublic;
  privateState: PlayerPrivate;
  allCharacters: Character[];
  playerId: string;
  onAskQuestion: (key: AttributeKey, targetPlayerId?: string) => void;
  onAskCustomQuestion: (text: string, targetPlayerId?: string) => void;
  onSubmitAnswer: (answer: boolean) => void;
  onUseSpecialCard: (card: SpecialCardType, targetId?: string, attributeKey?: AttributeKey) => void;
  onToggleEliminated: (opponentId: string, characterId: string) => void;
  onBulkEliminate: (opponentId: string, characterIds: string[]) => void;
  onRestoreAllEliminated: (opponentId?: string) => void;
  onGuessCharacter: (targetPlayerId: string, characterId: string) => Promise<GuessResult>;
  onRestart: () => Promise<boolean>;
  onLeave: () => void;
}

export default function Game({
  gameState,
  privateState,
  allCharacters,
  playerId,
  onAskQuestion,
  onAskCustomQuestion,
  onSubmitAnswer,
  onUseSpecialCard,
  onToggleEliminated,
  onBulkEliminate,
  onRestoreAllEliminated,
  onGuessCharacter,
  onRestart,
  onLeave,
}: GameProps) {
  const [guessModal, setGuessModal] = useState<{ targetId: string; targetName: string } | null>(null);
  const [selectedGuess, setSelectedGuess] = useState<string | null>(null);
  const [guessResult, setGuessResult] = useState<GuessResult | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<AttributeKey | null>(null);
  const [questionTarget, setQuestionTarget] = useState<string | null>(null);
  const [revelationStep, setRevelationStep] = useState<'idle' | 'pickPlayer' | 'pickAttribute'>('idle');
  const [revelationTarget, setRevelationTarget] = useState<string | null>(null);
  const [concileStep, setConcileStep] = useState(false);
  const [questionMode, setQuestionMode] = useState<'preset' | 'custom'>('preset');
  const [customQuestion, setCustomQuestion] = useState('');
  const [infoCharacter, setInfoCharacter] = useState<Character | null>(null);
  const [showEncyclopedia, setShowEncyclopedia] = useState(false);
  const [restarting, setRestarting] = useState(false);

  const isMultiplayer = !gameState.isVsAI;
  const me = gameState.players.find((p) => p.id === playerId)!;
  const isHost = me.isHost;

  const isMyTurn = gameState.currentTurnPlayerId === playerId;
  const opponents = gameState.players.filter((p) => p.id !== playerId);
  const playableOpponents = opponents.filter((p) => !p.eliminatedFromGame);
  const pending = gameState.pendingQuestion;
  const canAsk = isMyTurn && !pending && !privateState.hasGuessedThisTurn;
  const canGuess = isMyTurn && !privateState.hasGuessedThisTurn && !pending;
  const canBlock = pending && !pending.blocked && pending.askerId !== playerId;
  const mustAnswer = pending
    && !pending.blocked
    && pending.manualAnswers
    && pending.answers[playerId] === undefined
    && !me.eliminatedFromGame
    && (pending.isConcile ? true : pending.targetPlayerId === playerId);

  const myRevelation = gameState.revelationResult?.forPlayerId === playerId
    ? gameState.revelationResult
    : null;

  const currentPlayer = gameState.players.find((p) => p.id === gameState.currentTurnPlayerId);
  const isAiTurn = currentPlayer?.isBot && !gameState.pendingQuestion;

  const displayCandidates = useMemo(
    () => computeOpponentCandidates(
      playableOpponents,
      gameState.activeCharacters,
      privateState.characterId,
      privateState.eliminatedByOpponent ?? {},
      privateState.opponentCandidates ?? {},
    ),
    [playableOpponents, gameState.activeCharacters, privateState.characterId, privateState.eliminatedByOpponent, privateState.opponentCandidates],
  );

  const primaryOpponentId = getPrimaryOpponentId(playableOpponents);

  const resolvedByOpponent = useMemo(
    () => resolveOpponentCharactersForAll(playableOpponents, displayCandidates, allCharacters),
    [playableOpponents, displayCandidates, allCharacters],
  );

  const handleAsk = () => {
    if (!selectedQuestion) return;
    if (isMultiplayer && !questionTarget) return;
    onAskQuestion(selectedQuestion, isMultiplayer ? questionTarget! : undefined);
    setSelectedQuestion(null);
    setQuestionTarget(null);
  };

  const handleAskCustom = () => {
    const text = customQuestion.trim();
    if (text.length < 3) return;
    if (isMultiplayer && !questionTarget) return;
    onAskCustomQuestion(text, isMultiplayer ? questionTarget! : undefined);
    setCustomQuestion('');
    setQuestionMode('preset');
    setQuestionTarget(null);
  };

  const handleGuessSubmit = async () => {
    if (!guessModal || !selectedGuess) return;
    const result = await onGuessCharacter(guessModal.targetId, selectedGuess);
    setGuessResult(result);
  };

  const closeGuessModal = () => {
    setGuessModal(null);
    setSelectedGuess(null);
    setGuessResult(null);
  };

  const handleRevelation = () => {
    if (revelationStep === 'idle') {
      setRevelationStep('pickPlayer');
    } else if (revelationStep === 'pickPlayer' && revelationTarget) {
      setRevelationStep('pickAttribute');
    }
  };

  const confirmRevelation = (attr: AttributeKey) => {
    if (revelationTarget) {
      onUseSpecialCard('revelation', revelationTarget, attr);
      setRevelationStep('idle');
      setRevelationTarget(null);
    }
  };

  const confirmConcile = (attr: AttributeKey) => {
    onUseSpecialCard('concile', undefined, attr);
    setConcileStep(false);
  };

  const handleRestart = async () => {
    setRestarting(true);
    await onRestart();
    setRestarting(false);
  };

  if (gameState.status === 'finished') {
    return (
      <div className="app">
        <div className="victory-overlay">
          <div className="victory-card">
            <span className="trophy">🏆</span>
            <h2>{gameState.winnerName} remporte la partie !</h2>
            <p style={{ marginBottom: '1.5rem', color: 'var(--text-muted)' }}>
              {gameState.isVsAI
                ? (gameState.players.find(p => p.id === gameState.winnerId)?.isBot
                  ? 'L\'IA a identifié tous vos personnages. Retentez votre chance !'
                  : 'Tous les personnages adverses ont été identifiés.')
                : 'Dernier joueur en lice — victoire par élimination !'}
            </p>
            <div className="victory-actions">
              {isHost ? (
                <button className="btn btn-primary" onClick={handleRestart} disabled={restarting}>
                  {restarting ? 'Relance…' : '🔄 Recommencer'}
                </button>
              ) : (
                <p className="victory-wait-host">En attente que l'hôte relance la partie…</p>
              )}
              <button className="btn btn-outline" onClick={onLeave}>
                Retour à l'accueil
              </button>
            </div>
            {!gameState.isVsAI && (
              <p className="victory-room-code">
                Salle <strong>{gameState.roomCode}</strong> — restez connectés pour rejouer ensemble
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="game">
        <div className="game-topbar">
          <h2>
            {gameState.isVsAI ? '🤖 Solo vs IA' : `Salle ${gameState.roomCode}`} — Tour {gameState.turnNumber}
          </h2>
          <span className={`turn-indicator ${isMyTurn ? 'my-turn' : ''} ${isAiTurn && gameState.aiThinking ? 'ai-thinking' : ''}`}>
            {isMyTurn
              ? '🎯 C\'est votre tour !'
              : isAiTurn && gameState.aiThinking
                ? `🤖 ${currentPlayer?.name} réfléchit…`
                : `Tour de ${currentPlayer?.name ?? '…'}`}
          </span>
          <button className="btn btn-sm btn-outline" onClick={onLeave}>Quitter</button>
        </div>

        {gameState.lastAction && (
          <div className="last-action">{gameState.lastAction}</div>
        )}

        {(() => {
          const lastGuess = gameState.guessHistory?.at(-1);
          if (!lastGuess || lastGuess.targetPlayerId !== playerId) return null;
          return (
            <div className="guess-alert-banner">
              🎯 <strong>{lastGuess.guesserName}</strong> pense que vous êtes{' '}
              <strong>{lastGuess.guessedCharacterName}</strong>
              {lastGuess.success ? ' — et a raison ! ✅' : ' — incorrect ❌'}
            </div>
          );
        })()}

        {pending && (
          <div className="pending-question">
            <h4>
              {pending.blocked
                ? '🙏 Question bloquée par Intercession !'
                : pending.isConcile
                  ? `${pending.askerName} convoque un Concile : « ${pending.isCustom ? pending.customText : pending.attributeLabel} »`
                  : pending.targetPlayerName
                    ? `${pending.askerName} demande à ${pending.targetPlayerName} : « ${pending.isCustom ? pending.customText : pending.attributeLabel} »`
                    : `${pending.askerName} demande : « ${pending.isCustom ? pending.customText : pending.attributeLabel} »`}
            </h4>
            {pending.isConcile && (
              <span className="history-concile" style={{ fontSize: '0.8rem' }}>⛪ Tous les joueurs actifs répondent</span>
            )}
            {pending.isCustom && !pending.isConcile && (
              <span className="history-custom" style={{ fontSize: '0.8rem' }}>Question libre</span>
            )}
            {!pending.blocked && pending.manualAnswers && pending.targetPlayerId && !pending.answers[pending.targetPlayerId] && pending.askerId !== playerId && pending.targetPlayerId !== playerId && (
              <p style={{ fontSize: '0.85rem' }}>En attente de la réponse de {pending.targetPlayerName}…</p>
            )}
            {Object.keys(pending.answers).length > 0 && (
              <div className="answers">
                {gameState.players
                  .filter((p) => pending.answers[p.id] !== undefined)
                  .map((p) => (
                    <span key={p.id} className={`answer-badge ${pending.answers[p.id] ? 'yes' : 'no'}`}>
                      {p.name}: {pending.answers[p.id] ? 'Oui' : 'Non'}
                    </span>
                  ))}
              </div>
            )}
            {canBlock && (
              <button
                className="btn btn-sm btn-danger"
                style={{ marginTop: '0.75rem' }}
                onClick={() => onUseSpecialCard('intercession')}
                disabled={privateState.specialCards.includes('intercession') === false}
              >
                🙏 Jouer Intercession
              </button>
            )}
          </div>
        )}

        {mustAnswer && pending && (
          <AnswerPanel
            questionLabel={pending.isCustom ? (pending.customText ?? '') : pending.attributeLabel}
            isCustom={pending.isCustom}
            characterName={privateState.characterName}
            onAnswer={onSubmitAnswer}
          />
        )}

        {myRevelation && (
          <div className="revelation-banner">
            👁️ <strong>Révélation :</strong> {gameState.players.find(p => p.id === myRevelation.targetPlayerId)?.name} —
            « {ATTRIBUTE_QUESTIONS.find(q => q.key === myRevelation.attributeKey)?.label} » →{' '}
            <strong>{myRevelation.value ? 'Oui' : 'Non'}</strong>
          </div>
        )}

        {isMultiplayer && (
          <div className="multiplayer-boards">
            <h3 className="multiplayer-boards-title">Plateaux par adversaire</h3>
            <div className="multiplayer-boards-scroll">
              {playableOpponents.map((opp) => (
                <OpponentBoardPanel
                  key={opp.id}
                  opponentId={opp.id}
                  opponentName={opp.name}
                  isBot={opp.isBot}
                  isIdentified={false}
                  candidateCount={resolvedByOpponent[opp.id]?.length ?? 0}
                  characters={allCharacters}
                  eliminated={privateState.eliminatedByOpponent[opp.id] ?? []}
                  compact
                  onToggle={(charId) => onToggleEliminated(opp.id, charId)}
                  onBulkEliminate={(ids) => onBulkEliminate(opp.id, ids)}
                  onRestoreAll={() => onRestoreAllEliminated(opp.id)}
                  onShowInfo={setInfoCharacter}
                />
              ))}
              {playableOpponents.length === 0 && (
                <p className="candidate-empty">Tous les adversaires ont été identifiés !</p>
              )}
            </div>
          </div>
        )}

        <div className="game-layout">
          {/* Left panel */}
          <div className="panel panel-side">
            <h3 className="panel-section-title">Votre personnage</h3>
            {privateState.characterName && (
              <div className="my-character my-character-compact">
                <span className="emoji">
                  {allCharacters.find(c => c.id === privateState.characterId)?.emoji ?? '✝'}
                </span>
                <div className="my-character-info">
                  <h4>{privateState.characterName}</h4>
                  <p>{allCharacters.find(c => c.id === privateState.characterId)?.hint}</p>
                </div>
                {privateState.characterId && (
                  <button
                    type="button"
                    className="btn btn-sm btn-outline my-character-info-btn"
                    onClick={() => {
                      const c = allCharacters.find(ch => ch.id === privateState.characterId);
                      if (c) setInfoCharacter(c);
                    }}
                  >
                    ℹ️
                  </button>
                )}
              </div>
            )}

            <h3 className="panel-section-title">Adversaires</h3>
            <div className="opponents-tracker">
              {opponents.map((opp) => (
                <div key={opp.id} className={`opponent-row ${opp.eliminatedFromGame ? 'eliminated-player' : ''} ${me.guessesCorrect.includes(opp.id) ? 'guessed' : ''}`}>
                  <div className="player-avatar">{opp.name.charAt(0)}</div>
                  <span>
                    {opp.name}
                    {opp.isBot && <span style={{ marginLeft: '0.35rem', opacity: 0.7 }}>🤖</span>}
                    {opp.eliminatedFromGame && <span className="opponent-eliminated-tag"> 💀 Éliminé</span>}
                    {!opp.connected && !opp.isBot && !opp.eliminatedFromGame && (
                      <span className="opponent-offline" title="Déconnecté"> ⚡</span>
                    )}
                  </span>
                  {opp.eliminatedFromGame ? (
                    <span className="status">💀 Éliminé</span>
                  ) : me.guessesCorrect.includes(opp.id) ? (
                    <span className="status">✅ Identifié</span>
                  ) : (
                    <div className="opponent-row-actions">
                      <span className="opponent-candidate-badge">
                        {resolvedByOpponent[opp.id]?.length ?? 0}
                      </span>
                      <button
                        type="button"
                        className="btn btn-sm btn-success opponent-guess-btn"
                        disabled={!canGuess}
                        title={!canGuess ? (privateState.hasGuessedThisTurn ? 'Une devinette par tour' : 'Ce n\'est pas votre tour') : undefined}
                        onClick={() => setGuessModal({ targetId: opp.id, targetName: opp.name })}
                      >
                        Deviner
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <h3 className="panel-section-title">Candidats restants (non éliminés)</h3>
            <div className="opponent-candidates-scroll">
              <OpponentCandidates
                opponents={playableOpponents}
                resolvedByOpponent={resolvedByOpponent}
                guessedIds={me.guessesCorrect}
                canGuess={canGuess}
                onShowInfo={setInfoCharacter}
                onQuickGuess={(targetId, characterId) => {
                  const opp = opponents.find((o) => o.id === targetId);
                  if (opp) {
                    setGuessModal({ targetId, targetName: opp.name });
                    setSelectedGuess(characterId);
                  }
                }}
              />
            </div>

            <h3 className="panel-section-title">Cartes spéciales</h3>
            <SpecialCardsPanel
              cards={privateState.specialCards}
              isMyTurn={isMyTurn}
              canBlock={!!canBlock}
              onUse={(card) => {
                if (card === 'revelation') handleRevelation();
                else if (card === 'concile') setConcileStep(true);
                else onUseSpecialCard(card);
              }}
            />

            {revelationStep === 'pickPlayer' && (
              <div style={{ marginTop: '0.75rem' }}>
                <p style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>Choisissez un adversaire :</p>
                <div className="player-select">
                  {opponents.filter(o => !me.guessesCorrect.includes(o.id)).map(o => (
                    <button
                      key={o.id}
                      className={`player-chip ${revelationTarget === o.id ? 'selected' : ''}`}
                      onClick={() => setRevelationTarget(o.id)}
                    >
                      {o.name}
                    </button>
                  ))}
                </div>
                {revelationTarget && (
                  <button className="btn btn-sm btn-primary" style={{ marginTop: '0.5rem' }} onClick={handleRevelation}>
                    Suivant →
                  </button>
                )}
              </div>
            )}

            {revelationStep === 'pickAttribute' && (
              <div style={{ marginTop: '0.75rem' }}>
                <p style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>Quelle caractéristique révéler ?</p>
                {ATTRIBUTE_QUESTIONS.map(q => (
                  <button key={q.key} className="question-btn" onClick={() => confirmRevelation(q.key)}>
                    {q.label}
                  </button>
                ))}
              </div>
            )}

            {concileStep && (
              <div style={{ marginTop: '0.75rem' }}>
                <p style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>Question du Concile :</p>
                {ATTRIBUTE_QUESTIONS.map(q => (
                  <button key={q.key} className="question-btn" onClick={() => confirmConcile(q.key)}>
                    {q.label}
                  </button>
                ))}
                <button className="btn btn-sm btn-outline" style={{ marginTop: '0.5rem' }} onClick={() => setConcileStep(false)}>
                  Annuler
                </button>
              </div>
            )}
          </div>

          {/* Center - vs IA only */}
          {!isMultiplayer && (
          <div className="panel panel-board">
            <div className="panel-board-header">
              <h3 className="panel-section-title">Plateau</h3>
              <button type="button" className="btn btn-sm btn-outline" onClick={() => setShowEncyclopedia((v) => !v)}>
                {showEncyclopedia ? 'Fermer le lexique' : '📖 Lexique'}
              </button>
            </div>
            {showEncyclopedia ? (
              <CharacterEncyclopedia characters={allCharacters} onSelect={setInfoCharacter} />
            ) : primaryOpponentId ? (
              <OpponentBoardPanel
                opponentId={primaryOpponentId}
                opponentName={opponents.find(o => o.id === primaryOpponentId)?.name ?? 'Adversaire'}
                isBot={opponents.find(o => o.id === primaryOpponentId)?.isBot}
                isIdentified={false}
                candidateCount={resolvedByOpponent[primaryOpponentId]?.length ?? 0}
                characters={allCharacters}
                eliminated={getEliminatedForOpponent(privateState.eliminatedByOpponent, primaryOpponentId)}
                onToggle={(charId) => onToggleEliminated(primaryOpponentId, charId)}
                onBulkEliminate={(ids) => onBulkEliminate(primaryOpponentId, ids)}
                onRestoreAll={() => onRestoreAllEliminated(primaryOpponentId)}
                onShowInfo={setInfoCharacter}
              />
            ) : null}
          </div>
          )}

          {isMultiplayer && (
          <div className="panel panel-board panel-lexique">
            <div className="panel-board-header">
              <h3 className="panel-section-title">Lexique</h3>
            </div>
            <CharacterEncyclopedia characters={allCharacters} onSelect={setInfoCharacter} />
          </div>
          )}

          {/* Right panel - questions & history */}
          <div className="panel panel-questions">
            <h3 className="panel-section-title">Historique des questions</h3>
            <QuestionHistory history={gameState.questionHistory ?? []} playerId={playerId} />

            <h3 className="panel-section-title">Devinettes</h3>
            <GuessHistory history={gameState.guessHistory ?? []} playerId={playerId} />

            <h3 className="panel-section-title">Réponses connues</h3>
            {isMultiplayer && (
              <KnownAnswersPanel history={gameState.questionHistory ?? []} playerId={playerId} />
            )}

            <h3 className="panel-section-title">Poser une question</h3>
            {isMultiplayer && canAsk && (
              <div style={{ marginBottom: '0.75rem' }}>
                <p style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>À qui posez-vous la question ?</p>
                <div className="player-select">
                  {playableOpponents.map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      className={`player-chip ${questionTarget === o.id ? 'selected' : ''}`}
                      onClick={() => setQuestionTarget(o.id)}
                    >
                      {o.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {!canAsk && !mustAnswer && (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                {pending
                  ? (mustAnswer ? 'Répondez à la question ci-dessus.' : 'En attente des réponses…')
                  : !isMyTurn
                    ? 'Ce n\'est pas votre tour.'
                    : privateState.hasGuessedThisTurn
                      ? 'Vous avez deviné ce tour-ci — le tour va passer.'
                      : 'Choisissez une question ou devinez un adversaire.'}
              </p>
            )}

            {isMultiplayer && canAsk && (
              <div className="question-mode-tabs">
                <button
                  type="button"
                  className={`question-mode-tab ${questionMode === 'preset' ? 'active' : ''}`}
                  onClick={() => setQuestionMode('preset')}
                >
                  Prédéfinies
                </button>
                <button
                  type="button"
                  className={`question-mode-tab ${questionMode === 'custom' ? 'active' : ''}`}
                  onClick={() => setQuestionMode('custom')}
                >
                  ✏️ Question libre
                </button>
              </div>
            )}

            {(questionMode === 'preset' || !isMultiplayer) && (
              <>
                <div className="question-buttons">
                  {ATTRIBUTE_QUESTIONS.map((q) => (
                    <button
                      key={q.key}
                      className={`question-btn ${selectedQuestion === q.key ? 'selected' : ''}`}
                      disabled={!canAsk}
                      onClick={() => setSelectedQuestion(q.key)}
                      title={q.description}
                    >
                      {q.label}
                    </button>
                  ))}
                </div>
                {canAsk && selectedQuestion && (!isMultiplayer || questionTarget) && (
                  <button className="btn btn-primary" style={{ marginTop: '0.75rem' }} onClick={handleAsk}>
                    Poser cette question{isMultiplayer && questionTarget ? ` à ${playableOpponents.find(o => o.id === questionTarget)?.name}` : ''}
                  </button>
                )}
              </>
            )}

            {isMultiplayer && questionMode === 'custom' && canAsk && (
              <div className="custom-question-form">
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  Écrivez une question fermée (oui/non). Seul le joueur ciblé répondra.
                </p>
                <textarea
                  className="custom-question-input"
                  placeholder="Ex : Votre personnage est-il italien ?"
                  value={customQuestion}
                  onChange={(e) => setCustomQuestion(e.target.value)}
                  maxLength={200}
                  rows={3}
                />
                <button
                  className="btn btn-primary"
                  style={{ marginTop: '0.5rem' }}
                  disabled={customQuestion.trim().length < 3 || !questionTarget}
                  onClick={handleAskCustom}
                >
                  Poser la question libre{questionTarget ? ` à ${playableOpponents.find(o => o.id === questionTarget)?.name}` : ''}
                </button>
              </div>
            )}

            {isMultiplayer && !gameState.isVsAI && canAsk && questionMode === 'preset' && (
              <p style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                En multijoueur, les adversaires répondent eux-mêmes selon leur personnage secret.
              </p>
            )}
            {privateState.canAskSecondQuestion && (
              <p style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--success)', fontWeight: 600 }}>
                ✨ Miracle actif — vous pourrez poser une 2e question !
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Guess modal */}
      {guessModal && (() => {
        const targetEliminated = privateState.eliminatedByOpponent[guessModal.targetId] ?? [];
        const notEliminated = (c: Character) => !targetEliminated.includes(c.id);
        const targetCandidateIds = (displayCandidates[guessModal.targetId] ?? [])
          .filter((id) => !targetEliminated.includes(id));
        const candidateChars = targetCandidateIds
          .map((id) => allCharacters.find((c) => c.id === id))
          .filter((c): c is Character => !!c && notEliminated(c));
        const guessableChars = allCharacters.filter(notEliminated);
        const otherChars = guessableChars.filter((c) => !targetCandidateIds.includes(c.id));

        return (
        <div className="modal-overlay" onClick={closeGuessModal}>
          <div className="modal guess-modal" onClick={(e) => e.stopPropagation()}>
            {!guessResult ? (
              <>
                <h3>Qui est {guessModal.targetName} ?</h3>
                <p className="guess-modal-hint">Seuls les personnages encore actifs sur votre plateau sont proposés.</p>
                {candidateChars.length === 1 && (
                  <p className="guess-hint-single">
                    D'après vos questions, un seul candidat reste probable.
                  </p>
                )}
                {guessableChars.length === 0 && (
                  <p className="candidate-empty">Aucun personnage actif — restaurez votre plateau.</p>
                )}
                {candidateChars.length > 0 && (
                  <>
                    <p className="guess-section-label">
                      Candidats probables ({candidateChars.length})
                    </p>
                    <div className="guess-grid">
                      {candidateChars.map((c) => (
                        <div key={c.id} className="guess-option-wrap">
                          <button
                            type="button"
                            className={`guess-option probable ${selectedGuess === c.id ? 'selected' : ''}`}
                            onClick={() => setSelectedGuess(c.id)}
                          >
                            <div style={{ fontSize: '1.5rem' }}>{c.emoji}</div>
                            {c.name}
                          </button>
                          <button
                            type="button"
                            className="guess-option-info"
                            onClick={() => setInfoCharacter(c)}
                            aria-label={`Infos sur ${c.name}`}
                          >
                            ℹ️
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                )}
                {otherChars.length > 0 && (
                  <>
                    <p className="guess-section-label" style={{ marginTop: '0.75rem' }}>
                      Autres personnages actifs ({otherChars.length})
                    </p>
                    <div className="guess-grid">
                      {otherChars.map((c) => (
                        <div key={c.id} className="guess-option-wrap">
                          <button
                            type="button"
                            className={`guess-option ${selectedGuess === c.id ? 'selected' : ''}`}
                            onClick={() => setSelectedGuess(c.id)}
                          >
                            <div style={{ fontSize: '1.5rem' }}>{c.emoji}</div>
                            {c.name}
                          </button>
                          <button
                            type="button"
                            className="guess-option-info"
                            onClick={() => setInfoCharacter(c)}
                            aria-label={`Infos sur ${c.name}`}
                          >
                            ℹ️
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                )}
                <div className="modal-actions">
                  <button className="btn btn-outline" onClick={closeGuessModal}>Annuler</button>
                  <button className="btn btn-success" disabled={!selectedGuess} onClick={handleGuessSubmit}>
                    Confirmer
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3>{guessResult.success ? '🎉 Correct !' : '❌ Incorrect'}</h3>
                <p style={{ margin: '1rem 0' }}>{guessResult.message}</p>
                {!guessResult.success && (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Revoyez l'historique de vos questions pour affiner votre déduction.
                  </p>
                )}
                <button className="btn btn-primary" onClick={closeGuessModal}>Fermer</button>
              </>
            )}
          </div>
        </div>
        );
      })()}

      <CharacterInfoModal character={infoCharacter} onClose={() => setInfoCharacter(null)} />
    </div>
  );
}
