import * as THREE from 'three';

export class Controls {
  private camera: THREE.Camera;
  private element: HTMLElement;
  private isLocked: boolean = false;

  // Movement state
  private moveForward: boolean = false;
  private moveBackward: boolean = false;
  private moveLeft: boolean = false;
  private moveRight: boolean = false;
  private moveUp: boolean = false;
  private moveDown: boolean = false;

  // Rotation
  private euler: THREE.Euler = new THREE.Euler(0, 0, 0, 'YXZ');
  private readonly minPolarAngle: number = 0;
  private readonly maxPolarAngle: number = Math.PI;

  // Movement speed
  private moveSpeed: number = 10.0; // units per second

  constructor(camera: THREE.Camera, element: HTMLElement) {
    this.camera = camera;
    this.element = element;

    this.element.addEventListener('click', () => {
      this.lock();
    });

    document.addEventListener('pointerlockchange', () => {
      this.isLocked = document.pointerLockElement === this.element;
    });

    document.addEventListener('mousemove', (event) => {
      if (!this.isLocked) return;

      const movementX = event.movementX || 0;
      const movementY = event.movementY || 0;

      this.euler.setFromQuaternion(this.camera.quaternion);

      this.euler.y -= movementX * 0.002;
      this.euler.x -= movementY * 0.002;

      this.euler.x = Math.max(
        Math.PI / 2 - this.maxPolarAngle,
        Math.min(Math.PI / 2 - this.minPolarAngle, this.euler.x)
      );

      this.camera.quaternion.setFromEuler(this.euler);
    });

    document.addEventListener('keydown', (event) => {
      this.onKeyDown(event);
    });

    document.addEventListener('keyup', (event) => {
      this.onKeyUp(event);
    });
  }

  private onKeyDown(event: KeyboardEvent): void {
    switch (event.code) {
      case 'KeyW':
        this.moveForward = true;
        break;
      case 'KeyA':
        this.moveLeft = true;
        break;
      case 'KeyS':
        this.moveBackward = true;
        break;
      case 'KeyD':
        this.moveRight = true;
        break;
      case 'Space':
        this.moveUp = true;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.moveDown = true;
        break;
    }
  }

  private onKeyUp(event: KeyboardEvent): void {
    switch (event.code) {
      case 'KeyW':
        this.moveForward = false;
        break;
      case 'KeyA':
        this.moveLeft = false;
        break;
      case 'KeyS':
        this.moveBackward = false;
        break;
      case 'KeyD':
        this.moveRight = false;
        break;
      case 'Space':
        this.moveUp = false;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.moveDown = false;
        break;
    }
  }

  lock(): void {
    this.element.requestPointerLock();
  }

  unlock(): void {
    document.exitPointerLock();
  }

  update(deltaTime: number): void {
    if (!this.isLocked) return;

    const moveDistance = this.moveSpeed * deltaTime;

    // Get forward and right directions
    const forward = new THREE.Vector3();
    const right = new THREE.Vector3();

    this.camera.getWorldDirection(forward);
    right.crossVectors(forward, this.camera.up).normalize();
    forward.y = 0; // Keep movement on horizontal plane
    forward.normalize();

    // Apply movement
    if (this.moveForward) {
      this.camera.position.addScaledVector(forward, moveDistance);
    }
    if (this.moveBackward) {
      this.camera.position.addScaledVector(forward, -moveDistance);
    }
    if (this.moveLeft) {
      this.camera.position.addScaledVector(right, -moveDistance);
    }
    if (this.moveRight) {
      this.camera.position.addScaledVector(right, moveDistance);
    }
    if (this.moveUp) {
      this.camera.position.y += moveDistance;
    }
    if (this.moveDown) {
      this.camera.position.y -= moveDistance;
    }
  }
}
