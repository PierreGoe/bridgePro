# Bridge Dealer Application - Copilot Instructions

## Project Overview

This is a Vue.js 3 application for generating and displaying Bridge card game distributions with customizable point criteria, advanced suit distribution requirements, professional scenarios, and deck management.

## Tech Stack

- Vue.js 3 (Composition API)
- Vite (Build tool)
- CSS Vanilla (No framework)
- LocalStorage (Deck persistence)

## Key Features

- Automatically distribute 52 cards between 4 players (North, South, East, West)
- Each player receives 13 cards sorted by suit (♠ ♥ ♦ ♣)
- Automatic point calculation: Ace=4, King=3, Queen=2, Jack=1
- **Advanced criteria**: Points AND minimum cards per suit for each player
- **14 professional Bridge scenarios** organized in 7 categories
- **Deck management**: Save, organize, export/import deals in JSON format
- Allow input of point criteria per player
- Validate distributions according to defined constraints
- Display all 4 hands with their point totals and statistics
- Display message if distribution is impossible

## Components Structure

- `Card.vue`: Display a card with its suit, value and symbol
- `PlayerHand.vue`: Display a player's 13 cards and their point total
- `PlayerCriteria.vue`: Advanced criteria form (points + suit distribution)
- `DealStats.vue`: Display deal statistics (fits, long suits, balanced hands)
- `DeckManager.vue`: Manage custom decks (create, save, export/import)
- `App.vue`: Main application with distribution logic and UI

## Utils/Logic Modules

- `deckManager.js`: Deck management with localStorage (CRUD operations, JSON export/import)

## Development Guidelines

- Use Composition API for all components
- Keep code commented and clear
- Use vanilla CSS for styling (NO TailwindCSS)
- Implement proper card colors (red/black) and suit icons
- Total points must always equal 40 across all players
- Decks are persisted in localStorage and exportable as JSON
