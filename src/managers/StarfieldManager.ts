import Phaser from 'phaser';
import { GAME_CONFIG, COLORS, VFX_CONFIG, LEVEL_BACKGROUNDS } from '../config';

interface Star {
  x: number;
  y: number;
  size: number;
  alpha: number;
  baseAlpha: number;
  twinkleSpeed: number;
  twinkleOffset: number;
}

interface ShootingStar {
  obj: Phaser.GameObjects.Rectangle;
  trail: Phaser.GameObjects.Rectangle[];
  vx: number;
  vy: number;
  life: number;
}

export class StarfieldManager {
  private scene: Phaser.Scene;
  private layers: { stars: Star[]; speed: number; graphics: Phaser.GameObjects.Graphics }[] = [];
  private bgGraphics!: Phaser.GameObjects.Graphics;
  private nebulaGraphics!: Phaser.GameObjects.Graphics;
  private shootingStars: ShootingStar[] = [];
  private shootingStarTimer = 0;
  private currentLevel = 0;
  private targetBgTop: number;
  private targetBgBottom: number;
  private currentBgTop: number;
  private currentBgBottom: number;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    const bg = LEVEL_BACKGROUNDS[0];
    this.targetBgTop = bg.top;
    this.targetBgBottom = bg.bottom;
    this.currentBgTop = bg.top;
    this.currentBgBottom = bg.bottom;

    this.create();
  }

  private create(): void {
    // Background gradient
    this.bgGraphics = this.scene.add.graphics().setDepth(-10);
    this.drawBackground();

    // Nebula layer
    this.nebulaGraphics = this.scene.add.graphics().setDepth(-5);
    this.drawNebulas();

    // Star layers (parallax)
    const layerCount = VFX_CONFIG.starfieldLayers;
    for (let layer = 0; layer < layerCount; layer++) {
      const density = VFX_CONFIG.starfieldDensity[layer];
      const speed = VFX_CONFIG.starfieldSpeed[layer];
      const starSize = VFX_CONFIG.starfieldSize[layer];

      const stars: Star[] = [];
      for (let i = 0; i < density; i++) {
        stars.push({
          x: Phaser.Math.Between(0, GAME_CONFIG.width),
          y: Phaser.Math.Between(0, GAME_CONFIG.height),
          size: Phaser.Math.Between(1, starSize),
          alpha: Phaser.Math.FloatBetween(0.3, 1),
          baseAlpha: Phaser.Math.FloatBetween(0.3, 1),
          twinkleSpeed: Phaser.Math.FloatBetween(0.001, 0.005),
          twinkleOffset: Phaser.Math.FloatBetween(0, Math.PI * 2),
        });
      }

      const graphics = this.scene.add.graphics().setDepth(-4 + layer);
      this.layers.push({ stars, speed, graphics });
    }
  }

  private drawBackground(): void {
    this.bgGraphics.clear();

    const w = GAME_CONFIG.width;
    const h = GAME_CONFIG.height;
    const steps = 32;

    const topR = (this.currentBgTop >> 16) & 0xff;
    const topG = (this.currentBgTop >> 8) & 0xff;
    const topB = this.currentBgTop & 0xff;
    const botR = (this.currentBgBottom >> 16) & 0xff;
    const botG = (this.currentBgBottom >> 8) & 0xff;
    const botB = this.currentBgBottom & 0xff;

    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const r = Math.round(topR + (botR - topR) * t);
      const g = Math.round(topG + (botG - topG) * t);
      const b = Math.round(topB + (botB - topB) * t);
      const color = (r << 16) | (g << 8) | b;

      const y = Math.round(t * h);
      const stripHeight = Math.ceil(h / steps) + 1;
      this.bgGraphics.fillStyle(color, 1);
      this.bgGraphics.fillRect(0, y, w, stripHeight);
    }
  }

  private drawNebulas(): void {
    this.nebulaGraphics.clear();

    // Draw soft nebula blobs
    const nebulaColors = [
      { color: COLORS.nebulaPurple, alpha: 0.15 },
      { color: COLORS.nebulaBlue, alpha: 0.1 },
      { color: 0x1a002e, alpha: 0.1 },
    ];

    for (const nebula of nebulaColors) {
      const x = Phaser.Math.Between(30, GAME_CONFIG.width - 30);
      const y = Phaser.Math.Between(60, GAME_CONFIG.height - 60);
      const rx = Phaser.Math.Between(40, 80);
      const ry = Phaser.Math.Between(30, 60);

      // Approximate ellipse with circles
      for (let i = 0; i < 5; i++) {
        const ox = Phaser.Math.FloatBetween(-rx * 0.5, rx * 0.5);
        const oy = Phaser.Math.FloatBetween(-ry * 0.5, ry * 0.5);
        const r = Phaser.Math.Between(20, 50);
        this.nebulaGraphics.fillStyle(nebula.color, nebula.alpha * Phaser.Math.FloatBetween(0.5, 1));
        this.nebulaGraphics.fillCircle(x + ox, y + oy, r);
      }
    }
  }

  setLevel(level: number): void {
    this.currentLevel = level;
    const idx = (level - 1) % LEVEL_BACKGROUNDS.length;
    const bg = LEVEL_BACKGROUNDS[idx];
    this.targetBgTop = bg.top;
    this.targetBgBottom = bg.bottom;
  }

  update(time: number, delta: number): void {
    const dt = delta / 1000;

    // Lerp background colors
    this.currentBgTop = this.lerpColor(this.currentBgTop, this.targetBgTop, 0.02);
    this.currentBgBottom = this.lerpColor(this.currentBgBottom, this.targetBgBottom, 0.02);
    this.drawBackground();

    // Update star layers
    for (const layer of this.layers) {
      layer.graphics.clear();

      for (const star of layer.stars) {
        // Scroll down
        star.y += layer.speed * dt * 60;
        if (star.y > GAME_CONFIG.height + 5) {
          star.y = -5;
          star.x = Phaser.Math.Between(0, GAME_CONFIG.width);
        }

        // Twinkle
        star.alpha = star.baseAlpha + Math.sin(time * star.twinkleSpeed + star.twinkleOffset) * 0.3;
        star.alpha = Phaser.Math.Clamp(star.alpha, 0.1, 1);

        // Draw star
        layer.graphics.fillStyle(COLORS.white, star.alpha);
        layer.graphics.fillRect(Math.round(star.x), Math.round(star.y), star.size, star.size);
      }
    }

    // Shooting stars
    this.shootingStarTimer -= delta;
    if (this.shootingStarTimer <= 0) {
      this.shootingStarTimer = Phaser.Math.Between(4000, 10000);
      this.createShootingStar();
    }

    // Update shooting stars
    for (let i = this.shootingStars.length - 1; i >= 0; i--) {
      const ss = this.shootingStars[i];
      ss.life -= delta;

      if (ss.life <= 0) {
        ss.obj.destroy();
        ss.trail.forEach(t => t.destroy());
        this.shootingStars.splice(i, 1);
        continue;
      }

      ss.obj.x += ss.vx * dt;
      ss.obj.y += ss.vy * dt;
      ss.obj.setAlpha(Phaser.Math.Clamp(ss.life / 500, 0, 0.8));

      // Update trail
      for (let t = ss.trail.length - 1; t >= 0; t--) {
        const trail = ss.trail[t];
        const trailAlpha = (t / ss.trail.length) * ss.obj.alpha * 0.5;
        trail.setAlpha(trailAlpha);
        trail.setPosition(
          ss.obj.x - ss.vx * dt * (t + 1) * 2,
          ss.obj.y - ss.vy * dt * (t + 1) * 2
        );
      }
    }
  }

  private createShootingStar(): void {
    const x = Phaser.Math.Between(0, GAME_CONFIG.width);
    const y = -5;
    const vx = Phaser.Math.FloatBetween(-60, -20);
    const vy = Phaser.Math.FloatBetween(100, 200);

    const obj = this.scene.add.rectangle(x, y, 2, 2, 0xffffff, 0.8).setDepth(-3);
    const trail: Phaser.GameObjects.Rectangle[] = [];

    for (let i = 0; i < 4; i++) {
      const t = this.scene.add.rectangle(x, y, 1, 1, 0xaaddff, 0.3).setDepth(-3);
      trail.push(t);
    }

    this.shootingStars.push({ obj, trail, vx, vy, life: 2000 });
  }

  private lerpColor(current: number, target: number, t: number): number {
    const cr = (current >> 16) & 0xff;
    const cg = (current >> 8) & 0xff;
    const cb = current & 0xff;
    const tr = (target >> 16) & 0xff;
    const tg = (target >> 8) & 0xff;
    const tb = target & 0xff;

    const r = Math.round(cr + (tr - cr) * t);
    const g = Math.round(cg + (tg - cg) * t);
    const b = Math.round(cb + (tb - cb) * t);

    return (r << 16) | (g << 8) | b;
  }

  destroy(): void {
    this.bgGraphics.destroy();
    this.nebulaGraphics.destroy();
    this.layers.forEach(l => l.graphics.destroy());
    this.shootingStars.forEach(ss => {
      ss.obj.destroy();
      ss.trail.forEach(t => t.destroy());
    });
  }
}
