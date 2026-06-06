import Phaser from 'phaser';
import { GAME_CONFIG, POWERUP_CONFIG, COLORS } from '../config';
import { PowerUpType } from '../config';
import { SpriteGenerator } from '../managers/SpriteGenerator';

export class PowerUp extends Phaser.Physics.Arcade.Sprite {
  public powerUpType: PowerUpType = 'shield';
  private floatBaseY: number = 0;
  private spawnTime: number = 0;
  private glowCircle!: Phaser.GameObjects.Arc;

  constructor(scene: Phaser.Scene) {
    const key = SpriteGenerator.generatePowerUpBase(scene);
    super(scene, -50, -50, key);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setActive(false);
    this.setVisible(false);
    if (this.body) this.body.enable = false;
    this.setDepth(8);
    this.setScale(1.2);

    // Glow effect circle behind the power-up
    this.glowCircle = scene.add.circle(-50, -50, 12, 0xffffff, 0.2).setDepth(7);
    this.glowCircle.setVisible(false);
  }

  spawn(x: number, y: number, type: PowerUpType): void {
    this.powerUpType = type;
    this.setPosition(x, y);
    this.floatBaseY = y;
    this.spawnTime = this.scene.time.now;

    // Set texture based on type
    const typeConfig = POWERUP_CONFIG.types.find(t => t.id === type);
    if (typeConfig) {
      const key = SpriteGenerator.generatePowerUp(this.scene, type, typeConfig.color);
      this.setTexture(key);
      this.glowCircle.setFillStyle(typeConfig.color, 0.2);
    }

    this.setActive(true);
    this.setVisible(true);
    if (this.body) {
      this.body.enable = true;
      this.setVelocityY(POWERUP_CONFIG.floatSpeed);
    }

    this.glowCircle.setPosition(x, y);
    this.glowCircle.setVisible(true);

    // Spawn animation — scale from 0
    this.setScale(0);
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 300,
      ease: 'Back.easeOut',
    });
  }

  update(time: number, _delta: number): void {
    if (!this.active) return;

    // Bob up and down
    const elapsed = time - this.spawnTime;
    this.y = this.floatBaseY + (elapsed * POWERUP_CONFIG.floatSpeed / 1000)
      + Math.sin(elapsed * POWERUP_CONFIG.bobFrequency) * POWERUP_CONFIG.bobAmplitude;
    this.floatBaseY += POWERUP_CONFIG.floatSpeed / 1000 * _delta;

    // Rotate
    this.setAngle(this.angle + POWERUP_CONFIG.rotationSpeed * _delta);

    // Glow pulse
    const glowAlpha = 0.15 + Math.sin(time * POWERUP_CONFIG.glowPulseSpeed) * 0.1;
    this.glowCircle.setAlpha(glowAlpha);
    this.glowCircle.setPosition(this.x, this.y);

    // Scale pulse
    const scalePulse = 1.2 + Math.sin(time * 0.004) * 0.1;
    this.setScale(scalePulse);

    // Off screen
    if (this.y > GAME_CONFIG.height + 30) {
      this.deactivate();
    }
  }

  deactivate(): void {
    this.setActive(false);
    this.setVisible(false);
    if (this.body) this.body.enable = false;
    this.setVelocity(0, 0);
    this.glowCircle.setVisible(false);
  }

  destroy(fromScene?: boolean): void {
    this.glowCircle.destroy();
    super.destroy(fromScene);
  }
}

export class PowerUpPool {
  private scene: Phaser.Scene;
  private powerUps: PowerUp[] = [];
  private maxPowerUps = 5;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.createPool();
  }

  private createPool(): void {
    for (let i = 0; i < this.maxPowerUps; i++) {
      this.powerUps.push(new PowerUp(this.scene));
    }
  }

  trySpawn(x: number, y: number): PowerUp | null {
    if (Math.random() > POWERUP_CONFIG.dropChance) return null;

    const available = this.powerUps.find(p => !p.active);
    if (!available) return null;

    // Random type
    const types = [...POWERUP_CONFIG.types];
    const typeConfig = Phaser.Utils.Array.GetRandom(types) as typeof POWERUP_CONFIG.types[number];
    available.spawn(x, y, typeConfig.id as PowerUpType);
    return available;
  }

  getActive(): PowerUp[] {
    return this.powerUps.filter(p => p.active);
  }

  update(time: number, delta: number): void {
    this.powerUps.forEach(p => p.update(time, delta));
  }

  clear(): void {
    this.powerUps.forEach(p => p.deactivate());
  }
}
