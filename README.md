# Bridge Dealer Pro

Application Vue.js 3 avancée pour générer des distributions de cartes de Bridge selon des critères précis de points et de distribution de couleurs. **14 scénarios de Bridge professionnels** organisés en 7 catégories + **Gestion de decks personnalisés**.

## 🎯 Fonctionnalités

### Fonctionnalités principales
- ✅ Distribution automatique de 52 cartes entre 4 joueurs (Nord, Sud, Est, Ouest)
- ✅ Chaque joueur reçoit 13 cartes triées par couleur (♠ ♥ ♦ ♣)
- ✅ Calcul automatique des points : As=4, Roi=3, Dame=2, Valet=1
- ✅ **Critères avancés** : Points ET distribution par couleur pour chaque joueur
- ✅ **14 scénarios prédéfinis** de Bridge (Ouvertures, Fits, Distributionnelles, Défense, Sans-Atout, Compétitives, Chelem)
- ✅ **Statistiques détaillées** : fits, couleurs longues, mains équilibrées
- ✅ Validation des distributions selon les contraintes complexes
- ✅ Affichage des 4 mains avec leurs statistiques complètes
- ✅ **Gestion de decks** : Sauvegarde, organisation et export de vos donnes

### Interface utilisateur avancée
- ✅ **Navigation par onglets** : Critères avancés / Scénarios prédéfinis / Mes Decks
- ✅ **Formulaire avancé** : Critères de points + minimum de cartes par couleur
- ✅ **Scénarios de Bridge** : Ouverture majeure, fit Pique, barrage, chelem, etc.
- ✅ **Statistiques en temps réel** : Fits détectés, distribution des points N/S vs E/W
- ✅ **Gestion de decks personnalisés** :
  - Créer des decks thématiques (ex: "Donnes d'entraînement", "Chelems difficiles")
  - Sauvegarder les donnes générées avec notes
  - Organiser vos donnes par scenario ou critère
  - Renommer, dupliquer, supprimer des decks
  - Exporter/Importer des decks au format JSON
- ✅ **Interface responsive** adaptée aux écrans mobiles et desktop
- ✅ Affichage stylisé des cartes avec couleurs appropriées (rouge/noir)

## 🛠 Technologies utilisées

- **Vue.js 3** - Framework JavaScript avec Composition API
- **Vite** - Outil de build rapide et serveur de développement
- **CSS Vanilla** - Styles personnalisés sans framework
- **LocalStorage** - Persistance des decks côté client

## 🚀 Installation et démarrage

### Prérequis
- Node.js version 20.19+ ou 22.12+
- npm ou yarn

### Installation
```bash
# Cloner le projet
git clone <url-du-repository>
cd bridge

# Installer les dépendances
npm install
```

### Développement
```bash
# Lancer le serveur de développement
npm run dev
```

L'application sera disponible sur `http://localhost:5173`

### Production
```bash
# Construire pour la production
npm run build

# Prévisualiser la build de production
npm run preview
```

## 📋 Utilisation

### Mode Critères avancés
1. **Onglet "Critères avancés"** : Définissez pour chaque joueur :
   - **Points** : Nombre exact de points HCP souhaités
   - **Distribution** : Minimum de cartes dans chaque couleur (♠ ♥ ♦ ♣)
2. **Distribuer** : Génère une donne respectant tous vos critères
3. **Donne aléatoire** : Distribution complètement aléatoire

### Mode Scénarios prédéfinis
1. **Onglet "Scénarios prédéfinis"** : Sélectionnez parmi 14 scénarios organisés par catégorie :

   **Ouvertures**
   - **Ouverture 1♥ classique** : Nord 13pts + 5♥, Sud 11pts + 3♥
   - **Ouverture mineure forte** : Nord 18pts + 5♣, Sud 8pts + 3♣  
   - **Main équilibrée 1SA** : Nord 15pts équilibré

   **Fits**
   - **Fit à Pique 8 cartes** : Nord 14pts + 5♠, Sud 11pts + 3♠
   - **Fit mineur long** : Nord 16pts + 6♦, Sud 10pts + 4♦

   **Distributionnelles**
   - **Préemptive 3♠** : Nord 8pts + 7♠
   - **Main 7-6-0-0** : Nord 10pts avec 7♠ + 6♥
   - **Main forte unicolore** : Nord 19pts + 7♣

   **Défense**
   - **Contre d'appel** : Nord 12pts + 4♠ + 4♥
   - **Intervention 1♠** : Est 13pts + 5♠

   **Sans-Atout**
   - **3 Sans-Atout classique** : Nord 16pts + Sud 10pts équilibrés

   **Compétitives**
   - **Fit adverse et sacrifice** : Conflit de fits majeurs

   **Chelem**
   - **Recherche de chelem** : Nord 17pts + Sud 16pts (33+ pts)

2. **Générer selon scénario** : Crée une donne correspondant exactement au scénario choisi

### Mode Mes Decks
1. **Onglet "Mes Decks"** : Gérez vos collections de donnes
2. **Créer un deck** : Organisez vos donnes par thème
3. **Sauvegarder une donne** : Depuis l'onglet Critères ou Scénarios, cliquez sur "💾 Sauvegarder cette donne"
4. **Organiser** : Renommer, dupliquer ou supprimer vos decks
5. **Export/Import** :
   - **Exporter un deck** : Format JSON pour partage ou backup
   - **Exporter tous les decks** : Sauvegarde complète
   - **Importer un deck** : Charger un deck depuis un fichier JSON

### Statistiques affichées
- **Points totaux** et répartition N/S vs E/W
- **Fits détectés** (8+ cartes combinées dans une couleur)
- **Couleurs longues** (5+ cartes) 
- **Mains équilibrées** vs déséquilibrées
- **Chicanes et singletons** par camp

### Règles de points
- **As** = 4 points
- **Roi** = 3 points  
- **Dame** = 2 points
- **Valet** = 1 point
- **Autres cartes** = 0 point

Le total des points dans une donne est toujours de **40 points**.

## 🏗 Architecture

### Structure des composants
```
src/
├── components/
│   ├── Card.vue              # Affichage d'une carte individuelle
│   ├── PlayerHand.vue        # Affichage d'une main de joueur (13 cartes)
│   ├── PlayerCriteria.vue    # Formulaire de critères avancés
│   ├── DealStats.vue         # Statistiques de la donne
│   └── DeckManager.vue       # Gestion des decks personnalisés
├── utils/
│   └── deckManager.js        # Module de gestion des decks (localStorage)
├── App.vue                   # Application principale avec logique de distribution
└── style.css                 # Styles CSS personnalisés
```

### Logique de distribution
- Génération d'un jeu de 52 cartes standard
- Mélange aléatoire (algorithme Fisher-Yates)
- Distribution de 13 cartes par joueur
- Vérification des critères de points
- Limitation à 100 000 tentatives pour éviter les boucles infinies
- Persistance des decks via localStorage

## 🎮 Exemple d'utilisation

### Cas d'usage 1 : Générer une donne avec critères
1. **Onglet "Critères avancés"** : Entrez "15" pour les points de Nord et "5" pour les ♠
2. Cliquez sur **"Distribuer"**
3. L'application cherche une distribution où Nord a exactement 15 points et au moins 5 ♠
4. Si trouvée, la donne s'affiche ; sinon, un message d'erreur apparaît

### Cas d'usage 2 : Utiliser un scénario prédéfini
1. **Onglet "Scénarios prédéfinis"** : Cliquez sur "Ouverture 1♥ classique"
2. Cliquez sur **"Générer selon scénario"**
3. Une donne correspondant au scénario (Nord 13pts+5♥, Sud 11pts+3♥) est générée

### Cas d'usage 3 : Sauvegarder et organiser des donnes
1. Générez une donne intéressante (critères ou scénario)
2. Cliquez sur **"💾 Sauvegarder cette donne"**
3. **Créez un nouveau deck** (ex: "Entraînement ouvertures") ou sélectionnez un deck existant
4. Ajoutez des notes optionnelles (ex: "Belle répartition NS")
5. Cliquez sur **"Sauvegarder"**
6. **Onglet "Mes Decks"** : Retrouvez toutes vos donnes organisées par deck
7. **Exportez** vos decks en JSON pour les partager ou les sauvegarder

## 📝 Notes de développement

- Utilise la **Composition API** de Vue 3
- Code entièrement commenté et structuré
- Styles avec **TailwindCSS** pour la cohérence visuelle
- Couleurs de cartes correctes (rouge pour ♥♦, noir pour ♠♣)
- Interface responsive adaptée aux écrans mobiles et desktop
