DOOMLINK V2 — PREMIÈRE VERSION CONNECTÉE

Cette version ajoute une vraie API et une base SQLite locale.

Fonctions :
- inscription sécurisée avec mot de passe chiffré (bcrypt)
- connexion avec jeton de session JWT
- profil de base
- création de publications
- fil d'actualité réel enregistré dans doomlink.db

INSTALLATION SUR UN ORDINATEUR :
1. Installer Node.js.
2. Ouvrir un terminal dans ce dossier.
3. Exécuter : npm install
4. Exécuter : npm start
5. Ouvrir : http://localhost:3000

IMPORTANT :
- La base doomlink.db est créée automatiquement.
- Pour une mise en ligne publique, il faudra remplacer le secret JWT par une valeur forte
  et utiliser un hébergement sécurisé.
- Cette étape ne contient pas encore les paiements, messages, photos/vidéos ou notifications.
