import { Position, Unit, UNIT_TYPES } from './UnitTypes';

let nextUnitId = 0;

export class UnitFactory {
    /**
     * Creates a new unit of the specified type
     * 
     * @param type The type of unit to create
     * @param position The initial position
     * @param faction The unit's faction
     * @returns A new unit instance
     */
    static createUnit(
        type: string, 
        position: Position, 
        faction: 'player' | 'enemy' | 'neutral' = 'player'
    ): Unit {
        if (!UNIT_TYPES[type]) {
            throw new Error(`Unknown unit type: ${type}`);
        }
        
        const stats = UNIT_TYPES[type];
        
        const unit: Unit = {
            id: nextUnitId++,
            type,
            health: stats.health,
            maxHealth: stats.health,
            attack: stats.attack,
            defense: stats.defense,
            speed: stats.speed,
            range: stats.range,
            position: { ...position },
            selected: false,
            faction
        };
        
        return unit;
    }
} 