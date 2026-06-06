import Phaser from 'phaser';
import { GAME_CONFIG, GAME_CONSTANTS, COLORS, VFX_CONFIG } from '../config';
import { SpriteGenerator } from '../managers/SpriteGenerator';

export class Bullet extends Phaser.Physics.Arcade.Sprite {
  public isPlayerBullet: boolean = true;
  private bulletSpeed: number = GAME_CONSTANTS.playerBulletSpeed;
  private trail: Phaser.GameObjects.Rectangle[] = [];

  constructor(scene: Phaser.Scene, isPlayerBullet: boolean = true) {
    const key = isPlayerBullet
      ? SpriteGenerator.generatePlayerBullet(scene)
      : SpriteGenerator.generateEnemyBullet(scene);

    super(scene, -100, -100, key);

    this.isPlayerBullet = isPlayerBullet;
    this.bulletSpeed = isPlayerBullet ? GAME_CONSTANTS.playerBulletSpeed : GAME_CONSTANTS.enemyBulletSpeed;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setActive(false);
    this.setVisible(false);
    if (this.body) this.body.enable = false;
    this.setDepth(5);

    if (isPlayerBullet) {
      this.setScale(1.5);
    }

    // Create trail objects
    if (isPlayerBullet) {
      for (let i = 0; i < VFX_CONFIG.bulletTrailLength; i++) {
        const t = scene.add.rectangle(-100, -100, 3, 4, COLORS.neonCyan, 0)
          .setDepth(4);
        this.trail.push(t);
      }
    } else {
      for (let i = 0; i < 3; i++) {
        const t = scene.add.rectangle(-100, -100, 3, 3, COLORS.neonPink, 0)
          .setDepth(4);
        this.trail.push(t);
      }
    }
  }

  fire(x: number, y: number): void {
    this.setPosition(x, y);
    this.setActive(true);
    this.setVisible(true);
    if (this.body) {
      this.body.enable = true;
      this.setVelocityY(this.bulletSpeed);
    }

    // Reset trail positions
    this.trail.forEach(t => {
      t.setPosition(x, y);
      t.setAlpha(0);
    });
  }

  update(): void {
    if (!this.active) return;

    // Update trail
    for (let i = this.trail.length - 1; i >= 0; i--) {
      const t = this.trail[i];
      if (i === 0) {
        t.setPosition(this.x, this.y + (this.isPlayerBullet ? 8 : -6));
      } else {
        // Follow previous trail segment with delay
        const prev = this.trail[i - 1];
        t.x = Phaser.Math.Linear(t.x, prev.x, 0.5);
        t.y = Phaser.Math.Linear(t.y, prev.y, 0.5);
      }

      const alpha = VFX_CONFIG.bulletTrailAlpha * (1 - i / this.trail.length);
      t.setAlpha(alpha);
      const scale = 1 - (i / this.trail.length) * 0.5;
      t.setScale(scale);
    }

    // Off-screen check
    if (this.isPlayerBullet && this.y < -20) {
      this.deactivate();
    } else if (!this.isPlayerBullet && this.y > GAME_CONFIG.height + 20) {
      this.deactivate();
    }
  }

  deactivate(): void {
    this.setActive(false);
    this.setVisible(false);
    if (this.body) {
      this.body.enable = false;
    }
    this.setVelocity(0, 0);
    // Hide trail
    this.trail.forEach(t => t.setAlpha(0));
  }
}

export class BulletPool {
  private scene: Phaser.Scene;
  private playerBullets: Bullet[] = [];
  private enemyBullets: Bullet[] = [];
  private maxPlayerBullets = 10;
  private maxEnemyBullets = 8;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.createPool();
  }

  private createPool(): void {
    for (let i = 0; i < this.maxPlayerBullets; i++) {
      this.playerBullets.push(new Bullet(this.scene, true));
    }
    for (let i = 0; i < this.maxEnemyBullets; i++) {
      this.enemyBullets.push(new Bullet(this.scene, false));
    }
  }

  getPlayerBullet(): Bullet | null {
    return this.playerBullets.find(b => !b.active) ?? null;
  }

  getEnemyBullet(): Bullet | null {
    return this.enemyBullets.find(b => !b.active) ?? null;
  }

  firePlayerBullet(x: number, y: number): void {
    const bullet = this.getPlayerBullet();
    if (bullet) bullet.fire(x, y);
  }

  fireEnemyBullet(x: number, y: number): void {
    const bullet = this.getEnemyBullet();
    if (bullet) bullet.fire(x, y);
  }

  update(): void {
    this.playerBullets.forEach(b => b.update());
    this.enemyBullets.forEach(b => b.update());
  }

  getAllPlayerBullets(): Bullet[] {
    return this.playerBullets.filter(b => b.active);
  }

  getAllEnemyBullets(): Bullet[] {
    return this.enemyBullets.filter(b => b.active);
  }

  clear(): void {
    this.playerBullets.forEach(b => b.deactivate());
    this.enemyBullets.forEach(b => b.deactivate());
  }
}