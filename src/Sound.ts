// Simple Web Audio API sound effects using oscillators

class SoundManager {
  private audioContext: AudioContext;

  constructor() {
    this.audioContext = new AudioContext();
  }

  // Play a simple tone
  private playTone(
    frequency: number,
    duration: number,
    type: OscillatorType = 'sine'
  ): void {
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.type = type;
    oscillator.frequency.value = frequency;

    // Envelope for smoother sound
    const now = this.audioContext.currentTime;
    gainNode.gain.setValueAtTime(0.3, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);

    oscillator.start(now);
    oscillator.stop(now + duration);
  }

  // Sound for placing a block
  playPlaceSound(): void {
    this.playTone(440, 0.1, 'square'); // A note, short duration
  }

  // Sound for destroying a block
  playDestroySound(): void {
    this.playTone(220, 0.15, 'sawtooth'); // Lower pitch, slightly longer
  }

  // Sound for block collision/landing
  playCollisionSound(intensity: number = 1.0): void {
    // Use intensity to vary the sound
    const frequency = 150 + intensity * 50;
    const duration = 0.05 + intensity * 0.05;
    this.playTone(frequency, duration, 'triangle');
  }
}

export const soundManager = new SoundManager();
