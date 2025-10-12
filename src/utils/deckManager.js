/**
 * Module de gestion des decks de Bridge
 * Gère la sauvegarde, l'organisation et l'export/import des donnes
 */

const STORAGE_KEY = "bridge_dealer_decks";

// Charger les decks depuis le localStorage
export const loadDecks = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Erreur lors du chargement des decks:", error);
    return [];
  }
};

// Sauvegarder les decks dans le localStorage
export const saveDecks = (decks) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(decks));
    return true;
  } catch (error) {
    console.error("Erreur lors de la sauvegarde des decks:", error);
    return false;
  }
};

// Créer un nouveau deck
export const createDeck = (name, description = "") => {
  const decks = loadDecks();
  const newDeck = {
    id: Date.now().toString(),
    name,
    description,
    hands: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  decks.push(newDeck);
  saveDecks(decks);
  return newDeck;
};

// Ajouter une main à un deck
export const addHandToDeck = (deckId, hand, metadata = {}) => {
  const decks = loadDecks();
  const deck = decks.find((d) => d.id === deckId);

  if (!deck) return false;

  const newHand = {
    id: Date.now().toString(),
    deal: hand,
    metadata: {
      savedAt: new Date().toISOString(),
      scenario: metadata.scenario || null,
      criteria: metadata.criteria || null,
      notes: metadata.notes || "",
    },
  };

  deck.hands.push(newHand);
  deck.updatedAt = new Date().toISOString();
  saveDecks(decks);
  return true;
};

// Supprimer une main d'un deck
export const removeHandFromDeck = (deckId, handId) => {
  const decks = loadDecks();
  const deck = decks.find((d) => d.id === deckId);

  if (!deck) return false;

  deck.hands = deck.hands.filter((h) => h.id !== handId);
  deck.updatedAt = new Date().toISOString();
  saveDecks(decks);
  return true;
};

// Supprimer un deck complet
export const deleteDeck = (deckId) => {
  const decks = loadDecks();
  const filteredDecks = decks.filter((d) => d.id !== deckId);
  saveDecks(filteredDecks);
  return true;
};

// Renommer un deck
export const renameDeck = (deckId, newName, newDescription = null) => {
  const decks = loadDecks();
  const deck = decks.find((d) => d.id === deckId);

  if (!deck) return false;

  deck.name = newName;
  if (newDescription !== null) {
    deck.description = newDescription;
  }
  deck.updatedAt = new Date().toISOString();
  saveDecks(decks);
  return true;
};

// Exporter un deck au format JSON
export const exportDeck = (deckId) => {
  const decks = loadDecks();
  const deck = decks.find((d) => d.id === deckId);

  if (!deck) return null;

  return JSON.stringify(deck, null, 2);
};

// Exporter tous les decks au format JSON
export const exportAllDecks = () => {
  const decks = loadDecks();
  return JSON.stringify(decks, null, 2);
};

// Importer un deck depuis JSON
export const importDeck = (jsonString) => {
  try {
    const importedDeck = JSON.parse(jsonString);

    // Validation basique
    if (!importedDeck.name || !Array.isArray(importedDeck.hands)) {
      throw new Error("Format de deck invalide");
    }

    const decks = loadDecks();

    // Générer un nouvel ID pour éviter les conflits
    importedDeck.id = Date.now().toString();
    importedDeck.importedAt = new Date().toISOString();
    importedDeck.updatedAt = new Date().toISOString();

    decks.push(importedDeck);
    saveDecks(decks);
    return importedDeck;
  } catch (error) {
    console.error("Erreur lors de l'import du deck:", error);
    return null;
  }
};

// Obtenir les statistiques d'un deck
export const getDeckStats = (deckId) => {
  const decks = loadDecks();
  const deck = decks.find((d) => d.id === deckId);

  if (!deck) return null;

  const stats = {
    totalHands: deck.hands.length,
    scenarios: {},
    avgPoints: { north: 0, south: 0, east: 0, west: 0 },
    totalPoints: 0,
  };

  // Calculer les statistiques
  deck.hands.forEach((hand) => {
    // Compter les scénarios
    if (hand.metadata.scenario) {
      const scenarioName = hand.metadata.scenario.name || "Sans scénario";
      stats.scenarios[scenarioName] = (stats.scenarios[scenarioName] || 0) + 1;
    }
  });

  return stats;
};

// Filtrer les mains d'un deck selon des critères
export const filterHands = (deckId, filters) => {
  const decks = loadDecks();
  const deck = decks.find((d) => d.id === deckId);

  if (!deck) return [];

  let filteredHands = [...deck.hands];

  // Filtre par scénario
  if (filters.scenario) {
    filteredHands = filteredHands.filter(
      (h) => h.metadata.scenario?.name === filters.scenario
    );
  }

  // Filtre par notes
  if (filters.searchText) {
    filteredHands = filteredHands.filter((h) =>
      h.metadata.notes?.toLowerCase().includes(filters.searchText.toLowerCase())
    );
  }

  return filteredHands;
};

// Dupliquer un deck
export const duplicateDeck = (deckId) => {
  const decks = loadDecks();
  const deck = decks.find((d) => d.id === deckId);

  if (!deck) return null;

  const duplicatedDeck = {
    ...deck,
    id: Date.now().toString(),
    name: `${deck.name} (Copie)`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  decks.push(duplicatedDeck);
  saveDecks(decks);
  return duplicatedDeck;
};
