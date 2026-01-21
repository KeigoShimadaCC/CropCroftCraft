import RAPIER from '@dimforge/rapier3d-compat';

let physicsWorld: RAPIER.World | null = null;

export async function initPhysics(): Promise<RAPIER.World> {
  await RAPIER.init();

  physicsWorld = new RAPIER.World({ x: 0.0, y: -9.81, z: 0.0 });

  return physicsWorld;
}

export function getPhysicsWorld(): RAPIER.World {
  if (!physicsWorld) {
    throw new Error('Physics world not initialized. Call initPhysics() first.');
  }
  return physicsWorld;
}
