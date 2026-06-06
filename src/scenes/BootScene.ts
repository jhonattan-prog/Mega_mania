import { POWERUP_CONFIG } from '../config';
import { SpriteGenerator } from '../managers/SpriteGenerator';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    this.generateAllTextures();
    this.load.audio('fah', 'fah.mp3');
  }

  create(): void {
    this.scene.start('MenuScene');
  }

  private generateAllTextures(): void {
    SpriteGenerator.generatePlayer(this);
    SpriteGenerator.generatePlayerBullet(this);
    SpriteGenerator.generateEnemyBullet(this);
    SpriteGenerator.generateThruster(this);
    SpriteGenerator.generateShield(this);
    SpriteGenerator.generatePowerUpBase(this);

    for (let i = 0; i < 5; i++) {
      SpriteGenerator.generateEnemy(this, i);
    }

    // Pre-generate power-up textures
    for (const type of POWERUP_CONFIG.types) {
      SpriteGenerator.generatePowerUp(this, type.id, type.color);
    }
  }
}