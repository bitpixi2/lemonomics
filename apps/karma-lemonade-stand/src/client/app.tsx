import React, { useState, useEffect, useRef } from 'react';
import { context as devvitContext, navigateTo } from '@devvit/web/client';
import type {
  DailySpinResponse,
  DayResult,
  GamePhase,
  GameSaveResponse,
  GameState,
  SavedGame,
} from '../shared/types/api';
import { DAILY_SPIN_CHALLENGES } from '../shared/types/api';
import { useSupportPurchase } from './hooks/useSupportPurchase';

const SPIN_SETTLE_MILLISECONDS = 1650;
const CONFETTI_COLORS = ['#facc15', '#fb923c', '#10b981', '#38bdf8', '#f472b6'];
const CONFETTI_PIECES = Array.from({ length: 28 }, (_, index) => ({
  id: index,
  color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
  left: 8 + ((index * 37) % 84),
  delay: (index % 7) * 45,
  duration: 900 + (index % 5) * 90,
  drift: -110 + ((index * 53) % 220),
  rotation: 240 + ((index * 83) % 420),
}));

const waitForNextPaint = () =>
  new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => resolve()));
  });

interface KarmaBoost {
  multiplier: number;
  level: string;
  description: string;
  totalKarma: number;
}

interface FlairReward {
  day: number;
  flairId: string;
  name: string;
  description: string;
}

interface FlairCheckResponse {
  type: 'flair-check';
  awarded: boolean;
  flair?: FlairReward;
  message: string;
}

interface LeaderboardEntry {
  username: string;
  day: number;
  assets: number;
  lastUpdated: string;
}

export const App: React.FC = () => {
  const [phase, setPhase] = useState<GamePhase>('intro');
  const [gameState, setGameState] = useState<GameState>({
    day: 0,
    cash: 2.0,
    glasses: 0,
    signs: 0,
    price: 0,
    weather: 'sunny',
    assets: 2.0,
    bankrupt: false,
  });
  const [dayResult, setDayResult] = useState<DayResult | null>(null);
  const [inputs, setInputs] = useState({
    glasses: '',
    sugar: '',
    signs: '',
    price: '',
  });
  const [karmaBoost, setKarmaBoost] = useState<KarmaBoost>({
    multiplier: 1.0,
    level: 'none',
    description: 'Loading karma boost...',
    totalKarma: 0,
  });
  const [flairNotification, setFlairNotification] = useState<FlairCheckResponse | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const dailySpinDialogRef = useRef<HTMLElement | null>(null);
  const dailySpinTriggerRef = useRef<HTMLButtonElement | null>(null);
  const dailySpinWheelRef = useRef<HTMLDivElement | null>(null);
  const wasDailySpinOpenRef = useRef(false);
  const confettiTimeoutRef = useRef<number | null>(null);

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [savedGame, setSavedGame] = useState<SavedGame | null>(null);
  const [isLoadingSave, setIsLoadingSave] = useState(true);
  const [dailySpin, setDailySpin] = useState<DailySpinResponse | null>(null);
  const [isDailySpinOpen, setIsDailySpinOpen] = useState(false);
  const [isLoadingDailySpin, setIsLoadingDailySpin] = useState(true);
  const [isSpinning, setIsSpinning] = useState(false);
  const [isWheelSettling, setIsWheelSettling] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [showSpinConfetti, setShowSpinConfetti] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [dailySpinMessage, setDailySpinMessage] = useState('');
  const {
    supporter,
    loading: supporterLoading,
    purchasing,
    resetting,
    canResetTestSupporter,
    message,
    supportApp,
    resetTestSupporter,
  } = useSupportPurchase();
  const isWheelIdling =
    isDailySpinOpen &&
    !prefersReducedMotion &&
    !dailySpin?.challenge &&
    !isLoadingDailySpin &&
    !isWheelSettling &&
    dailySpin?.signedIn !== false;

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setPrefersReducedMotion(query.matches);
    updatePreference();
    query.addEventListener('change', updatePreference);
    return () => query.removeEventListener('change', updatePreference);
  }, []);

  useEffect(
    () => () => {
      if (confettiTimeoutRef.current !== null) {
        window.clearTimeout(confettiTimeoutRef.current);
      }
    },
    []
  );

  useEffect(() => {
    if (import.meta.env.DEV) {
      setIsLoadingSave(false);
      return;
    }

    const fetchSavedGame = async () => {
      try {
        const response = await fetch('/api/game-save');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data: GameSaveResponse = await response.json();
        setSavedGame(data.saved ? data.game : null);
      } catch {
        // The Devvit API is intentionally unavailable in a local Vite-only preview.
        setSavedGame(null);
      } finally {
        setIsLoadingSave(false);
      }
    };

    void fetchSavedGame();
  }, []);

  useEffect(() => {
    if (import.meta.env.DEV) {
      setDailySpin({
        type: 'daily-spin',
        date: new Date().toISOString().slice(0, 10),
        signedIn: true,
        spun: false,
      });
      setIsLoadingDailySpin(false);
      return;
    }

    const fetchDailySpin = async () => {
      try {
        const response = await fetch('/api/daily-spin');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data: DailySpinResponse = await response.json();
        setDailySpin(data);

        if (data.challenge) {
          const challengeIndex = DAILY_SPIN_CHALLENGES.findIndex(
            (challenge) => challenge.id === data.challenge?.id
          );
          if (challengeIndex >= 0) setWheelRotation(-challengeIndex * 90);
        }
      } catch {
        setDailySpin(null);
      } finally {
        setIsLoadingDailySpin(false);
      }
    };

    void fetchDailySpin();
  }, []);

  const persistGame = async (
    nextPhase: Exclude<GamePhase, 'intro'>,
    nextState: GameState,
    nextResult: DayResult | null
  ) => {
    const game: SavedGame = {
      phase: nextPhase,
      gameState: nextState,
      dayResult: nextResult,
      savedAt: new Date().toISOString(),
    };

    setSavedGame(game);

    if (import.meta.env.DEV) return;

    try {
      await fetch('/api/game-save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(game),
      });
    } catch {
      // Local previews still retain the in-memory state for the current session.
    }
  };

  const fetchKarmaBoost = async () => {
    if (import.meta.env.DEV) return;

    try {
      const response = await fetch('/api/karma-boost');
      if (response.ok && response.headers.get('content-type')?.includes('application/json')) {
        const data = await response.json();
        setKarmaBoost(data);
      }
    } catch (error) {
      console.warn('Failed to fetch karma boost:', error);
    }
  };

  const checkForFlairReward = async (currentDay: number) => {
    if (import.meta.env.DEV) return;

    try {
      const response = await fetch('/api/check-flair', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ currentDay }),
      });

      if (response.ok) {
        const data: FlairCheckResponse = await response.json();
        if (data.awarded) {
          setFlairNotification(data);
        }
      }
    } catch (error) {
      console.warn('Failed to check flair reward:', error);
    }
  };

  const updateProgress = async (day: number, assets: number) => {
    if (import.meta.env.DEV) return;

    try {
      await fetch('/api/update-progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ day, assets }),
      });
    } catch (error) {
      console.warn('Failed to update progress:', error);
    }
  };

  const fetchLeaderboard = async () => {
    if (import.meta.env.DEV) return;

    try {
      const response = await fetch('/api/leaderboard');
      if (response.ok && response.headers.get('content-type')?.includes('application/json')) {
        const data = await response.json();
        setLeaderboard(data.topPlayers || []);
      }
    } catch (error) {
      console.warn('Failed to fetch leaderboard:', error);
    }
  };

  // Audio initialization and control
  useEffect(() => {
    // Initialize audio
    audioRef.current = new Audio('/lemonomics-theme-music.mp3');
    audioRef.current.loop = true;
    audioRef.current.volume = 0.3;

    audioRef.current.addEventListener('canplay', () => {
      console.log('Music loaded successfully!');
    });

    audioRef.current.addEventListener('error', (e) => {
      console.error('Music error:', e);
    });

    // Cleanup on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Fetch leaderboard when showing results
  useEffect(() => {
    if (phase === 'results') {
      void fetchLeaderboard();
    }
  }, [phase]);

  useEffect(() => {
    window.render_game_to_text = () =>
      JSON.stringify({
        coordinateSystem: 'DOM layout; top-left origin; x increases right and y increases down',
        phase,
        gameState,
        inputs,
        dayResult,
        karmaBoost,
        supporter,
        canResetTestSupporter,
        savedRunAvailable: savedGame !== null,
        dailySpin: {
          open: isDailySpinOpen,
          loading: isLoadingDailySpin,
          spinning: isSpinning,
          idleSpinning: isWheelIdling,
          settling: isWheelSettling,
          celebrating: showSpinConfetti,
          spun: dailySpin?.spun ?? false,
          challenge: dailySpin?.challenge ?? null,
        },
      });
    window.advanceTime = async () => undefined;

    return () => {
      delete window.render_game_to_text;
      delete window.advanceTime;
    };
  }, [
    dailySpin,
    canResetTestSupporter,
    dayResult,
    gameState,
    inputs,
    isDailySpinOpen,
    isLoadingDailySpin,
    isSpinning,
    isWheelIdling,
    isWheelSettling,
    karmaBoost,
    phase,
    savedGame,
    showSpinConfetti,
    supporter,
  ]);

  useEffect(() => {
    const handleFullscreen = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== 'f') return;
      if (document.fullscreenElement) {
        void document.exitFullscreen();
      } else {
        void document.documentElement.requestFullscreen();
      }
    };

    window.addEventListener('keydown', handleFullscreen);
    return () => window.removeEventListener('keydown', handleFullscreen);
  }, []);

  useEffect(() => {
    if (!isDailySpinOpen) return;

    const handleDialogKeys = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSpinning) {
        setIsDailySpinOpen(false);
        return;
      }

      if (event.key !== 'Tab') return;
      const dialog = dailySpinDialogRef.current;
      if (!dialog) return;

      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button:not([disabled]), textarea:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
        )
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;

      if (!dialog.contains(document.activeElement)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', handleDialogKeys);
    return () => window.removeEventListener('keydown', handleDialogKeys);
  }, [isDailySpinOpen, isSpinning]);

  useEffect(() => {
    const wasOpen = wasDailySpinOpenRef.current;
    wasDailySpinOpenRef.current = isDailySpinOpen;

    if (wasOpen && !isDailySpinOpen) {
      window.requestAnimationFrame(() => dailySpinTriggerRef.current?.focus());
    }
  }, [isDailySpinOpen]);

  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.play().catch(console.error);
        setIsMuted(false);
      } else {
        audioRef.current.pause();
        setIsMuted(true);
      }
    }
  };

  const startAudio = () => {
    if (audioRef.current && !isMuted) {
      audioRef.current.play().catch(console.error);
    }
  };

  const startGame = async () => {
    await fetchKarmaBoost();
    const initialState: GameState = {
      day: 1,
      cash: 2.0,
      glasses: 0,
      signs: 0,
      price: 0,
      weather: generateWeather(),
      assets: 2.0,
      bankrupt: false,
    };
    setGameState(initialState);
    setDayResult(null);
    setPhase('dayBriefing');
    void persistGame('dayBriefing', initialState, null);
    // Start the theme music when the game begins
    startAudio();
  };

  const continueGame = async () => {
    if (!savedGame) return;
    await fetchKarmaBoost();
    setGameState(savedGame.gameState);
    setDayResult(savedGame.dayResult);
    setPhase(savedGame.phase);
    startAudio();
  };

  const spinDaily = async () => {
    if (isSpinning || dailySpin?.spun) return;

    setIsSpinning(true);
    setDailySpinMessage('');
    setShowSpinConfetti(false);

    try {
      let result: DailySpinResponse;

      if (import.meta.env.DEV) {
        const date = new Date().toISOString().slice(0, 10);
        const challenge =
          DAILY_SPIN_CHALLENGES[new Date().getUTCDate() % DAILY_SPIN_CHALLENGES.length] ??
          DAILY_SPIN_CHALLENGES[0];
        if (!challenge) throw new Error('No daily spin challenges are configured.');
        result = {
          type: 'daily-spin',
          date,
          signedIn: true,
          spun: true,
          challenge,
          commentUrl: 'https://www.reddit.com/r/lemonomics_game_dev/',
        };
      } else {
        const response = await fetch('/api/daily-spin', { method: 'POST' });
        result = (await response.json()) as DailySpinResponse;
        if (!response.ok) throw new Error(result.message ?? `HTTP ${response.status}`);
      }

      if (!result.challenge) {
        throw new Error(result.message ?? 'The wheel did not settle. Please try again.');
      }

      const challengeIndex = DAILY_SPIN_CHALLENGES.findIndex(
        (challenge) => challenge.id === result.challenge?.id
      );
      if (challengeIndex < 0) throw new Error('The wheel returned an unknown challenge.');

      let currentRotation = wheelRotation;
      const transform = dailySpinWheelRef.current
        ? window.getComputedStyle(dailySpinWheelRef.current).transform
        : 'none';
      if (transform !== 'none') {
        const matrix = new DOMMatrixReadOnly(transform);
        const renderedRotation = (Math.atan2(matrix.b, matrix.a) * 180) / Math.PI;
        if (Number.isFinite(renderedRotation)) currentRotation = renderedRotation;
      }

      setIsWheelSettling(true);
      setWheelRotation(currentRotation);
      await waitForNextPaint();

      const normalized = ((currentRotation % 360) + 360) % 360;
      const target = (((-challengeIndex * 90) % 360) + 360) % 360;
      const targetOffset = (target - normalized + 360) % 360;
      setWheelRotation(currentRotation + 1080 + targetOffset);

      if (!prefersReducedMotion) {
        await new Promise((resolve) => setTimeout(resolve, SPIN_SETTLE_MILLISECONDS));
      }
      setDailySpin(result);
      setIsWheelSettling(false);
      if (!prefersReducedMotion) {
        setShowSpinConfetti(true);
        if (confettiTimeoutRef.current !== null) {
          window.clearTimeout(confettiTimeoutRef.current);
        }
        confettiTimeoutRef.current = window.setTimeout(() => {
          setShowSpinConfetti(false);
          confettiTimeoutRef.current = null;
        }, 1500);
      }
      window.requestAnimationFrame(() => {
        dailySpinDialogRef.current
          ?.querySelector<HTMLElement>('[data-testid="daily-spin-result"]')
          ?.focus({ preventScroll: true });
      });
    } catch (error) {
      setDailySpinMessage(error instanceof Error ? error.message : 'Unable to spin right now.');
    } finally {
      setIsWheelSettling(false);
      setIsSpinning(false);
    }
  };

  const copyDailySpinStarter = async () => {
    if (!dailySpin?.challenge) return;

    try {
      await navigator.clipboard.writeText(dailySpin.challenge.commentStarter);
      setDailySpinMessage('Comment prompt copied. Add your own recipe or image before posting.');
    } catch {
      setDailySpinMessage(
        'Select the prompt below to copy it, then add your own answer on Reddit.'
      );
    }
  };

  const openDailySpinComments = async () => {
    if (import.meta.env.DEV) {
      setDailySpinMessage('In Reddit, this opens the pinned Daily Lemon Spin comment.');
      return;
    }

    const fallbackUrl = devvitContext.postId
      ? `https://www.reddit.com/comments/${devvitContext.postId.slice(3)}`
      : 'https://www.reddit.com/r/Lemonomics/';
    let commentUrl = dailySpin?.commentUrl ?? fallbackUrl;
    setDailySpinMessage('Opening the pinned Daily Lemon Spin comment…');

    try {
      const response = await fetch('/api/daily-spin', { method: 'POST' });
      const refreshedSpin = (await response.json()) as DailySpinResponse;
      if (response.ok) {
        setDailySpin(refreshedSpin);
        commentUrl = refreshedSpin.commentUrl ?? commentUrl;
      }
    } catch {
      // The current post remains a safe fallback if Reddit cannot refresh the anchor comment.
    }

    navigateTo({ url: commentUrl });
  };

  const generateWeather = (): 'sunny' | 'cloudy' | 'rainy' | 'hot' => {
    const rand = Math.random();
    if (rand < 0.6) return 'sunny';
    if (rand < 0.8) return 'cloudy';
    if (rand < 0.9) return 'rainy';
    return 'hot';
  };

  const getLemonCost = (day: number): number => {
    if (day <= 2) return 0.02;
    if (day <= 6) return 0.04;
    return 0.05;
  };

  const calculateSales = (
    glasses: number,
    sugar: number,
    signs: number,
    price: number,
    weather: string
  ): DayResult => {
    const lemonCost = getLemonCost(gameState.day);

    // Base demand calculation (from original BASIC)
    let demand = 30; // Base customers

    // Weather effects
    if (weather === 'hot') demand *= 2;
    if (weather === 'rainy') demand *= 0.3;
    if (weather === 'cloudy') demand *= 0.7;

    // Price effects (from original formula)
    let priceEffect = 1;
    if (price >= 10) {
      priceEffect = (10 * 10 * 30) / (price * price);
    } else {
      priceEffect = ((10 - price) / 10) * 0.8 * 30 + 30;
    }

    // Sign effects (advertising)
    const signEffect = 1 - Math.exp(-signs * 0.5);

    // Sugar quality effects (after day 3)
    let sugarQuality = 1;
    if (gameState.day >= 3 && glasses > 0) {
      const sugarRatio = sugar / glasses;
      if (sugarRatio >= 1) {
        sugarQuality = 1; // Perfect sweetness
      } else if (sugarRatio >= 0.5) {
        sugarQuality = 0.8; // Slightly less sweet
      } else if (sugarRatio > 0) {
        sugarQuality = 0.6; // Not sweet enough
      } else {
        sugarQuality = 0.4; // No sugar - very poor quality
      }
    }

    // Apply karma boost to demand
    const karmaMultiplier = karmaBoost.multiplier;

    // Calculate final demand with karma boost and sugar quality
    const finalDemand = Math.floor(
      demand * (priceEffect / 30) * (1 + signEffect) * karmaMultiplier * sugarQuality
    );

    // Can't sell more than you made
    const glassesSold = Math.min(finalDemand, glasses);

    const income = glassesSold * (price / 100);
    const expenses = glasses * lemonCost + signs * 0.15;
    const profit = income - expenses;

    return {
      glassesSold,
      income,
      expenses,
      profit,
    };
  };

  const playDay = () => {
    const glasses = parseInt(inputs.glasses) || 0;
    const sugar = parseInt(inputs.sugar) || 0;
    const signs = parseInt(inputs.signs) || 0;
    const price = parseInt(inputs.price) || 0;

    const lemonCost = getLemonCost(gameState.day);
    const sugarCost = gameState.day >= 3 ? 0.02 : 0; // 2¢ per unit after day 3
    const totalCost = glasses * lemonCost + sugar * sugarCost + signs * 0.15;

    // Sugar is optional but recommended after day 3
    // Allow players to make lemonade with less sugar (affects quality but doesn't block)
    if (gameState.day >= 3 && glasses > 0 && sugar === 0) {
      const proceed = confirm(
        `Warning: Making ${glasses} glasses without sugar will result in poor quality lemonade and fewer sales. Continue anyway?`
      );
      if (!proceed) {
        return;
      }
    }

    // Validate inputs
    if (totalCost > gameState.cash) {
      alert(
        `You don't have enough money! You need $${totalCost.toFixed(2)} but only have $${gameState.cash.toFixed(2)}`
      );
      return;
    }

    // Additional check for negative cash
    if (gameState.cash <= 0) {
      alert('You have no money left! Game Over.');
      setGameState((prev) => ({ ...prev, bankrupt: true }));
      setPhase('gameOver');
      return;
    }

    if (glasses < 0 || glasses > 1000) {
      alert('Please enter a reasonable number of glasses (0-1000)');
      return;
    }

    if (signs < 0 || signs > 50) {
      alert('Please enter a reasonable number of signs (0-50)');
      return;
    }

    if (price < 0 || price > 100) {
      alert('Please enter a reasonable price (0-100 cents)');
      return;
    }

    // Check for special events (from original game)
    let specialEvent = '';
    let eventMultiplier = 1;

    if (gameState.day === 3) {
      specialEvent = '(Your mother quit giving you free sugar)';
    }

    if (gameState.day === 7) {
      specialEvent = '(The price of lemonade mix just went up)';
    }

    // Random events after day 2
    if (gameState.day > 2 && Math.random() < 0.25) {
      const eventRoll = Math.random();
      if (eventRoll < 0.33) {
        specialEvent =
          'The street department is working today. There will be no traffic on your street.';
        eventMultiplier = 0.1;
      } else if (eventRoll < 0.66 && gameState.weather === 'cloudy') {
        specialEvent = 'A severe thunderstorm hit Lemonsville! Everything was ruined!!';
        eventMultiplier = 0;
      }
    }

    const result = calculateSales(glasses, sugar, signs, price, gameState.weather);

    // Apply special event effects
    const adjustedResult = {
      ...result,
      glassesSold: Math.floor(result.glassesSold * eventMultiplier),
      income: result.income * eventMultiplier,
    };

    adjustedResult.profit = adjustedResult.income - result.expenses;

    const newCash = gameState.cash + adjustedResult.profit;
    const newAssets = newCash;

    // Check bankruptcy: can't afford minimum lemonade for next day OR negative cash
    const nextDayLemonCost = getLemonCost(gameState.day + 1);
    const isBankrupt = newCash < nextDayLemonCost || newCash < 0;

    const nextResult: DayResult = { ...adjustedResult, specialEvent };
    const nextGameState: GameState = {
      ...gameState,
      cash: newCash,
      assets: newAssets,
      glasses,
      signs,
      price,
      bankrupt: isBankrupt,
    };

    setDayResult(nextResult);
    setGameState(nextGameState);

    // Update progress in leaderboard
    void updateProgress(gameState.day, newAssets);
    void persistGame('results', nextGameState, nextResult);

    setPhase('results');
  };

  const nextDay = async () => {
    // Handle bankruptcy - go directly to game over
    if (gameState.bankrupt) {
      setPhase('gameOver');
      void persistGame('gameOver', gameState, dayResult);
      return;
    }

    // Classic game ending conditions
    if (gameState.day >= 30) {
      // Check for final flair reward before ending
      await checkForFlairReward(gameState.day);
      setPhase('gameOver');
      void persistGame('gameOver', gameState, dayResult);
      return;
    }

    const nextDayNumber = gameState.day + 1;

    // Check for flair rewards at milestone days
    if (nextDayNumber === 10 || nextDayNumber === 20 || nextDayNumber === 30) {
      await checkForFlairReward(nextDayNumber);
    }

    const nextGameState: GameState = {
      ...gameState,
      day: nextDayNumber,
      weather: generateWeather(),
    };

    setGameState(nextGameState);
    setInputs({ glasses: '', sugar: '', signs: '', price: '' });
    setDayResult(null);
    setPhase('dayBriefing');
    void persistGame('dayBriefing', nextGameState, null);
  };

  const getWeatherIcon = (weather: string) => {
    switch (weather) {
      case 'sunny':
        return '☀️';
      case 'hot':
        return '🔥';
      case 'cloudy':
        return '☁️';
      case 'rainy':
        return '🌧️';
      default:
        return '☀️';
    }
  };

  const getWeatherDescription = (weather: string) => {
    switch (weather) {
      case 'sunny':
        return 'Nice sunny day - good for lemonade sales!';
      case 'hot':
        return 'Hot weather - people will be very thirsty!';
      case 'cloudy':
        return 'Cloudy day - fewer people might be out.';
      case 'rainy':
        return 'Rainy day - not many customers expected.';
      default:
        return 'Pleasant weather for lemonade!';
    }
  };

  // Audio control button
  const AudioControlButton = () => {
    return (
      <button
        onClick={toggleMute}
        aria-label={isMuted ? 'Unmute music' : 'Mute music'}
        className="fixed top-4 right-4 z-40 bg-white/90 hover:bg-white border-2 border-yellow-400 rounded-full p-3 shadow-lg transition-all duration-200 hover:scale-110"
        title={isMuted ? 'Unmute music' : 'Mute music'}
      >
        {isMuted ? (
          <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L4.617 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.617l3.766-3.793a1 1 0 011.617.793zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.983 5.983 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.984 3.984 0 00-1.172-2.828 1 1 0 010-1.415z"
              clipRule="evenodd"
            />
            <path d="M3 3l14 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        ) : (
          <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L4.617 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.617l3.766-3.793a1 1 0 011.617.793zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.983 5.983 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.984 3.984 0 00-1.172-2.828 1 1 0 010-1.415z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </button>
    );
  };

  const SupporterBadge = () => {
    if (!supporter) return null;

    return (
      <div
        data-testid="supporter-badge"
        className="fixed left-4 top-4 z-40 rounded-full border-2 border-amber-500 bg-amber-50/95 px-3 py-2 text-xs font-bold text-amber-900 shadow-lg"
      >
        ✨ Golden Lemon Supporter
      </div>
    );
  };

  const renderDailySpinModal = () => {
    if (!isDailySpinOpen) return null;

    const challenge = dailySpin?.challenge;
    const wheelPositions = [
      'left-1/2 top-4 -translate-x-1/2',
      'right-4 top-1/2 -translate-y-1/2',
      'bottom-4 left-1/2 -translate-x-1/2',
      'left-4 top-1/2 -translate-y-1/2',
    ];

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget && !isSpinning) setIsDailySpinOpen(false);
        }}
      >
        <section
          ref={dailySpinDialogRef}
          data-testid="daily-spin-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="daily-spin-title"
          className="relative max-h-[calc(100vh-1.5rem)] w-full max-w-sm overflow-y-auto rounded-2xl border-4 border-yellow-400 bg-white p-5 text-center shadow-2xl"
        >
          {showSpinConfetti && (
            <div
              data-testid="daily-spin-confetti"
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-30 overflow-hidden rounded-xl"
            >
              {CONFETTI_PIECES.map((piece) => (
                <span
                  key={piece.id}
                  className="daily-spin-confetti-piece"
                  style={
                    {
                      left: `${piece.left}%`,
                      backgroundColor: piece.color,
                      animationDelay: `${piece.delay}ms`,
                      animationDuration: `${piece.duration}ms`,
                      '--confetti-x': `${piece.drift}px`,
                      '--confetti-rotation': `${piece.rotation}deg`,
                    } as React.CSSProperties
                  }
                />
              ))}
            </div>
          )}
          <div className="flex items-start justify-between gap-3 text-left">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">
                Free community challenge
              </p>
              <h2 id="daily-spin-title" className="text-2xl font-black text-yellow-700">
                🍋 Daily Lemon Spin
              </h2>
              <p className="mt-1 text-xs text-gray-600">One server-verified spin each UTC day.</p>
            </div>
            <button
              data-testid="daily-spin-close"
              type="button"
              autoFocus
              aria-label="Close daily spin"
              disabled={isSpinning}
              onClick={() => setIsDailySpinOpen(false)}
              className="rounded-full bg-gray-100 px-3 py-1.5 text-lg font-bold text-gray-600 hover:bg-gray-200 disabled:opacity-50"
            >
              ×
            </button>
          </div>

          <div className="relative mx-auto mt-5 h-56 w-56">
            <div className="absolute -top-4 left-1/2 z-20 -translate-x-1/2 text-3xl text-red-600">
              ▼
            </div>
            <div
              ref={dailySpinWheelRef}
              data-testid="daily-spin-wheel"
              aria-label="Recipe and lemon image challenge wheel"
              className={`absolute inset-0 rounded-full border-8 border-yellow-500 shadow-lg ${isWheelIdling ? 'daily-spin-wheel-idle' : ''}`}
              style={{
                background:
                  'conic-gradient(from -45deg, #fde047 0deg 90deg, #a7f3d0 90deg 180deg, #bfdbfe 180deg 270deg, #fecdd3 270deg 360deg)',
                transform: `rotate(${wheelRotation}deg)`,
                transition:
                  isWheelSettling && !prefersReducedMotion
                    ? `transform ${SPIN_SETTLE_MILLISECONDS}ms cubic-bezier(0.12, 0.7, 0.18, 1)`
                    : 'none',
              }}
            >
              {DAILY_SPIN_CHALLENGES.map((item, index) => (
                <div
                  key={item.id}
                  title={item.label}
                  className={`absolute flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-2xl shadow ${wheelPositions[index]}`}
                >
                  {item.emoji}
                </div>
              ))}
            </div>
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
              {!challenge ? (
                <button
                  data-testid="daily-spin-action"
                  type="button"
                  disabled={isLoadingDailySpin || isSpinning || dailySpin?.signedIn === false}
                  onClick={() => void spinDaily()}
                  className="pointer-events-auto flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-emerald-600 text-sm font-black uppercase text-white shadow-xl hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                >
                  {isLoadingDailySpin
                    ? 'Loading'
                    : isSpinning
                      ? 'Stopping'
                      : prefersReducedMotion
                        ? 'Reveal'
                        : 'Stop'}
                </button>
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-emerald-600 text-4xl shadow-xl">
                  🍋
                </div>
              )}
            </div>
          </div>

          {!challenge && !isLoadingDailySpin && dailySpin?.signedIn !== false && (
            <p className="mt-3 text-sm font-semibold text-emerald-800">
              {prefersReducedMotion
                ? 'Press Reveal to receive today’s community prompt.'
                : 'The wheel is spinning — press Stop to reveal today’s prompt.'}
            </p>
          )}

          {!challenge && (
            <div className="mt-4 grid grid-cols-2 gap-2 text-left text-xs text-gray-700">
              {DAILY_SPIN_CHALLENGES.map((item) => (
                <div key={item.id} className="rounded-lg bg-yellow-50 px-2 py-1.5">
                  <span className="mr-1" aria-hidden="true">
                    {item.emoji}
                  </span>
                  {item.label}
                </div>
              ))}
            </div>
          )}

          {challenge && (
            <div
              data-testid="daily-spin-result"
              tabIndex={-1}
              aria-live="polite"
              className="mt-5 rounded-xl border-2 border-emerald-300 bg-emerald-50 p-4 text-left"
            >
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                Today you landed on
              </p>
              <h3 className="mt-1 text-xl font-black text-emerald-900">
                {challenge.emoji} {challenge.label}
              </h3>
              <p className="mt-2 text-sm text-emerald-950">{challenge.prompt}</p>
              {challenge.category === 'image' && (
                <p className="mt-2 text-xs font-semibold text-emerald-800">
                  Attach your image with Reddit's native image button. Only post work you made or
                  have permission to share.
                </p>
              )}
              <label
                className="mt-3 block text-xs font-bold text-emerald-900"
                htmlFor="spin-starter"
              >
                Optional comment starter
              </label>
              <textarea
                id="spin-starter"
                readOnly
                value={challenge.commentStarter}
                rows={5}
                className="mt-1 w-full resize-none rounded-lg border border-emerald-300 bg-white p-2 text-xs text-gray-800"
              />
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => void copyDailySpinStarter()}
                  className="rounded-lg border-2 border-emerald-600 bg-white px-3 py-2 text-sm font-bold text-emerald-800 hover:bg-emerald-100"
                >
                  Copy prompt
                </button>
                <button
                  data-testid="daily-spin-comments"
                  type="button"
                  onClick={() => void openDailySpinComments()}
                  className="rounded-lg bg-orange-500 px-3 py-2 text-sm font-bold text-white hover:bg-orange-600"
                >
                  Open pinned comments
                </button>
              </div>
              <p className="mt-3 text-xs text-gray-600">
                Reply there in your own words. Posting is optional and never changes your game,
                rewards, or Gold.
              </p>
            </div>
          )}

          {dailySpin?.signedIn === false && (
            <p className="mt-4 rounded-lg bg-orange-50 p-3 text-sm font-semibold text-orange-800">
              {dailySpin.message}
            </p>
          )}
          {dailySpinMessage && (
            <p aria-live="polite" className="mt-3 text-sm font-semibold text-gray-700">
              {dailySpinMessage}
            </p>
          )}
        </section>
      </div>
    );
  };

  // Flair notification modal
  const FlairNotificationModal = () => {
    if (!flairNotification) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm text-center">
          <div className="text-6xl mb-4">🏆</div>
          <h2 className="text-2xl font-bold text-yellow-600 mb-2">Achievement Unlocked!</h2>
          {flairNotification.flair && (
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                {flairNotification.flair.name}
              </h3>
              <p className="text-sm text-gray-600 mb-2">{flairNotification.flair.description}</p>
            </div>
          )}
          <p className="text-gray-700 mb-6">{flairNotification.message}</p>
          <button
            onClick={() => setFlairNotification(null)}
            className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded"
          >
            Awesome! 🎉
          </button>
        </div>
      </div>
    );
  };

  if (phase === 'intro') {
    return (
      <>
        <div
          inert={isDailySpinOpen ? true : undefined}
          aria-hidden={isDailySpinOpen ? true : undefined}
          className="min-h-screen bg-gradient-to-b from-yellow-200 to-yellow-400 flex items-center justify-center p-4 pt-20"
        >
          <AudioControlButton />
          <SupporterBadge />
          <div
            className={`max-w-md rounded-lg bg-white p-8 text-center shadow-xl ${
              supporter ? 'ring-4 ring-amber-400' : ''
            }`}
          >
            <h1 className="text-4xl font-bold text-yellow-600 mb-4">🍋 Lemonomics</h1>
            <p className="text-gray-700 mb-4">
              Welcome to the classic lemonade stand business game! Start with $2.00 and try to build
              your lemonade empire.
            </p>
            <p className="text-sm text-gray-600 mb-6">
              Based on the original 1979 Apple Computer game
            </p>

            <div className="mb-6 space-y-3">
              {isLoadingSave ? (
                <p className="text-sm text-gray-500">Checking for your saved stand…</p>
              ) : savedGame ? (
                <button
                  data-testid="continue-run"
                  onClick={continueGame}
                  className="w-full rounded-lg bg-green-500 px-6 py-3 text-lg font-bold text-white hover:bg-green-600"
                >
                  Continue Day {savedGame.gameState.day} ▶
                </button>
              ) : null}

              <button
                data-testid="start-game"
                onClick={startGame}
                className={`w-full rounded-lg px-6 py-3 font-bold ${
                  savedGame
                    ? 'border-2 border-yellow-500 bg-white text-yellow-700 hover:bg-yellow-50'
                    : 'bg-yellow-500 text-lg text-white hover:bg-yellow-600'
                }`}
              >
                {savedGame ? 'Start a New Run' : 'Start Your Stand! 🍋'}
              </button>

              <button
                ref={dailySpinTriggerRef}
                data-testid="daily-spin-open"
                type="button"
                onClick={() => {
                  setDailySpinMessage('');
                  setIsDailySpinOpen(true);
                }}
                className="w-full rounded-lg border-2 border-emerald-500 bg-emerald-50 px-4 py-3 text-left text-emerald-900 hover:bg-emerald-100"
              >
                <span className="flex items-center justify-between gap-3">
                  <span className="font-black">🎡 Daily Lemon Spin</span>
                  <span className="rounded-full bg-emerald-600 px-2 py-1 text-xs font-bold text-white">
                    {dailySpin?.spun ? "View today's prompt" : 'Spin free'}
                  </span>
                </span>
                <span className="mt-1 block text-xs">
                  Land on a lemon recipe or image challenge, then share it in the pinned comments.
                </span>
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-200 p-3 rounded mb-6">
              <p className="text-sm text-blue-800 font-semibold">🎯 Reddit Karma Boosts:</p>
              <p className="text-xs text-blue-700">
                • 300+ karma: 1.15x sales boost • 1,000+ karma: 1.5x sales boost • 5,000+ karma: 2x
                sales boost
              </p>
              <button
                onClick={async () => {
                  try {
                    const response = await fetch('/api/subscribe-lemonomics', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                    });
                    const data = await response.json();
                    if (data.status === 'success') {
                      alert(
                        `🍋 Welcome to r/Lemonomics, ${data.username}! You're now part of the lemon empire!`
                      );
                    } else if (data.status === 'info' && data.fallback) {
                      alert(`${data.message}\n\nClick OK to visit r/Lemonomics manually!`);
                      window.open('https://reddit.com/r/Lemonomics', '_blank');
                    } else {
                      alert('Already subscribed or unable to subscribe at this time.');
                    }
                  } catch (error) {
                    console.error('Subscribe error:', error);
                    alert('Unable to subscribe at this time. You can manually visit r/Lemonomics!');
                    window.open('https://reddit.com/r/Lemonomics', '_blank');
                  }
                }}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded text-sm transition-colors"
              >
                Subscribe to r/Lemonomics 🍋
              </button>
            </div>

            <div className="rounded-lg border-2 border-amber-300 bg-amber-50 p-4 text-left">
              <p className="font-bold text-amber-900">✨ Support Lemonomics</p>
              <p className="mt-1 text-xs text-amber-800">
                Optional and cosmetic. Unlock a permanent Golden Lemon Supporter badge and golden
                stand theme; the full game stays free.
              </p>
              {supporter ? (
                <div className="mt-3 text-center">
                  <p className="text-sm font-bold text-amber-900">
                    Golden Lemon Supporter active — thank you!
                  </p>
                  {canResetTestSupporter && (
                    <button
                      data-testid="reset-test-supporter"
                      type="button"
                      onClick={() => void resetTestSupporter()}
                      disabled={resetting}
                      className="mt-2 rounded-lg border border-amber-700 bg-white px-3 py-1.5 text-xs font-bold text-amber-900 hover:bg-amber-100 disabled:opacity-60"
                    >
                      {resetting ? 'Resetting…' : 'Reset my dev test badge'}
                    </button>
                  )}
                </div>
              ) : (
                <button
                  data-testid="support-game"
                  onClick={() => void supportApp()}
                  disabled={supporterLoading || purchasing}
                  className="mt-3 w-full rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-amber-950 hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {purchasing ? 'Opening Reddit checkout…' : 'Support with 5 Reddit Gold'}
                </button>
              )}
              {message && (
                <p aria-live="polite" className="mt-2 text-center text-xs text-amber-900">
                  {message}
                </p>
              )}
            </div>
          </div>
        </div>
        {renderDailySpinModal()}
        <FlairNotificationModal />
      </>
    );
  }

  if (phase === 'dayBriefing') {
    const lemonCost = getLemonCost(gameState.day);

    // Special day messages
    let specialMessage = '';
    if (gameState.day === 3) {
      specialMessage = '📢 Your mother quit giving you free sugar!';
    } else if (gameState.day === 7) {
      specialMessage = '📢 The price of lemonade mix just went up!';
    }

    return (
      <>
        <div
          className={`min-h-screen bg-gradient-to-b p-4 pt-20 flex items-center justify-center ${
            supporter ? 'from-amber-200 to-yellow-300' : 'from-blue-200 to-blue-300'
          }`}
        >
          <AudioControlButton />
          <SupporterBadge />
          <div className="w-full max-w-md mx-auto">
            <div className="bg-white rounded-lg shadow-xl p-6 text-center">
              {/* Day Header */}
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-blue-700 mb-2">Day {gameState.day}</h1>
                <div className="text-6xl mb-4">{getWeatherIcon(gameState.weather)}</div>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                  {gameState.weather.charAt(0).toUpperCase() + gameState.weather.slice(1)} Weather
                </h2>
                <p className="text-gray-600">{getWeatherDescription(gameState.weather)}</p>
              </div>

              {/* Special Events */}
              {specialMessage && (
                <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded mb-6">
                  <p className="font-semibold">{specialMessage}</p>
                </div>
              )}

              {/* Business Info */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h3 className="font-semibold text-gray-800 mb-3">Today's Business Conditions</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>💰 Your Assets:</span>
                    <span className="font-semibold text-green-600">
                      ${gameState.assets.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>🍋 Lemon Mix Cost:</span>
                    <span>${lemonCost.toFixed(2)} per glass</span>
                  </div>
                  <div className="flex justify-between">
                    <span>📢 Sign Cost:</span>
                    <span>$0.15 each</span>
                  </div>
                  {karmaBoost.level !== 'none' && (
                    <div className="flex justify-between">
                      <span>🎯 Reddit Karma Boost:</span>
                      <span className="font-semibold text-blue-600">
                        {karmaBoost.multiplier}x sales!
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Continue Button */}
              <button
                data-testid="open-plan"
                onClick={() => setPhase('setup')}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-6 rounded-lg text-lg"
              >
                Make Business Decisions 📊
              </button>
            </div>
          </div>
        </div>
        <FlairNotificationModal />
      </>
    );
  }

  if (phase === 'setup') {
    const lemonCost = getLemonCost(gameState.day);

    return (
      <>
        <div
          className={`min-h-screen bg-gradient-to-b p-4 pt-20 flex items-center justify-center ${
            supporter ? 'from-amber-200 to-yellow-300' : 'from-amber-100 to-yellow-100'
          }`}
        >
          <AudioControlButton />
          <SupporterBadge />
          <div className="w-full max-w-2xl mx-auto">
            {/* Notepad Style Container */}
            <div className="bg-white shadow-2xl transform rotate-1 relative">
              {/* Spiral binding holes */}
              <div className="absolute left-8 top-0 bottom-0 w-1 bg-red-400 opacity-30"></div>
              <div className="absolute left-12 top-4 space-y-8">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="w-3 h-3 bg-gray-300 rounded-full"></div>
                ))}
              </div>

              {/* Notepad Content */}
              <div className="p-6 pl-14 sm:p-8 sm:pl-20">
                {/* Header with handwritten style */}
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-blue-800 transform -rotate-1 font-mono">
                    📝 Business Plan - Day {gameState.day}
                  </h2>
                  <div className="text-lg text-gray-700 mt-2 transform rotate-1 font-mono">
                    💰 Budget: ${gameState.assets.toFixed(2)}
                  </div>
                  <div className="w-full h-px bg-blue-300 mt-4 transform -rotate-1"></div>
                </div>

                {/* Handwritten style form */}
                <div className="space-y-6">
                  {/* Recipe Section */}
                  <div className="transform -rotate-1">
                    <h3 className="text-xl font-bold text-green-700 mb-4 font-mono">
                      🍋 Today's Recipe:
                    </h3>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label className="block text-lg font-semibold text-gray-800 font-mono">
                          Glasses to make:
                        </label>
                        <input
                          data-testid="glasses-input"
                          type="number"
                          min="0"
                          max="1000"
                          value={inputs.glasses}
                          onChange={(e) =>
                            setInputs((prev) => ({ ...prev, glasses: e.target.value }))
                          }
                          className="w-full p-3 text-xl border-b-2 border-blue-400 bg-transparent focus:border-blue-600 focus:outline-none font-mono transform rotate-1"
                          placeholder="0"
                          style={{
                            background: 'linear-gradient(transparent 90%, #e0f2fe 90%)',
                            backgroundSize: '100% 1.5em',
                          }}
                        />
                        <p className="text-sm text-gray-600 font-mono">
                          @ ${lemonCost.toFixed(2)} each = $
                          {((parseInt(inputs.glasses) || 0) * lemonCost).toFixed(2)}
                        </p>
                      </div>

                      {gameState.day >= 3 && (
                        <div className="space-y-2">
                          <label className="block text-lg font-semibold text-gray-800 font-mono">
                            Sugar packets:
                          </label>
                          <input
                            data-testid="sugar-input"
                            type="number"
                            min="0"
                            max="1000"
                            value={inputs.sugar}
                            onChange={(e) =>
                              setInputs((prev) => ({ ...prev, sugar: e.target.value }))
                            }
                            className="w-full p-3 text-xl border-b-2 border-blue-400 bg-transparent focus:border-blue-600 focus:outline-none font-mono transform rotate-1"
                            placeholder="0"
                            style={{
                              background: 'linear-gradient(transparent 90%, #e0f2fe 90%)',
                              backgroundSize: '100% 1.5em',
                            }}
                          />
                          <p className="text-sm text-gray-600 font-mono">
                            @ $0.02 each = ${((parseInt(inputs.sugar) || 0) * 0.02).toFixed(2)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Marketing Section */}
                  <div className="transform rotate-1">
                    <h3 className="text-xl font-bold text-blue-700 mb-4 font-mono">
                      📢 Marketing & Pricing:
                    </h3>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label className="block text-lg font-semibold text-gray-800 font-mono">
                          Advertising signs:
                        </label>
                        <input
                          data-testid="signs-input"
                          type="number"
                          min="0"
                          max="50"
                          value={inputs.signs}
                          onChange={(e) =>
                            setInputs((prev) => ({ ...prev, signs: e.target.value }))
                          }
                          className="w-full p-3 text-xl border-b-2 border-blue-400 bg-transparent focus:border-blue-600 focus:outline-none font-mono transform -rotate-1"
                          placeholder="0"
                          style={{
                            background: 'linear-gradient(transparent 90%, #e0f2fe 90%)',
                            backgroundSize: '100% 1.5em',
                          }}
                        />
                        <p className="text-sm text-gray-600 font-mono">
                          @ $0.15 each = ${((parseInt(inputs.signs) || 0) * 0.15).toFixed(2)}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-lg font-semibold text-gray-800 font-mono">
                          Price per glass (¢):
                        </label>
                        <input
                          data-testid="price-input"
                          type="number"
                          min="0"
                          max="100"
                          value={inputs.price}
                          onChange={(e) =>
                            setInputs((prev) => ({ ...prev, price: e.target.value }))
                          }
                          className="w-full p-3 text-xl border-b-2 border-blue-400 bg-transparent focus:border-blue-600 focus:outline-none font-mono transform -rotate-1"
                          placeholder="10"
                          style={{
                            background: 'linear-gradient(transparent 90%, #e0f2fe 90%)',
                            backgroundSize: '100% 1.5em',
                          }}
                        />
                        <p className="text-sm text-gray-600 font-mono">
                          = ${((parseInt(inputs.price) || 0) / 100).toFixed(2)} per glass
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Budget Summary */}
                  <div className="transform -rotate-1 bg-yellow-50 p-4 rounded-lg border-2 border-dashed border-yellow-400">
                    <h3 className="text-xl font-bold text-orange-700 mb-3 font-mono">
                      💰 Budget Summary:
                    </h3>
                    <div className="grid grid-cols-1 gap-4 text-lg font-mono sm:grid-cols-2">
                      <div>
                        <p className="text-gray-700">
                          <strong>Total Cost:</strong>
                        </p>
                        <p className="text-2xl font-bold text-red-600">
                          $
                          {(
                            (parseInt(inputs.glasses) || 0) * lemonCost +
                            (parseInt(inputs.sugar) || 0) * (gameState.day >= 3 ? 0.02 : 0) +
                            (parseInt(inputs.signs) || 0) * 0.15
                          ).toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-700">
                          <strong>Money Left:</strong>
                        </p>
                        <p
                          className={`text-2xl font-bold ${
                            gameState.assets -
                              ((parseInt(inputs.glasses) || 0) * lemonCost +
                                (parseInt(inputs.sugar) || 0) * (gameState.day >= 3 ? 0.02 : 0) +
                                (parseInt(inputs.signs) || 0) * 0.15) <
                            0
                              ? 'text-red-600'
                              : 'text-green-600'
                          }`}
                        >
                          $
                          {(
                            gameState.assets -
                            ((parseInt(inputs.glasses) || 0) * lemonCost +
                              (parseInt(inputs.sugar) || 0) * (gameState.day >= 3 ? 0.02 : 0) +
                              (parseInt(inputs.signs) || 0) * 0.15)
                          ).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="text-center pt-4">
                    <button
                      data-testid="open-stand"
                      onClick={playDay}
                      className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-4 px-8 rounded-full text-xl shadow-lg transform hover:scale-105 transition-all duration-200 font-mono"
                    >
                      🏪 Open Stand!
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <FlairNotificationModal />
      </>
    );
  }

  if (phase === 'results' && dayResult) {
    return (
      <>
        <div
          className={`min-h-screen bg-gradient-to-b p-4 pt-20 flex items-center justify-center ${
            supporter ? 'from-amber-200 to-yellow-300' : 'from-green-200 to-blue-200'
          }`}
        >
          <AudioControlButton />
          <SupporterBadge />
          <div className="w-full max-w-2xl mx-auto">
            {/* Notepad Style Container */}
            <div className="bg-white shadow-2xl transform -rotate-1 relative">
              {/* Spiral binding holes */}
              <div className="absolute left-8 top-0 bottom-0 w-1 bg-red-400 opacity-30"></div>
              <div className="absolute left-12 top-4 space-y-8">
                {Array.from({ length: 15 }).map((_, i) => (
                  <div key={i} className="w-3 h-3 bg-gray-300 rounded-full"></div>
                ))}
              </div>

              {/* Notepad Content */}
              <div className="p-6 pl-14 sm:p-8 sm:pl-20">
                {/* Header with handwritten style */}
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-green-800 transform -rotate-1 font-mono">
                    📊 Daily Report - Day {gameState.day}
                  </h2>
                  <div className="w-full h-px bg-green-300 mt-4 transform -rotate-1"></div>
                </div>

                {/* Special Event */}
                {dayResult.specialEvent && (
                  <div className="transform rotate-1 mb-6">
                    <div className="bg-yellow-100 border-2 border-yellow-400 p-4 rounded-lg font-mono">
                      <p className="font-bold text-yellow-800">📰 Breaking News:</p>
                      <p className="text-yellow-700 text-sm mt-1">{dayResult.specialEvent}</p>
                    </div>
                  </div>
                )}

                {/* Business Results */}
                <div className="transform -rotate-1 mb-6">
                  <h3 className="text-xl font-bold text-blue-700 mb-4 font-mono">
                    🍋 Today's Business Results:
                  </h3>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div className="space-y-3">
                      <div className="font-mono">
                        <span className="text-gray-700">Glasses sold:</span>
                        <span className="float-right font-bold text-green-600">
                          {dayResult.glassesSold}
                        </span>
                        <div className="border-b border-dotted border-gray-400"></div>
                      </div>
                      <div className="font-mono">
                        <span className="text-gray-700">Price per glass:</span>
                        <span className="float-right font-bold">
                          ${(gameState.price / 100).toFixed(2)}
                        </span>
                        <div className="border-b border-dotted border-gray-400"></div>
                      </div>
                      <div className="font-mono">
                        <span className="text-gray-700">Glasses made:</span>
                        <span className="float-right">{gameState.glasses}</span>
                        <div className="border-b border-dotted border-gray-400"></div>
                      </div>
                      <div className="font-mono">
                        <span className="text-gray-700">Signs used:</span>
                        <span className="float-right">{gameState.signs}</span>
                        <div className="border-b border-dotted border-gray-400"></div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="font-mono">
                        <span className="text-gray-700">Income:</span>
                        <span className="float-right font-bold text-green-600">
                          ${dayResult.income.toFixed(2)}
                        </span>
                        <div className="border-b border-dotted border-gray-400"></div>
                      </div>
                      <div className="font-mono">
                        <span className="text-gray-700">Expenses:</span>
                        <span className="float-right font-bold text-red-600">
                          ${dayResult.expenses.toFixed(2)}
                        </span>
                        <div className="border-b border-dotted border-gray-400"></div>
                      </div>
                      <div className="font-mono">
                        <span className="text-gray-700">Profit:</span>
                        <span
                          className={`float-right font-bold ${dayResult.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}
                        >
                          ${dayResult.profit.toFixed(2)}
                        </span>
                        <div className="border-b-2 border-solid border-gray-600"></div>
                      </div>
                      <div className="font-mono">
                        <span className="text-gray-700 font-bold">Total Assets:</span>
                        <span
                          className={`float-right font-bold text-lg ${gameState.assets >= 0 ? 'text-green-600' : 'text-red-600'}`}
                        >
                          ${gameState.assets.toFixed(2)}
                        </span>
                        <div className="border-b-2 border-solid border-gray-600"></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bankruptcy Alert */}
                {gameState.bankrupt && (
                  <div className="transform rotate-1 mb-6">
                    <div className="bg-red-500 text-white px-6 py-4 rounded-lg text-center border-4 border-red-600 shadow-lg font-mono">
                      <div className="text-4xl mb-2">💸</div>
                      <p className="font-bold text-xl mb-2">BANKRUPTCY!</p>
                      <p className="text-red-100 mb-2">
                        You don't have enough money to continue in business.
                      </p>
                      <p className="text-sm text-red-200">
                        You need at least ${getLemonCost(gameState.day + 1).toFixed(2)} to make
                        lemonade for tomorrow.
                      </p>
                      <div className="mt-3 p-2 bg-red-600 rounded">
                        <p className="text-xs text-red-100">
                          💡 Tip: Try making fewer glasses or charging higher prices to stay
                          profitable!
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Leaderboard */}
                {leaderboard.length > 0 && (
                  <div className="transform -rotate-1 mb-6">
                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-lg p-4">
                      <h3 className="font-bold text-lg mb-3 text-center text-orange-700 font-mono">
                        🏆 Top Entrepreneurs
                      </h3>
                      <div className="space-y-2">
                        {leaderboard.map((player, index) => (
                          <div
                            key={player.username}
                            className={`flex items-center justify-between p-2 rounded font-mono ${
                              index === 0
                                ? 'bg-yellow-200 border border-yellow-400'
                                : index === 1
                                  ? 'bg-gray-100 border border-gray-300'
                                  : 'bg-orange-100 border border-orange-300'
                            }`}
                          >
                            <div className="flex items-center space-x-2">
                              <span className="text-lg font-bold">
                                {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                              </span>
                              <span className="font-semibold text-gray-800">{player.username}</span>
                            </div>
                            <div className="text-right text-sm">
                              <div className="font-bold text-green-600">
                                ${player.assets.toFixed(2)}
                              </div>
                              <div className="text-gray-600">Day {player.day}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 text-center mt-2 font-mono">
                        Live leaderboard updates every day!
                      </p>
                    </div>
                  </div>
                )}

                {/* Continue Button */}
                <div className="transform rotate-1">
                  <button
                    data-testid="next-day"
                    onClick={nextDay}
                    className={`w-full font-bold py-4 px-6 rounded-lg font-mono text-lg ${
                      gameState.bankrupt
                        ? 'bg-red-500 hover:bg-red-600 text-white'
                        : 'bg-green-500 hover:bg-green-600 text-white'
                    }`}
                  >
                    {gameState.bankrupt
                      ? 'Game Over 😢'
                      : `Continue to Day ${gameState.day + 1} ➡️`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <FlairNotificationModal />
      </>
    );
  }

  if (phase === 'gameOver') {
    const isWinner = gameState.day >= 30 && !gameState.bankrupt;
    const getPerformanceRating = (assets: number) => {
      if (assets >= 100) return '🏆 Lemonade Tycoon!';
      if (assets >= 50) return '💰 Business Success!';
      if (assets >= 20) return '📈 Good Entrepreneur!';
      if (assets >= 10) return '👍 Not Bad!';
      if (assets >= 5) return '😐 Could Be Better';
      return '😅 Better Luck Next Time';
    };

    return (
      <>
        <div
          className={`min-h-screen bg-gradient-to-b ${
            supporter
              ? 'from-amber-200 to-yellow-300'
              : isWinner
                ? 'from-green-200 to-yellow-200'
                : 'from-red-200 to-gray-300'
          } flex items-center justify-center p-4 pt-20`}
        >
          <AudioControlButton />
          <SupporterBadge />
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md text-center">
            <h1
              className={`text-3xl font-bold mb-4 ${isWinner ? 'text-green-600' : 'text-red-600'}`}
            >
              {isWinner ? '🎉 Congratulations!' : '💸 Game Over'}
            </h1>

            {isWinner ? (
              <div>
                <p className="text-gray-700 mb-4">
                  You successfully ran your lemonade stand for 30 days!
                </p>
                <p className="text-lg font-semibold mb-2">
                  Final Assets: ${gameState.assets.toFixed(2)}
                </p>
                <p className="text-xl font-bold text-green-600 mb-6">
                  {getPerformanceRating(gameState.assets)}
                </p>
              </div>
            ) : (
              <div>
                {gameState.bankrupt ? (
                  <div className="mb-6">
                    <div className="text-6xl mb-4">💸</div>
                    <p className="text-xl font-bold text-red-600 mb-2">BANKRUPTCY!</p>
                    <p className="text-gray-700 mb-4">
                      You ran out of money on Day {gameState.day} and couldn't continue your
                      lemonade business.
                    </p>
                    <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-4">
                      <p className="text-sm text-red-800 mb-2">
                        <strong>What went wrong?</strong>
                      </p>
                      <ul className="text-xs text-red-700 space-y-1">
                        <li>• You didn't have enough money to buy lemonade mix for the next day</li>
                        <li>• Try making fewer glasses or charging higher prices</li>
                        <li>• Watch the weather - rainy days mean fewer customers</li>
                        <li>• Don't spend too much on signs early in the game</li>
                      </ul>
                    </div>
                    <p className="text-lg font-semibold text-red-600">
                      Final Assets: ${gameState.assets.toFixed(2)}
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-700 mb-4">
                      You lasted {gameState.day} day{gameState.day !== 1 ? 's' : ''} in the lemonade
                      business!
                    </p>
                    <p className="text-lg font-semibold mb-6">
                      Final Assets: ${gameState.assets.toFixed(2)}
                    </p>
                  </div>
                )}
              </div>
            )}

            <button
              data-testid="play-again"
              onClick={async () => {
                // Reset player data in Redis
                try {
                  await fetch('/api/reset-player', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                  });
                } catch (error) {
                  console.error('Failed to reset player data:', error);
                }

                setPhase('intro');
                setGameState({
                  day: 0,
                  cash: 2.0,
                  glasses: 0,
                  signs: 0,
                  price: 0,
                  weather: 'sunny',
                  assets: 2.0,
                  bankrupt: false,
                });
                setDayResult(null);
                setFlairNotification(null);
                setSavedGame(null);
                // Stop audio when returning to intro
                if (audioRef.current) {
                  audioRef.current.pause();
                  audioRef.current.currentTime = 0;
                }
              }}
              className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-6 rounded-lg"
            >
              Play Again 🔄
            </button>
          </div>
        </div>
        <FlairNotificationModal />
      </>
    );
  }

  return null;
};
