export type AchievementId =
  | 'first_harvest'
  | 'first_animal_resource'
  | 'first_quest'
  | 'master_farmer'
  | 'animal_whisperer'
  | 'community_helper'
  | 'market_master'
  | 'festival_goer'
  | 'wealthy_farmer'
  | 'crop_variety'
  | 'friendship_level_max'
  | 'week_survivor';

interface Achievement {
  id: AchievementId;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress: number;
  maxProgress: number;
}

const ACHIEVEMENTS: Record<AchievementId, Omit<Achievement, 'unlocked' | 'progress'>> = {
  first_harvest: {
    id: 'first_harvest',
    name: 'First Harvest',
    description: 'Harvest your first crop',
    icon: '🌾',
    maxProgress: 1,
  },
  first_animal_resource: {
    id: 'first_animal_resource',
    name: 'Animal Friend',
    description: 'Collect your first animal resource',
    icon: '🥚',
    maxProgress: 1,
  },
  first_quest: {
    id: 'first_quest',
    name: 'Helpful Neighbor',
    description: 'Complete your first quest',
    icon: '📋',
    maxProgress: 1,
  },
  master_farmer: {
    id: 'master_farmer',
    name: 'Master Farmer',
    description: 'Harvest 100 crops total',
    icon: '👨\u200d🌾',
    maxProgress: 100,
  },
  animal_whisperer: {
    id: 'animal_whisperer',
    name: 'Animal Whisperer',
    description: 'Collect 50 animal resources',
    icon: '🐔',
    maxProgress: 50,
  },
  community_helper: {
    id: 'community_helper',
    name: 'Community Helper',
    description: 'Complete 20 quests',
    icon: '🤝',
    maxProgress: 20,
  },
  market_master: {
    id: 'market_master',
    name: 'Market Master',
    description: 'Sell goods at 10 markets',
    icon: '🏪',
    maxProgress: 10,
  },
  festival_goer: {
    id: 'festival_goer',
    name: 'Festival Enthusiast',
    description: 'Attend all 4 seasonal festivals',
    icon: '🎉',
    maxProgress: 4,
  },
  wealthy_farmer: {
    id: 'wealthy_farmer',
    name: 'Wealthy Farmer',
    description: 'Accumulate 1000 coins',
    icon: '💰',
    maxProgress: 1000,
  },
  crop_variety: {
    id: 'crop_variety',
    name: 'Crop Diversity',
    description: 'Harvest 10 of each crop type',
    icon: '🌈',
    maxProgress: 3, // 3 crop types
  },
  friendship_level_max: {
    id: 'friendship_level_max',
    name: 'Best Friends',
    description: 'Reach max friendship with a neighbor',
    icon: '❤️',
    maxProgress: 1,
  },
  week_survivor: {
    id: 'week_survivor',
    name: 'Week Survivor',
    description: 'Survive for 7 days',
    icon: '📅',
    maxProgress: 7,
  },
};

export class AchievementSystem {
  private achievements: Map<AchievementId, Achievement>;
  private onUnlock: ((achievement: Achievement) => void) | null = null;

  constructor() {
    this.achievements = new Map();

    // Initialize all achievements
    Object.values(ACHIEVEMENTS).forEach((achData) => {
      this.achievements.set(achData.id, {
        ...achData,
        unlocked: false,
        progress: 0,
      });
    });
  }

  updateProgress(id: AchievementId, progress: number): boolean {
    const achievement = this.achievements.get(id);
    if (!achievement || achievement.unlocked) {
      return false;
    }

    achievement.progress = Math.min(progress, achievement.maxProgress);

    // Check if unlocked
    if (achievement.progress >= achievement.maxProgress) {
      achievement.unlocked = true;
      if (this.onUnlock) {
        this.onUnlock(achievement);
      }
      return true; // Achievement unlocked!
    }

    return false;
  }

  incrementProgress(id: AchievementId, amount: number = 1): boolean {
    const achievement = this.achievements.get(id);
    if (!achievement || achievement.unlocked) {
      return false;
    }

    return this.updateProgress(id, achievement.progress + amount);
  }

  getAchievement(id: AchievementId): Achievement | undefined {
    return this.achievements.get(id);
  }

  getAllAchievements(): Achievement[] {
    return Array.from(this.achievements.values());
  }

  getUnlockedAchievements(): Achievement[] {
    return this.getAllAchievements().filter((a) => a.unlocked);
  }

  getUnlockedCount(): number {
    return this.getUnlockedAchievements().length;
  }

  getTotalCount(): number {
    return this.achievements.size;
  }

  getCompletionPercentage(): number {
    return Math.floor((this.getUnlockedCount() / this.getTotalCount()) * 100);
  }

  registerUnlockCallback(callback: (achievement: Achievement) => void): void {
    this.onUnlock = callback;
  }

  // Event tracking methods
  onCropHarvested(): void {
    this.incrementProgress('first_harvest');
    this.incrementProgress('master_farmer');
  }

  onAnimalResourceCollected(): void {
    this.incrementProgress('first_animal_resource');
    this.incrementProgress('animal_whisperer');
  }

  onQuestCompleted(): void {
    this.incrementProgress('first_quest');
    this.incrementProgress('community_helper');
  }

  onMarketVisit(): void {
    this.incrementProgress('market_master');
  }

  onFestivalAttended(festivalCount: number): void {
    this.updateProgress('festival_goer', festivalCount);
  }

  onCoinsUpdated(totalCoins: number): void {
    this.updateProgress('wealthy_farmer', totalCoins);
  }

  onCropVarietyCheck(wheatCount: number, carrotCount: number, tomatoCount: number): void {
    const hasAllTypes = wheatCount >= 10 && carrotCount >= 10 && tomatoCount >= 10;
    if (hasAllTypes) {
      this.updateProgress('crop_variety', 3);
    }
  }

  onFriendshipMaxed(): void {
    this.incrementProgress('friendship_level_max');
  }

  onDayPassed(currentDay: number): void {
    this.updateProgress('week_survivor', currentDay);
  }
}
