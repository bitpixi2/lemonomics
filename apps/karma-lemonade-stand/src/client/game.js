// Game JavaScript - moved to separate file to avoid CSP issues

function startGame() {
  document.getElementById('splash').style.display = 'none';
  document.getElementById('game').style.display = 'block';

  // Load the simple game interface
  loadSimpleGame();
}

function loadSimpleGame() {
  const gameContainer = document.getElementById('game');
  gameContainer.innerHTML = `
        <div style="
            display: flex;
            flex-direction: column;
            height: 100vh;
            background: linear-gradient(to bottom, #87CEEB 0%, #98FB98 100%);
            font-family: 'Courier New', monospace;
        ">
            <!-- Header -->
            <header style="
                background: rgba(255, 255, 255, 0.9);
                padding: 1rem;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                text-align: center;
                border-bottom: 3px solid #333;
            ">
                <h1 style="margin: 0; color: #333; font-size: 1.8rem; text-shadow: 2px 2px 0px #FFD700;">
                    🍋 Karma Lemonade Stand 🍋
                </h1>
                <p style="margin: 0.5rem 0 0 0; color: #666; font-size: 1rem; font-weight: bold;">
                    Turn your Reddit karma into sweet profits!
                </p>
            </header>
            
            <!-- Main Game Area -->
            <main style="
                flex: 1;
                display: flex;
                flex-direction: column;
                padding: 1rem;
                gap: 1rem;
                overflow-y: auto;
            ">
                <!-- Lemonade Stand Display -->
                <div style="
                    background: white;
                    border: 3px solid #333;
                    border-radius: 15px;
                    padding: 1rem;
                    text-align: center;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                    position: relative;
                    overflow: hidden;
                ">
                    <!-- Sky Background -->
                    <div style="
                        position: absolute;
                        top: 0;
                        left: 0;
                        right: 0;
                        height: 60px;
                        background: linear-gradient(to bottom, #87CEEB 0%, #98FB98 100%);
                        z-index: 1;
                    "></div>
                    
                    <!-- Sun -->
                    <div style="
                        position: absolute;
                        top: 10px;
                        right: 20px;
                        width: 30px;
                        height: 30px;
                        background: #FFD700;
                        border-radius: 50%;
                        border: 2px solid #FFA500;
                        z-index: 2;
                        box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
                    "></div>
                    
                    <!-- Lemonade Stand Structure -->
                    <div style="position: relative; z-index: 3; margin-top: 40px;">
                        <!-- Stand Roof -->
                        <div style="
                            width: 0;
                            height: 0;
                            border-left: 60px solid transparent;
                            border-right: 60px solid transparent;
                            border-bottom: 30px solid #8B4513;
                            margin: 0 auto 0 auto;
                            position: relative;
                        ">
                            <!-- Roof Stripes -->
                            <div style="
                                position: absolute;
                                top: 5px;
                                left: -50px;
                                width: 100px;
                                height: 3px;
                                background: repeating-linear-gradient(
                                    90deg,
                                    #FF6B35 0px,
                                    #FF6B35 10px,
                                    #FFF 10px,
                                    #FFF 20px
                                );
                            "></div>
                        </div>
                        
                        <!-- Stand Counter -->
                        <div style="
                            width: 120px;
                            height: 60px;
                            background: #DEB887;
                            border: 3px solid #8B4513;
                            margin: 0 auto;
                            position: relative;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                        ">
                            <!-- Lemonade Sign -->
                            <div style="
                                background: #FFF;
                                border: 2px solid #333;
                                padding: 4px 8px;
                                font-size: 10px;
                                font-weight: bold;
                                color: #333;
                                transform: rotate(-5deg);
                            ">
                                LEMONADE
                            </div>
                            
                            <!-- Pitcher -->
                            <div style="
                                position: absolute;
                                right: 10px;
                                top: -15px;
                                width: 20px;
                                height: 25px;
                                background: #FFD700;
                                border: 2px solid #333;
                                border-radius: 0 0 10px 10px;
                            ">
                                <!-- Pitcher Handle -->
                                <div style="
                                    position: absolute;
                                    right: -8px;
                                    top: 5px;
                                    width: 8px;
                                    height: 12px;
                                    border: 2px solid #333;
                                    border-left: none;
                                    border-radius: 0 8px 8px 0;
                                "></div>
                            </div>
                            
                            <!-- Cups -->
                            <div style="
                                position: absolute;
                                left: 10px;
                                top: -10px;
                                display: flex;
                                gap: 2px;
                            ">
                                <div style="
                                    width: 8px;
                                    height: 12px;
                                    background: #FFF;
                                    border: 1px solid #333;
                                    border-radius: 0 0 4px 4px;
                                "></div>
                                <div style="
                                    width: 8px;
                                    height: 12px;
                                    background: #FFF;
                                    border: 1px solid #333;
                                    border-radius: 0 0 4px 4px;
                                "></div>
                            </div>
                        </div>
                        
                        <!-- Stand Legs -->
                        <div style="
                            display: flex;
                            justify-content: space-between;
                            width: 120px;
                            margin: 0 auto;
                        ">
                            <div style="
                                width: 6px;
                                height: 30px;
                                background: #8B4513;
                                border: 1px solid #654321;
                            "></div>
                            <div style="
                                width: 6px;
                                height: 30px;
                                background: #8B4513;
                                border: 1px solid #654321;
                            "></div>
                        </div>
                    </div>
                    
                    <div style="margin-top: 1rem; position: relative; z-index: 3;">
                        <h2 style="margin: 0 0 0.5rem 0; color: #333; font-size: 1.3rem;">
                            🌤️ Perfect Weather for Business!
                        </h2>
                        <div style="font-size: 1.1rem; font-weight: bold; color: #FF6B35;">
                            Sunny & Hot - Customers are thirsty! ☀️
                        </div>
                    </div>
                </div>
                
                <!-- Game Controls -->
                <div style="
                    background: white;
                    border: 3px solid #333;
                    border-radius: 15px;
                    padding: 1.5rem;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                ">
                    <h2 style="margin: 0 0 1.5rem 0; color: #333; font-size: 1.3rem; text-align: center;">
                        🎮 Set Up Your Lemonade Stand
                    </h2>
                    
                    <div style="display: grid; gap: 1.5rem;">
                        <!-- Price Control -->
                        <div style="
                            background: #f8f9fa;
                            border: 2px solid #ddd;
                            border-radius: 10px;
                            padding: 1rem;
                        ">
                            <label style="display: block; font-weight: bold; margin-bottom: 0.8rem; color: #333; font-size: 1.1rem; display: flex; align-items: center; gap: 0.5rem;">
                                <div style="
                                    width: 20px;
                                    height: 24px;
                                    background: #FFD700;
                                    border: 2px solid #333;
                                    border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
                                    position: relative;
                                ">
                                    <!-- Lemon leaf -->
                                    <div style="
                                        position: absolute;
                                        top: -5px;
                                        right: 2px;
                                        width: 8px;
                                        height: 6px;
                                        background: #32CD32;
                                        border: 1px solid #228B22;
                                        border-radius: 50% 0;
                                        transform: rotate(45deg);
                                    "></div>
                                </div>
                                Price per Cup
                            </label>
                            <input 
                                type="range" 
                                id="price-slider" 
                                min="0.25" 
                                max="3.00" 
                                step="0.25" 
                                value="1.00"
                                style="width: 100%; height: 8px; background: #ddd; border-radius: 5px;"
                            >
                            <div style="
                                display: flex;
                                justify-content: space-between;
                                margin-top: 0.5rem;
                                font-size: 0.9rem;
                                color: #666;
                            ">
                                <span>25¢</span>
                                <span style="font-weight: bold; font-size: 1.2rem; color: #333;">
                                    $<span id="price-display">1.00</span>
                                </span>
                                <span>$3.00</span>
                            </div>
                        </div>
                        
                        <!-- Advertising Control -->
                        <div style="
                            background: #f8f9fa;
                            border: 2px solid #ddd;
                            border-radius: 10px;
                            padding: 1rem;
                        ">
                            <label style="display: block; font-weight: bold; margin-bottom: 0.8rem; color: #333; font-size: 1.1rem; display: flex; align-items: center; gap: 0.5rem;">
                                <div style="
                                    width: 20px;
                                    height: 20px;
                                    background: #FF6B35;
                                    border: 2px solid #333;
                                    border-radius: 50%;
                                    position: relative;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                ">
                                    <!-- Megaphone cone -->
                                    <div style="
                                        width: 0;
                                        height: 0;
                                        border-top: 4px solid transparent;
                                        border-bottom: 4px solid transparent;
                                        border-left: 8px solid #FFF;
                                    "></div>
                                </div>
                                Advertising Budget
                            </label>
                            <input 
                                type="range" 
                                id="ad-slider" 
                                min="0" 
                                max="50" 
                                step="5" 
                                value="0"
                                style="width: 100%; height: 8px; background: #ddd; border-radius: 5px;"
                            >
                            <div style="
                                display: flex;
                                justify-content: space-between;
                                margin-top: 0.5rem;
                                font-size: 0.9rem;
                                color: #666;
                            ">
                                <span>$0</span>
                                <span style="font-weight: bold; font-size: 1.2rem; color: #333;">
                                    $<span id="ad-display">0</span>
                                </span>
                                <span>$50</span>
                            </div>
                        </div>
                    </div>
                    
                    <button 
                        id="run-business" 
                        style="
                            width: 100%;
                            background: linear-gradient(45deg, #32CD32, #228B22);
                            color: white;
                            border: 3px solid #333;
                            padding: 1.2rem;
                            font-size: 1.3rem;
                            font-weight: bold;
                            border-radius: 10px;
                            cursor: pointer;
                            margin-top: 1.5rem;
                            transition: all 0.2s;
                            font-family: 'Courier New', monospace;
                            text-transform: uppercase;
                            letter-spacing: 1px;
                        "
                    >
                        🚀 Open Your Stand for Business!
                    </button>
                </div>
                
                <!-- Results Area -->
                <div id="results-area" style="display: none;">
                    <!-- Results will be populated here -->
                </div>
            </main>
        </div>
    `;

  // Set up event listeners
  setupGameControls();
}

function setupGameControls() {
  const priceSlider = document.getElementById('price-slider');
  const priceDisplay = document.getElementById('price-display');
  const adSlider = document.getElementById('ad-slider');
  const adDisplay = document.getElementById('ad-display');
  const runButton = document.getElementById('run-business');

  if (priceSlider && priceDisplay) {
    priceSlider.addEventListener('input', () => {
      priceDisplay.textContent = parseFloat(priceSlider.value).toFixed(2);
    });
  }

  if (adSlider && adDisplay) {
    adSlider.addEventListener('input', () => {
      adDisplay.textContent = adSlider.value;
    });
  }

  if (runButton) {
    runButton.addEventListener('click', runLemonadeStand);

    // Add hover effects
    runButton.addEventListener('mouseenter', () => {
      runButton.style.transform = 'translateY(-2px)';
      runButton.style.boxShadow = '0 6px 20px rgba(50, 205, 50, 0.4)';
    });

    runButton.addEventListener('mouseleave', () => {
      runButton.style.transform = 'translateY(0)';
      runButton.style.boxShadow = 'none';
    });
  }
}

async function runLemonadeStand() {
  const priceSlider = document.getElementById('price-slider');
  const adSlider = document.getElementById('ad-slider');
  const runButton = document.getElementById('run-business');

  if (!priceSlider || !adSlider || !runButton) return;

  const price = parseFloat(priceSlider.value);
  const adSpend = parseFloat(adSlider.value);

  runButton.disabled = true;
  runButton.textContent = '🍋 Running your stand...';
  runButton.style.background = '#ccc';

  try {
    // Try to call the API, fallback to local calculation
    let result;
    try {
      const response = await fetch('/api/run-game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price, adSpend })
      });
      const data = await response.json();
      if (data.success) {
        result = data.result;
      } else {
        throw new Error('API failed');
      }
    } catch (apiError) {
      // Fallback calculation
      let baseDemand = 100;
      if (price > 2) baseDemand *= 0.7;
      if (price < 1) baseDemand *= 1.3;

      const adBoost = Math.min(adSpend / 10, 2);
      const finalDemand = Math.floor(baseDemand * (1 + adBoost) * 1.2); // Sunny weather bonus

      const revenue = finalDemand * price;
      const costs = finalDemand * 0.3 + adSpend;
      const profit = revenue - costs;

      result = {
        profit: Math.round(profit * 100) / 100,
        cupsSold: finalDemand
      };
    }

    showGameResult(result, price, adSpend);

  } catch (error) {
    console.error('Failed to run business:', error);
    showError('Failed to run your lemonade stand. Please try again.');
  } finally {
    runButton.disabled = false;
    runButton.textContent = '🚀 Open Your Stand for Business!';
    runButton.style.background = 'linear-gradient(45deg, #32CD32, #228B22)';
  }
}

function showGameResult(result, price, adSpend) {
  const resultsArea = document.getElementById('results-area');
  if (!resultsArea) return;

  const profitColor = result.profit >= 0 ? '#4CAF50' : '#F44336';
  const profitIcon = result.profit >= 0 ? '💰' : '📉';
  const profitText = result.profit >= 0 ? 'Profit!' : 'Loss';

  resultsArea.innerHTML = `
        <div style="
            background: white;
            border: 3px solid #333;
            border-radius: 15px;
            padding: 1.5rem;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            animation: slideIn 0.5s ease-out;
        ">
            <h2 style="margin: 0 0 1rem 0; color: #333; font-size: 1.4rem; text-align: center;">
                📊 Today's Business Results
            </h2>
            
            <div style="text-align: center; margin-bottom: 1.5rem;">
                <div style="font-size: 4rem; margin-bottom: 0.5rem;">${profitIcon}</div>
                <div style="font-size: 1.8rem; font-weight: bold; color: ${profitColor};">
                    $${Math.abs(result.profit).toFixed(2)} ${profitText}
                </div>
            </div>
            
            <div style="
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 1rem;
                text-align: center;
                margin-bottom: 1.5rem;
                background: #f8f9fa;
                padding: 1rem;
                border-radius: 10px;
                border: 2px solid #ddd;
            ">
                <div>
                    <div style="font-size: 2rem;">🥤</div>
                    <div style="font-weight: bold; color: #333; margin: 0.5rem 0;">Cups Sold</div>
                    <div style="color: #666; font-size: 1.2rem; font-weight: bold;">${result.cupsSold}</div>
                </div>
                <div>
                    <div style="font-size: 2rem;">💵</div>
                    <div style="font-weight: bold; color: #333; margin: 0.5rem 0;">Price per Cup</div>
                    <div style="color: #666; font-size: 1.2rem; font-weight: bold;">$${price.toFixed(2)}</div>
                </div>
                <div>
                    <div style="font-size: 2rem;">📢</div>
                    <div style="font-weight: bold; color: #333; margin: 0.5rem 0;">Ad Spend</div>
                    <div style="color: #666; font-size: 1.2rem; font-weight: bold;">$${adSpend.toFixed(2)}</div>
                </div>
            </div>
            
            <div style="
                background: linear-gradient(45deg, #FFD700, #FFA500);
                border: 2px solid #333;
                border-radius: 10px;
                padding: 1rem;
                text-align: center;
                color: #333;
                font-weight: bold;
                margin-bottom: 1rem;
            ">
                🎮 Classic Lemonade Stand Experience!<br>
                Weather: ☀️ Perfect sunny day (+20% demand)
            </div>
            
            <button 
                id="play-again-button"
                style="
                    width: 100%;
                    background: linear-gradient(45deg, #FF6B35, #F7931E);
                    color: white;
                    border: 3px solid #333;
                    padding: 1rem;
                    font-size: 1.1rem;
                    font-weight: bold;
                    border-radius: 10px;
                    cursor: pointer;
                    font-family: 'Courier New', monospace;
                    text-transform: uppercase;
                "
            >
                🔄 Play Another Day
            </button>
        </div>
    `;

  resultsArea.style.display = 'block';
  resultsArea.scrollIntoView({ behavior: 'smooth' });

  // Add event listener for play again button
  const playAgainButton = document.getElementById('play-again-button');
  if (playAgainButton) {
    playAgainButton.addEventListener('click', function () {
      document.getElementById('results-area').style.display = 'none';
    });
  }
}

function showError(message) {
  const errorDiv = document.createElement('div');
  errorDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #F44336;
        color: white;
        padding: 1rem 2rem;
        border-radius: 10px;
        border: 3px solid #333;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        z-index: 1000;
        text-align: center;
        font-family: 'Courier New', monospace;
        font-weight: bold;
    `;
  errorDiv.innerHTML = `
        <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">❌</div>
        <div>${message}</div>
    `;

  document.body.appendChild(errorDiv);

  setTimeout(() => {
    if (document.body.contains(errorDiv)) {
      document.body.removeChild(errorDiv);
    }
  }, 3000);
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function () {
  const startButton = document.getElementById('start-button');
  if (startButton) {
    startButton.addEventListener('click', startGame);
  }
});

// Make functions available globally
window.startGame = startGame;
