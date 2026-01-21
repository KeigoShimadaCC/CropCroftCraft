import RAPIER from '@dimforge/rapier3d-compat';

let physicsWorld: RAPIER.World | null = null;
let eventQueue: RAPIER.EventQueue | null = null;

export async function initPhysics(): Promise<RAPIER.World> {
  await RAPIER.init();

  physicsWorld = new RAPIER.World({ x: 0.0, y: -9.81, z: 0.0 });
  eventQueue = new RAPIER.EventQueue(true);

  return physicsWorld;
}

export function getPhysicsWorld(): RAPIER.World {
  if (!physicsWorld) {
    throw new Error('Physics world not initialized. Call initPhysics() first.');
  }
  return physicsWorld;
}

export function getEventQueue(): RAPIER.EventQueue {
  if (!eventQueue) {
    throw new Error('Event queue not initialized. Call initPhysics() first.');
  }
  return eventQueue;
}
