import generated from './foodAndDrinks.generated.json';

export type FoodDrinkCategory = 'food' | 'drink';

export type FoodDrinkName = {
  name: string;
  category: FoodDrinkCategory;
};

// The importer validates categories; the data tests verify the committed JSON.
export const FOOD_AND_DRINKS = generated.entries as FoodDrinkName[];
export const FOOD_DATA_SOURCE = generated.source;
