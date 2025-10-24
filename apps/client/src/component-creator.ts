/**
 * Component Creator Interface
 * 
 * Handles custom component creation (glasses, backdrops, flavors, toppings).
 * Unlocked after player creates 1 drink.
 */

import * as THREE from 'three';
import type { ComponentType, CustomComponent } from '@bitpixis-bar/types';

export interface ComponentCreatorOptions {
  container: HTMLElement;
  scene: THREE.Scene;
  onComponentCreate?: (component: CustomComponent) => void;
  onSubmit?: (component: CustomComponent) => void;
}

export class ComponentCreator {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private currentComponent: Partial<CustomComponent> = {};
  private componentPreview: THREE.Group | null = null;
  
  // Callbacks
  private onComponentCreate?: (component: CustomComponent) => void;
  private onSubmit?: (component: CustomComponent) => void;

  constructor(options: ComponentCreatorOptions) {
    this.container = options.container;
    this.scene = options.scene;
    this.onComponentCreate = options.onComponentCreate;
    this.onSubmit = options.onSubmit;
    
    this.initializeUI();
    this.initializeDefaultComponent();
  }

  /**
   * Get current component data
   */
  getCurrentComponent(): Partial<CustomComponent> {
    return { ...this.currentComponent };
  }

  /**
   * Set component type and initialize
   */
  setComponentType(type: ComponentType): void {
    this.currentComponent.type = type;
    this.updateUI();
    this.updatePreview();
  }

  /**
   * Submit current component
   */
  async submitComponent(): Promise<void> {
    if (!this.isComponentComplete(this.currentComponent)) {
      this.showError('Please complete all required fields before submitting.');
      return;
    }

    try {
      this.onSubmit?.(this.currentComponent as CustomComponent);
    } catch (error) {
      console.error('Failed to submit component:', error);
      this.showError('Failed to submit component. Please try again.');
    }
  }

  // Private methods

  private initializeUI(): void {
    this.container.innerHTML = `
      <div class="component-creator">
        <div class="side-panel">
          <h2>Create Custom Component</h2>
          <p class="unlock-message">🎉 Unlocked after creating your first drink!</p>
          
          <div class="form-section">
            <label for="component-type">Component Type</label>
            <select id="component-type">
              <option value="">Select type...</option>
              <option value="glass">🥃 Glass Design</option>
              <option value="backdrop">🖼️ Backdrop Scene</option>
              <option value="flavor">🍯 Flavor Ingredient</option>
              <option value="topping">🍒 Drink Topping</option>
            </select>
          </div>

          <div class="form-section">
            <label for="component-name">Component Name</label>
            <input type="text" id="component-name" maxlength="30" placeholder="Enter component name">
          </div>

          <div class="form-section">
            <label for="component-description">Description</label>
            <textarea id="component-description" maxlength="100" placeholder="Describe your component..."></textarea>
          </div>

          <div id="component-specific-options"></div>

          <div class="form-actions">
            <button id="preview-btn" class="btn btn-secondary">Preview</button>
            <button id="submit-btn" class="btn btn-primary" disabled>Submit for Approval</button>
          </div>
        </div>

        <div class="preview-area">
          <div class="preview-container">
            <canvas id="component-preview-canvas"></canvas>
          </div>
        </div>
      </div>
    `;

    this.setupEventListeners();
    this.setupStyles();
  }

  private setupEventListeners(): void {
    // Component type selection
    const typeSelect = this.container.querySelector('#component-type') as HTMLSelectElement;
    typeSelect.addEventListener('change', () => {
      this.setComponentType(typeSelect.value as ComponentType);
    });

    // Name input
    const nameInput = this.container.querySelector('#component-name') as HTMLInputElement;
    nameInput.addEventListener('input', () => {
      this.currentComponent.name = nameInput.value;
      this.updatePreview();
      this.validateComponent();
    });

    // Description input
    const descInput = this.container.querySelector('#component-description') as HTMLTextAreaElement;
    descInput.addEventListener('input', () => {
      this.currentComponent.description = descInput.value;
      this.validateComponent();
    });

    // Buttons
    const previewBtn = this.container.querySelector('#preview-btn')!;
    previewBtn.addEventListener('click', () => this.updatePreview());

    const submitBtn = this.container.querySelector('#submit-btn')!;
    submitBtn.addEventListener('click', () => this.submitComponent());
  }

  private initializeDefaultComponent(): void {
    this.currentComponent = {
      name: '',
      description: '',
      type: undefined,
      data: {},
      authorUid: 'current_user',
      createdAt: Date.now(),
    };
  }

  private updateUI(): void {
    const specificOptions = this.container.querySelector('#component-specific-options')!;
    
    if (!this.currentComponent.type) {
      specificOptions.innerHTML = '';
      return;
    }

    // Add type-specific options
    switch (this.currentComponent.type) {
      case 'glass':
        this.setupGlassOptions(specificOptions);
        break;
      case 'backdrop':
        this.setupBackdropOptions(specificOptions);
        break;
      case 'flavor':
        this.setupFlavorOptions(specificOptions);
        break;
      case 'topping':
        this.setupToppingOptions(specificOptions);
        break;
    }
  }

  private setupGlassOptions(container: Element): void {
    container.innerHTML = `
      <div class="form-section">
        <label>Glass Shape</label>
        <select id="glass-shape">
          <option value="cylinder">Cylinder</option>
          <option value="cone">Cone</option>
          <option value="sphere">Sphere</option>
          <option value="custom">Custom</option>
        </select>
      </div>
      <div class="form-section">
        <label>Glass Color</label>
        <input type="color" id="glass-color" value="#FFFFFF">
      </div>
    `;
  }

  private setupBackdropOptions(container: Element): void {
    container.innerHTML = `
      <div class="form-section">
        <label>Backdrop Image</label>
        <input type="file" id="backdrop-image" accept="image/*">
        <small>Upload an image for your backdrop</small>
      </div>
      <div class="form-section">
        <label>Backdrop Theme</label>
        <select id="backdrop-theme">
          <option value="cozy">Cozy</option>
          <option value="modern">Modern</option>
          <option value="fantasy">Fantasy</option>
          <option value="nature">Nature</option>
        </select>
      </div>
    `;
  }

  private setupFlavorOptions(container: Element): void {
    container.innerHTML = `
      <div class="form-section">
        <label>Flavor Color</label>
        <input type="color" id="flavor-color" value="#FF69B4">
      </div>
      <div class="form-section">
        <label>Flavor Category</label>
        <select id="flavor-category">
          <option value="sweet">Sweet</option>
          <option value="sour">Sour</option>
          <option value="bitter">Bitter</option>
          <option value="spicy">Spicy</option>
          <option value="fruity">Fruity</option>
        </select>
      </div>
    `;
  }

  private setupToppingOptions(container: Element): void {
    container.innerHTML = `
      <div class="form-section">
        <label>Topping Shape</label>
        <select id="topping-shape">
          <option value="sphere">Round</option>
          <option value="cube">Square</option>
          <option value="cylinder">Stick</option>
          <option value="star">Star</option>
        </select>
      </div>
      <div class="form-section">
        <label>Topping Color</label>
        <input type="color" id="topping-color" value="#FF0000">
      </div>
    `;
  }

  private updatePreview(): void {
    // Remove existing preview
    if (this.componentPreview) {
      this.scene.remove(this.componentPreview);
    }

    // Create new preview based on component type
    if (this.currentComponent.type) {
      this.componentPreview = this.createComponentPreview();
      if (this.componentPreview) {
        this.scene.add(this.componentPreview);
      }
    }
  }

  private createComponentPreview(): THREE.Group | null {
    const group = new THREE.Group();

    switch (this.currentComponent.type) {
      case 'glass':
        return this.createGlassPreview();
      case 'backdrop':
        return this.createBackdropPreview();
      case 'flavor':
        return this.createFlavorPreview();
      case 'topping':
        return this.createToppingPreview();
      default:
        return null;
    }
  }

  private createGlassPreview(): THREE.Group {
    const group = new THREE.Group();
    const geometry = new THREE.CylinderGeometry(0.4, 0.35, 2, 16);
    const material = new THREE.MeshPhongMaterial({
      color: 0xFFFFFF,
      transparent: true,
      opacity: 0.3,
    });
    const glass = new THREE.Mesh(geometry, material);
    group.add(glass);
    return group;
  }

  private createBackdropPreview(): THREE.Group {
    const group = new THREE.Group();
    const geometry = new THREE.PlaneGeometry(4, 3);
    const material = new THREE.MeshBasicMaterial({ color: 0x888888 });
    const backdrop = new THREE.Mesh(geometry, material);
    group.add(backdrop);
    return group;
  }

  private createFlavorPreview(): THREE.Group {
    const group = new THREE.Group();
    const geometry = new THREE.SphereGeometry(0.2, 16, 16);
    const material = new THREE.MeshPhongMaterial({ color: 0xFF69B4 });
    const flavor = new THREE.Mesh(geometry, material);
    group.add(flavor);
    return group;
  }

  private createToppingPreview(): THREE.Group {
    const group = new THREE.Group();
    const geometry = new THREE.SphereGeometry(0.1, 8, 8);
    const material = new THREE.MeshPhongMaterial({ color: 0xFF0000 });
    const topping = new THREE.Mesh(geometry, material);
    group.add(topping);
    return group;
  }

  private validateComponent(): void {
    const isComplete = this.isComponentComplete(this.currentComponent);
    const submitBtn = this.container.querySelector('#submit-btn') as HTMLButtonElement;
    submitBtn.disabled = !isComplete;
  }

  private isComponentComplete(component: Partial<CustomComponent>): boolean {
    return !!(component.name && component.description && component.type);
  }

  private showError(message: string): void {
    // Show error message to user
    console.error(message);
  }

  private setupStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      .component-creator {
        display: flex;
        height: 100vh;
        font-family: 'Arial', sans-serif;
      }

      .component-creator .side-panel {
        width: 350px;
        padding: 20px;
        background: linear-gradient(135deg, #4B0082, #6A0DAD);
        color: white;
        overflow-y: auto;
      }

      .unlock-message {
        background: rgba(255, 215, 0, 0.2);
        padding: 10px;
        border-radius: 4px;
        border: 1px solid #FFD700;
        color: #FFD700;
        text-align: center;
        margin-bottom: 20px;
      }

      .component-creator .preview-area {
        flex: 1;
        background: linear-gradient(135deg, #1A1A2E, #16213E);
      }
    `;
    document.head.appendChild(style);
  }
}
