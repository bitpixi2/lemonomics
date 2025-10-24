/**
 * Drink Renderer for Bitpixi's Bar
 * 
 * Handles 3D rendering of drinks with different glass types, fill modes,
 * backdrops, toppings, and font rendering for drink names.
 */

import * as THREE from 'three';
import type { Drink, GlassType, BackdropType, FontType, Layer } from '@bitpixis-bar/types';

export interface DrinkRenderOptions {
  position?: THREE.Vector3;
  scale?: number;
  showName?: boolean;
}

export class DrinkRenderer {
  private scene: THREE.Scene;
  private glassModels: Map<GlassType, THREE.Mesh> = new Map();
  private backdropTextures: Map<BackdropType, THREE.Texture> = new Map();
  private textureLoader: THREE.TextureLoader;
  private fontLoader: THREE.FontLoader;
  private fonts: Map<FontType, THREE.Font> = new Map();

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.textureLoader = new THREE.TextureLoader();
    this.fontLoader = new THREE.FontLoader();
    
    this.initializeGlassModels();
    this.loadBackdropTextures();
    this.loadFonts();
  }

  /**
   * Render a complete drink with all components
   */
  renderDrink(drink: Drink, options: DrinkRenderOptions = {}): THREE.Group {
    const drinkGroup = new THREE.Group();
    
    // Set position and scale
    if (options.position) {
      drinkGroup.position.copy(options.position);
    }
    if (options.scale) {
      drinkGroup.scale.setScalar(options.scale);
    }

    // Get glass model
    const glass = this.getGlassModel(drink.glass);
    if (glass) {
      drinkGroup.add(glass.clone());
    }

    // Render drink fill
    const fill = this.renderDrinkFill(drink);
    if (fill) {
      drinkGroup.add(fill);
    }

    // Add toppings
    const toppings = this.renderToppings(drink.toppings, drink.glass);
    if (toppings) {
      drinkGroup.add(toppings);
    }

    // Add drink name if requested
    if (options.showName && drink.name) {
      const nameLabel = this.renderDrinkName(drink.name, drink.font);
      if (nameLabel) {
        nameLabel.position.set(0, this.getGlassHeight(drink.glass) + 1, 0);
        drinkGroup.add(nameLabel);
      }
    }

    return drinkGroup;
  }

  /**
   * Render drink fill based on mix mode
   */
  renderDrinkFill(drink: Drink): THREE.Group | THREE.Mesh | null {
    if (drink.mixMode === 'blend') {
      return this.renderBlendedFill(drink.color || '#FFFFFF', drink.glass);
    } else if (drink.mixMode === 'layered' && drink.layers) {
      return this.renderLayeredFill(drink.layers, drink.glass);
    }
    return null;
  }

  /**
   * Render blended fill with single color
   */
  renderBlendedFill(color: string, glassType: GlassType): THREE.Mesh {
    const geometry = this.getFillGeometry(glassType);
    const material = new THREE.MeshPhongMaterial({
      color: new THREE.Color(color),
      transparent: true,
      opacity: 0.8,
      shininess: 30,
    });

    const fill = new THREE.Mesh(geometry, material);
    fill.position.y = this.getFillOffset(glassType);
    
    return fill;
  }

  /**
   * Render layered fill with multiple colors
   */
  renderLayeredFill(layers: Layer[], glassType: GlassType): THREE.Group {
    const layerGroup = new THREE.Group();
    const totalHeight = this.getFillHeight(glassType);
    
    let currentHeight = 0;
    
    for (const layer of layers) {
      const layerHeight = (totalHeight * layer.percent) / 100;
      const layerGeometry = this.getLayerGeometry(glassType, layerHeight);
      
      const material = new THREE.MeshPhongMaterial({
        color: new THREE.Color(layer.color),
        transparent: true,
        opacity: 0.8,
        shininess: 30,
      });

      const layerMesh = new THREE.Mesh(layerGeometry, material);
      layerMesh.position.y = this.getFillOffset(glassType) + currentHeight + layerHeight / 2;
      
      layerGroup.add(layerMesh);
      currentHeight += layerHeight;
    }

    return layerGroup;
  }

  /**
   * Render toppings on the drink
   */
  renderToppings(toppings: string[], glassType: GlassType): THREE.Group | null {
    if (toppings.length === 0) {
      return null;
    }

    const toppingsGroup = new THREE.Group();
    const rimY = this.getGlassHeight(glassType) / 2;
    const rimRadius = this.getGlassRimRadius(glassType);

    toppings.forEach((topping, index) => {
      const toppingMesh = this.createToppingMesh(topping);
      if (toppingMesh) {
        // Position toppings around the rim
        const angle = (index / toppings.length) * Math.PI * 2;
        const x = Math.cos(angle) * rimRadius * 0.8;
        const z = Math.sin(angle) * rimRadius * 0.8;
        
        toppingMesh.position.set(x, rimY, z);
        toppingsGroup.add(toppingMesh);
      }
    });

    return toppingsGroup;
  }

  /**
   * Render drink name with specified font
   */
  renderDrinkName(name: string, fontType: FontType): THREE.Mesh | null {
    const font = this.fonts.get(fontType);
    if (!font) {
      // Fallback to simple text geometry
      return this.createSimpleTextMesh(name);
    }

    try {
      const textGeometry = new THREE.TextGeometry(name, {
        font: font,
        size: 0.3,
        height: 0.05,
        curveSegments: 12,
        bevelEnabled: true,
        bevelThickness: 0.01,
        bevelSize: 0.01,
        bevelOffset: 0,
        bevelSegments: 5,
      });

      textGeometry.computeBoundingBox();
      const centerOffsetX = textGeometry.boundingBox 
        ? -0.5 * (textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x)
        : 0;

      textGeometry.translate(centerOffsetX, 0, 0);

      const material = this.getTextMaterial(fontType);
      const textMesh = new THREE.Mesh(textGeometry, material);
      
      return textMesh;
    } catch (error) {
      console.warn('Failed to create text geometry:', error);
      return this.createSimpleTextMesh(name);
    }
  }

  /**
   * Set backdrop for the scene
   */
  setBackdrop(backdrop: BackdropType): void {
    const texture = this.backdropTextures.get(backdrop);
    if (texture) {
      // Create backdrop plane
      const geometry = new THREE.PlaneGeometry(20, 15);
      const material = new THREE.MeshBasicMaterial({ 
        map: texture,
        transparent: true,
      });
      
      const backdropMesh = new THREE.Mesh(geometry, material);
      backdropMesh.position.set(0, 0, -10);
      backdropMesh.name = 'backdrop';
      
      // Remove existing backdrop
      const existingBackdrop = this.scene.getObjectByName('backdrop');
      if (existingBackdrop) {
        this.scene.remove(existingBackdrop);
      }
      
      this.scene.add(backdropMesh);
    }
  }

  // Private helper methods

  /**
   * Initialize glass models for all glass types
   */
  private initializeGlassModels(): void {
    // Tall glass
    const tallGeometry = new THREE.CylinderGeometry(0.4, 0.35, 2, 16);
    const tallMaterial = new THREE.MeshPhongMaterial({
      color: 0xFFFFFF,
      transparent: true,
      opacity: 0.2,
      shininess: 100,
    });
    this.glassModels.set('tall', new THREE.Mesh(tallGeometry, tallMaterial));

    // Short glass
    const shortGeometry = new THREE.CylinderGeometry(0.45, 0.4, 1.2, 16);
    const shortMaterial = tallMaterial.clone();
    this.glassModels.set('short', new THREE.Mesh(shortGeometry, shortMaterial));

    // Mug
    const mugGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1.5, 16);
    const mugMaterial = new THREE.MeshPhongMaterial({
      color: 0xF5F5DC, // Beige
      transparent: true,
      opacity: 0.9,
    });
    this.glassModels.set('mug', new THREE.Mesh(mugGeometry, mugMaterial));

    // Potion bottle
    const potionGeometry = new THREE.SphereGeometry(0.4, 16, 16);
    potionGeometry.scale(1, 1.5, 1); // Stretch vertically
    const potionMaterial = new THREE.MeshPhongMaterial({
      color: 0x8A2BE2, // Blue violet
      transparent: true,
      opacity: 0.3,
      shininess: 100,
    });
    this.glassModels.set('potion', new THREE.Mesh(potionGeometry, potionMaterial));

    // Martini glass
    const martiniGeometry = new THREE.ConeGeometry(0.6, 1.5, 16);
    const martiniMaterial = tallMaterial.clone();
    this.glassModels.set('martini', new THREE.Mesh(martiniGeometry, martiniMaterial));
  }

  /**
   * Load backdrop textures
   */
  private loadBackdropTextures(): void {
    const backdrops: BackdropType[] = ['counter', 'neon', 'pumpkin_night', 'snow_window'];
    
    backdrops.forEach(backdrop => {
      this.textureLoader.load(
        `/backdrops/${backdrop}.jpg`,
        (texture) => {
          this.backdropTextures.set(backdrop, texture);
        },
        undefined,
        (error) => {
          console.warn(`Failed to load backdrop texture: ${backdrop}`, error);
          // Create fallback colored backdrop
          const canvas = document.createElement('canvas');
          canvas.width = canvas.height = 256;
          const ctx = canvas.getContext('2d')!;
          
          const colors = {
            counter: '#8B4513',
            neon: '#FF00FF',
            pumpkin_night: '#FF4500',
            snow_window: '#E0E0E0',
          };
          
          ctx.fillStyle = colors[backdrop];
          ctx.fillRect(0, 0, 256, 256);
          
          const fallbackTexture = new THREE.CanvasTexture(canvas);
          this.backdropTextures.set(backdrop, fallbackTexture);
        }
      );
    });
  }

  /**
   * Load fonts for text rendering
   */
  private loadFonts(): void {
    // For now, we'll use a simple approach without loading external fonts
    // In a full implementation, you would load actual font files
    const fontTypes: FontType[] = ['script', 'serif', 'sans-serif', 'decorative', 'handwritten'];
    
    fontTypes.forEach(fontType => {
      // Placeholder - would load actual font files
      // this.fontLoader.load(`/fonts/${fontType}.json`, (font) => {
      //   this.fonts.set(fontType, font);
      // });
    });
  }

  /**
   * Get glass model by type
   */
  private getGlassModel(glassType: GlassType): THREE.Mesh | undefined {
    return this.glassModels.get(glassType);
  }

  /**
   * Get fill geometry for glass type
   */
  private getFillGeometry(glassType: GlassType): THREE.BufferGeometry {
    switch (glassType) {
      case 'tall':
        return new THREE.CylinderGeometry(0.38, 0.33, 1.8, 16);
      case 'short':
        return new THREE.CylinderGeometry(0.43, 0.38, 1.0, 16);
      case 'mug':
        return new THREE.CylinderGeometry(0.48, 0.48, 1.3, 16);
      case 'potion':
        const sphere = new THREE.SphereGeometry(0.38, 16, 16);
        sphere.scale(1, 1.3, 1);
        return sphere;
      case 'martini':
        return new THREE.ConeGeometry(0.58, 1.3, 16);
      default:
        return new THREE.CylinderGeometry(0.38, 0.33, 1.8, 16);
    }
  }

  /**
   * Get layer geometry for specific height
   */
  private getLayerGeometry(glassType: GlassType, height: number): THREE.BufferGeometry {
    switch (glassType) {
      case 'tall':
        return new THREE.CylinderGeometry(0.38, 0.33, height, 16);
      case 'short':
        return new THREE.CylinderGeometry(0.43, 0.38, height, 16);
      case 'mug':
        return new THREE.CylinderGeometry(0.48, 0.48, height, 16);
      case 'potion':
        const sphere = new THREE.SphereGeometry(0.38, 16, 16);
        sphere.scale(1, height / 1.0, 1);
        return sphere;
      case 'martini':
        return new THREE.ConeGeometry(0.58, height, 16);
      default:
        return new THREE.CylinderGeometry(0.38, 0.33, height, 16);
    }
  }

  /**
   * Get fill offset (Y position) for glass type
   */
  private getFillOffset(glassType: GlassType): number {
    switch (glassType) {
      case 'tall':
        return -0.9;
      case 'short':
        return -0.5;
      case 'mug':
        return -0.65;
      case 'potion':
        return -0.6;
      case 'martini':
        return -0.65;
      default:
        return -0.9;
    }
  }

  /**
   * Get fill height for glass type
   */
  private getFillHeight(glassType: GlassType): number {
    switch (glassType) {
      case 'tall':
        return 1.8;
      case 'short':
        return 1.0;
      case 'mug':
        return 1.3;
      case 'potion':
        return 1.2;
      case 'martini':
        return 1.3;
      default:
        return 1.8;
    }
  }

  /**
   * Get glass height for positioning
   */
  private getGlassHeight(glassType: GlassType): number {
    switch (glassType) {
      case 'tall':
        return 2.0;
      case 'short':
        return 1.2;
      case 'mug':
        return 1.5;
      case 'potion':
        return 1.2;
      case 'martini':
        return 1.5;
      default:
        return 2.0;
    }
  }

  /**
   * Get glass rim radius for topping placement
   */
  private getGlassRimRadius(glassType: GlassType): number {
    switch (glassType) {
      case 'tall':
        return 0.4;
      case 'short':
        return 0.45;
      case 'mug':
        return 0.5;
      case 'potion':
        return 0.4;
      case 'martini':
        return 0.6;
      default:
        return 0.4;
    }
  }

  /**
   * Create topping mesh
   */
  private createToppingMesh(topping: string): THREE.Mesh | null {
    // Simple topping representations
    const toppingGeometry = new THREE.SphereGeometry(0.05, 8, 8);
    let material: THREE.Material;

    switch (topping) {
      case 'whipped_cream':
        material = new THREE.MeshPhongMaterial({ color: 0xFFFFF0 }); // Ivory
        break;
      case 'sprinkles':
        material = new THREE.MeshPhongMaterial({ color: 0xFF69B4 }); // Hot pink
        break;
      case 'cherry':
        material = new THREE.MeshPhongMaterial({ color: 0xFF0000 }); // Red
        break;
      case 'foam_art':
        material = new THREE.MeshPhongMaterial({ color: 0xF5F5DC }); // Beige
        break;
      case 'cinnamon_stick':
        material = new THREE.MeshPhongMaterial({ color: 0xD2691E }); // Chocolate
        const stickGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.3, 8);
        return new THREE.Mesh(stickGeometry, material);
      default:
        material = new THREE.MeshPhongMaterial({ color: 0xFFFFFF });
    }

    return new THREE.Mesh(toppingGeometry, material);
  }

  /**
   * Get text material for font type
   */
  private getTextMaterial(fontType: FontType): THREE.Material {
    const colors = {
      script: 0xFF69B4,     // Hot pink
      serif: 0x8B4513,      // Saddle brown
      'sans-serif': 0x000000, // Black
      decorative: 0xFF4500,  // Orange red
      handwritten: 0x4B0082, // Indigo
    };

    return new THREE.MeshPhongMaterial({
      color: colors[fontType] || 0x000000,
    });
  }

  /**
   * Create simple text mesh fallback
   */
  private createSimpleTextMesh(text: string): THREE.Mesh {
    // Create a simple plane with text texture as fallback
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#000000';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2 + 16);
    
    const texture = new THREE.CanvasTexture(canvas);
    const geometry = new THREE.PlaneGeometry(2, 0.5);
    const material = new THREE.MeshBasicMaterial({ 
      map: texture,
      transparent: true,
    });
    
    return new THREE.Mesh(geometry, material);
  }
}
