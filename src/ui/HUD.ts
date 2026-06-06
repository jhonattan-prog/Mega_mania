import Phaser from 'phaser';
import { GAME_CONFIG, GAME_CONSTANTS, COLORS, VFX_CONFIG } from '../config';
import { ComboState } from '../types';

export class HUD {
  private scene: Phaser.Scene;
  private scoreText!: Phaser.GameObjects.Text;
  private livesContainer!: Phaser.GameObjects.Container;
  private levelText!: Phaser.GameObjects.Text;
  private energyBg!: Phaser.GameObjects.Graphics;
  private energyBar!: Phaser.GameObjects.Graphics;
  private energyGlow!: Phaser.GameObjects.Graphics;
  private energyLabel!: Phaser.GameObjects.Text;
  private comboText!: Phaser.GameObjects.Text;
  private powerUpIndicators: Phaser.GameObjects.Text[] = [];
  private displayScore = 0;
  private targetScore = 0;
  private comboState: ComboState = { count: 0, lastKillTime: 0, multiplier: 1, active: false };

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.create();
  }

  private create(): void {
    const fontFamily = "'Press Start 2P', 'Courier New', monospace";

    // Score with modern style
    this.scoreText = this.scene.add.text(8, 8, 'SCORE 0000000', {
      fontFamily,
      fontSize: '9px',
      color: '#00e5ff',
    }).setDepth(100).setOrigin(0, 0);

    // Lives as ship icons
    this.livesContainer = this.scene.add.container(GAME_CONFIG.width - 8, 8).setDepth(100);
    this.updateLives(GAME_CONSTANTS.initialLives);

    // Level display
    this.levelText = this.scene.add.text(GAME_CONFIG.width / 2, 8, 'WAVE 1', {
      fontFamily,
      fontSize: '9px',
      color: '#b44aff',
    }).setDepth(100).setOrigin(0.5, 0);

    // Energy bar
    this.energyBg = this.scene.add.graphics().setDepth(99);
    this.energyGlow = this.scene.add.graphics().setDepth(98);
    this.energyBar = this.scene.add.graphics().setDepth(100);
    this.drawEnergyBg();

    this.energyLabel = this.scene.add.text(8, GAME_CONFIG.height - 18, 'ENERGY', {
      fontFamily,
      fontSize: '7px',
      color: '#666688',
    }).setDepth(100).setOrigin(0, 0.5);

    // Combo text (hidden by default)
    this.comboText = this.scene.add.text(GAME_CONFIG.width / 2, 60, '', {
      fontFamily,
      fontSize: '12px',
      color: '#ff2d95',
      stroke: '#000000',
      strokeThickness: 3,
    }).setDepth(200).setOrigin(0.5, 0.5).setAlpha(0);
  }

  private drawEnergyBg(): void {
    const x = 52;
    const y = GAME_CONFIG.height - 24;
    const w = GAME_CONFIG.width - 60;
    const h = 12;

    this.energyBg.clear();
    // Glass background
    this.energyBg.fillStyle(COLORS.uiGlass, 0.7);
    this.energyBg.fillRoundedRect(x, y, w, h, 3);
    // Border
    this.energyBg.lineStyle(1, COLORS.uiBorder, 0.5);
    this.energyBg.strokeRoundedRect(x, y, w, h, 3);
  }

  updateScore(score: number): void {
    this.targetScore = score;
  }

  animateScore(): void {
    if (this.displayScore < this.targetScore) {
      const diff = this.targetScore - this.displayScore;
      const step = Math.max(1, Math.ceil(diff * 0.15));
      this.displayScore = Math.min(this.displayScore + step, this.targetScore);
      this.scoreText.setText(`SCORE ${this.displayScore.toString().padStart(7, '0')}`);
    }
  }

  updateLives(lives: number): void {
    this.livesContainer.removeAll(true);

    for (let i = 0; i < lives; i++) {
      // Mini ship icons
      const g = this.scene.add.graphics();
      g.fillStyle(COLORS.neonCyan, 0.8);
      g.fillTriangle(0, 8, 4, 0, 8, 8);
      g.fillStyle(COLORS.white, 0.5);
      g.fillTriangle(2, 7, 4, 2, 6, 7);

      const x = -(i * 14) - 4;
      g.setPosition(x, 0);
      this.livesContainer.add(g);
    }
  }

  updateLevel(level: number): void {
    this.levelText.setText(`WAVE ${level}`);
    // Pulse animation
    this.scene.tweens.add({
      targets: this.levelText,
      scaleX: 1.3,
      scaleY: 1.3,
      yoyo: true,
      duration: 200,
      ease: 'Quad.easeOut',
    });
  }

  updateEnergy(energy: number, maxEnergy: number, time?: number): void {
    const x = 53;
    const y = GAME_CONFIG.height - 23;
    const w = GAME_CONFIG.width - 62;
    const h = 10;
    const ratio = Math.max(0, energy / maxEnergy);

    this.energyBar.clear();
    this.energyGlow.clear();

    if (ratio <= 0) return;

    // Energy bar gradient
    let colorStart: number;
    let colorEnd: number;
    if (ratio > 0.6) {
      colorStart = COLORS.neonGreen;
      colorEnd = 0x00aa44;
    } else if (ratio > 0.3) {
      colorStart = COLORS.neonYellow;
      colorEnd = COLORS.neonOrange;
    } else {
      colorStart = COLORS.neonOrange;
      colorEnd = 0xff0000;
    }

    // Main bar
    this.energyBar.fillStyle(colorStart, 0.9);
    this.energyBar.fillRoundedRect(x, y, w * ratio, h, 2);

    // Shine on top half
    this.energyBar.fillStyle(0xffffff, 0.15);
    this.energyBar.fillRoundedRect(x, y, w * ratio, h / 2, { tl: 2, tr: 2, bl: 0, br: 0 });

    // Glow when low
    if (ratio < 0.3 && time) {
      const pulse = 0.1 + Math.sin(time * 0.008) * 0.08;
      this.energyGlow.fillStyle(0xff0000, pulse);
      this.energyGlow.fillRoundedRect(x - 2, y - 2, (w * ratio) + 4, h + 4, 4);
    }
  }

  flashEnergyBar(low: boolean): void {
    if (low) {
      this.energyLabel.setColor('#ff4444');
      // Pulse animation
      this.scene.tweens.add({
        targets: this.energyLabel,
        alpha: 0.3,
        yoyo: true,
        repeat: -1,
        duration: 400,
      });
    } else {
      this.energyLabel.setColor('#666688');
      this.scene.tweens.killTweensOf(this.energyLabel);
      this.energyLabel.setAlpha(1);
    }
  }

  // Combo system
  registerKill(time: number): number {
    if (time - this.comboState.lastKillTime < VFX_CONFIG.comboTimeWindow) {
      this.comboState.count++;
    } else {
      this.comboState.count = 1;
    }
    this.comboState.lastKillTime = time;

    const multiplierIndex = Math.min(this.comboState.count - 1, VFX_CONFIG.comboScoreMultiplier.length - 1);
    this.comboState.multiplier = VFX_CONFIG.comboScoreMultiplier[multiplierIndex];

    if (this.comboState.count >= 2) {
      this.comboState.active = true;
      this.showCombo();
    }

    return this.comboState.multiplier;
  }

  private showCombo(): void {
    const text = `${this.comboState.count}x COMBO`;
    this.comboText.setText(text);
    this.comboText.setAlpha(1);
    this.comboText.setScale(0.5);

    this.scene.tweens.killTweensOf(this.comboText);
    this.scene.tweens.add({
      targets: this.comboText,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 150,
      yoyo: true,
      hold: 800,
      onComplete: () => {
        this.scene.tweens.add({
          targets: this.comboText,
          alpha: 0,
          duration: 300,
        });
      },
    });
  }

  getComboMultiplier(): number {
    return this.comboState.multiplier;
  }

  getComboCount(): number {
    return this.comboState.count;
  }

  showPowerUpNotification(name: string, color: number): void {
    const hexColor = '#' + color.toString(16).padStart(6, '0');
    const text = this.scene.add.text(
      GAME_CONFIG.width / 2,
      GAME_CONFIG.height / 2 - 60,
      name,
      {
        fontFamily: "'Press Start 2P', 'Courier New', monospace",
        fontSize: '10px',
        color: hexColor,
        stroke: '#000000',
        strokeThickness: 3,
      }
    ).setDepth(200).setOrigin(0.5, 0.5).setScale(0);

    this.scene.tweens.add({
      targets: text,
      scaleX: 1,
      scaleY: 1,
      duration: 200,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.scene.tweens.add({
          targets: text,
          y: text.y - 30,
          alpha: 0,
          duration: 800,
          delay: 500,
          onComplete: () => text.destroy(),
        });
      },
    });
  }

  updateScorePopup(x: number, y: number, score: number, multiplier: number): void {
    const text = multiplier > 1 ? `+${score} x${multiplier}` : `+${score}`;
    const color = multiplier > 1 ? '#ff2d95' : '#fbff00';

    const popup = this.scene.add.text(x, y - 10, text, {
      fontFamily: "'Press Start 2P', 'Courier New', monospace",
      fontSize: '8px',
      color,
      stroke: '#000000',
      strokeThickness: 2,
    }).setDepth(200).setOrigin(0.5, 0.5);

    this.scene.tweens.add({
      targets: popup,
      y: popup.y - 30,
      alpha: 0,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 700,
      onComplete: () => popup.destroy(),
    });
  }

  showWaveClear(level: number): void {
    const text = this.scene.add.text(
      GAME_CONFIG.width / 2,
      GAME_CONFIG.height / 2 - 20,
      'WAVE CLEAR!',
      {
        fontFamily: "'Press Start 2P', 'Courier New', monospace",
        fontSize: '14px',
        color: '#39ff14',
        stroke: '#000000',
        strokeThickness: 4,
      }
    ).setDepth(200).setOrigin(0.5, 0.5).setScale(0);

    // Bounce in
    this.scene.tweens.add({
      targets: text,
      scaleX: 1,
      scaleY: 1,
      duration: 300,
      ease: 'Back.easeOut',
    });

    const text2 = this.scene.add.text(
      GAME_CONFIG.width / 2,
      GAME_CONFIG.height / 2 + 10,
      `+${GAME_CONSTANTS.waveClearBonus}`,
      {
        fontFamily: "'Press Start 2P', 'Courier New', monospace",
        fontSize: '10px',
        color: '#fbff00',
        stroke: '#000000',
        strokeThickness: 3,
      }
    ).setDepth(200).setOrigin(0.5, 0.5).setAlpha(0);

    this.scene.tweens.add({
      targets: text2,
      alpha: 1,
      delay: 300,
      duration: 300,
    });

    this.scene.tweens.add({
      targets: [text, text2],
      alpha: 0,
      yoyo: false,
      duration: 1500,
      delay: 2000,
      onComplete: () => { text.destroy(); text2.destroy(); },
    });
  }

  update(time: number): void {
    this.animateScore();
  }
}