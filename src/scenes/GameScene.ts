import Phaser from 'phaser';
import { GAME_CONFIG, GAME_CONSTANTS, COLORS, ENEMY_TYPES, POWERUP_CONFIG, VFX_CONFIG } from '../config';
import { AudioManager } from '../managers/AudioManager';
import { ParticleManager } from '../managers/ParticleManager';
import { StarfieldManager } from '../managers/StarfieldManager';
import { Player } from '../entities/Player';
import { BulletPool } from '../entities/Bullet';
import { EnemyGroup } from '../entities/Enemy';
import { PowerUpPool } from '../entities/PowerUp';
import { HUD } from '../ui/HUD';
import { GameStats } from '../types';

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private bulletPool!: BulletPool;
  private enemyGroup!: EnemyGroup;
  private powerUpPool!: PowerUpPool;
  private hud!: HUD;
  private audioManager!: AudioManager;
  private particles!: ParticleManager;
  private starfield!: StarfieldManager;

  private score = 0;
  private lives = GAME_CONSTANTS.initialLives;
  private energy = GAME_CONSTANTS.maxEnergy;
  private level = 0;
  private currentWaveEnemyType = 0;

  private waveActive = false;
  private waveTransition = false;
  private gameOverState = false;
  private invulnerable = false;
  private invulnerableTimer = 0;

  private energyDrainRate = GAME_CONSTANTS.energyDrainPerSecond;
  private enemySpeed = GAME_CONSTANTS.enemyBaseSpeed;
  private enemyFireMin = GAME_CONSTANTS.enemyFireInterval.min;
  private enemyFireMax = GAME_CONSTANTS.enemyFireInterval.max;

  private fireCooldownTimer = 0;

  private energyShake = false;

  // Stats tracking
  private stats: GameStats = {
    enemiesDestroyed: 0,
    shotsFired: 0,
    shotsHit: 0,
    powerUpsCollected: 0,
    maxCombo: 0,
    timePlayed: 0,
    startTime: 0,
  };

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: { audioManager: AudioManager }): void {
    if (data.audioManager) {
      this.audioManager = data.audioManager;
    } else {
      this.audioManager = new AudioManager();
      this.audioManager.init();
    }
  }

  create(): void {
    this.resetState();

    // Background
    this.starfield = new StarfieldManager(this);

    // Particles
    this.particles = new ParticleManager(this);

    this.createEntities();
    this.setupCollisions();

    this.hud = new HUD(this);
    this.hud.updateScore(this.score);
    this.hud.updateLives(this.lives);

    // Start music
    this.audioManager.startMusic();

    this.startNextWave();
  }

  private resetState(): void {
    this.score = 0;
    this.lives = GAME_CONSTANTS.initialLives;
    this.energy = GAME_CONSTANTS.maxEnergy;
    this.level = 0;
    this.currentWaveEnemyType = 0;
    this.waveActive = false;
    this.waveTransition = false;
    this.gameOverState = false;
    this.invulnerable = false;
    this.invulnerableTimer = 0;
    this.energyShake = false;
    this.energyDrainRate = GAME_CONSTANTS.energyDrainPerSecond;
    this.enemySpeed = GAME_CONSTANTS.enemyBaseSpeed;
    this.enemyFireMin = GAME_CONSTANTS.enemyFireInterval.min;
    this.enemyFireMax = GAME_CONSTANTS.enemyFireInterval.max;
    this.stats = {
      enemiesDestroyed: 0,
      shotsFired: 0,
      shotsHit: 0,
      powerUpsCollected: 0,
      maxCombo: 0,
      timePlayed: 0,
      startTime: Date.now(),
    };
  }

  private createEntities(): void {
    this.player = new Player(this);
    this.bulletPool = new BulletPool(this);
    this.enemyGroup = new EnemyGroup(this);
    this.powerUpPool = new PowerUpPool(this);

    // Player fire event
    this.events.on('player-fire', (x: number, y: number) => {
      this.bulletPool.firePlayerBullet(x, y);
      this.audioManager.playLaser();
      this.stats.shotsFired++;
    });

    // Power-up expired event
    this.events.on('powerup-expired', (_type: string) => {
      // Could add visual/audio feedback here
    });
  }

  private setupCollisions(): void {
    // Manual collision checks via timer
    this.time.addEvent({
      delay: 16,
      loop: true,
      callback: () => this.checkBulletCollisions(),
    });
  }

  private checkBulletCollisions(): void {
    if (this.gameOverState) return;

    // Player bullets hit enemies
    const pBullets = this.bulletPool.getAllPlayerBullets();
    const enemies = this.enemyGroup.getActiveEnemies();

    for (const bullet of pBullets) {
      for (const enemy of enemies) {
        if (!enemy.active || !bullet.active) continue;
        if (this.checkCollision(bullet.getBounds(), enemy.getBounds())) {
          this.onBulletHitEnemy(bullet, enemy);
          break;
        }
      }
    }

    // Enemy bullets hit player
    const eBullets = this.bulletPool.getAllEnemyBullets();
    if (!this.invulnerable && this.player.active) {
      for (const bullet of eBullets) {
        if (!bullet.active) continue;
        if (this.checkCollision(bullet.getBounds(), this.player.getBounds())) {
          // Check shield
          if (this.player.hasShield) {
            bullet.setActive(false);
            bullet.setVisible(false);
            (bullet.body as Phaser.Physics.Arcade.Body).enable = false;
            bullet.setVelocity(0, 0);
            this.particles.sparks(bullet.x, bullet.y, COLORS.neonCyan);
            this.audioManager.playShield();
          } else {
            this.onBulletHitPlayer(bullet);
          }
          break;
        }
      }
    }

    // Enemies hit player
    if (!this.invulnerable && this.player.active) {
      for (const enemy of enemies) {
        if (!enemy.active) continue;
        if (this.checkCollision(enemy.getBounds(), this.player.getBounds())) {
          if (this.player.hasShield) {
            // Shield absorbs the hit, enemy dies
            enemy.setActive(false);
            enemy.setVisible(false);
            (enemy.body as Phaser.Physics.Arcade.Body).enable = false;
            enemy.setVelocity(0, 0);
            this.particles.explode(enemy.x, enemy.y, ENEMY_TYPES[enemy.typeIndex].color, 12);
            this.audioManager.playShield();
          } else {
            this.onPlayerHitEnemyDirect(enemy);
          }
          break;
        }
      }
    }

    // Player collects power-ups
    const activePowerUps = this.powerUpPool.getActive();
    for (const pu of activePowerUps) {
      if (!pu.active || !this.player.active) continue;
      if (this.checkCollision(pu.getBounds(), this.player.getBounds())) {
        this.onCollectPowerUp(pu);
      }
    }
  }

  private checkCollision(a: Phaser.Geom.Rectangle, b: Phaser.Geom.Rectangle): boolean {
    return Phaser.Geom.Intersects.RectangleToRectangle(a, b);
  }

  update(time: number, delta: number): void {
    if (this.gameOverState) return;

    const dt = delta / 1000;

    // Update systems
    this.starfield.update(time, delta);
    this.particles.update(delta);
    this.player.update(time, delta);
    this.bulletPool.update();
    this.enemyGroup.update(time, delta);
    this.powerUpPool.update(time, delta);

    // Update energy
    this.updateEnergy(dt, time);

    // Fire enemy bullets
    this.updateEnemyFire(time, delta);

    // Check invulnerability
    if (this.invulnerable) {
      this.invulnerableTimer -= delta;
      this.player.setAlpha(Math.sin(time * 0.015) > 0 ? 1 : 0.3);
      if (this.invulnerableTimer <= 0) {
        this.invulnerable = false;
        this.player.setAlpha(1);
      }
    }

    // Update HUD
    this.hud.updateEnergy(this.energy, GAME_CONSTANTS.maxEnergy, time);
    this.hud.update(time);

    // Check wave clear
    if (this.waveActive && this.enemyGroup.countActive() === 0) {
      this.onWaveCleared();
    }

    // Track time
    this.stats.timePlayed = Date.now() - this.stats.startTime;
  }

  private updateEnergy(dt: number, time: number): void {
    if (this.waveTransition) return;

    this.energy -= this.energyDrainRate * dt;
    this.energy = Math.max(0, this.energy);

    // Flash energy bar when low
    const low = this.energy < 20;
    if (low !== this.energyShake) {
      this.energyShake = low;
      this.hud.flashEnergyBar(low);
    }

    if (this.energy <= 0) {
      this.onPlayerDeath();
    }
  }

  private updateEnemyFire(time: number, delta: number): void {
    if (!this.waveActive || this.waveTransition) return;

    this.fireCooldownTimer -= delta;

    if (this.fireCooldownTimer <= 0) {
      const bottomEnemies = this.enemyGroup.getBottomMostEnemies();
      if (bottomEnemies.length > 0) {
        const enemy = Phaser.Utils.Array.GetRandom(bottomEnemies);
        if (enemy.active) {
          this.bulletPool.fireEnemyBullet(enemy.x, enemy.y + 16);
          this.fireCooldownTimer = Phaser.Math.Between(this.enemyFireMin, this.enemyFireMax);
        }
      }
    }
  }

  private startNextWave(): void {
    this.level++;
    this.currentWaveEnemyType = (this.level - 1) % ENEMY_TYPES.length;

    // Update background
    this.starfield.setLevel(this.level);

    // Increase difficulty
    this.enemySpeed = GAME_CONSTANTS.enemyBaseSpeed * Math.pow(GAME_CONSTANTS.speedIncreasePerLevel, this.level - 1);
    this.enemyFireMin = Math.max(500, GAME_CONSTANTS.enemyFireInterval.min * Math.pow(GAME_CONSTANTS.fireRateIncreasePerLevel, this.level - 1));
    this.enemyFireMax = Math.max(1000, GAME_CONSTANTS.enemyFireInterval.max * Math.pow(GAME_CONSTANTS.fireRateIncreasePerLevel, this.level - 1));
    this.energyDrainRate = GAME_CONSTANTS.energyDrainPerSecond * Math.pow(GAME_CONSTANTS.energyDrainIncreasePerLevel, this.level - 1);

    // Refill energy
    this.energy = GAME_CONSTANTS.maxEnergy;

    // Spawn formation
    const rows = Math.min(GAME_CONSTANTS.enemyRows + Math.floor((this.level - 1) / 2), 5);
    const cols = GAME_CONSTANTS.enemyCols;
    const spacingX = GAME_CONSTANTS.enemySpacingX;
    const spacingY = GAME_CONSTANTS.enemySpacingY;
    const startX = (GAME_CONFIG.width - (cols - 1) * spacingX) / 2;
    const startY = GAME_CONSTANTS.startY;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (Math.random() < 0.15) continue;

        const enemy = this.enemyGroup.getInactiveEnemy(this.currentWaveEnemyType);
        if (enemy) {
          const x = startX + col * spacingX;
          const y = startY + row * spacingY;
          enemy.spawn(x, y, row, col, this.enemySpeed, this.enemyFireMin, this.enemyFireMax);
        }
      }
    }

    this.waveActive = true;
    this.waveTransition = false;
    this.fireCooldownTimer = 2000;
    this.hud.updateLevel(this.level);
    this.audioManager.playLevelUp();

    this.showWaveStart();
  }

  private showWaveStart(): void {
    const enemyTypeName = ENEMY_TYPES[this.currentWaveEnemyType].name.toUpperCase();
    const typeColor = '#' + ENEMY_TYPES[this.currentWaveEnemyType].color.toString(16).padStart(6, '0');

    const fontFamily = "'Press Start 2P', 'Courier New', monospace";

    const waveText = this.add.text(
      GAME_CONFIG.width / 2,
      GAME_CONFIG.height / 2 - 20,
      `WAVE ${this.level}`,
      {
        fontFamily,
        fontSize: '14px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 4,
      }
    ).setDepth(200).setOrigin(0.5, 0.5).setScale(0);

    const nameText = this.add.text(
      GAME_CONFIG.width / 2,
      GAME_CONFIG.height / 2 + 8,
      enemyTypeName,
      {
        fontFamily,
        fontSize: '10px',
        color: typeColor,
        stroke: '#000000',
        strokeThickness: 3,
      }
    ).setDepth(200).setOrigin(0.5, 0.5).setAlpha(0);

    // Bounce in
    this.tweens.add({
      targets: waveText,
      scaleX: 1,
      scaleY: 1,
      duration: 300,
      ease: 'Back.easeOut',
    });

    this.tweens.add({
      targets: nameText,
      alpha: 1,
      delay: 200,
      duration: 300,
    });

    // Fade out
    this.tweens.add({
      targets: [waveText, nameText],
      alpha: 0,
      duration: 800,
      delay: 1800,
      onComplete: () => { waveText.destroy(); nameText.destroy(); },
    });
  }

  private onWaveCleared(): void {
    this.waveActive = false;
    this.waveTransition = true;
    this.energy = GAME_CONSTANTS.maxEnergy;
    this.score += GAME_CONSTANTS.waveClearBonus;
    this.hud.updateScore(this.score);
    this.hud.showWaveClear(this.level);
    this.audioManager.playLevelUp();

    // Celebration particles
    this.particles.celebrate(GAME_CONFIG.width, GAME_CONFIG.height);

    // Infinite mode — always start next wave
    this.time.delayedCall(3000, () => this.startNextWave());
  }

  private onBulletHitEnemy(bullet: Phaser.Physics.Arcade.Sprite, enemy: Phaser.Physics.Arcade.Sprite): void {
    const enemyObj = enemy as any;
    const enemyColor = ENEMY_TYPES[enemyObj.typeIndex]?.color ?? COLORS.orange;

    bullet.setActive(false);
    bullet.setVisible(false);
    (bullet.body as Phaser.Physics.Arcade.Body).enable = false;
    bullet.setVelocity(0, 0);

    enemy.setActive(false);
    enemy.setVisible(false);
    (enemy.body as Phaser.Physics.Arcade.Body).enable = false;
    enemy.setVelocity(0, 0);

    // Combo system
    const time = this.time.now;
    const multiplier = this.hud.registerKill(time);
    const comboCount = this.hud.getComboCount();

    if (comboCount > this.stats.maxCombo) {
      this.stats.maxCombo = comboCount;
    }

    if (comboCount >= 2) {
      this.audioManager.playCombo(comboCount);
    }

    // Calculate score with multiplier
    const baseScore = GAME_CONSTANTS.enemyScore;
    const finalScore = Math.round(baseScore * multiplier * this.player.scoreMultiplier);
    this.score += finalScore;

    this.hud.updateScore(this.score);
    this.hud.updateScorePopup(enemy.x, enemy.y, finalScore, multiplier * this.player.scoreMultiplier);
    this.stats.enemiesDestroyed++;
    this.stats.shotsHit++;

    // Effects
    this.audioManager.playExplosion();
    this.particles.explode(enemy.x, enemy.y, enemyColor);
    this.particles.shake(VFX_CONFIG.screenShakeIntensity * 0.7, 100);

    // Try spawn power-up
    this.powerUpPool.trySpawn(enemy.x, enemy.y);
  }

  private onPlayerHitEnemyDirect(enemy: Phaser.Physics.Arcade.Sprite): void {
    if (this.invulnerable) return;
    enemy.setActive(false);
    enemy.setVisible(false);
    (enemy.body as Phaser.Physics.Arcade.Body).enable = false;
    enemy.setVelocity(0, 0);

    this.onPlayerDeath();
  }

  private onBulletHitPlayer(bullet: Phaser.Physics.Arcade.Sprite): void {
    bullet.setActive(false);
    bullet.setVisible(false);
    (bullet.body as Phaser.Physics.Arcade.Body).enable = false;
    bullet.setVelocity(0, 0);

    this.onPlayerDeath();
  }

  private onCollectPowerUp(pu: any): void {
    const typeConfig = POWERUP_CONFIG.types.find(t => t.id === pu.powerUpType);
    if (!typeConfig) return;

    pu.deactivate();
    this.stats.powerUpsCollected++;

    // Apply power-up effect
    switch (pu.powerUpType) {
      case 'shield':
        this.player.addPowerUp('shield', typeConfig.duration);
        this.audioManager.playShield();
        break;
      case 'rapidfire':
        this.player.addPowerUp('rapidfire', typeConfig.duration);
        this.audioManager.playPowerUp();
        break;
      case 'multiplier':
        this.player.addPowerUp('multiplier', typeConfig.duration);
        this.audioManager.playPowerUp();
        break;
      case 'energy':
        this.energy = Math.min(GAME_CONSTANTS.maxEnergy, this.energy + 50);
        this.audioManager.playPowerUp();
        break;
    }

    // Visual feedback
    this.particles.powerUpCollect(pu.x, pu.y, typeConfig.color);
    this.hud.showPowerUpNotification(typeConfig.name, typeConfig.color);
  }

  private onPlayerDeath(): void {
    if (this.invulnerable || this.gameOverState) return;

    this.lives--;
    this.hud.updateLives(this.lives);
    this.audioManager.playPlayerHit();

    // Epic death effects
    this.particles.explodePlayer(this.player.x, this.player.y);
    this.particles.shake(VFX_CONFIG.screenShakeDeathIntensity, VFX_CONFIG.screenShakeDeathDuration);
    this.particles.slowMo();

    this.player.setVisible(false);
    this.player.setActive(false);
    (this.player.body as Phaser.Physics.Arcade.Body).enable = false;

    if (this.lives <= 0) {
      this.time.delayedCall(1000, () => this.onGameOver());
    } else {
      this.time.delayedCall(1500, () => this.respawnPlayer());
    }
  }

  private respawnPlayer(): void {
    this.player.setPosition(GAME_CONFIG.width / 2, GAME_CONFIG.height - 40);
    this.player.setVisible(true);
    this.player.setActive(true);
    this.player.setAngle(0);
    (this.player.body as Phaser.Physics.Arcade.Body).enable = true;
    this.energy = GAME_CONSTANTS.maxEnergy;
    this.invulnerable = true;
    this.invulnerableTimer = 2000;
  }

  private onGameOver(): void {
    this.gameOverState = true;
    this.player.setActive(false);
    this.player.setVisible(false);
    this.audioManager.playGameOver();
    this.audioManager.stopMusic();

    this.time.delayedCall(1500, () => {
      this.starfield.destroy();
      this.particles.destroy();
      this.scene.start('GameOverScene', {
        score: this.score,
        level: this.level,
        audioManager: this.audioManager,
        stats: this.stats,
      });
    });
  }

  private onGameWin(): void {
    this.gameOverState = true;
    this.audioManager.stopMusic();

    this.time.delayedCall(1500, () => {
      this.starfield.destroy();
      this.particles.destroy();
      this.scene.start('GameOverScene', {
        score: this.score,
        level: this.level,
        won: true,
        audioManager: this.audioManager,
        stats: this.stats,
      });
    });
  }
}