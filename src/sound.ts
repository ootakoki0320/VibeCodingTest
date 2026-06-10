// Audio synthesis using Web Audio API for immersive SFX and optional low-key procedural BGM

class SoundEngine {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;
  private bpmIntervalId: any = null;
  private bgmPlaying: boolean = false;
  private currentBgmStep: number = 0;

  constructor() {
    // Lazy initialize to avoid browser autostart blockade
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public toggleMute() {
    this.muted = !this.muted;
    if (this.muted && this.bgmPlaying) {
      this.stopBGM();
    }
    return this.muted;
  }

  public isMuted() {
    return this.muted;
  }

  private createOscillator(
    type: OscillatorType,
    freq: number,
    duration: number,
    gainStart: number,
    gainEnd: number = 0.001
  ) {
    const ctx = this.initCtx();
    if (!ctx || this.muted) return null;

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    gainNode.gain.setValueAtTime(gainStart, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(gainEnd, ctx.currentTime + duration);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    return { osc, gainNode, ctx };
  }

  // Play a metallic sword slash sound with a sweeping pitch
  public playSlash() {
    try {
      const sound = this.createOscillator('sawtooth', 880, 0.15, 0.15);
      if (!sound) return;
      const { osc, ctx } = sound;
      osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.14);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {
      console.warn("SFX failed to play", e);
    }
  }

  // An extremely crispy, high-pitched metallic spark sound
  public playPerfectHit() {
    try {
      const now = this.initCtx()?.currentTime;
      if (!now) return;
      
      const osc1 = this.createOscillator('triangle', 987.77, 0.4, 0.25, 0.001); // B5 note
      const osc2 = this.createOscillator('sine', 1318.51, 0.35, 0.15, 0.001); // E6 note
      
      if (osc1) {
        osc1.osc.start();
        osc1.osc.stop(now + 0.4);
      }
      if (osc2) {
        osc2.osc.start();
        osc2.osc.stop(now + 0.35);
      }
    } catch (e) {
      console.warn(e);
    }
  }

  // A heavy, resonant bass hit for regular slashes on target
  public playNormalHit() {
    try {
      const sound = this.createOscillator('triangle', 330, 0.25, 0.3); // E4
      if (!sound) return;
      const { osc, ctx } = sound;
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.24);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch (e) {
      console.warn(e);
    }
  }

  // A high-frequency clean bell-like ping for a perfect shield parry
  public playParry() {
    try {
      const sound = this.createOscillator('sine', 1760, 0.35, 0.2, 0.001); // A6
      if (!sound) return;
      const { osc, ctx } = sound;
      osc.frequency.setValueAtTime(1760, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.34);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);

      // Add a small laser zap sub-sound
      const zap = this.createOscillator('triangle', 1200, 0.1, 0.15, 0.001);
      if (zap) {
        zap.osc.frequency.exponentialRampToValueAtTime(300, zap.ctx.currentTime + 0.1);
        zap.osc.start();
        zap.osc.stop(zap.ctx.currentTime + 0.1);
      }
    } catch (e) {
      console.warn(e);
    }
  }

  // A dull wooden/metal block sound for imperfect parry / blocks
  public playBlock() {
    try {
      const sound = this.createOscillator('square', 220, 0.15, 0.15, 0.001); // A3
      if (!sound) return;
      const { osc, ctx } = sound;
      osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.14);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {
      console.warn(e);
    }
  }

  // Ascending lovely sine wave notes for heals or item purchases
  public playHeal() {
    try {
      const ctx = this.initCtx();
      if (!ctx || this.muted) return;
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, i) => {
        const sound = this.createOscillator('sine', freq, 0.25, 0.15, 0.01);
        if (sound) {
          const startTime = now + i * 0.07;
          sound.osc.start(startTime);
          sound.gainNode.gain.setValueAtTime(0.15, startTime);
          sound.gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.2);
          sound.osc.stop(startTime + 0.25);
        }
      });
    } catch (e) {
      console.warn(e);
    }
  }

  // Heavy rumbling base explosion when enemy dies or boss enters
  public playExplosion() {
    try {
      const sound = this.createOscillator('sawtooth', 180, 0.6, 0.4);
      if (!sound) return;
      const { osc, ctx } = sound;
      osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.58);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch (e) {
      console.warn(e);
    }
  }

  // Ascending energetic laser sound for charging your Focus bar or standard upgrades
  public playSkillCharging() {
    try {
      const sound = this.createOscillator('sawtooth', 440, 0.3, 0.15);
      if (!sound) return;
      const { osc, ctx } = sound;
      osc.frequency.linearRampToValueAtTime(1760, ctx.currentTime + 0.28);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
      console.warn(e);
    }
  }

  // Dramatic drop for game over screen
  public playGameOver() {
    try {
      const ctx = this.initCtx();
      if (!ctx || this.muted) return;
      const now = ctx.currentTime;
      const notes = [392.00, 349.23, 311.13, 220.00]; // G4, F4, Eb4, A3
      notes.forEach((freq, i) => {
        const sound = this.createOscillator('sine', freq, 0.5, 0.2, 0.01);
        if (sound) {
          const startTime = now + i * 0.18;
          sound.osc.start(startTime);
          sound.gainNode.gain.setValueAtTime(0.2, startTime);
          sound.gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);
          sound.osc.stop(startTime + 0.5);
        }
      });
    } catch (e) {
      console.warn(e);
    }
  }

  // Procedural BGM player: extremely tiny looping beat
  public playBGM() {
    const ctx = this.initCtx();
    if (!ctx || this.muted || this.bgmPlaying) return;

    this.bgmPlaying = true;
    this.currentBgmStep = 0;

    const tempo = 130; // BPM
    const stepTime = 60 / tempo / 2; // Eighth notes

    // Recursive beat generator
    const nextBeat = () => {
      if (!this.bgmPlaying || this.muted) return;
      
      const currentTime = ctx.currentTime;
      
      // Step Sequencer beat (16 steps)
      const step = this.currentBgmStep % 16;
      
      // Retro chiptune bass melody
      const bassline = [
        110.00, 110.00, 130.81, 110.00, // A2, A2, C3, A2
        146.83, 146.83, 110.00, 164.81, // D3, D3, A2, E3
        110.00, 110.00, 130.81, 110.00, // A2, A2, C3, A2
        196.00, 174.61, 164.81, 130.81  // G3, F3, E3, C3
      ];

      const bassFreq = bassline[step];

      // Bass synth note
      if (step % 2 === 0) {
        const synth = this.createOscillator('triangle', bassFreq, stepTime * 0.9, 0.08, 0.01);
        if (synth) {
          synth.osc.start(currentTime);
          synth.osc.stop(currentTime + stepTime * 0.9);
        }
      }

      // Minimal retro hi-hat (noise synth or high sine)
      if (step % 4 === 2) {
        const hat = this.createOscillator('sine', 4000, 0.03, 0.015, 0.001);
        if (hat) {
          hat.osc.start(currentTime);
          hat.osc.stop(currentTime + 0.03);
        }
      }

      this.currentBgmStep++;
      this.bpmIntervalId = setTimeout(nextBeat, stepTime * 1000);
    };

    nextBeat();
  }

  public stopBGM() {
    this.bgmPlaying = false;
    if (this.bpmIntervalId) {
      clearTimeout(this.bpmIntervalId);
      this.bpmIntervalId = null;
    }
  }
}

export const sounds = new SoundEngine();
