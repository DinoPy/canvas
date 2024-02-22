
export interface ServerToClientEvents {
    gameData: (data: { MAP: MapType, OBSTACLES: MapType, gameRooms: GameRoomsType[] }) => void;
    playersData: (data: { pl: { [key: string]: PlayerType }, bl: ProjectileType[], bffs: BuffObjectType[] }) => void;
    damageTaken: (dmgDetails: { damage: number; isCrit: boolean }) => void;
    damageDealt: (dmgDetails: { to: string; damage: number; isCrit: boolean }) => void;
    playerBuffCollision: (data: { name: string; buff: { name: string, tier: number } }) => void;
    playerBuffExpire: (data: { name: string, buffName: string }) => void;
    theRoomWasCreated: (gameConfig: { name: string; id: string, number: number, maxPlayers: number, onlinePlayers: number }) => void;
    failedToValidateRoomPw: () => void;
    playerJoinedRoom: () => void;

}

export interface ClientToServerEvents {
    createRoom: (data: { name: string, password: string, maxPlayers: number }) => void;
    joinRoom: (config: { roomId: string, playerName: string, avatarIndex: number, password: string }) => void;
    userReady: (data: { name: string; avatarIndex: number }) => void;
    playerMovement: (controls: keyControlsType) => void;
    shoot: (bullet: emitProjectileArgType) => void;
    dash: () => void;
    attackMelee1: () => void;
    stopAttacking: (state: "idle" | "run" | "attack") => void;
    ability: (data: { name: AbilitiesType; x: number; y: number; angle: number }) => void;
}

export interface InterServerEvents {
    ping: () => void;
}

export interface SocketData {
    roomId: string;
}

export type GameRoomsType = {
    id: string;
    name: string;
    maxPlayers: number;
    onlinePlayers: number;
}
export interface GameType {
    name: string;
    id: string;
    gameConfig: { maxPlayers: number };
    pickableBuffConfig: { respawnTime: number; maxNumber: number };
    players: { [key: string]: PlayerType };
    projectiles: ProjectileType[];
    pickableBuffs: BuffObjectType[];
};

export interface PlayerType {
    id: string;
    name: string;
    avatarIndex: number;
    roomId: string;
    x: number; hbPaddingX: number;
    y: number; hbPaddingY: number;
    width: number; hbWidth: number;
    height: number; hbHeight: number;
    keyControls: keyControlsType;
    isAttacking: boolean;
    state: "idle" | "attack" | "run";
    direction: "down" | "up" | "left" | "right";
    projectileCount: number;
    dash: { isDashing: boolean, dashStart: null | number, cooldown: number, dashDuration: number };
    attack1_alreadyHit: string[];
    playerStats: PlayerStats;
    playerBuffStats: PlayerStats;
    buffs: { [key in BuffKey]: { since: number, name: string, duration: number, tier: number } } | {};
    abilities: { [key in AbilitiesType]: number }
}

export interface ProjectileType {
    name: AbilitiesType;
    x: number; width: number;
    y: number; height: number;
    angle: number;
    ownerId: string;
    roomId: string;
    life: number;
    velocity: number;
    abilityProps: AbilityProps;
    enemiesHit: string[];
}

export interface BuffObjectType {
    x: number; y: number;
    type: BuffKey;
    duration: number;
    createdAt: Date;
    name: string;
    tier: number;
    roomId: string;
}

export interface PlayerStats {
    regen: { lastRegen: number; amount: number; multiplier: number; interval: number };
    life: { max: number; multiplier: number; current: number };
    crit: { physicalRate: number; physicalDamage: number; magicRate: number; magicDamage: number };
    attack: { physical: number; physicalMultiplier: number; magic: number; magicMultiplier: number };
    armor: { magic: number; magicMultiplier: number; physical: number, physicalMultiplier: number; };
    movement: { speed: number; multiplier: number; };
}

export type InnerBuffProps = { speed: number; multiplier: number; } | { amount: number; multiplier: number } | { physical?: number; physicalMultiplier?: number; magic?: number, magicMultiplier?: number } | { physical?: number; physicalMultiplier?: number; magic?: number, magicMultiplier?: number } | { physicalRate?: number; magicRate?: number; physicalDamage?: number; magicDamage?: number };

export type BuffKey = "minorSwiftness" | "mediumSwiftness" | "majorSwiftness" | "rejuvenationMinor" | "rejuvenationMedium" | "rejuvenationMajor" |
    "minorFortification" | "mediumFortification" | "majorFortification" | "minorWarding" | "mediumWarding" | "majorWarding" |
    "minorStrengthening" | "mediumStrengthening" | "majorStrengthening" | "minorEnchantment" | "mediumEnchantment" | "majorEnchantment" |
    "minorPrecision" | "mediumPrecision" | "majorPrecision" | "minorDevastation" | "mediumDevastation" | "majorDevastation"


export type BuffList = {
    movement?: InnerBuffProps;
    regen?: InnerBuffProps;
    armor?: InnerBuffProps;
    attack?: InnerBuffProps;
    crit?: InnerBuffProps;
}

export type BuffType<K extends BuffKey> = {
    [key in K]: { duration: number; name: string; tier: number } & BuffList;
}

export type MapType = ({ id: number } | undefined)[][];

export type keyControlsType = { up: boolean, down: boolean, left: boolean, right: boolean };

export type emitProjectileArgType = { name: AbilitiesType; angle: number; x: number; y: number };

export interface SquareColisionParams { x: number; y: number; width: number; height: number }


export type ElementTypes = "none" | "water" | "fire" | "ice";
export type DirectionTypes = "up" | "down" | "left" | "right";
export interface HitboxTypes {
    pOffsetX: number;
    pOffsetY: number;
    width: number;
    height: number;
}
export interface AbilityProps {
    multiplier: number;
    element: ElementTypes,
    type: "physical" | "magic" | "utility",
    isMelee: boolean;
    hitbox: { [key in DirectionTypes]: HitboxTypes },
    cooldown: number;
    duration: number;
    velocity: number;
    applyBuff: string | null;
}
export type AbilitiesType = "melee1" | "movement1" | "range1" | "range2" | "range3" | "melee2";
