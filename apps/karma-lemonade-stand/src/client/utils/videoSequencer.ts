// Video sequencing logic for Lemonomics game flow
import { VideoAsset, VIDEO_ASSETS } from '../../shared/types/video.js';
import { WeatherType } from '../../shared/types/game.js';

export type GamePhase = 'intro' | 'ingredients' | 'customers' | 'loading-results' | 'results' | 'leaderboard';

export interface SequenceStep {
  phase: GamePhase;
  video: VideoAsset;
  allowSkip: boolean;
  showUI: boolean;
  autoAdvance?: boolean;
  fadeTransition?: boolean;
  loop?: boolean;
}

export class VideoSequencer {
  private currentSequence: SequenceStep[] = [];
  private currentStepIndex: number = 0;

  /**
   * Create a complete game day sequence
   */
  createDaySequence(weather: WeatherType): SequenceStep[] {
    return [
      {
        phase: 'ingredients',
        video: VIDEO_ASSETS.ingredients[weather],
        allowSkip: false,
        showUI: true, // Show ingredient selection UI overlay
        autoAdvance: false, // Wait for user to complete ingredient selection
        fadeTransition: true,
        loop: true // Loop the ingredients video while user selects ingredients
      },
      {
        phase: 'customers',
        video: VIDEO_ASSETS.customers[weather],
        allowSkip: false,
        showUI: false, // Just watch the customer video
        autoAdvance: true, // Automatically advance when video ends
        fadeTransition: true,
        loop: false
      },
      {
        phase: 'loading-results',
        video: VIDEO_ASSETS.loadingResults[weather],
        allowSkip: false,
        showUI: false, // Watch loading animation
        autoAdvance: true, // Automatically advance when video ends
        fadeTransition: true,
        loop: false
      },
      {
        phase: 'results',
        video: VIDEO_ASSETS.results[weather],
        allowSkip: false,
        showUI: true, // Show day results and navigation buttons
        autoAdvance: false, // Wait for user to choose next action
        fadeTransition: true,
        loop: false
      }
    ];
  }

  /**
   * Create intro sequence (weather-specific)
   */
  createIntroSequence(weather: WeatherType): SequenceStep[] {
    return [
      {
        phase: 'intro',
        video: VIDEO_ASSETS.intro[weather],
        allowSkip: true,
        showUI: false, // Show "Start Game" button after video
        autoAdvance: true, // Show start button when video ends
        fadeTransition: true,
        loop: false
      }
    ];
  }

  /**
   * Create leaderboard sequence
   */
  createLeaderboardSequence(): SequenceStep[] {
    return [
      {
        phase: 'leaderboard',
        video: VIDEO_ASSETS.leaderboard['leaderboard-screen'],
        allowSkip: true,
        showUI: true, // Show leaderboard UI overlay
        autoAdvance: false, // Stay on leaderboard until user action
        fadeTransition: true,
        loop: true // Loop background video
      }
    ];
  }

  /**
   * Start a new sequence
   */
  startSequence(sequence: SequenceStep[]): void {
    this.currentSequence = sequence;
    this.currentStepIndex = 0;
  }

  /**
   * Get the current step in the sequence
   */
  getCurrentStep(): SequenceStep | null {
    if (this.currentStepIndex >= this.currentSequence.length) {
      return null;
    }
    return this.currentSequence[this.currentStepIndex] || null;
  }

  /**
   * Move to the next step in the sequence
   */
  nextStep(): SequenceStep | null {
    this.currentStepIndex++;
    return this.getCurrentStep();
  }

  /**
   * Check if the sequence is complete
   */
  isSequenceComplete(): boolean {
    return this.currentStepIndex >= this.currentSequence.length;
  }

  /**
   * Skip to a specific step (if allowed)
   */
  skipToStep(stepIndex: number): SequenceStep | null {
    if (stepIndex >= 0 && stepIndex < this.currentSequence.length) {
      const step = this.currentSequence[stepIndex];
      if (step && step.allowSkip) {
        this.currentStepIndex = stepIndex;
        return step;
      }
    }
    return null;
  }

  /**
   * Get the current step index
   */
  getCurrentStepIndex(): number {
    return this.currentStepIndex;
  }

  /**
   * Get the total number of steps in the current sequence
   */
  getTotalSteps(): number {
    return this.currentSequence.length;
  }

  /**
   * Reset the sequencer
   */
  reset(): void {
    this.currentSequence = [];
    this.currentStepIndex = 0;
  }

  /**
   * Get sequence progress as a percentage
   */
  getProgress(): number {
    if (this.currentSequence.length === 0) return 0;
    return (this.currentStepIndex / this.currentSequence.length) * 100;
  }

  /**
   * Check if current step allows skipping
   */
  canSkipCurrentStep(): boolean {
    const currentStep = this.getCurrentStep();
    return currentStep?.allowSkip || false;
  }

  /**
   * Check if current step should auto-advance
   */
  shouldAutoAdvance(): boolean {
    const currentStep = this.getCurrentStep();
    return currentStep?.autoAdvance || false;
  }

  /**
   * Get the next step without advancing
   */
  peekNextStep(): SequenceStep | null {
    const nextIndex = this.currentStepIndex + 1;
    if (nextIndex >= this.currentSequence.length) {
      return null;
    }
    return this.currentSequence[nextIndex] || null;
  }

  /**
   * Force advance to next step (ignores allowSkip)
   */
  forceNextStep(): SequenceStep | null {
    this.currentStepIndex++;
    return this.getCurrentStep();
  }
}
