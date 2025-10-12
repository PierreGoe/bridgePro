<template>
  <div id="app">
    <!-- En-tête de l'application -->
    <header class="header">
      <div class="container">
        <h1>Bridge Dealer Pro</h1>
        <p>
          Générateur de donnes de Bridge avec critères avancés de points et de
          distribution
        </p>
      </div>
    </header>

    <!-- Contenu principal -->
    <main class="main">
      <div class="container">
        <!-- Navigation par onglets -->
        <div class="form-section">
          <div class="tabs">
            <button
              :class="['tab-button', { active: activeTab === 'criteria' }]"
              @click="activeTab = 'criteria'"
            >
              Critères avancés
            </button>
            <button
              :class="['tab-button', { active: activeTab === 'scenarios' }]"
              @click="activeTab = 'scenarios'"
            >
              Scénarios prédéfinis
            </button>
            <button
              :class="['tab-button', { active: activeTab === 'decks' }]"
              @click="activeTab = 'decks'"
            >
              Mes Decks
            </button>
          </div>

          <!-- Onglet Critères avancés -->
          <div v-if="activeTab === 'criteria'">
            <h2 class="form-title">Critères de points et de distribution</h2>

            <!-- Instructions d'utilisation -->
            <div class="instructions-box">
              <h3>📖 Comment utiliser les critères avancés</h3>
              <ol>
                <li>
                  <strong>Points HCP</strong> : Indiquez le nombre exact de
                  points pour chaque joueur (As=4, Roi=3, Dame=2, Valet=1)
                </li>
                <li>
                  <strong>Distribution par couleur</strong> : Définissez le
                  nombre minimum de cartes dans chaque couleur (♠ ♥ ♦ ♣)
                </li>
                <li>
                  <strong>Laissez vide</strong> les cases pour lesquelles vous
                  n'avez pas de contrainte
                </li>
                <li>
                  Cliquez sur <strong>"Distribuer"</strong> pour générer une
                  donne respectant vos critères
                </li>
                <li>
                  💡 <em>Astuce</em> : Plus les critères sont restrictifs, plus
                  la génération peut prendre du temps
                </li>
              </ol>
            </div>

            <div class="player-criteria">
              <PlayerCriteria
                player-name="Nord"
                :criteria="advancedCriteria.north"
                @update:criteria="
                  (newCriteria) => (advancedCriteria.north = newCriteria)
                "
              />
              <PlayerCriteria
                player-name="Sud"
                :criteria="advancedCriteria.south"
                @update:criteria="
                  (newCriteria) => (advancedCriteria.south = newCriteria)
                "
              />
              <PlayerCriteria
                player-name="Est"
                :criteria="advancedCriteria.east"
                @update:criteria="
                  (newCriteria) => (advancedCriteria.east = newCriteria)
                "
              />
              <PlayerCriteria
                player-name="Ouest"
                :criteria="advancedCriteria.west"
                @update:criteria="
                  (newCriteria) => (advancedCriteria.west = newCriteria)
                "
              />
            </div>
          </div>

          <!-- Onglet Scénarios prédéfinis -->
          <div v-if="activeTab === 'scenarios'" class="scenarios-section">
            <h2 class="form-title">Scénarios de Bridge courants</h2>

            <!-- Instructions d'utilisation -->
            <div class="instructions-box">
              <h3>📖 Comment utiliser les scénarios prédéfinis</h3>
              <ol>
                <li>
                  <strong>Parcourez</strong> les 14 scénarios organisés en 7
                  catégories (Ouvertures, Fits, Distributionnelles, etc.)
                </li>
                <li>
                  <strong>Cliquez</strong> sur un scénario pour le sélectionner
                  (il apparaîtra en surbrillance)
                </li>
                <li>
                  Cliquez sur <strong>"Générer selon scénario"</strong> pour
                  créer une donne correspondante
                </li>
                <li>
                  💡 <em>Astuce</em> : Les scénarios sont conçus pour
                  l'entraînement et l'apprentissage du Bridge
                </li>
              </ol>
            </div>

            <div class="scenario-categories">
              <div
                v-for="(scenarios, category) in scenariosByCategory"
                :key="category"
              >
                <h3 class="category-title">{{ category }}</h3>
                <div class="scenario-grid">
                  <div
                    v-for="scenario in scenarios"
                    :key="scenario.id"
                    :class="[
                      'scenario-card',
                      { selected: selectedScenario?.id === scenario.id },
                    ]"
                    @click="selectScenario(scenario)"
                  >
                    <div class="scenario-name">{{ scenario.name }}</div>
                    <div class="scenario-description">
                      {{ scenario.description }}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button
              v-if="selectedScenario"
              @click="clearScenario"
              class="button"
              style="
                background-color: #6b7280;
                color: white;
                margin-bottom: 1rem;
              "
            >
              Désélectionner le scénario
            </button>
          </div>

          <!-- Onglet Mes Decks -->
          <div v-if="activeTab === 'decks'">
            <DeckManager />
          </div>

          <div v-if="activeTab !== 'decks'" class="button-group">
            <button
              @click="distributeCards"
              :disabled="isDistributing"
              class="button button-primary"
            >
              {{
                isDistributing
                  ? "Distribution en cours..."
                  : selectedScenario
                  ? "Générer selon scénario"
                  : "Distribuer"
              }}
            </button>

            <button
              @click="generateRandomDeal"
              :disabled="isDistributing"
              class="button button-secondary"
            >
              Nouvelle donne aléatoire
            </button>

            <div v-if="activeCriteriaCount > 0" class="criteria-info">
              {{ activeCriteriaCount }} critère{{
                activeCriteriaCount > 1 ? "s" : ""
              }}
              actif{{ activeCriteriaCount > 1 ? "s" : "" }}
            </div>
          </div>

          <!-- Barre de progression -->
          <div v-if="isDistributing" class="progress-container">
            <div class="progress-header">
              <span class="progress-label">
                🎲 Recherche d'une donne valide...
              </span>
              <button @click="cancelDistribution" class="btn-cancel">
                ❌ Annuler
              </button>
            </div>
            <div class="progress-bar-wrapper">
              <div class="progress-bar" :style="{ width: progressPercentage + '%' }"></div>
            </div>
            <div class="progress-info">
              <span>{{ attempts }} / {{ maxAttempts }} tentatives</span>
              <span>{{ progressPercentage }}%</span>
            </div>
          </div>
        </div>

        <!-- Messages d'erreur ou de succès -->
        <div v-if="message">
          <div :class="messageClasses" class="message">
            {{ message }}
          </div>
        </div>

        <!-- Message d'aide initial -->
        <div v-if="!currentDeal && activeTab !== 'decks'" class="welcome-box">
          <h3>👋 Bienvenue dans Bridge Dealer Pro</h3>
          <p>
            Commencez par définir vos critères ou choisir un scénario, puis
            cliquez sur le bouton pour générer votre première donne !
          </p>
        </div>

        <!-- Statistiques de la donne -->
        <DealStats v-if="currentDeal" :deal="currentDeal" />

        <!-- Affichage des mains -->
        <div v-if="currentDeal" class="deal-section">
          <div class="text-center">
            <h3>Donne actuelle (Total: {{ totalPoints }} points)</h3>
            <p class="help-text">
              💡 Vous aimez cette donne ? Sauvegardez-la dans un deck pour la
              retrouver plus tard !
            </p>
            <button
              @click="showSaveModal = true"
              class="button button-secondary"
              style="margin-top: 1rem"
            >
              💾 Sauvegarder cette donne
            </button>
          </div>

          <!-- Disposition classique du Bridge : Nord en haut, Sud en bas, Est à droite, Ouest à gauche -->
          <div class="deal-layout">
            <!-- Ouest -->
            <div class="deal-column">
              <PlayerHand player-name="Ouest" :cards="currentDeal.west" />
            </div>

            <!-- Nord et Sud (colonne centrale) -->
            <div class="deal-column">
              <PlayerHand player-name="Nord" :cards="currentDeal.north" />
              <PlayerHand player-name="Sud" :cards="currentDeal.south" />
            </div>

            <!-- Est -->
            <div class="deal-column">
              <PlayerHand player-name="Est" :cards="currentDeal.east" />
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Modal de sauvegarde de donne -->
    <div
      v-if="showSaveModal"
      class="modal-overlay"
      @click="showSaveModal = false"
    >
      <div class="modal-content" @click.stop>
        <h3>Sauvegarder la donne</h3>
        <div class="form-group">
          <label>Sélectionner un deck</label>
          <select v-model="selectedDeckId" class="deck-select">
            <option :value="null">-- Choisir un deck --</option>
            <option
              v-for="deck in availableDecks"
              :key="deck.id"
              :value="deck.id"
            >
              {{ deck.name }} ({{ deck.hands.length }} donne(s))
            </option>
          </select>
          <button
            @click="showCreateNewDeckInModal = true"
            class="btn-link"
            style="margin-top: 0.5rem"
          >
            ➕ Créer un nouveau deck
          </button>
        </div>
        <div class="form-group">
          <label>Notes (optionnelles)</label>
          <textarea
            v-model="saveNotes"
            placeholder="Ex: Belle répartition avec fit majeur"
          ></textarea>
        </div>
        <div class="modal-actions">
          <button
            @click="saveDealToDeck"
            class="btn-primary"
            :disabled="!selectedDeckId"
          >
            Sauvegarder
          </button>
          <button @click="showSaveModal = false" class="btn-secondary">
            Annuler
          </button>
        </div>
      </div>
    </div>

    <!-- Mini-modal pour créer un deck depuis la modal de sauvegarde -->
    <div
      v-if="showCreateNewDeckInModal"
      class="modal-overlay"
      @click="showCreateNewDeckInModal = false"
    >
      <div class="modal-content" @click.stop>
        <h3>Créer un nouveau deck</h3>
        <div class="form-group">
          <label>Nom du deck</label>
          <input
            v-model="newDeckNameInModal"
            type="text"
            placeholder="Ex: Donnes intéressantes"
            @keyup.enter="createDeckFromModal"
          />
        </div>
        <div class="modal-actions">
          <button
            @click="createDeckFromModal"
            class="btn-primary"
            :disabled="!newDeckNameInModal.trim()"
          >
            Créer
          </button>
          <button
            @click="showCreateNewDeckInModal = false"
            class="btn-secondary"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import PlayerHand from "./components/PlayerHand.vue";
import PlayerCriteria from "./components/PlayerCriteria.vue";
import DealStats from "./components/DealStats.vue";
import DeckManager from "./components/DeckManager.vue";
import { addHandToDeck, loadDecks, createDeck } from "./utils/deckManager.js";

// État de l'application
const activeTab = ref("criteria");
const currentDeal = ref(null);
const message = ref("");
const isDistributing = ref(false);
const selectedScenario = ref(null);

// Variables pour la barre de progression
const attempts = ref(0);
const maxAttempts = ref(10000000);
const progressPercentage = ref(0);
let shouldCancelDistribution = false;

// Gestion des decks
const showSaveModal = ref(false);
const showCreateNewDeckInModal = ref(false);
const selectedDeckId = ref(null);
const saveNotes = ref("");
const newDeckNameInModal = ref("");
const availableDecks = ref([]);

// Critères avancés (anciens critères simples + distribution)
const advancedCriteria = ref({
  north: {
    points: null,
    spades: null,
    hearts: null,
    diamonds: null,
    clubs: null,
  },
  south: {
    points: null,
    spades: null,
    hearts: null,
    diamonds: null,
    clubs: null,
  },
  east: {
    points: null,
    spades: null,
    hearts: null,
    diamonds: null,
    clubs: null,
  },
  west: {
    points: null,
    spades: null,
    hearts: null,
    diamonds: null,
    clubs: null,
  },
});

// Scénarios prédéfinis enrichis avec toutes les catégories
const predefinedScenarios = ref([
  // OUVERTURES
  {
    id: "opening-1h-classic",
    name: "Ouverture 1♥ classique",
    category: "Ouvertures",
    description: "Nord 13 pts avec 5+♥, Sud 11 pts avec 3+♥ pour fit à Cœur",
    criteria: {
      north: {
        points: 13,
        hearts: 5,
        spades: null,
        diamonds: null,
        clubs: null,
      },
      south: {
        points: 11,
        hearts: 3,
        spades: null,
        diamonds: null,
        clubs: null,
      },
      east: {
        points: null,
        spades: null,
        hearts: null,
        diamonds: null,
        clubs: null,
      },
      west: {
        points: null,
        spades: null,
        hearts: null,
        diamonds: null,
        clubs: null,
      },
    },
  },
  {
    id: "strong-minor",
    name: "Ouverture mineure forte",
    category: "Ouvertures",
    description: "Nord 18 pts avec 5+♣, Sud 8 pts avec 3+♣ pour fit mineur",
    criteria: {
      north: {
        points: 18,
        clubs: 5,
        spades: null,
        hearts: null,
        diamonds: null,
      },
      south: {
        points: 8,
        clubs: 3,
        spades: null,
        hearts: null,
        diamonds: null,
      },
      east: {
        points: null,
        spades: null,
        hearts: null,
        diamonds: null,
        clubs: null,
      },
      west: {
        points: null,
        spades: null,
        hearts: null,
        diamonds: null,
        clubs: null,
      },
    },
  },
  {
    id: "balanced-1nt",
    name: "Main équilibrée 1SA",
    category: "Ouvertures",
    description: "Nord 15 pts équilibré pour ouverture 1SA classique",
    criteria: {
      north: {
        points: 15,
        spades: null,
        hearts: null,
        diamonds: null,
        clubs: null,
      },
      south: {
        points: 10,
        spades: null,
        hearts: null,
        diamonds: null,
        clubs: null,
      },
      east: {
        points: null,
        spades: null,
        hearts: null,
        diamonds: null,
        clubs: null,
      },
      west: {
        points: null,
        spades: null,
        hearts: null,
        diamonds: null,
        clubs: null,
      },
    },
  },

  // FITS
  {
    id: "spade-fit-8",
    name: "Fit à Pique 8 cartes",
    category: "Fits",
    description:
      "Nord 14 pts + 5♠, Sud 11 pts + 3♠ pour manche 4♠ (25 pts combinés)",
    criteria: {
      north: {
        points: 14,
        spades: 5,
        hearts: null,
        diamonds: null,
        clubs: null,
      },
      south: {
        points: 11,
        spades: 3,
        hearts: null,
        diamonds: null,
        clubs: null,
      },
      east: {
        points: null,
        spades: null,
        hearts: null,
        diamonds: null,
        clubs: null,
      },
      west: {
        points: null,
        spades: null,
        hearts: null,
        diamonds: null,
        clubs: null,
      },
    },
  },
  {
    id: "minor-fit-long",
    name: "Fit mineur long",
    category: "Fits",
    description: "Nord 16 pts + 6♦, Sud 10 pts + 4♦ pour fit mineur solide",
    criteria: {
      north: {
        points: 16,
        diamonds: 6,
        spades: null,
        hearts: null,
        clubs: null,
      },
      south: {
        points: 10,
        diamonds: 4,
        spades: null,
        hearts: null,
        clubs: null,
      },
      east: {
        points: null,
        spades: null,
        hearts: null,
        diamonds: null,
        clubs: null,
      },
      west: {
        points: null,
        spades: null,
        hearts: null,
        diamonds: null,
        clubs: null,
      },
    },
  },

  // DISTRIBUTIONNELLES
  {
    id: "preempt-3s",
    name: "Préemptive 3♠",
    category: "Distributionnelles",
    description: "Nord 8 pts avec 7+♠ pour ouverture préemptive",
    criteria: {
      north: {
        points: 8,
        spades: 7,
        hearts: null,
        diamonds: null,
        clubs: null,
      },
      south: {
        points: 11,
        spades: 2,
        hearts: null,
        diamonds: null,
        clubs: null,
      },
      east: {
        points: null,
        spades: null,
        hearts: null,
        diamonds: null,
        clubs: null,
      },
      west: {
        points: null,
        spades: null,
        hearts: null,
        diamonds: null,
        clubs: null,
      },
    },
  },
  {
    id: "highly-distributional",
    name: "Main 7-6-0-0",
    category: "Distributionnelles",
    description:
      "Nord 10 pts avec 7♠ + 6♥ pour main hautement distributionnelle",
    criteria: {
      north: { points: 10, spades: 7, hearts: 6, diamonds: null, clubs: null },
      south: {
        points: 12,
        spades: null,
        hearts: null,
        diamonds: null,
        clubs: null,
      },
      east: {
        points: null,
        spades: null,
        hearts: null,
        diamonds: null,
        clubs: null,
      },
      west: {
        points: null,
        spades: null,
        hearts: null,
        diamonds: null,
        clubs: null,
      },
    },
  },
  {
    id: "strong-unicolor",
    name: "Main forte unicolore",
    category: "Distributionnelles",
    description: "Nord 19 pts avec 7+♣ pour main unicolore forte",
    criteria: {
      north: {
        points: 19,
        clubs: 7,
        spades: null,
        hearts: null,
        diamonds: null,
      },
      south: {
        points: 8,
        spades: null,
        hearts: null,
        diamonds: null,
        clubs: null,
      },
      east: {
        points: null,
        spades: null,
        hearts: null,
        diamonds: null,
        clubs: null,
      },
      west: {
        points: null,
        spades: null,
        hearts: null,
        diamonds: null,
        clubs: null,
      },
    },
  },

  // DÉFENSE
  {
    id: "takeout-double",
    name: "Contre d'appel",
    category: "Défense",
    description:
      "Nord 12 pts avec 4♠ + 4♥ pour contre d'appel après ouverture adverse",
    criteria: {
      north: { points: 12, spades: 4, hearts: 4, diamonds: null, clubs: null },
      south: {
        points: 8,
        spades: 4,
        hearts: null,
        diamonds: null,
        clubs: null,
      },
      east: {
        points: null,
        spades: null,
        hearts: null,
        diamonds: null,
        clubs: null,
      },
      west: {
        points: null,
        spades: null,
        hearts: null,
        diamonds: null,
        clubs: null,
      },
    },
  },
  {
    id: "overcall-1s",
    name: "Intervention 1♠",
    category: "Défense",
    description:
      "Est 13 pts + 5♠ intervient à 1♠ avec soutien Ouest 10 pts + 3♠",
    criteria: {
      north: {
        points: null,
        spades: null,
        hearts: null,
        diamonds: null,
        clubs: null,
      },
      south: {
        points: null,
        spades: null,
        hearts: null,
        diamonds: null,
        clubs: null,
      },
      east: {
        points: 13,
        spades: 5,
        hearts: null,
        diamonds: null,
        clubs: null,
      },
      west: {
        points: 10,
        spades: 3,
        hearts: null,
        diamonds: null,
        clubs: null,
      },
    },
  },

  // SANS-ATOUT
  {
    id: "nt-3nt-classic",
    name: "3 Sans-Atout classique",
    category: "Sans-Atout",
    description:
      "Nord 16 pts + Sud 10 pts équilibrés pour 3SA (26 pts combinés)",
    criteria: {
      north: {
        points: 16,
        spades: null,
        hearts: null,
        diamonds: null,
        clubs: null,
      },
      south: {
        points: 10,
        spades: null,
        hearts: null,
        diamonds: null,
        clubs: null,
      },
      east: {
        points: null,
        spades: null,
        hearts: null,
        diamonds: null,
        clubs: null,
      },
      west: {
        points: null,
        spades: null,
        hearts: null,
        diamonds: null,
        clubs: null,
      },
    },
  },

  // COMPÉTITIVES
  {
    id: "competitive-fit",
    name: "Fit adverse et sacrifice",
    category: "Compétitives",
    description:
      "Nord 12 pts + 5♥, Sud 9 pts + 5♠ pour conflit de fits majeurs",
    criteria: {
      north: {
        points: 12,
        hearts: 5,
        spades: null,
        diamonds: null,
        clubs: null,
      },
      south: {
        points: 9,
        spades: 5,
        hearts: null,
        diamonds: null,
        clubs: null,
      },
      east: {
        points: null,
        spades: null,
        hearts: null,
        diamonds: null,
        clubs: null,
      },
      west: {
        points: null,
        spades: null,
        hearts: null,
        diamonds: null,
        clubs: null,
      },
    },
  },

  // CHELEM
  {
    id: "slam-try",
    name: "Recherche de chelem",
    category: "Chelem",
    description:
      "Nord 17 pts + Sud 16 pts (33+ pts combinés) en vue d'un chelem",
    criteria: {
      north: {
        points: 17,
        spades: null,
        hearts: null,
        diamonds: null,
        clubs: null,
      },
      south: {
        points: 16,
        spades: null,
        hearts: null,
        diamonds: null,
        clubs: null,
      },
      east: {
        points: null,
        spades: null,
        hearts: null,
        diamonds: null,
        clubs: null,
      },
      west: {
        points: null,
        spades: null,
        hearts: null,
        diamonds: null,
        clubs: null,
      },
    },
  },
]);

// Jeu de cartes complet
const createCardDeck = () => {
  const suits = ["spades", "hearts", "diamonds", "clubs"];
  const values = [
    "A",
    "K",
    "Q",
    "J",
    "10",
    "9",
    "8",
    "7",
    "6",
    "5",
    "4",
    "3",
    "2",
  ];
  const deck = [];

  suits.forEach((suit) => {
    values.forEach((value) => {
      deck.push({ suit, value });
    });
  });

  return deck;
};

// Valeurs des cartes pour le calcul des points
const cardValues = {
  A: 4,
  K: 3,
  Q: 2,
  J: 1,
  10: 0,
  9: 0,
  8: 0,
  7: 0,
  6: 0,
  5: 0,
  4: 0,
  3: 0,
  2: 0,
};

// Calculer les points d'une main
const calculatePoints = (cards) => {
  return cards.reduce((total, card) => {
    return total + (cardValues[card.value] || 0);
  }, 0);
};

// Mélanger un tableau (algorithme Fisher-Yates)
const shuffle = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Distribuer les cartes de manière aléatoire
const randomDistribution = () => {
  const deck = shuffle(createCardDeck());

  return {
    north: deck.slice(0, 13),
    south: deck.slice(13, 26),
    east: deck.slice(26, 39),
    west: deck.slice(39, 52),
  };
};

// Calculer la distribution d'une main par couleur
const getHandDistribution = (cards) => {
  const distribution = { spades: 0, hearts: 0, diamonds: 0, clubs: 0 };
  cards.forEach((card) => {
    distribution[card.suit]++;
  });
  return distribution;
};

// Vérifier si une distribution respecte les critères avancés
const checkAdvancedCriteria = (deal) => {
  const players = ["north", "south", "east", "west"];

  for (const player of players) {
    const playerCriteria = selectedScenario.value
      ? selectedScenario.value.criteria[player]
      : advancedCriteria.value[player];

    // Vérifier les critères de points
    if (playerCriteria.points !== null && playerCriteria.points !== "") {
      const points = calculatePoints(deal[player]);
      if (points !== playerCriteria.points) {
        return false;
      }
    }

    // Vérifier les critères de distribution
    const distribution = getHandDistribution(deal[player]);
    const suits = ["spades", "hearts", "diamonds", "clubs"];

    for (const suit of suits) {
      if (playerCriteria[suit] !== null && playerCriteria[suit] !== "") {
        if (distribution[suit] < playerCriteria[suit]) {
          return false;
        }
      }
    }
  }

  return true;
};

// Distribuer les cartes selon les critères
const distributeCards = async () => {
  if (isDistributing.value) return;

  isDistributing.value = true;
  message.value = "";
  shouldCancelDistribution = false;
  attempts.value = 0;
  progressPercentage.value = 0;

  // Vérifier que le total des critères de points ne dépasse pas 40
  const totalPointsCriteria = getTotalPointsCriteria();
  if (totalPointsCriteria > 40) {
    message.value =
      "Le total des critères de points ne peut pas dépasser 40 points.";
    isDistributing.value = false;
    return;
  }

  try {
    maxAttempts.value = 10000000; // Limiter les tentatives pour éviter les boucles infinies
    let validDeal = null;

    while (attempts.value < maxAttempts.value && !validDeal && !shouldCancelDistribution) {
      const deal = randomDistribution();
      if (checkAdvancedCriteria(deal)) {
        validDeal = deal;
        break;
      }
      attempts.value++;
      
      // Mettre à jour la barre de progression
      progressPercentage.value = Math.round((attempts.value / maxAttempts.value) * 100);

      // Permettre à l'interface de se rafraîchir toutes les 1000 tentatives
      if (attempts.value % 1000 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 1));
      }
    }

    if (shouldCancelDistribution) {
      message.value = "⚠️ Distribution annulée par l'utilisateur.";
      attempts.value = 0;
      progressPercentage.value = 0;
    } else if (validDeal) {
      currentDeal.value = validDeal;
      const scenarioText = selectedScenario.value
        ? ` pour le scénario "${selectedScenario.value.name}"`
        : "";
      message.value = `✅ Donne trouvée en ${attempts.value + 1} tentative${
        attempts.value > 0 ? "s" : ""
      }${scenarioText}.`;
      attempts.value = 0;
      progressPercentage.value = 0;
    } else {
      const scenarioText = selectedScenario.value
        ? ` pour le scénario "${selectedScenario.value.name}"`
        : "";
      message.value = `❌ Impossible de trouver une distribution respectant les critères${scenarioText} après ${maxAttempts.value} tentatives. Essayez des critères moins restrictifs.`;
      attempts.value = 0;
      progressPercentage.value = 0;
    }
  } catch (error) {
    message.value = "❌ Erreur lors de la distribution des cartes.";
    attempts.value = 0;
    progressPercentage.value = 0;
  }

  isDistributing.value = false;
};

// Annuler la distribution en cours
const cancelDistribution = () => {
  shouldCancelDistribution = true;
};

// Générer une donne aléatoire sans critères
const generateRandomDeal = () => {
  if (isDistributing.value) return;

  currentDeal.value = randomDistribution();
  message.value = "Nouvelle donne aléatoire générée.";
};

// Méthodes pour les scénarios
const selectScenario = (scenario) => {
  selectedScenario.value = scenario;
  // Appliquer les critères du scénario
  advancedCriteria.value = JSON.parse(JSON.stringify(scenario.criteria));
};

const clearScenario = () => {
  selectedScenario.value = null;
};

// Calculer le total des critères de points
const getTotalPointsCriteria = () => {
  const criteriaToUse = selectedScenario.value
    ? selectedScenario.value.criteria
    : advancedCriteria.value;

  return Object.values(criteriaToUse).reduce((total, playerCriteria) => {
    return total + (playerCriteria.points || 0);
  }, 0);
};

// Calculés
const activeCriteriaCount = computed(() => {
  const criteriaToUse = selectedScenario.value
    ? selectedScenario.value.criteria
    : advancedCriteria.value;

  let count = 0;
  Object.values(criteriaToUse).forEach((playerCriteria) => {
    if (playerCriteria.points !== null && playerCriteria.points !== "") count++;
    if (playerCriteria.spades !== null && playerCriteria.spades !== "") count++;
    if (playerCriteria.hearts !== null && playerCriteria.hearts !== "") count++;
    if (playerCriteria.diamonds !== null && playerCriteria.diamonds !== "")
      count++;
    if (playerCriteria.clubs !== null && playerCriteria.clubs !== "") count++;
  });

  return count;
});

// Grouper les scénarios par catégorie
const scenariosByCategory = computed(() => {
  const categories = {};
  predefinedScenarios.value.forEach((scenario) => {
    const category = scenario.category || "Autres";
    if (!categories[category]) {
      categories[category] = [];
    }
    categories[category].push(scenario);
  });
  return categories;
});

const totalPoints = computed(() => {
  if (!currentDeal.value) return 0;

  return ["north", "south", "east", "west"].reduce((total, player) => {
    return total + calculatePoints(currentDeal.value[player]);
  }, 0);
});

const messageClasses = computed(() => {
  if (
    message.value.includes("Impossible") ||
    message.value.includes("Erreur")
  ) {
    return "message-error";
  } else {
    return "message-success";
  }
});

// Fonctions de gestion des decks
const loadAvailableDecks = () => {
  availableDecks.value = loadDecks();
};

const saveDealToDeck = () => {
  if (!selectedDeckId.value || !currentDeal.value) return;

  const metadata = {
    scenario: selectedScenario.value,
    criteria: advancedCriteria.value,
    notes: saveNotes.value,
  };

  const success = addHandToDeck(
    selectedDeckId.value,
    currentDeal.value,
    metadata
  );

  if (success) {
    message.value = "✅ Donne sauvegardée avec succès !";
    showSaveModal.value = false;
    selectedDeckId.value = null;
    saveNotes.value = "";
    loadAvailableDecks();
  } else {
    message.value = "❌ Erreur lors de la sauvegarde de la donne";
  }
};

const createDeckFromModal = () => {
  if (!newDeckNameInModal.value.trim()) return;

  const newDeck = createDeck(newDeckNameInModal.value.trim());

  if (newDeck) {
    loadAvailableDecks();
    selectedDeckId.value = newDeck.id;
    showCreateNewDeckInModal.value = false;
    newDeckNameInModal.value = "";
  }
};

// Charger les decks au démarrage
loadAvailableDecks();

// Ne pas générer de donne au démarrage pour afficher le message de bienvenue
// L'utilisateur peut cliquer sur "Nouvelle donne aléatoire" ou "Distribuer"
</script>
