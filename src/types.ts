export interface PlayerState {
  hp: number;
  maxHp: number;
  baseDmg: number;
  focus: number;
  maxFocus: number;
  shards: number;
  stage: number;
  parryWidthMultiplier: number; // multiplier for target zones
  gaugeSpeedMultiplier: number; // 1.0 default, lower is slower/easier
  slashDamageMultiplier: number;
  unlockedSkills: {
    chronoSlow: boolean; // Temporarily slows gauge speed
    doubleSlash: boolean; // Hits twice
    lifesteal: boolean; // Heals on Perfect hits
  };
}

export interface EnemyTemplate {
  name: string;
  hp: number;
  maxHp: number;
  baseDmg: number;
  attackInterval: number; // ms to trigger action
  color: string;
  glowColor: string;
  icon: string; // lucide icon name
  description: string;
  trait: string;
  defense: number;
}

export interface EnemyState extends EnemyTemplate {
  currentHp: number;
  chargePercent: number; // 0 to 100
  isStunned: boolean;
  stunDuration: number; // in turns/ticks
}

export interface CriticalZone {
  start: number; // percentage (0-100)
  end: number;
  type: 'perfect' | 'great' | 'good' | 'miss';
}

export interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  fontSize: string;
  type: 'damage-player' | 'damage-enemy' | 'heal' | 'perfect' | 'status';
}

export interface LogEntry {
  id: string;
  message: string;
  type: 'info' | 'player-hit' | 'player-critical' | 'enemy-hit' | 'block' | 'system' | 'heal';
  timestamp: string;
}
