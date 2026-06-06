import Phaser from 'phaser';
import { GAME_CONFIG, GAME_CONSTANTS, ENEMY_TYPES, COLORS } from '../config';
import { SpriteGenerator } from '../managers/SpriteGenerator';

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  public row: number = 0;
  public col: number = 0;
  public baseX: number = 0;
  public typeIndex: number = 0;
  public fireTimer: number = 0;
  public canFire: boolean = false;
  private startTime: number = 0;
  private zigzagAmplitude: number = GAME_CONSTANTS.enemyZigzagAmplitude;
  private zigzagFrequency: number = GAME_CONSTANTS.enemyZigzagFrequency;
  private descentSpeed: number = GAME_CONSTANTS.enemyBaseSpeed;
  private movementPattern: string = 'zigzag';

  // Visual
  private glowCircle: Phaser.GameObjects.Arc | null = null;
  private teleportTimer: number = 0;
  private telegraphFlash = false;
  private telegraphTimer = 0;

  constructor(scene: Phaser.Scene, typeIndex: number) {
    const key = SpriteGenerator.generateEnemy(scene, typeIndex);
    super(scene, -50, -50, key);

    this.typeIndex = typeIndex;
    this.movementPattern = ENEMY_TYPES[typeIndex].movement;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setActive(false);
    this.setVisible(false);
    if (this.body) this.body.enable = false;
    this.setDepth(5);
    this.setScale(1.2);

    // Glow halo
    this.glowCircle = scene.add.circle(-50, -50, 14, ENEMY_TYPES[typeIndex].glow, 0.08)
      .setDepth(4)
      .setVisible(false);
  }

  spawn(x: number, y: number, row: number, col: number, descentSpeed: number, fireIntervalMin: number, fireIntervalMax: number): void {
    this.setPosition(x, y);
    this.baseX = x;
    this.row = row;
    this.col = col;
    this.descentSpeed = descentSpeed;
    this.startTime = this.scene.time.now;
    this.teleportTimer = 3000;
    this.telegraphFlash = false;
    this.telegraphTimer = 0;

    this.fireTimer = Phaser.Math.Between(fireIntervalMin, fireIntervalMax);
    this.canFire = false;

    this.setActive(true);
    this.setVisible(true);
    if (this.body) {
      this.body.enable = true;
      this.setVelocityY(this.descentSpeed);
    }

    if (this.glowCircle) {
      this.glowCircle.setVisible(true);
      this.glowCircle.setPosition(x, y);
    }

    // Warp-in animation
    this.setAlpha(0);
    this.setScale(0);
    this.scene.tweens.add({
      targets: this,
      alpha: 1,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 400,
      delay: (row * 80) + (col * 30),
      ease: 'Back.easeOut',
    });
  }

  update(time: number, delta: number): void {
    if (!this.active) return;

    const elapsed = (time - this.startTime);

    // Movement pattern
    switch (this.movementPattern) {
      case 'zigzag':
        this.x = this.baseX + Math.sin(elapsed * this.zigzagFrequency) * this.zigzagAmplitude;
        break;

      case 'spiral': {
        const spiralT = elapsed * 0.001;
        const spiralRadius = 20 + Math.sin(spiralT * 0.5) * 15;
        this.x = this.baseX + Math.cos(spiralT * 2) * spiralRadius;
        // Add slight vertical bobbing
        const bodyVel = this.body as Phaser.Physics.Arcade.Body;
        bodyVel.setVelocityY(this.descentSpeed + Math.sin(spiralT * 3) * 15);
        break;
      }

      case 'kamikaze': {
        // Accelerate downward after a delay
        const kamikazeDelay = 2000;
        if (elapsed > kamikazeDelay) {
          const accel = Math.min((elapsed - kamikazeDelay) * 0.0005, 3);
          const bodyVel = this.body as Phaser.Physics.Arcade.Body;
          bodyVel.setVelocityY(this.descentSpeed * (1 + accel));
        }
        // Small zigzag
        this.x = this.baseX + Math.sin(elapsed * this.zigzagFrequency * 2) * (this.zigzagAmplitude * 0.3);
        break;
      }

      case 'wave': {
        // S-wave pattern
        const waveT = elapsed * 0.001;
        this.x = this.baseX + Math.sin(waveT * 1.5) * this.zigzagAmplitude * 1.2;
        break;
      }

      case 'teleport': {
        // Normal zigzag with teleport
        this.x = this.baseX + Math.sin(elapsed * this.zigzagFrequency) * this.zigzagAmplitude;
        this.teleportTimer -= delta;
        if (this.teleportTimer <= 0) {
          this.teleportTimer = Phaser.Math.Between(2500, 4000);
          const newX = Phaser.Math.Between(30, GAME_CONFIG.width - 30);
          // Flash out
          this.scene.tweens.add({
            targets: this,
            alpha: 0,
            scaleX: 2,
            scaleY: 0.1,
            duration: 120,
            onComplete: () => {
              if (!this.active) return;
              this.baseX = newX;
              this.setPosition(newX, this.y);
              // Flash in
              this.scene.tweens.add({
                targets: this,
                alpha: 1,
                scaleX: 1.2,
                scaleY: 1.2,
                duration: 150,
                ease: 'Back.easeOut',
              });
            },
          });
        }
        break;
      }
    }

    // Fire telegraph — flash white briefly before firing
    this.fireTimer -= delta;
    if (this.fireTimer <= 300 && this.fireTimer > 0 && !this.telegraphFlash) {
      this.telegraphFlash = true;
      this.setTint(0xffffff);
      this.telegraphTimer = 300;
    }

    if (this.telegraphFlash) {
      this.telegraphTimer -= delta;
      if (this.telegraphTimer <= 0) {
        this.telegraphFlash = false;
        this.clearTint();
      }
    }

    if (this.fireTimer <= 0) {
      this.canFire = true;
      this.fireTimer = Phaser.Math.Between(3000, 5000);
    }

    // Update glow
    if (this.glowCircle) {
      this.glowCircle.setPosition(this.x, this.y);
      const glowPulse = 0.06 + Math.sin(time * 0.003) * 0.04;
      this.glowCircle.setAlpha(glowPulse);
    }

    if (this.y > GAME_CONFIG.height + 50) {
      this.deactivate();
    }
  }

  deactivate(): void {
    this.setActive(false);
    this.setVisible(false);
    if (this.body) this.body.enable = false;
    this.setVelocity(0, 0);
    this.canFire = false;
    this.clearTint();
    if (this.glowCircle) this.glowCircle.setVisible(false);
  }

  tryFire(): boolean {
    if (this.canFire && this.active) {
      this.canFire = false;
      return true;
    }
    return false;
  }

  getEnemyType(): string {
    return ENEMY_TYPES[this.typeIndex].name;
  }
}

export class EnemyGroup {
  private scene: Phaser.Scene;
  private enemies: Enemy[] = [];
  private maxEnemies = 30;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.createPool();
  }

  private createPool(): void {
    for (let i = 0; i < this.maxEnemies; i++) {
      const typeIndex = i % ENEMY_TYPES.length;
      this.enemies.push(new Enemy(this.scene, typeIndex));
    }
  }

  getInactiveEnemy(typeIndex: number): Enemy | null {
    return this.enemies.find(e => !e.active && e.typeIndex === typeIndex) ?? null;
  }

  getActiveEnemies(): Enemy[] {
    return this.enemies.filter(e => e.active);
  }

  getAllEnemies(): Enemy[] {
    return this.enemies;
  }

  update(time: number, delta: number): void {
    this.enemies.forEach(e => e.update(time, delta));
  }

  clear(): void {
    this.enemies.forEach(e => e.deactivate());
  }

  countActive(): number {
    return this.enemies.filter(e => e.active).length;
  }

  getRandomActiveEnemy(): Enemy | null {
    const active = this.getActiveEnemies();
    return active.length > 0 ? Phaser.Utils.Array.GetRandom(active) : null;
  }

  getBottomMostEnemies(): Enemy[] {
    const active = this.getActiveEnemies();
    const byCol = new Map<number, Enemy>();
    active.forEach(e => {
      const existing = byCol.get(e.col);
      if (!existing || e.y > existing.y) {
        byCol.set(e.col, e);
      }
    });
    return Array.from(byCol.values());
  }
}