declare module '*.css';

interface Window {
  render_game_to_text?: () => string;
  advanceTime?: (milliseconds: number) => Promise<void>;
}

interface ImportMetaEnv {
  readonly DEV: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
