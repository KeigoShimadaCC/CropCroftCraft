import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { getPhysicsWorld } from './physics';

export class Ground {
  mesh: THREE.Mesh;

  constructor(scene: THREE.Scene) {
    // Create visual mesh - large flat plane
    const geometry = new THREE.PlaneGeometry(100, 100);
    const material = new THREE.MeshStandardMaterial({
      color: 0x228b22, // Forest green
      side: THREE.DoubleSide,
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.rotation.x = -Math.PI / 2; // Rotate to be horizontal (y=0)
    this.mesh.position.y = 0;
    this.mesh.receiveShadow = true;
    scene.add(this.mesh);

    // Create static physics collider
    const world = getPhysicsWorld();
    const rigidBodyDesc = RAPIER.RigidBodyDesc.fixed().setTranslation(0, 0, 0);
    const rigidBody = world.createRigidBody(rigidBodyDesc);

    // Create a large cuboid collider for the ground (very thin in Y)
    const colliderDesc = RAPIER.ColliderDesc.cuboid(50, 0.1, 50);
    world.createCollider(colliderDesc, rigidBody);
  }
}
