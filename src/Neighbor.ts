import * as THREE from 'three';
import type { CropType } from './CropSystem';
import type { ResourceType } from './Creature';

export interface Quest {
  id: number;
  type: 'crop' | 'resource';
  itemType: CropType | ResourceType;
  amount: number;
  reward: {
    type: 'seeds' | 'friendship';
    cropType?: CropType;
    amount?: number;
    friendshipPoints?: number;
  };
  dialogue: string;
  completionDialogue: string;
}

export interface NeighborData {
  name: string;
  personality: 'friendly' | 'grumpy' | 'wise' | 'energetic';
  position: { x: number; y: number; z: number };
  houseColor: number;
}

export class Neighbor {
  private name: string;
  private personality: 'friendly' | 'grumpy' | 'wise' | 'energetic';
  private position: THREE.Vector3;
  private friendshipLevel: number = 0; // 0-100
  private currentQuest: Quest | null = null;
  private lastQuestDay: number = -1;
  private marker: THREE.Mesh;
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene, data: NeighborData) {
    this.scene = scene;
    this.name = data.name;
    this.personality = data.personality;
    this.position = new THREE.Vector3(data.position.x, data.position.y, data.position.z);

    // Create interaction marker (visible indicator above house)
    this.marker = this.createMarker(data.houseColor);
    scene.add(this.marker);
  }

  private createMarker(houseColor: number): THREE.Mesh {
    // Create a small floating marker above the house
    const geometry = new THREE.ConeGeometry(0.15, 0.3, 8);
    const material = new THREE.MeshStandardMaterial({
      color: houseColor,
      emissive: houseColor,
      emissiveIntensity: 0.3,
    });
    const marker = new THREE.Mesh(geometry, material);
    marker.position.copy(this.position);
    marker.position.y += 2.5; // Above the house
    marker.rotation.x = Math.PI; // Point downward
    return marker;
  }

  update(deltaTime: number): void {
    // Animate marker (bobbing motion)
    this.marker.position.y = this.position.y + 2.5 + Math.sin(Date.now() * 0.002) * 0.1;
    this.marker.rotation.y += deltaTime * 0.5; // Rotate slowly
  }

  // Generate a new quest for this neighbor
  generateQuest(currentDay: number): void {
    if (this.currentQuest !== null || this.lastQuestDay === currentDay) {
      return; // Already has quest or already got one today
    }

    this.lastQuestDay = currentDay;

    // Random quest type
    const questId = Math.floor(Math.random() * 1000000);
    const isResourceQuest = Math.random() > 0.5;

    if (isResourceQuest) {
      // Animal resource quest
      const resources: ResourceType[] = ['EGG', 'MILK', 'WOOL'];
      const resourceType = resources[Math.floor(Math.random() * resources.length)];
      const amount = 2 + Math.floor(Math.random() * 3); // 2-4

      this.currentQuest = {
        id: questId,
        type: 'resource',
        itemType: resourceType,
        amount,
        reward: {
          type: 'friendship',
          friendshipPoints: 15,
        },
        dialogue: this.getQuestDialogue('resource', resourceType, amount),
        completionDialogue: this.getCompletionDialogue(),
      };
    } else {
      // Crop quest
      const crops: CropType[] = ['WHEAT', 'CARROT', 'TOMATO'];
      const cropType = crops[Math.floor(Math.random() * crops.length)];
      const amount = 3 + Math.floor(Math.random() * 4); // 3-6

      // Reward is seeds of random type
      const rewardCrops: CropType[] = ['WHEAT', 'CARROT', 'TOMATO'];
      const rewardCrop = rewardCrops[Math.floor(Math.random() * rewardCrops.length)];

      this.currentQuest = {
        id: questId,
        type: 'crop',
        itemType: cropType,
        amount,
        reward: {
          type: 'seeds',
          cropType: rewardCrop,
          amount: 3 + Math.floor(Math.random() * 3), // 3-5 seeds
          friendshipPoints: 10,
        },
        dialogue: this.getQuestDialogue('crop', cropType, amount),
        completionDialogue: this.getCompletionDialogue(),
      };
    }
  }

  private getQuestDialogue(_type: 'crop' | 'resource', itemType: CropType | ResourceType, amount: number): string {
    if (!itemType) return 'I need some help!';
    const itemName = itemType.toLowerCase();

    switch (this.personality) {
      case 'friendly':
        return `Hey there, friend! 😊 Could you help me out with ${amount} ${itemName}${amount > 1 ? 's' : ''}? I'd really appreciate it!`;
      case 'grumpy':
        return `Hmph. I need ${amount} ${itemName}${amount > 1 ? 's' : ''}. Think you can manage that?`;
      case 'wise':
        return `Greetings, neighbor. In my years of farming, I've learned the value of ${itemName}. Might you spare ${amount}?`;
      case 'energetic':
        return `Wow! Hey! I need ${amount} ${itemName}${amount > 1 ? 's' : ''} for something AMAZING! Can you help?! 🌟`;
      default:
        return `I need ${amount} ${itemName}${amount > 1 ? 's' : ''}. Can you help?`;
    }
  }

  private getCompletionDialogue(): string {
    switch (this.personality) {
      case 'friendly':
        return `Thank you so much! You're the best! 💚`;
      case 'grumpy':
        return `Hmm. Not bad. I suppose you're helpful after all.`;
      case 'wise':
        return `Your generosity reflects your wisdom. Many thanks.`;
      case 'energetic':
        return `WOW! THANK YOU! You're AWESOME! 🎉✨`;
      default:
        return `Thanks for the help!`;
    }
  }

  getGreetingDialogue(): string {
    if (this.currentQuest) {
      return this.currentQuest.dialogue;
    }

    // No quest available
    const friendship = this.friendshipLevel;

    switch (this.personality) {
      case 'friendly':
        if (friendship < 30) return `Hello there! Nice to meet you! 👋`;
        if (friendship < 70) return `Hey friend! How's the farm going? 🌱`;
        return `My dear friend! Always wonderful to see you! 💖`;

      case 'grumpy':
        if (friendship < 30) return `What do you want?`;
        if (friendship < 70) return `Oh, it's you. Farming going okay?`;
        return `Hmph. I suppose I don't mind your company.`;

      case 'wise':
        if (friendship < 30) return `Greetings, newcomer. May your fields be fertile.`;
        if (friendship < 70) return `Ah, young farmer. Your progress pleases me.`;
        return `My trusted friend. Your wisdom grows with each harvest.`;

      case 'energetic':
        if (friendship < 30) return `HI! New to farming?! It's SO FUN! 🌟`;
        if (friendship < 70) return `YAY! You're getting really good at farming! 🎊`;
        return `BEST FARMER FRIEND EVER! Let's farm FOREVER! 🌈`;

      default:
        return `Hello!`;
    }
  }

  getCurrentQuest(): Quest | null {
    return this.currentQuest;
  }

  completeQuest(): { success: boolean; reward?: Quest['reward'] } {
    if (!this.currentQuest) {
      return { success: false };
    }

    const reward = this.currentQuest.reward;
    this.friendshipLevel = Math.min(100, this.friendshipLevel + (reward.friendshipPoints || 0));
    this.currentQuest = null;

    return { success: true, reward };
  }

  getName(): string {
    return this.name;
  }

  getPosition(): THREE.Vector3 {
    return this.position.clone();
  }

  getFriendshipLevel(): number {
    return this.friendshipLevel;
  }

  hasQuest(): boolean {
    return this.currentQuest !== null;
  }

  isNearPosition(x: number, y: number, z: number, distance: number = 3): boolean {
    return this.position.distanceTo(new THREE.Vector3(x, y, z)) < distance;
  }

  destroy(): void {
    this.scene.remove(this.marker);
    if (this.marker.geometry) this.marker.geometry.dispose();
    if (this.marker.material instanceof THREE.Material) {
      this.marker.material.dispose();
    }
  }
}
