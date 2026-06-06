import Phaser from 'phaser';
import { GAME_CONFIG, GAME_CONSTANTS, COLORS } from '../config';
import { SpriteGenerator } from '../managers/SpriteGenerator';
import { ActivePowerUp } from '../types';

export class Player extends Phaser.Physics.Arcade.Sprite {
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys | null = null;
  private fireKey: Phaser.Input.Keyboard.Key | null = null;
  private lastFireTime = 0;
  private fireCooldown = 150;
  private touchLeft = false;
  private touchRight = false;
  private touchFire = false;

  // Visual enhancements
  private thruster!: Phaser.GameObjects.Sprite;
  private shieldSprite!: Phaser.GameObjects.Sprite;
  private targetAngle = 0;

  // Power-up state
  public hasShield = false;
  public hasRapidFire = false;
  public scoreMultiplier = 1;
  public activePowerUps: ActivePowerUp[] = [];

  constructor(scene: Phaser.Scene) {
    const key = SpriteGenerator.generatePlayer(scene);
    super(scene, GAME_CONFIG.width / 2, GAME_CONFIG.height - 40, key);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.setScale(1.5);
    this.setDepth(10);

    this.setupVisuals(scene);
    this.setupInput(scene);
  }

  private setupVisuals(scene: Phaser.Scene): void {
    // Thruster flame
    const thrusterKey = SpriteGenerator.generateThruster(scene);
    this.thruster = scene.add.sprite(this.x, this.y + 20, thrusterKey)
      .setDepth(9)
      .setScale(1.5)
      .setAlpha(0.8);

    // Shield visual (hidden by default)
    const shieldKey = SpriteGenerator.generateShield(scene);
    this.shieldSprite = scene.add.sprite(this.x, this.y, shieldKey)
      .setDepth(11)
      .setScale(1.3)
      .setAlpha(0)
      .setVisible(false);
  }

  private setupInput(scene: Phaser.Scene): void {
    this.cursors = scene.input.keyboard?.createCursorKeys() ?? null;
    this.fireKey = scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE) ?? null;

    const btnLeft = document.getElementById('btnLeft');
    const btnRight = document.getElementById('btnRight');
    const btnFire = document.getElementById('btnFire');

    const setupTouch = (el: HTMLElement | null, setter: (v: boolean) => void) => {
      if (!el) return;
      el.addEventListener('touchstart', (e) => { e.preventDefault(); setter(true); }, { passive: false });
      el.addEventListener('touchend', (e) => { e.preventDefault(); setter(false); }, { passive: false });
      el.addEventListener('touchcancel', (_e) => { setter(false); }, { passive: false });
      el.addEventListener('mousedown', (e) => { e.preventDefault(); setter(true); });
      el.addEventListener('mouseup', (e) => { e.preventDefault(); setter(false); });
      el.addEventListener('mouseleave', (_e) => { setter(false); });
    };

    setupTouch(btnLeft, (v) => this.touchLeft = v);
    setupTouch(btnRight, (v) => this.touchRight = v);
    setupTouch(btnFire, (v) => this.touchFire = v);

    const touchControls = document.getElementById('touchControls');
    if (touchControls && ('ontouchstart' in window || navigator.maxTouchPoints > 0)) {
      touchControls.classList.add('visible');
    }
  }

  update(time: number, delta: number): void {
    const speed = GAME_CONSTANTS.playerSpeed;
    let velocityX = 0;

    if (this.cursors?.left?.isDown) velocityX = -speed;
    else if (this.cursors?.right?.isDown) velocityX = speed;

    if (this.touchLeft) velocityX = -speed;
    else if (this.touchRight) velocityX = speed;

    this.setVelocityX(velocityX);

    // Visual tilt when moving
    if (velocityX < 0) this.targetAngle = -12;
    else if (velocityX > 0) this.targetAngle = 12;
    else this.targetAngle = 0;

    this.angle = Phaser.Math.Linear(this.angle, this.targetAngle, 0.15);

    // Update thruster position and animation
    this.thruster.setPosition(this.x, this.y + 18);
    this.thruster.setAngle(this.angle);
    const thrusterFlicker = 0.6 + Math.sin(time * 0.02) * 0.2 + Math.random() * 0.15;
    this.thruster.setAlpha(thrusterFlicker);
    const thrusterScale = 1.3 + Math.sin(time * 0.015) * 0.2;
    this.thruster.setScale(this.thruster.scaleX, thrusterScale);

    // Update shield visual
    if (this.hasShield) {
      this.shieldSprite.setPosition(this.x, this.y);
      this.shieldSprite.setVisible(true);
      const shieldPulse = 0.3 + Math.sin(time * 0.006) * 0.15;
      this.shieldSprite.setAlpha(shieldPulse);
      this.shieldSprite.setAngle(this.shieldSprite.angle + 0.3);
    } else {
      this.shieldSprite.setVisible(false);
    }

    // Fire
    const currentCooldown = this.hasRapidFire ? this.fireCooldown * 0.4 : this.fireCooldown;
    const firePressed = this.fireKey?.isDown ?? false;
    if ((firePressed || this.touchFire) && time - this.lastFireTime > currentCooldown) {
      this.lastFireTime = time;
      this.scene.events.emit('player-fire', this.x, this.y - 20);
    }

    // Update power-ups
    this.updatePowerUps(delta);
  }

  private updatePowerUps(delta: number): void {
    this.hasShield = false;
    this.hasRapidFire = false;
    this.scoreMultiplier = 1;

    for (let i = this.activePowerUps.length - 1; i >= 0; i--) {
      const pu = this.activePowerUps[i];
      pu.remainingTime -= delta;

      if (pu.remainingTime <= 0) {
        this.activePowerUps.splice(i, 1);
        this.scene.events.emit('powerup-expired', pu.type);
        continue;
      }

      switch (pu.type) {
        case 'shield': this.hasShield = true; break;
        case 'rapidfire': this.hasRapidFire = true; break;
        case 'multiplier': this.scoreMultiplier = 2; break;
      }
    }
  }

  addPowerUp(type: string, duration: number): void {
    // Remove existing of same type
    this.activePowerUps = this.activePowerUps.filter(p => p.type !== type);

    if (duration > 0) {
      this.activePowerUps.push({
        type: type as any,
        remainingTime: duration,
        duration: duration,
      });
    }
  }

  reset(): void {
    this.setPosition(GAME_CONFIG.width / 2, GAME_CONFIG.height - 40);
    this.setActive(true);
    this.setVisible(true);
    this.setAngle(0);
    this.targetAngle = 0;
    if (this.body) this.body.enable = true;
    this.thruster.setVisible(true);
    this.activePowerUps = [];
    this.hasShield = false;
    this.hasRapidFire = false;
    this.scoreMultiplier = 1;
  }

  setVisible(value: boolean): this {
    super.setVisible(value);
    if (this.thruster) this.thruster.setVisible(value);
    return this;
  }
}