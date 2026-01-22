import * as THREE from 'three';

export class TimeManager {
  private dayNumber: number = 1;
  private timeOfDay: number = 0.3; // 0 = midnight, 0.5 = noon, 1.0 = midnight (0.3 = morning start)
  private timeSpeed: number = 0.02; // How fast time passes (lower = slower)
  private isPaused: boolean = false;

  // Lighting references
  private ambientLight: THREE.AmbientLight;
  private directionalLight: THREE.DirectionalLight;
  private scene: THREE.Scene;

  // Time change callbacks
  private onNewDay: (() => void)[] = [];

  constructor(scene: THREE.Scene, ambientLight: THREE.AmbientLight, directionalLight: THREE.DirectionalLight) {
    this.scene = scene;
    this.ambientLight = ambientLight;
    this.directionalLight = directionalLight;
  }

  update(deltaTime: number): void {
    if (this.isPaused) return;

    // Advance time
    this.timeOfDay += deltaTime * this.timeSpeed;

    // New day at midnight
    if (this.timeOfDay >= 1.0) {
      this.timeOfDay = 0;
      this.dayNumber++;
      this.onNewDay.forEach(callback => callback());
    }

    // Update lighting based on time of day
    this.updateLighting();
  }

  private updateLighting(): void {
    // Calculate sun position and lighting intensity
    const sunAngle = this.timeOfDay * Math.PI * 2;

    // Sun position (rises in east, sets in west)
    const sunHeight = Math.sin(sunAngle);
    const sunX = Math.cos(sunAngle) * 20;
    const sunY = Math.max(sunHeight * 30, -10);
    const sunZ = 10;

    this.directionalLight.position.set(sunX, sunY, sunZ);

    // Calculate light intensity based on time
    let lightIntensity: number;
    let ambientIntensity: number;
    let skyColor: number;

    // Dawn (0.2 - 0.3)
    if (this.timeOfDay < 0.25) {
      const t = this.timeOfDay / 0.25;
      lightIntensity = 0.3 + t * 0.5; // 0.3 -> 0.8
      ambientIntensity = 0.2 + t * 0.4; // 0.2 -> 0.6
      skyColor = this.lerpColor(0x1a1a2e, 0x87ceeb, t); // Dark blue -> Sky blue
    }
    // Day (0.25 - 0.7)
    else if (this.timeOfDay < 0.7) {
      lightIntensity = 0.8;
      ambientIntensity = 0.6;
      skyColor = 0x87ceeb; // Sky blue
    }
    // Dusk (0.7 - 0.8)
    else if (this.timeOfDay < 0.8) {
      const t = (this.timeOfDay - 0.7) / 0.1;
      lightIntensity = 0.8 - t * 0.5; // 0.8 -> 0.3
      ambientIntensity = 0.6 - t * 0.4; // 0.6 -> 0.2
      skyColor = this.lerpColor(0x87ceeb, 0xff6b35, t); // Sky blue -> Orange sunset
    }
    // Night (0.8 - 1.0)
    else {
      const t = (this.timeOfDay - 0.8) / 0.2;
      lightIntensity = 0.3 - t * 0.1; // 0.3 -> 0.2
      ambientIntensity = 0.2 - t * 0.1; // 0.2 -> 0.1
      skyColor = this.lerpColor(0xff6b35, 0x1a1a2e, t); // Orange -> Dark blue
    }

    this.directionalLight.intensity = lightIntensity;
    this.ambientLight.intensity = ambientIntensity;
    this.scene.background = new THREE.Color(skyColor);
  }

  private lerpColor(color1: number, color2: number, t: number): number {
    const c1 = new THREE.Color(color1);
    const c2 = new THREE.Color(color2);
    return c1.lerp(c2, t).getHex();
  }

  // Get current time as readable string
  getTimeString(): string {
    const hours = Math.floor(this.timeOfDay * 24);
    const minutes = Math.floor((this.timeOfDay * 24 * 60) % 60);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  }

  getDayNumber(): number {
    return this.dayNumber;
  }

  getTimeOfDay(): number {
    return this.timeOfDay;
  }

  // Check if it's nighttime (for sleep mechanic)
  isNightTime(): boolean {
    return this.timeOfDay > 0.75 || this.timeOfDay < 0.25;
  }

  // Sleep mechanic - advance to next morning
  sleep(): void {
    this.timeOfDay = 0.3; // Wake up at morning
    this.dayNumber++;
    this.onNewDay.forEach(callback => callback());
  }

  pause(): void {
    this.isPaused = true;
  }

  resume(): void {
    this.isPaused = false;
  }

  registerNewDayCallback(callback: () => void): void {
    this.onNewDay.push(callback);
  }

  // Get time period for display
  getTimePeriod(): string {
    if (this.timeOfDay < 0.25) return '🌙 Night';
    if (this.timeOfDay < 0.5) return '🌅 Morning';
    if (this.timeOfDay < 0.75) return '☀️ Afternoon';
    return '🌆 Evening';
  }
}
