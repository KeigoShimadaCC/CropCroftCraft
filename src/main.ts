import './style.css';
import * as THREE from 'three';
import { initPhysics, getPhysicsWorld } from './physics';
import { Block } from './Block';
import { Ground } from './Ground';
import { Controls } from './Controls';

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

// Camera setup
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 5, 10);
camera.lookAt(0, 0, 0);

// Renderer setup
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 20, 10);
directionalLight.castShadow = true;
directionalLight.shadow.camera.left = -20;
directionalLight.shadow.camera.right = 20;
directionalLight.shadow.camera.top = 20;
directionalLight.shadow.camera.bottom = -20;
scene.add(directionalLight);

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Game objects
const blocks: Block[] = [];
let controls: Controls;
let lastTime = performance.now();
const raycaster = new THREE.Raycaster();
let highlightedBlock: Block | null = null;

function spawnBlock(x: number, y: number, z: number, color: number): Block {
  const block = new Block(scene, x, y, z, color);
  blocks.push(block);
  return block;
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  const currentTime = performance.now();
  const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
  lastTime = currentTime;

  // Update controls
  controls.update(deltaTime);

  // Step physics simulation
  const world = getPhysicsWorld();
  world.step();

  // Update all blocks
  blocks.forEach((block) => block.update());

  // Raycast from camera center to detect block under crosshair
  raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
  const intersects = raycaster.intersectObjects(
    blocks.map((b) => b.mesh),
    false
  );

  // Update highlight
  if (highlightedBlock) {
    highlightedBlock.setHighlight(false);
    highlightedBlock = null;
  }

  if (intersects.length > 0) {
    const intersectedMesh = intersects[0].object;
    const block = blocks.find((b) => b.mesh === intersectedMesh);
    if (block) {
      block.setHighlight(true);
      highlightedBlock = block;
    }
  }

  renderer.render(scene, camera);
}

// Initialize and start
async function main() {
  await initPhysics();

  // Create controls
  controls = new Controls(camera, renderer.domElement);

  // Create ground
  new Ground(scene);

  // Spawn test blocks at different heights and positions
  spawnBlock(0, 10, 0, 0xff0000); // Red
  spawnBlock(1, 8, 0, 0x00ff00); // Green
  spawnBlock(-1, 12, 0, 0x0000ff); // Blue
  spawnBlock(0.5, 15, 0.5, 0xffff00); // Yellow
  spawnBlock(-0.5, 6, -0.5, 0xff00ff); // Magenta
  spawnBlock(2, 20, 1, 0x00ffff); // Cyan
  spawnBlock(-2, 18, -1, 0xffa500); // Orange
  spawnBlock(0, 25, 0, 0x800080); // Purple

  animate();
}

main();
