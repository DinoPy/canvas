interface PlayerStats {
    regen: { lastRegen: number; amount: number; multiplier: number; interval: number };
    life: { max: number; multiplier: number; current: number };
    crit: { physicalRate: number; physicalDamage: number; magicRate: number; magicDamage: number };
    attack: { physical: number; physicalMultiplier: number; magic: number; magicMultiplier: number };
    armor: { magic: number; magicMultiplier: number; physical: number, physicalMultiplier: number; };
    movement: { speed: number; multiplier: number; };
}

// Function to recursively sum the values of two objects
function sumPlayerStats(obj1: PlayerStats, obj2: PlayerStats): PlayerStats {
    const result: PlayerStats = {
        regen: sum(obj1.regen, obj2.regen),
        life: sum(obj1.life, obj2.life),
        crit: sum(obj1.crit, obj2.crit),
        attack: sum(obj1.attack, obj2.attack),
        armor: sum(obj1.armor, obj2.armor),
        movement: sum(obj1.movement, obj2.movement)
    };
    return result;
}

// Helper function to sum values of two nested objects
function sum<T extends Record<string, any>>(obj1: T, obj2: T): T {
    const result: Partial<T> = {};
    for (const key in obj1) {
        if (typeof obj1[key] === 'object' && typeof obj2[key] === 'object') {
            result[key] = sum(obj1[key], obj2[key]) as T[Extract<keyof T, string>];
        } else {
            result[key] = (obj1[key] || 0) + (obj2[key] || 0) as T[Extract<keyof T, string>];
        }
    }
    return result as T;
}


// Example usage:
const player1: PlayerStats = {
    regen: { lastRegen: 0, amount: 1, multiplier: 1, interval: 1000 },
    life: { max: 100, multiplier: 1.5, current: 100 },
    crit: { physicalRate: 0.15, physicalDamage: 0.5, magicRate: 0.15, magicDamage: 0.5 },
    attack: { physical: 35, physicalMultiplier: 1, magic: 30, magicMultiplier: 1 },
    armor: { magic: 10, magicMultiplier: 1, physical: 10, physicalMultiplier: 1 },
    movement: { speed: 8, multiplier: 1 }
};

const player2: PlayerStats = {
    regen: { lastRegen: 0, amount: 1, multiplier: 1, interval: 500 },
    life: { max: 120, multiplier: 1.5, current: 80 },
    crit: { physicalRate: 0.1, physicalDamage: 0.3, magicRate: 0.1, magicDamage: 0.3 },
    attack: { physical: 40, physicalMultiplier: 1.2, magic: 25, magicMultiplier: 0.8 },
    armor: { magic: 8, magicMultiplier: 1.1, physical: 12, physicalMultiplier: 0.9 },
    movement: { speed: 10, multiplier: 1.2 }
};

const totalStats = sumPlayerStats(player1, player2);
console.log(totalStats);

