import type { CropType } from './CropSystem';

export type RecipeId =
  | 'bread'
  | 'vegetable_stew'
  | 'carrot_soup'
  | 'tomato_sauce'
  | 'farm_feast';

export type MealType = RecipeId;

interface Recipe {
  id: RecipeId;
  name: string;
  description: string;
  icon: string;
  ingredients: Partial<Record<CropType | 'EGG' | 'MILK' | 'WOOL', number>>;
  energyRestore: number; // Future mechanic
  sellPrice: number; // Worth more than raw ingredients
}

const RECIPES: Record<RecipeId, Recipe> = {
  bread: {
    id: 'bread',
    name: 'Wheat Bread',
    description: 'Fresh baked bread from wheat',
    icon: '🍞',
    ingredients: { WHEAT: 3 },
    energyRestore: 20,
    sellPrice: 25,
  },
  vegetable_stew: {
    id: 'vegetable_stew',
    name: 'Vegetable Stew',
    description: 'Hearty stew with carrots and tomatoes',
    icon: '🍲',
    ingredients: { CARROT: 2, TOMATO: 2 },
    energyRestore: 40,
    sellPrice: 50,
  },
  carrot_soup: {
    id: 'carrot_soup',
    name: 'Carrot Soup',
    description: 'Creamy soup with milk and carrots',
    icon: '🥣',
    ingredients: { CARROT: 3, MILK: 1 },
    energyRestore: 35,
    sellPrice: 45,
  },
  tomato_sauce: {
    id: 'tomato_sauce',
    name: 'Tomato Sauce',
    description: 'Rich sauce from fresh tomatoes',
    icon: '🥫',
    ingredients: { TOMATO: 4 },
    energyRestore: 25,
    sellPrice: 35,
  },
  farm_feast: {
    id: 'farm_feast',
    name: 'Farm Feast',
    description: 'Ultimate meal with all farm products',
    icon: '🍽️',
    ingredients: { WHEAT: 2, CARROT: 2, TOMATO: 2, EGG: 1, MILK: 1 },
    energyRestore: 100,
    sellPrice: 150,
  },
};

export class CookingSystem {
  private cookedMeals: Record<RecipeId, number> = {
    bread: 0,
    vegetable_stew: 0,
    carrot_soup: 0,
    tomato_sauce: 0,
    farm_feast: 0,
  };

  constructor() {}

  getRecipe(id: RecipeId): Recipe {
    return RECIPES[id];
  }

  getAllRecipes(): Recipe[] {
    return Object.values(RECIPES);
  }

  canCook(
    recipeId: RecipeId,
    harvested: Record<CropType, number>,
    resources: Record<'EGG' | 'MILK' | 'WOOL', number>
  ): boolean {
    const recipe = RECIPES[recipeId];

    for (const [ingredient, required] of Object.entries(recipe.ingredients)) {
      const available =
        ingredient === 'EGG' || ingredient === 'MILK' || ingredient === 'WOOL'
          ? resources[ingredient]
          : harvested[ingredient as CropType];

      if ((available || 0) < (required || 0)) {
        return false;
      }
    }

    return true;
  }

  cook(
    recipeId: RecipeId,
    harvested: Record<CropType, number>,
    resources: Record<'EGG' | 'MILK' | 'WOOL', number>
  ): { success: boolean; meal?: Recipe } {
    if (!this.canCook(recipeId, harvested, resources)) {
      return { success: false };
    }

    const recipe = RECIPES[recipeId];

    // Deduct ingredients (this will be done in main.ts to update the actual inventories)
    this.cookedMeals[recipeId]++;

    return { success: true, meal: recipe };
  }

  getMealCount(recipeId: RecipeId): number {
    return this.cookedMeals[recipeId];
  }

  getTotalMeals(): number {
    return Object.values(this.cookedMeals).reduce((sum, count) => sum + count, 0);
  }

  getCookedMeals(): Record<RecipeId, number> {
    return { ...this.cookedMeals };
  }

  sellMeal(recipeId: RecipeId, amount: number = 1): number {
    if (this.cookedMeals[recipeId] < amount) {
      return 0;
    }

    this.cookedMeals[recipeId] -= amount;
    const recipe = RECIPES[recipeId];
    return recipe.sellPrice * amount;
  }
}
