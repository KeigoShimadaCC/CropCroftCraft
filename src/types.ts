export type BlockType = 'DIRT' | 'STONE' | 'WOOD' | 'GRASS' | 'BRICK' | 'SAND' | 'GLASS' | 'COBBLESTONE' | 'PLANKS';

export const BlockType = {
  DIRT: 'DIRT' as BlockType,
  STONE: 'STONE' as BlockType,
  WOOD: 'WOOD' as BlockType,
  GRASS: 'GRASS' as BlockType,
  BRICK: 'BRICK' as BlockType,
  SAND: 'SAND' as BlockType,
  GLASS: 'GLASS' as BlockType,
  COBBLESTONE: 'COBBLESTONE' as BlockType,
  PLANKS: 'PLANKS' as BlockType,
};

export const BlockColors: Record<BlockType, number> = {
  DIRT: 0x8b4513, // Brown
  STONE: 0x808080, // Gray
  WOOD: 0xdaa520, // Goldenrod
  GRASS: 0x228b22, // Forest green
  BRICK: 0xb22222, // Firebrick red
  SAND: 0xf4a460, // Sandy brown
  GLASS: 0x87ceeb, // Sky blue (semi-transparent)
  COBBLESTONE: 0x696969, // Dim gray
  PLANKS: 0xcd853f, // Peru brown
};
