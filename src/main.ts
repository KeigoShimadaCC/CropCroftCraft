import './style.css';
import * as THREE from 'three';
import { initPhysics, getPhysicsWorld, getEventQueue } from './physics';
import { Block } from './Block';
import { Ground } from './Ground';
import { Controls } from './Controls';
import { BlockType, BlockColors } from './types';
import { generateTerrain, generateFarmWorld } from './Terrain';
import { soundManager } from './Sound';
import { InstructionsOverlay } from './UI';
import { Creature } from './Creature';
import type { CreatureType } from './Creature';
import { Cinematic } from './Cinematic';
import { TimeManager } from './TimeManager';
import { CropSystem } from './CropSystem';
import type { CropType } from './CropSystem';
import { Neighbor } from './Neighbor';
import type { NeighborData } from './Neighbor';
import { EventSystem } from './EventSystem';
import type { ActiveEvent } from './EventSystem';
import { ParticleSystem } from './ParticleSystem';
import { AchievementSystem } from './AchievementSystem';

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
const creatures: Creature[] = [];
const neighbors: Neighbor[] = [];
let controls: Controls;
let lastTime = performance.now();
const raycaster = new THREE.Raycaster();
let highlightedBlock: Block | null = null;
let intersectionNormal: THREE.Vector3 | null = null;
let selectedBlockType: BlockType = BlockType.GRASS;
let instructionsOverlay: InstructionsOverlay;
let cinematic: Cinematic;
let cinematicPlaying = false;
let timeManager: TimeManager;
let cropSystem: CropSystem;
let eventSystem: EventSystem;
let particleSystem: ParticleSystem;
let achievementSystem: AchievementSystem;
let selectedCropType: CropType = 'WHEAT';
let isPlantingMode = false;

// Resource inventory from animals
const animalResources: Record<'EGG' | 'MILK' | 'WOOL', number> = {
  EGG: 0,
  MILK: 0,
  WOOL: 0,
};


function spawnBlock(x: number, y: number, z: number, color: number): Block {
  const block = new Block(scene, x, y, z, color);
  blocks.push(block);
  return block;
}

function spawnCreature(x: number, y: number, z: number, type: CreatureType): Creature {
  const creature = new Creature(scene, x, y, z, type);
  creatures.push(creature);
  return creature;
}

function spawnNeighbor(data: NeighborData): Neighbor {
  const neighbor = new Neighbor(scene, data);
  neighbors.push(neighbor);
  return neighbor;
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  const currentTime = performance.now();
  const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
  lastTime = currentTime;

  // Update cinematic if playing
  if (cinematicPlaying) {
    cinematic.update(deltaTime);
    if (!cinematic.isActive()) {
      cinematicPlaying = false;
      // Enable controls after cinematic
      controls.lock();
    }
  } else {
    // Update controls only when cinematic is not playing
    controls.update(deltaTime);
  }

  // Update time system
  if (!cinematicPlaying) {
    timeManager.update(deltaTime);
    updateTimeUI();
  }

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

  // Update all creatures
  creatures.forEach((creature) => creature.update(deltaTime));

  // Update all neighbors
  neighbors.forEach((neighbor) => neighbor.update(deltaTime));

  // Update particle system
  particleSystem.update(deltaTime);

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
  // Check for creature clicks first (both left and right click)
  if (event.button === 0) {
    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    // Check for creature intersections
    const creatureMeshes = creatures.map(c => c.mesh);
    const creatureIntersects = raycaster.intersectObjects(creatureMeshes, true);

    if (creatureIntersects.length > 0) {
      // Find which creature was clicked
      const clickedMesh = creatureIntersects[0].object;
      for (const creature of creatures) {
        if (creature.mesh === clickedMesh || creature.mesh.children.includes(clickedMesh as THREE.Object3D)) {
          // Try to collect resource from this creature
          if (creature.hasResourceReady()) {
            const resourceType = creature.collectResource();
            if (resourceType && resourceType !== null) {
              animalResources[resourceType]++;
              soundManager.playPlaceSound(); // Use place sound for collection
              showMessage(`🎉 Collected ${resourceType}!`, 2000);
              const pos = creature.mesh.position;
              particleSystem.spawn('collect', pos.x, pos.y + 0.5, pos.z);

              // Track achievement
              achievementSystem.onAnimalResourceCollected();

              updateTimeUI();
              return;
            }
          } else {
            // Show when resource will be ready
            const resourceType = creature.getResourceType();
            if (resourceType) {
              showMessage(`⏰ This animal needs more time to produce ${resourceType}...`, 2000);
            }
            return;
          }
        }
      }
    }

    // Check for neighbor clicks
    const neighborDistance = 5; // Must be within 5 units to interact
    for (const neighbor of neighbors) {
      const playerPos = camera.position;
      if (neighbor.isNearPosition(playerPos.x, playerPos.y, playerPos.z, neighborDistance)) {
        // Player is near this neighbor
        const quest = neighbor.getCurrentQuest();

        if (quest) {
          // Neighbor has a quest - try to complete it
          let canComplete = false;

          if (quest.type === 'crop') {
            const harvested = cropSystem.getHarvestedCrops();
            const cropType = quest.itemType as CropType;
            if (harvested[cropType] >= quest.amount) {
              // Player has enough crops!
              canComplete = true;
              cropSystem.deductHarvestedCrops(cropType, quest.amount);
            }
          } else if (quest.type === 'resource') {
            const resourceType = quest.itemType as 'EGG' | 'MILK' | 'WOOL';
            if (animalResources[resourceType] >= quest.amount) {
              canComplete = true;
              animalResources[resourceType] -= quest.amount;
            }
          }

          if (canComplete) {
            // Complete the quest!
            const result = neighbor.completeQuest();
            if (result.success && result.reward) {
              soundManager.playPlaceSound();
              showMessage(quest.completionDialogue, 3000);

              // Give rewards
              if (result.reward.type === 'seeds' && result.reward.cropType && result.reward.amount) {
                cropSystem.addSeeds(result.reward.cropType, result.reward.amount);
                showMessage(`🎁 Received ${result.reward.amount} ${result.reward.cropType} seeds!`, 2500);
              }

              // Spawn heart particles at neighbor location
              const neighborPos = neighbor.getPosition();
              particleSystem.spawn('heart', neighborPos.x, neighborPos.y + 1, neighborPos.z);

              // Track achievement
              achievementSystem.onQuestCompleted();
              if (neighbor.getFriendshipLevel() >= 100) {
                achievementSystem.onFriendshipMaxed();
              }

              updateTimeUI();
            }
          } else {
            // Not enough items
            const itemName = quest.itemType ? quest.itemType.toLowerCase() : 'items';
            showMessage(`❌ Need ${quest.amount} ${itemName}${quest.amount > 1 ? 's' : ''} to complete this quest!`, 2500);
          }
        } else {
          // Show greeting
          const greeting = neighbor.getGreetingDialogue();
          showMessage(`${neighbor.getName()}: ${greeting}`, 3000);
        }

        return; // Found neighbor interaction, stop checking
      }
    }
  }

  if (event.button === 0 && highlightedBlock) {
    // Left click - destroy block OR harvest crop

    // Check if clicking on a crop
    const blockPos = highlightedBlock.mesh.position;
    const cropType = cropSystem.harvestCrop(blockPos.x, blockPos.y, blockPos.z);

    if (cropType) {
      // Harvested a crop!
      soundManager.playDestroySound();
      showMessage(`🌾 Harvested ${cropType}!`, 2000);
      particleSystem.spawn('harvest', blockPos.x, blockPos.y + 0.5, blockPos.z);

      // Track achievement
      achievementSystem.onCropHarvested();
      const harvested = cropSystem.getHarvestedCrops();
      achievementSystem.onCropVarietyCheck(harvested.WHEAT, harvested.CARROT, harvested.TOMATO);

      return;
    }

    // Regular block destruction
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
    // Right click - place block OR plant crop
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
      // Planting mode - plant crops
      if (isPlantingMode) {
        const planted = cropSystem.plantSeed(newX, newY, newZ, selectedCropType, timeManager.getDayNumber());
        if (planted) {
          soundManager.playPlaceSound();
          showMessage(`🌱 Planted ${selectedCropType} seed!`, 1500);
          updateUI();
        } else {
          showMessage(`❌ Can't plant here or out of seeds!`, 1500);
        }
      } else {
        // Regular block placement
        soundManager.playPlaceSound();
        spawnBlock(newX, newY, newZ, BlockColors[selectedBlockType]);
      }
    }
  }
}

// Keyboard handler for block type selection and crop planting
function onKeyDown(event: KeyboardEvent): void {
  // Toggle planting mode with P
  if (event.code === 'KeyP') {
    isPlantingMode = !isPlantingMode;
    updateUI();
    return;
  }

  // Crop selection in planting mode (Q/W/E)
  if (isPlantingMode) {
    switch (event.code) {
      case 'KeyQ':
        selectedCropType = 'WHEAT';
        updateUI();
        return;
      case 'KeyW':
        selectedCropType = 'CARROT';
        updateUI();
        return;
      case 'KeyE':
        selectedCropType = 'TOMATO';
        updateUI();
        return;
    }
  }

  // Regular block selection
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
    case 'KeyB': // Sleep in bed
      tryToSleep();
      break;
    case 'KeyM': // Open Market/Festival
      openEventMenu();
      break;
    case 'KeyA': // View Achievements
      showAchievements();
      break;
    case 'Escape':
      instructionsOverlay.show();
      break;
  }
}

function updateUI(): void {
  const uiElement = document.getElementById('block-type-ui');
  if (uiElement) {
    if (isPlantingMode) {
      const inventory = cropSystem.getInventory();
      uiElement.innerHTML = `
        <div style="color: #90EE90; font-weight: bold;">🌱 PLANTING MODE</div>
        <div style="font-size: 12px; margin-top: 5px;">
          Q: Wheat (${inventory.WHEAT}) | W: Carrot (${inventory.CARROT}) | E: Tomato (${inventory.TOMATO})
        </div>
        <div style="margin-top: 5px;">Selected: ${selectedCropType}</div>
        <div style="font-size: 11px; opacity: 0.8; margin-top: 5px;">Press P to exit</div>
      `;
    } else {
      const achievementProgress = `${achievementSystem.getUnlockedCount()}/${achievementSystem.getTotalCount()}`;
      uiElement.innerHTML = `
        <div>Block: ${selectedBlockType} | Press P for Farming</div>
        <div style="font-size: 11px; opacity: 0.7; margin-top: 5px;">💡 Click animals with ⭐ to collect resources!</div>
        <div style="font-size: 11px; opacity: 0.7; margin-top: 5px;">🏆 Press A for Achievements (${achievementProgress})</div>
      `;
    }
  }
}

function updateTimeUI(): void {
  const timeElement = document.getElementById('time-ui');
  if (timeElement) {
    const harvested = cropSystem.getHarvestedCrops();
    const totalHarvest = harvested.WHEAT + harvested.CARROT + harvested.TOMATO;
    const totalAnimalResources = animalResources.EGG + animalResources.MILK + animalResources.WOOL;

    // Count active quests
    const activeQuests = neighbors.filter(n => n.hasQuest()).length;

    // Check for active events
    const activeEvent = eventSystem.getActiveEvent();
    const season = eventSystem.getCurrentSeason(timeManager.getDayNumber());
    const seasonEmoji = eventSystem.getSeasonEmoji(season);

    let eventLine = '';
    if (activeEvent) {
      const eventData = eventSystem.getEventData(activeEvent.type);
      eventLine = `<div style="font-size: 11px; margin-top: 5px; color: #FFD700;">🎉 ${eventData.name} (Press M)</div>`;
    }

    timeElement.innerHTML = `
      <div style="font-size: 16px; font-weight: bold;">Day ${timeManager.getDayNumber()} ${seasonEmoji}</div>
      <div style="font-size: 14px;">${timeManager.getTimePeriod()}</div>
      <div style="font-size: 13px;">${timeManager.getTimeString()}</div>
      <div style="font-size: 12px; margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.3);">
        💰 Coins: ${eventSystem.getCoins()}
      </div>
      <div style="font-size: 12px; margin-top: 4px;">
        🌾 Crops: ${totalHarvest}
      </div>
      <div style="font-size: 12px; margin-top: 4px;">
        🐔 Resources: ${totalAnimalResources}
      </div>
      <div style="font-size: 10px; margin-top: 4px; opacity: 0.8;">
        🥚 ${animalResources.EGG} 🥛 ${animalResources.MILK} 🧶 ${animalResources.WOOL}
      </div>
      ${activeQuests > 0 ? `<div style="font-size: 11px; margin-top: 5px; color: #90EE90;">📋 ${activeQuests} quest${activeQuests > 1 ? 's' : ''} available!</div>` : ''}
      ${eventLine}
      ${timeManager.isNightTime() ? '<div style="font-size: 11px; margin-top: 5px; color: #FFD700;">💤 Press B near bed to sleep</div>' : ''}
    `;
  }
}

function tryToSleep(): void {
  if (!timeManager.isNightTime()) {
    showMessage("You can only sleep at night! ⏰", 2000);
    return;
  }

  // Check if near bed (player house back corner around x=5, z=4)
  const playerPos = camera.position;
  const bedPos = { x: 5, z: 4 };
  const distance = Math.sqrt(
    Math.pow(playerPos.x - bedPos.x, 2) + Math.pow(playerPos.z - bedPos.z, 2)
  );

  if (distance < 3) {
    timeManager.sleep();
    showMessage("💤 You slept well! A new day begins.", 3000);
  } else {
    showMessage("You need to be near your bed to sleep! 🛏️", 2000);
  }
}

function showAchievements(): void {
  const allAchievements = achievementSystem.getAllAchievements();
  const unlockedCount = achievementSystem.getUnlockedCount();
  const totalCount = achievementSystem.getTotalCount();
  const percentage = achievementSystem.getCompletionPercentage();

  let message = `🏆 ACHIEVEMENTS (${unlockedCount}/${totalCount} - ${percentage}%)\n\n`;

  allAchievements.forEach((ach) => {
    const status = ach.unlocked ? '✓' : '○';
    const progressText = ach.unlocked
      ? 'UNLOCKED'
      : `${ach.progress}/${ach.maxProgress}`;

    message += `${status} ${ach.icon} ${ach.name}\n`;
    message += `   ${ach.description} (${progressText})\n\n`;
  });

  message += 'Press A again to close';

  showMessage(message, 8000);
}

function openEventMenu(): void {
  const activeEvent = eventSystem.getActiveEvent();

  if (!activeEvent) {
    showMessage("No events are currently active! (Markets are weekly, festivals are every 30 days)", 3000);
    return;
  }

  if (eventSystem.isMarketActive()) {
    // Show market selling interface
    const harvested = cropSystem.getHarvestedCrops();
    const hasAnyCrops = harvested.WHEAT > 0 || harvested.CARROT > 0 || harvested.TOMATO > 0;
    const hasAnyResources = animalResources.EGG > 0 || animalResources.MILK > 0 || animalResources.WOOL > 0;

    if (!hasAnyCrops && !hasAnyResources) {
      showMessage("You don't have anything to sell at the market!", 2500);
      return;
    }

    // Calculate total possible earnings
    let totalValue = 0;
    totalValue += harvested.WHEAT * 5;
    totalValue += harvested.CARROT * 8;
    totalValue += harvested.TOMATO * 10;
    totalValue += animalResources.EGG * 3;
    totalValue += animalResources.MILK * 6;
    totalValue += animalResources.WOOL * 12;

    // Sell all items
    if (harvested.WHEAT > 0) {
      eventSystem.sellItem('WHEAT', harvested.WHEAT);
      cropSystem.deductHarvestedCrops('WHEAT', harvested.WHEAT);
    }
    if (harvested.CARROT > 0) {
      eventSystem.sellItem('CARROT', harvested.CARROT);
      cropSystem.deductHarvestedCrops('CARROT', harvested.CARROT);
    }
    if (harvested.TOMATO > 0) {
      eventSystem.sellItem('TOMATO', harvested.TOMATO);
      cropSystem.deductHarvestedCrops('TOMATO', harvested.TOMATO);
    }
    if (animalResources.EGG > 0) {
      eventSystem.sellItem('EGG', animalResources.EGG);
      animalResources.EGG = 0;
    }
    if (animalResources.MILK > 0) {
      eventSystem.sellItem('MILK', animalResources.MILK);
      animalResources.MILK = 0;
    }
    if (animalResources.WOOL > 0) {
      eventSystem.sellItem('WOOL', animalResources.WOOL);
      animalResources.WOOL = 0;
    }

    soundManager.playPlaceSound();
    showMessage(`💰 Sold everything at market for ${totalValue} coins! Total: ${eventSystem.getCoins()} coins`, 3500);
    const camPos = camera.position;
    particleSystem.spawn('coins', camPos.x, camPos.y - 1, camPos.z);

    // Track achievements
    achievementSystem.onMarketVisit();
    achievementSystem.onCoinsUpdated(eventSystem.getCoins());

    updateTimeUI();

  } else if (eventSystem.isFestivalActive()) {
    // Claim festival reward
    const reward = eventSystem.claimFestivalReward(activeEvent.type);

    if (reward) {
      let rewardText = '🎉 Festival reward claimed! ';
      if (reward.seeds) {
        cropSystem.addSeeds(reward.seeds.type, reward.seeds.amount);
        rewardText += `+${reward.seeds.amount} ${reward.seeds.type} seeds `;
      }
      if (reward.coins) {
        rewardText += `+${reward.coins} coins`;
      }

      soundManager.playPlaceSound();
      showMessage(rewardText, 3500);
      const camPos = camera.position;
      particleSystem.spawn('sparkle', camPos.x, camPos.y - 1, camPos.z);
      updateTimeUI();
    } else {
      showMessage("You've already claimed this festival reward!", 2500);
    }
  }
}

function showMessage(text: string, duration: number): void {
  const msgElement = document.getElementById('message-ui');
  if (msgElement) {
    // Replace newlines with <br> for HTML display
    msgElement.innerHTML = text.replace(/\n/g, '<br>');
    msgElement.style.display = 'block';
    msgElement.style.opacity = '1';
    msgElement.style.whiteSpace = 'pre-line';
    msgElement.style.textAlign = 'left';
    msgElement.style.lineHeight = '1.6';

    setTimeout(() => {
      if (msgElement) {
        msgElement.style.opacity = '0';
        setTimeout(() => {
          if (msgElement) {
            msgElement.style.display = 'none';
            msgElement.style.textAlign = 'center';
          }
        }, 500);
      }
    }, duration);
  }
}

// Initialize and start
async function main() {
  await initPhysics();

  // Create time and crop systems
  timeManager = new TimeManager(scene, ambientLight, directionalLight);
  cropSystem = new CropSystem(scene);
  eventSystem = new EventSystem();
  particleSystem = new ParticleSystem(scene);
  achievementSystem = new AchievementSystem();

  // Register achievement unlock callback
  achievementSystem.registerUnlockCallback((achievement) => {
    showMessage(`🏆 Achievement Unlocked: ${achievement.icon} ${achievement.name}!`, 4000);
    particleSystem.spawn('sparkle', camera.position.x, camera.position.y - 1, camera.position.z);
    soundManager.playPlaceSound();
  });

  // Register crop growth on new day
  timeManager.registerNewDayCallback(() => {
    cropSystem.onNewDay(timeManager.getDayNumber());
    eventSystem.update(timeManager.getDayNumber());
    achievementSystem.onDayPassed(timeManager.getDayNumber());
  });

  // Register event callbacks
  eventSystem.registerEventCallbacks(
    (event: ActiveEvent) => {
      const data = eventSystem.getEventData(event.type);
      showMessage(`🎉 ${data.name} has begun! ${data.description}`, 5000);
    },
    (event: ActiveEvent) => {
      const data = eventSystem.getEventData(event.type);
      showMessage(`${data.name} has ended. See you next time!`, 3000);
    }
  );

  // Create cinematic
  cinematic = new Cinematic(camera);
  cinematic.setupFarmIntro();

  // Create instructions overlay with cinematic integration
  instructionsOverlay = new InstructionsOverlay(renderer.domElement, () => {
    // Start cinematic when user clicks to start
    cinematicPlaying = true;
    cinematic.play(() => {
      // After cinematic completes, enable player control
      cinematicPlaying = false;
      controls.lock();
    });
  });

  // Create controls (but don't lock yet - wait for cinematic)
  controls = new Controls(camera, renderer.domElement);

  // Listen for pointer lock changes to hide/show instructions
  document.addEventListener('pointerlockchange', () => {
    if (document.pointerLockElement === renderer.domElement) {
      // Pointer is locked - hide instructions
      instructionsOverlay.hide();
    } else {
      // Pointer is unlocked - show instructions (unless cinematic is playing)
      if (!cinematicPlaying) {
        instructionsOverlay.show();
      }
    }
  });

  // Add skip cinematic on ESC or Space during intro
  const skipCinematic = (e: KeyboardEvent) => {
    if (cinematicPlaying && (e.code === 'Escape' || e.code === 'Space')) {
      cinematic.skip();
      cinematicPlaying = false;
      controls.lock();
    }
  };
  window.addEventListener('keydown', skipCinematic);

  // Create ground (below terrain)
  new Ground(scene);

  // Generate terrain
  const terrainBlocks = generateTerrain(scene);
  blocks.push(...terrainBlocks);

  // Generate farm world
  const farmBlocks = generateFarmWorld(scene);
  blocks.push(...farmBlocks);

  // Spawn farm animals
  // Chickens near player's house
  spawnCreature(3, 0.5, 5, 'CHICKEN');
  spawnCreature(4.5, 0.5, 6, 'CHICKEN');
  spawnCreature(2.5, 0.5, 7, 'CHICKEN');

  // Cows near neighbor 1's house
  spawnCreature(-8, 0.5, 3, 'COW');
  spawnCreature(-10, 0.5, 4, 'COW');

  // Sheep near neighbor 2's house
  spawnCreature(14, 0.5, 5, 'SHEEP');
  spawnCreature(15, 0.5, 6, 'SHEEP');
  spawnCreature(13, 0.5, 7, 'SHEEP');

  // Pigs near the barn
  spawnCreature(4, 0.5, -10, 'PIG');
  spawnCreature(6, 0.5, -11, 'PIG');

  // Extra chicken wandering in fields
  spawnCreature(-2, 0.5, 8, 'CHICKEN');
  spawnCreature(8, 0.5, 9, 'CHICKEN');

  // Spawn neighbors at their farmhouses
  spawnNeighbor({
    name: 'Old Farmer Joe',
    personality: 'wise',
    position: { x: -10, y: 2, z: 2 },
    houseColor: 0xcd853f, // Peru brown (planks color)
  });

  spawnNeighbor({
    name: 'Cheerful Mary',
    personality: 'energetic',
    position: { x: 12, y: 2, z: 2 },
    houseColor: 0xb22222, // Firebrick red (brick color)
  });

  spawnNeighbor({
    name: 'Gruff Tom',
    personality: 'grumpy',
    position: { x: 5, y: 2, z: -10 },
    houseColor: 0x696969, // Dim gray (cobblestone color for barn)
  });

  // Register new day callback for quest generation
  timeManager.registerNewDayCallback(() => {
    // Generate quests for all neighbors on new day
    neighbors.forEach(neighbor => {
      if (!neighbor.hasQuest()) {
        neighbor.generateQuest(timeManager.getDayNumber());
      }
    });
  });

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
  uiElement.className = 'ui-panel';
  uiElement.style.position = 'absolute';
  uiElement.style.top = '10px';
  uiElement.style.left = '10px';
  uiElement.style.color = 'white';
  uiElement.style.fontFamily = 'Segoe UI, system-ui, sans-serif';
  uiElement.style.fontSize = '16px';
  uiElement.textContent = `Selected: ${selectedBlockType}`;
  document.body.appendChild(uiElement);

  // Create time UI
  const timeElement = document.createElement('div');
  timeElement.id = 'time-ui';
  timeElement.className = 'ui-panel';
  timeElement.style.position = 'absolute';
  timeElement.style.top = '10px';
  timeElement.style.right = '10px';
  timeElement.style.color = 'white';
  timeElement.style.fontFamily = 'Segoe UI, system-ui, sans-serif';
  timeElement.style.fontSize = '14px';
  timeElement.style.textAlign = 'right';
  timeElement.style.minWidth = '180px';
  document.body.appendChild(timeElement);

  // Create message UI
  const messageElement = document.createElement('div');
  messageElement.id = 'message-ui';
  messageElement.className = 'ui-panel message-notification';
  messageElement.style.position = 'absolute';
  messageElement.style.top = '50%';
  messageElement.style.left = '50%';
  messageElement.style.transform = 'translate(-50%, -50%)';
  messageElement.style.color = 'white';
  messageElement.style.fontFamily = 'Segoe UI, system-ui, sans-serif';
  messageElement.style.fontSize = '24px';
  messageElement.style.textAlign = 'center';
  messageElement.style.display = 'none';
  messageElement.style.zIndex = '1000';
  messageElement.style.maxWidth = '80%';
  messageElement.style.textShadow = '2px 2px 4px rgba(0,0,0,0.8)';
  messageElement.style.transition = 'opacity 0.5s';
  document.body.appendChild(messageElement);

  animate();
}

main();
