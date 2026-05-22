interface AnswerPanelProps {
  questionLabel: string;
  isCustom: boolean;
  characterName: string | null;
  onAnswer: (answer: boolean) => void;
}

export default function AnswerPanel({ questionLabel, isCustom, characterName, onAnswer }: AnswerPanelProps) {
  return (
    <div className="answer-panel">
      <h4>On vous interroge !</h4>
      <p className="answer-panel-question">« {questionLabel} »</p>
      {characterName && (
        <p className="answer-panel-hint">
          Votre personnage : <strong>{characterName}</strong>
          {!isCustom && ' — répondez selon votre fiche.'}
          {isCustom && ' — répondez honnêtement oui ou non.'}
        </p>
      )}
      <div className="answer-panel-buttons">
        <button className="btn btn-success" onClick={() => onAnswer(true)}>
          ✓ Oui
        </button>
        <button className="btn btn-danger" onClick={() => onAnswer(false)}>
          ✗ Non
        </button>
      </div>
    </div>
  );
}
