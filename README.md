# Warlord Mendicant: Real-Time Tactics Game

Warlord Mendicant is a real-time tactics game inspired by Total War: Warhammer, built with Phaser 3 and React.

https://ggulati.github.io/warlord-mendicant/

## Game Features

- **Real-time tactical combat**: Control multiple units simultaneously in a fast-paced environment
- **Diverse unit types**: Command archers, heavy infantry, medium infantry, high mages, and mage squads
- **Strategic gameplay**: Position your units for maximum effectiveness against enemy forces
- **Unit selection**: Select individual units or use selection box to control groups
- **MVC architecture**: Fully separated model, view, and controller for maintainable codebase

## How to Play

- **Left-click**: Select units (individual clicks or drag selection box)
- **Right-click**: Move selected units to position
- **Pause button**: Temporarily halt gameplay

## Technical Implementation

This game implements a proper MVC pattern:
- **Model**: Game state management in `src/game/model/`
- **View**: Rendering handled by Phaser in `src/game/scenes/`
- **Controller**: User input captured in the Game scene

The architecture allows for headless operation and AI gameplay without the rendering layer.

---

## Local Development

[Node.js](https://nodejs.org) is required to install dependencies and run scripts via `npm`.

## Available Commands

| Command | Description |
|---------|-------------|
| `npm install` | Install project dependencies |
| `npm run dev` | Launch a development web server |
| `npm run build` | Create a production build in the `dist` folder |
| `npm run dev-nolog` | Launch a development web server without sending anonymous data (see "About log.js" below) |
| `npm run build-nolog` | Create a production build in the `dist` folder without sending anonymous data (see "About log.js" below) |
