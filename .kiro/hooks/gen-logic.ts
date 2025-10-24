#!/usr/bin/env node
/**
 * Generate Logic Hook
 * 
 * Generates pure business logic functions from specifications.
 * Creates deterministic functions with optional seeding for testing.
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

class LogicGenerator {
  private genDir = 'packages/logic/src/gen';

  constructor() {
    // Ensure gen directory exists
    mkdirSync(this.genDir, { recursive: true });
  }

  /**
   * Generate all business logic functions
   */
  async generateAll(): Promise<void> {
    console.log('🔄 Generating business logic functions...');

    await this.generateColorMixing();
    await this.generateDrinkFormatting();
    await this.generateValidationLogic();
    await this.generateLayerHelpers();
    await this.updateIndexFile();

    console.log('✅ Logic generation completed!');
  }

  /**
   * Generate color mixing functions
   */
  private async generateColorMixing(): Promise<void> {
    const output: string[] = [];

    output.push('// Generated color mixing logic');
    output.push('// DO NOT EDIT - This file is auto-generated');
    output.push('');
    output.push('/**');
    output.push(' * Mix multiple colors using linear RGB averaging');
    output.push(' * @param colors Array of hex colors to mix');
    output.push(' * @param weights Optional weights for each color (defaults to equal)');
    output.push(' * @param seed Optional seed for deterministic randomization');
    output.push(' * @returns Mixed color as hex string');
    output.push(' */');
    output.push('export function mixColor(');
    output.push('  colors: string[],');
    output.push('  weights?: number[],');
    output.push('  seed?: number');
    output.push('): string {');
    output.push('  if (colors.length === 0) {');
    output.push('    throw new Error("At least one color is required");');
    output.push('  }');
    output.push('');
    output.push('  if (colors.length === 1) {');
    output.push('    return colors[0];');
    output.push('  }');
    output.push('');
    output.push('  // Use equal weights if not provided');
    output.push('  const actualWeights = weights || colors.map(() => 1);');
    output.push('');
    output.push('  if (actualWeights.length !== colors.length) {');
    output.push('    throw new Error("Weights array must match colors array length");');
    output.push('  }');
    output.push('');
    output.push('  // Normalize weights');
    output.push('  const totalWeight = actualWeights.reduce((sum, w) => sum + w, 0);');
    output.push('  const normalizedWeights = actualWeights.map(w => w / totalWeight);');
    output.push('');
    output.push('  // Convert hex colors to RGB');
    output.push('  const rgbColors = colors.map(hexToRgb);');
    output.push('');
    output.push('  // Mix colors using weighted average');
    output.push('  let r = 0, g = 0, b = 0;');
    output.push('  for (let i = 0; i < rgbColors.length; i++) {');
    output.push('    const weight = normalizedWeights[i];');
    output.push('    r += rgbColors[i].r * weight;');
    output.push('    g += rgbColors[i].g * weight;');
    output.push('    b += rgbColors[i].b * weight;');
    output.push('  }');
    output.push('');
    output.push('  // Apply deterministic variation if seed provided');
    output.push('  if (seed !== undefined) {');
    output.push('    const rng = createSeededRandom(seed);');
    output.push('    const variation = 0.05; // 5% variation');
    output.push('    r = Math.max(0, Math.min(255, r + (rng() - 0.5) * 255 * variation));');
    output.push('    g = Math.max(0, Math.min(255, g + (rng() - 0.5) * 255 * variation));');
    output.push('    b = Math.max(0, Math.min(255, b + (rng() - 0.5) * 255 * variation));');
    output.push('  }');
    output.push('');
    output.push('  // Convert back to hex');
    output.push('  return rgbToHex(Math.round(r), Math.round(g), Math.round(b));');
    output.push('}');
    output.push('');

    // Helper functions
    output.push('/**');
    output.push(' * Convert hex color to RGB object');
    output.push(' */');
    output.push('function hexToRgb(hex: string): { r: number; g: number; b: number } {');
    output.push('  const result = /^#?([a-f\\d]{2})([a-f\\d]{2})([a-f\\d]{2})$/i.exec(hex);');
    output.push('  if (!result) {');
    output.push('    throw new Error(`Invalid hex color: ${hex}`);');
    output.push('  }');
    output.push('  return {');
    output.push('    r: parseInt(result[1], 16),');
    output.push('    g: parseInt(result[2], 16),');
    output.push('    b: parseInt(result[3], 16)');
    output.push('  };');
    output.push('}');
    output.push('');

    output.push('/**');
    output.push(' * Convert RGB values to hex color');
    output.push(' */');
    output.push('function rgbToHex(r: number, g: number, b: number): string {');
    output.push('  const toHex = (n: number) => {');
    output.push('    const hex = Math.max(0, Math.min(255, Math.round(n))).toString(16);');
    output.push('    return hex.length === 1 ? "0" + hex : hex;');
    output.push('  };');
    output.push('  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;');
    output.push('}');
    output.push('');

    output.push('/**');
    output.push(' * Create a seeded random number generator');
    output.push(' */');
    output.push('function createSeededRandom(seed: number): () => number {');
    output.push('  let state = seed;');
    output.push('  return () => {');
    output.push('    // Linear congruential generator');
    output.push('    state = (state * 1664525 + 1013904223) % 4294967296;');
    output.push('    return state / 4294967296;');
    output.push('  };');
    output.push('}');

    const filePath = join(this.genDir, 'color-mixing.ts');
    writeFileSync(filePath, output.join('\n'));
    console.log(`📝 Generated color mixing logic: ${filePath}`);
  }

  /**
   * Generate drink formatting functions
   */
  private async generateDrinkFormatting(): Promise<void> {
    const output: string[] = [];

    output.push('// Generated drink formatting logic');
    output.push('// DO NOT EDIT - This file is auto-generated');
    output.push('');
    output.push('import type { Drink } from "@bitpixis-bar/types";');
    output.push('');
    output.push('/**');
    output.push(' * Format drink details into a readable summary for Reddit posts');
    output.push(' * @param drink The drink to format');
    output.push(' * @returns Formatted string description');
    output.push(' */');
    output.push('export function formatDrinkSummary(drink: Drink): string {');
    output.push('  const parts: string[] = [];');
    output.push('');
    output.push('  // Title');
    output.push('  parts.push(`🍹 **${drink.name}**`);');
    output.push('  parts.push("");');
    output.push('');
    output.push('  // Basic info');
    output.push('  parts.push(`**Glass:** ${formatGlassType(drink.glass)}`);');
    output.push('  parts.push(`**Base:** ${formatBase(drink.base)}`);');
    output.push('  parts.push(`**Style:** ${formatMixMode(drink.mixMode)}`);');
    output.push('  parts.push("");');
    output.push('');
    output.push('  // Ingredients');
    output.push('  if (drink.flavors.length > 0) {');
    output.push('    parts.push(`**Flavors:** ${drink.flavors.join(", ")}`);');
    output.push('  }');
    output.push('  if (drink.toppings.length > 0) {');
    output.push('    parts.push(`**Toppings:** ${drink.toppings.join(", ")}`);');
    output.push('  }');
    output.push('');
    output.push('  // Mix details');
    output.push('  if (drink.mixMode === "blend" && drink.color) {');
    output.push('    parts.push(`**Color:** ${drink.color}`);');
    output.push('  } else if (drink.mixMode === "layered" && drink.layers) {');
    output.push('    parts.push("**Layers:**");');
    output.push('    drink.layers.forEach((layer, i) => {');
    output.push('      parts.push(`  ${i + 1}. ${layer.color} (${layer.percent}%)`);');
    output.push('    });');
    output.push('  }');
    output.push('');
    output.push('  parts.push("");');
    output.push('  parts.push(`**Backdrop:** ${formatBackdrop(drink.backdrop)}`);');
    output.push('  parts.push(`**Font:** ${formatFont(drink.font)}`);');
    output.push('');
    output.push('  parts.push("---");');
    output.push('  parts.push("*Created with Bitpixi Bar* 🎮");');
    output.push('');
    output.push('  return parts.join("\\n");');
    output.push('}');
    output.push('');

    // Helper formatting functions
    output.push('function formatGlassType(glass: string): string {');
    output.push('  const formats: Record<string, string> = {');
    output.push('    tall: "Tall Glass",');
    output.push('    short: "Short Glass",');
    output.push('    mug: "Cozy Mug",');
    output.push('    potion: "Potion Bottle",');
    output.push('    martini: "Martini Glass"');
    output.push('  };');
    output.push('  return formats[glass] || glass;');
    output.push('}');
    output.push('');

    output.push('function formatBase(base: string): string {');
    output.push('  const formats: Record<string, string> = {');
    output.push('    coffee: "☕ Coffee",');
    output.push('    tea: "🍵 Tea",');
    output.push('    milk: "🥛 Milk",');
    output.push('    juice: "🧃 Juice",');
    output.push('    soda: "🥤 Soda"');
    output.push('  };');
    output.push('  return formats[base] || base;');
    output.push('}');
    output.push('');

    output.push('function formatMixMode(mixMode: string): string {');
    output.push('  return mixMode === "blend" ? "🌀 Blended" : "📚 Layered";');
    output.push('}');
    output.push('');

    output.push('function formatBackdrop(backdrop: string): string {');
    output.push('  const formats: Record<string, string> = {');
    output.push('    counter: "🏪 Cozy Counter",');
    output.push('    neon: "🌃 Neon Lights",');
    output.push('    pumpkin_night: "🎃 Pumpkin Night",');
    output.push('    snow_window: "❄️ Snowy Window"');
    output.push('  };');
    output.push('  return formats[backdrop] || backdrop;');
    output.push('}');
    output.push('');

    output.push('function formatFont(font: string): string {');
    output.push('  const formats: Record<string, string> = {');
    output.push('    script: "✍️ Script",');
    output.push('    serif: "📖 Serif",');
    output.push('    "sans-serif": "🔤 Sans-serif",');
    output.push('    decorative: "✨ Decorative",');
    output.push('    handwritten: "✏️ Handwritten"');
    output.push('  };');
    output.push('  return formats[font] || font;');
    output.push('}');

    const filePath = join(this.genDir, 'drink-formatting.ts');
    writeFileSync(filePath, output.join('\n'));
    console.log(`📝 Generated drink formatting logic: ${filePath}`);
  }

  /**
   * Generate validation logic functions
   */
  private async generateValidationLogic(): Promise<void> {
    const output: string[] = [];

    output.push('// Generated validation logic');
    output.push('// DO NOT EDIT - This file is auto-generated');
    output.push('');
    output.push('import type { Drink, ValidationResult } from "@bitpixis-bar/types";');
    output.push('');
    output.push('/**');
    output.push(' * Validate a complete drink using generated schema rules');
    output.push(' * @param drink The drink to validate');
    output.push(' * @returns Validation result with errors');
    output.push(' */');
    output.push('export function validateDrink(drink: Drink): ValidationResult {');
    output.push('  const errors: string[] = [];');
    output.push('');
    output.push('  // Validate required fields');
    output.push('  if (!drink.name?.trim()) {');
    output.push('    errors.push("Drink name is required");');
    output.push('  }');
    output.push('');
    output.push('  // Validate mix mode specific requirements');
    output.push('  if (drink.mixMode === "blend") {');
    output.push('    if (!drink.color) {');
    output.push('      errors.push("Blend mode requires a color");');
    output.push('    } else if (!isValidHexColor(drink.color)) {');
    output.push('      errors.push("Color must be a valid hex color");');
    output.push('    }');
    output.push('  }');
    output.push('');
    output.push('  if (drink.mixMode === "layered") {');
    output.push('    if (!drink.layers || drink.layers.length === 0) {');
    output.push('      errors.push("Layered mode requires at least one layer");');
    output.push('    } else {');
    output.push('      const layerValidation = validateLayers(drink.layers);');
    output.push('      errors.push(...layerValidation.errors);');
    output.push('    }');
    output.push('  }');
    output.push('');
    output.push('  // Validate array limits');
    output.push('  if (drink.flavors.length > 3) {');
    output.push('    errors.push("Maximum 3 flavors allowed");');
    output.push('  }');
    output.push('  if (drink.toppings.length > 3) {');
    output.push('    errors.push("Maximum 3 toppings allowed");');
    output.push('  }');
    output.push('');
    output.push('  // Validate name constraints');
    output.push('  const nameValidation = validateDrinkName(drink.name);');
    output.push('  errors.push(...nameValidation.errors);');
    output.push('');
    output.push('  return {');
    output.push('    valid: errors.length === 0,');
    output.push('    errors');
    output.push('  };');
    output.push('}');
    output.push('');

    output.push('/**');
    output.push(' * Validate drink name constraints');
    output.push(' */');
    output.push('export function validateDrinkName(name: string): ValidationResult {');
    output.push('  const errors: string[] = [];');
    output.push('  const bannedWords = ["alcohol", "beer", "wine", "vodka", "whiskey", "rum"];');
    output.push('');
    output.push('  if (!name || name.trim().length === 0) {');
    output.push('    errors.push("Drink name is required");');
    output.push('    return { valid: false, errors };');
    output.push('  }');
    output.push('');
    output.push('  const trimmedName = name.trim();');
    output.push('');
    output.push('  if (trimmedName.length > 24) {');
    output.push('    errors.push("Drink name must be 24 characters or less");');
    output.push('  }');
    output.push('');
    output.push('  const lowerName = trimmedName.toLowerCase();');
    output.push('  for (const banned of bannedWords) {');
    output.push('    if (lowerName.includes(banned)) {');
    output.push('      errors.push(`Drink name cannot contain "${banned}"`);');
    output.push('    }');
    output.push('  }');
    output.push('');
    output.push('  return { valid: errors.length === 0, errors };');
    output.push('}');
    output.push('');

    output.push('/**');
    output.push(' * Validate layer configuration');
    output.push(' */');
    output.push('function validateLayers(layers: Array<{ color: string; percent: number }>): ValidationResult {');
    output.push('  const errors: string[] = [];');
    output.push('');
    output.push('  if (layers.length > 4) {');
    output.push('    errors.push("Maximum 4 layers allowed");');
    output.push('  }');
    output.push('');
    output.push('  const totalPercent = layers.reduce((sum, layer) => sum + layer.percent, 0);');
    output.push('  if (Math.abs(totalPercent - 100) > 0.01) {');
    output.push('    errors.push("Layer percentages must total exactly 100%");');
    output.push('  }');
    output.push('');
    output.push('  for (const layer of layers) {');
    output.push('    if (!isValidHexColor(layer.color)) {');
    output.push('      errors.push(`Invalid layer color: ${layer.color}`);');
    output.push('    }');
    output.push('    if (layer.percent < 1 || layer.percent > 100) {');
    output.push('      errors.push("Layer percentage must be between 1 and 100");');
    output.push('    }');
    output.push('  }');
    output.push('');
    output.push('  return { valid: errors.length === 0, errors };');
    output.push('}');
    output.push('');

    output.push('/**');
    output.push(' * Check if string is valid hex color');
    output.push(' */');
    output.push('function isValidHexColor(color: string): boolean {');
    output.push('  return /^#([A-Fa-f0-9]{6})$/.test(color);');
    output.push('}');

    const filePath = join(this.genDir, 'validators.ts');
    writeFileSync(filePath, output.join('\n'));
    console.log(`📝 Generated validation logic: ${filePath}`);
  }

  /**
   * Generate layer helper functions
   */
  private async generateLayerHelpers(): Promise<void> {
    const output: string[] = [];

    output.push('// Generated layer helper functions');
    output.push('// DO NOT EDIT - This file is auto-generated');
    output.push('');
    output.push('/**');
    output.push(' * Calculate and normalize layer percentages to total 100%');
    output.push(' * @param layers Array of layers with percentages');
    output.push(' * @returns Normalized layers totaling 100%');
    output.push(' */');
    output.push('export function normalizeLayerPercentages(');
    output.push('  layers: Array<{ color: string; percent: number }>');
    output.push('): Array<{ color: string; percent: number }> {');
    output.push('  if (layers.length === 0) return [];');
    output.push('');
    output.push('  const total = layers.reduce((sum, layer) => sum + layer.percent, 0);');
    output.push('  if (total === 0) {');
    output.push('    // Equal distribution if all percentages are 0');
    output.push('    const equalPercent = 100 / layers.length;');
    output.push('    return layers.map(layer => ({ ...layer, percent: equalPercent }));');
    output.push('  }');
    output.push('');
    output.push('  // Normalize to 100%');
    output.push('  return layers.map(layer => ({');
    output.push('    ...layer,');
    output.push('    percent: (layer.percent / total) * 100');
    output.push('  }));');
    output.push('}');
    output.push('');

    output.push('/**');
    output.push(' * Generate a unique drink ID based on recipe and timestamp');
    output.push(' * @param drink The drink recipe');
    output.push(' * @param timestamp Creation timestamp');
    output.push(' * @param seed Optional seed for deterministic IDs');
    output.push(' * @returns Unique drink ID');
    output.push(' */');
    output.push('export function generateDrinkId(');
    output.push('  drink: { name: string; glass: string; base: string; mixMode: string },');
    output.push('  timestamp: number,');
    output.push('  seed?: number');
    output.push('): string {');
    output.push('  // Create a hash-like string from drink properties');
    output.push('  const components = [');
    output.push('    drink.name.toLowerCase().replace(/\\s+/g, "-"),');
    output.push('    drink.glass,');
    output.push('    drink.base,');
    output.push('    drink.mixMode');
    output.push('  ].join("-");');
    output.push('');
    output.push('  // Add timestamp for uniqueness');
    output.push('  const timeComponent = timestamp.toString(36);');
    output.push('');
    output.push('  // Add seed if provided for deterministic testing');
    output.push('  const seedComponent = seed ? `-${seed.toString(36)}` : "";');
    output.push('');
    output.push('  return `${components}-${timeComponent}${seedComponent}`;');
    output.push('}');

    const filePath = join(this.genDir, 'layer-helpers.ts');
    writeFileSync(filePath, output.join('\n'));
    console.log(`📝 Generated layer helpers: ${filePath}`);
  }

  /**
   * Update the logic package index file
   */
  private async updateIndexFile(): Promise<void> {
    const indexPath = 'packages/logic/src/index.ts';
    const content = `// Pure game logic functions
// Generated logic exports
export * from './gen/color-mixing.js';
export * from './gen/drink-formatting.js';
export * from './gen/validators.js';
export * from './gen/layer-helpers.js';

// Manual logic functions can be added here
`;

    writeFileSync(indexPath, content);
    console.log(`📝 Updated logic index file: ${indexPath}`);
  }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const generator = new LogicGenerator();
  generator.generateAll().catch(console.error);
}

export { LogicGenerator };
