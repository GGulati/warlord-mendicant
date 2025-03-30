import { WorldState, WorldConfig } from './world/WorldState';
import { UnitManager } from './units/UnitManager';
import { Position, Unit } from './units/UnitTypes';
import { EventBus } from '../EventBus';

/**
 * GameModel serves as the main interface to the game model layer
 * It coordinates world state, units, and combat
 */
export class GameModel {
    private worldState: WorldState;
    private gameId: string;
    private paused: boolean = false;
    
    // For real-time updates
    private lastUpdate: number = -1;
    private updateInterval: number = 100; // ms between updates (10 updates per second)
    
    /**
     * Create a new game model
     */
    constructor(config: WorldConfig) {
        this.gameId = `game_${Date.now()}`;
        this.worldState = new WorldState(config);
    }
    
    /**
     * Initialize the game
     */
    initialize(): void {
        this.worldState.initialize();
        this.lastUpdate = -1;
        EventBus.emit('game-initialized', this);
    }
    
    /**
     * Get the unique game ID
     */
    getGameId(): string {
        return this.gameId;
    }
    
    /**
     * Get the world state
     */
    getWorldState(): WorldState {
        return this.worldState;
    }
    
    /**
     * Get the unit manager
     */
    getUnitManager(): UnitManager {
        return this.worldState.getUnitManager();
    }
    
    /**
     * Update game state in real-time
     * This should be called from the scene's update method
     */
    update(time: number, _delta: number): void {
        if (this.lastUpdate == -1) {
            this.lastUpdate = time
        }
        if (this.paused) return;
        
        // Only update at the specified interval
        if (time - this.lastUpdate >= this.updateInterval) {
            this.lastUpdate -= this.updateInterval;
            
            // Update AI for enemy units
            this.updateEnemyUnits();
            
            // Process combat for all units
            this.checkAllCombat();
            
            // Check for game over
            this.checkGameOver();
        }
    }
    
    /**
     * Update AI behavior for enemy units
     */
    private updateEnemyUnits(): void {
        const enemies = this.getUnitManager().getUnitsByFaction('enemy');
        const playerUnits = this.getUnitManager().getUnitsByFaction('player');
        
        if (enemies.length === 0 || playerUnits.length === 0) return;
        
        // Very simple AI: each enemy moves toward the nearest player unit if not in attack range
        enemies.forEach(enemy => {
            // Find nearest player unit
            let closestUnit = playerUnits[0];
            let closestDistance = Number.MAX_VALUE;
            
            playerUnits.forEach(unit => {
                const dx = unit.position.x - enemy.position.x;
                const dy = unit.position.y - enemy.position.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestUnit = unit;
                }
            });
            
            // If not in attack range, move toward player
            const attackRange = enemy.range * 50; // Range in pixels
            if (closestDistance > attackRange) {
                // Move toward player unit
                const speed = enemy.speed * 2; // Speed in pixels per update
                const direction = {
                    x: (closestUnit.position.x - enemy.position.x) / closestDistance,
                    y: (closestUnit.position.y - enemy.position.y) / closestDistance
                };
                
                const newPosition = {
                    x: enemy.position.x + direction.x * speed,
                    y: enemy.position.y + direction.y * speed
                };
                
                this.worldState.moveUnit(enemy.id, newPosition);
            }
        });
    }
    
    /**
     * Check combat for all units
     */
    private checkAllCombat(): void {
        const allUnits = this.getUnitManager().getUnits();
        
        // For each unit, check if it can attack an enemy
        allUnits.forEach(unit => {
            this.worldState.checkCombatForUnit(unit.id);
        });
    }
    
    /**
     * Move a unit to a new position
     */
    moveUnit(unitId: number, position: Position): void {
        if (this.paused) return;
        
        this.worldState.moveUnit(unitId, position);
    }
    
    /**
     * Select a unit or units
     */
    selectUnits(unitIds: number[]): void {
        this.getUnitManager().selectUnits(unitIds);
    }
    
    /**
     * Deselect all units
     */
    deselectAllUnits(): void {
        this.getUnitManager().deselectAll();
    }
    
    /**
     * Get all the units
     */
    getUnits(): Unit[] {
        return this.getUnitManager().getUnits();
    }
    
    /**
     * Get the selected units
     */
    getSelectedUnits(): Unit[] {
        return this.getUnitManager().getSelectedUnits();
    }
    
    /**
     * Pause the game
     */
    pause(): void {
        this.paused = true;
        EventBus.emit('game-paused');
    }
    
    /**
     * Resume the game
     */
    resume(): void {
        this.paused = false;
        this.lastUpdate = Date.now();
        EventBus.emit('game-resumed');
    }
    
    /**
     * Check if the game is paused
     */
    isPaused(): boolean {
        return this.paused;
    }
    
    /**
     * Check if the game is over
     */
    private checkGameOver(): void {
        const gameStatus = this.worldState.isGameOver();
        
        if (gameStatus.over) {
            this.paused = true;
            EventBus.emit('game-over', {
                winner: gameStatus.winner,
                gameId: this.gameId
            });
        }
    }
    
    /**
     * Reset the game
     */
    reset(): void {
        this.worldState.reset();
        this.paused = false;
        this.lastUpdate = Date.now();
        EventBus.emit('game-reset', this.gameId);
    }
} 