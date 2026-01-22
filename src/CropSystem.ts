import * as THREE from 'three';
import { Block } from './Block';

export type CropType = 'WHEAT' | 'CARROT' | 'TOMATO';

interface CropData {
  growthDays: number; // Days to fully grow
  seedColor: number;
  matureColor: number;
  harvestYield: number;
}

const CROP_TYPES: Record<CropType, CropData> = {
  WHEAT: {
    growthDays: 3,
    seedColor: 0x8b7355, // Brown seeds
    matureColor: 0xf0e68c, // Golden wheat
    harvestYield: 3,
  },
  CARROT: {
    growthDays: 2,
    seedColor: 0x8b7355,
    matureColor: 0xff8c00, // Orange
    harvestYield: 2,
  },
  TOMATO: {
    growthDays: 4,
    seedColor: 0x8b7355,
    matureColor: 0xff0000, // Red
    harvestYield: 4,
  },
};

interface PlantedCrop {
  block: Block;
  type: CropType;
  plantedDay: number;
  growthStage: number; // 0-3 (0=seed, 3=mature)
  position: { x: number; y: number; z: number };
}

export class CropSystem {
  private scene: THREE.Scene;
  private plantedCrops: PlantedCrop[] = [];
  private inventory: Record<CropType, number> = {
    WHEAT: 5,
    CARROT: 3,
    TOMATO: 2,
  };
  private harvestedCrops: Record<CropType, number> = {
    WHEAT: 0,
    CARROT: 0,
    TOMATO: 0,
  };

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  // Plant a seed at location
  plantSeed(x: number, y: number, z: number, cropType: CropType, currentDay: number): boolean {
    // Check if player has seeds
    if (this.inventory[cropType] <= 0) {
      return false;
    }

    // Check if already planted here
    const existing = this.plantedCrops.find(
      c => Math.abs(c.position.x - x) < 0.1 &&
           Math.abs(c.position.z - z) < 0.1 &&
           Math.abs(c.position.y - y) < 0.1
    );
    if (existing) return false;

    // Create seed block
    const seedBlock = new Block(
      this.scene,
      x,
      y,
      z,
      CROP_TYPES[cropType].seedColor,
      true
    );

    // Track planted crop
    this.plantedCrops.push({
      block: seedBlock,
      type: cropType,
      plantedDay: currentDay,
      growthStage: 0,
      position: { x, y, z },
    });

    // Use seed from inventory
    this.inventory[cropType]--;

    return true;
  }

  // Update crop growth on new day
  onNewDay(currentDay: number): void {
    this.plantedCrops.forEach(crop => {
      const daysGrown = currentDay - crop.plantedDay;
      const cropData = CROP_TYPES[crop.type];

      // Calculate growth stage (0-3)
      const newStage = Math.min(3, Math.floor((daysGrown / cropData.growthDays) * 4));

      if (newStage !== crop.growthStage) {
        crop.growthStage = newStage;
        this.updateCropVisual(crop);
      }
    });
  }

  private updateCropVisual(crop: PlantedCrop): void {
    const cropData = CROP_TYPES[crop.type];

    // Interpolate color from seed to mature
    const t = crop.growthStage / 3;
    const color = this.lerpColor(cropData.seedColor, cropData.matureColor, t);

    // Update block color
    if (crop.block.mesh.material instanceof THREE.MeshStandardMaterial) {
      crop.block.mesh.material.color.setHex(color);
    }

    // Scale grows slightly (visual feedback)
    const scale = 0.5 + t * 0.2; // 0.5 -> 0.7
    crop.block.mesh.scale.set(scale, scale + 0.3, scale);
  }

  private lerpColor(color1: number, color2: number, t: number): number {
    const c1 = new THREE.Color(color1);
    const c2 = new THREE.Color(color2);
    return c1.lerp(c2, t).getHex();
  }

  // Harvest mature crop
  harvestCrop(x: number, y: number, z: number): CropType | null {
    const cropIndex = this.plantedCrops.findIndex(
      c => Math.abs(c.position.x - x) < 0.3 &&
           Math.abs(c.position.z - z) < 0.3 &&
           Math.abs(c.position.y - y) < 0.3
    );

    if (cropIndex === -1) return null;

    const crop = this.plantedCrops[cropIndex];

    // Check if mature (stage 3)
    if (crop.growthStage < 3) {
      return null; // Not ready to harvest
    }

    // Harvest!
    const cropType = crop.type;
    const yield_ = CROP_TYPES[cropType].harvestYield;

    // Add to harvest inventory
    this.harvestedCrops[cropType] += yield_;

    // Give back some seeds
    this.inventory[cropType] += Math.floor(yield_ / 2);

    // Remove crop
    crop.block.destroy();
    this.plantedCrops.splice(cropIndex, 1);

    return cropType;
  }

  getInventory(): Record<CropType, number> {
    return { ...this.inventory };
  }

  getHarvestedCrops(): Record<CropType, number> {
    return { ...this.harvestedCrops };
  }

  // Check if position has a crop
  getCropAt(x: number, y: number, z: number): PlantedCrop | null {
    return this.plantedCrops.find(
      c => Math.abs(c.position.x - x) < 0.3 &&
           Math.abs(c.position.z - z) < 0.3 &&
           Math.abs(c.position.y - y) < 0.3
    ) || null;
  }

  // Get status of crop for UI
  getCropStatus(crop: PlantedCrop): string {
    const stages = ['🌱 Seedling', '🌿 Growing', '🌾 Almost Ready', '✨ Ready to Harvest!'];
    return stages[crop.growthStage];
  }

  // Add seeds to inventory (quest reward)
  addSeeds(cropType: CropType, amount: number): void {
    this.inventory[cropType] += amount;
  }

  // Deduct harvested crops (quest completion)
  deductHarvestedCrops(cropType: CropType, amount: number): boolean {
    if (this.harvestedCrops[cropType] >= amount) {
      this.harvestedCrops[cropType] -= amount;
      return true;
    }
    return false;
  }
}
