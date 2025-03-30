import { Position, Unit } from './UnitTypes';
import { UnitFactory } from './UnitFactory';
import { EventBus } from '../../EventBus';

export class UnitManager {
    private units: Unit[] = [];
    private selectedUnits: Unit[] = [];
    
    constructor() {}
    
    /**
     * Get all units
     */
    getUnits(): Unit[] {
        return [...this.units];
    }
    
    /**
     * Get units by faction
     */
    getUnitsByFaction(faction: 'player' | 'enemy' | 'neutral'): Unit[] {
        return this.units.filter(unit => unit.faction === faction);
    }
    
    /**
     * Get currently selected units
     */
    getSelectedUnits(): Unit[] {
        return [...this.selectedUnits];
    }
    
    /**
     * Add a new unit to the manager
     */
    addUnit(unit: Unit): void {
        this.units.push(unit);
        EventBus.emit('unit-added', unit);
    }
    
    /**
     * Create and add a new unit in one step
     */
    createUnit(type: string, position: Position, faction: 'player' | 'enemy' | 'neutral' = 'player'): Unit {
        const unit = UnitFactory.createUnit(type, position, faction);
        this.addUnit(unit);
        return unit;
    }
    
    /**
     * Remove a unit from the manager
     */
    removeUnit(unitId: number): void {
        const unitIndex = this.units.findIndex(u => u.id === unitId);
        if (unitIndex >= 0) {
            const unit = this.units[unitIndex];
            this.units.splice(unitIndex, 1);
            
            // Also remove from selected units if present
            this.deselectUnit(unitId);
            
            EventBus.emit('unit-removed', unit);
        }
    }
    
    /**
     * Select a unit
     */
    selectUnit(unitId: number): void {
        const unit = this.units.find(u => u.id === unitId);
        if (unit && !unit.selected) {
            unit.selected = true;
            this.selectedUnits.push(unit);
            EventBus.emit('unit-selected', unit);
        }
    }
    
    /**
     * Deselect a unit
     */
    deselectUnit(unitId: number): void {
        const unitIndex = this.selectedUnits.findIndex(u => u.id === unitId);
        if (unitIndex >= 0) {
            const unit = this.selectedUnits[unitIndex];
            unit.selected = false;
            this.selectedUnits.splice(unitIndex, 1);
            EventBus.emit('unit-deselected', unit);
        }
    }
    
    /**
     * Select multiple units
     */
    selectUnits(unitIds: number[]): void {
        // Deselect all first
        this.deselectAll();
        
        // Select the new units
        unitIds.forEach(id => this.selectUnit(id));
        
        if (this.selectedUnits.length > 0) {
            EventBus.emit('units-selected', this.selectedUnits);
        }
    }
    
    /**
     * Deselect all units
     */
    deselectAll(): void {
        this.selectedUnits.forEach(unit => {
            unit.selected = false;
        });
        
        const previouslySelected = [...this.selectedUnits];
        this.selectedUnits = [];
        
        if (previouslySelected.length > 0) {
            EventBus.emit('units-deselected', previouslySelected);
        }
    }
    
    /**
     * Move a unit to a new position
     */
    moveUnit(unitId: number, position: Position): void {
        const unit = this.units.find(u => u.id === unitId);
        if (unit) {
            const oldPosition = { ...unit.position };
            unit.position = { ...position };
            EventBus.emit('unit-moved', { unit, oldPosition, newPosition: position });
        } else {
            console.log(`Unit with id ${unitId} not found`);
        }
    }
    
    /**
     * Damage a unit
     */
    damageUnit(unitId: number, amount: number): boolean {
        const unit = this.units.find(u => u.id === unitId);
        if (unit) {
            unit.health = Math.max(0, unit.health - amount);
            EventBus.emit('unit-damaged', { unit, amount });
            
            // Check if unit was defeated
            if (unit.health <= 0) {
                this.removeUnit(unitId);
                return true; // Unit was defeated
            }
        }
        return false; // Unit survived
    }
    
    /**
     * Heal a unit
     */
    healUnit(unitId: number, amount: number): void {
        const unit = this.units.find(u => u.id === unitId);
        if (unit) {
            const oldHealth = unit.health;
            unit.health = Math.min(unit.maxHealth, unit.health + amount);
            const actualHealAmount = unit.health - oldHealth;
            
            if (actualHealAmount > 0) {
                EventBus.emit('unit-healed', { unit, amount: actualHealAmount });
            }
        }
    }
    
    /**
     * Find units within a certain area
     */
    getUnitsInArea(x1: number, y1: number, x2: number, y2: number): Unit[] {
        // Normalize the coordinates (in case x1 > x2 or y1 > y2)
        const minX = Math.min(x1, x2);
        const maxX = Math.max(x1, x2);
        const minY = Math.min(y1, y2);
        const maxY = Math.max(y1, y2);
        
        return this.units.filter(unit => {
            return unit.position.x >= minX && 
                   unit.position.x <= maxX && 
                   unit.position.y >= minY && 
                   unit.position.y <= maxY;
        });
    }
    
    /**
     * Clear all units
     */
    clear(): void {
        this.units = [];
        this.selectedUnits = [];
        EventBus.emit('units-cleared');
    }
} 