export const GAME_CONFIG = {
  width: 320,
  height: 480,
  scaleMode: Phaser.Scale.FIT,
  autoCenter: Phaser.Scale.CENTER_BOTH,
} as const;

// Modern neon color palette
export const COLORS = {
  black: 0x000000,
  white: 0xffffff,
  red: 0xff0000,
  green: 0x00ff00,
  blue: 0x00ffff,
  yellow: 0xffff00,
  magenta: 0xff00ff,
  orange: 0xff8800,
  cyan: 0x00ffff,
  darkGreen: 0x008800,
  darkRed: 0x880000,
  // Modern neon additions
  neonCyan: 0x00e5ff,
  neonPink: 0xff2d95,
  neonPurple: 0xb44aff,
  neonGreen: 0x39ff14,
  neonOrange: 0xff6e27,
  neonYellow: 0xfbff00,
  deepSpace: 0x0a0a1a,
  nebulaPurple: 0x1a0a2e,
  nebulaBlue: 0x0a1a3e,
  uiGlass: 0x1a1a2e,
  uiGlassLight: 0x2a2a4e,
  uiAccent: 0x00e5ff,
  uiBorder: 0x3a3a5e,
} as const;

export const ENEMY_TYPES = [
  { name: 'burger', color: 0xff8844, accent: 0x884422, glow: 0xff6622, movement: 'zigzag' as const },
  { name: 'cookie', color: 0xddaa66, accent: 0x886633, glow: 0xeebb77, movement: 'spiral' as const },
  { name: 'iron', color: 0xaaaaaa, accent: 0x666666, glow: 0xcccccc, movement: 'kamikaze' as const },
  { name: 'bowtie', color: 0xff4488, accent: 0xaa2255, glow: 0xff66aa, movement: 'wave' as const },
  { name: 'diamond', color: 0x00ffff, accent: 0x0088aa, glow: 0x44ffff, movement: 'teleport' as const },
] as const;

export const GAME_CONSTANTS = {
  playerSpeed: 200,
  playerBulletSpeed: -500,
  enemyBulletSpeed: 200,
  enemyBaseSpeed: 30,
  enemyZigzagAmplitude: 60,
  enemyZigzagFrequency: 0.02,
  energyDrainPerSecond: 8,
  energyRefillAmount: 100,
  maxEnergy: 100,
  initialLives: 3,
  enemyFireInterval: { min: 1500, max: 3000 },
  enemyRows: 3,
  enemyCols: 8,
  enemySpacingX: 36,
  enemySpacingY: 32,
  startY: -40,
  waveClearBonus: 1000,
  enemyScore: 100,
  speedIncreasePerLevel: 1.15,
  fireRateIncreasePerLevel: 0.9,
  energyDrainIncreasePerLevel: 1.1,
};

export const VFX_CONFIG = {
  // Particle explosion
  explosionParticleCount: 24,
  explosionParticleSpeed: { min: 40, max: 120 },
  explosionParticleDuration: 600,
  explosionParticleSize: { min: 2, max: 5 },
  // Screen shake
  screenShakeIntensity: 4,
  screenShakeDuration: 200,
  screenShakeDeathIntensity: 8,
  screenShakeDeathDuration: 400,
  // Slow motion
  slowMoDuration: 200,
  slowMoScale: 0.3,
  // Bullet trail
  bulletTrailLength: 6,
  bulletTrailAlpha: 0.4,
  // Glow
  glowRadius: 4,
  glowAlpha: 0.3,
  // Starfield
  starfieldLayers: 3,
  starfieldDensity: [30, 20, 12],
  starfieldSpeed: [0.2, 0.5, 1.0],
  starfieldSize: [1, 2, 3],
  // Combo
  comboTimeWindow: 1500,
  comboScoreMultiplier: [1, 1.5, 2, 3, 5],
} as const;

export const POWERUP_CONFIG = {
  dropChance: 0.10,
  types: [
    { id: 'shield', name: 'ESCUDO', color: 0x00e5ff, duration: 5000, icon: '🛡️' },
    { id: 'rapidfire', name: 'RAPID FIRE', color: 0xff2d95, duration: 5000, icon: '⚡' },
    { id: 'multiplier', name: '2X SCORE', color: 0xfbff00, duration: 10000, icon: '💎' },
    { id: 'energy', name: 'ENERGY', color: 0x39ff14, duration: 0, icon: '🔋' },
  ],
  floatSpeed: 80,
  rotationSpeed: 0.03,
  bobAmplitude: 4,
  bobFrequency: 0.005,
  glowPulseSpeed: 0.008,
} as const;

// Background gradient colors per level
export const LEVEL_BACKGROUNDS = [
  { top: 0x0a0a2e, bottom: 0x0a1a3e },   // Deep blue
  { top: 0x1a0a2e, bottom: 0x0a0a3e },   // Purple
  { top: 0x1a0a1a, bottom: 0x2a0a1a },   // Dark magenta
  { top: 0x0a1a1a, bottom: 0x0a2a2a },   // Teal
  { top: 0x1a0a0a, bottom: 0x2a0a0a },   // Dark red
] as const;

export type EnemyType = typeof ENEMY_TYPES[number]['name'];
export type MovementPattern = typeof ENEMY_TYPES[number]['movement'];
export type PowerUpType = typeof POWERUP_CONFIG.types[number]['id'];