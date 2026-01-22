import * as THREE from 'three';

export type ParticleType = 'harvest' | 'collect' | 'coins' | 'heart' | 'sparkle';

interface ParticleConfig {
  color: number;
  count: number;
  speed: number;
  lifetime: number;
  size: number;
}

const PARTICLE_CONFIGS: Record<ParticleType, ParticleConfig> = {
  harvest: {
    color: 0x90EE90,
    count: 15,
    speed: 2,
    lifetime: 1.0,
    size: 0.15,
  },
  collect: {
    color: 0xFFD700,
    count: 10,
    speed: 1.5,
    lifetime: 0.8,
    size: 0.12,
  },
  coins: {
    color: 0xFFD700,
    count: 8,
    speed: 2.5,
    lifetime: 1.2,
    size: 0.1,
  },
  heart: {
    color: 0xFF69B4,
    count: 5,
    speed: 1.0,
    lifetime: 1.5,
    size: 0.2,
  },
  sparkle: {
    color: 0xFFFFFF,
    count: 20,
    speed: 3,
    lifetime: 0.6,
    size: 0.08,
  },
};

interface Particle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  lifetime: number;
  maxLifetime: number;
}

export class ParticleSystem {
  private scene: THREE.Scene;
  private particles: Particle[] = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  spawn(type: ParticleType, x: number, y: number, z: number): void {
    const config = PARTICLE_CONFIGS[type];

    for (let i = 0; i < config.count; i++) {
      // Create particle geometry
      const geometry = new THREE.SphereGeometry(config.size, 6, 6);
      const material = new THREE.MeshBasicMaterial({
        color: config.color,
        transparent: true,
        opacity: 1,
      });
      const mesh = new THREE.Mesh(geometry, material);

      // Set initial position
      mesh.position.set(x, y, z);

      // Random velocity
      const angle = Math.random() * Math.PI * 2;
      const elevation = Math.random() * Math.PI * 0.5 - Math.PI * 0.25; // -45 to +45 degrees
      const speed = config.speed * (0.5 + Math.random() * 0.5);

      const velocity = new THREE.Vector3(
        Math.cos(angle) * Math.cos(elevation) * speed,
        Math.sin(elevation) * speed + 1, // Always go up a bit
        Math.sin(angle) * Math.cos(elevation) * speed
      );

      this.scene.add(mesh);

      this.particles.push({
        mesh,
        velocity,
        lifetime: 0,
        maxLifetime: config.lifetime,
      });
    }
  }

  update(deltaTime: number): void {
    const gravity = -9.8;

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];

      // Update lifetime
      particle.lifetime += deltaTime;

      if (particle.lifetime >= particle.maxLifetime) {
        // Remove particle
        this.scene.remove(particle.mesh);
        particle.mesh.geometry.dispose();
        if (particle.mesh.material instanceof THREE.Material) {
          particle.mesh.material.dispose();
        }
        this.particles.splice(i, 1);
        continue;
      }

      // Apply gravity
      particle.velocity.y += gravity * deltaTime;

      // Update position
      particle.mesh.position.add(
        new THREE.Vector3(
          particle.velocity.x * deltaTime,
          particle.velocity.y * deltaTime,
          particle.velocity.z * deltaTime
        )
      );

      // Fade out
      const progress = particle.lifetime / particle.maxLifetime;
      if (particle.mesh.material instanceof THREE.MeshBasicMaterial) {
        particle.mesh.material.opacity = 1 - progress;
      }

      // Slight rotation for visual interest
      particle.mesh.rotation.x += deltaTime * 2;
      particle.mesh.rotation.y += deltaTime * 3;
    }
  }

  clear(): void {
    for (const particle of this.particles) {
      this.scene.remove(particle.mesh);
      particle.mesh.geometry.dispose();
      if (particle.mesh.material instanceof THREE.Material) {
        particle.mesh.material.dispose();
      }
    }
    this.particles = [];
  }
}
