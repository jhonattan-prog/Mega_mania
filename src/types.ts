import { EnemyType, MovementPattern, PowerUpType } from './config';

export interface WaveConfig {
  enemyType: EnemyType;
  speed: number;
  fireIntervalMin: number;
  fireIntervalMax: number;
  energyDrainPerSecond: number;
}

export interface GameState {
  score: number;
  lives: number;
  energy: number;
  level: number;
  waveCleared: boolean;
  gameOver: boolean;
}

export interface EnemyData {
  sprite: Phaser.GameObjects.Sprite;
  body: Phaser.Physics.Arcade.Body;
  row: number;
  col: number;
  baseX: number;
  fireTimer: number;
  canFire: boolean;
}

export type GameSceneType = 'menu' | 'playing' | 'gameover' | 'levelup';

// New types for modern refactor

export interface ComboState {
  count: number;
  lastKillTime: number;
  multiplier: number;
  active: boolean;
}

export interface GameStats {
  enemiesDestroyed: number;
  shotsFired: number;
  shotsHit: number;
  powerUpsCollected: number;
  maxCombo: number;
  timePlayed: number;
  startTime: number;
}

export interface ActivePowerUp {
  type: PowerUpType;
  remainingTime: number;
  duration: number;
}

export interface ParticleConfig {
  x: number;
  y: number;
  color: number;
  count: number;
  speed: { min: number; max: number };
  duration: number;
  size: { min: number; max: number };
  gravity?: number;
  fadeOut?: boolean;
  glow?: boolean;
}

export interface StarLayer {
  stars: { x: number; y: number; size: number; alpha: number; twinkleSpeed: number }[];
  speed: number;
  depth: number;
}

export type QualityLevel = 'low' | 'medium' | 'high';

export interface GameSettings {
  quality: QualityLevel;
  volume: number;
  musicEnabled: boolean;
  sfxEnabled: boolean;
  touchControlType: 'buttons' | 'joystick';
}