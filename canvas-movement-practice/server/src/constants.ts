import { parseCsvMap } from "./utility";
import { MapType, BuffType, BuffKey, ElementTypes, DirectionTypes, HitboxTypes, AbilitiesType, AbilityProps } from "./types";

export const MAP: MapType = parseCsvMap("mapDesert_Ground");
export const OBSTACLES: MapType = parseCsvMap("mapDesert_Objects");
export const TICK_RATE: number = 60;
export const TILE_SIZE: number = 32;

export const BUFFS: BuffType<BuffKey> = {
    minorSwiftness: { movement: { speed: 0, multiplier: 0.2 }, duration: 30, name: "Minor Swiftness", tier: 1 },
    mediumSwiftness: { movement: { speed: 0, multiplier: 0.4 }, duration: 22, name: "Medium Swiftness", tier: 2 },
    majorSwiftness: { movement: { speed: 0, multiplier: 0.6 }, duration: 15, name: "Major Swiftness", tier: 3 },
    rejuvenationMinor: { regen: { amount: 0, multiplier: 0.25 }, duration: 30, name: "Minor Rejuvenation", tier: 1 },
    rejuvenationMedium: { regen: { amount: 0, multiplier: 0.50 }, duration: 22, name: "Medium Rejuvenation", tier: 2 },
    rejuvenationMajor: { regen: { amount: 0, multiplier: 1 }, duration: 15, name: "Major Rejuvenation", tier: 3 },
    minorFortification: { armor: { physical: 0, physicalMultiplier: 0.25 }, duration: 30, name: "Minor Fortification", tier: 1 },
    mediumFortification: { armor: { physical: 0, physicalMultiplier: 0.50 }, duration: 22, name: "Medium Fortification", tier: 2 },
    majorFortification: { armor: { physical: 0, physicalMultiplier: 1 }, duration: 15, name: "Major Fortification", tier: 3 },
    minorWarding: { armor: { magic: 0, magicMultiplier: 0.25 }, duration: 30, name: "Minor Warding", tier: 1 },
    mediumWarding: { armor: { magic: 0, magicMultiplier: 0.50 }, duration: 22, name: "Medium Warding", tier: 2 },
    majorWarding: { armor: { magic: 0, magicMultiplier: 1 }, duration: 15, name: "Major Warding", tier: 3 },
    minorStrengthening: { attack: { physical: 0, physicalMultiplier: 0.2 }, duration: 30, name: "Minor Strengthening", tier: 1 },
    mediumStrengthening: { attack: { physical: 0, physicalMultiplier: 0.4 }, duration: 22, name: "Medium Strengthening", tier: 2 },
    majorStrengthening: { attack: { physical: 0, physicalMultiplier: 0.6 }, duration: 15, name: "Major Strengthening", tier: 3 },
    minorEnchantment: { attack: { magic: 0, magicMultiplier: 0.2 }, duration: 30, name: "Minor Enchantment", tier: 1 },
    mediumEnchantment: { attack: { magic: 0, magicMultiplier: 0.4 }, duration: 22, name: "Medium Enchantment", tier: 2 },
    majorEnchantment: { attack: { magic: 0, magicMultiplier: 0.6 }, duration: 15, name: "Major Enchantment", tier: 3 },
    minorPrecision: { crit: { physicalRate: 0.05, magicRate: 0.05 }, duration: 30, name: "Minor Precision", tier: 1 },
    mediumPrecision: { crit: { physicalRate: 0.1, magicRate: 0.1 }, duration: 22, name: "Medium Precision", tier: 2 },
    majorPrecision: { crit: { physicalRate: 0.15, magicRate: 0.15 }, duration: 15, name: "Major Precision", tier: 3 },
    minorDevastation: { crit: { physicalDamage: 0.1, magicDamage: 0.1 }, duration: 30, name: "Minor Devastation", tier: 1 },
    mediumDevastation: { crit: { physicalDamage: 0.2, magicDamage: 0.2 }, duration: 22, name: "Medium Devastation", tier: 2 },
    majorDevastation: { crit: { physicalDamage: 0.3, magicDamage: 0.3 }, duration: 15, name: "Major Devastation", tier: 3 },
}

export const ABILITIES: { [key in AbilitiesType]: AbilityProps } = {
    melee1: {
        multiplier: 1,
        element: "none",
        type: "physical",
        isMelee: true,
        hitbox: {
            up: { pOffsetX: 10, pOffsetY: 0, width: 75, height: 30, },
            down: { pOffsetX: 10, pOffsetY: 65, width: 75, height: 30, },
            right: { pOffsetX: 48, pOffsetY: 15, width: 35, height: 70, },
            left: { pOffsetX: 0, pOffsetY: 10, width: 35, height: 70, },
        },
        cooldown: Math.trunc((1000 / TICK_RATE) * 15 * 2), // time per frame * number of frames * animatin stutter.
        duration: Math.trunc((1000 / TICK_RATE) * 15 * 2),
        velocity: 0,
        applyBuff: null,
    },
    movement1: {
        multiplier: 0,
        element: "none",
        type: "utility",
        isMelee: false,
        hitbox: {
            up: { pOffsetX: 0, pOffsetY: 0, width: 0, height: 0, },
            down: { pOffsetX: 0, pOffsetY: 0, width: 0, height: 0, },
            right: { pOffsetX: 0, pOffsetY: 0, width: 0, height: 0, },
            left: { pOffsetX: 0, pOffsetY: 0, width: 0, height: 0, },
        },
        cooldown: 2500,
        duration: 300,
        velocity: 0,
        applyBuff: null,
    },
    range1: {
        multiplier: 0.6,
        element: "none",
        type: "physical",
        isMelee: false,
        hitbox: {
            up: { pOffsetX: 0, pOffsetY: 0, width: 16, height: 11, },
            down: { pOffsetX: 0, pOffsetY: 0, width: 16, height: 11, },
            right: { pOffsetX: 0, pOffsetY: 0, width: 16, height: 11, },
            left: { pOffsetX: 0, pOffsetY: 0, width: 16, height: 11, },
        },
        cooldown: 600,
        duration: 1000,
        velocity: 25,
        applyBuff: null,
    },
    range2: {
        multiplier: 0.7,
        element: "water",
        type: "magic",
        isMelee: false,
        hitbox: {
            up: { pOffsetX: 0, pOffsetY: 0, width: 50, height: 65, },
            down: { pOffsetX: 0, pOffsetY: 0, width: 25, height: 25, },
            right: { pOffsetX: 0, pOffsetY: 0, width: 25, height: 25, },
            left: { pOffsetX: 0, pOffsetY: 0, width: 25, height: 25, },
        },
        cooldown: 5000,
        duration: 2000,
        velocity: 15,
        applyBuff: "slow",
    },
    range3: {
        multiplier: 1.3,
        element: "ice",
        type: "magic",
        isMelee: false,
        hitbox: {
            up: { pOffsetX: 0, pOffsetY: 0, width: 25, height: 25, },
            down: { pOffsetX: 0, pOffsetY: 0, width: 25, height: 25, },
            right: { pOffsetX: 0, pOffsetY: 0, width: 25, height: 25, },
            left: { pOffsetX: 0, pOffsetY: 0, width: 25, height: 25, },
        },
        cooldown: 5000,
        duration: 2000,
        velocity: 35,
        applyBuff: "freeze",
    },
    melee2: {
        multiplier: 1,
        element: "none",
        type: "physical",
        isMelee: true,
        hitbox: {
            up: { pOffsetX: 10, pOffsetY: 0, width: 75, height: 30, },
            down: { pOffsetX: 10, pOffsetY: 65, width: 75, height: 30, },
            right: { pOffsetX: 48, pOffsetY: 15, width: 35, height: 70, },
            left: { pOffsetX: 0, pOffsetY: 10, width: 35, height: 70, },
        },
        cooldown: Math.trunc((1000 / TICK_RATE) * 15 * 2), // time per frame * number of frames * animatin stutter.
        duration: Math.trunc((1000 / TICK_RATE) * 15 * 2),
        velocity: 0,
        applyBuff: null,
    },
}
