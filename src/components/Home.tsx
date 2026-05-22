import { useState, FormEvent, useEffect } from 'react';
import { CHARACTERS } from '../data/characters';
import CharacterEncyclopedia from './CharacterEncyclopedia';
import CharacterInfoModal from './CharacterInfoModal';
import type { Character } from '../types';

interface HomeProps {
  onCreate: (name: string) => void;
  onJoin: (code: string, name: string) => void;
  onPlayVsAI: (name: string, aiCount: number) => void;
  error: string | null;
  connected: boolean;
}

export default function Home({ onCreate, onJoin, onPlayVsAI, error, connected }: HomeProps) {
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [aiCount, setAiCount] = useState(1);
  const [mode, setMode] = useState<'menu' | 'create' | 'join' | 'ai'>('menu');
  const [loading, setLoading] = useState(false);
  const [connectionHelp, setConnectionHelp] = useState(false);
  const [showEncyclopedia, setShowEncyclopedia] = useState(false);
  const [infoCharacter, setInfoCharacter] = useState<Character | null>(null);

  useEffect(() => {
    if (connected) {
      setConnectionHelp(false);
      return;
    }
    const timer = setTimeout(() => setConnectionHelp(true), 4000);
    return () => clearTimeout(timer);
  }, [connected]);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    await onCreate(name.trim());
    setLoading(false);
  };

  const handleJoin = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !roomCode.trim()) return;
    setLoading(true);
    await onJoin(roomCode.trim(), name.trim());
    setLoading(false);
  };

  const handlePlayVsAI = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    await onPlayVsAI(name.trim(), aiCount);
    setLoading(false);
  };

  return (
    <div className="app">
      <div className="home">
        <header className="home-header">
          <span className="cross">✝</span>
          <h1>Qui est-ce ?</h1>
          <p>Le jeu de déduction sur les saints, papes et personnages de la foi catholique</p>
        </header>

        {!connected && (
          <div className="error-msg" style={{ maxWidth: 520, marginBottom: '1rem', textAlign: 'left' }}>
            {connectionHelp ? (
              <>
                <strong>Serveur injoignable.</strong>
                <p style={{ marginTop: '0.5rem', marginBottom: 0, fontSize: '0.85rem' }}>
                  Ce jeu nécessite le <strong>serveur Node.js</strong> (Socket.io), pas seulement les fichiers HTML.
                  Hébergez avec <code>npm run build</code> puis <code>npm start</code> sur Render, Railway ou un VPS.
                  GitHub Pages seul ne fonctionne pas.
                </p>
              </>
            ) : (
              'Connexion au serveur en cours…'
            )}
          </div>
        )}

        {mode === 'menu' && (
          <div className="home-form">
            <button className="btn btn-primary" onClick={() => setMode('create')} disabled={!connected}>
              Créer une partie
            </button>
            <div className="divider">ou</div>
            <button className="btn btn-secondary" onClick={() => setMode('join')} disabled={!connected}>
              Rejoindre une partie
            </button>
            <div className="divider">ou</div>
            <button className="btn btn-outline" onClick={() => setMode('ai')} disabled={!connected}>
              🤖 Jouer contre l'IA
            </button>
          </div>
        )}

        {mode === 'ai' && (
          <form className="home-form" onSubmit={handlePlayVsAI}>
            {error && <div className="error-msg">{error}</div>}
            <div className="form-group">
              <label htmlFor="ai-name">Votre prénom</label>
              <input
                id="ai-name"
                type="text"
                placeholder="Ex : Luc"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={20}
                autoFocus
              />
            </div>
            <div className="form-group">
              <label htmlFor="ai-count">Nombre d'adversaires IA</label>
              <select
                id="ai-count"
                value={aiCount}
                onChange={(e) => setAiCount(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  border: '2px solid var(--cream-dark)',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  background: 'white',
                }}
              >
                <option value={1}>1 adversaire</option>
                <option value={2}>2 adversaires</option>
                <option value={3}>3 adversaires</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading || !name.trim()}>
              {loading ? 'Préparation…' : 'Commencer la partie'}
            </button>
            <button type="button" className="btn btn-outline" style={{ marginTop: '0.75rem' }} onClick={() => setMode('menu')}>
              Retour
            </button>
          </form>
        )}

        {mode === 'create' && (
          <form className="home-form" onSubmit={handleCreate}>
            {error && <div className="error-msg">{error}</div>}
            <div className="form-group">
              <label htmlFor="name">Votre prénom</label>
              <input
                id="name"
                type="text"
                placeholder="Ex : Marie"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={20}
                autoFocus
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading || !name.trim()}>
              {loading ? 'Création…' : 'Créer la salle'}
            </button>
            <button type="button" className="btn btn-outline" style={{ marginTop: '0.75rem' }} onClick={() => setMode('menu')}>
              Retour
            </button>
          </form>
        )}

        {mode === 'join' && (
          <form className="home-form" onSubmit={handleJoin}>
            {error && <div className="error-msg">{error}</div>}
            <div className="form-group">
              <label htmlFor="join-name">Votre prénom</label>
              <input
                id="join-name"
                type="text"
                placeholder="Ex : Pierre"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={20}
                autoFocus
              />
            </div>
            <div className="form-group">
              <label htmlFor="code">Code de la salle</label>
              <input
                id="code"
                type="text"
                placeholder="Ex : ABCDE"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                maxLength={5}
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading || !name.trim() || !roomCode.trim()}>
              {loading ? 'Connexion…' : 'Rejoindre'}
            </button>
            <button type="button" className="btn btn-outline" style={{ marginTop: '0.75rem' }} onClick={() => setMode('menu')}>
              Retour
            </button>
          </form>
        )}

        <section className="home-rules">
          <h3>Comment jouer ?</h3>
          <ul>
            <li>Chaque joueur reçoit secrètement un personnage catholique</li>
            <li>À votre tour, posez une question oui/non à tous les adversaires</li>
            <li>Éliminez les personnages impossibles sur votre plateau</li>
            <li>Utilisez vos cartes spéciales une fois par partie</li>
            <li>Identifiez tous les personnages adverses pour gagner !</li>
            <li>Ou affrontez l'IA seul, à votre rythme</li>
          </ul>
        </section>

        <section className="home-encyclopedia">
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => setShowEncyclopedia((v) => !v)}
          >
            {showEncyclopedia ? 'Fermer le lexique' : '📖 Découvrir les personnages'}
          </button>
          {showEncyclopedia && (
            <div className="home-encyclopedia-panel">
              <CharacterEncyclopedia characters={CHARACTERS} onSelect={setInfoCharacter} />
            </div>
          )}
        </section>

        <CharacterInfoModal character={infoCharacter} onClose={() => setInfoCharacter(null)} />
      </div>
    </div>
  );
}
