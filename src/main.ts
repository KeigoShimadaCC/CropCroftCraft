import './style.css';
import * as THREE from 'three';
import { initPhysics, getPhysicsWorld, getEventQueue } from './physics';
import { Block } from './Block';
import { Ground } from './Ground';
import { Controls } from './Controls';
import { BlockType, BlockColors } from './types';
import { generateTerrain, generateHouse } from './Terrain';
import { soundManager } from './Sound';
import { InstructionsOverlay } from './UI';

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
camera.position.set(0, 3, 8);
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
let intersectionNormal: THREE.Vector3 | null = null;
let selectedBlockType: BlockType = BlockType.GRASS;
let instructionsOverlay: InstructionsOverlay;

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
  const eventQueue = getEventQueue();
  world.step(eventQueue);

  // Handle collision events
  eventQueue.drainCollisionEvents((_handle1, _handle2, started) => {
    // Play collision sound when contact starts
    if (started) {
      // Use a simple intensity - can be enhanced with velocity info
      soundManager.playCollisionSound(0.5);
    }
  });

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

  intersectionNormal = null;

  if (intersects.length > 0) {
    const intersectedMesh = intersects[0].object;
    const block = blocks.find((b) => b.mesh === intersectedMesh);
    if (block) {
      block.setHighlight(true);
      highlightedBlock = block;
      intersectionNormal = intersects[0].face?.normal || null;
    }
  }

  renderer.render(scene, camera);
}

// Check if a block has support below it
function hasSupport(block: Block, allBlocks: Block[]): boolean {
  const pos = block.mesh.position;
  const checkY = Math.round(pos.y * 2) / 2 - 0.5; // Check block below (adjusted for 0.5 spacing)

  // Check if there's a block directly below
  for (const other of allBlocks) {
    if (other === block) continue;

    const otherPos = other.mesh.position;
    const otherX = Math.round(otherPos.x * 2) / 2;
    const otherY = Math.round(otherPos.y * 2) / 2;
    const otherZ = Math.round(otherPos.z * 2) / 2;

    const thisX = Math.round(pos.x * 2) / 2;
    const thisZ = Math.round(pos.z * 2) / 2;

    // Block directly below
    if (otherX === thisX && otherY === checkY && otherZ === thisZ) {
      return true;
    }
  }

  // Check if block is at or below ground level (y <= -0.5)
  if (Math.round(pos.y * 2) / 2 <= -0.5) {
    return true;
  }

  return false;
}

// Convert unsupported static blocks to dynamic
function convertUnsupportedBlocks(): void {
  // Check all static blocks
  const staticBlocks = blocks.filter((b) => b.isStatic());

  for (const block of staticBlocks) {
    if (!hasSupport(block, blocks)) {
      block.convertToDynamic();
    }
  }
}

// Mouse click handler
function onMouseClick(event: MouseEvent): void {
  if (event.button === 0 && highlightedBlock) {
    // Left click - destroy block
    const index = blocks.indexOf(highlightedBlock);
    if (index > -1) {
      soundManager.playDestroySound();
      highlightedBlock.destroy();
      blocks.splice(index, 1);
      highlightedBlock = null;

      // Check for unsupported blocks after destruction
      convertUnsupportedBlocks();
    }
  } else if (event.button === 2 && highlightedBlock && intersectionNormal) {
    // Right click - place block
    event.preventDefault();

    // Get the block position and add the normal to get adjacent position
    const blockPos = highlightedBlock.mesh.position;

    // Transform normal from local to world space
    const worldNormal = intersectionNormal
      .clone()
      .transformDirection(highlightedBlock.mesh.matrixWorld);

    // Calculate new block position (adjacent to clicked face, adjusted for 0.5 grid)
    const newX = Math.round((blockPos.x + worldNormal.x * 0.5) * 2) / 2;
    const newY = Math.round((blockPos.y + worldNormal.y * 0.5) * 2) / 2;
    const newZ = Math.round((blockPos.z + worldNormal.z * 0.5) * 2) / 2;

    // Don't place block at camera position (simplified check)
    const cameraPos = camera.position;
    const distance = Math.sqrt(
      Math.pow(newX - cameraPos.x, 2) +
        Math.pow(newY - cameraPos.y, 2) +
        Math.pow(newZ - cameraPos.z, 2)
    );

    if (distance > 0.5) {
      soundManager.playPlaceSound();
      spawnBlock(newX, newY, newZ, BlockColors[selectedBlockType]);
    }
  }
}

// Keyboard handler for block type selection
function onKeyDown(event: KeyboardEvent): void {
  switch (event.code) {
    case 'Digit1':
      selectedBlockType = BlockType.GRASS;
      updateUI();
      break;
    case 'Digit2':
      selectedBlockType = BlockType.DIRT;
      updateUI();
      break;
    case 'Digit3':
      selectedBlockType = BlockType.STONE;
      updateUI();
      break;
    case 'Digit4':
      selectedBlockType = BlockType.COBBLESTONE;
      updateUI();
      break;
    case 'Digit5':
      selectedBlockType = BlockType.BRICK;
      updateUI();
      break;
    case 'Digit6':
      selectedBlockType = BlockType.PLANKS;
      updateUI();
      break;
    case 'Digit7':
      selectedBlockType = BlockType.WOOD;
      updateUI();
      break;
    case 'Digit8':
      selectedBlockType = BlockType.GLASS;
      updateUI();
      break;
    case 'Digit9':
      selectedBlockType = BlockType.SAND;
      updateUI();
      break;
    case 'Escape':
      instructionsOverlay.show();
      break;
  }
}

function updateUI(): void {
  const uiElement = document.getElementById('block-type-ui');
  if (uiElement) {
    uiElement.textContent = `Selected: ${selectedBlockType}`;
  }
}

// Initialize and start
async function main() {
  await initPhysics();

  // Create instructions overlay
  instructionsOverlay = new InstructionsOverlay(renderer.domElement);

  // Create controls
  controls = new Controls(camera, renderer.domElement);

  // Listen for pointer lock changes to hide/show instructions
  document.addEventListener('pointerlockchange', () => {
    if (document.pointerLockElement === renderer.domElement) {
      // Pointer is locked - hide instructions
      instructionsOverlay.hide();
    } else {
      // Pointer is unlocked - show instructions
      instructionsOverlay.show();
    }
  });

  // Create ground (below terrain)
  new Ground(scene);

  // Generate terrain
  const terrainBlocks = generateTerrain(scene);
  blocks.push(...terrainBlocks);

  // Generate house
  const houseBlocks = generateHouse(scene);
  blocks.push(...houseBlocks);

  // Add mouse click listeners
  window.addEventListener('click', onMouseClick);
  window.addEventListener('contextmenu', (e) => e.preventDefault());

  // Add keyboard listener
  window.addEventListener('keydown', onKeyDown);

  // Create crosshair
  const crosshair = document.createElement('div');
  crosshair.id = 'crosshair';
  document.body.appendChild(crosshair);

  // Create UI element for block type
  const uiElement = document.createElement('div');
  uiElement.id = 'block-type-ui';
  uiElement.style.position = 'absolute';
  uiElement.style.top = '10px';
  uiElement.style.left = '10px';
  uiElement.style.color = 'white';
  uiElement.style.fontFamily = 'monospace';
  uiElement.style.fontSize = '16px';
  uiElement.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
  uiElement.style.padding = '10px';
  uiElement.style.borderRadius = '5px';
  uiElement.textContent = `Selected: ${selectedBlockType}`;
  document.body.appendChild(uiElement);

  animate();
}

main();
