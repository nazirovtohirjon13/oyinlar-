// Procedural Web Audio API synthesizer — zero external audio files required

class SoundEngine {
  private ctx: AudioContext | null = null;
  private muted = false;

  public setMuted(mute: boolean): void {
    this.muted = mute;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  private getContext(): AudioContext | null {
    if (this.muted) return null;
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private tone(freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.14, delay = 0): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  public playClick(): void {
    this.tone(540, 0.06, 'triangle', 0.08);
  }

  public playNote(freq: number, duration = 0.22): void {
    this.tone(freq, duration, 'sine', 0.14);
  }

  public playSuccess(): void {
    this.tone(523.25, 0.14, 'triangle', 0.14, 0);
    this.tone(659.25, 0.16, 'triangle', 0.14, 0.09);
    this.tone(783.99, 0.22, 'sine', 0.15, 0.18);
  }

  public playError(): void {
    this.tone(240, 0.16, 'sawtooth', 0.08, 0);
    this.tone(185, 0.22, 'triangle', 0.1, 0.1);
  }

  public playWin(): void {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, idx) => {
      this.tone(n, 0.24, 'triangle', 0.14, idx * 0.11);
    });
  }

  public playLaunch(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(660, now + 0.25);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.3);
  }

  public playAnimalSound(animal: 'mushuk' | 'kuchuk' | 'sigir' | 'qoy' | 'ordak' | 'arslon'): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const synthSweep = (fStart: number, fMid: number, fEnd: number, dur: number, type: OscillatorType, vol: number, offset = 0) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      const t = now + offset;
      osc.frequency.setValueAtTime(fStart, t);
      osc.frequency.linearRampToValueAtTime(fMid, t + dur * 0.45);
      osc.frequency.exponentialRampToValueAtTime(fEnd, t + dur);
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(vol, t + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + dur + 0.03);
    };

    switch (animal) {
      case 'mushuk': // Miyov: high rising-then-falling smooth meow
        synthSweep(520, 880, 460, 0.45, 'triangle', 0.16);
        break;
      case 'kuchuk': // Vov-vov: two short percussive barks
        synthSweep(320, 420, 170, 0.14, 'sawtooth', 0.12, 0);
        synthSweep(340, 450, 160, 0.16, 'sawtooth', 0.12, 0.22);
        break;
      case 'sigir': // Muuu: deep resonant moo
        synthSweep(135, 165, 120, 0.65, 'sawtooth', 0.11);
        break;
      case 'qoy': // Baaa: vibrato bleat
        synthSweep(340, 370, 310, 0.14, 'triangle', 0.13, 0);
        synthSweep(350, 380, 300, 0.14, 'triangle', 0.13, 0.16);
        synthSweep(340, 360, 290, 0.16, 'triangle', 0.13, 0.32);
        break;
      case 'ordak': // G'aq-g'aq: nasal quack
        synthSweep(460, 380, 320, 0.13, 'square', 0.07, 0);
        synthSweep(480, 390, 310, 0.13, 'square', 0.07, 0.19);
        break;
      case 'arslon': // Roar: low powerful sweep
        synthSweep(180, 140, 75, 0.55, 'sawtooth', 0.14);
        break;
    }
  }
}

export const soundEngine = new SoundEngine();
