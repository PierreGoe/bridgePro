<template>
  <div :class="cardClasses" class="card">
    <div class="card-value">{{ displayValue }}</div>
    <div class="card-suit">{{ suitSymbol }}</div>
  </div>
</template>

<script setup>
import { computed } from "vue";

// Props du composant
const props = defineProps({
  suit: {
    type: String,
    required: true,
    validator: (value) =>
      ["spades", "hearts", "diamonds", "clubs"].includes(value),
  },
  value: {
    type: String,
    required: true,
    validator: (value) =>
      [
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
      ].includes(value),
  },
});

// Symboles des couleurs
const suitSymbols = {
  spades: "♠",
  hearts: "♥",
  diamonds: "♦",
  clubs: "♣",
};

// Couleurs des cartes (rouge ou noir)
const isRedSuit = computed(() => {
  return props.suit === "hearts" || props.suit === "diamonds";
});

// Classes CSS pour la carte
const cardClasses = computed(() => {
  return isRedSuit.value ? "card-red" : "card-black";
});

// Symbole de la couleur
const suitSymbol = computed(() => {
  return suitSymbols[props.suit];
});

// Valeur affichée (identique à la valeur reçue)
const displayValue = computed(() => {
  return props.value;
});
</script>
