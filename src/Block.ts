import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { getPhysicsWorld } from './physics';

export class Block {
  mesh: THREE.Mesh;
  rigidBody: RAPIER.RigidBody;
  private scene: THREE.Scene;
  private outlineMesh: THREE.LineSegments | null = null;

  constructor(
    scene: THREE.Scene,
    x: number,
    y: number,
    z: number,
    color: number = 0x00ff00,
    isStatic: boolean = false
  ) {
    this.scene = scene;

    // Create visual mesh
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ color });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.mesh.position.set(x, y, z);
    scene.add(this.mesh);

    // Create physics body
    const world = getPhysicsWorld();
    const rigidBodyDesc = isStatic
      ? RAPIER.RigidBodyDesc.fixed().setTranslation(x, y, z)
      : RAPIER.RigidBodyDesc.dynamic().setTranslation(x, y, z);
    this.rigidBody = world.createRigidBody(rigidBodyDesc);

    // Create box collider (half-extents are 0.5 for a 1x1x1 cube)
    const colliderDesc = RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5);
    world.createCollider(colliderDesc, this.rigidBody);
  }

  update(): void {
    // Sync mesh position and rotation with physics body
    const position = this.rigidBody.translation();
    const rotation = this.rigidBody.rotation();

    this.mesh.position.set(position.x, position.y, position.z);
    this.mesh.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
  }

  setHighlight(highlighted: boolean): void {
    if (highlighted) {
      if (!this.outlineMesh) {
        const edges = new THREE.EdgesGeometry(this.mesh.geometry);
        const lineMaterial = new THREE.LineBasicMaterial({
          color: 0xffffff,
          linewidth: 2,
        });
        this.outlineMesh = new THREE.LineSegments(edges, lineMaterial);
        this.mesh.add(this.outlineMesh);
      }
    } else {
      if (this.outlineMesh) {
        this.mesh.remove(this.outlineMesh);
        this.outlineMesh.geometry.dispose();
        if (this.outlineMesh.material instanceof THREE.Material) {
          this.outlineMesh.material.dispose();
        }
        this.outlineMesh = null;
      }
    }
  }

  convertToDynamic(): void {
    // Check if already dynamic
    if (!this.rigidBody.isFixed()) {
      return;
    }

    // Get current position and rotation
    const position = this.rigidBody.translation();
    const rotation = this.rigidBody.rotation();

    // Remove old static body
    const world = getPhysicsWorld();
    world.removeRigidBody(this.rigidBody);

    // Create new dynamic body
    const rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic().setTranslation(
      position.x,
      position.y,
      position.z
    );
    rigidBodyDesc.setRotation(rotation);
    this.rigidBody = world.createRigidBody(rigidBodyDesc);

    // Create collider for new body
    const colliderDesc = RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5);
    world.createCollider(colliderDesc, this.rigidBody);
  }

  isStatic(): boolean {
    return this.rigidBody.isFixed();
  }

  destroy(): void {
    // Remove highlight if present
    this.setHighlight(false);

    // Remove from physics world
    const world = getPhysicsWorld();
    world.removeRigidBody(this.rigidBody);

    // Remove from scene
    this.scene.remove(this.mesh);

    // Clean up geometry and material
    this.mesh.geometry.dispose();
    if (this.mesh.material instanceof THREE.Material) {
      this.mesh.material.dispose();
    }
  }
}
