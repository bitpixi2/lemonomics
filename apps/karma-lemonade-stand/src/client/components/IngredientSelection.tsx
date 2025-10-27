import React, { useState } from 'react';
import { GameState } from '../../shared/types/game.js';

interface IngredientSelectionProps {
  gameState: GameState;
  onPurchase: (ingredients: { lemons: number; sugar: number; cups: number }) => void;
  onBack: () => void;
}

interface IngredientPrices {
  lemons: number;
  sugar: number;
  cups: number;
}

const INGREDIENT_PRICES: IngredientPrices = {
  lemons: 0.50,  // $0.50 per lemon
  sugar: 0.25,   // $0.25 per cup of sugar
  cups: 0.10,    // $0.10 per cup
};

export const IngredientSelection: React.FC<IngredientSelectionProps> = ({
  gameState,
  onPurchase,
  onBack,
}) => {
  const [quantities, setQuantities] = useState({
    lemons: 0,
    sugar: 0,
    cups: 0,
  });

  const totalCost = 
    quantities.lemons * INGREDIENT_PRICES.lemons +
    quantities.sugar * INGREDIENT_PRICES.sugar +
    quantities.cups * INGREDIENT_PRICES.cups;

  const canAfford = totalCost <= gameState.cash;
  const hasIngredients = quantities.lemons > 0 || quantities.sugar > 0 || quantities.cups > 0;

  const updateQuantity = (ingredient: keyof typeof quantities, change: number) => {
    setQuantities(prev => ({
      ...prev,
      [ingredient]: Math.max(0, prev[ingredient] + change)
    }));
  };

  const handlePurchase = () => {
    if (canAfford && hasIngredients) {
      onPurchase(quantities);
    }
  };

  return (
    <div className="ingredient-selection">
      <h3>Buy Ingredients</h3>
      <p className="weather-info">Today's Weather: {gameState.weather}</p>
      
      <div className="ingredient-list">
        {/* Lemons */}
        <div className="ingredient-item">
          <div className="ingredient-info">
            <span className="ingredient-name">🍋 Lemons</span>
            <span className="ingredient-price">${INGREDIENT_PRICES.lemons.toFixed(2)} each</span>
          </div>
          <div className="quantity-selector">
            <button 
              className="quantity-btn"
              onClick={() => updateQuantity('lemons', -1)}
              disabled={quantities.lemons === 0}
            >
              −
            </button>
            <input 
              type="number" 
              value={quantities.lemons}
              onChange={(e) => setQuantities(prev => ({ 
                ...prev, 
                lemons: Math.max(0, parseInt(e.target.value) || 0) 
              }))}
              className="quantity-input"
              min="0"
            />
            <button 
              className="quantity-btn"
              onClick={() => updateQuantity('lemons', 1)}
            >
              +
            </button>
          </div>
          <div className="ingredient-cost">
            ${(quantities.lemons * INGREDIENT_PRICES.lemons).toFixed(2)}
          </div>
        </div>

        {/* Sugar */}
        <div className="ingredient-item">
          <div className="ingredient-info">
            <span className="ingredient-name">🍯 Sugar</span>
            <span className="ingredient-price">${INGREDIENT_PRICES.sugar.toFixed(2)} per cup</span>
          </div>
          <div className="quantity-selector">
            <button 
              className="quantity-btn"
              onClick={() => updateQuantity('sugar', -1)}
              disabled={quantities.sugar === 0}
            >
              −
            </button>
            <input 
              type="number" 
              value={quantities.sugar}
              onChange={(e) => setQuantities(prev => ({ 
                ...prev, 
                sugar: Math.max(0, parseInt(e.target.value) || 0) 
              }))}
              className="quantity-input"
              min="0"
            />
            <button 
              className="quantity-btn"
              onClick={() => updateQuantity('sugar', 1)}
            >
              +
            </button>
          </div>
          <div className="ingredient-cost">
            ${(quantities.sugar * INGREDIENT_PRICES.sugar).toFixed(2)}
          </div>
        </div>

        {/* Cups */}
        <div className="ingredient-item">
          <div className="ingredient-info">
            <span className="ingredient-name">🥤 Cups</span>
            <span className="ingredient-price">${INGREDIENT_PRICES.cups.toFixed(2)} each</span>
          </div>
          <div className="quantity-selector">
            <button 
              className="quantity-btn"
              onClick={() => updateQuantity('cups', -1)}
              disabled={quantities.cups === 0}
            >
              −
            </button>
            <input 
              type="number" 
              value={quantities.cups}
              onChange={(e) => setQuantities(prev => ({ 
                ...prev, 
                cups: Math.max(0, parseInt(e.target.value) || 0) 
              }))}
              className="quantity-input"
              min="0"
            />
            <button 
              className="quantity-btn"
              onClick={() => updateQuantity('cups', 1)}
            >
              +
            </button>
          </div>
          <div className="ingredient-cost">
            ${(quantities.cups * INGREDIENT_PRICES.cups).toFixed(2)}
          </div>
        </div>
      </div>

      <div className="current-inventory">
        <h4>Current Inventory:</h4>
        <p>🍋 Lemons: {gameState.inventory.lemons}</p>
        <p>🍯 Sugar: {gameState.inventory.sugar} cups</p>
        <p>🥤 Cups: {gameState.inventory.cups}</p>
      </div>

      <div className="cost-summary">
        <div className="cost-row">
          <span>Total Cost:</span>
          <span className={canAfford ? 'affordable' : 'too-expensive'}>
            ${totalCost.toFixed(2)}
          </span>
        </div>
        <div className="cost-row">
          <span>Your Cash:</span>
          <span>${gameState.cash.toFixed(2)}</span>
        </div>
        <div className="cost-row remaining-cash">
          <span>Remaining:</span>
          <span>${(gameState.cash - totalCost).toFixed(2)}</span>
        </div>
      </div>

      <div className="action-buttons">
        <button 
          className="purchase-button"
          onClick={handlePurchase}
          disabled={!canAfford || !hasIngredients}
        >
          {!hasIngredients ? 'Select Ingredients' : 
           !canAfford ? 'Not Enough Cash' : 
           'Buy Ingredients & Start Selling'}
        </button>
        <button className="back-button" onClick={onBack}>
          Back to Intro
        </button>
      </div>
    </div>
  );
};
