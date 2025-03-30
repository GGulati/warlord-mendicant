import { UnitManager } from '../units/UnitManager';
import { Position } from '../units/UnitTypes';
import { CombatSystem } from '../combat/CombatSystem';
import { EventBus } from '../../EventBus';

export interface WorldConfig {
    width: number;
    height: number;
    terrainType?: 'plains' | 'forest' | 'mountains' | 'desert';
}

export class WorldState {
    private unitManager: UnitManager;
    private config: WorldConfig;
    private combatCooldowns: Map<number, number> = new Map(); // Unit ID -> cooldown time
    private defaultCooldown: number = 1000; // 1 second cooldown between attacks
    
    constructor(config: WorldConfig) {
        this.config = config;
        this.unitManager = new UnitManager();
    }
    
    /**
     * Initialize the world with units
     */
    initialize(): void {
        this.spawnInitialUnits();
        EventBus.emit('world-initialized', this);
    }
    
    /**
     * Generate initial units for both factions
     */
    private spawnInitialUnits(): void {
        const unitTypes = ['archer', 'infantry-heavy', 'infantry-medium', 'mage-high', 'mage-squad'];
        
        // Create player units at the bottom of the map
        for (let i = 0; i < 3; i++) {
            unitTypes.forEach((type, index) => {
                const x = 200 + (index * 100) + (Math.random() * 50 - 25);
                const y = this.config.height - 200 + (Math.random() * 100 - 50);
                this.unitManager.createUnit(type, { x, y }, 'player');
            });
        }
        
        // Create enemy units at the top of the map
        for (let i = 0; i < 3; i++) {
            unitTypes.forEach((type, index) => {
                const x = 200 + (index * 100) + (Math.random() * 50 - 25);
                const y = 200 + (Math.random() * 100 - 50);
                this.unitManager.createUnit(type, { x, y }, 'enemy');
            });
        }
    }
    
    /**
     * Get the unit manager
     */
    getUnitManager(): UnitManager {
        return this.unitManager;
    }
    
    /**
     * Get the world config
     */
    getConfig(): WorldConfig {
        return { ...this.config };
    }
    
    /**
     * Move a unit to a new position
     */
    moveUnit(unitId: number, position: Position): void {
        this.unitManager.moveUnit(unitId, position);
    }
    
    /**
     * Process combat between two units with cooldown
     */
    processCombat(attackerId: number, defenderId: number, currentTime: number = Date.now()): boolean {
        // Check if attacker is in cooldown
        const cooldown = this.combatCooldowns.get(attackerId) || 0;
        if (currentTime < cooldown) {
            return false; // Still in cooldown
        }
        
        const units = this.unitManager.getUnits();
        const attacker = units.find(u => u.id === attackerId);
        const defender = units.find(u => u.id === defenderId);
        
        if (!attacker || !defender) {
            return false;
        }
        
        const defeated = CombatSystem.performAttack(attacker, defender);
        
        if (defeated) {
            this.unitManager.removeUnit(defenderId);
        }
        
        // Set cooldown for attacker based on unit type
        // Faster units have lower cooldown
        const attackCooldown = this.defaultCooldown * (1 / attacker.speed);
        this.combatCooldowns.set(attackerId, currentTime + attackCooldown);
        
        return defeated;
    }
    
    /**
     * Check for combat for a unit with its nearby enemies
     */
    checkCombatForUnit(unitId: number): void {
        const currentTime = Date.now();
        const units = this.unitManager.getUnits();
        const unit = units.find(u => u.id === unitId);
        
        if (!unit) {
            return;
        }
        
        // Check if unit is in cooldown
        const cooldown = this.combatCooldowns.get(unitId) || 0;
        if (currentTime < cooldown) {
            return; // Still in cooldown
        }
        
        // Find enemies in range
        const enemiesInRange = CombatSystem.findEnemiesInRange(unit, units);
        
        if (enemiesInRange.length > 0) {
            // Attack the first enemy in range
            const enemy = enemiesInRange[0];
            this.processCombat(unit.id, enemy.id, currentTime);
        }
    }
    
    /**
     * Check if the game is over
     */
    isGameOver(): { over: boolean, winner: 'player' | 'enemy' | null } {
        const playerUnits = this.unitManager.getUnitsByFaction('player');
        const enemyUnits = this.unitManager.getUnitsByFaction('enemy');
        
        if (playerUnits.length === 0) {
            return { over: true, winner: 'enemy' };
        }
        
        if (enemyUnits.length === 0) {
            return { over: true, winner: 'player' };
        }
        
        return { over: false, winner: null };
    }
    
    /**
     * Reset the world state
     */
    reset(): void {
        this.unitManager.clear();
        this.combatCooldowns.clear();
        this.spawnInitialUnits();
        
        EventBus.emit('world-reset');
    }
} 