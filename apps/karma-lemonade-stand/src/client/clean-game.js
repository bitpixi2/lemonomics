// Clean lemonade stand game - no CSP violations
// Based on the original BASIC game logic

let gameState = {
  day: 1,
  assets: 2.00,
  weather: 'sunny'
};

function startGame() {
  console.log('Starting clean game...');

  // Hide splash, show game
  const splash = document.getElementById('splash');
  const game = document.getElementById('game');

  if (splash) splash.style.display = 'none';
  if (game) {
    game.style.display = 'block';
    createGameInterface();
  }
}

function createGameInterface() {
  const gameContainer = document.getElementById('game');

  // Clear and create main container
  gameContainer.innerHTML = '';

  const mainDiv = document.createElement('div');
  mainDiv.style.cssText = `
        font-family: 'Courier New', monospace;
        background: linear-gradient(135deg, #87CEEB 0%, #98FB98 100%);
        min-height: 100vh;
        padding: 20px;
        color: #333;
    `;

  // Title
  const title = document.createElement('h1');
  title.textContent = '🍋 LEMONADE STAND 🍋';
  title.style.cssText = `
        text-align: center;
        background: white;
        padding: 20px;
        border: 3px solid #333;
        border-radius: 15px;
        margin-bottom: 20px;
        color: #2E8B57;
        text-shadow: 2px 2px 0px #FFD700;
    `;

  // Weather report
  const weatherDiv = document.createElement('div');
  weatherDiv.style.cssText = `
        background: white;
        border: 3px solid #333;
        border-radius: 15px;
        padding: 20px;
        margin-bottom: 20px;
        text-align: center;
    `;
  weatherDiv.innerHTML = `
        <h2 style="margin: 0 0 10px 0; color: #333;">☀️ WEATHER REPORT ☀️</h2>
        <p style="font-size: 18px; color: #FF6B35; font-weight: bold;">
            Day ${gameState.day}: Perfect sunny day - customers are thirsty!
        </p>
    `;

  // Assets display
  const assetsDiv = document.createElement('div');
  assetsDiv.style.cssText = `
        background: white;
        border: 3px solid #333;
        border-radius: 15px;
        padding: 20px;
        margin-bottom: 20px;
        text-align: center;
    `;
  assetsDiv.innerHTML = `
        <h2 style="margin: 0 0 10px 0; color: #333;">💰 YOUR ASSETS 💰</h2>
        <p style="font-size: 24px; color: #4CAF50; font-weight: bold;">
            $${gameState.assets.toFixed(2)}
        </p>
    `;

  // Game controls
  const controlsDiv = document.createElement('div');
  controlsDiv.style.cssText = `
        background: white;
        border: 3px solid #333;
        border-radius: 15px;
        padding: 20px;
        margin-bottom: 20px;
    `;

  const controlsTitle = document.createElement('h2');
  controlsTitle.textContent = '🎮 DAILY DECISIONS';
  controlsTitle.style.cssText = 'margin: 0 0 20px 0; color: #333; text-align: center;';

  // Glasses input
  const glassesDiv = document.createElement('div');
  glassesDiv.style.cssText = 'margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 10px;';
  glassesDiv.innerHTML = `
        <label style="display: block; font-weight: bold; margin-bottom: 10px; color: #333;">
            🥤 How many glasses of lemonade to make? (Cost: 2¢ each)
        </label>
        <input type="number" id="glasses-input" min="0" max="1000" value="50" 
               style="width: 100%; padding: 10px; font-size: 16px; border: 2px solid #ddd; border-radius: 5px;">
    `;

  // Signs input
  const signsDiv = document.createElement('div');
  signsDiv.style.cssText = 'margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 10px;';
  signsDiv.innerHTML = `
        <label style="display: block; font-weight: bold; margin-bottom: 10px; color: #333;">
            📢 How many advertising signs to make? (Cost: 15¢ each)
        </label>
        <input type="number" id="signs-input" min="0" max="50" value="5" 
               style="width: 100%; padding: 10px; font-size: 16px; border: 2px solid #ddd; border-radius: 5px;">
    `;

  // Price input
  const priceDiv = document.createElement('div');
  priceDiv.style.cssText = 'margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 10px;';
  priceDiv.innerHTML = `
        <label style="display: block; font-weight: bold; margin-bottom: 10px; color: #333;">
            💵 What price to charge per glass? (in cents)
        </label>
        <input type="number" id="price-input" min="1" max="100" value="10" 
               style="width: 100%; padding: 10px; font-size: 16px; border: 2px solid #ddd; border-radius: 5px;">
    `;

  // Run button
  const runButton = document.createElement('button');
  runButton.textContent = '🚀 OPEN FOR BUSINESS!';
  runButton.id = 'run-button';
  runButton.style.cssText = `
        width: 100%;
        background: linear-gradient(45deg, #32CD32, #228B22);
        color: white;
        border: 3px solid #333;
        padding: 15px;
        font-size: 18px;
        font-weight: bold;
        border-radius: 10px;
        cursor: pointer;
        font-family: 'Courier New', monospace;
        text-transform: uppercase;
        margin-top: 20px;
    `;

  // Results area
  const resultsDiv = document.createElement('div');
  resultsDiv.id = 'results-area';
  resultsDiv.style.display = 'none';

  // Assemble everything
  controlsDiv.appendChild(controlsTitle);
  controlsDiv.appendChild(glassesDiv);
  controlsDiv.appendChild(signsDiv);
  controlsDiv.appendChild(priceDiv);
  controlsDiv.appendChild(runButton);

  mainDiv.appendChild(title);
  mainDiv.appendChild(weatherDiv);
  mainDiv.appendChild(assetsDiv);
  mainDiv.appendChild(controlsDiv);
  mainDiv.appendChild(resultsDiv);

  gameContainer.appendChild(mainDiv);

  // Add event listener
  runButton.addEventListener('click', runBusiness);
}

function runBusiness() {
  const glassesInput = document.getElementById('glasses-input');
  const signsInput = document.getElementById('signs-input');
  const priceInput = document.getElementById('price-input');
  const runButton = document.getElementById('run-button');

  if (!glassesInput || !signsInput || !priceInput || !runButton) return;

  const glasses = parseInt(glassesInput.value) || 0;
  const signs = parseInt(signsInput.value) || 0;
  const priceInCents = parseInt(priceInput.value) || 10;

  // Validate inputs
  if (glasses < 0 || glasses > 1000) {
    alert('Come on, let\'s be reasonable! Glasses must be between 0 and 1000.');
    return;
  }

  if (signs < 0 || signs > 50) {
    alert('Come on, be reasonable! Signs must be between 0 and 50.');
    return;
  }

  if (priceInCents < 1 || priceInCents > 100) {
    alert('Come on, be reasonable! Price must be between 1 and 100 cents.');
    return;
  }

  // Calculate costs
  const lemonadeCost = glasses * 0.02; // 2 cents per glass
  const signsCost = signs * 0.15; // 15 cents per sign
  const totalCost = lemonadeCost + signsCost;

  // Check if player has enough money
  if (totalCost > gameState.assets) {
    alert(`Think again! You have only $${gameState.assets.toFixed(2)} but need $${totalCost.toFixed(2)} for expenses.`);
    return;
  }

  // Disable button and show processing
  runButton.disabled = true;
  runButton.textContent = '🍋 Running your stand...';
  runButton.style.background = '#ccc';

  // Calculate sales using original BASIC logic
  setTimeout(() => {
    const result = calculateSales(glasses, signs, priceInCents);
    showResults(result, glasses, signs, priceInCents, totalCost);

    // Update game state
    gameState.assets += result.profit;
    gameState.day++;

    // Re-enable button
    runButton.disabled = false;
    runButton.textContent = '🚀 OPEN FOR BUSINESS!';
    runButton.style.background = 'linear-gradient(45deg, #32CD32, #228B22)';
  }, 1000);
}

function calculateSales(glasses, signs, priceInCents) {
  // Original BASIC game logic
  const optimalPrice = 10; // 10 cents is optimal price
  const baseCustomers = 30; // Base customer demand

  let demandMultiplier;
  if (priceInCents >= optimalPrice) {
    // Higher prices reduce demand exponentially
    demandMultiplier = (optimalPrice * optimalPrice) * baseCustomers / (priceInCents * priceInCents);
  } else {
    // Lower prices increase demand linearly
    demandMultiplier = (optimalPrice - priceInCents) / optimalPrice * 0.8 * baseCustomers + baseCustomers;
  }

  // Advertising effect (diminishing returns)
  const adEffect = -signs * 0.5;
  const adMultiplier = 1 - (Math.exp(adEffect) * 1);

  // Weather effect (sunny day = good)
  const weatherMultiplier = 1.2;

  // Calculate final demand
  let totalDemand = weatherMultiplier * (demandMultiplier + (demandMultiplier * adMultiplier));
  totalDemand = Math.floor(totalDemand);

  // Can't sell more than you made
  const glassesSold = Math.min(totalDemand, glasses);

  // Calculate financials
  const revenue = glassesSold * (priceInCents / 100);
  const expenses = glasses * 0.02 + signs * 0.15;
  const profit = revenue - expenses;

  return {
    glassesSold,
    revenue,
    expenses,
    profit,
    demand: totalDemand
  };
}

function showResults(result, glasses, signs, priceInCents, totalCost) {
  const resultsArea = document.getElementById('results-area');
  if (!resultsArea) return;

  const profitColor = result.profit >= 0 ? '#4CAF50' : '#F44336';
  const profitIcon = result.profit >= 0 ? '💰' : '📉';

  resultsArea.innerHTML = `
        <div style="
            background: white;
            border: 3px solid #333;
            border-radius: 15px;
            padding: 20px;
            margin-top: 20px;
        ">
            <h2 style="margin: 0 0 20px 0; color: #333; text-align: center;">
                📊 DAY ${gameState.day} RESULTS
            </h2>
            
            <div style="text-align: center; margin-bottom: 20px;">
                <div style="font-size: 48px; margin-bottom: 10px;">${profitIcon}</div>
                <div style="font-size: 24px; font-weight: bold; color: ${profitColor};">
                    ${result.profit >= 0 ? 'PROFIT' : 'LOSS'}: $${Math.abs(result.profit).toFixed(2)}
                </div>
            </div>
            
            <div style="
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px;
                background: #f8f9fa;
                padding: 20px;
                border-radius: 10px;
                margin-bottom: 20px;
            ">
                <div style="text-align: center;">
                    <div style="font-size: 24px;">🥤</div>
                    <div style="font-weight: bold; margin: 5px 0;">Glasses Sold</div>
                    <div style="font-size: 18px; color: #333;">${result.glassesSold}</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 24px;">🏭</div>
                    <div style="font-weight: bold; margin: 5px 0;">Glasses Made</div>
                    <div style="font-size: 18px; color: #333;">${glasses}</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 24px;">📢</div>
                    <div style="font-weight: bold; margin: 5px 0;">Signs Made</div>
                    <div style="font-size: 18px; color: #333;">${signs}</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 24px;">💵</div>
                    <div style="font-weight: bold; margin: 5px 0;">Price per Glass</div>
                    <div style="font-size: 18px; color: #333;">${priceInCents}¢</div>
                </div>
            </div>
            
            <div style="
                background: #e8f5e8;
                border: 2px solid #4CAF50;
                border-radius: 10px;
                padding: 15px;
                margin-bottom: 20px;
            ">
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <span>Revenue:</span>
                    <span style="font-weight: bold;">$${result.revenue.toFixed(2)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <span>Expenses:</span>
                    <span style="font-weight: bold;">$${result.expenses.toFixed(2)}</span>
                </div>
                <hr style="margin: 10px 0; border: 1px solid #4CAF50;">
                <div style="display: flex; justify-content: space-between; font-size: 18px;">
                    <span style="font-weight: bold;">Net Profit:</span>
                    <span style="font-weight: bold; color: ${profitColor};">$${result.profit.toFixed(2)}</span>
                </div>
            </div>
            
            <div style="
                background: linear-gradient(45deg, #FFD700, #FFA500);
                border: 2px solid #333;
                border-radius: 10px;
                padding: 15px;
                text-align: center;
                color: #333;
                font-weight: bold;
                margin-bottom: 20px;
            ">
                New Assets: $${gameState.assets.toFixed(2)} → $${(gameState.assets + result.profit).toFixed(2)}
            </div>
            
            <button id="next-day-button" style="
                width: 100%;
                background: linear-gradient(45deg, #FF6B35, #F7931E);
                color: white;
                border: 3px solid #333;
                padding: 15px;
                font-size: 18px;
                font-weight: bold;
                border-radius: 10px;
                cursor: pointer;
                font-family: 'Courier New', monospace;
                text-transform: uppercase;
            ">
                🔄 CONTINUE TO DAY ${gameState.day + 1}
            </button>
        </div>
    `;

  resultsArea.style.display = 'block';

  // Add event listener for next day
  const nextDayButton = document.getElementById('next-day-button');
  if (nextDayButton) {
    nextDayButton.addEventListener('click', function () {
      resultsArea.style.display = 'none';
      createGameInterface(); // Refresh the interface with new day/assets
    });
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function () {
  console.log('DOM loaded, setting up clean game...');
  const startButton = document.getElementById('start-button');
  if (startButton) {
    startButton.addEventListener('click', startGame);
    console.log('Start button listener added');
  }
});

// Global backup
window.startGame = startGame;
