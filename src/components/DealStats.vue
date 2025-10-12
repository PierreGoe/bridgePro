<template>
  <div class="stats-section">
    <h3 class="stats-title">Statistiques de la donne</h3>

    <div class="stats-grid">
      <!-- Points totaux -->
      <div class="stat-item">
        <div class="stat-label">Points totaux</div>
        <div class="stat-value">{{ totalPoints }}/40</div>
      </div>

      <!-- Distribution des points -->
      <div class="stat-item">
        <div class="stat-label">Répartition N/S vs E/W</div>
        <div class="stat-value">{{ nsPoints }} - {{ ewPoints }}</div>
      </div>

      <!-- Fits détectés -->
      <div class="stat-item">
        <div class="stat-label">Fits 8+ cartes</div>
        <div class="stat-value">
          {{ fits.length }} fit{{ fits.length !== 1 ? "s" : "" }}
        </div>
      </div>

      <!-- Longues -->
      <div class="stat-item">
        <div class="stat-label">Couleurs longues (5+)</div>
        <div class="stat-value">{{ longSuits }}</div>
      </div>

      <!-- Mains équilibrées -->
      <div class="stat-item">
        <div class="stat-label">Mains équilibrées</div>
        <div class="stat-value">{{ balancedHands }}/4</div>
      </div>

      <!-- Voids et singletons -->
      <div class="stat-item">
        <div class="stat-label">Chicanes/Singletons</div>
        <div class="stat-value">{{ voids }}/{{ singletons }}</div>
      </div>
    </div>

    <!-- Détail des fits -->
    <div v-if="fits.length > 0" class="fits-detail" style="margin-top: 1rem">
      <h4 style="font-weight: bold; margin-bottom: 0.5rem; color: #333">
        Fits détectés :
      </h4>
      <div
        v-for="fit in fits"
        :key="fit.suit"
        style="margin-bottom: 0.25rem; color: #666; font-size: 0.875rem"
      >
        <span
          :style="{
            color:
              fit.suit === 'hearts' || fit.suit === 'diamonds'
                ? '#dc2626'
                : '#333',
          }"
        >
          {{ getSuitSymbol(fit.suit) }}
        </span>
        {{ fit.partnership }} : {{ fit.cards }} cartes ({{
          fit.player1Cards
        }}+{{ fit.player2Cards }})
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

// Props
const props = defineProps({
  deal: {
    type: Object,
    required: true,
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

// Symboles des couleurs
const suitSymbols = {
  spades: "♠",
  hearts: "♥",
  diamonds: "♦",
  clubs: "♣",
};

// Calculer les points d'une main
const calculatePoints = (cards) => {
  return cards.reduce(
    (total, card) => total + (cardValues[card.value] || 0),
    0
  );
};

// Calculer la distribution d'une main par couleur
const getDistribution = (cards) => {
  const distribution = { spades: 0, hearts: 0, diamonds: 0, clubs: 0 };
  cards.forEach((card) => {
    distribution[card.suit]++;
  });
  return distribution;
};

// Points totaux
const totalPoints = computed(() => {
  return Object.values(props.deal).reduce((total, hand) => {
    return total + calculatePoints(hand);
  }, 0);
});

// Points Nord-Sud vs Est-Ouest
const nsPoints = computed(() => {
  return calculatePoints(props.deal.north) + calculatePoints(props.deal.south);
});

const ewPoints = computed(() => {
  return calculatePoints(props.deal.east) + calculatePoints(props.deal.west);
});

// Détection des fits (8+ cartes combinées dans une couleur)
const fits = computed(() => {
  const partnerships = [
    { name: "Nord-Sud", player1: "north", player2: "south" },
    { name: "Est-Ouest", player1: "east", player2: "west" },
  ];

  const detectedFits = [];

  partnerships.forEach((partnership) => {
    const dist1 = getDistribution(props.deal[partnership.player1]);
    const dist2 = getDistribution(props.deal[partnership.player2]);

    Object.keys(dist1).forEach((suit) => {
      const combined = dist1[suit] + dist2[suit];
      if (combined >= 8) {
        detectedFits.push({
          partnership: partnership.name,
          suit: suit,
          cards: combined,
          player1Cards: dist1[suit],
          player2Cards: dist2[suit],
        });
      }
    });
  });

  return detectedFits;
});

// Couleurs longues (5+ cartes)
const longSuits = computed(() => {
  let count = 0;
  Object.values(props.deal).forEach((hand) => {
    const distribution = getDistribution(hand);
    Object.values(distribution).forEach((suitLength) => {
      if (suitLength >= 5) count++;
    });
  });
  return count;
});

// Mains équilibrées (4-3-3-3 ou 4-4-3-2)
const balancedHands = computed(() => {
  let count = 0;
  Object.values(props.deal).forEach((hand) => {
    const distribution = getDistribution(hand);
    const lengths = Object.values(distribution).sort((a, b) => b - a);

    // 4-3-3-3 ou 4-4-3-2
    if (
      (lengths[0] === 4 &&
        lengths[1] === 3 &&
        lengths[2] === 3 &&
        lengths[3] === 3) ||
      (lengths[0] === 4 &&
        lengths[1] === 4 &&
        lengths[2] === 3 &&
        lengths[3] === 2)
    ) {
      count++;
    }
  });
  return count;
});

// Chicanes (0 cartes) et singletons (1 carte)
const voids = computed(() => {
  let count = 0;
  Object.values(props.deal).forEach((hand) => {
    const distribution = getDistribution(hand);
    Object.values(distribution).forEach((suitLength) => {
      if (suitLength === 0) count++;
    });
  });
  return count;
});

const singletons = computed(() => {
  let count = 0;
  Object.values(props.deal).forEach((hand) => {
    const distribution = getDistribution(hand);
    Object.values(distribution).forEach((suitLength) => {
      if (suitLength === 1) count++;
    });
  });
  return count;
});

// Méthode pour obtenir le symbole de la couleur
const getSuitSymbol = (suit) => {
  return suitSymbols[suit] || suit;
};
</script>
