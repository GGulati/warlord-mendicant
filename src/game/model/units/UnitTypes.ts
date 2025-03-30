// Unit base interface
export interface Unit {
    id: number;
    type: string;
    health: number;
    maxHealth: number;
    attack: number;
    defense: number;
    speed: number;
    range: number;
    position: Position;
    selected: boolean;
    faction: 'player' | 'enemy' | 'neutral';
}

// Position interface for unit location
export interface Position {
    x: number;
    y: number;
}

// Unit stat definitions by type
export interface UnitStats {
    health: number;
    attack: number;
    defense: number;
    speed: number;
    range: number;
}

// Unit type definitions
export const UNIT_TYPES: Record<string, UnitStats> = {
    'archer': { 
        health: 60, 
        attack: 12, 
        defense: 3, 
        speed: 3, 
        range: 5 
    },
    'infantry-heavy': { 
        health: 120, 
        attack: 10, 
        defense: 8, 
        speed: 2, 
        range: 1 
    },
    'infantry-medium': { 
        health: 80, 
        attack: 8, 
        defense: 5, 
        speed: 3, 
        range: 1 
    },
    'mage-high': { 
        health: 50, 
        attack: 15, 
        defense: 2, 
        speed: 2, 
        range: 4 
    },
    'mage-squad': { 
        health: 70, 
        attack: 10, 
        defense: 4, 
        speed: 3, 
        range: 3 
    }
}; 