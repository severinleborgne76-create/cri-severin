# CRM Séverin - version synchronisée Mac + iPad

## Ce que fait ce projet
- synchro automatique entre appareils via Firestore
- tableau de bord Apple Premium
- clients / prospects
- ventes et commissions
- déplacements et IK
- mandants et taux

## Mise en route
1. Installer Node.js
2. Ouvrir le dossier dans VS Code
3. Créer un fichier `.env` à partir de `.env.example`
4. Remplir les valeurs Firebase
5. Dans le terminal :
   ```bash
   npm install
   npm run dev
   ```
6. Ouvrir l'URL locale affichée

## Mise en ligne simple sur Vercel
1. Créer un compte Vercel
2. Importer ce dossier comme projet
3. Ajouter les variables d'environnement du fichier `.env`
4. Déployer
5. Ouvrir le lien sur Mac et iPad

## Règle Firestore temporaire ultra simple (mode libre)
Dans Firestore > Rules, mettre provisoirement :
```txt
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```
Attention : cette règle laisse l'accès ouvert à toute personne connaissant l'URL. C'est cohérent avec ton choix A, mais à durcir ensuite si tu veux plus de sécurité.

## Collections utilisées
- `clients`
- `ventes`
- `kms`
- `mandants`
