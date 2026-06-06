import Phaser from 'phaser';
import { GAME_CONFIG, COLORS } from '../config';
import { AudioManager } from '../managers/AudioManager';
import { StarfieldManager } from '../managers/StarfieldManager';
import { ParticleManager } from '../managers/ParticleManager';
import { SettingsManager } from '../managers/SettingsManager';
import { GameStats } from '../types';

export class GameOverScene extends Phaser.Scene {
  private score = 0;
  private level = 0;
  private won = false;
  private stats: GameStats | null = null;
  private audioManager!: AudioManager;
  private starfield!: StarfieldManager;
  private particles!: ParticleManager;

  constructor() {
    super({ key: 'GameOverScene' });
  }

  init(data: { score: number; level: number; won?: boolean; audioManager: AudioManager; stats?: GameStats }): void {
    this.score = data.score || 0;
    this.level = data.level || 0;
    this.won = data.won || false;
    this.audioManager = data.audioManager || new AudioManager();
    this.stats = data.stats || null;
  }

  create(): void {
    const fontFamily = "'Press Start 2P', 'Courier New', monospace";

    // Dynamic background
    this.starfield = new StarfieldManager(this);
    this.particles = new ParticleManager(this);

    // === Title ===
    const titleText = this.won ? 'VITÓRIA!' : 'GAME OVER';
    const titleColor = this.won ? '#39ff14' : '#ff2d95';
    const titleGlowColor = this.won ? COLORS.neonGreen : COLORS.neonPink;

    // Glow
    const titleGlow = this.add.text(GAME_CONFIG.width / 2, 80, titleText, {
      fontFamily,
      fontSize: '20px',
      color: titleColor,
    }).setOrigin(0.5, 0.5).setDepth(9).setAlpha(0.3);

    const title = this.add.text(GAME_CONFIG.width / 2, 80, titleText, {
      fontFamily,
      fontSize: '20px',
      color: '#ffffff',
      stroke: titleColor,
      strokeThickness: 4,
    }).setOrigin(0.5, 0.5).setDepth(10).setScale(0);

    // Bounce in title
    this.tweens.add({
      targets: title,
      scaleX: 1,
      scaleY: 1,
      duration: 500,
      ease: 'Back.easeOut',
    });

    // Glow pulse
    this.tweens.add({
      targets: titleGlow,
      alpha: 0.5,
      scaleX: 1.05,
      scaleY: 1.05,
      yoyo: true,
      repeat: -1,
      duration: 1200,
    });

    // Glitch effect for Game Over
    if (!this.won) {
      this.time.addEvent({
        delay: 2000,
        loop: true,
        callback: () => {
          const ox = Phaser.Math.Between(-3, 3);
          title.setX(GAME_CONFIG.width / 2 + ox);
          this.time.delayedCall(80, () => title.setX(GAME_CONFIG.width / 2));
        },
      });
    }

    // === Score display with typing effect ===
    const scoreStr = `SCORE ${this.score.toString().padStart(7, '0')}`;
    const scoreText = this.add.text(GAME_CONFIG.width / 2, 130, '', {
      fontFamily,
      fontSize: '12px',
      color: '#00e5ff',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5, 0.5).setDepth(10);

    // Typing animation
    let charIndex = 0;
    this.time.addEvent({
      delay: 60,
      repeat: scoreStr.length - 1,
      callback: () => {
        charIndex++;
        scoreText.setText(scoreStr.substring(0, charIndex));
      },
    });

    // Level
    this.add.text(GAME_CONFIG.width / 2, 158, `WAVE ${this.level}`, {
      fontFamily,
      fontSize: '8px',
      color: '#b44aff',
    }).setOrigin(0.5, 0.5).setDepth(10).setAlpha(0);

    this.tweens.add({
      targets: this.add.text(GAME_CONFIG.width / 2, 158, `WAVE ${this.level}`, {
        fontFamily,
        fontSize: '8px',
        color: '#b44aff',
      }).setOrigin(0.5, 0.5).setDepth(10),
      alpha: { from: 0, to: 1 },
      delay: 800,
      duration: 500,
    });

    // === Stats section ===
    if (this.stats) {
      const statsY = 195;
      const statsData = [
        { label: 'INIMIGOS', value: this.stats.enemiesDestroyed.toString() },
        { label: 'PRECISÃO', value: this.stats.shotsFired > 0 ? `${Math.round((this.stats.shotsHit / this.stats.shotsFired) * 100)}%` : '0%' },
        { label: 'MAX COMBO', value: `${this.stats.maxCombo}x` },
        { label: 'POWER-UPS', value: this.stats.powerUpsCollected.toString() },
        { label: 'TEMPO', value: this.formatTime(this.stats.timePlayed) },
      ];

      statsData.forEach((stat, i) => {
        const y = statsY + i * 18;
        this.add.text(40, y, stat.label, {
          fontFamily,
          fontSize: '6px',
          color: '#666688',
        }).setDepth(10).setAlpha(0);

        this.add.text(GAME_CONFIG.width - 40, y, stat.value, {
          fontFamily,
          fontSize: '6px',
          color: '#888899',
        }).setOrigin(1, 0).setDepth(10).setAlpha(0);

        // Fade in sequentially
        this.tweens.add({
          targets: this.children.getAll().slice(-2),
          alpha: 1,
          delay: 1200 + i * 150,
          duration: 300,
        });
      });
    }

    // === High Score ===
    const settings = SettingsManager.getInstance();
    const isNewRecord = settings.setHighScore(this.score);
    const highScoreY = this.stats ? 310 : 210;

    if (isNewRecord) {
      const recordText = this.add.text(GAME_CONFIG.width / 2, highScoreY, 'NOVO RECORDE!', {
        fontFamily,
        fontSize: '10px',
        color: '#fbff00',
        stroke: '#000000',
        strokeThickness: 3,
      }).setOrigin(0.5, 0.5).setDepth(10);

      this.tweens.add({
        targets: recordText,
        scaleX: 1.1,
        scaleY: 1.1,
        yoyo: true,
        repeat: -1,
        duration: 500,
      });
    } else {
      const hs = settings.getHighScore();
      this.add.text(GAME_CONFIG.width / 2, highScoreY, `RECORDE: ${hs.toString().padStart(7, '0')}`, {
        fontFamily,
        fontSize: '7px',
        color: '#444466',
      }).setOrigin(0.5, 0.5).setDepth(10);
    }

    // === Victory celebration ===
    if (this.won) {
      this.add.text(GAME_CONFIG.width / 2, highScoreY + 25, 'PARABÉNS!', {
        fontFamily,
        fontSize: '9px',
        color: '#fbff00',
        stroke: '#000000',
        strokeThickness: 3,
      }).setOrigin(0.5, 0.5).setDepth(10);

      // Fireworks
      this.time.addEvent({
        delay: 800,
        repeat: 4,
        callback: () => {
          const x = Phaser.Math.Between(40, GAME_CONFIG.width - 40);
          const y = Phaser.Math.Between(60, GAME_CONFIG.height / 2);
          this.particles.explode(x, y, Phaser.Utils.Array.GetRandom([
            COLORS.neonCyan, COLORS.neonPink, COLORS.neonGreen, COLORS.neonYellow,
          ]), 16);
        },
      });
    }

    // === Restart prompt ===
    const restartText = this.add.text(GAME_CONFIG.width / 2, GAME_CONFIG.height - 60, 'PRESSIONE PARA REINICIAR', {
      fontFamily,
      fontSize: '7px',
      color: '#fbff00',
    }).setOrigin(0.5, 0.5).setDepth(10);

    this.tweens.add({
      targets: restartText,
      alpha: 0.2,
      yoyo: true,
      repeat: -1,
      duration: 600,
    });

    // === Decorative lines ===
    const lineG = this.add.graphics().setDepth(10);
    lineG.lineStyle(1, COLORS.uiBorder, 0.3);
    lineG.lineBetween(20, 110, GAME_CONFIG.width - 20, 110);
    lineG.lineBetween(20, 175, GAME_CONFIG.width - 20, 175);

    // === Input ===
    this.input.keyboard?.once('keydown-ENTER', () => this.restart());
    this.input.keyboard?.once('keydown-SPACE', () => this.restart());
    this.input.once('pointerdown', () => this.restart());
  }

  update(time: number, delta: number): void {
    this.starfield.update(time, delta);
    this.particles.update(delta);
  }

  private formatTime(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  private restart(): void {
    this.input.removeAllListeners();
    this.starfield.destroy();
    this.scene.start('GameScene', { audioManager: this.audioManager });
  }
}