import React from 'react';
import { WeeklyCycle } from '../../shared/types/game.js';

interface FestivalThemeRendererProps {
  festival: WeeklyCycle;
  children: React.ReactNode;
}

export const FestivalThemeRenderer: React.FC<FestivalThemeRendererProps> = ({ 
  festival, 
  children 
}) => {
  const getThemeClass = (festivalName: string): string => {
    // Convert festival name to CSS class
    return `festival-${festivalName.toLowerCase().replace(/\s+/g, '-')}`;
  };

  const getThemeBackground = (festivalName: string): React.CSSProperties => {
    const themes: Record<string, React.CSSProperties> = {
      // Holiday Themes
      'halloween': {
        background: 'linear-gradient(135deg, #ff6b35, #f7931e, #2d1b69)',
        color: '#fff'
      },
      'christmas': {
        background: 'linear-gradient(135deg, #c41e3a, #228b22, #ffd700)',
        color: '#fff'
      },
      'valentine': {
        background: 'linear-gradient(135deg, #ff69b4, #ff1493, #dc143c)',
        color: '#fff'
      },
      'easter': {
        background: 'linear-gradient(135deg, #ffb6c1, #98fb98, #f0e68c)',
        color: '#333'
      },
      'independence': {
        background: 'linear-gradient(135deg, #ff0000, #ffffff, #0000ff)',
        color: '#333'
      },
      'thanksgiving': {
        background: 'linear-gradient(135deg, #d2691e, #ff8c00, #8b4513)',
        color: '#fff'
      },
      
      // Aesthetic Themes
      'neon': {
        background: 'linear-gradient(135deg, #ff00ff, #00ffff, #ffff00)',
        color: '#000',
        textShadow: '0 0 10px rgba(255,255,255,0.8)'
      },
      'pastel': {
        background: 'linear-gradient(135deg, #ffb3ba, #bae1ff, #ffffba)',
        color: '#333'
      },
      'monochrome': {
        background: 'linear-gradient(135deg, #000000, #808080, #ffffff)',
        color: '#fff'
      },
      'sunset': {
        background: 'linear-gradient(135deg, #ff7f50, #ff6347, #ff4500)',
        color: '#fff'
      },
      'ocean': {
        background: 'linear-gradient(135deg, #006994, #0099cc, #66ccff)',
        color: '#fff'
      },
      'forest': {
        background: 'linear-gradient(135deg, #228b22, #32cd32, #90ee90)',
        color: '#fff'
      },
      
      // Era Themes
      'retro': {
        background: 'linear-gradient(135deg, #ff6b9d, #c44569, #f8b500)',
        color: '#fff',
        fontFamily: 'monospace'
      },
      'vintage': {
        background: 'linear-gradient(135deg, #8b4513, #daa520, #f5deb3)',
        color: '#333'
      },
      'cyberpunk': {
        background: 'linear-gradient(135deg, #0f3460, #16537e, #533a7b)',
        color: '#00ff00',
        textShadow: '0 0 5px #00ff00'
      },
      'steampunk': {
        background: 'linear-gradient(135deg, #8b4513, #cd853f, #daa520)',
        color: '#fff'
      },
      
      // Genre Themes
      'space': {
        background: 'linear-gradient(135deg, #000428, #004e92, #009ffd)',
        color: '#fff'
      },
      'fantasy': {
        background: 'linear-gradient(135deg, #667eea, #764ba2, #f093fb)',
        color: '#fff'
      },
      'western': {
        background: 'linear-gradient(135deg, #8b4513, #daa520, #f4a460)',
        color: '#fff'
      },
      'tropical': {
        background: 'linear-gradient(135deg, #ff9a9e, #fecfef, #fecfef)',
        color: '#333'
      }
    };

    const festivalKey = festivalName.toLowerCase().replace(/\s+/g, '');
    return themes[festivalKey] || {
      background: 'linear-gradient(135deg, #ffd89b, #19547b)',
      color: '#fff'
    };
  };

  const themeStyle = getThemeBackground(festival.festival);
  const themeClass = getThemeClass(festival.festival);

  return (
    <div 
      className={`festival-theme ${themeClass}`}
      style={themeStyle}
    >
      <div className="festival-overlay">
        {children}
      </div>
      
      {/* Festival decorations */}
      <div className="festival-decorations">
        {festival.modifiers.specialEffects?.map((effect, index) => (
          <div key={index} className={`decoration decoration-${effect}`}>
            {getDecorationIcon(effect)}
          </div>
        ))}
      </div>
    </div>
  );
};

const getDecorationIcon = (effect: string): string => {
  const decorations: Record<string, string> = {
    'sparkles': '✨',
    'confetti': '🎊',
    'balloons': '🎈',
    'fireworks': '🎆',
    'hearts': '💖',
    'stars': '⭐',
    'snowflakes': '❄️',
    'leaves': '🍂',
    'flowers': '🌸',
    'music': '🎵',
    'lights': '💡',
    'ribbons': '🎀'
  };
  
  return decorations[effect] || '🎉';
};
