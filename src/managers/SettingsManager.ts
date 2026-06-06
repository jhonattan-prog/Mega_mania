import { GameSettings, QualityLevel } from '../types';

const STORAGE_KEY = 'megamania_settings';
const HIGHSCORE_KEY = 'megamania_highscore';
const HIGHSCORES_KEY = 'megamania_highscores';

export class SettingsManager {
  private static instance: SettingsManager | null = null;
  private settings: GameSettings;

  private constructor() {
    this.settings = this.load();
  }

  static getInstance(): SettingsManager {
    if (!SettingsManager.instance) {
      SettingsManager.instance = new SettingsManager();
    }
    return SettingsManager.instance;
  }

  private load(): GameSettings {
    const defaults: GameSettings = {
      quality: 'high',
      volume: 0.7,
      musicEnabled: true,
      sfxEnabled: true,
      touchControlType: 'buttons',
    };

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...defaults, ...parsed };
      }
    } catch {
      // Ignore parse errors
    }
    return defaults;
  }

  save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
    } catch {
      // Ignore storage errors
    }
  }

  get quality(): QualityLevel { return this.settings.quality; }
  set quality(v: QualityLevel) { this.settings.quality = v; this.save(); }

  get volume(): number { return this.settings.volume; }
  set volume(v: number) { this.settings.volume = Phaser.Math.Clamp(v, 0, 1); this.save(); }

  get musicEnabled(): boolean { return this.settings.musicEnabled; }
  set musicEnabled(v: boolean) { this.settings.musicEnabled = v; this.save(); }

  get sfxEnabled(): boolean { return this.settings.sfxEnabled; }
  set sfxEnabled(v: boolean) { this.settings.sfxEnabled = v; this.save(); }

  get touchControlType(): 'buttons' | 'joystick' { return this.settings.touchControlType; }
  set touchControlType(v: 'buttons' | 'joystick') { this.settings.touchControlType = v; this.save(); }

  // High scores
  getHighScore(): number {
    try {
      return parseInt(localStorage.getItem(HIGHSCORE_KEY) || '0', 10);
    } catch {
      return 0;
    }
  }

  setHighScore(score: number): boolean {
    const current = this.getHighScore();
    if (score > current) {
      try {
        localStorage.setItem(HIGHSCORE_KEY, score.toString());
      } catch {
        // Ignore
      }
      this.addToLeaderboard(score);
      return true;
    }
    return false;
  }

  getLeaderboard(): { score: number; date: string }[] {
    try {
      const data = localStorage.getItem(HIGHSCORES_KEY);
      if (data) return JSON.parse(data);
    } catch {
      // Ignore
    }
    return [];
  }

  private addToLeaderboard(score: number): void {
    const board = this.getLeaderboard();
    board.push({ score, date: new Date().toLocaleDateString('pt-BR') });
    board.sort((a, b) => b.score - a.score);
    const top10 = board.slice(0, 10);
    try {
      localStorage.setItem(HIGHSCORES_KEY, JSON.stringify(top10));
    } catch {
      // Ignore
    }
  }

  /** Detect device performance and set quality accordingly */
  autoDetectQuality(): void {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

    if (!gl) {
      this.quality = 'low';
      return;
    }

    // Check for mobile
    const isMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile/i.test(navigator.userAgent);
    const touchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    if (isMobile || (touchDevice && window.innerWidth < 768)) {
      this.quality = 'medium';
    } else {
      this.quality = 'high';
    }
  }
}
