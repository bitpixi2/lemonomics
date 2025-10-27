// Ingredient selection screen with weather-specific background video
import React, { useState } from 'react';
import { VideoPlayer } from '../components/VideoPlayer.js';
import { VideoPreloader } from '../utils/videoPreloader.js';
import { VIDEO_ASSETS } from '../../shared/types/video.js';
import { GameState } from '../../shared/types/game.js';
import { LemonadeGameEngine } from '../../shared/engine/GameEngine.js';

interface IngredientScreenProps {
  gameState: GameState;
  preloader: VideoPreloader;
  onVideoError: (error: Error) => void;
  onPurchaseComplete: (purchase: { lemons: number; sugar: number; cups: number }) => void;
}

export const IngredientScreen: React.FC<IngredientScreenProps> = ({
  gameState,
  preloader,
  onVideoError,
  onPurchaseComplete
}) => {
  const [purchase, setPurchase] = useState({ lemons: 0, sugar: 0, cups: 0 });
  const [error, setError] = useState<string>('');

  const costs = LemonadeGameEngine.getIngredientCosts();
  const totalCost = (purchase.lemons * costs.lemons) + 
                   (purchase.sugar * costs.sugar) + 
                   (purchase.cups * costs.cups);

  const handleQuantityChange = (ingredient: 'lemons' | 'sugar' | 'cups', value: number) => {
    setPurchase(prev => ({ ...prev, [ingredient]: Math.max(0, value) }));
    setError('');
  };

  const handleStartSelling = () => {
    if (totalCost > gameState.cash) {
      setError(`Not enough cash! Need $${totalCost.toFixed(2)}, have $${gameState.cash.toFixed(2)}`);
      return;
    }

    const totalIngredients = gameState.inventory.lemons + purchase.lemons;
    const totalSugar = gameState.inventory.sugar + purchase.sugar;
    const totalCups = gameState.inventory.cups + purchase.cups;
    
    const maxCups = Math.min(totalIngredients, totalSugar, totalCups);
    
    if (maxCups === 0) {
      setError('You need at least 1 lemon, 1 sugar, and 1 cup to make lemonade!');
      return;
    }

    onPurchaseComplete(purchase);
  };

  return (
    <div className="ingredient-screen">
      <VideoPlayer
        videoAsset={VIDEO_ASSETS.ingredients[gameState.weather]}
        preloader={preloader}
        onVideoError={onVideoError}
        className="ingredients-video"
        autoplay={true}
        controls={false}
        muted={false}
        loop={true}
        fadeIn={true}
      />
      
      <div className="ingredient-overlay">
        <div className="ingredient-content">
          <h2>Day {gameState.day} - Plan Your Ingredients</h2>
          
          <div className="game-info">
            <p><strong>Cash:</strong> ${gameState.cash.toFixed(2)}</p>
            <p><strong>Weather:</strong> {gameState.weather}</p>
            <p><strong>Current Inventory:</strong></p>
            <ul>
              <li>Lemons: {gameState.inventory.lemons}</li>
              <li>Sugar: {gameState.inventory.sugar}</li>
              <li>Cups: {gameState.inventory.cups}</li>
            </ul>
          </div>

          <div className="ingredient-selection">
            <h3>Purchase Ingredients</h3>
            
            <div className="ingredient-item">
              <label>Lemons (${costs.lemons.toFixed(2)} each):</label>
              <input
                type="number"
                min="0"
                value={purchase.lemons}
                onChange={(e) => handleQuantityChange('lemons', parseInt(e.target.value) || 0)}
              />
            </div>

            <div className="ingredient-item">
              <label>Sugar (${costs.sugar.toFixed(2)} each):</label>
              <input
                type="number"
                min="0"
                value={purchase.sugar}
                onChange={(e) => handleQuantityChange('sugar', parseInt(e.target.value) || 0)}
              />
            </div>

            <div className="ingredient-item">
              <label>Cups (${costs.cups.toFixed(2)} each):</label>
              <input
                type="number"
                min="0"
                value={purchase.cups}
                onChange={(e) => handleQuantityChange('cups', parseInt(e.target.value) || 0)}
              />
            </div>

            <div className="cost-summary">
              <p><strong>Total Cost: ${totalCost.toFixed(2)}</strong></p>
              <p>Remaining Cash: ${(gameState.cash - totalCost).toFixed(2)}</p>
            </div>

            {error && <div className="error-message">{error}</div>}

            <button 
              onClick={handleStartSelling}
              className="start-selling-button"
              disabled={totalCost > gameState.cash}
            >
              Start Selling
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
