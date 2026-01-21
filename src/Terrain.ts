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
