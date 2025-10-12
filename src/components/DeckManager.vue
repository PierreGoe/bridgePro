<template>
  <div class="deck-manager">
    <!-- Barre d'actions principale -->
    <div class="deck-actions">
      <button @click="showCreateModal = true" class="btn-primary">
        ➕ Créer un nouveau deck
      </button>
      <button @click="showImportModal = true" class="btn-secondary">
        📥 Importer un deck
      </button>
      <button
        @click="exportAllDecksToFile"
        class="btn-secondary"
        :disabled="decks.length === 0"
      >
        📤 Exporter tous les decks
      </button>
    </div>

    <!-- Liste des decks -->
    <div v-if="decks.length === 0" class="empty-state">
      <p>Aucun deck sauvegardé.</p>
      <p class="subtitle">
        Créez votre premier deck ou générez une donne et sauvegardez-la !
      </p>
    </div>

    <div v-else class="decks-list">
      <div v-for="deck in decks" :key="deck.id" class="deck-card">
        <div class="deck-header" @click="toggleDeckExpanded(deck.id)">
          <div class="deck-info">
            <h3>{{ deck.name }}</h3>
            <p v-if="deck.description" class="deck-description">
              {{ deck.description }}
            </p>
            <div class="deck-meta">
              <span>{{ deck.hands.length }} donne(s)</span>
              <span>•</span>
              <span>Créé le {{ formatDate(deck.createdAt) }}</span>
            </div>
          </div>
          <div class="deck-actions-menu" @click.stop>
            <button
              @click.stop="toggleDeckExpanded(deck.id)"
              class="btn-icon btn-expand"
              :title="expandedDeckId === deck.id ? 'Réduire' : 'Développer'"
            >
              <span class="expand-icon">{{
                expandedDeckId === deck.id ? "▲" : "▼"
              }}</span>
              <span class="expand-text">{{
                expandedDeckId === deck.id ? "Réduire" : "Voir"
              }}</span>
            </button>
            <button
              @click.stop="startRenameDeck(deck)"
              class="btn-icon"
              title="Renommer"
            >
              ✏️
            </button>
            <button
              @click.stop="exportDeckToFile(deck.id)"
              class="btn-icon"
              title="Exporter ce deck"
            >
              📤
            </button>
            <button
              @click.stop="duplicateDeckAction(deck.id)"
              class="btn-icon"
              title="Dupliquer"
            >
              📋
            </button>
            <button
              @click.stop="deleteDeckAction(deck.id)"
              class="btn-icon btn-danger"
              title="Supprimer"
            >
              🗑️
            </button>
          </div>
        </div>

        <!-- Mains du deck (expandable) -->
        <div v-if="expandedDeckId === deck.id" class="deck-hands">
          <div v-if="deck.hands.length === 0" class="empty-hands">
            Aucune donne dans ce deck
          </div>
          <div v-else class="hands-grid">
            <div v-for="hand in deck.hands" :key="hand.id" class="hand-card">
              <div class="hand-header">
                <span v-if="hand.metadata.scenario" class="hand-scenario">
                  📋 {{ hand.metadata.scenario.name }}
                </span>
                <span class="hand-date">{{
                  formatDate(hand.metadata.savedAt)
                }}</span>
                <button
                  @click="removeHandFromDeckAction(deck.id, hand.id)"
                  class="btn-icon-small"
                  title="Supprimer cette donne"
                >
                  ❌
                </button>
              </div>

              <!-- Affichage des 4 mains -->
              <div class="four-hands">
                <div
                  v-for="player in ['north', 'south', 'east', 'west']"
                  :key="player"
                  class="mini-hand"
                >
                  <div class="player-label">{{ getPlayerLabel(player) }}</div>
                  <div class="mini-cards">
                    <div
                      v-for="suit in ['spades', 'hearts', 'diamonds', 'clubs']"
                      :key="suit"
                      class="mini-suit"
                    >
                      <span :class="['suit-symbol', getSuitColor(suit)]">{{
                        getSuitSymbol(suit)
                      }}</span>
                      <span class="card-values">{{
                        formatCards(
                          organizeCardsBySuit(hand.deal[player])[suit]
                        )
                      }}</span>
                    </div>
                  </div>
                  <div class="mini-points">
                    {{ calculatePoints(hand.deal[player]) }} pts
                  </div>
                </div>
              </div>

              <!-- Notes -->
              <div v-if="hand.metadata.notes" class="hand-notes">
                💬 {{ hand.metadata.notes }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de création de deck -->
    <div
      v-if="showCreateModal"
      class="modal-overlay"
      @click="showCreateModal = false"
    >
      <div class="modal-content" @click.stop>
        <h3>Créer un nouveau deck</h3>
        <div class="form-group">
          <label>Nom du deck</label>
          <input
            v-model="newDeckName"
            type="text"
            placeholder="Ex: Ouvertures majeures"
            @keyup.enter="createDeckAction"
          />
        </div>
        <div class="form-group">
          <label>Description (optionnelle)</label>
          <textarea
            v-model="newDeckDescription"
            placeholder="Ex: Collection de mains pour pratiquer les ouvertures en majeure"
          ></textarea>
        </div>
        <div class="modal-actions">
          <button
            @click="createDeckAction"
            class="btn-primary"
            :disabled="!newDeckName.trim()"
          >
            Créer
          </button>
          <button @click="showCreateModal = false" class="btn-secondary">
            Annuler
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de renommage -->
    <div
      v-if="showRenameModal"
      class="modal-overlay"
      @click="showRenameModal = false"
    >
      <div class="modal-content" @click.stop>
        <h3>Renommer le deck</h3>
        <div class="form-group">
          <label>Nouveau nom</label>
          <input
            v-model="renameDeckName"
            type="text"
            @keyup.enter="confirmRenameDeck"
          />
        </div>
        <div class="form-group">
          <label>Description</label>
          <textarea v-model="renameDeckDescription"></textarea>
        </div>
        <div class="modal-actions">
          <button
            @click="confirmRenameDeck"
            class="btn-primary"
            :disabled="!renameDeckName.trim()"
          >
            Renommer
          </button>
          <button @click="showRenameModal = false" class="btn-secondary">
            Annuler
          </button>
        </div>
      </div>
    </div>

    <!-- Modal d'import -->
    <div
      v-if="showImportModal"
      class="modal-overlay"
      @click="showImportModal = false"
    >
      <div class="modal-content" @click.stop>
        <h3>Importer un deck</h3>
        <div class="form-group">
          <label>Sélectionner un fichier JSON</label>
          <input type="file" @change="handleFileImport" accept=".json" />
        </div>
        <div class="modal-actions">
          <button @click="showImportModal = false" class="btn-secondary">
            Annuler
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from "vue";
import {
  loadDecks,
  createDeck,
  deleteDeck,
  renameDeck,
  exportDeck,
  exportAllDecks,
  importDeck,
  removeHandFromDeck,
  duplicateDeck,
} from "../utils/deckManager.js";

export default {
  name: "DeckManager",
  setup() {
    const decks = ref([]);
    const expandedDeckId = ref(null);
    const showCreateModal = ref(false);
    const showRenameModal = ref(false);
    const showImportModal = ref(false);
    const newDeckName = ref("");
    const newDeckDescription = ref("");
    const renameDeckId = ref(null);
    const renameDeckName = ref("");
    const renameDeckDescription = ref("");

    // Charger les decks au montage
    onMounted(() => {
      refreshDecks();
    });

    const refreshDecks = () => {
      const currentExpandedId = expandedDeckId.value;
      decks.value = loadDecks();
      // Vérifier si le deck expandé existe toujours
      if (
        currentExpandedId &&
        decks.value.find((d) => d.id === currentExpandedId)
      ) {
        expandedDeckId.value = currentExpandedId;
      } else {
        expandedDeckId.value = null;
      }
    };

    const toggleDeckExpanded = (deckId) => {
      expandedDeckId.value = expandedDeckId.value === deckId ? null : deckId;
    };

    const createDeckAction = () => {
      if (!newDeckName.value.trim()) return;
      createDeck(newDeckName.value.trim(), newDeckDescription.value.trim());
      refreshDecks();
      showCreateModal.value = false;
      newDeckName.value = "";
      newDeckDescription.value = "";
    };

    const startRenameDeck = (deck) => {
      renameDeckId.value = deck.id;
      renameDeckName.value = deck.name;
      renameDeckDescription.value = deck.description || "";
      showRenameModal.value = true;
    };

    const confirmRenameDeck = () => {
      if (!renameDeckName.value.trim()) return;
      renameDeck(
        renameDeckId.value,
        renameDeckName.value.trim(),
        renameDeckDescription.value.trim()
      );
      refreshDecks();
      showRenameModal.value = false;
      renameDeckId.value = null;
      renameDeckName.value = "";
      renameDeckDescription.value = "";
    };

    const deleteDeckAction = (deckId) => {
      const deck = decks.value.find((d) => d.id === deckId);
      if (!deck) return;

      if (
        confirm(
          `Êtes-vous sûr de vouloir supprimer le deck "${deck.name}" et toutes ses donnes ?`
        )
      ) {
        deleteDeck(deckId);
        refreshDecks();
        if (expandedDeckId.value === deckId) {
          expandedDeckId.value = null;
        }
      }
    };

    const duplicateDeckAction = (deckId) => {
      duplicateDeck(deckId);
      refreshDecks();
    };

    const removeHandFromDeckAction = (deckId, handId) => {
      if (confirm("Supprimer cette donne du deck ?")) {
        removeHandFromDeck(deckId, handId);
        refreshDecks();
      }
    };

    const exportDeckToFile = (deckId) => {
      const jsonData = exportDeck(deckId);
      const deck = decks.value.find((d) => d.id === deckId);
      if (!jsonData || !deck) return;

      downloadJSON(
        jsonData,
        `bridge_deck_${deck.name.replace(/\s+/g, "_")}.json`
      );
    };

    const exportAllDecksToFile = () => {
      const jsonData = exportAllDecks();
      downloadJSON(jsonData, "bridge_all_decks.json");
    };

    const downloadJSON = (jsonData, filename) => {
      const blob = new Blob([jsonData], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    };

    const handleFileImport = (event) => {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const imported = importDeck(e.target.result);
        if (imported) {
          refreshDecks();
          showImportModal.value = false;
          alert(`Deck "${imported.name}" importé avec succès !`);
        } else {
          alert(
            "Erreur lors de l'import du deck. Vérifiez le format du fichier."
          );
        }
      };
      reader.readAsText(file);
    };

    const formatDate = (isoDate) => {
      const date = new Date(isoDate);
      return date.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    };

    const getPlayerLabel = (player) => {
      const labels = { north: "N", south: "S", east: "E", west: "O" };
      return labels[player];
    };

    const getSuitSymbol = (suit) => {
      const symbols = { spades: "♠", hearts: "♥", diamonds: "♦", clubs: "♣" };
      return symbols[suit];
    };

    const getSuitColor = (suit) => {
      return suit === "hearts" || suit === "diamonds" ? "red" : "black";
    };

    const organizeCardsBySuit = (cards) => {
      if (!Array.isArray(cards))
        return { spades: [], hearts: [], diamonds: [], clubs: [] };

      const suits = {
        spades: [],
        hearts: [],
        diamonds: [],
        clubs: [],
      };

      cards.forEach((card) => {
        if (card && card.suit && suits[card.suit]) {
          suits[card.suit].push(card);
        }
      });

      // Trier chaque couleur
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
      Object.keys(suits).forEach((suit) => {
        suits[suit].sort((a, b) => {
          return cardOrder.indexOf(a.value) - cardOrder.indexOf(b.value);
        });
      });

      return suits;
    };

    const formatCards = (cards) => {
      if (!cards || cards.length === 0) return "-";
      return cards.map((c) => c.value).join(" ");
    };

    const calculatePoints = (cards) => {
      if (!cards) return 0;

      let points = 0;
      const pointValues = { A: 4, K: 3, Q: 2, J: 1 };

      // Si c'est un tableau de cartes (format actuel)
      if (Array.isArray(cards)) {
        cards.forEach((card) => {
          if (card && card.value) {
            points += pointValues[card.value] || 0;
          }
        });
      }
      // Si c'est un objet avec des couleurs (ancien format)
      else if (typeof cards === "object") {
        const suits = ["spades", "hearts", "diamonds", "clubs"];
        suits.forEach((suit) => {
          const suitCards = cards[suit];
          if (Array.isArray(suitCards)) {
            suitCards.forEach((card) => {
              if (card && card.value) {
                points += pointValues[card.value] || 0;
              }
            });
          }
        });
      }

      return points;
    };

    return {
      decks,
      expandedDeckId,
      showCreateModal,
      showRenameModal,
      showImportModal,
      newDeckName,
      newDeckDescription,
      renameDeckName,
      renameDeckDescription,
      toggleDeckExpanded,
      createDeckAction,
      startRenameDeck,
      confirmRenameDeck,
      deleteDeckAction,
      duplicateDeckAction,
      removeHandFromDeckAction,
      exportDeckToFile,
      exportAllDecksToFile,
      handleFileImport,
      formatDate,
      getPlayerLabel,
      getSuitSymbol,
      getSuitColor,
      organizeCardsBySuit,
      formatCards,
      calculatePoints,
    };
  },
};
</script>
