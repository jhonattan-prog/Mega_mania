import Phaser from 'phaser';
import { GAME_CONFIG, COLORS, ENEMY_TYPES } from '../config';
import { PowerUpType } from '../config';

export class SpriteGenerator {
  private static createGraphics(scene: Phaser.Scene): Phaser.GameObjects.Graphics {
    return scene.add.graphics();
  }

  static generatePlayer(scene: Phaser.Scene): string {
    const key = 'player';
    if (scene.textures.exists(key)) return key;

    const size = 32;
    const g = SpriteGenerator.createGraphics(scene);
    g.clear();

    // Glow under ship
    g.fillStyle(COLORS.neonCyan, 0.15);
    g.fillCircle(size / 2, size / 2 + 4, 14);

    // Wing shadows
    g.fillStyle(0x005566);
    g.fillTriangle(4, size - 2, size / 2, size / 2 - 2, size / 2 - 4, size - 2);
    g.fillTriangle(size - 4, size - 2, size / 2, size / 2 - 2, size / 2 + 4, size - 2);

    // Main body (cyan ship)
    g.fillStyle(COLORS.neonCyan);
    g.fillTriangle(size / 2, 2, size - 6, size - 4, 6, size - 4);

    // Cockpit highlight
    g.fillStyle(COLORS.white);
    g.fillTriangle(size / 2, 6, size / 2 + 3, 14, size / 2 - 3, 14);

    // Cockpit
    g.fillStyle(0x0088aa);
    g.fillCircle(size / 2, 12, 3);

    // Wing accents
    g.fillStyle(0x00aacc);
    g.fillRect(7, size - 8, 4, 3);
    g.fillRect(size - 11, size - 8, 4, 3);

    // Engine glow
    g.fillStyle(COLORS.neonOrange, 0.8);
    g.fillRect(size / 2 - 3, size - 4, 6, 3);
    g.fillStyle(COLORS.neonYellow, 0.9);
    g.fillRect(size / 2 - 2, size - 3, 4, 2);

    g.generateTexture(key, size, size);
    g.destroy();
    return key;
  }

  static generatePlayerBullet(scene: Phaser.Scene): string {
    const key = 'playerBullet';
    if (scene.textures.exists(key)) return key;

    const w = 6;
    const h = 16;
    const g = SpriteGenerator.createGraphics(scene);

    // Outer glow
    g.fillStyle(COLORS.neonCyan, 0.3);
    g.fillRect(0, 0, w, h);

    // Core
    g.fillStyle(COLORS.neonYellow);
    g.fillRect(1, 0, w - 2, h);

    // Bright center
    g.fillStyle(COLORS.white);
    g.fillRect(2, 0, 2, h);

    // Tip
    g.fillStyle(COLORS.white, 0.9);
    g.fillRect(1, 0, w - 2, 3);

    g.generateTexture(key, w, h);
    g.destroy();
    return key;
  }

  static generateEnemyBullet(scene: Phaser.Scene): string {
    const key = 'enemyBullet';
    if (scene.textures.exists(key)) return key;

    const g = SpriteGenerator.createGraphics(scene);

    // Outer glow
    g.fillStyle(COLORS.neonPink, 0.25);
    g.fillCircle(5, 5, 5);

    // Core
    g.fillStyle(COLORS.red);
    g.fillCircle(5, 5, 4);

    // Inner bright
    g.fillStyle(COLORS.orange);
    g.fillCircle(5, 5, 2);

    // Hot center
    g.fillStyle(COLORS.white, 0.7);
    g.fillCircle(5, 4, 1);

    g.generateTexture(key, 10, 10);
    g.destroy();
    return key;
  }

  static generateEnemy(scene: Phaser.Scene, typeIndex: number): string {
    const type = ENEMY_TYPES[typeIndex];
    const key = `enemy_${type.name}`;
    if (scene.textures.exists(key)) return key;

    const size = 32;
    const g = SpriteGenerator.createGraphics(scene);
    g.clear();

    // Draw glow halo first
    g.fillStyle(type.glow, 0.12);
    g.fillCircle(size / 2, size / 2, 15);

    switch (type.name) {
      case 'burger':
        SpriteGenerator.drawBurger(g, size, type.color, type.accent);
        break;
      case 'cookie':
        SpriteGenerator.drawCookie(g, size, type.color, type.accent);
        break;
      case 'iron':
        SpriteGenerator.drawIron(g, size, type.color, type.accent);
        break;
      case 'bowtie':
        SpriteGenerator.drawBowtie(g, size, type.color, type.accent);
        break;
      case 'diamond':
        SpriteGenerator.drawDiamond(g, size, type.color, type.accent);
        break;
    }

    // Edge highlight
    g.fillStyle(0xffffff, 0.1);
    g.fillRect(size / 2 - 8, size / 2 - 10, 16, 1);

    g.generateTexture(key, size, size);
    g.destroy();
    return key;
  }

  private static drawBurger(g: Phaser.GameObjects.Graphics, size: number, color: number, accent: number): void {
    const cx = size / 2;
    const cy = size / 2;
    // Top bun
    g.fillStyle(color);
    g.fillRoundedRect(cx - 12, cy - 12, 24, 8, 4);
    // Sesame seeds
    g.fillStyle(0xffffaa);
    for (let i = 0; i < 6; i++) {
      g.fillCircle(cx - 8 + (i % 3) * 8, cy - 9 + Math.floor(i / 3) * 4, 1.5);
    }
    // Patty
    g.fillStyle(accent);
    g.fillRect(cx - 11, cy - 4, 22, 6);
    // Cheese
    g.fillStyle(0xffcc00);
    g.fillRect(cx - 10, cy + 2, 20, 4);
    // Lettuce
    g.fillStyle(0x00aa00);
    g.fillRect(cx - 11, cy + 6, 22, 4);
    // Bottom bun
    g.fillStyle(color);
    g.fillRoundedRect(cx - 12, cy + 10, 24, 8, 4);
    // Eye dots
    g.fillStyle(0xffffff);
    g.fillCircle(cx - 4, cy - 6, 2);
    g.fillCircle(cx + 4, cy - 6, 2);
    g.fillStyle(0x000000);
    g.fillCircle(cx - 4, cy - 5, 1);
    g.fillCircle(cx + 4, cy - 5, 1);
  }

  private static drawCookie(g: Phaser.GameObjects.Graphics, size: number, color: number, accent: number): void {
    const cx = size / 2;
    const cy = size / 2;
    g.fillStyle(color);
    g.fillCircle(cx, cy, 14);
    // Darker edge
    g.lineStyle(1, accent, 0.5);
    g.strokeCircle(cx, cy, 13);
    // Chocolate chips
    g.fillStyle(accent);
    const chips = [
      [cx - 6, cy - 5], [cx + 4, cy - 7], [cx - 2, cy + 3],
      [cx + 7, cy + 1], [cx - 8, cy + 1], [cx + 1, cy - 2],
    ];
    chips.forEach(([x, y]) => g.fillCircle(x, y, 3));
    // Sparkle
    g.fillStyle(0xffffff, 0.5);
    g.fillCircle(cx - 4, cy - 8, 2);
  }

  private static drawIron(g: Phaser.GameObjects.Graphics, size: number, color: number, accent: number): void {
    const cx = size / 2;
    const cy = size / 2;
    // Main body
    g.fillStyle(color);
    g.fillRoundedRect(cx - 14, cy - 6, 28, 18, 3);
    // Nose
    g.fillStyle(accent);
    g.fillTriangle(cx - 14, cy + 12, cx, cy - 6, cx + 14, cy + 12);
    // Handle stripe
    g.fillStyle(0xffffff);
    g.fillRect(cx - 6, cy - 4, 12, 3);
    // Heat indicator
    g.fillStyle(0xff0000);
    g.fillCircle(cx, cy + 2, 2);
    // Rivets
    g.fillStyle(0x888888);
    g.fillCircle(cx - 10, cy + 4, 1);
    g.fillCircle(cx + 10, cy + 4, 1);
    // Steam dots
    g.fillStyle(0xffffff, 0.4);
    g.fillCircle(cx - 3, cy - 10, 1.5);
    g.fillCircle(cx + 2, cy - 12, 1);
  }

  private static drawBowtie(g: Phaser.GameObjects.Graphics, size: number, color: number, accent: number): void {
    const cx = size / 2;
    const cy = size / 2;
    // Wings
    g.fillStyle(color);
    g.fillTriangle(cx - 14, cy - 10, cx, cy, cx - 14, cy + 10);
    g.fillTriangle(cx + 14, cy - 10, cx, cy, cx + 14, cy + 10);
    // Center knot
    g.fillStyle(accent);
    g.fillRect(cx - 4, cy - 6, 8, 12);
    // Wing dots
    g.fillStyle(0xffffff);
    g.fillCircle(cx, cy - 8, 2);
    g.fillCircle(cx, cy + 8, 2);
    // Pattern on wings
    g.fillStyle(0xffffff, 0.2);
    g.fillCircle(cx - 8, cy - 3, 2);
    g.fillCircle(cx + 8, cy - 3, 2);
    g.fillCircle(cx - 8, cy + 3, 2);
    g.fillCircle(cx + 8, cy + 3, 2);
  }

  private static drawDiamond(g: Phaser.GameObjects.Graphics, size: number, color: number, accent: number): void {
    const cx = size / 2;
    const cy = size / 2;
    // Outer diamond
    g.fillStyle(color);
    g.fillTriangle(cx, cy - 14, cx + 12, cy, cx, cy + 14);
    g.fillTriangle(cx, cy - 14, cx - 12, cy, cx, cy + 14);
    // Inner diamond (white)
    g.fillStyle(0xffffff, 0.7);
    g.fillTriangle(cx, cy - 8, cx + 6, cy, cx, cy + 8);
    g.fillTriangle(cx, cy - 8, cx - 6, cy, cx, cy + 8);
    // Accent facets
    g.fillStyle(accent);
    g.fillTriangle(cx, cy - 12, cx + 4, cy, cx, cy);
    g.fillTriangle(cx, cy - 12, cx - 4, cy, cx, cy);
    g.fillTriangle(cx, cy, cx + 4, cy, cx, cy + 10);
    g.fillTriangle(cx, cy, cx - 4, cy, cx, cy + 10);
    // Center sparkle
    g.fillStyle(0xffffff, 0.9);
    g.fillCircle(cx - 2, cy - 4, 1.5);
  }

  static generatePowerUpBase(scene: Phaser.Scene): string {
    const key = 'powerup_base';
    if (scene.textures.exists(key)) return key;

    const size = 16;
    const g = SpriteGenerator.createGraphics(scene);

    // Generic power-up shape
    g.fillStyle(COLORS.white, 0.8);
    g.fillCircle(size / 2, size / 2, 6);
    g.fillStyle(COLORS.neonCyan);
    g.fillCircle(size / 2, size / 2, 5);

    g.generateTexture(key, size, size);
    g.destroy();
    return key;
  }

  static generatePowerUp(scene: Phaser.Scene, type: string, color: number): string {
    const key = `powerup_${type}`;
    if (scene.textures.exists(key)) return key;

    const size = 16;
    const g = SpriteGenerator.createGraphics(scene);

    // Outer glow
    g.fillStyle(color, 0.2);
    g.fillCircle(size / 2, size / 2, 8);

    // Circle base
    g.fillStyle(color, 0.9);
    g.fillCircle(size / 2, size / 2, 6);

    // Inner bright ring
    g.lineStyle(1, 0xffffff, 0.6);
    g.strokeCircle(size / 2, size / 2, 4);

    // Center white dot
    g.fillStyle(0xffffff, 0.8);
    g.fillCircle(size / 2, size / 2, 2);

    // Icon indicator based on type
    switch (type) {
      case 'shield':
        g.lineStyle(2, 0xffffff, 0.7);
        g.strokeCircle(size / 2, size / 2, 5);
        break;
      case 'rapidfire':
        g.fillStyle(0xffffff, 0.7);
        g.fillTriangle(size / 2, 3, size / 2 + 3, size / 2, size / 2 - 3, size / 2);
        break;
      case 'multiplier':
        g.fillStyle(0xffffff, 0.7);
        g.fillRect(size / 2 - 1, 4, 2, size - 8);
        g.fillRect(4, size / 2 - 1, size - 8, 2);
        break;
      case 'energy':
        g.fillStyle(0xffffff, 0.7);
        g.fillRect(size / 2 - 1, 3, 2, size - 6);
        break;
    }

    g.generateTexture(key, size, size);
    g.destroy();
    return key;
  }

  static generateShield(scene: Phaser.Scene): string {
    const key = 'shield_effect';
    if (scene.textures.exists(key)) return key;

    const size = 40;
    const g = SpriteGenerator.createGraphics(scene);

    g.lineStyle(2, COLORS.neonCyan, 0.5);
    g.strokeCircle(size / 2, size / 2, 18);
    g.lineStyle(1, COLORS.neonCyan, 0.25);
    g.strokeCircle(size / 2, size / 2, 16);
    g.fillStyle(COLORS.neonCyan, 0.08);
    g.fillCircle(size / 2, size / 2, 17);

    g.generateTexture(key, size, size);
    g.destroy();
    return key;
  }

  static generateThruster(scene: Phaser.Scene): string {
    const key = 'thruster';
    if (scene.textures.exists(key)) return key;

    const w = 8;
    const h = 12;
    const g = SpriteGenerator.createGraphics(scene);

    // Outer flame
    g.fillStyle(COLORS.neonOrange, 0.6);
    g.fillTriangle(0, 0, w, 0, w / 2, h);

    // Inner flame
    g.fillStyle(COLORS.neonYellow, 0.8);
    g.fillTriangle(2, 0, w - 2, 0, w / 2, h - 3);

    // Core
    g.fillStyle(COLORS.white, 0.9);
    g.fillTriangle(3, 0, w - 3, 0, w / 2, h - 6);

    g.generateTexture(key, w, h);
    g.destroy();
    return key;
  }
}