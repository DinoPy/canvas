
export interface ServerToClientEvents {
    map: (data: { MAP: MapType, OBSTACLES: MapType }) => void;
    playersData: (data: { pl: { [key: string]: PlayerType }, bl: BulletType[], bffs: BuffObjectType[] }) => void;
    damageTaken: (dmgDetails: { damage: number; isCrit: boolean }) => void;
    damageDealt: (dmgDetails: { to: string; damage: number; isCrit: boolean }) => void;
    playerBuffCollision: (data: { name: string; buff: { name: string, tier: number } }) => void;
    playerBuffExpire: (data: { name: string, buffName: string }) => void;
}

export interface ClientToServerEvents {
    userReady: (data: { name: string; avatarIndex: number }) => void;
    playerMovement: (controls: keyControlsType) => void;
    shoot: (bullet: emitBulletArgType) => void;
    dash: () => void;
    attackMelee1: () => void;
    stopAttacking: (state: "idle" | "run" | "attack") => void;
}

export interface InterServerEvents {
    ping: () => void;
}

export interface SocketData {
}

export interface PlayerType {
    id: string;
    name: string;
    avatarIndex: number;
    x: number; hbPaddingX: number;
    y: number; hbPaddingY: number;
    width: number; hbWidth: number;
    height: number; hbHeight: number;
    keyControls: keyControlsType;
    score: number;
    isAttacking: boolean;
    state: "idle" | "attack" | "run";
    direction: "down" | "up" | "left" | "right";
    bulletCount: number;
    dash: { isDashing: boolean, dashStart: null | number, cooldown: number, dashDuration: number };
    attack1_alreadyHit: string[];
    playerStats: PlayerStats;
    playerBuffStats: PlayerStats;
    buffs: { [key in BuffKey]: { since: number, name: string, duration: number, tier: number } } | {};
}

export interface BulletType {
    x: number; width: number;
    y: number; height: number;
    angle: number;
    ownerId: string;
    life: number;
    score: number;
}

export interface BuffObjectType {
    x: number; y: number;
    type: BuffKey;
    duration: number;
    createdAt: Date;
    name: string;
    tier: number;
}

export interface PlayerStats {
    regen: { lastRegen: number; amount: number; multiplier: number; interval: number };
    life: { max: number; multiplier: number; current: number };
    crit: { physicalRate: number; physicalDamage: number; magicRate: number; magicDamage: number };
    attack: { physical: number; physicalMultiplier: number; magic: number; magicMultiplier: number };
    armor: { magic: number; magicMultiplier: number; physical: number, physicalMultiplier: number; };
    movement: { speed: number; multiplier: number; };
}

export type InnerBuffProps = MovementBuff | RegenBuff | AttackArmorBuff | CritBuff;
export type BuffProps = { [key in innerPropTypes]: number };

export type BuffKey = "minorSwiftness" | "mediumSwiftness" | "majorSwiftness" | "rejuvenationMinor" | "rejuvenationMedium" | "rejuvenationMajor" |
    "minorFortification" | "mediumFortification" | "majorFortification" | "minorWarding" | "mediumWarding" | "majorWarding" |
    "minorStrengthening" | "mediumStrengthening" | "majorStrengthening" | "minorEnchantment" | "mediumEnchantment" | "majorEnchantment" |
    "minorPrecision" | "mediumPrecision" | "majorPrecision" | "minorDevastation" | "mediumDevastation" | "majorDevastation"

export type innerPropTypes = "lastRegen" | "amount" | "multiplier" | "interval" | "max" | "current" | "physicalRate" | "physicalDamage" | "magicRate" | "magicDamage" | "physical" | "physicalMultiplier" | "magic" | "magicMultiplier" | "speed";

export type MovementBuff = {speed: number; multiplier: number };
export type RegenBuff = {amount: number; multiplier: number };
export type AttackArmorBuff = {physical?: number; physicalMultiplier?: number; magic?: number; magicMultiplier?: number };
export type CritBuff = {physicalRate?: number; magicRate?: number; physicalDamage?: number; magicDamage?: number};

export type BuffList = {
    movement?: MovementBuff;
    regen?: RegenBuff;
    armor?: AttackArmorBuff;
    attack?: AttackArmorBuff;
    crit?: CritBuff;
}

export type BuffType<K extends BuffKey> = {
    [key in K]: { duration: number; name: string; tier: 1 | 2 | 3 } & BuffList;
}

export type MapType = ({ id: number } | undefined)[][];

export type keyControlsType = { up: boolean, down: boolean, left: boolean, right: boolean };

export type emitBulletArgType = { angle: number; x: number; y: number };

export interface SquareColisionParams { x: number; y: number; width: number; height: number }
