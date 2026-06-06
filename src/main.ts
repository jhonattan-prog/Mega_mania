import Phaser from 'phaser';
import { GAME_CONFIG } from './config';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';
import { GameOverScene } from './scenes/GameOverScene';
import { SettingsManager } from './managers/SettingsManager';

// Auto-detect quality
const settings = SettingsManager.getInstance();
settings.autoDetectQuality();

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_CONFIG.width,
  height: GAME_CONFIG.height,
  parent: 'game',
  backgroundColor: '#0a0a1a',
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    min: {
      width: GAME_CONFIG.width,
      height: GAME_CONFIG.height,
    },
    max: {
      width: GAME_CONFIG.width * 4,
      height: GAME_CONFIG.height * 4,
    },
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  input: {
    keyboard: true,
    mouse: true,
    touch: true,
  },
  scene: [BootScene, MenuScene, GameScene, GameOverScene],
  callbacks: {
    postBoot: () => {
      // Hide loading screen once game is ready
      const loading = document.getElementById('loading');
      if (loading) {
        loading.classList.add('hidden');
        setTimeout(() => loading.remove(), 600);
      }
    },
  },
};

new Phaser.Game(config);