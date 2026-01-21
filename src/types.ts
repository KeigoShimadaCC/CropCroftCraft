export type BlockType = 'DIRT' | 'STONE' | 'WOOD' | 'GRASS';

export const BlockType = {
  DIRT: 'DIRT' as BlockType,
  STONE: 'STONE' as BlockType,
  WOOD: 'WOOD' as BlockType,
  GRASS: 'GRASS' as BlockType,
};

export const BlockColors: Record<BlockType, number> = {
  DIRT: 0x8b4513, // Brown
  STONE: 0x808080, // Gray
  WOOD: 0xdaa520, // Goldenrod
  GRASS: 0x228b22, // Forest green
};
