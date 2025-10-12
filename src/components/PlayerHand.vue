<template>
  <div class="player-hand">
    <!-- En-tête avec nom du joueur et total des points -->
    <div class="player-header">
      <h3 class="player-name">{{ playerName }}</h3>
      <div class="player-points">{{ totalPoints }} pts</div>
    </div>

    <!-- Cartes organisées par couleur -->
    <div class="suits-container">
      <!-- Piques -->
      <div v-if="cardsBySuit.spades.length > 0" class="suit-row">
        <span class="suit-symbol">♠</span>
        <div class="suit-cards">
          <Card
            v-for="card in cardsBySuit.spades"
            :key="`${card.suit}-${card.value}`"
            :suit="card.suit"
            :value="card.value"
          />
        </div>
      </div>

      <!-- Cœurs -->
      <div v-if="cardsBySuit.hearts.length > 0" class="suit-row">
        <span class="suit-symbol" style="color: #dc2626">♥</span>
        <div class="suit-cards">
          <Card
            v-for="card in cardsBySuit.hearts"
            :key="`${card.suit}-${card.value}`"
            :suit="card.suit"
            :value="card.value"
          />
        </div>
      </div>

      <!-- Carreaux -->
      <div v-if="cardsBySuit.diamonds.length > 0" class="suit-row">
        <span class="suit-symbol" style="color: #dc2626">♦</span>
        <div class="suit-cards">
          <Card
            v-for="card in cardsBySuit.diamonds"
            :key="`${card.suit}-${card.value}`"
            :suit="card.suit"
            :value="card.value"
          />
        </div>
      </div>

      <!-- Trèfles -->
      <div v-if="cardsBySuit.clubs.length > 0" class="suit-row">
        <span class="suit-symbol">♣</span>
        <div class="suit-cards">
          <Card
            v-for="card in cardsBySuit.clubs"
            :key="`${card.suit}-${card.value}`"
            :suit="card.suit"
            :value="card.value"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import Card from "./Card.vue";

// Props du composant
const props = defineProps({
  playerName: {
    type: String,
    required: true,
  },
  cards: {
    type: Array,
    required: true,
    default: () => [],
  },
});

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

// Ordre des cartes pour le tri (As en premier, puis K, Q, J, 10, 9, etc.)
const cardOrder = [
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

// Organiser les cartes par couleur et les trier
const cardsBySuit = computed(() => {
  const suits = {
    spades: [],
    hearts: [],
    diamonds: [],
    clubs: [],
  };

  props.cards.forEach((card) => {
    if (suits[card.suit]) {
      suits[card.suit].push(card);
    }
  });

  // Trier chaque couleur selon l'ordre des cartes
  Object.keys(suits).forEach((suit) => {
    suits[suit].sort((a, b) => {
      return cardOrder.indexOf(a.value) - cardOrder.indexOf(b.value);
    });
  });

  return suits;
});

// Calculer le total des points
const totalPoints = computed(() => {
  return props.cards.reduce((total, card) => {
    return total + (cardValues[card.value] || 0);
  }, 0);
});
</script>
