import Phaser from 'phaser';
import { GAME_CONFIG, COLORS, ENEMY_TYPES } from '../config';
import { AudioManager } from '../managers/AudioManager';
import { StarfieldManager } from '../managers/StarfieldManager';
import { SettingsManager } from '../managers/SettingsManager';

export class MenuScene extends Phaser.Scene {
  private audioManager!: AudioManager;
  private starfield!: StarfieldManager;
  private neonGlow = 0;
  private demoShip!: Phaser.GameObjects.Sprite;
  private demoShipDir = 1;

  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    this.audioManager = new AudioManager();

    // Dynamic starfield background
    this.starfield = new StarfieldManager(this);

    const fontFamily = "'Press Start 2P', 'Courier New', monospace";

    // === TITLE with neon glow ===
    // Glow layers (rendered behind)
    const titleGlow = this.add.text(GAME_CONFIG.width / 2, 70, 'MEGAMANIA', {
      fontFamily,
      fontSize: '22px',
      color: '#00e5ff',
    }).setOrigin(0.5, 0.5).setDepth(9).setAlpha(0.3);

    const title = this.add.text(GAME_CONFIG.width / 2, 70, 'MEGAMANIA', {
      fontFamily,
      fontSize: '22px',
      color: '#ffffff',
      stroke: '#00e5ff',
      strokeThickness: 4,
    }).setOrigin(0.5, 0.5).setDepth(10);

    // Neon pulse on glow
    this.tweens.add({
      targets: titleGlow,
      alpha: 0.5,
      scaleX: 1.03,
      scaleY: 1.03,
      yoyo: true,
      repeat: -1,
      duration: 1500,
      ease: 'Sine.easeInOut',
    });

    // Subtitle
    this.add.text(GAME_CONFIG.width / 2, 98, 'R E M A K E', {
      fontFamily,
      fontSize: '8px',
      color: '#b44aff',
      letterSpacing: 4,
    }).setOrigin(0.5, 0.5).setDepth(10);

    // === Demo ship flying ===
    this.demoShip = this.add.sprite(GAME_CONFIG.width / 2, 130, 'player')
      .setDepth(10)
      .setScale(2)
      .setAlpha(0.6);

    // === Enemy preview section ===
    const previewY = 190;
    this.add.text(GAME_CONFIG.width / 2, previewY - 16, '- ENEMIES -', {
      fontFamily,
      fontSize: '7px',
      color: '#666688',
    }).setOrigin(0.5, 0.5).setDepth(10);

    const enemyNames = ['BURGER', 'COOKIE', 'IRON', 'BOWTIE', 'DIAMOND'];
    ENEMY_TYPES.forEach((type, i) => {
      const x = 32 + i * 64;
      const y = previewY + 10;

      const enemyKey = `enemy_${type.name}`;
      if (this.textures.exists(enemyKey)) {
        const sprite = this.add.image(x, y, enemyKey).setScale(1.8).setDepth(10);
        // Floating animation
        this.tweens.add({
          targets: sprite,
          y: y + 6,
          yoyo: true,
          repeat: -1,
          duration: 1200 + i * 200,
          ease: 'Sine.easeInOut',
        });
      }

      const hexColor = '#' + type.color.toString(16).padStart(6, '0');
      this.add.text(x, y + 20, enemyNames[i], {
        fontFamily,
        fontSize: '5px',
        color: hexColor,
      }).setOrigin(0.5, 0).setDepth(10);
    });

    // === Instructions ===
    const instructionY = 270;
    const instructions = [
      { text: '← → MOVER', color: '#888899' },
      { text: 'ESPAÇO ATIRAR', color: '#888899' },
      { text: '', color: '#888899' },
      { text: 'DESTRUA ONDAS DE INIMIGOS', color: '#666688' },
      { text: 'ENERGIA DRENA CONSTANTEMENTE', color: '#666688' },
    ];

    instructions.forEach((line, i) => {
      if (line.text === '') return;
      this.add.text(GAME_CONFIG.width / 2, instructionY + i * 16, line.text, {
        fontFamily,
        fontSize: '6px',
        color: line.color,
      }).setOrigin(0.5, 0.5).setDepth(10);
    });

    // === High Score ===
    const settings = SettingsManager.getInstance();
    const highScore = settings.getHighScore();
    if (highScore > 0) {
      this.add.text(GAME_CONFIG.width / 2, 360, `RECORDE: ${highScore.toString().padStart(7, '0')}`, {
        fontFamily,
        fontSize: '7px',
        color: '#ff2d95',
      }).setOrigin(0.5, 0.5).setDepth(10);
    }

    // === Press to start ===
    const startText = this.add.text(GAME_CONFIG.width / 2, 400, 'PRESSIONE PARA JOGAR', {
      fontFamily,
      fontSize: '8px',
      color: '#fbff00',
    }).setOrigin(0.5, 0.5).setDepth(10);

    // Blinking start text
    this.tweens.add({
      targets: startText,
      alpha: 0.2,
      yoyo: true,
      repeat: -1,
      duration: 600,
    });

    // === Decorative line ===
    const lineG = this.add.graphics().setDepth(10);
    lineG.lineStyle(1, COLORS.uiBorder, 0.4);
    lineG.lineBetween(20, 155, GAME_CONFIG.width - 20, 155);
    lineG.lineBetween(20, 250, GAME_CONFIG.width - 20, 250);

    // === Input handlers ===
    this.input.keyboard?.once('keydown-ENTER', () => this.startGame());
    this.input.keyboard?.once('keydown-SPACE', () => this.startGame());
    this.input.once('pointerdown', () => this.startGame());
  }

  update(time: number, delta: number): void {
    // Update starfield
    this.starfield.update(time, delta);

    // Move demo ship back and forth
    if (this.demoShip) {
      this.demoShip.x += this.demoShipDir * 0.5;
      if (this.demoShip.x > GAME_CONFIG.width - 30) this.demoShipDir = -1;
      if (this.demoShip.x < 30) this.demoShipDir = 1;

      // Tilt based on direction
      this.demoShip.angle = this.demoShipDir * 10;
    }
  }

  private startGame(): void {
    this.audioManager.init();
    this.input.removeAllListeners();
    this.starfield.destroy();
    this.scene.start('GameScene', { audioManager: this.audioManager });
  }
}