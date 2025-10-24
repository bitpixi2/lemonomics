#!/usr/bin/env node
/**
 * Validate Drink Hook
 * 
 * Real-time validation for drink creation based on drink.yaml specification.
 * Validates blend mode color requirements, layered mode constraints,
 * flavor/topping limits, and name validation.
 */

import { readFileSync } from 'fs';
import { parse } from 'yaml';

interface DrinkSpec {
  fields: Array<{
    id: string;
    type: string;
    values?: string[];
    max?: number;
    pattern?: string;
    required_if?: string;
    optional?: boolean;
  }>;
  validation: {
    layered: {
      maxLayers: number;
      totalPercent: number;
    };
    bannedWords: string[];
    name: {
      minLength: number;
      maxLength: number;
    };
  };
}

interface Drink {
  glass: string;
  backdrop: string;
  base: string;
  flavors: string[];
  toppings: string[];
  mixMode: 'blend' | 'layered';
  color?: string;
  layers?: Array<{ color: string; percent: number }>;
  name: string;
  font: string;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

class DrinkValidator {
  private spec: DrinkSpec;

  constructor() {
    // Load drink specification
    const specContent = readFileSync('.kiro/specs/drink.yaml', 'utf8');
    this.spec = parse(specContent);
  }

  /**
   * Validate a complete drink object
   */
  validateDrink(drink: Drink): ValidationResult {
    const errors: string[] = [];

    // Validate blend mode requirements
    if (drink.mixMode === 'blend') {
      const colorValidation = this.validateBlendMode(drink);
      if (!colorValidation.valid) {
        errors.push(...colorValidation.errors);
      }
    }

    // Validate layered mode requirements
    if (drink.mixMode === 'layered') {
      const layerValidation = this.validateLayeredMode(drink);
      if (!layerValidation.valid) {
        errors.push(...layerValidation.errors);
      }
    }

    // Validate flavors limit
    if (drink.flavors.length > 3) {
      errors.push('Maximum 3 flavors allowed');
    }

    // Validate toppings limit
    if (drink.toppings.length > 3) {
      errors.push('Maximum 3 toppings allowed');
    }

    // Validate drink name
    const nameValidation = this.validateDrinkName(drink.name);
    if (!nameValidation.valid) {
      errors.push(...nameValidation.errors);
    }

    // Validate enum values
    const enumValidation = this.validateEnumFields(drink);
    if (!enumValidation.valid) {
      errors.push(...enumValidation.errors);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate blend mode requires valid hex color
   */
  validateBlendMode(drink: Drink): ValidationResult {
    const errors: string[] = [];

    if (drink.mixMode === 'blend') {
      if (!drink.color) {
        errors.push('Blend mode requires a color');
      } else if (!this.isValidHexColor(drink.color)) {
        errors.push('Color must be a valid hex color (e.g., #FF5733)');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate layered mode constraints
   */
  validateLayeredMode(drink: Drink): ValidationResult {
    const errors: string[] = [];

    if (drink.mixMode === 'layered') {
      if (!drink.layers || drink.layers.length === 0) {
        errors.push('Layered mode requires at least one layer');
        return { valid: false, errors };
      }

      // Check layer count
      if (drink.layers.length > this.spec.validation.layered.maxLayers) {
        errors.push(`Maximum ${this.spec.validation.layered.maxLayers} layers allowed`);
      }

      // Check total percentage
      const totalPercent = drink.layers.reduce((sum, layer) => sum + layer.percent, 0);
      if (Math.abs(totalPercent - this.spec.validation.layered.totalPercent) > 0.01) {
        errors.push(`Layer percentages must total exactly ${this.spec.validation.layered.totalPercent}%`);
      }

      // Validate each layer color
      for (const layer of drink.layers) {
        if (!this.isValidHexColor(layer.color)) {
          errors.push(`Layer color "${layer.color}" must be a valid hex color`);
        }
        if (layer.percent < 1 || layer.percent > 100) {
          errors.push(`Layer percentage must be between 1 and 100`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate drink name constraints
   */
  validateDrinkName(name: string): ValidationResult {
    const errors: string[] = [];

    if (!name || name.trim().length === 0) {
      errors.push('Drink name is required');
      return { valid: false, errors };
    }

    const trimmedName = name.trim();

    // Check length
    if (trimmedName.length < this.spec.validation.name.minLength) {
      errors.push(`Drink name must be at least ${this.spec.validation.name.minLength} character`);
    }

    if (trimmedName.length > this.spec.validation.name.maxLength) {
      errors.push(`Drink name must be no more than ${this.spec.validation.name.maxLength} characters`);
    }

    // Check banned words
    const lowerName = trimmedName.toLowerCase();
    for (const bannedWord of this.spec.validation.bannedWords) {
      if (lowerName.includes(bannedWord.toLowerCase())) {
        errors.push(`Drink name cannot contain "${bannedWord}"`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate enum field values
   */
  private validateEnumFields(drink: Drink): ValidationResult {
    const errors: string[] = [];

    // Find enum fields in spec
    const enumFields = this.spec.fields.filter(field => field.type === 'enum');

    for (const field of enumFields) {
      const value = (drink as any)[field.id];
      if (value && field.values && !field.values.includes(value)) {
        errors.push(`Invalid ${field.id}: "${value}". Must be one of: ${field.values.join(', ')}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Check if a string is a valid hex color
   */
  private isValidHexColor(color: string): boolean {
    const hexPattern = /^#([A-Fa-f0-9]{6})$/;
    return hexPattern.test(color);
  }
}

// Export for use in other modules
export { DrinkValidator, ValidationResult, Drink };

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const validator = new DrinkValidator();
  
  // Example validation
  const testDrink: Drink = {
    glass: 'tall',
    backdrop: 'counter',
    base: 'coffee',
    flavors: ['vanilla', 'caramel'],
    toppings: ['whipped_cream'],
    mixMode: 'blend',
    color: '#8B4513',
    name: 'Cozy Caramel Latte',
    font: 'script'
  };

  const result = validator.validateDrink(testDrink);
  console.log('Validation Result:', result);
  
  if (!result.valid) {
    console.error('Validation Errors:');
    result.errors.forEach(error => console.error(`  - ${error}`));
    process.exit(1);
  } else {
    console.log('✅ Drink validation passed!');
  }
}
