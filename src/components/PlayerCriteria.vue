<template>
  <div class="player-card">
    <h3>{{ playerName }}</h3>

    <!-- Critères de points -->
    <div class="criteria-row">
      <div class="form-group" style="flex: 1">
        <label class="form-label">Points</label>
        <input
          v-model.number="localCriteria.points"
          @input="updateCriteria"
          type="number"
          min="0"
          max="40"
          class="form-input"
          placeholder="Points"
        />
      </div>
    </div>

    <!-- Critères de distribution par couleur -->
    <div class="form-group">
      <label class="form-label">Distribution minimale par couleur</label>
      <div class="suit-criteria">
        <div class="suit-input">
          <div class="suit-symbol-label">♠</div>
          <input
            v-model.number="localCriteria.spades"
            @input="updateCriteria"
            type="number"
            min="0"
            max="13"
            class="suit-number-input"
            placeholder="0"
          />
        </div>
        <div class="suit-input">
          <div class="suit-symbol-label" style="color: #dc2626">♥</div>
          <input
            v-model.number="localCriteria.hearts"
            @input="updateCriteria"
            type="number"
            min="0"
            max="13"
            class="suit-number-input"
            placeholder="0"
          />
        </div>
        <div class="suit-input">
          <div class="suit-symbol-label" style="color: #dc2626">♦</div>
          <input
            v-model.number="localCriteria.diamonds"
            @input="updateCriteria"
            type="number"
            min="0"
            max="13"
            class="suit-number-input"
            placeholder="0"
          />
        </div>
        <div class="suit-input">
          <div class="suit-symbol-label">♣</div>
          <input
            v-model.number="localCriteria.clubs"
            @input="updateCriteria"
            type="number"
            min="0"
            max="13"
            class="suit-number-input"
            placeholder="0"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";

// Props
const props = defineProps({
  playerName: {
    type: String,
    required: true,
  },
  criteria: {
    type: Object,
    default: () => ({
      points: null,
      spades: null,
      hearts: null,
      diamonds: null,
      clubs: null,
    }),
  },
});

// Emits
const emit = defineEmits(["update:criteria"]);

// État local pour éviter les problèmes de réactivité
const localCriteria = ref({
  points: props.criteria.points || null,
  spades: props.criteria.spades || null,
  hearts: props.criteria.hearts || null,
  diamonds: props.criteria.diamonds || null,
  clubs: props.criteria.clubs || null,
});

// Synchroniser avec les props
watch(
  () => props.criteria,
  (newCriteria) => {
    localCriteria.value = {
      points: newCriteria.points || null,
      spades: newCriteria.spades || null,
      hearts: newCriteria.hearts || null,
      diamonds: newCriteria.diamonds || null,
      clubs: newCriteria.clubs || null,
    };
  },
  { deep: true }
);

// Méthode pour émettre les changements
const updateCriteria = () => {
  emit("update:criteria", { ...localCriteria.value });
};
</script>
