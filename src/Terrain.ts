import * as THREE from 'three';
import { Block } from './Block';
import { BlockType, BlockColors } from './types';

export function generateTerrain(scene: THREE.Scene): Block[] {
  const blocks: Block[] = [];
  const size = 32; // 32x32 platform (doubled for smaller blocks)

  for (let x = -size / 2; x < size / 2; x++) {
    for (let z = -size / 2; z < size / 2; z++) {
      // Bottom layer: stone (y = -1.5)
      const stoneBlock = new Block(
        scene,
        x * 0.5,
        -1.5,
        z * 0.5,
        BlockColors[BlockType.STONE],
        true // static
      );
      blocks.push(stoneBlock);

      // Middle layer: dirt (y = -1)
      const dirtBlock = new Block(
        scene,
        x * 0.5,
        -1,
        z * 0.5,
        BlockColors[BlockType.DIRT],
        true // static
      );
      blocks.push(dirtBlock);

      // Top layer: grass (y = -0.5)
      const grassBlock = new Block(
        scene,
        x * 0.5,
        -0.5,
        z * 0.5,
        BlockColors[BlockType.GRASS],
        true // static
      );
      blocks.push(grassBlock);
    }
  }

  return blocks;
}

export function generateHouse(scene: THREE.Scene): Block[] {
  const blocks: Block[] = [];

  // House position (centered, adjusted for smaller blocks)
  const houseX = 2;
  const houseZ = 2;
  const groundLevel = 0; // Build on top of terrain

  // House dimensions (larger with smaller blocks)
  const width = 16; // 8 blocks wide
  const depth = 12; // 6 blocks deep
  const wallHeight = 10; // 5 blocks tall

  // Helper function to place block
  const placeBlock = (x: number, y: number, z: number, type: BlockType) => {
    blocks.push(
      new Block(
        scene,
        (houseX + x) * 0.5,
        groundLevel + y * 0.5,
        (houseZ + z) * 0.5,
        BlockColors[type],
        true
      )
    );
  };

  // Build cobblestone foundation
  for (let x = 0; x < width; x++) {
    for (let z = 0; z < depth; z++) {
      placeBlock(x, 0, z, BlockType.COBBLESTONE);
    }
  }

  // Build brick walls with door and windows
  for (let y = 1; y <= wallHeight; y++) {
    // Front wall (with door and windows)
    for (let x = 0; x < width; x++) {
      const isDoor = y <= 4 && (x === 7 || x === 8); // Double door
      const isWindow =
        (y >= 3 && y <= 5) && (x === 3 || x === 4 || x === 11 || x === 12); // Windows
      if (!isDoor && !isWindow) {
        placeBlock(x, y, 0, BlockType.BRICK);
      } else if (isWindow) {
        placeBlock(x, y, 0, BlockType.GLASS);
      }
    }

    // Back wall (with windows)
    for (let x = 0; x < width; x++) {
      const isWindow = (y >= 3 && y <= 5) && (x === 4 || x === 11); // Windows
      if (!isWindow) {
        placeBlock(x, y, depth - 1, BlockType.BRICK);
      } else {
        placeBlock(x, y, depth - 1, BlockType.GLASS);
      }
    }

    // Left wall (with window)
    for (let z = 1; z < depth - 1; z++) {
      const isWindow = (y >= 3 && y <= 5) && (z === 5 || z === 6); // Window
      if (!isWindow) {
        placeBlock(0, y, z, BlockType.BRICK);
      } else {
        placeBlock(0, y, z, BlockType.GLASS);
      }
    }

    // Right wall (with window)
    for (let z = 1; z < depth - 1; z++) {
      const isWindow = (y >= 3 && y <= 5) && (z === 5 || z === 6); // Window
      if (!isWindow) {
        placeBlock(width - 1, y, z, BlockType.BRICK);
      } else {
        placeBlock(width - 1, y, z, BlockType.GLASS);
      }
    }
  }

  // Build wooden plank roof (pitched)
  const roofHeight = wallHeight + 1;
  for (let layer = 0; layer < 6; layer++) {
    const roofWidth = width - layer * 2;
    const roofDepth = depth - layer * 2;

    if (roofWidth <= 0 || roofDepth <= 0) break;

    for (let x = 0; x < roofWidth; x++) {
      for (let z = 0; z < roofDepth; z++) {
        placeBlock(layer + x, roofHeight + layer, layer + z, BlockType.PLANKS);
      }
    }
  }

  // Add cobblestone chimney on roof
  const chimneyX = 3;
  const chimneyZ = depth - 3;
  for (let y = roofHeight; y < roofHeight + 6; y++) {
    placeBlock(chimneyX, y, chimneyZ, BlockType.COBBLESTONE);
    placeBlock(chimneyX + 1, y, chimneyZ, BlockType.COBBLESTONE);
  }

  // Add stone path leading to door
  for (let z = -6; z < 0; z++) {
    placeBlock(7, 0, z, BlockType.STONE);
    placeBlock(8, 0, z, BlockType.STONE);
  }

  // Add decorative sand garden on side
  for (let x = width; x < width + 4; x++) {
    for (let z = 2; z < 6; z++) {
      placeBlock(x, 0, z, BlockType.SAND);
    }
  }

  return blocks;
}

// Build a small farmhouse
function buildFarmhouse(
  scene: THREE.Scene,
  startX: number,
  startZ: number,
  width: number,
  depth: number
): Block[] {
  const blocks: Block[] = [];
  const groundLevel = 0;
  const wallHeight = 8;

  const placeBlock = (x: number, y: number, z: number, type: BlockType) => {
    blocks.push(
      new Block(
        scene,
        (startX + x) * 0.5,
        groundLevel + y * 0.5,
        (startZ + z) * 0.5,
        BlockColors[type],
        true
      )
    );
  };

  // Foundation
  for (let x = 0; x < width; x++) {
    for (let z = 0; z < depth; z++) {
      placeBlock(x, 0, z, BlockType.COBBLESTONE);
    }
  }

  // Walls with door and windows
  for (let y = 1; y <= wallHeight; y++) {
    // Front wall
    for (let x = 0; x < width; x++) {
      const isDoor = y <= 3 && x >= Math.floor(width / 2) - 1 && x <= Math.floor(width / 2);
      const isWindow = y >= 3 && y <= 4 && (x === 2 || x === width - 3);
      if (!isDoor && !isWindow) {
        placeBlock(x, y, 0, BlockType.PLANKS);
      } else if (isWindow) {
        placeBlock(x, y, 0, BlockType.GLASS);
      }
    }

    // Other walls
    for (let x = 0; x < width; x++) {
      if (y >= 3 && y <= 4 && x === Math.floor(width / 2)) {
        placeBlock(x, y, depth - 1, BlockType.GLASS);
      } else {
        placeBlock(x, y, depth - 1, BlockType.PLANKS);
      }
    }

    for (let z = 1; z < depth - 1; z++) {
      placeBlock(0, y, z, BlockType.PLANKS);
      placeBlock(width - 1, y, z, BlockType.PLANKS);
    }
  }

  // Roof
  const roofHeight = wallHeight + 1;
  for (let layer = 0; layer < Math.min(width, depth) / 2; layer++) {
    const roofWidth = width - layer * 2;
    const roofDepth = depth - layer * 2;
    if (roofWidth <= 0 || roofDepth <= 0) break;

    for (let x = 0; x < roofWidth; x++) {
      for (let z = 0; z < roofDepth; z++) {
        placeBlock(layer + x, roofHeight + layer, layer + z, BlockType.BRICK);
      }
    }
  }

  return blocks;
}

// Build crop field
function buildCropField(
  scene: THREE.Scene,
  startX: number,
  startZ: number,
  width: number,
  depth: number,
  cropType: BlockType
): Block[] {
  const blocks: Block[] = [];
  const groundLevel = 0;

  const placeBlock = (x: number, y: number, z: number, type: BlockType) => {
    blocks.push(
      new Block(
        scene,
        (startX + x) * 0.5,
        groundLevel + y * 0.5,
        (startZ + z) * 0.5,
        BlockColors[type],
        true
      )
    );
  };

  // Tilled dirt base
  for (let x = 0; x < width; x++) {
    for (let z = 0; z < depth; z++) {
      placeBlock(x, 0, z, BlockType.DIRT);
    }
  }

  // Crops in rows
  for (let z = 0; z < depth; z += 2) {
    for (let x = 0; x < width; x++) {
      placeBlock(x, 1, z, cropType);
    }
  }

  return blocks;
}

// Build barn
function buildBarn(scene: THREE.Scene, startX: number, startZ: number): Block[] {
  const blocks: Block[] = [];
  const groundLevel = 0;
  const width = 14;
  const depth = 10;
  const wallHeight = 12;

  const placeBlock = (x: number, y: number, z: number, type: BlockType) => {
    blocks.push(
      new Block(
        scene,
        (startX + x) * 0.5,
        groundLevel + y * 0.5,
        (startZ + z) * 0.5,
        BlockColors[type],
        true
      )
    );
  };

  // Stone foundation
  for (let x = 0; x < width; x++) {
    for (let z = 0; z < depth; z++) {
      placeBlock(x, 0, z, BlockType.STONE);
    }
  }

  // Wooden walls with big door
  for (let y = 1; y <= wallHeight; y++) {
    // Front wall with large door
    for (let x = 0; x < width; x++) {
      const isBigDoor = y <= 6 && x >= 5 && x <= 8;
      if (!isBigDoor) {
        placeBlock(x, y, 0, BlockType.WOOD);
      }
    }

    // Back wall
    for (let x = 0; x < width; x++) {
      placeBlock(x, y, depth - 1, BlockType.WOOD);
    }

    // Side walls
    for (let z = 1; z < depth - 1; z++) {
      placeBlock(0, y, z, BlockType.WOOD);
      placeBlock(width - 1, y, z, BlockType.WOOD);
    }
  }

  // Red barn roof
  const roofHeight = wallHeight + 1;
  for (let layer = 0; layer < 5; layer++) {
    const roofWidth = width - layer * 2;
    const roofDepth = depth - layer * 2;
    if (roofWidth <= 0 || roofDepth <= 0) break;

    for (let x = 0; x < roofWidth; x++) {
      for (let z = 0; z < roofDepth; z++) {
        placeBlock(layer + x, roofHeight + layer, layer + z, BlockType.BRICK);
      }
    }
  }

  return blocks;
}

// Build fence
function buildFence(
  scene: THREE.Scene,
  startX: number,
  startZ: number,
  length: number,
  isVertical: boolean
): Block[] {
  const blocks: Block[] = [];
  const groundLevel = 0;

  const placeBlock = (x: number, y: number, z: number, type: BlockType) => {
    blocks.push(
      new Block(
        scene,
        (startX + x) * 0.5,
        groundLevel + y * 0.5,
        (startZ + z) * 0.5,
        BlockColors[type],
        true
      )
    );
  };

  for (let i = 0; i < length; i++) {
    if (isVertical) {
      placeBlock(0, 1, i, BlockType.WOOD);
      placeBlock(0, 2, i, BlockType.WOOD);
    } else {
      placeBlock(i, 1, 0, BlockType.WOOD);
      placeBlock(i, 2, 0, BlockType.WOOD);
    }
  }

  return blocks;
}

// Build path
function buildPath(
  scene: THREE.Scene,
  startX: number,
  startZ: number,
  length: number,
  width: number,
  isVertical: boolean
): Block[] {
  const blocks: Block[] = [];
  const groundLevel = 0;

  const placeBlock = (x: number, y: number, z: number, type: BlockType) => {
    blocks.push(
      new Block(
        scene,
        (startX + x) * 0.5,
        groundLevel + y * 0.5,
        (startZ + z) * 0.5,
        BlockColors[type],
        true
      )
    );
  };

  for (let i = 0; i < length; i++) {
    for (let w = 0; w < width; w++) {
      if (isVertical) {
        placeBlock(w, 0, i, BlockType.COBBLESTONE);
      } else {
        placeBlock(i, 0, w, BlockType.COBBLESTONE);
      }
    }
  }

  return blocks;
}

// Generate complete farm world
export function generateFarmWorld(scene: THREE.Scene): Block[] {
  const blocks: Block[] = [];

  // Player's farmhouse (main house) - center-ish
  const playerHouse = buildFarmhouse(scene, 2, 2, 12, 10);
  blocks.push(...playerHouse);

  // Neighbor 1's farmhouse - to the left
  const neighbor1 = buildFarmhouse(scene, -20, 5, 10, 8);
  blocks.push(...neighbor1);

  // Neighbor 2's farmhouse - to the right
  const neighbor2 = buildFarmhouse(scene, 25, 8, 11, 9);
  blocks.push(...neighbor2);

  // Community barn (shared) - back area
  const barn = buildBarn(scene, 4, -25);
  blocks.push(...barn);

  // Crop fields - wheat (grass color for now)
  const wheatField = buildCropField(scene, -8, 15, 12, 8, BlockType.GRASS);
  blocks.push(...wheatField);

  // Carrot field (sand color = orange)
  const carrotField = buildCropField(scene, 15, 18, 10, 8, BlockType.SAND);
  blocks.push(...carrotField);

  // Tomato field (brick = red)
  const tomatoField = buildCropField(scene, -8, 26, 8, 6, BlockType.BRICK);
  blocks.push(...tomatoField);

  // Player's personal garden
  const garden = buildCropField(scene, 14, 4, 6, 6, BlockType.GRASS);
  blocks.push(...garden);

  // Fences around fields
  blocks.push(...buildFence(scene, -9, 15, 8, true)); // Left wheat fence
  blocks.push(...buildFence(scene, 4, 15, 8, true)); // Right wheat fence
  blocks.push(...buildFence(scene, 15, 17, 10, true)); // Left carrot fence
  blocks.push(...buildFence(scene, 26, 17, 10, true)); // Right carrot fence

  // Main paths connecting houses
  blocks.push(...buildPath(scene, 2, 12, 10, 3, true)); // Player house to fields
  blocks.push(...buildPath(scene, -10, 8, 15, 2, false)); // Neighbor 1 to center
  blocks.push(...buildPath(scene, 12, 10, 15, 2, false)); // Center to neighbor 2
  blocks.push(...buildPath(scene, 6, -15, 15, 3, true)); // Path to barn

  // Community well (center gathering spot)
  const wellX = 0;
  const wellZ = -5;
  const placeBlock = (x: number, y: number, z: number, type: BlockType) => {
    blocks.push(
      new Block(
        scene,
        x * 0.5,
        y * 0.5,
        z * 0.5,
        BlockColors[type],
        true
      )
    );
  };

  // Well structure
  for (let x = wellX - 1; x <= wellX + 1; x++) {
    for (let z = wellZ - 1; z <= wellZ + 1; z++) {
      if (x === wellX && z === wellZ) continue; // Hole in middle
      placeBlock(x, 0, z, BlockType.COBBLESTONE);
      placeBlock(x, 1, z, BlockType.COBBLESTONE);
    }
  }

  // Well roof posts
  placeBlock(wellX - 1, 2, wellZ - 1, BlockType.WOOD);
  placeBlock(wellX - 1, 3, wellZ - 1, BlockType.WOOD);
  placeBlock(wellX + 1, 2, wellZ - 1, BlockType.WOOD);
  placeBlock(wellX + 1, 3, wellZ - 1, BlockType.WOOD);
  placeBlock(wellX - 1, 2, wellZ + 1, BlockType.WOOD);
  placeBlock(wellX - 1, 3, wellZ + 1, BlockType.WOOD);
  placeBlock(wellX + 1, 2, wellZ + 1, BlockType.WOOD);
  placeBlock(wellX + 1, 3, wellZ + 1, BlockType.WOOD);

  // Well roof
  for (let x = wellX - 2; x <= wellX + 2; x++) {
    for (let z = wellZ - 2; z <= wellZ + 2; z++) {
      placeBlock(x, 4, z, BlockType.PLANKS);
    }
  }

  return blocks;
}
