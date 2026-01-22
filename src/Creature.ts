import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { getPhysicsWorld } from './physics';

export type CreatureType = 'CHICKEN' | 'COW' | 'SHEEP' | 'PIG';
export type ResourceType = 'EGG' | 'MILK' | 'WOOL' | null;

export const CreatureColors: Record<CreatureType, number> = {
  CHICKEN: 0xffffff, // White
  COW: 0x000000, // Black and white (we'll use black)
  SHEEP: 0xf5f5f5, // Off-white
  PIG: 0xffc0cb, // Pink
};

// Resource data for each creature type
export const CreatureResources: Record<CreatureType, { type: ResourceType; cooldown: number }> = {
  CHICKEN: { type: 'EGG', cooldown: 30 }, // 30 seconds between eggs
  COW: { type: 'MILK', cooldown: 45 }, // 45 seconds between milk
  SHEEP: { type: 'WOOL', cooldown: 60 }, // 60 seconds between wool
  PIG: { type: null, cooldown: 0 }, // Pigs don't produce resources
};

export class Creature {
  mesh: THREE.Group;
  rigidBody: RAPIER.RigidBody;
  private scene: THREE.Scene;
  private type: CreatureType;
  private moveTimer: number = 0;
  private moveDirection: THREE.Vector3 = new THREE.Vector3();
  private moveDuration: number = 2; // Change direction every 2 seconds
  private moveSpeed: number = 0.5; // Slow wandering speed

  // Resource collection properties
  private resourceTimer: number = 0;
  private hasResource: boolean = false;
  private resourceIndicator: THREE.Mesh | null = null;

  constructor(
    scene: THREE.Scene,
    x: number,
    y: number,
    z: number,
    type: CreatureType
  ) {
    this.scene = scene;
    this.type = type;

    // Create creature mesh (simple voxel animal)
    this.mesh = this.createCreatureMesh(type);
    this.mesh.position.set(x, y, z);
    scene.add(this.mesh);

    // Create physics body
    const world = getPhysicsWorld();
    const rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(x, y, z)
      .lockRotations(); // Prevent creatures from tipping over
    this.rigidBody = world.createRigidBody(rigidBodyDesc);

    // Create capsule collider for creature (better for characters)
    const colliderDesc = RAPIER.ColliderDesc.capsule(0.15, 0.15);
    world.createCollider(colliderDesc, this.rigidBody);

    // Create resource indicator (initially hidden)
    this.createResourceIndicator();

    // Set initial random direction
    this.pickNewDirection();
  }

  private createCreatureMesh(type: CreatureType): THREE.Group {
    const group = new THREE.Group();
    const color = CreatureColors[type];

    switch (type) {
      case 'CHICKEN':
        // Body
        const chickenBody = new THREE.Mesh(
          new THREE.BoxGeometry(0.25, 0.25, 0.3),
          new THREE.MeshStandardMaterial({ color })
        );
        chickenBody.castShadow = true;
        chickenBody.receiveShadow = true;
        group.add(chickenBody);

        // Head
        const chickenHead = new THREE.Mesh(
          new THREE.BoxGeometry(0.15, 0.15, 0.15),
          new THREE.MeshStandardMaterial({ color })
        );
        chickenHead.position.set(0, 0.15, 0.15);
        chickenHead.castShadow = true;
        group.add(chickenHead);

        // Beak (red)
        const beak = new THREE.Mesh(
          new THREE.BoxGeometry(0.05, 0.05, 0.1),
          new THREE.MeshStandardMaterial({ color: 0xff0000 })
        );
        beak.position.set(0, 0.12, 0.25);
        group.add(beak);
        break;

      case 'COW':
        // Body (larger)
        const cowBody = new THREE.Mesh(
          new THREE.BoxGeometry(0.4, 0.35, 0.5),
          new THREE.MeshStandardMaterial({ color })
        );
        cowBody.castShadow = true;
        cowBody.receiveShadow = true;
        group.add(cowBody);

        // Head
        const cowHead = new THREE.Mesh(
          new THREE.BoxGeometry(0.25, 0.25, 0.25),
          new THREE.MeshStandardMaterial({ color })
        );
        cowHead.position.set(0, 0.15, 0.35);
        cowHead.castShadow = true;
        group.add(cowHead);

        // Horns
        const horn1 = new THREE.Mesh(
          new THREE.BoxGeometry(0.05, 0.15, 0.05),
          new THREE.MeshStandardMaterial({ color: 0x8b4513 })
        );
        horn1.position.set(-0.1, 0.3, 0.35);
        group.add(horn1);

        const horn2 = new THREE.Mesh(
          new THREE.BoxGeometry(0.05, 0.15, 0.05),
          new THREE.MeshStandardMaterial({ color: 0x8b4513 })
        );
        horn2.position.set(0.1, 0.3, 0.35);
        group.add(horn2);
        break;

      case 'SHEEP':
        // Fluffy body (off-white)
        const sheepBody = new THREE.Mesh(
          new THREE.BoxGeometry(0.35, 0.3, 0.4),
          new THREE.MeshStandardMaterial({ color })
        );
        sheepBody.castShadow = true;
        sheepBody.receiveShadow = true;
        group.add(sheepBody);

        // Black head
        const sheepHead = new THREE.Mesh(
          new THREE.BoxGeometry(0.2, 0.2, 0.2),
          new THREE.MeshStandardMaterial({ color: 0x222222 })
        );
        sheepHead.position.set(0, 0.1, 0.3);
        sheepHead.castShadow = true;
        group.add(sheepHead);
        break;

      case 'PIG':
        // Pink body
        const pigBody = new THREE.Mesh(
          new THREE.BoxGeometry(0.35, 0.28, 0.45),
          new THREE.MeshStandardMaterial({ color })
        );
        pigBody.castShadow = true;
        pigBody.receiveShadow = true;
        group.add(pigBody);

        // Snout
        const snout = new THREE.Mesh(
          new THREE.BoxGeometry(0.15, 0.12, 0.18),
          new THREE.MeshStandardMaterial({ color: 0xffb6c1 })
        );
        snout.position.set(0, 0.05, 0.32);
        group.add(snout);

        // Curly tail (just a small box for now)
        const tail = new THREE.Mesh(
          new THREE.BoxGeometry(0.05, 0.05, 0.1),
          new THREE.MeshStandardMaterial({ color })
        );
        tail.position.set(0, 0.15, -0.25);
        group.add(tail);
        break;
    }

    return group;
  }

  private createResourceIndicator(): void {
    // Only create indicator for creatures that produce resources
    const resourceData = CreatureResources[this.type];
    if (resourceData.type === null) return;

    // Create a small glowing sphere above the creature
    const geometry = new THREE.SphereGeometry(0.08, 8, 8);
    const material = new THREE.MeshStandardMaterial({
      color: 0xffff00, // Yellow glow
      emissive: 0xffff00,
      emissiveIntensity: 0.5,
    });
    this.resourceIndicator = new THREE.Mesh(geometry, material);
    this.resourceIndicator.position.set(0, 0.6, 0); // Above creature
    this.resourceIndicator.visible = false;
    this.mesh.add(this.resourceIndicator);
  }

  private pickNewDirection(): void {
    // Pick a random direction to wander
    const angle = Math.random() * Math.PI * 2;
    this.moveDirection.set(Math.cos(angle), 0, Math.sin(angle));
    this.moveDirection.normalize();

    // Random duration between 1-4 seconds
    this.moveDuration = 1 + Math.random() * 3;
    this.moveTimer = 0;

    // Sometimes stand still
    if (Math.random() < 0.3) {
      this.moveDirection.set(0, 0, 0);
    }
  }

  update(deltaTime: number): void {
    // Update movement timer
    this.moveTimer += deltaTime;

    if (this.moveTimer >= this.moveDuration) {
      this.pickNewDirection();
    }

    // Apply movement
    if (this.moveDirection.length() > 0) {
      const velocity = this.rigidBody.linvel();
      const newVelocity = {
        x: this.moveDirection.x * this.moveSpeed,
        y: velocity.y, // Keep existing Y velocity (gravity)
        z: this.moveDirection.z * this.moveSpeed,
      };
      this.rigidBody.setLinvel(newVelocity, true);

      // Rotate creature to face movement direction
      const angle = Math.atan2(this.moveDirection.x, this.moveDirection.z);
      this.mesh.rotation.y = angle;
    }

    // Update resource timer
    const resourceData = CreatureResources[this.type];
    if (resourceData.type !== null && !this.hasResource) {
      this.resourceTimer += deltaTime;
      if (this.resourceTimer >= resourceData.cooldown) {
        this.hasResource = true;
        if (this.resourceIndicator) {
          this.resourceIndicator.visible = true;
        }
      }
    }

    // Animate resource indicator (bobbing effect)
    if (this.resourceIndicator && this.resourceIndicator.visible) {
      this.resourceIndicator.position.y = 0.6 + Math.sin(Date.now() * 0.003) * 0.05;
    }

    // Sync mesh with physics
    const position = this.rigidBody.translation();
    const rotation = this.rigidBody.rotation();

    this.mesh.position.set(position.x, position.y, position.z);
    // Only apply Y rotation (we locked other rotations in physics)
    this.mesh.rotation.y = Math.atan2(
      2 * (rotation.w * rotation.y + rotation.x * rotation.z),
      1 - 2 * (rotation.y * rotation.y + rotation.z * rotation.z)
    );
  }

  // Resource collection methods
  hasResourceReady(): boolean {
    return this.hasResource;
  }

  getResourceType(): ResourceType {
    return CreatureResources[this.type].type;
  }

  collectResource(): ResourceType {
    if (!this.hasResource) return null;

    const resourceType = CreatureResources[this.type].type;
    this.hasResource = false;
    this.resourceTimer = 0;
    if (this.resourceIndicator) {
      this.resourceIndicator.visible = false;
    }

    return resourceType;
  }

  destroy(): void {
    // Remove from physics world
    const world = getPhysicsWorld();
    world.removeRigidBody(this.rigidBody);

    // Remove from scene
    this.scene.remove(this.mesh);

    // Clean up geometry and materials
    this.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (child.material instanceof THREE.Material) {
          child.material.dispose();
        }
      }
    });
  }

  getType(): CreatureType {
    return this.type;
  }
}
