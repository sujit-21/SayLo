// Web Audio API Sound Effects for SAYLO (Zero external asset dependencies)
// Provides authentic messaging pops, chimes, and calling ringtones

class SoundEffectsManager {
  constructor() {
    this.audioCtx = null;
    this.ringtoneInterval = null;
    this.ringtoneGain = null;
  }

  getAudioContext() {
    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  // Check if sound is muted by user preference
  isSoundEnabled() {
    if (typeof localStorage === 'undefined') return true;
    const pref = localStorage.getItem('saylo_sound_enabled');
    return pref !== 'false';
  }

  // Message Sent "Pop" sound
  playSentSound() {
    if (!this.isSoundEnabled()) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(750, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1300, ctx.currentTime + 0.07);

      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.08);
    } catch (e) {
      // Audio autoplay policy or unavailable
    }
  }

  // Incoming Message "Chime" sound
  playReceivedSound() {
    if (!this.isSoundEnabled()) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // Note 1 (C6 - 1046 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(1046.5, now);
      gain1.gain.setValueAtTime(0.15, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.12);

      // Note 2 (E6 - 1318 Hz)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1318.5, now + 0.08);
      gain2.gain.setValueAtTime(0.18, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.28);
    } catch (e) {
      // Ignore
    }
  }

  // Call ringtone burst
  playRingtonePulse() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const duration = 1.6;

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(440, now);
      osc2.frequency.setValueAtTime(480, now);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.setValueAtTime(0.15, now + duration);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration + 0.1);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + duration + 0.1);
      osc2.stop(now + duration + 0.1);
    } catch (e) {
      // Ignore
    }
  }

  // Start continuous incoming call ringtone
  startIncomingCallRingtone() {
    if (!this.isSoundEnabled()) return;
    this.stopIncomingCallRingtone();
    this.playRingtonePulse();
    this.ringtoneInterval = setInterval(() => {
      this.playRingtonePulse();
    }, 3500);
  }

  // Stop incoming call ringtone
  stopIncomingCallRingtone() {
    if (this.ringtoneInterval) {
      clearInterval(this.ringtoneInterval);
      this.ringtoneInterval = null;
    }
  }
}

export const sounds = new SoundEffectsManager();
export default sounds;

