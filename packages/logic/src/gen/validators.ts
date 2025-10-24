// Generated validation logic
// DO NOT EDIT - This file is auto-generated

import type { Drink, ValidationResult } from "@bitpixis-bar/types";

/**
 * Validate a complete drink using generated schema rules
 * @param drink The drink to validate
 * @returns Validation result with errors
 */
export function validateDrink(drink: Drink): ValidationResult {
  const errors: string[] = [];

  // Validate required fields
  if (!drink.name?.trim()) {
    errors.push("Drink name is required");
  }

  // Validate mix mode specific requirements
  if (drink.mixMode === "blend") {
    if (!drink.color) {
      errors.push("Blend mode requires a color");
    } else if (!isValidHexColor(drink.color)) {
      errors.push("Color must be a valid hex color");
    }
  }

  if (drink.mixMode === "layered") {
    if (!drink.layers || drink.layers.length === 0) {
      errors.push("Layered mode requires at least one layer");
    } else {
      const layerValidation = validateLayers(drink.layers);
      errors.push(...layerValidation.errors);
    }
  }

  // Validate array limits
  if (drink.flavors.length > 3) {
    errors.push("Maximum 3 flavors allowed");
  }
  if (drink.toppings.length > 3) {
    errors.push("Maximum 3 toppings allowed");
  }

  // Validate name constraints
  const nameValidation = validateDrinkName(drink.name);
  errors.push(...nameValidation.errors);

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate drink name constraints
 */
export function validateDrinkName(name: string): ValidationResult {
  const errors: string[] = [];
  const bannedWords = ["alcohol", "beer", "wine", "vodka", "whiskey", "rum"];

  if (!name || name.trim().length === 0) {
    errors.push("Drink name is required");
    return { valid: false, errors };
  }

  const trimmedName = name.trim();

  if (trimmedName.length > 24) {
    errors.push("Drink name must be 24 characters or less");
  }

  const lowerName = trimmedName.toLowerCase();
  for (const banned of bannedWords) {
    if (lowerName.includes(banned)) {
      errors.push(`Drink name cannot contain "${banned}"`);
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate layer configuration
 */
function validateLayers(layers: Array<{ color: string; percent: number }>): ValidationResult {
  const errors: string[] = [];

  if (layers.length > 4) {
    errors.push("Maximum 4 layers allowed");
  }

  const totalPercent = layers.reduce((sum, layer) => sum + layer.percent, 0);
  if (Math.abs(totalPercent - 100) > 0.01) {
    errors.push("Layer percentages must total exactly 100%");
  }

  for (const layer of layers) {
    if (!isValidHexColor(layer.color)) {
      errors.push(`Invalid layer color: ${layer.color}`);
    }
    if (layer.percent < 1 || layer.percent > 100) {
      errors.push("Layer percentage must be between 1 and 100");
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Check if string is valid hex color
 */
function isValidHexColor(color: string): boolean {
  return /^#([A-Fa-f0-9]{6})$/.test(color);
}