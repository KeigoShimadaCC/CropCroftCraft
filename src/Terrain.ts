import * as THREE from 'three';
import { Block } from './Block';
import { BlockType, BlockColors } from './types';

export function generateTerrain(scene: THREE.Scene): Block[] {
  const blocks: Block[] = [];
  const size = 16; // 16x16 platform

  for (let x = -size / 2; x < size / 2; x++) {
    for (let z = -size / 2; z < size / 2; z++) {
      // Bottom layer: stone (y = -2)
      const stoneBlock = new Block(
        scene,
        x,
        -2,
        z,
        BlockColors[BlockType.STONE],
        true // static
      );
      blocks.push(stoneBlock);

      // Middle layer: dirt (y = -1)
      const dirtBlock = new Block(
        scene,
        x,
        -1,
        z,
        BlockColors[BlockType.DIRT],
        true // static
      );
      blocks.push(dirtBlock);

      // Top layer: grass (y = 0)
      const grassBlock = new Block(
        scene,
        x,
        0,
        z,
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

  // House position (offset from center)
  const houseX = 4;
  const houseZ = 4;
  const groundLevel = 1; // Build on top of terrain

  // House dimensions
  const width = 5;
  const depth = 5;
  const wallHeight = 3;

  // Build stone floor
  for (let x = 0; x < width; x++) {
    for (let z = 0; z < depth; z++) {
      const block = new Block(
        scene,
        houseX + x,
        groundLevel,
        houseZ + z,
        BlockColors[BlockType.STONE],
        true
      );
      blocks.push(block);
    }
  }

  // Build wooden walls with door and windows
  for (let y = 1; y <= wallHeight; y++) {
    // Front wall (with door in middle)
    for (let x = 0; x < width; x++) {
      const isDoor = y <= 2 && x === Math.floor(width / 2); // Door opening
      if (!isDoor) {
        const block = new Block(
          scene,
          houseX + x,
          groundLevel + y,
          houseZ,
          BlockColors[BlockType.WOOD],
          true
        );
        blocks.push(block);
      }
    }

    // Back wall
    for (let x = 0; x < width; x++) {
      const block = new Block(
        scene,
        houseX + x,
        groundLevel + y,
        houseZ + depth - 1,
        BlockColors[BlockType.WOOD],
        true
      );
      blocks.push(block);
    }

    // Left wall (with window)
    for (let z = 1; z < depth - 1; z++) {
      const isWindow = y === 2 && z === Math.floor(depth / 2); // Window opening
      if (!isWindow) {
        const block = new Block(
          scene,
          houseX,
          groundLevel + y,
          houseZ + z,
          BlockColors[BlockType.WOOD],
          true
        );
        blocks.push(block);
      }
    }

    // Right wall (with window)
    for (let z = 1; z < depth - 1; z++) {
      const isWindow = y === 2 && z === Math.floor(depth / 2); // Window opening
      if (!isWindow) {
        const block = new Block(
          scene,
          houseX + width - 1,
          groundLevel + y,
          houseZ + z,
          BlockColors[BlockType.WOOD],
          true
        );
        blocks.push(block);
      }
    }
  }

  // Build sloped roof with stone blocks
  const roofHeight = wallHeight + 1;
  for (let layer = 0; layer < 3; layer++) {
    const roofWidth = width - layer * 2;
    const roofDepth = depth - layer * 2;

    if (roofWidth <= 0 || roofDepth <= 0) break;

    for (let x = 0; x < roofWidth; x++) {
      for (let z = 0; z < roofDepth; z++) {
        const block = new Block(
          scene,
          houseX + layer + x,
          groundLevel + roofHeight + layer,
          houseZ + layer + z,
          BlockColors[BlockType.STONE],
          true
        );
        blocks.push(block);
      }
    }
  }

  // Add grass decoration on top of roof
  const block = new Block(
    scene,
    houseX + Math.floor(width / 2),
    groundLevel + roofHeight + 2,
    houseZ + Math.floor(depth / 2),
    BlockColors[BlockType.GRASS],
    true
  );
  blocks.push(block);

  // Add stone path leading to door
  for (let z = -3; z < 0; z++) {
    const block = new Block(
      scene,
      houseX + Math.floor(width / 2),
      groundLevel,
      houseZ + z,
      BlockColors[BlockType.STONE],
      true
    );
    blocks.push(block);
  }

  return blocks;
}
