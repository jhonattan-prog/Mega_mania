import Phaser from 'phaser';
import { VFX_CONFIG, COLORS } from '../config';

interface Particle {
  obj: Phaser.GameObjects.Rectangle | Phaser.GameObjects.Arc;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  fadeOut: boolean;
}

export class ParticleManager {
  private scene: Phaser.Scene;
  private particles: Particle[] = [];
  private pool: Phaser.GameObjects.Rectangle[] = [];
  private maxPoolSize = 200;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /** Explosion burst — used when enemies or player die */
  explode(x: number, y: number, color: number, count?: number, intensity?: number): void {
    const n = count ?? VFX_CONFIG.explosionParticleCount;
    const scale = intensity ?? 1;

    // Shockwave ring
    this.createShockwave(x, y, color);

    // Core flash
    this.createFlash(x, y, color);

    // Debris particles
    for (let i = 0; i < n; i++) {
      const angle = (Math.PI * 2 * i) / n + Phaser.Math.FloatBetween(-0.3, 0.3);
      const speed = Phaser.Math.FloatBetween(
        VFX_CONFIG.explosionParticleSpeed.min,
        VFX_CONFIG.explosionParticleSpeed.max
      ) * scale;
      const size = Phaser.Math.Between(
        VFX_CONFIG.explosionParticleSize.min,
        VFX_CONFIG.explosionParticleSize.max
      );
      const life = VFX_CONFIG.explosionParticleDuration + Phaser.Math.Between(-100, 200);

      const particleColor = this.varyColor(color, 30);
      const rect = this.getFromPool(x, y, size, particleColor);

      this.particles.push({
        obj: rect,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life,
        maxLife: life,
        fadeOut: true,
      });
    }

    // Inner glow particles (brighter, smaller, slower)
    for (let i = 0; i < Math.floor(n / 3); i++) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const speed = Phaser.Math.FloatBetween(10, 40) * scale;
      const size = Phaser.Math.Between(1, 3);

      const rect = this.getFromPool(x, y, size, 0xffffff);
      rect.setAlpha(0.9);

      this.particles.push({
        obj: rect,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: VFX_CONFIG.explosionParticleDuration * 0.6,
        maxLife: VFX_CONFIG.explosionParticleDuration * 0.6,
        fadeOut: true,
      });
    }
  }

  /** Player death — bigger, more dramatic */
  explodePlayer(x: number, y: number): void {
    this.explode(x, y, COLORS.neonCyan, 32, 1.5);

    // Additional ring of cyan particles
    for (let i = 0; i < 16; i++) {
      const angle = (Math.PI * 2 * i) / 16;
      const speed = 60;
      const rect = this.getFromPool(x, y, 3, COLORS.neonCyan);

      this.particles.push({
        obj: rect,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 800,
        maxLife: 800,
        fadeOut: true,
      });
    }
  }

  /** Sparks on bullet impact */
  sparks(x: number, y: number, color: number): void {
    for (let i = 0; i < 6; i++) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const speed = Phaser.Math.FloatBetween(30, 80);
      const size = Phaser.Math.Between(1, 2);

      const rect = this.getFromPool(x, y, size, color);

      this.particles.push({
        obj: rect,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 250,
        maxLife: 250,
        fadeOut: true,
      });
    }
  }

  /** Wave clear celebration */
  celebrate(width: number, height: number): void {
    const celebrationColors = [
      COLORS.neonCyan, COLORS.neonPink, COLORS.neonGreen,
      COLORS.neonOrange, COLORS.neonYellow, COLORS.neonPurple,
    ];

    for (let i = 0; i < 40; i++) {
      const x = Phaser.Math.Between(20, width - 20);
      const y = height + 10;
      const color = Phaser.Utils.Array.GetRandom(celebrationColors);
      const size = Phaser.Math.Between(2, 4);

      const rect = this.getFromPool(x, y, size, color);

      this.particles.push({
        obj: rect,
        vx: Phaser.Math.FloatBetween(-30, 30),
        vy: Phaser.Math.FloatBetween(-180, -80),
        life: 2000 + Phaser.Math.Between(0, 500),
        maxLife: 2500,
        fadeOut: true,
      });
    }
  }

  /** Score popup particle burst */
  scoreBurst(x: number, y: number, color: number): void {
    for (let i = 0; i < 4; i++) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const speed = Phaser.Math.FloatBetween(15, 35);
      const rect = this.getFromPool(x, y, 2, color);

      this.particles.push({
        obj: rect,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 400,
        maxLife: 400,
        fadeOut: true,
      });
    }
  }

  /** Power-up collection effect */
  powerUpCollect(x: number, y: number, color: number): void {
    for (let i = 0; i < 20; i++) {
      const angle = (Math.PI * 2 * i) / 20;
      const speed = Phaser.Math.FloatBetween(40, 90);
      const size = Phaser.Math.Between(2, 4);
      const rect = this.getFromPool(x, y, size, color);

      this.particles.push({
        obj: rect,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 500,
        maxLife: 500,
        fadeOut: true,
      });
    }
    this.createFlash(x, y, color, 1.5);
  }

  private createShockwave(x: number, y: number, color: number): void {
    const ring = this.scene.add.circle(x, y, 4, color, 0.6).setDepth(50);

    this.scene.tweens.add({
      targets: ring,
      scaleX: 4,
      scaleY: 4,
      alpha: 0,
      duration: 350,
      ease: 'Quad.easeOut',
      onComplete: () => ring.destroy(),
    });
  }

  private createFlash(x: number, y: number, color: number, scale: number = 1): void {
    const flash = this.scene.add.circle(x, y, 8 * scale, 0xffffff, 0.8).setDepth(55);

    this.scene.tweens.add({
      targets: flash,
      scaleX: 0.1,
      scaleY: 0.1,
      alpha: 0,
      duration: 150,
      onComplete: () => flash.destroy(),
    });
  }

  private getFromPool(x: number, y: number, size: number, color: number): Phaser.GameObjects.Rectangle {
    let rect = this.pool.pop();
    if (rect) {
      rect.setPosition(x, y);
      rect.setSize(size, size);
      rect.setFillStyle(color);
      rect.setAlpha(1);
      rect.setScale(1);
      rect.setActive(true);
      rect.setVisible(true);
    } else {
      rect = this.scene.add.rectangle(x, y, size, size, color, 1).setDepth(50);
    }
    return rect;
  }

  private returnToPool(rect: Phaser.GameObjects.Rectangle): void {
    rect.setActive(false);
    rect.setVisible(false);
    if (this.pool.length < this.maxPoolSize) {
      this.pool.push(rect);
    } else {
      rect.destroy();
    }
  }

  private varyColor(color: number, amount: number): number {
    const r = Math.min(255, Math.max(0, ((color >> 16) & 0xff) + Phaser.Math.Between(-amount, amount)));
    const g = Math.min(255, Math.max(0, ((color >> 8) & 0xff) + Phaser.Math.Between(-amount, amount)));
    const b = Math.min(255, Math.max(0, (color & 0xff) + Phaser.Math.Between(-amount, amount)));
    return (r << 16) | (g << 8) | b;
  }

  /** Screen shake effect */
  shake(intensity?: number, duration?: number): void {
    const i = intensity ?? VFX_CONFIG.screenShakeIntensity;
    const d = duration ?? VFX_CONFIG.screenShakeDuration;
    this.scene.cameras.main.shake(d, i / 1000);
  }

  /** Slow motion effect */
  slowMo(duration?: number, scale?: number): void {
    const d = duration ?? VFX_CONFIG.slowMoDuration;
    const s = scale ?? VFX_CONFIG.slowMoScale;

    this.scene.time.timeScale = s;
    this.scene.physics.world.timeScale = 1 / s;

    this.scene.time.delayedCall(d, () => {
      this.scene.time.timeScale = 1;
      this.scene.physics.world.timeScale = 1;
    });
  }

  update(delta: number): void {
    const dt = delta / 1000;

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= delta;

      if (p.life <= 0) {
        this.returnToPool(p.obj as Phaser.GameObjects.Rectangle);
        this.particles.splice(i, 1);
        continue;
      }

      // Move
      (p.obj as Phaser.GameObjects.Rectangle).x += p.vx * dt;
      (p.obj as Phaser.GameObjects.Rectangle).y += p.vy * dt;

      // Slow down
      p.vx *= 0.97;
      p.vy *= 0.97;

      // Fade
      if (p.fadeOut) {
        const ratio = p.life / p.maxLife;
        p.obj.setAlpha(ratio);
        p.obj.setScale(0.3 + ratio * 0.7);
      }
    }
  }

  destroy(): void {
    this.particles.forEach(p => p.obj.destroy());
    this.particles = [];
    this.pool.forEach(r => r.destroy());
    this.pool = [];
  }
}
