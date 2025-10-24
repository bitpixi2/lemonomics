// Generated drink formatting logic
// DO NOT EDIT - This file is auto-generated

import type { Drink } from "@bitpixis-bar/types";

/**
 * Format drink details into a readable summary for Reddit posts
 * @param drink The drink to format
 * @returns Formatted string description
 */
export function formatDrinkSummary(drink: Drink): string {
  const parts: string[] = [];

  // Title
  parts.push(`🍹 **${drink.name}**`);
  parts.push("");

  // Basic info
  parts.push(`**Glass:** ${formatGlassType(drink.glass)}`);
  parts.push(`**Base:** ${formatBase(drink.base)}`);
  parts.push(`**Style:** ${formatMixMode(drink.mixMode)}`);
  parts.push("");

  // Ingredients
  if (drink.flavors.length > 0) {
    parts.push(`**Flavors:** ${drink.flavors.join(", ")}`);
  }
  if (drink.toppings.length > 0) {
    parts.push(`**Toppings:** ${drink.toppings.join(", ")}`);
  }

  // Mix details
  if (drink.mixMode === "blend" && drink.color) {
    parts.push(`**Color:** ${drink.color}`);
  } else if (drink.mixMode === "layered" && drink.layers) {
    parts.push("**Layers:**");
    drink.layers.forEach((layer, i) => {
      parts.push(`  ${i + 1}. ${layer.color} (${layer.percent}%)`);
    });
  }

  parts.push("");
  parts.push(`**Backdrop:** ${formatBackdrop(drink.backdrop)}`);
  parts.push(`**Font:** ${formatFont(drink.font)}`);

  parts.push("---");
  parts.push("*Created with Bitpixi Bar* 🎮");

  return parts.join("\n");
}

function formatGlassType(glass: string): string {
  const formats: Record<string, string> = {
    tall: "Tall Glass",
    short: "Short Glass",
    mug: "Cozy Mug",
    potion: "Potion Bottle",
    martini: "Martini Glass"
  };
  return formats[glass] || glass;
}

function formatBase(base: string): string {
  const formats: Record<string, string> = {
    coffee: "☕ Coffee",
    tea: "🍵 Tea",
    milk: "🥛 Milk",
    juice: "🧃 Juice",
    soda: "🥤 Soda"
  };
  return formats[base] || base;
}

function formatMixMode(mixMode: string): string {
  return mixMode === "blend" ? "🌀 Blended" : "📚 Layered";
}

function formatBackdrop(backdrop: string): string {
  const formats: Record<string, string> = {
    counter: "🏪 Cozy Counter",
    neon: "🌃 Neon Lights",
    pumpkin_night: "🎃 Pumpkin Night",
    snow_window: "❄️ Snowy Window"
  };
  return formats[backdrop] || backdrop;
}

function formatFont(font: string): string {
  const formats: Record<string, string> = {
    script: "✍️ Script",
    serif: "📖 Serif",
    "sans-serif": "🔤 Sans-serif",
    decorative: "✨ Decorative",
    handwritten: "✏️ Handwritten"
  };
  return formats[font] || font;
}