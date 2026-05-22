# Qui est-ce ? Catholique

Jeu multijoueur de déduction inspiré de « Qui est-ce ? », sur le thème du catholicisme.

## Lancer le jeu

```bash
npm install
npm run dev
```

- **Interface** : http://localhost:5173
- **Serveur** : http://localhost:3001

## Jouer

### Multijoueur en ligne

1. Un joueur **crée une partie** et partage le code à 5 lettres.
2. Les autres **rejoignent** avec ce code (2 à 6 joueurs).

### Solo contre l'IA

1. Choisissez **Jouer contre l'IA** sur l'écran d'accueil.
2. Sélectionnez le nombre d'adversaires (1 à 3).
3. La partie démarre immédiatement — l'IA pose des questions, élimine des personnages et peut utiliser des cartes spéciales.

### Déroulement
3. Chaque joueur reçoit secrètement un personnage catholique.
4. À son tour, posez une question oui/non ; les réponses viennent des personnages adverses.
5. Éliminez les personnages impossibles sur votre plateau.
6. Utilisez vos **3 cartes spéciales** (une fois chacune) : Miracle, Révélation, Intercession, Concile, Martyre.
7. **Gagnez** en identifiant correctement le personnage de tous vos adversaires.

## Personnages

Plus de 70 figures : saints, saintes, papes, apôtres, docteurs de l'Église, mystiques, martyrs et personnages bibliques.

## Mise en ligne (important)

Ce jeu est **multijoueur en temps réel** : il faut héberger le **serveur Node.js**, pas seulement les fichiers HTML.

### Option recommandée : Render (gratuit)

1. Poussez le code sur GitHub.
2. Créez un compte sur [render.com](https://render.com).
3. **New → Web Service** → connectez votre dépôt.
4. Render détecte `render.yaml` automatiquement, ou configurez :
   - **Build** : `npm install && npm run build`
   - **Start** : `npm start`
5. Une fois déployé, ouvrez l’URL Render (ex. `https://qui-est-ce-catholique.onrender.com`).

Le front et le serveur Socket.io tournent **sur la même URL** — aucune config supplémentaire.

### Ce qui ne fonctionne pas

- **GitHub Pages** seul (pas de serveur Node / WebSocket)
- Héberger uniquement le dossier `dist/` sans lancer `npm start`

### Front et back séparés (avancé)

Si le site statique est ailleurs, définissez à la compilation :

```bash
VITE_SOCKET_URL=https://votre-serveur.onrender.com npm run build
```

## Production en local

```bash
npm run build
npm start
```

Le serveur Express sert le client compilé (`dist/`) et gère les parties via Socket.io sur le port 3001 (ou `PORT`).

