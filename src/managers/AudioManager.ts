import { SettingsManager } from './SettingsManager';

export class AudioManager {
  private audioContext: AudioContext | null = null;
  private initialized = false;
  private masterGain: GainNode | null = null;
  private settings: SettingsManager;

  // Music
  private musicOscillators: OscillatorNode[] = [];
  private musicGains: GainNode[] = [];
  private musicPlaying = false;
  private musicBeat = 0;
  private musicInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.settings = SettingsManager.getInstance();
  }

  init(): void {
    if (this.initialized) return;
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = this.settings.volume;
      this.masterGain.connect(this.audioContext.destination);
      this.initialized = true;
    } catch (e) {
      console.warn('Web Audio API not supported', e);
    }
  }

  private resumeContext(): void {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  private getDestination(): AudioNode {
    return this.masterGain || this.audioContext!.destination;
  }

  setVolume(v: number): void {
    if (this.masterGain) {
      this.masterGain.gain.value = Phaser.Math.Clamp(v, 0, 1);
    }
  }

  playLaser(): void {
    if (!this.settings.sfxEnabled) return;
    this.resumeContext();
    if (!this.audioContext) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(900, now);
    osc.frequency.exponentialRampToValueAtTime(1800, now + 0.04);
    osc.frequency.exponentialRampToValueAtTime(500, now + 0.08);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    // Add slight reverb via delay
    const delay = ctx.createDelay();
    delay.delayTime.value = 0.03;
    const delayGain = ctx.createGain();
    delayGain.gain.value = 0.15;

    osc.connect(gain);
    gain.connect(this.getDestination());
    gain.connect(delay);
    delay.connect(delayGain);
    delayGain.connect(this.getDestination());

    osc.start(now);
    osc.stop(now + 0.12);
  }

  playExplosion(): void {
    if (!this.settings.sfxEnabled) return;
    this.resumeContext();
    if (!this.audioContext) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // Noise burst
    const bufferSize = ctx.sampleRate * 0.3;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.3, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(3000, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(200, now + 0.3);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.getDestination());
    noise.start(now);

    // Low boom
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.25);
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    osc.connect(gain);
    gain.connect(this.getDestination());
    osc.start(now);
    osc.stop(now + 0.35);
  }

  playPlayerHit(): void {
    if (!this.settings.sfxEnabled) return;
    this.resumeContext();
    if (!this.audioContext) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // Distorted sweep down
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const distortion = ctx.createWaveShaper();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.6);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

    // Simple distortion curve
    const curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      const x = (i * 2) / 256 - 1;
      curve[i] = (Math.PI + 4) * x / (Math.PI + 4 * Math.abs(x));
    }
    distortion.curve = curve;

    osc.connect(distortion);
    distortion.connect(gain);
    gain.connect(this.getDestination());
    osc.start(now);
    osc.stop(now + 0.6);

    // Secondary noise
    const bufferSize = ctx.sampleRate * 0.4;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0.2, now);
    ng.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
    noise.connect(ng);
    ng.connect(this.getDestination());
    noise.start(now);
  }

  playLevelUp(): void {
    if (!this.settings.sfxEnabled) return;
    this.resumeContext();
    if (!this.audioContext) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = now + i * 0.08;

      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);

      // Stereo feel with slight detuning
      const osc2 = ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.value = freq * 1.003;
      const gain2 = ctx.createGain();
      gain2.gain.setValueAtTime(0.08, t);
      gain2.gain.exponentialRampToValueAtTime(0.01, t + 0.35);

      osc.connect(gain);
      gain.connect(this.getDestination());
      osc.start(t);
      osc.stop(t + 0.35);

      osc2.connect(gain2);
      gain2.connect(this.getDestination());
      osc2.start(t);
      osc2.stop(t + 0.35);
    });
  }

  playGameOver(): void {
    if (!this.settings.sfxEnabled) return;
    this.resumeContext();
    if (!this.audioContext) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;
    const notes = [392, 349.23, 329.63, 293.66, 261.63];

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = now + i * 0.25;

      osc.type = 'square';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);

      osc.connect(gain);
      gain.connect(this.getDestination());
      osc.start(t);
      osc.stop(t + 0.5);
    });
  }

  playPowerUp(): void {
    if (!this.settings.sfxEnabled) return;
    this.resumeContext();
    if (!this.audioContext) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880, 1108.73, 1318.51];

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = now + i * 0.05;

      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);

      osc.connect(gain);
      gain.connect(this.getDestination());
      osc.start(t);
      osc.stop(t + 0.2);
    });
  }

  playCombo(comboCount: number): void {
    if (!this.settings.sfxEnabled) return;
    this.resumeContext();
    if (!this.audioContext) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;
    const basePitch = 600 + comboCount * 100;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(basePitch, now);
    osc.frequency.exponentialRampToValueAtTime(basePitch * 1.5, now + 0.08);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    osc.connect(gain);
    gain.connect(this.getDestination());
    osc.start(now);
    osc.stop(now + 0.15);
  }

  playShield(): void {
    if (!this.settings.sfxEnabled) return;
    this.resumeContext();
    if (!this.audioContext) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.15);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    osc.connect(gain);
    gain.connect(this.getDestination());
    osc.start(now);
    osc.stop(now + 0.3);
  }

  // Simple procedural background music
  startMusic(): void {
    if (!this.settings.musicEnabled || this.musicPlaying) return;
    this.resumeContext();
    if (!this.audioContext) return;

    this.musicPlaying = true;
    this.musicBeat = 0;

    const bassNotes = [65.41, 73.42, 82.41, 87.31]; // C2, D2, E2, F2
    const bpm = 120;
    const beatMs = 60000 / bpm;

    this.musicInterval = setInterval(() => {
      if (!this.audioContext || !this.musicPlaying) return;

      const ctx = this.audioContext;
      const now = ctx.currentTime;
      const noteIndex = this.musicBeat % bassNotes.length;
      const freq = bassNotes[noteIndex];

      // Bass
      const bassOsc = ctx.createOscillator();
      const bassGain = ctx.createGain();
      const bassFilter = ctx.createBiquadFilter();

      bassOsc.type = 'sawtooth';
      bassOsc.frequency.value = freq;
      bassFilter.type = 'lowpass';
      bassFilter.frequency.value = 400;
      bassGain.gain.setValueAtTime(0.06, now);
      bassGain.gain.exponentialRampToValueAtTime(0.01, now + beatMs / 1000 * 0.8);

      bassOsc.connect(bassFilter);
      bassFilter.connect(bassGain);
      bassGain.connect(this.getDestination());
      bassOsc.start(now);
      bassOsc.stop(now + beatMs / 1000);

      // Hi-hat on every beat
      if (this.musicBeat % 2 === 0) {
        const hihatBuf = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
        const hihatData = hihatBuf.getChannelData(0);
        for (let i = 0; i < hihatData.length; i++) {
          hihatData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (hihatData.length * 0.1));
        }
        const hihat = ctx.createBufferSource();
        hihat.buffer = hihatBuf;
        const hg = ctx.createGain();
        hg.gain.value = 0.03;
        const hf = ctx.createBiquadFilter();
        hf.type = 'highpass';
        hf.frequency.value = 8000;
        hihat.connect(hf);
        hf.connect(hg);
        hg.connect(this.getDestination());
        hihat.start(now);
      }

      this.musicBeat++;
    }, beatMs);
  }

  stopMusic(): void {
    this.musicPlaying = false;
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }
}