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
