<template>
  <div class="double-dummy">
    <div class="dd-header">
      <h3>⚡ Analyse Double-Dummy</h3>
      <p class="dd-subtitle">Nombre de levées optimales pour chaque déclarant</p>
    </div>

    <!-- Statut d'initialisation du solver -->
    <div v-if="workerStatus === 'loading'" class="dd-status loading">
      Chargement du moteur d'analyse...
    </div>
    <div v-else-if="workerStatus === 'error'" class="dd-status error">
      Erreur de chargement du solver : {{ initError }}
    </div>

    <!-- Bouton analyser -->
    <div v-if="workerStatus === 'ready'" class="dd-actions">
      <button
        @click="analyze"
        :disabled="isLoading"
        class="button button-primary dd-button"
      >
        {{ isLoading ? '⏳ Calcul en cours...' : '⚡ Analyser la donne' }}
      </button>
      <span v-if="computeTime" class="dd-time">calculé en {{ computeTime }}ms</span>
    </div>

    <!-- Erreur de calcul -->
    <div v-if="solveError" class="dd-status error">
      {{ solveError }}
    </div>

    <!-- Tableau des résultats -->
    <div v-if="results" class="dd-table-wrapper">
      <table class="dd-table">
        <thead>
          <tr>
            <th class="dd-strain-header">Atout</th>
            <th v-for="seat in seats" :key="seat" class="dd-seat-header">
              {{ seatLabel(seat) }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="strain in strains" :key="strain.key">
            <td :class="['dd-strain-cell', strain.colorClass]">
              {{ strain.label }}
            </td>
            <td
              v-for="seat in seats"
              :key="seat"
              :class="['dd-tricks-cell', trickClass(results[strain.key]?.[seat])]"
              :title="trickTitle(strain.key, seat, results[strain.key]?.[seat])"
            >
              {{ results[strain.key]?.[seat] ?? '?' }}
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Légende et explications -->
      <div class="dd-legend">
        <div class="dd-legend-color-scale">
          <span class="dd-legend-swatch tricks-0">0–3</span>
          <span class="dd-legend-arrow">→</span>
          <span class="dd-legend-swatch tricks-mid-low">4–6</span>
          <span class="dd-legend-arrow">→</span>
          <span class="dd-legend-swatch tricks-7">7</span>
          <span class="dd-legend-arrow">→</span>
          <span class="dd-legend-swatch tricks-high">8–11</span>
          <span class="dd-legend-arrow">→</span>
          <span class="dd-legend-swatch tricks-max">12–13</span>
        </div>
      </div>

      <details class="dd-help">
        <summary>❓ Comment lire ce tableau ?</summary>
        <div class="dd-help-body">
          <p>
            Chaque cellule indique le <strong>nombre de levées</strong> que le camp déclarant
            peut garantir avec un jeu parfait des deux côtés (<em>double-dummy</em>).
          </p>
          <ul>
            <li><strong>Lignes</strong> : la couleur d'atout — SA (Sans-Atout), ♠ ♥ ♦ ♣</li>
            <li><strong>Colonnes</strong> : le déclarant — Nord, Sud, Est ou Ouest</li>
            <li>
              <strong>Valeur</strong> : nombre de levées pour ce déclarant dans cette couleur.
              Un contrat de niveau N nécessite <strong>6 + N</strong> levées
              (ex. 3SA = 9 levées, 4♠ = 10 levées).
            </li>
          </ul>
          <div class="dd-help-scale">
            <div class="dd-help-scale-item tricks-0">0–3 levées — chute certaine</div>
            <div class="dd-help-scale-item tricks-mid-low">4–6 levées — contrat partiel difficile</div>
            <div class="dd-help-scale-item tricks-7">7 levées — 1SA faisable</div>
            <div class="dd-help-scale-item tricks-mid-high">8–9 levées — contrat de manche à portée</div>
            <div class="dd-help-scale-item tricks-high">10–11 levées — manche ou chelem partiel</div>
            <div class="dd-help-scale-item tricks-max">12–13 levées — grand ou petit chelem</div>
          </div>
          <p class="dd-help-note">
            💡 Survolez une cellule pour voir le contrat exact et son statut.
          </p>
        </div>
      </details>
    </div>

    <!-- ========== ANALYSE D'ENTAME ========== -->
    <div v-if="results" class="dd-lead-section">
      <div class="dd-lead-header">
        <h4>🃏 Analyse d'entame</h4>
        <p class="dd-subtitle">Classement des entames optimales contre un contrat donné</p>
      </div>

      <!-- Sélecteur de contrat -->
      <div class="dd-contract-picker">
        <div class="dd-picker-row">
          <label class="dd-picker-label">Niveau</label>
          <select v-model.number="selectedLevel" class="dd-select">
            <option v-for="l in 7" :key="l" :value="l">{{ l }}</option>
          </select>

          <label class="dd-picker-label">Atout</label>
          <select v-model="selectedStrain" class="dd-select dd-select-strain">
            <option value="NT">SA</option>
            <option value="S">♠</option>
            <option value="H">♥</option>
            <option value="D">♦</option>
            <option value="C">♣</option>
          </select>

          <label class="dd-picker-label">Déclarant</label>
          <select v-model="selectedDeclarer" class="dd-select">
            <option value="N">Nord</option>
            <option value="S">Sud</option>
            <option value="E">Est</option>
            <option value="W">Ouest</option>
          </select>

          <button
            @click="analyzeLead"
            :disabled="isLeadLoading || workerStatus !== 'ready'"
            class="button button-primary dd-button"
          >
            {{ isLeadLoading ? '⏳ Calcul...' : '🃏 Analyser l\'entame' }}
          </button>
        </div>

        <!-- Faisabilité du contrat sélectionné -->
        <div
          v-if="contractFeasibility"
          :class="['dd-feasibility', selectedDDTricks >= 6 + selectedLevel ? 'feasible' : 'down']"
        >
          {{ contractFeasibility }}
          <span v-if="leadComputeTime" class="dd-time"> · calculé en {{ leadComputeTime }}ms</span>
        </div>
      </div>

      <!-- Erreur -->
      <div v-if="leadError" class="dd-status error">{{ leadError }}</div>

      <!-- Résultats : cartes classées de la meilleure à la pire entame -->
      <div v-if="leadResults && leadResults.length" class="dd-lead-results">
        <p class="dd-lead-intro">
          Entames classées de la <strong>plus meurtrière</strong> (delta négatif = contrat chute)
          à la <strong>plus coûteuse</strong> (delta positif = cadeau au déclarant) :
        </p>
        <div class="dd-lead-grid">
          <div
            v-for="lead in leadResults"
            :key="lead.suit + lead.rank"
            :class="['dd-lead-card', leadClass(lead.delta)]"
            :title="leadTitle(lead)"
          >
            <span :class="['dd-lead-suit', suitColorClass(lead.suit)]">{{ suitSymbol(lead.suit) }}</span>
            <span class="dd-lead-rank">{{ lead.rank }}</span>
            <span class="dd-lead-delta">{{ lead.delta > 0 ? '+' + lead.delta : lead.delta }}</span>
          </div>
        </div>
        <div class="dd-lead-legend">
          <span class="dd-lead-leg lead-best">delta &lt; 0 : contrat chute</span>
          <span class="dd-lead-leg lead-neutral">= 0 : contrat limite</span>
          <span class="dd-lead-leg lead-bad">delta &gt; 0 : cadeau au déclarant</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, toRaw } from 'vue';

const props = defineProps({
  deal: {
    type: Object,
    required: true,
  },
});

// Worker state
const workerStatus = ref('loading'); // 'loading' | 'ready' | 'error'
const initError = ref('');
const isLoading = ref(false);
const results = ref(null);
const solveError = ref(null);
const computeTime = ref(null);

// Lead analysis state
const selectedLevel    = ref(4);
const selectedStrain   = ref('S');
const selectedDeclarer = ref('S');
const leadResults      = ref(null);
const leadError        = ref(null);
const isLeadLoading    = ref(false);
const leadComputeTime  = ref(null);

let worker      = null;
let startTime   = null;
let leadStartTime = null;
let pendingDDId   = null;
let pendingLeadId = null;

const baseUrl = import.meta.env.BASE_URL;

// Strains to display
const strains = [
  { key: 'NT', label: 'SA', colorClass: 'strain-nt' },
  { key: 'S',  label: '♠',  colorClass: 'strain-spade' },
  { key: 'H',  label: '♥',  colorClass: 'strain-heart' },
  { key: 'D',  label: '♦',  colorClass: 'strain-diamond' },
  { key: 'C',  label: '♣',  colorClass: 'strain-club' },
];

// Declarers (column order matches solver output: N, S, E, W)
const seats = ['N', 'S', 'E', 'W'];

function seatLabel(seat) {
  const labels = { N: 'Nord', S: 'Sud', E: 'Est', W: 'Ouest' };
  return labels[seat];
}

// Returns the CSS class for a tricks cell based on the count
function trickClass(tricks) {
  if (tricks === undefined || tricks === null) return '';
  if (tricks === 0)  return 'tricks-0';
  if (tricks <= 3)   return 'tricks-low';
  if (tricks <= 6)   return 'tricks-mid-low';
  if (tricks === 7)  return 'tricks-7';
  if (tricks <= 9)   return 'tricks-mid-high';
  if (tricks <= 11)  return 'tricks-high';
  return 'tricks-max'; // 12-13
}

// Tooltip: show the contract level and making status
function trickTitle(strainKey, seat, tricks) {
  if (tricks === undefined || tricks === null) return '';
  const level = tricks - 6;
  if (level <= 0) return `Chute (${tricks} levées)`;
  const strainSymbol = { NT: 'SA', S: '♠', H: '♥', D: '♦', C: '♣' }[strainKey];
  const seatFull = seatLabel(seat);
  return `${level}${strainSymbol} par ${seatFull} (${tricks} levées)`;
}

function initWorker() {
  console.log('[DoubleDummy] Création du worker, baseUrl =', baseUrl);
  worker = new Worker(baseUrl + 'solver.worker.js');

  worker.onmessage = (e) => {
    const { type, id, data, error } = e.data;
    console.log('[DoubleDummy] Message reçu du worker:', type, id);
    if (type === 'ready') {
      console.log('[DoubleDummy] Worker prêt ✓');
      workerStatus.value = 'ready';
    } else if (type === 'result') {
      if (id === pendingDDId) {
        console.log('[DoubleDummy] Résultat DD reçu en', Date.now() - startTime, 'ms:', data);
        isLoading.value = false;
        results.value = data;
        computeTime.value = Date.now() - startTime;
      } else if (id === pendingLeadId) {
        console.log('[DoubleDummy] Résultat entame reçu en', Date.now() - leadStartTime, 'ms:', data);
        isLeadLoading.value = false;
        leadResults.value = data;
        leadComputeTime.value = Date.now() - leadStartTime;
      }
    } else if (type === 'error') {
      console.error('[DoubleDummy] Erreur worker:', id, error);
      if (id === 'init') {
        workerStatus.value = 'error';
        initError.value = error;
      } else if (id === pendingDDId) {
        isLoading.value = false;
        solveError.value = error;
      } else if (id === pendingLeadId) {
        isLeadLoading.value = false;
        leadError.value = error;
      }
    }
  };

  worker.onerror = (e) => {
    console.error('[DoubleDummy] worker.onerror:', e.message, e);
    workerStatus.value = 'error';
    initError.value = e.message || 'Erreur inconnue';
  };

  console.log('[DoubleDummy] Envoi init au worker...');
  worker.postMessage({ type: 'init', payload: { baseUrl } });
}

onMounted(() => {
  initWorker();
});

onUnmounted(() => {
  worker?.terminate();
  worker = null;
});

// Reset results when the deal changes
watch(
  () => props.deal,
  () => {
    results.value       = null;
    solveError.value    = null;
    isLoading.value     = false;
    computeTime.value   = null;
    leadResults.value   = null;
    leadError.value     = null;
    isLeadLoading.value = false;
    leadComputeTime.value = null;
  }
);

// When DD results arrive, auto-populate the contract picker with the best contract
watch(results, (newResults) => {
  if (!newResults) return;
  let best = { tricks: 0, strain: 'S', declarer: 'S' };
  for (const strain of ['S', 'H', 'NT', 'D', 'C']) {
    for (const seat of ['N', 'S', 'E', 'W']) {
      const t = newResults[strain]?.[seat] ?? 0;
      if (t > best.tricks) best = { tricks: t, strain, declarer: seat };
    }
  }
  selectedLevel.value    = Math.max(1, Math.min(7, best.tricks - 6));
  selectedStrain.value   = best.strain;
  selectedDeclarer.value = best.declarer;
  leadResults.value      = null;
  leadError.value        = null;
});

// Faisabilité du contrat sélectionné
const selectedDDTricks = computed(() => {
  if (!results.value) return null;
  return results.value[selectedStrain.value]?.[selectedDeclarer.value] ?? null;
});

const contractFeasibility = computed(() => {
  const tricks = selectedDDTricks.value;
  if (tricks === null) return '';
  const needed = 6 + selectedLevel.value;
  const sym = { NT: 'SA', S: '♠', H: '♥', D: '♦', C: '♣' }[selectedStrain.value];
  const seat = seatLabel(selectedDeclarer.value);
  if (tricks >= needed) return `✅ ${selectedLevel.value}${sym} par ${seat} faisable — ${tricks} levées (${tricks >= needed ? '+' + (tricks - needed) : tricks - needed})`;
  return `❌ ${selectedLevel.value}${sym} par ${seat} chute de ${needed - tricks} — seulement ${tricks} levées`;
});

function analyze() {
  console.log('[DoubleDummy] analyze() appelé, workerStatus =', workerStatus.value);
  console.log('[DoubleDummy] deal reçu:', props.deal);
  if (isLoading.value || workerStatus.value !== 'ready') return;
  isLoading.value = true;
  solveError.value = null;
  results.value = null;
  computeTime.value = null;
  startTime = Date.now();
  pendingDDId = 'dd-' + startTime;

  console.log('[DoubleDummy] Envoi solve au worker...');
  const rawDeal = toRaw(props.deal);
  worker.postMessage({
    type: 'solve',
    id: pendingDDId,
    payload: {
      north: rawDeal.north.map(toRaw),
      south: rawDeal.south.map(toRaw),
      east:  rawDeal.east.map(toRaw),
      west:  rawDeal.west.map(toRaw),
    },
  });
}

function analyzeLead() {
  if (isLeadLoading.value || workerStatus.value !== 'ready') return;
  isLeadLoading.value = true;
  leadResults.value   = null;
  leadError.value     = null;
  leadComputeTime.value = null;
  leadStartTime = Date.now();
  pendingLeadId = 'lead-' + leadStartTime;

  console.log('[DoubleDummy] Envoi solve_plays au worker, contrat:', selectedLevel.value, selectedStrain.value, selectedDeclarer.value);
  const rawDeal = toRaw(props.deal);
  worker.postMessage({
    type: 'solve_plays',
    id: pendingLeadId,
    payload: {
      deal: {
        north: rawDeal.north.map(toRaw),
        south: rawDeal.south.map(toRaw),
        east:  rawDeal.east.map(toRaw),
        west:  rawDeal.west.map(toRaw),
      },
      level:       selectedLevel.value,
      trump:       selectedStrain.value,
      declarer:    selectedDeclarer.value,
      playedCards: [],
    },
  });
}

function suitSymbol(suit) {
  return { spades: '♠', hearts: '♥', diamonds: '♦', clubs: '♣' }[suit] ?? suit;
}
function suitColorClass(suit) {
  return suit === 'hearts' || suit === 'diamonds' ? 'red-suit' : 'black-suit';
}
function leadClass(delta) {
  if (delta < 0)  return 'lead-best';    // entame mortelle
  if (delta === 0) return 'lead-neutral'; // contrat exactement faisable
  return 'lead-bad';                     // cadeau au déclarant
}
function leadTitle(lead) {
  const sym = suitSymbol(lead.suit);
  if (lead.delta < 0) return `${sym}${lead.rank} : contrat chute de ${-lead.delta}`;
  if (lead.delta === 0) return `${sym}${lead.rank} : contrat faisable exactement`;
  return `${sym}${lead.rank} : donne ${lead.delta} levée(s) supplémentaire(s) au déclarant`;
}
</script>

<style scoped>
.double-dummy {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  margin-top: 2rem;
}

.dd-header {
  margin-bottom: 1rem;
}

.dd-header h3 {
  font-size: 1.3rem;
  font-weight: 700;
  color: #1e40af;
  margin-bottom: 0.25rem;
}

.dd-subtitle {
  color: #6b7280;
  font-size: 0.875rem;
}

.dd-status {
  padding: 0.75rem 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
  margin-bottom: 1rem;
}

.dd-status.loading {
  background: #eff6ff;
  color: #3b82f6;
  border: 1px solid #bfdbfe;
}

.dd-status.error {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.dd-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.dd-button {
  padding: 0.6rem 1.5rem;
  font-size: 0.95rem;
}

.dd-time {
  color: #6b7280;
  font-size: 0.8rem;
}

.dd-table-wrapper {
  overflow-x: auto;
}

.dd-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.95rem;
  min-width: 360px;
}

.dd-table th {
  padding: 0.6rem 0.8rem;
  text-align: center;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  font-weight: 600;
  color: #374151;
}

.dd-strain-header {
  text-align: left !important;
  width: 60px;
}

.dd-seat-header {
  min-width: 72px;
}

.dd-strain-cell {
  padding: 0.6rem 0.8rem;
  font-weight: 700;
  font-size: 1.1rem;
  border: 1px solid #e2e8f0;
  text-align: center;
}

.dd-tricks-cell {
  padding: 0.6rem 0.8rem;
  text-align: center;
  font-weight: 600;
  font-size: 1rem;
  border: 1px solid #e2e8f0;
  cursor: default;
  transition: opacity 0.1s;
}

.dd-tricks-cell:hover {
  opacity: 0.85;
}

/* Strain cell colors */
.strain-nt      { color: #1e40af; background: #eff6ff; }
.strain-spade   { color: #111827; background: #f9fafb; }
.strain-heart   { color: #dc2626; background: #fff5f5; }
.strain-diamond { color: #dc2626; background: #fff5f5; }
.strain-club    { color: #111827; background: #f9fafb; }

/* Tricks cell color scale */
.tricks-0        { background: #fca5a5; color: #7f1d1d; }
.tricks-low      { background: #fca5a5; color: #991b1b; }      /* 1-3 */
.tricks-mid-low  { background: #fde68a; color: #78350f; }      /* 4-6 */
.tricks-7        { background: #bbf7d0; color: #14532d; }      /* 7 = 1st making */
.tricks-mid-high { background: #86efac; color: #14532d; }      /* 8-9 */
.tricks-high     { background: #4ade80; color: #14532d; }      /* 10-11 */
.tricks-max      { background: #16a34a; color: #ffffff; }      /* 12-13 */

/* Legend */
.dd-legend {
  margin-top: 0.75rem;
}

.dd-legend-color-scale {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  flex-wrap: wrap;
  font-size: 0.78rem;
}

.dd-legend-swatch {
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-weight: 600;
  border: 1px solid rgba(0,0,0,0.08);
}

.dd-legend-arrow {
  color: #9ca3af;
  font-size: 0.75rem;
}

/* Help / instructions */
.dd-help {
  margin-top: 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.875rem;
}

.dd-help summary {
  padding: 0.6rem 0.8rem;
  cursor: pointer;
  color: #374151;
  font-weight: 600;
  user-select: none;
  list-style: none;
}

.dd-help summary::-webkit-details-marker { display: none; }

.dd-help[open] summary {
  border-bottom: 1px solid #e2e8f0;
  color: #1e40af;
}

.dd-help-body {
  padding: 0.75rem 1rem;
  color: #374151;
  line-height: 1.6;
}

.dd-help-body p { margin: 0 0 0.5rem; }
.dd-help-body ul { margin: 0 0 0.75rem; padding-left: 1.2rem; }
.dd-help-body li { margin-bottom: 0.25rem; }

.dd-help-scale {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin: 0.75rem 0;
}

.dd-help-scale-item {
  padding: 0.3rem 0.75rem;
  border-radius: 4px;
  font-size: 0.82rem;
  font-weight: 500;
  border: 1px solid rgba(0,0,0,0.08);
}

.dd-help-note {
  margin-top: 0.5rem !important;
  color: #6b7280;
  font-size: 0.82rem;
}

/* ===== Lead analysis section ===== */
.dd-lead-section {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 2px solid #e2e8f0;
}

.dd-lead-header {
  margin-bottom: 1rem;
}

.dd-lead-header h4 {
  font-size: 1.15rem;
  font-weight: 700;
  color: #1e40af;
  margin-bottom: 0.25rem;
}

.dd-contract-picker {
  margin-bottom: 1rem;
}

.dd-picker-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.dd-picker-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #374151;
}

.dd-select {
  padding: 0.35rem 0.6rem;
  border: 1px solid #d1d5db;
  border-radius: 5px;
  font-size: 0.95rem;
  background: white;
  cursor: pointer;
}

.dd-select-strain {
  font-size: 1.1rem;
  min-width: 60px;
}

.dd-feasibility {
  display: inline-block;
  padding: 0.4rem 0.9rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
}
.dd-feasibility.feasible {
  background: #dcfce7;
  color: #14532d;
  border: 1px solid #86efac;
}
.dd-feasibility.down {
  background: #fef2f2;
  color: #991b1b;
  border: 1px solid #fca5a5;
}

.dd-lead-intro {
  font-size: 0.875rem;
  color: #4b5563;
  margin-bottom: 0.75rem;
}

.dd-lead-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.dd-lead-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  border: 1px solid rgba(0,0,0,0.1);
  min-width: 54px;
  cursor: default;
  transition: transform 0.1s;
}
.dd-lead-card:hover { transform: translateY(-2px); }

.dd-lead-suit  { font-size: 1.3rem; line-height: 1; }
.dd-lead-rank  { font-size: 1rem; font-weight: 700; line-height: 1.2; }
.dd-lead-delta { font-size: 0.8rem; font-weight: 700; margin-top: 0.2rem; }

.red-suit   { color: #dc2626; }
.black-suit { color: #111827; }

/* Lead quality classes */
.lead-best    { background: #dcfce7; border-color: #86efac; }  /* delta < 0 : kills contract */
.lead-best .dd-lead-delta    { color: #14532d; }
.lead-neutral { background: #fef9c3; border-color: #fde047; }  /* delta = 0 */
.lead-neutral .dd-lead-delta { color: #713f12; }
.lead-bad     { background: #fee2e2; border-color: #fca5a5; }  /* delta > 0 : gives tricks away */
.lead-bad .dd-lead-delta     { color: #991b1b; }

/* Lead legend */
.dd-lead-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  font-size: 0.8rem;
}

.dd-lead-leg {
  padding: 0.2rem 0.6rem;
  border-radius: 4px;
  border: 1px solid rgba(0,0,0,0.1);
  font-weight: 500;
}
.dd-lead-leg.lead-best    { background: #dcfce7; color: #14532d; }
.dd-lead-leg.lead-neutral { background: #fef9c3; color: #713f12; }
.dd-lead-leg.lead-bad     { background: #fee2e2; color: #991b1b; }
</style>
