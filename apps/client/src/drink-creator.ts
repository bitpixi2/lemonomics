/**
 * Drink Creator Interface
 * 
 * Handles the drink creation UI and real-time 3D preview.
 * Integrates with validation and provides smooth user experience.
 */

import * as THREE from 'three';
import type { Drink, GlassType, BackdropType, FontType, Layer } from '@bitpixis-bar/types';
import { validateDrink, type ValidationResult } from '@bitpixis-bar/logic';
import { DrinkRenderer } from './drink-renderer.js';

export interface DrinkCreatorOptions {
  container: HTMLElement;
  scene: THREE.Scene;
  onDrinkChange?: (drink: Partial<Drink>) => void;
  onValidationChange?: (result: ValidationResult) => void;
  onSubmit?: (drink: Drink, imageUrl: string) => void;
}

export class DrinkCreator {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private drinkRenderer: DrinkRenderer;
  private currentDrink: Partial<Drink> = {};
  private drinkPreview: THREE.Group | null = null;
  
  // UI Elements
  private sidePanel: HTMLElement;
  private previewCanvas: HTMLCanvasElement;
  private validationDisplay: HTMLElement;
  
  // Callbacks
  private onDrinkChange?: (drink: Partial<Drink>) => void;
  private onValidationChange?: (result: ValidationResult) => void;
  private onSubmit?: (drink: Drink, imageUrl: string) => void;

  constructor(options: DrinkCreatorOptions) {
    this.container = options.container;
    this.scene = options.scene;
    this.onDrinkChange = options.onDrinkChange;
    this.onValidationChange = options.onValidationChange;
    this.onSubmit = options.onSubmit;
    
    this.drinkRenderer = new DrinkRenderer(this.scene);
    
    this.initializeUI();
    this.initializeDefaultDrink();
  }

  /**
   * Get current drink data
   */
  getCurrentDrink(): Partial<Drink> {
    return { ...this.currentDrink };
  }

  /**
   * Set drink data (for loading existing drinks)
   */
  setDrink(drink: Partial<Drink>): void {
    this.currentDrink = { ...drink };
    this.updateUI();
    this.updatePreview();
    this.validateCurrentDrink();
  }

  /**
   * Generate preview image
   */
  async generatePreviewImage(width = 512, height = 512): Promise<string> {
    // Create temporary renderer for image generation
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    
    const tempRenderer = new THREE.WebGLRenderer({ 
      canvas: tempCanvas,
      preserveDrawingBuffer: true,
      alpha: true 
    });
    tempRenderer.setSize(width, height);
    tempRenderer.setClearColor(0x000000, 0);

    // Create temporary scene and camera for preview
    const tempScene = new THREE.Scene();
    const tempCamera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    tempCamera.position.set(0, 0, 5);
    tempCamera.lookAt(0, 0, 0);

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.6);
    tempScene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
    directionalLight.position.set(2, 2, 2);
    tempScene.add(directionalLight);

    // Render drink if complete enough
    if (this.isDrinkRenderable(this.currentDrink)) {
      const tempDrinkRenderer = new DrinkRenderer(tempScene);
      const drinkMesh = tempDrinkRenderer.renderDrink(this.currentDrink as Drink, {
        position: new THREE.Vector3(0, 0, 0),
        scale: 1.5,
        showName: false,
      });
      tempScene.add(drinkMesh);
    }

    // Render and get image data
    tempRenderer.render(tempScene, tempCamera);
    const imageUrl = tempCanvas.toDataURL('image/png');
    
    // Cleanup
    tempRenderer.dispose();
    
    return imageUrl;
  }

  /**
   * Submit current drink
   */
  async submitDrink(): Promise<void> {
    if (!this.isDrinkComplete(this.currentDrink)) {
      this.showError('Please complete all required fields before submitting.');
      return;
    }

    const validation = validateDrink(this.currentDrink as Drink);
    if (!validation.valid) {
      this.showError(`Validation failed: ${validation.errors.join(', ')}`);
      return;
    }

    try {
      const imageUrl = await this.generatePreviewImage();
      this.onSubmit?.(this.currentDrink as Drink, imageUrl);
    } catch (error) {
      console.error('Failed to submit drink:', error);
      this.showError('Failed to submit drink. Please try again.');
    }
  }

  // Private methods

  /**
   * Initialize the UI elements
   */
  private initializeUI(): void {
    this.container.innerHTML = `
      <div class="drink-creator">
        <div class="side-panel">
          <h2>Create Your Drink</h2>
          
          <div class="form-section">
            <label for="drink-name">Drink Name</label>
            <input type="text" id="drink-name" maxlength="24" placeholder="Enter drink name">
            <div class="char-counter">0/24</div>
          </div>

          <div class="form-section">
            <label for="glass-type">Glass Type</label>
            <select id="glass-type">
              <option value="">Select glass...</option>
              <option value="tall">Tall Glass</option>
              <option value="short">Short Glass</option>
              <option value="mug">Cozy Mug</option>
              <option value="potion">Potion Bottle</option>
              <option value="martini">Martini Glass</option>
            </select>
          </div>

          <div class="form-section">
            <label for="backdrop">Backdrop</label>
            <select id="backdrop">
              <option value="">Select backdrop...</option>
              <option value="counter">Cozy Counter</option>
              <option value="neon">Neon Lights</option>
              <option value="pumpkin_night">Pumpkin Night</option>
              <option value="snow_window">Snowy Window</option>
            </select>
          </div>

          <div class="form-section">
            <label for="base">Base Ingredient</label>
            <select id="base">
              <option value="">Select base...</option>
              <option value="coffee">☕ Coffee</option>
              <option value="tea">🍵 Tea</option>
              <option value="milk">🥛 Milk</option>
              <option value="juice">🧃 Juice</option>
              <option value="soda">🥤 Soda</option>
            </select>
          </div>

          <div class="form-section">
            <label>Flavors (max 3)</label>
            <div class="flavor-inputs">
              <input type="text" class="flavor-input" placeholder="Flavor 1">
              <input type="text" class="flavor-input" placeholder="Flavor 2">
              <input type="text" class="flavor-input" placeholder="Flavor 3">
            </div>
          </div>

          <div class="form-section">
            <label>Toppings (max 3)</label>
            <div class="topping-inputs">
              <input type="text" class="topping-input" placeholder="Topping 1">
              <input type="text" class="topping-input" placeholder="Topping 2">
              <input type="text" class="topping-input" placeholder="Topping 3">
            </div>
          </div>

          <div class="form-section">
            <label>Mix Mode</label>
            <div class="radio-group">
              <label><input type="radio" name="mix-mode" value="blend"> Blended</label>
              <label><input type="radio" name="mix-mode" value="layered"> Layered</label>
            </div>
          </div>

          <div class="form-section" id="blend-options" style="display: none;">
            <label for="blend-color">Blend Color</label>
            <input type="color" id="blend-color" value="#FFFFFF">
          </div>

          <div class="form-section" id="layer-options" style="display: none;">
            <label>Layers (max 4)</label>
            <div class="layer-inputs">
              <div class="layer-input">
                <input type="color" class="layer-color" value="#FF0000">
                <input type="number" class="layer-percent" min="1" max="100" placeholder="%">
              </div>
              <div class="layer-input">
                <input type="color" class="layer-color" value="#00FF00">
                <input type="number" class="layer-percent" min="1" max="100" placeholder="%">
              </div>
              <div class="layer-input">
                <input type="color" class="layer-color" value="#0000FF">
                <input type="number" class="layer-percent" min="1" max="100" placeholder="%">
              </div>
              <div class="layer-input">
                <input type="color" class="layer-color" value="#FFFF00">
                <input type="number" class="layer-percent" min="1" max="100" placeholder="%">
              </div>
            </div>
            <div class="layer-total">Total: <span id="layer-total">0</span>%</div>
          </div>

          <div class="form-section">
            <label for="font-type">Font Style</label>
            <select id="font-type">
              <option value="script">✍️ Script</option>
              <option value="serif">📖 Serif</option>
              <option value="sans-serif">🔤 Sans-serif</option>
              <option value="decorative">✨ Decorative</option>
              <option value="handwritten">✏️ Handwritten</option>
            </select>
          </div>

          <div class="validation-display" id="validation-display"></div>

          <div class="form-actions">
            <button id="preview-btn" class="btn btn-secondary">Preview</button>
            <button id="submit-btn" class="btn btn-primary" disabled>Submit to Reddit</button>
          </div>
        </div>

        <div class="preview-area">
          <div class="preview-container">
            <canvas id="preview-canvas"></canvas>
          </div>
        </div>
      </div>
    `;

    this.sidePanel = this.container.querySelector('.side-panel')!;
    this.previewCanvas = this.container.querySelector('#preview-canvas') as HTMLCanvasElement;
    this.validationDisplay = this.container.querySelector('#validation-display')!;

    this.setupEventListeners();
    this.setupStyles();
  }

  /**
   * Set up event listeners for form inputs
   */
  private setupEventListeners(): void {
    // Name input
    const nameInput = this.container.querySelector('#drink-name') as HTMLInputElement;
    const charCounter = this.container.querySelector('.char-counter')!;
    nameInput.addEventListener('input', () => {
      this.currentDrink.name = nameInput.value;
      charCounter.textContent = `${nameInput.value.length}/24`;
      this.updatePreview();
      this.validateCurrentDrink();
    });

    // Glass type
    const glassSelect = this.container.querySelector('#glass-type') as HTMLSelectElement;
    glassSelect.addEventListener('change', () => {
      this.currentDrink.glass = glassSelect.value as GlassType;
      this.updatePreview();
      this.validateCurrentDrink();
    });

    // Backdrop
    const backdropSelect = this.container.querySelector('#backdrop') as HTMLSelectElement;
    backdropSelect.addEventListener('change', () => {
      this.currentDrink.backdrop = backdropSelect.value as BackdropType;
      this.drinkRenderer.setBackdrop(this.currentDrink.backdrop);
      this.updatePreview();
      this.validateCurrentDrink();
    });

    // Base ingredient
    const baseSelect = this.container.querySelector('#base') as HTMLSelectElement;
    baseSelect.addEventListener('change', () => {
      this.currentDrink.base = baseSelect.value as any;
      this.updatePreview();
      this.validateCurrentDrink();
    });

    // Flavors
    const flavorInputs = this.container.querySelectorAll('.flavor-input') as NodeListOf<HTMLInputElement>;
    flavorInputs.forEach((input, index) => {
      input.addEventListener('input', () => {
        if (!this.currentDrink.flavors) this.currentDrink.flavors = [];
        this.currentDrink.flavors[index] = input.value;
        this.currentDrink.flavors = this.currentDrink.flavors.filter(f => f.trim() !== '');
        this.updatePreview();
        this.validateCurrentDrink();
      });
    });

    // Toppings
    const toppingInputs = this.container.querySelectorAll('.topping-input') as NodeListOf<HTMLInputElement>;
    toppingInputs.forEach((input, index) => {
      input.addEventListener('input', () => {
        if (!this.currentDrink.toppings) this.currentDrink.toppings = [];
        this.currentDrink.toppings[index] = input.value;
        this.currentDrink.toppings = this.currentDrink.toppings.filter(t => t.trim() !== '');
        this.updatePreview();
        this.validateCurrentDrink();
      });
    });

    // Mix mode
    const mixModeRadios = this.container.querySelectorAll('input[name="mix-mode"]') as NodeListOf<HTMLInputElement>;
    mixModeRadios.forEach(radio => {
      radio.addEventListener('change', () => {
        this.currentDrink.mixMode = radio.value as 'blend' | 'layered';
        this.toggleMixModeOptions();
        this.updatePreview();
        this.validateCurrentDrink();
      });
    });

    // Blend color
    const blendColorInput = this.container.querySelector('#blend-color') as HTMLInputElement;
    blendColorInput.addEventListener('input', () => {
      this.currentDrink.color = blendColorInput.value;
      this.updatePreview();
      this.validateCurrentDrink();
    });

    // Layer inputs
    const layerColorInputs = this.container.querySelectorAll('.layer-color') as NodeListOf<HTMLInputElement>;
    const layerPercentInputs = this.container.querySelectorAll('.layer-percent') as NodeListOf<HTMLInputElement>;
    
    const updateLayers = () => {
      const layers: Layer[] = [];
      for (let i = 0; i < layerColorInputs.length; i++) {
        const color = layerColorInputs[i].value;
        const percent = parseInt(layerPercentInputs[i].value) || 0;
        if (percent > 0) {
          layers.push({ color, percent });
        }
      }
      this.currentDrink.layers = layers;
      this.updateLayerTotal();
      this.updatePreview();
      this.validateCurrentDrink();
    };

    layerColorInputs.forEach(input => input.addEventListener('input', updateLayers));
    layerPercentInputs.forEach(input => input.addEventListener('input', updateLayers));

    // Font type
    const fontSelect = this.container.querySelector('#font-type') as HTMLSelectElement;
    fontSelect.addEventListener('change', () => {
      this.currentDrink.font = fontSelect.value as FontType;
      this.updatePreview();
      this.validateCurrentDrink();
    });

    // Buttons
    const previewBtn = this.container.querySelector('#preview-btn')!;
    previewBtn.addEventListener('click', () => this.updatePreview());

    const submitBtn = this.container.querySelector('#submit-btn')!;
    submitBtn.addEventListener('click', () => this.submitDrink());
  }

  /**
   * Initialize default drink values
   */
  private initializeDefaultDrink(): void {
    this.currentDrink = {
      name: '',
      glass: undefined,
      backdrop: undefined,
      base: undefined,
      flavors: [],
      toppings: [],
      mixMode: undefined,
      font: 'script',
      createdAt: Date.now(),
      authorUid: 'current_user', // Would be set from auth
    };

    this.updateUI();
    this.validateCurrentDrink();
  }

  /**
   * Update UI elements to reflect current drink
   */
  private updateUI(): void {
    const nameInput = this.container.querySelector('#drink-name') as HTMLInputElement;
    nameInput.value = this.currentDrink.name || '';

    const glassSelect = this.container.querySelector('#glass-type') as HTMLSelectElement;
    glassSelect.value = this.currentDrink.glass || '';

    const backdropSelect = this.container.querySelector('#backdrop') as HTMLSelectElement;
    backdropSelect.value = this.currentDrink.backdrop || '';

    const baseSelect = this.container.querySelector('#base') as HTMLSelectElement;
    baseSelect.value = this.currentDrink.base || '';

    // Update other fields...
    this.toggleMixModeOptions();
  }

  /**
   * Toggle mix mode options visibility
   */
  private toggleMixModeOptions(): void {
    const blendOptions = this.container.querySelector('#blend-options') as HTMLElement;
    const layerOptions = this.container.querySelector('#layer-options') as HTMLElement;

    blendOptions.style.display = this.currentDrink.mixMode === 'blend' ? 'block' : 'none';
    layerOptions.style.display = this.currentDrink.mixMode === 'layered' ? 'block' : 'none';
  }

  /**
   * Update layer total percentage display
   */
  private updateLayerTotal(): void {
    const total = this.currentDrink.layers?.reduce((sum, layer) => sum + layer.percent, 0) || 0;
    const totalDisplay = this.container.querySelector('#layer-total')!;
    totalDisplay.textContent = total.toString();
    totalDisplay.className = total === 100 ? 'valid' : total > 100 ? 'over' : 'under';
  }

  /**
   * Update 3D preview
   */
  private updatePreview(): void {
    // Remove existing preview
    if (this.drinkPreview) {
      this.scene.remove(this.drinkPreview);
    }

    // Create new preview if drink is renderable
    if (this.isDrinkRenderable(this.currentDrink)) {
      this.drinkPreview = this.drinkRenderer.renderDrink(this.currentDrink as Drink, {
        position: new THREE.Vector3(0, 0, 0),
        scale: 1,
        showName: true,
      });
      this.scene.add(this.drinkPreview);
    }

    this.onDrinkChange?.(this.currentDrink);
  }

  /**
   * Validate current drink and update UI
   */
  private validateCurrentDrink(): void {
    if (!this.isDrinkComplete(this.currentDrink)) {
      this.updateValidationDisplay({ valid: false, errors: ['Please complete all required fields'] });
      return;
    }

    const validation = validateDrink(this.currentDrink as Drink);
    this.updateValidationDisplay(validation);
    this.onValidationChange?.(validation);

    // Update submit button state
    const submitBtn = this.container.querySelector('#submit-btn') as HTMLButtonElement;
    submitBtn.disabled = !validation.valid;
  }

  /**
   * Update validation display
   */
  private updateValidationDisplay(result: ValidationResult): void {
    this.validationDisplay.innerHTML = '';
    
    if (result.valid) {
      this.validationDisplay.innerHTML = '<div class="validation-success">✅ Drink is ready to submit!</div>';
    } else {
      const errorList = result.errors.map(error => `<li>${error}</li>`).join('');
      this.validationDisplay.innerHTML = `
        <div class="validation-errors">
          <strong>⚠️ Validation Errors:</strong>
          <ul>${errorList}</ul>
        </div>
      `;
    }
  }

  /**
   * Check if drink has minimum required fields for rendering
   */
  private isDrinkRenderable(drink: Partial<Drink>): boolean {
    return !!(drink.glass && drink.mixMode);
  }

  /**
   * Check if drink is complete
   */
  private isDrinkComplete(drink: Partial<Drink>): boolean {
    return !!(
      drink.name &&
      drink.glass &&
      drink.backdrop &&
      drink.base &&
      drink.mixMode &&
      drink.font &&
      (drink.mixMode === 'blend' ? drink.color : drink.layers?.length)
    );
  }

  /**
   * Show error message
   */
  private showError(message: string): void {
    this.validationDisplay.innerHTML = `<div class="validation-error">❌ ${message}</div>`;
  }

  /**
   * Set up CSS styles
   */
  private setupStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      .drink-creator {
        display: flex;
        height: 100vh;
        font-family: 'Arial', sans-serif;
      }

      .side-panel {
        width: 350px;
        padding: 20px;
        background: linear-gradient(135deg, #8B4513, #A0522D);
        color: white;
        overflow-y: auto;
        box-shadow: 2px 0 10px rgba(0,0,0,0.3);
      }

      .side-panel h2 {
        margin-top: 0;
        color: #FFE4B5;
        text-align: center;
        font-size: 1.5em;
      }

      .form-section {
        margin-bottom: 20px;
      }

      .form-section label {
        display: block;
        margin-bottom: 5px;
        font-weight: bold;
        color: #FFE4B5;
      }

      .form-section input,
      .form-section select {
        width: 100%;
        padding: 8px;
        border: none;
        border-radius: 4px;
        background: rgba(255, 255, 255, 0.9);
        color: #333;
      }

      .char-counter {
        font-size: 0.8em;
        color: #DDD;
        text-align: right;
        margin-top: 2px;
      }

      .flavor-inputs,
      .topping-inputs {
        display: flex;
        flex-direction: column;
        gap: 5px;
      }

      .layer-inputs {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .layer-input {
        display: flex;
        gap: 8px;
        align-items: center;
      }

      .layer-color {
        width: 50px !important;
        height: 30px;
        padding: 0;
        border: none;
        border-radius: 4px;
      }

      .layer-percent {
        width: 60px !important;
      }

      .layer-total {
        margin-top: 8px;
        font-weight: bold;
      }

      .layer-total.valid { color: #90EE90; }
      .layer-total.over { color: #FF6B6B; }
      .layer-total.under { color: #FFD700; }

      .radio-group {
        display: flex;
        gap: 15px;
      }

      .radio-group label {
        display: flex;
        align-items: center;
        gap: 5px;
        font-weight: normal;
      }

      .validation-display {
        margin: 15px 0;
        padding: 10px;
        border-radius: 4px;
        min-height: 20px;
      }

      .validation-success {
        background: rgba(144, 238, 144, 0.2);
        color: #90EE90;
        border: 1px solid #90EE90;
      }

      .validation-errors,
      .validation-error {
        background: rgba(255, 107, 107, 0.2);
        color: #FF6B6B;
        border: 1px solid #FF6B6B;
      }

      .validation-errors ul {
        margin: 5px 0 0 20px;
      }

      .form-actions {
        display: flex;
        gap: 10px;
        margin-top: 20px;
      }

      .btn {
        flex: 1;
        padding: 12px;
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

      .btn-primary:hover:not(:disabled) {
        background: #FF1493;
      }

      .btn-primary:disabled {
        background: #666;
        cursor: not-allowed;
      }

      .btn-secondary {
        background: #DDD;
        color: #333;
      }

      .btn-secondary:hover {
        background: #CCC;
      }

      .preview-area {
        flex: 1;
        position: relative;
        background: linear-gradient(135deg, #2C1810, #3D2817);
      }

      .preview-container {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
      }

      #preview-canvas {
        width: 100%;
        height: 100%;
        display: block;
      }
    `;
    
    document.head.appendChild(style);
  }
}
