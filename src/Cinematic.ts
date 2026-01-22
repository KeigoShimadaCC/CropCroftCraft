import * as THREE from 'three';

interface CameraKeyframe {
  position: THREE.Vector3;
  lookAt: THREE.Vector3;
  duration: number; // seconds
  text?: string;
}

export class Cinematic {
  private camera: THREE.Camera;
  private keyframes: CameraKeyframe[] = [];
  private currentKeyframe: number = 0;
  private keyframeProgress: number = 0;
  private isPlaying: boolean = false;
  private textOverlay: HTMLElement | null = null;
  private onComplete: (() => void) | null = null;

  constructor(camera: THREE.Camera) {
    this.camera = camera;
    this.setupTextOverlay();
  }

  private setupTextOverlay(): void {
    this.textOverlay = document.createElement('div');
    this.textOverlay.style.position = 'fixed';
    this.textOverlay.style.top = '70%';
    this.textOverlay.style.left = '50%';
    this.textOverlay.style.transform = 'translate(-50%, -50%)';
    this.textOverlay.style.color = 'white';
    this.textOverlay.style.fontSize = '28px';
    this.textOverlay.style.fontFamily = 'system-ui, -apple-system, sans-serif';
    this.textOverlay.style.textAlign = 'center';
    this.textOverlay.style.textShadow = '3px 3px 8px rgba(0,0,0,0.8)';
    this.textOverlay.style.zIndex = '1500';
    this.textOverlay.style.padding = '20px 40px';
    this.textOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    this.textOverlay.style.borderRadius = '15px';
    this.textOverlay.style.maxWidth = '80%';
    this.textOverlay.style.display = 'none';
    this.textOverlay.style.opacity = '0';
    this.textOverlay.style.transition = 'opacity 0.5s ease-in-out';
    document.body.appendChild(this.textOverlay);
  }

  private showText(text: string): void {
    if (!this.textOverlay) return;
    this.textOverlay.textContent = text;
    this.textOverlay.style.display = 'block';
    // Trigger reflow for transition
    setTimeout(() => {
      if (this.textOverlay) {
        this.textOverlay.style.opacity = '1';
      }
    }, 50);
  }

  private hideText(): void {
    if (!this.textOverlay) return;
    this.textOverlay.style.opacity = '0';
    setTimeout(() => {
      if (this.textOverlay) {
        this.textOverlay.style.display = 'none';
      }
    }, 500);
  }

  setupFarmIntro(): void {
    this.keyframes = [
      // Opening shot - wide view from above
      {
        position: new THREE.Vector3(0, 15, 15),
        lookAt: new THREE.Vector3(0, 0, 0),
        duration: 3,
        text: 'Welcome to the Countryside...',
      },

      // Pan to player's house
      {
        position: new THREE.Vector3(8, 5, 10),
        lookAt: new THREE.Vector3(4, 2, 4),
        duration: 3,
        text: 'This is your new home.',
      },

      // Show the chickens near house
      {
        position: new THREE.Vector3(2, 2, 8),
        lookAt: new THREE.Vector3(3, 0.5, 6),
        duration: 2.5,
        text: 'Your chickens are already settling in.',
      },

      // Pan to the crop fields
      {
        position: new THREE.Vector3(-5, 6, 20),
        lookAt: new THREE.Vector3(0, 0, 18),
        duration: 3,
        text: 'The fields are ready for harvest.',
      },

      // Show neighbor houses
      {
        position: new THREE.Vector3(-15, 7, 8),
        lookAt: new THREE.Vector3(-10, 2, 6),
        duration: 2.5,
        text: 'Your neighbors are friendly farmers.',
      },

      // Show the barn
      {
        position: new THREE.Vector3(2, 8, -18),
        lookAt: new THREE.Vector3(6, 3, -20),
        duration: 3,
        text: 'The community barn awaits.',
      },

      // Show the well (gathering spot)
      {
        position: new THREE.Vector3(-3, 4, -2),
        lookAt: new THREE.Vector3(0, 1, -5),
        duration: 2.5,
        text: 'The village well - where neighbors meet.',
      },

      // Final shot - back to overview
      {
        position: new THREE.Vector3(5, 10, 12),
        lookAt: new THREE.Vector3(2, 2, 4),
        duration: 3,
        text: 'Your new life begins now.',
      },

      // End position (where player will start)
      {
        position: new THREE.Vector3(0, 3, 8),
        lookAt: new THREE.Vector3(0, 2, 0),
        duration: 1.5,
        text: '',
      },
    ];
  }

  play(onComplete?: () => void): void {
    this.isPlaying = true;
    this.currentKeyframe = 0;
    this.keyframeProgress = 0;
    this.onComplete = onComplete || null;

    // Set initial camera position
    if (this.keyframes.length > 0) {
      const firstKeyframe = this.keyframes[0];
      this.camera.position.copy(firstKeyframe.position);
      (this.camera as THREE.PerspectiveCamera).lookAt(firstKeyframe.lookAt);

      if (firstKeyframe.text) {
        this.showText(firstKeyframe.text);
      }
    }
  }

  update(deltaTime: number): void {
    if (!this.isPlaying || this.currentKeyframe >= this.keyframes.length - 1) {
      if (this.isPlaying && this.currentKeyframe >= this.keyframes.length - 1) {
        // Cinematic complete
        this.isPlaying = false;
        this.hideText();
        if (this.onComplete) {
          this.onComplete();
        }
      }
      return;
    }

    const current = this.keyframes[this.currentKeyframe];
    const next = this.keyframes[this.currentKeyframe + 1];

    this.keyframeProgress += deltaTime;

    if (this.keyframeProgress >= current.duration) {
      // Move to next keyframe
      this.currentKeyframe++;
      this.keyframeProgress = 0;

      // Show next text if available
      if (this.currentKeyframe < this.keyframes.length) {
        const nextKeyframe = this.keyframes[this.currentKeyframe];
        if (nextKeyframe.text) {
          this.showText(nextKeyframe.text);
        } else {
          this.hideText();
        }
      }
      return;
    }

    // Interpolate camera position and lookAt
    const t = this.keyframeProgress / current.duration;
    const eased = this.easeInOutCubic(t);

    // Interpolate position
    const newPosition = new THREE.Vector3().lerpVectors(
      current.position,
      next.position,
      eased
    );
    this.camera.position.copy(newPosition);

    // Interpolate lookAt
    const newLookAt = new THREE.Vector3().lerpVectors(
      current.lookAt,
      next.lookAt,
      eased
    );
    (this.camera as THREE.PerspectiveCamera).lookAt(newLookAt);
  }

  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  isActive(): boolean {
    return this.isPlaying;
  }

  skip(): void {
    if (!this.isPlaying) return;

    // Jump to final position
    if (this.keyframes.length > 0) {
      const finalKeyframe = this.keyframes[this.keyframes.length - 1];
      this.camera.position.copy(finalKeyframe.position);
      (this.camera as THREE.PerspectiveCamera).lookAt(finalKeyframe.lookAt);
    }

    this.isPlaying = false;
    this.hideText();

    if (this.onComplete) {
      this.onComplete();
    }
  }

  cleanup(): void {
    if (this.textOverlay) {
      document.body.removeChild(this.textOverlay);
      this.textOverlay = null;
    }
  }
}
