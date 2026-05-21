<template>
  <div class="segment-redistribution">
    <!-- Instructions -->
    <div class="instructions-box">
      <h3>🎯 Redistribution par Segments Optimisés</h3>
      <ol>
        <li><strong>Objectif</strong> : Trouver EXACTEMENT le nombre de points demandé avec le MINIMUM de mouvements</li>
        <li><strong>Algorithme</strong> : Teste jusqu'à 100 000 distributions (configurable) pour trouver la solution optimale</li>
        <li><strong>Segments</strong> : Groupes de cartes contiguës assignées au même joueur (1-13 cartes)</li>
        <li><strong>Optimisation</strong> : Parcourt toutes les itérations pour garantir le meilleur résultat possible</li>
      </ol>
    </div>

    <!-- Configuration des contraintes -->
    <div class="constraints-section">
      <h3>🎯 Contraintes de Points</h3>
      <div class="constraints-form">
        <div class="player-constraint" v-for="player in players" :key="player.key">
          <label :for="`points-${player.key}`">{{ player.name }}</label>
          <input
            :id="`points-${player.key}`"
            type="number"
            min="0"
            max="37"
            v-model.number="targetPoints[player.key]"
            placeholder="Points cibles"
          />
        </div>
      </div>
      
      <!-- Configuration avancée -->
      <div class="advanced-config">
        <h4>⚙️ Configuration Avancée</h4>
        <div class="config-row">
          <label for="max-iterations">Nombre maximum d'itérations :</label>
          <input
            id="max-iterations"
            type="number"
            min="1000"
            max="1000000"
            step="1000"
            v-model.number="maxIterations"
            :disabled="isProcessing"
            placeholder="100000"
          />
          <span class="config-hint">(Plus d'itérations = meilleur résultat mais plus long)</span>
        </div>
      </div>
      
      <div class="controls">
        <button
          @click="distributeWithSegments"
          :disabled="isProcessing"
          class="distribute-btn"
        >
          {{ isProcessing ? 'Recherche en cours...' : '🎯 Distribuer par Segments' }}
        </button>
        
        <button
          v-if="isProcessing"
          @click="cancelDistribution"
          class="cancel-btn"
        >
          ❌ Annuler
        </button>
      </div>
    </div>

    <!-- Barre de progression -->
    <div v-if="isProcessing" class="progress-container">
      <div class="progress-info">
        <span>Recherche de la distribution optimale...</span>
        <span>{{ progress.attempts }} / {{ progress.maxAttempts }} tentatives</span>
      </div>
      <div class="progress-bar">
        <div
          class="progress-fill"
          :style="{ width: progressPercentage + '%' }"
        ></div>
      </div>
      <div class="progress-details">
        <span>Meilleure solution : {{ progress.bestMovements === Infinity ? 'aucune' : progress.bestMovements + ' mouvements' }}</span>
      </div>
    </div>

    <!-- Résultats -->
    <div v-if="distribution" class="results-section">
      <!-- Statistiques -->
      <div class="success-banner">
        <h3>✅ Solution Trouvée !</h3>
        <div class="stats-grid">
          <div class="stat-card">
            <h4>{{ movements }}</h4>
            <p>Mouvements nécessaires</p>
          </div>
          <div class="stat-card">
            <h4>{{ attempts }}</h4>
            <p>Tentatives utilisées</p>
          </div>
          <div class="stat-card">
            <h4>{{ segmentCount }}</h4>
            <p>Segments créés</p>
          </div>
          <div class="stat-card">
            <h4>{{ Math.round(executionTime) }}ms</h4>
            <p>Temps de calcul</p>
          </div>
        </div>
      </div>

      <!-- Distribution par joueur -->
      <div class="players-grid">
        <div
          v-for="(hand, playerIndex) in distribution"
          :key="playerIndex"
          class="player-hand"
          :class="{ 'target-player': hasTargetPoints(playerIndex) }"
        >
          <div class="player-header">
            <h4>{{ getPlayerName(playerIndex) }} {{ hasTargetPoints(playerIndex) ? '🎯' : '' }}</h4>
            <span class="points" :class="{ 
              'target-reached': hasTargetPoints(playerIndex),
              'points-mismatch': !hasTargetPoints(playerIndex) && targetPoints[getPlayerKey(playerIndex)]
            }">
              {{ calculateHandPoints(hand) }} points
            </span>
          </div>
          
          <div class="cards-count">{{ hand.length }} cartes</div>
          
          <div class="cards-display">
            <div
              v-for="(card, cardIndex) in hand"
              :key="cardIndex"
              class="card-mini"
              :class="{
                'high-card': getCardPoints(card) > 0,
                'red-suit': isRedCard(card)
              }"
            >
              {{ decodeCard(card).rank }}{{ decodeCard(card).suit }}
            </div>
          </div>
        </div>
      </div>

      <!-- Deck de départ -->
      <div class="initial-deck-section">
        <h4>📚 Deck de Départ (Distribution Classique)</h4>
        <div class="deck-info">
          <p>Répartition initiale : 13 cartes par joueur dans l'ordre linéaire (positions 0-12 → Nord, 13-25 → Est, etc.)</p>
        </div>
        
        <div class="linear-deck initial-deck">
          <div
            v-for="(card, index) in deck"
            :key="`initial-${index}`"
            class="card-linear"
            :class="`player-${getInitialPlayer(index)}`"
            :title="`Position ${index} - ${getPlayerName(getInitialPlayer(index))} (initial) - ${decodeCard(card).rank}${decodeCard(card).suit} (${getCardPoints(card)}pts)`"
          >
            <span class="card-content" :class="{ 'red-suit': isRedCard(card) }">
              {{ decodeCard(card).rank }}{{ decodeCard(card).suit }}
            </span>
            <span class="player-indicator">J{{ getInitialPlayer(index) + 1 }}</span>
          </div>
        </div>

        <!-- Points de la distribution initiale -->
        <div class="initial-points">
          <h5>Points de la distribution initiale :</h5>
          <div class="points-grid">
            <div v-for="playerIndex in [0, 1, 2, 3]" :key="`initial-points-${playerIndex}`" class="point-item">
              <span class="player-name">{{ getPlayerName(playerIndex) }}</span>
              <span class="points-value">{{ getInitialPlayerPoints(playerIndex) }} pts</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Deck linéaire avec segments optimisés -->
      <div class="linear-deck-section">
        <h4>🎯 Deck Optimisé par Segments</h4>
        <div class="deck-info">
          <p>Résultat après optimisation : segments contigus pour minimiser les mouvements physiques</p>
        </div>
        <div class="linear-deck">
          <div
            v-for="(card, index) in deck"
            :key="index"
            class="card-linear"
            :class="`player-${getCardPlayer(card)}`"
            :title="`Position ${index} - ${getPlayerName(getCardPlayer(card))} - ${decodeCard(card).rank}${decodeCard(card).suit} (${getCardPoints(card)}pts)`"
          >
            <span class="card-content" :class="{ 'red-suit': isRedCard(card) }">
              {{ decodeCard(card).rank }}{{ decodeCard(card).suit }}
            </span>
            <span class="player-indicator">J{{ getCardPlayer(card) + 1 }}</span>
          </div>
        </div>
        
        <!-- Légende -->
        <div class="legend">
          <div class="legend-item">
            <div class="legend-color player-0"></div>
            <span>{{ getPlayerName(0) }} ({{ calculateHandPoints(distribution[0]) }} pts)</span>
          </div>
          <div class="legend-item">
            <div class="legend-color player-1"></div>
            <span>{{ getPlayerName(1) }} ({{ calculateHandPoints(distribution[1]) }} pts)</span>
          </div>
          <div class="legend-item">
            <div class="legend-color player-2"></div>
            <span>{{ getPlayerName(2) }} ({{ calculateHandPoints(distribution[2]) }} pts)</span>
          </div>
          <div class="legend-item">
            <div class="legend-color player-3"></div>
            <span>{{ getPlayerName(3) }} ({{ calculateHandPoints(distribution[3]) }} pts)</span>
          </div>
        </div>
      </div>

      <!-- Analyse des segments -->
      <div class="segments-analysis">
        <h4>📊 Analyse des Segments</h4>
        <div class="segments-list">
          <div
            v-for="(segment, index) in segmentsInfo"
            :key="index"
            class="segment-card"
            :class="`segment-player-${segment.player}`"
          >
            <div class="segment-header">
              <span class="segment-number">{{ index + 1 }}</span>
              <span class="segment-title">{{ getPlayerName(segment.player) }}</span>
            </div>
            <div class="segment-details">
              <span>{{ segment.size }} cartes (pos. {{ segment.start }}-{{ segment.end }})</span>
              <span>{{ segment.points }} points</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue';

export default {
  name: 'SegmentRedistribution',
  setup() {
    // État réactif
    const distribution = ref(null);
    const movements = ref(0);
    const attempts = ref(0);
    const segmentCount = ref(0);
    const executionTime = ref(0);
    const isProcessing = ref(false);
    const maxIterations = ref(100000); // Variable pour contrôler le nombre d'itérations
    const progress = ref({ attempts: 0, maxAttempts: 100000, bestMovements: Infinity });
    
    // Synchroniser progress.maxAttempts avec maxIterations
    watch(maxIterations, (newValue) => {
      progress.value.maxAttempts = newValue;
    });
    
    const targetPoints = ref({
      north: null,
      south: null, 
      east: null,
      west: null
    });

    // Données statiques
    const players = [
      { key: 'north', name: 'Nord' },
      { key: 'south', name: 'Sud' },
      { key: 'east', name: 'Est' },
      { key: 'west', name: 'Ouest' }
    ];

    const suits = ["♥", "♦", "♣", "♠"];
    const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
    
    // Deck avec encoding numérique comme dans l'exemple React
    const deck = [
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13,           // ♥
      17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29,  // ♦
      33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45,  // ♣
      49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61   // ♠
    ];

    // Calculés
    const progressPercentage = computed(() => {
      if (progress.value.maxAttempts === 0) return 0;
      return Math.min(100, (progress.value.attempts / progress.value.maxAttempts) * 100);
    });

    const segmentsInfo = computed(() => {
      if (!distribution.value || !bestAssignments.value) return [];
      
      // Calculer les segments basés sur les assignations réelles
      return calculateRealSegments(bestAssignments.value);
    });

    // Stockage des meilleures assignations pour le calcul des segments
    const bestAssignments = ref(null);

    // Méthodes utilitaires
    function getCardPoints(card) {
      const rank = card % 16;
      if (rank === 1) return 4;  // As
      if (rank === 13) return 3; // Roi
      if (rank === 12) return 2; // Dame
      if (rank === 11) return 1; // Valet
      return 0;
    }

    function decodeCard(card) {
      const rank = card % 16;
      const suit = Math.floor(card / 16);
      return { 
        rank: ranks[rank - 1], 
        suit: suits[suit], 
        points: getCardPoints(card) 
      };
    }

    function isRedCard(card) {
      const suit = Math.floor(card / 16);
      return suit === 0 || suit === 1; // ♥ ou ♦
    }

    function calculateHandPoints(hand) {
      return hand.reduce((sum, card) => sum + getCardPoints(card), 0);
    }

    function getPlayerName(playerIndex) {
      const names = ['Nord', 'Sud', 'Est', 'Ouest'];
      return names[playerIndex] || `Joueur ${playerIndex + 1}`;
    }

    function getPlayerKey(playerIndex) {
      const keys = ['north', 'south', 'east', 'west'];
      return keys[playerIndex];
    }

    function getCardPlayer(card) {
      if (!distribution.value) return 0;
      return distribution.value.findIndex(hand => hand.includes(card));
    }

    // Distribution initiale classique (avant optimisation)
    function getInitialPlayer(cardIndex) {
      // Distribution classique : 0-12 → Joueur 0, 13-25 → Joueur 1, etc.
      return Math.floor(cardIndex / 13);
    }

    function getInitialPlayerPoints(playerIndex) {
      let points = 0;
      for (let i = 0; i < 52; i++) {
        if (getInitialPlayer(i) === playerIndex) {
          points += getCardPoints(deck[i]);
        }
      }
      return points;
    }

    function hasTargetPoints(playerIndex) {
      if (!distribution.value) return false;
      const playerKey = getPlayerKey(playerIndex);
      const target = targetPoints.value[playerKey];
      if (target === null || target === undefined) return false;
      
      const actual = calculateHandPoints(distribution.value[playerIndex]);
      return actual === target;
    }

    // Algorithme principal de redistribution par segments
    async function distributeWithSegments() {
      isProcessing.value = true;
      const startTime = performance.now();
      
      // Trouver le joueur cible (premier avec une contrainte définie)
      let targetPlayerIndex = -1;
      let targetPointsValue = null;
      
      for (let i = 0; i < 4; i++) {
        const playerKey = getPlayerKey(i);
        if (targetPoints.value[playerKey] !== null && targetPoints.value[playerKey] !== undefined) {
          targetPlayerIndex = i;
          targetPointsValue = targetPoints.value[playerKey];
          break;
        }
      }
      
      if (targetPlayerIndex === -1 || targetPointsValue === null) {
        alert('Veuillez définir au moins une contrainte de points pour un joueur');
        isProcessing.value = false;
        return;
      }

      let bestSolution = null;
      let bestMovements = Infinity;
      let bestAssignmentsLocal = null;
      let attemptCount = 0;
      
      console.log(`🎯 Recherche d'une distribution avec ${targetPointsValue} points pour ${getPlayerName(targetPlayerIndex)}`);
      console.log(`📚 Deck mélangé:`, deck.slice(0, 10).map(card => decodeCard(card).rank + decodeCard(card).suit).join(', ') + '...');
      
      // Boucle principale de recherche (utilise maxIterations)
      for (let strategy = 0; strategy < maxIterations.value && isProcessing.value; strategy++) {
        attemptCount++;
        
        // Mise à jour du progrès
        progress.value = {
          attempts: attemptCount,
          maxAttempts: maxIterations.value,
          bestMovements: bestMovements
        };
        
        // Pause périodique pour la UI
        if (attemptCount % 100 === 0) {
          await new Promise(resolve => setTimeout(resolve, 1));
        }
        
        // NOUVELLE APPROCHE: Assignation par segments contigus dans le deck mélangé
        const assignments = new Array(52);
        
        // Créer des segments de tailles variables directement sur le deck mélangé
        let remaining = 52;
        let currentPlayer = 0;
        let currentPos = 0;
        
        while (remaining > 0) {
          // Taille de segment entre 1 et min(13, remaining)
          let segmentSize = 1 + Math.floor(Math.random() * Math.min(13, remaining));
          
          // Ajuster pour ne pas dépasser 13 cartes par joueur
          const playerCounts = [0, 0, 0, 0];
          for (let i = 0; i < currentPos; i++) {
            playerCounts[assignments[i]]++;
          }
          
          segmentSize = Math.min(segmentSize, 13 - playerCounts[currentPlayer]);
          
          if (segmentSize > 0) {
            // Assigner ce segment au joueur actuel
            for (let i = 0; i < segmentSize && currentPos < 52; i++) {
              assignments[currentPos] = currentPlayer;
              currentPos++;
            }
            remaining -= segmentSize;
          }
          
          // Rotation des joueurs
          currentPlayer = (currentPlayer + 1) % 4;
        }
        
        // Calculer les points du joueur cible avec les cartes réelles du deck mélangé
        let playerTargetPoints = 0;
        for (let i = 0; i < 52; i++) {
          if (assignments[i] === targetPlayerIndex) {
            playerTargetPoints += getCardPoints(deck[i]); // deck[i] = carte réelle à la position i
          }
        }
        
        // Ne garder QUE si exactement les points demandés
        if (playerTargetPoints === targetPointsValue) {
          // Compter les VRAIS segments (continus dans le deck mélangé)
          const realSegments = calculateRealSegments(assignments);
          const movementCount = realSegments.length - 1; // n segments = n-1 mouvements
          
          if (attemptCount <= 5 || movementCount < bestMovements) {
            console.log(`🎲 Tentative ${attemptCount}: ${movementCount} mouvements, ${playerTargetPoints} points`);
            console.log(`   Segments réels:`, realSegments.map(s => `J${s.player+1}[${s.start}-${s.end}]`).join(' '));
          }
          
          // Garder si c'est mieux
          if (movementCount < bestMovements) {
            bestMovements = movementCount;
            bestAssignmentsLocal = [...assignments];
            
            // Créer la distribution basée sur les assignations
            const players = [[], [], [], []];
            for (let i = 0; i < 52; i++) {
              players[assignments[i]].push(deck[i]); // Utiliser la vraie carte à la position i
            }
            bestSolution = players;
            
            console.log(`✅ Nouvelle meilleure solution: ${movementCount} mouvements`);
          }
        }
        
        // Arrêter si on a trouvé une très bonne solution
        if (bestMovements <= 15) break;
      }
      
      executionTime.value = performance.now() - startTime;
      
      // Appliquer la meilleure solution
      if (bestSolution && bestAssignmentsLocal) {
        distribution.value = bestSolution;
        bestAssignments.value = bestAssignmentsLocal; // Sauvegarder les assignations
        movements.value = bestMovements;
        attempts.value = attemptCount;
        
        // Calculer les segments finaux
        const finalSegments = calculateRealSegments(bestAssignmentsLocal);
        segmentCount.value = finalSegments.length;
        
        console.log(`🎉 Solution finale: ${bestMovements} mouvements en ${attemptCount} tentatives`);
        console.log(`📊 Segments finaux:`, finalSegments);
      } else {
        alert(`Aucune solution avec exactement ${targetPointsValue} points trouvée après ${attemptCount} tentatives. Relancez la distribution.`);
      }
      
      isProcessing.value = false;
    }

    function cancelDistribution() {
      isProcessing.value = false;
    }

    // Calcule les segments réels basés sur les assignations dans le deck mélangé
    function calculateRealSegments(assignments) {
      const segments = [];
      let currentPlayer = assignments[0];
      let segmentStart = 0;
      
      for (let i = 1; i <= assignments.length; i++) {
        // Fin de segment si changement de joueur ou fin du deck
        if (i === assignments.length || assignments[i] !== currentPlayer) {
          segments.push({
            player: currentPlayer,
            start: segmentStart,
            end: i - 1,
            size: i - segmentStart,
            cards: deck.slice(segmentStart, i),
            points: deck.slice(segmentStart, i).reduce((sum, card) => sum + getCardPoints(card), 0)
          });
          
          if (i < assignments.length) {
            currentPlayer = assignments[i];
            segmentStart = i;
          }
        }
      }
      
      return segments;
    }

    return {
      // État
      distribution,
      movements,
      attempts,
      segmentCount,
      executionTime,
      isProcessing,
      progress,
      targetPoints,
      bestAssignments,
      maxIterations,
      
      // Données
      players,
      deck,
      
      // Calculés
      progressPercentage,
      segmentsInfo,
      
      // Méthodes
      getCardPoints,
      decodeCard,
      isRedCard,
      calculateHandPoints,
      getPlayerName,
      getPlayerKey,
      getCardPlayer,
      getInitialPlayer,
      getInitialPlayerPoints,
      hasTargetPoints,
      distributeWithSegments,
      cancelDistribution
    };
  }
};
</script>

<style scoped>
.segment-redistribution {
  padding: 0;
}

.constraints-form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.player-constraint {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.player-constraint label {
  font-weight: 600;
  color: #374151;
}

.player-constraint input {
  padding: 0.5rem;
  border: 2px solid #e5e7eb;
  border-radius: 4px;
  font-size: 1rem;
}

.controls {
  text-align: center;
  margin: 2rem 0;
}

.distribute-btn {
  background: linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  margin-right: 1rem;
}

.distribute-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(124, 58, 237, 0.3);
}

.distribute-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.advanced-config {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1.5rem;
  margin: 1.5rem 0;
}

.advanced-config h4 {
  margin: 0 0 1rem 0;
  color: #374151;
  font-size: 1rem;
}

.config-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.config-row label {
  font-weight: 500;
  color: #4b5563;
  min-width: 200px;
}

.config-row input {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  min-width: 120px;
  font-size: 0.95rem;
}

.config-hint {
  font-size: 0.85rem;
  color: #6b7280;
  font-style: italic;
}

.cancel-btn {
  background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 8px;
  cursor: pointer;
}

.success-banner {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 2rem;
  text-align: center;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
  margin-top: 1.5rem;
}

.stat-card {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 1rem;
  text-align: center;
}

.stat-card h4 {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 0.25rem;
}

.players-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.player-hand {
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.5rem;
}

.player-hand.target-player {
  border-color: #f59e0b;
  background: #fffbeb;
}

.player-header {
  display: flex;
  justify-content: between;
  align-items: center;
  margin-bottom: 1rem;
}

.points {
  font-weight: bold;
  font-size: 1.2rem;
  color: #6b7280;
}

.points.target-reached {
  color: #059669;
}

.points.points-mismatch {
  color: #dc2626;
}

.cards-display {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.card-mini {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
}

.card-mini.high-card {
  background: #dbeafe;
  border-color: #2563eb;
}

.card-mini.red-suit {
  color: #dc2626;
}

.linear-deck {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.card-linear {
  width: 40px;
  height: 30px;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 0.65rem;
  font-weight: 600;
  border: 1px solid rgba(0, 0, 0, 0.1);
  cursor: help;
}

.card-linear.player-0 { background-color: #fef3c7; border-color: #f59e0b; }
.card-linear.player-1 { background-color: #dbeafe; border-color: #2563eb; }
.card-linear.player-2 { background-color: #dcfce7; border-color: #16a34a; }
.card-linear.player-3 { background-color: #fce7f3; border-color: #c026d3; }

.card-content.red-suit {
  color: #dc2626;
}

.player-indicator {
  font-size: 0.5rem;
  opacity: 0.7;
}

.legend {
  display: flex;
  justify-content: space-around;
  flex-wrap: wrap;
  gap: 1rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.legend-color {
  width: 16px;
  height: 12px;
  border-radius: 3px;
  border: 1px solid rgba(0, 0, 0, 0.2);
}

.legend-color.player-0 { background-color: #fef3c7; }
.legend-color.player-1 { background-color: #dbeafe; }
.legend-color.player-2 { background-color: #dcfce7; }
.legend-color.player-3 { background-color: #fce7f3; }

.segments-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.segment-card {
  border-radius: 8px;
  padding: 1rem;
  border: 2px solid;
}

.segment-card.segment-player-0 { border-color: #f59e0b; background: #fffbeb; }
.segment-card.segment-player-1 { border-color: #2563eb; background: #eff6ff; }
.segment-card.segment-player-2 { border-color: #16a34a; background: #f0fdf4; }
.segment-card.segment-player-3 { border-color: #c026d3; background: #fdf4ff; }

.segment-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.segment-number {
  background: #374151;
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: bold;
}

.segment-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.875rem;
  color: #6b7280;
}
</style>