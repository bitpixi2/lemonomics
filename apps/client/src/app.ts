/**
 * Bitpixi's Bar Main Application
 * 
 * Orchestrates the three-phase game experience:
 * 1. Bar view (zoomed out with featured drinks)
 * 2. Drink creation (zoomed in mixing interface)
 * 3. Component creation (custom component design)
 */

import * as THREE from 'three';
import type { Drink, PlayerStats } from '@bitpixis-bar/types';
import { SceneManager, type ViewType } from './scene-manager.js';
import { DrinkRenderer } from './drink-renderer.js';
import { DrinkCreator } from './drink-creator.js';
import { ComponentCreator } from './component-creator.js';
import { getDefaultFeaturedDrinks, type DefaultFeaturedDrink } from './default-drinks.js';

export interface GameState {
  currentView: ViewType;
  playerStats: PlayerStats | null;
  featuredDrinks: DefaultFeaturedDrink[];
  hasUnlockedComponents: boolean;
}

export class BitpixisBarApp {
  private canvas: HTMLCanvasElement;
  private sceneManager: SceneManager;
  private drinkRenderer: DrinkRenderer;
  private drinkCreator: DrinkCreator | null = null;
  private componentCreator: ComponentCreator | null = null;
  
  private gameState: GameState = {
    currentView: 'bar',
    playerStats: null,
    featuredDrinks: [],
    hasUnlockedComponents: false,
  };

  // UI Elements
  private uiContainer: HTMLElement;
  private navigationBar: HTMLElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.sceneManager = new SceneManager(canvas);
    
    // Get the current scene for drink renderer
    const { scene } = this.sceneManager.getCurrentSceneAndCamera();
    this.drinkRenderer = new DrinkRenderer(scene);

    this.initializeUI();
    this.loadInitialData();
    this.setupEventListeners();
  }

  /**
   * Start the application
   */
  async start(): Promise<void> {
    console.log('🍹 Starting Bitpixi\'s Bar...');
    
    // Load featured drinks (default for now)
    this.gameState.featuredDrinks = getDefaultFeaturedDrinks();
    this.sceneManager.updateFeaturedDisplay(this.gameState.featuredDrinks);

    // Check player stats and unlock status
    await this.checkPlayerProgress();

    // Start in bar view
    await this.transitionToView('bar');
    
    console.log('✅ Bitpixi\'s Bar is ready!');
  }

  /**
   * Transition to a different view
   */
  async transitionToView(view: ViewType): Promise<void> {
    if (this.gameState.currentView === view) {
      return;
    }

    // Clean up current view
    this.cleanupCurrentView();

    // Transition scene
    await this.sceneManager.transitionTo(view);

    // Set up new view
    this.gameState.currentView = view;
    this.setupCurrentView();
    this.updateNavigation();
  }

  /**
   * Handle drink submission
   */
  private async handleDrinkSubmission(drink: Drink, imageUrl: string): Promise<void> {
    try {
      console.log('🍹 Submitting drink:', drink.name);

      // Submit to server
      const response = await fetch('/api/submit-drink', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          drink,
          imageUrl,
          authorUid: 'current_user', // Would come from auth
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.status === 'success') {
        this.showSuccessMessage(`🎉 "${drink.name}" submitted to Reddit! Post ID: ${result.data.postId}`);
        
        // Update player progress
        await this.updatePlayerProgress();
        
        // Return to bar view
        await this.transitionToView('bar');
      } else {
        throw new Error(result.message || 'Failed to submit drink');
      }

    } catch (error) {
      console.error('Failed to submit drink:', error);
      this.showErrorMessage(`Failed to submit drink: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Handle component submission
   */
  private async handleComponentSubmission(component: any): Promise<void> {
    try {
      console.log('🎨 Submitting component:', component.name);

      const response = await fetch('/api/submit-component', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          component,
          authorUid: 'current_user',
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.status === 'success') {
        this.showSuccessMessage(`🎉 "${component.name}" submitted for approval! Post ID: ${result.data.postId}`);
        await this.transitionToView('bar');
      } else {
        throw new Error(result.message || 'Failed to submit component');
      }

    } catch (error) {
      console.error('Failed to submit component:', error);
      this.showErrorMessage(`Failed to submit component: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Private methods

  /**
   * Initialize UI elements
   */
  private initializeUI(): void {
    // Create main UI container
    this.uiContainer = document.createElement('div');
    this.uiContainer.className = 'bitpixi-ui';
    document.body.appendChild(this.uiContainer);

    // Create navigation bar
    this.navigationBar = document.createElement('nav');
    this.navigationBar.className = 'navigation-bar';
    this.navigationBar.innerHTML = `
      <div class="nav-brand">
        <h1>🍹 Bitpixi's Bar</h1>
      </div>
      <div class="nav-buttons">
        <button id="bar-view-btn" class="nav-btn active">🏪 Bar</button>
        <button id="mixing-view-btn" class="nav-btn">🍹 Mix Drink</button>
        <button id="component-view-btn" class="nav-btn" disabled>🎨 Create Component</button>
      </div>
      <div class="nav-info">
        <span id="player-info">Welcome to Bitpixi's Bar!</span>
      </div>
    `;
    this.uiContainer.appendChild(this.navigationBar);

    // Create view container
    const viewContainer = document.createElement('div');
    viewContainer.className = 'view-container';
    viewContainer.id = 'view-container';
    this.uiContainer.appendChild(viewContainer);

    this.setupUIStyles();
  }

  /**
   * Set up event listeners
   */
  private setupEventListeners(): void {
    // Navigation buttons
    const barViewBtn = this.navigationBar.querySelector('#bar-view-btn')!;
    const mixingViewBtn = this.navigationBar.querySelector('#mixing-view-btn')!;
    const componentViewBtn = this.navigationBar.querySelector('#component-view-btn')!;

    barViewBtn.addEventListener('click', () => this.transitionToView('bar'));
    mixingViewBtn.addEventListener('click', () => this.transitionToView('mixing'));
    componentViewBtn.addEventListener('click', () => {
      if (this.gameState.hasUnlockedComponents) {
        this.transitionToView('component-design');
      }
    });

    // Handle deep linking (try drink from Reddit)
    const urlParams = new URLSearchParams(window.location.search);
    const drinkId = urlParams.get('drink');
    if (drinkId) {
      this.loadDrinkFromId(drinkId);
    }
  }

  /**
   * Load initial data
   */
  private async loadInitialData(): Promise<void> {
    try {
      // Load featured menu data
      const response = await fetch('/api/featured-menu');
      if (response.ok) {
        const result = await response.json();
        if (result.status === 'success') {
          // Use server data if available, otherwise use defaults
          this.gameState.featuredDrinks = result.data.topDrinks.length > 0 
            ? result.data.topDrinks 
            : getDefaultFeaturedDrinks();
        }
      }
    } catch (error) {
      console.warn('Failed to load initial data, using defaults:', error);
      this.gameState.featuredDrinks = getDefaultFeaturedDrinks();
    }
  }

  /**
   * Check player progress and unlock status
   */
  private async checkPlayerProgress(): Promise<void> {
    try {
      // This would normally check with the server
      // For now, simulate unlocking after first drink
      this.gameState.hasUnlockedComponents = true; // Simplified for demo
      
      const componentBtn = this.navigationBar.querySelector('#component-view-btn') as HTMLButtonElement;
      componentBtn.disabled = !this.gameState.hasUnlockedComponents;
      
      if (this.gameState.hasUnlockedComponents) {
        componentBtn.title = 'Create custom components';
      } else {
        componentBtn.title = 'Create a drink first to unlock';
      }
    } catch (error) {
      console.warn('Failed to check player progress:', error);
    }
  }

  /**
   * Update player progress after actions
   */
  private async updatePlayerProgress(): Promise<void> {
    // This would update server-side stats
    this.gameState.hasUnlockedComponents = true;
    await this.checkPlayerProgress();
  }

  /**
   * Clean up current view
   */
  private cleanupCurrentView(): void {
    const viewContainer = document.getElementById('view-container')!;
    viewContainer.innerHTML = '';

    if (this.drinkCreator) {
      // Cleanup drink creator if needed
      this.drinkCreator = null;
    }

    if (this.componentCreator) {
      // Cleanup component creator if needed
      this.componentCreator = null;
    }
  }

  /**
   * Set up current view
   */
  private setupCurrentView(): void {
    const viewContainer = document.getElementById('view-container')!;

    switch (this.gameState.currentView) {
      case 'bar':
        this.setupBarView(viewContainer);
        break;
      case 'mixing':
        this.setupMixingView(viewContainer);
        break;
      case 'component-design':
        this.setupComponentView(viewContainer);
        break;
    }
  }

  /**
   * Set up bar view
   */
  private setupBarView(container: HTMLElement): void {
    container.innerHTML = `
      <div class="bar-view">
        <div class="featured-drinks-info">
          <h2>Featured Drinks</h2>
          <p>Top community creations displayed behind the bartender</p>
          <div class="drink-list">
            ${this.gameState.featuredDrinks.map((drink, index) => `
              <div class="drink-item">
                <span class="rank">${['🥇', '🥈', '🥉'][index]}</span>
                <span class="name">${drink.name}</span>
                <span class="score">${drink.score} votes</span>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="game-info">
          <h3>Welcome to Bitpixi's Bar!</h3>
          <p>Create amazing drinks and share them with the community.</p>
          <button id="start-mixing" class="btn btn-primary">Start Mixing! 🍹</button>
        </div>
      </div>
    `;

    const startMixingBtn = container.querySelector('#start-mixing')!;
    startMixingBtn.addEventListener('click', () => this.transitionToView('mixing'));
  }

  /**
   * Set up mixing view
   */
  private setupMixingView(container: HTMLElement): void {
    const { scene } = this.sceneManager.getCurrentSceneAndCamera();
    
    this.drinkCreator = new DrinkCreator({
      container,
      scene,
      onSubmit: (drink, imageUrl) => this.handleDrinkSubmission(drink, imageUrl),
    });
  }

  /**
   * Set up component view
   */
  private setupComponentView(container: HTMLElement): void {
    const { scene } = this.sceneManager.getCurrentSceneAndCamera();
    
    this.componentCreator = new ComponentCreator({
      container,
      scene,
      onSubmit: (component) => this.handleComponentSubmission(component),
    });
  }

  /**
   * Update navigation state
   */
  private updateNavigation(): void {
    const buttons = this.navigationBar.querySelectorAll('.nav-btn');
    buttons.forEach(btn => btn.classList.remove('active'));

    const activeBtn = this.navigationBar.querySelector(`#${this.gameState.currentView.replace('-', '')}-view-btn`);
    if (activeBtn) {
      activeBtn.classList.add('active');
    }
  }

  /**
   * Load drink from ID (deep linking)
   */
  private async loadDrinkFromId(drinkId: string): Promise<void> {
    try {
      const response = await fetch(`/api/drink/${drinkId}`);
      if (response.ok) {
        const result = await response.json();
        if (result.status === 'success') {
          // Load drink into creator
          await this.transitionToView('mixing');
          if (this.drinkCreator) {
            this.drinkCreator.setDrink(result.data.recipe);
          }
        }
      }
    } catch (error) {
      console.warn('Failed to load drink:', error);
    }
  }

  /**
   * Show success message
   */
  private showSuccessMessage(message: string): void {
    // Simple toast notification
    const toast = document.createElement('div');
    toast.className = 'toast success';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 5000);
  }

  /**
   * Show error message
   */
  private showErrorMessage(message: string): void {
    const toast = document.createElement('div');
    toast.className = 'toast error';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 5000);
  }

  /**
   * Set up UI styles
   */
  private setupUIStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      .bitpixi-ui {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 1000;
        pointer-events: none;
      }

      .navigation-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 20px;
        background: rgba(139, 69, 19, 0.9);
        color: white;
        pointer-events: auto;
        backdrop-filter: blur(10px);
      }

      .nav-brand h1 {
        margin: 0;
        font-size: 1.5em;
      }

      .nav-buttons {
        display: flex;
        gap: 10px;
      }

      .nav-btn {
        padding: 8px 16px;
        border: none;
        border-radius: 4px;
        background: rgba(255, 255, 255, 0.2);
        color: white;
        cursor: pointer;
        transition: background-color 0.3s;
      }

      .nav-btn:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.3);
      }

      .nav-btn.active {
        background: #FF69B4;
      }

      .nav-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .view-container {
        position: absolute;
        top: 60px;
        left: 0;
        right: 0;
        bottom: 0;
        pointer-events: auto;
      }

      .bar-view {
        display: flex;
        padding: 20px;
        gap: 20px;
        height: 100%;
      }

      .featured-drinks-info {
        background: rgba(139, 69, 19, 0.8);
        color: white;
        padding: 20px;
        border-radius: 8px;
        backdrop-filter: blur(10px);
        width: 300px;
      }

      .drink-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.2);
      }

      .game-info {
        background: rgba(255, 105, 180, 0.8);
        color: white;
        padding: 20px;
        border-radius: 8px;
        backdrop-filter: blur(10px);
        width: 300px;
      }

      .btn {
        padding: 12px 24px;
        border: none;
        border-radius: 4px;
        font-weight: bold;
        cursor: pointer;
        transition: background-color 0.3s;
      }

      .btn-primary {
        background: #FF69B4;
        color: white;
      }

      .btn-primary:hover {
        background: #FF1493;
      }

      .toast {
        position: fixed;
        top: 80px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 4px;
        color: white;
        font-weight: bold;
        z-index: 2000;
        animation: slideIn 0.3s ease-out;
      }

      .toast.success {
        background: #4CAF50;
      }

      .toast.error {
        background: #F44336;
      }

      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    `;
    
    document.head.appendChild(style);
  }
}
