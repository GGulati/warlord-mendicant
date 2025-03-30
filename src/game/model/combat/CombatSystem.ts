import { Unit } from '../units/UnitTypes';
import { EventBus } from '../../EventBus';

export class CombatSystem {
    /**
     * Calculate if a unit is in range of another unit
     */
    static isInRange(attacker: Unit, target: Unit): boolean {
        const distance = this.calculateDistance(attacker.position, target.position);
        return distance <= attacker.range * 50; // Range in pixels
    }
    
    /**
     * Calculate the distance between two positions
     */
    static calculateDistance(pos1: { x: number, y: number }, pos2: { x: number, y: number }): number {
        const dx = pos2.x - pos1.x;
        const dy = pos2.y - pos1.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    /**
     * Calculate combat damage
     */
    static calculateDamage(attacker: Unit, defender: Unit): number {
        // Basic damage formula with some randomness
        const baseDamage = attacker.attack - (defender.defense / 2);
        const minDamage = Math.max(1, Math.floor(baseDamage * 0.8));
        const maxDamage = Math.ceil(baseDamage * 1.2);
        
        return Math.floor(minDamage + Math.random() * (maxDamage - minDamage + 1));
    }
    
    /**
     * Perform an attack between two units
     * Returns true if the defender was defeated
     */
    static performAttack(attacker: Unit, defender: Unit): boolean {
        // Check if the units are in range
        if (!this.isInRange(attacker, defender)) {
            return false;
        }
        
        // Calculate and apply damage
        const damage = this.calculateDamage(attacker, defender);
        defender.health = Math.max(0, defender.health - damage);
        
        // Emit combat event
        EventBus.emit('combat-attack', {
            attacker,
            defender,
            damage,
            defenderRemainingHealth: defender.health
        });
        
        // Check if defender was defeated
        const defeated = defender.health <= 0;
        if (defeated) {
            EventBus.emit('combat-defeat', {
                attacker,
                defender
            });
        }
        
        return defeated;
    }
    
    /**
     * Find closest enemy to a unit
     */
    static findClosestEnemy(unit: Unit, units: Unit[]): Unit | null {
        // Filter out units of the same faction
        const enemies = units.filter(u => u.faction !== unit.faction);
        
        if (enemies.length === 0) {
            return null;
        }
        
        // Find the closest enemy
        let closestEnemy = enemies[0];
        let closestDistance = this.calculateDistance(unit.position, closestEnemy.position);
        
        for (let i = 1; i < enemies.length; i++) {
            const enemy = enemies[i];
            const distance = this.calculateDistance(unit.position, enemy.position);
            
            if (distance < closestDistance) {
                closestDistance = distance;
                closestEnemy = enemy;
            }
        }
        
        return closestEnemy;
    }
    
    /**
     * Find all enemies in attack range
     */
    static findEnemiesInRange(unit: Unit, units: Unit[]): Unit[] {
        return units.filter(u => 
            u.faction !== unit.faction && 
            this.isInRange(unit, u)
        );
    }
} 