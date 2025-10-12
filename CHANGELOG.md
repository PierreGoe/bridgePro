# Changelog - Bridge Dealer Pro

## Version 2.0 - Deck Management (2024-01-15)

### ✨ Nouvelles fonctionnalités
- **Gestion de decks personnalisés** :
  - Créer des decks thématiques pour organiser vos donnes
  - Sauvegarder les donnes générées avec métadonnées (scénario, critères, notes)
  - Renommer, dupliquer et supprimer des decks
  - Visualisation des donnes sauvegardées avec toutes les mains
  - Suppression individuelle de donnes dans un deck
  
- **Export/Import JSON** :
  - Exporter un deck individuel au format JSON
  - Exporter tous les decks en une seule fois
  - Importer un deck depuis un fichier JSON
  - Format JSON documenté pour partage et backup
  
- **Navigation par onglets améliorée** :
  - Nouvel onglet "Mes Decks" pour gérer vos collections
  - Bouton "Sauvegarder cette donne" sur les donnes générées
  - Modal de sélection/création de deck lors de la sauvegarde

### 🛠 Améliorations techniques
- Module `deckManager.js` pour la logique de persistance (localStorage)
- Composant `DeckManager.vue` avec interface complète
- Styles CSS pour les decks, modals et formulaires
- Gestion des conflits de noms de fonctions (createCardDeck vs createDeck)

### 📦 Structure
```
src/
├── components/
│   ├── DeckManager.vue       # Nouveau composant
├── utils/
│   └── deckManager.js        # Nouveau module
└── App.vue                   # Intégration deck management
```

---

## Version 1.5 - Scénarios professionnels (2024-01-14)

### ✨ Nouvelles fonctionnalités
- **14 scénarios de Bridge professionnels** organisés en 7 catégories :
  - Ouvertures (3 scénarios)
  - Fits (2 scénarios)
  - Distributionnelles (3 scénarios)
  - Défense (2 scénarios)
  - Sans-Atout (1 scénario)
  - Compétitives (1 scénario)
  - Chelem (2 scénarios)

- **Composant DealStats** :
  - Détection de fits (8+ cartes combinées)
  - Couleurs longues (5+ cartes)
  - Mains équilibrées
  - Chicanes et singletons
  - Répartition des points N/S vs E/W

### 🎨 Interface
- Navigation par onglets (Critères / Scénarios)
- Cartes scénarios avec sélection visuelle
- Groupement par catégorie
- Statistiques en temps réel

---

## Version 1.0 - Critères avancés (2024-01-13)

### ✨ Fonctionnalités principales
- Distribution automatique de 52 cartes
- Calcul automatique des points HCP (A=4, K=3, Q=2, J=1)
- **Critères avancés** : Points ET distribution par couleur
- Composant `PlayerCriteria.vue` pour la saisie
- Validation des distributions complexes
- Limitation à 100 000 tentatives

### 🎨 Interface
- Suppression de TailwindCSS
- CSS vanilla personnalisé (~400 lignes)
- Couleurs de cartes appropriées (rouge/noir)
- Design responsive

### 🛠 Technologies
- Vue.js 3 avec Composition API
- Vite 7.1.9
- CSS Vanilla

---

## Version 0.1 - Prototype initial

### ✨ Fonctionnalités de base
- Distribution aléatoire de cartes
- Critères simples de points par joueur
- Affichage des 4 mains
- TailwindCSS pour le styling
