/**
 * Scene Manager for Bitpixi's Bar
 * 
 * Manages the three main scenes: bar view, mixing view, and component design view.
 * Handles smooth transitions and camera movements between scenes.
 */

import * as THREE from 'three';
import type { FeaturedDrink } from '@bitpixis-bar/types';

export type ViewType = 'bar' | 'mixing' | 'component-design';

export interface SceneTransition {
  from: ViewType;
  to: ViewType;
  duration: number;
  onComplete?: () => void;
}

export class SceneManager {
  private renderer: THREE.WebGLRenderer;
  private currentView: ViewType = 'bar';
  private isTransitioning = false;

  // Scenes
  private barScene: THREE.Scene;
  private mixingScene: THREE.Scene;
  private componentDesignScene: THREE.Scene;

  // Cameras
  private barCamera: THREE.PerspectiveCamera;
  private mixingCamera: THREE.PerspectiveCamera;
  private designCamera: THREE.PerspectiveCamera;

  // Featured drinks display
  private featuredDrinksDisplay: THREE.Group;
  private defaultFeaturedDrinks: FeaturedDrink[] = [];

  // Animation
  private clock: THREE.Clock;
  private animationId: number | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.clock = new THREE.Clock();
    
    // Initialize renderer
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      canvas,
      alpha: true 
    });
    this.renderer.setPixelRatio(window.devicePixelRatio ?? 1);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x2C1810, 1); // Cozy brown background
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Initialize scenes
    this.barScene = this.createBarScene();
    this.mixingScene = this.createMixingScene();
    this.componentDesignScene = this.createComponentDesignScene();

    // Initialize cameras
    this.barCamera = this.createBarCamera();
    this.mixingCamera = this.createMixingCamera();
    this.designCamera = this.createDesignCamera();

    // Set up featured drinks display
    this.featuredDrinksDisplay = new THREE.Group();
    this.barScene.add(this.featuredDrinksDisplay);

    // Handle window resize
    window.addEventListener('resize', this.handleResize.bind(this));

    // Start animation loop
    this.startAnimation();
  }

  /**
   * Get current view type
   */
  getCurrentView(): ViewType {
    return this.currentView;
  }

  /**
   * Check if currently transitioning
   */
  getIsTransitioning(): boolean {
    return this.isTransitioning;
  }

  /**
   * Transition to a different view
   */
  async transitionTo(view: ViewType, duration = 1000): Promise<void> {
    if (this.isTransitioning || this.currentView === view) {
      return;
    }

    this.isTransitioning = true;

    try {
      await this.performTransition({
        from: this.currentView,
        to: view,
        duration,
      });

      this.currentView = view;
    } finally {
      this.isTransitioning = false;
    }
  }

  /**
   * Update featured drinks display
   */
  updateFeaturedDisplay(drinks: FeaturedDrink[]): void {
    // Clear existing display
    this.featuredDrinksDisplay.clear();

    // Add up to 3 featured drinks behind the bartender
    const drinksToShow = drinks.slice(0, 3);
    
    for (let i = 0; i < drinksToShow.length; i++) {
      const drink = drinksToShow[i];
      const drinkMesh = this.createFeaturedDrinkMesh(drink, i);
      this.featuredDrinksDisplay.add(drinkMesh);
    }

    // If no drinks provided, show defaults
    if (drinksToShow.length === 0) {
      this.showDefaultFeaturedDrinks();
    }
  }

  /**
   * Get current scene and camera
   */
  getCurrentSceneAndCamera(): { scene: THREE.Scene; camera: THREE.PerspectiveCamera } {
    switch (this.currentView) {
      case 'mixing':
        return { scene: this.mixingScene, camera: this.mixingCamera };
      case 'component-design':
        return { scene: this.componentDesignScene, camera: this.designCamera };
      default:
        return { scene: this.barScene, camera: this.barCamera };
    }
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }

    this.renderer.dispose();
    window.removeEventListener('resize', this.handleResize.bind(this));
  }

  // Private methods

  /**
   * Create the bar scene (zoomed out view)
   */
  private createBarScene(): THREE.Scene {
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x2C1810, 50, 200);

    // Ambient lighting for cozy atmosphere
    const ambientLight = new THREE.AmbientLight(0xFFE4B5, 0.4); // Warm ambient
    scene.add(ambientLight);

    // Main bar lighting
    const barLight = new THREE.DirectionalLight(0xFFD700, 0.8); // Golden light
    barLight.position.set(10, 20, 10);
    barLight.castShadow = true;
    barLight.shadow.mapSize.width = 2048;
    barLight.shadow.mapSize.height = 2048;
    scene.add(barLight);

    // Accent lighting
    const accentLight = new THREE.PointLight(0xFF6B35, 0.3, 30); // Orange accent
    accentLight.position.set(-5, 5, 5);
    scene.add(accentLight);

    // Create bar environment
    this.createBarEnvironment(scene);

    return scene;
  }

  /**
   * Create the mixing scene (zoomed in view)
   */
  private createMixingScene(): THREE.Scene {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1A1A1A); // Dark background for focus

    // Focused lighting for drink creation
    const mainLight = new THREE.DirectionalLight(0xFFFFFF, 1.0);
    mainLight.position.set(0, 10, 5);
    mainLight.castShadow = true;
    scene.add(mainLight);

    const fillLight = new THREE.AmbientLight(0x404040, 0.3);
    scene.add(fillLight);

    // Create mixing table environment
    this.createMixingEnvironment(scene);

    return scene;
  }

  /**
   * Create the component design scene
   */
  private createComponentDesignScene(): THREE.Scene {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x2A2A2A); // Neutral background

    // Even lighting for design work
    const mainLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
    mainLight.position.set(5, 10, 5);
    scene.add(mainLight);

    const ambientLight = new THREE.AmbientLight(0x606060, 0.4);
    scene.add(ambientLight);

    // Create design environment
    this.createDesignEnvironment(scene);

    return scene;
  }

  /**
   * Create bar camera (wide view)
   */
  private createBarCamera(): THREE.PerspectiveCamera {
    const camera = new THREE.PerspectiveCamera(
      60, // FOV
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    
    camera.position.set(0, 5, 15); // Positioned to see the whole bar
    camera.lookAt(0, 0, 0);
    
    return camera;
  }

  /**
   * Create mixing camera (close-up view)
   */
  private createMixingCamera(): THREE.PerspectiveCamera {
    const camera = new THREE.PerspectiveCamera(
      45, // Narrower FOV for focus
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    
    camera.position.set(0, 2, 8); // Close to the mixing area
    camera.lookAt(0, 0, 0);
    
    return camera;
  }

  /**
   * Create design camera
   */
  private createDesignCamera(): THREE.PerspectiveCamera {
    const camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    
    camera.position.set(0, 3, 10);
    camera.lookAt(0, 0, 0);
    
    return camera;
  }

  /**
   * Create bar environment (counter, bartender area, etc.)
   */
  private createBarEnvironment(scene: THREE.Scene): void {
    // Bar counter
    const counterGeometry = new THREE.BoxGeometry(20, 1, 4);
    const counterMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 }); // Saddle brown
    const counter = new THREE.Mesh(counterGeometry, counterMaterial);
    counter.position.set(0, -2, -5);
    counter.receiveShadow = true;
    scene.add(counter);

    // Back wall
    const wallGeometry = new THREE.PlaneGeometry(25, 15);
    const wallMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 }); // Dark brown
    const wall = new THREE.Mesh(wallGeometry, wallMaterial);
    wall.position.set(0, 3, -10);
    wall.receiveShadow = true;
    scene.add(wall);

    // Floor
    const floorGeometry = new THREE.PlaneGeometry(30, 30);
    const floorMaterial = new THREE.MeshLambertMaterial({ color: 0x4A4A4A }); // Dark gray
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -3;
    floor.receiveShadow = true;
    scene.add(floor);

    // Bartender area placeholder
    const bartenderGeometry = new THREE.CylinderGeometry(1, 1, 4);
    const bartenderMaterial = new THREE.MeshLambertMaterial({ color: 0xFF69B4 }); // Pink for Bitpixi
    const bartender = new THREE.Mesh(bartenderGeometry, bartenderMaterial);
    bartender.position.set(0, 0, -8);
    bartender.castShadow = true;
    scene.add(bartender);
  }

  /**
   * Create mixing environment (table, tools, etc.)
   */
  private createMixingEnvironment(scene: THREE.Scene): void {
    // Mixing table
    const tableGeometry = new THREE.CylinderGeometry(3, 3, 0.2);
    const tableMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const table = new THREE.Mesh(tableGeometry, tableMaterial);
    table.position.set(0, -1, 0);
    table.receiveShadow = true;
    scene.add(table);

    // Table surface details will be added by drink renderer
  }

  /**
   * Create design environment
   */
  private createDesignEnvironment(scene: THREE.Scene): void {
    // Design workspace
    const workspaceGeometry = new THREE.BoxGeometry(6, 0.1, 4);
    const workspaceMaterial = new THREE.MeshLambertMaterial({ color: 0xCCCCCC });
    const workspace = new THREE.Mesh(workspaceGeometry, workspaceMaterial);
    workspace.position.set(0, -1, 0);
    scene.add(workspace);
  }

  /**
   * Create featured drink mesh for display
   */
  private createFeaturedDrinkMesh(drink: FeaturedDrink, index: number): THREE.Group {
    const drinkGroup = new THREE.Group();

    // Simple glass representation for now
    const glassGeometry = new THREE.CylinderGeometry(0.3, 0.25, 1);
    const glassMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xFFFFFF, 
      transparent: true, 
      opacity: 0.3 
    });
    const glass = new THREE.Mesh(glassGeometry, glassMaterial);

    // Position drinks behind bartender
    const xOffset = (index - 1) * 2; // Spread drinks horizontally
    drinkGroup.position.set(xOffset, 1, -7);
    
    drinkGroup.add(glass);

    // Add drink name label (simplified)
    // In a full implementation, this would use HTML overlay or texture
    
    return drinkGroup;
  }

  /**
   * Show default featured drinks
   */
  private showDefaultFeaturedDrinks(): void {
    // Create 3 default drink representations
    const defaultDrinks = [
      { name: 'Pink Sparkle Dream', color: 0xFFB6C1 },
      { name: 'Midnight Witch Brew', color: 0x2F1B14 },
      { name: 'Neon Circuit Surge', color: 0x00FFFF },
    ];

    for (let i = 0; i < defaultDrinks.length; i++) {
      const drinkGroup = new THREE.Group();
      
      const glassGeometry = new THREE.CylinderGeometry(0.3, 0.25, 1);
      const glassMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xFFFFFF, 
        transparent: true, 
        opacity: 0.3 
      });
      const glass = new THREE.Mesh(glassGeometry, glassMaterial);

      const liquidGeometry = new THREE.CylinderGeometry(0.28, 0.23, 0.8);
      const liquidMaterial = new THREE.MeshPhongMaterial({ 
        color: defaultDrinks[i].color,
        transparent: true,
        opacity: 0.8
      });
      const liquid = new THREE.Mesh(liquidGeometry, liquidMaterial);
      liquid.position.y = -0.1;

      const xOffset = (i - 1) * 2;
      drinkGroup.position.set(xOffset, 1, -7);
      
      drinkGroup.add(glass);
      drinkGroup.add(liquid);
      
      this.featuredDrinksDisplay.add(drinkGroup);
    }
  }

  /**
   * Perform smooth transition between views
   */
  private async performTransition(transition: SceneTransition): Promise<void> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const { from, to, duration } = transition;

      const fromCamera = this.getCameraForView(from);
      const toCamera = this.getCameraForView(to);

      const startPosition = fromCamera.position.clone();
      const endPosition = toCamera.position.clone();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Smooth easing function
        const easeProgress = 1 - Math.pow(1 - progress, 3);

        // Interpolate camera position
        fromCamera.position.lerpVectors(startPosition, endPosition, easeProgress);
        fromCamera.lookAt(0, 0, 0);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          transition.onComplete?.();
          resolve();
        }
      };

      animate();
    });
  }

  /**
   * Get camera for specific view
   */
  private getCameraForView(view: ViewType): THREE.PerspectiveCamera {
    switch (view) {
      case 'mixing':
        return this.mixingCamera;
      case 'component-design':
        return this.designCamera;
      default:
        return this.barCamera;
    }
  }

  /**
   * Handle window resize
   */
  private handleResize(): void {
    const { innerWidth, innerHeight } = window;
    
    // Update all cameras
    [this.barCamera, this.mixingCamera, this.designCamera].forEach(camera => {
      camera.aspect = innerWidth / innerHeight;
      camera.updateProjectionMatrix();
    });

    this.renderer.setSize(innerWidth, innerHeight);
  }

  /**
   * Start animation loop
   */
  private startAnimation(): void {
    const animate = () => {
      this.animationId = requestAnimationFrame(animate);
      
      const { scene, camera } = this.getCurrentSceneAndCamera();
      
      // Add subtle animations (floating drinks, ambient movement)
      const time = this.clock.getElapsedTime();
      
      // Animate featured drinks (gentle floating)
      this.featuredDrinksDisplay.children.forEach((drink, index) => {
        drink.position.y = 1 + Math.sin(time + index) * 0.1;
        drink.rotation.y = time * 0.2 + index;
      });

      this.renderer.render(scene, camera);
    };

    animate();
  }
}
