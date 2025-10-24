// Global game configuration schema
export interface GameConfig {
  version: number;
  game: {
    sessionDurationSec: number;
    minPrice: number;
    maxPrice: number;
    minAdSpend: number;
    maxAdSpend: number;
  };
  economy: {
    baseCustomers: number;
    priceElasticity: number;
    adEffect: number;
    reputationEffect: number;
    inventoryCostPerCup: number;
    fixedCostPerDay: number;
  };
  statScaling: {
    ckToService: number;
    pkToMarketing: number;
    ageDaysToRep: number;
  };
  limits: {
    maxPostsPerUserPerDay: number;
    minSecondsBetweenRuns: number;
  };
  payments: {
    powerups: Record<string, PowerupConfig>;
  };
  festivals: Record<string, FestivalTheme>;
}

export interface PowerupConfig {
  sku: string;
  price: number;
  currency: string;
  dailyLimit: number;
  effects: PowerupEffect;
}

export interface PowerupEffect {
  type: 'SUPER_SUGAR';
  demandBonus: number;
  serviceBonus: number;
  duration: 'single_run';
}

export interface FestivalTheme {
  id: string;
  name: string;
  category: FestivalCategory;
  modifiers: {
    demandMultiplier?: number;
    priceVariance?: number;
    criticalSaleChance?: number;
    costVolatility?: number;
    specialEffects?: string[];
  };
  visualElements: {
    backgroundColor: string;
    standDecoration: string;
    uiTheme: string;
    iconSet: string;
  };
}

export enum FestivalCategory {
  HOLIDAY = 'holiday',
  AESTHETIC = 'aesthetic',
  ERA = 'era',
  GENRE = 'genre'
}

// Festival theme definitions
export const FESTIVAL_THEMES: Record<string, FestivalTheme> = {
  // Holiday themes
  VALENTINE_HEARTS: {
    id: 'VALENTINE_HEARTS',
    name: 'Valentine Hearts',
    category: FestivalCategory.HOLIDAY,
    modifiers: {
      demandMultiplier: 1.2,
      criticalSaleChance: 0.15,
      specialEffects: ['love_boost', 'pink_hearts']
    },
    visualElements: {
      backgroundColor: '#ff69b4',
      standDecoration: 'hearts',
      uiTheme: 'romantic',
      iconSet: 'valentine'
    }
  },
  EASTER_SPRING: {
    id: 'EASTER_SPRING',
    name: 'Easter Spring',
    category: FestivalCategory.HOLIDAY,
    modifiers: {
      demandMultiplier: 1.15,
      priceVariance: 0.1,
      specialEffects: ['spring_bloom', 'easter_eggs']
    },
    visualElements: {
      backgroundColor: '#90ee90',
      standDecoration: 'flowers',
      uiTheme: 'spring',
      iconSet: 'easter'
    }
  },
  MOTHER_DAY_GARDEN: {
    id: 'MOTHER_DAY_GARDEN',
    name: 'Mother\'s Day Garden',
    category: FestivalCategory.HOLIDAY,
    modifiers: {
      demandMultiplier: 1.25,
      specialEffects: ['family_love', 'garden_fresh']
    },
    visualElements: {
      backgroundColor: '#ffc0cb',
      standDecoration: 'garden',
      uiTheme: 'floral',
      iconSet: 'mothers_day'
    }
  },
  FATHER_DAY_GRILL: {
    id: 'FATHER_DAY_GRILL',
    name: 'Father\'s Day Grill',
    category: FestivalCategory.HOLIDAY,
    modifiers: {
      demandMultiplier: 1.2,
      costVolatility: 0.05,
      specialEffects: ['bbq_vibes', 'dad_jokes']
    },
    visualElements: {
      backgroundColor: '#8b4513',
      standDecoration: 'grill',
      uiTheme: 'rustic',
      iconSet: 'fathers_day'
    }
  },
  SUMMER_SOLSTICE: {
    id: 'SUMMER_SOLSTICE',
    name: 'Summer Solstice',
    category: FestivalCategory.HOLIDAY,
    modifiers: {
      demandMultiplier: 1.3,
      specialEffects: ['sun_power', 'longest_day']
    },
    visualElements: {
      backgroundColor: '#ffd700',
      standDecoration: 'sun',
      uiTheme: 'bright',
      iconSet: 'summer'
    }
  },
  HALLOWEEN_SPOOKY: {
    id: 'HALLOWEEN_SPOOKY',
    name: 'Halloween Spooky',
    category: FestivalCategory.HOLIDAY,
    modifiers: {
      demandMultiplier: 1.1,
      criticalSaleChance: 0.2,
      specialEffects: ['spooky_boost', 'trick_or_treat']
    },
    visualElements: {
      backgroundColor: '#ff4500',
      standDecoration: 'pumpkins',
      uiTheme: 'spooky',
      iconSet: 'halloween'
    }
  },
  WINTER_SOLSTICE: {
    id: 'WINTER_SOLSTICE',
    name: 'Winter Solstice',
    category: FestivalCategory.HOLIDAY,
    modifiers: {
      demandMultiplier: 0.9,
      priceVariance: 0.15,
      specialEffects: ['winter_warmth', 'cozy_vibes']
    },
    visualElements: {
      backgroundColor: '#87ceeb',
      standDecoration: 'snowflakes',
      uiTheme: 'winter',
      iconSet: 'winter'
    }
  },
  CHRISTMAS_WINTER: {
    id: 'CHRISTMAS_WINTER',
    name: 'Christmas Winter',
    category: FestivalCategory.HOLIDAY,
    modifiers: {
      demandMultiplier: 1.4,
      specialEffects: ['christmas_spirit', 'gift_giving']
    },
    visualElements: {
      backgroundColor: '#dc143c',
      standDecoration: 'christmas_tree',
      uiTheme: 'festive',
      iconSet: 'christmas'
    }
  },
  NEW_YEAR_PARTY: {
    id: 'NEW_YEAR_PARTY',
    name: 'New Year Party',
    category: FestivalCategory.HOLIDAY,
    modifiers: {
      demandMultiplier: 1.35,
      criticalSaleChance: 0.25,
      specialEffects: ['celebration', 'new_beginnings']
    },
    visualElements: {
      backgroundColor: '#ffd700',
      standDecoration: 'fireworks',
      uiTheme: 'celebration',
      iconSet: 'new_year'
    }
  },
  ST_PATRICK_LUCKY: {
    id: 'ST_PATRICK_LUCKY',
    name: 'St. Patrick\'s Lucky',
    category: FestivalCategory.HOLIDAY,
    modifiers: {
      demandMultiplier: 1.15,
      criticalSaleChance: 0.3,
      specialEffects: ['luck_of_irish', 'four_leaf_clover']
    },
    visualElements: {
      backgroundColor: '#228b22',
      standDecoration: 'shamrocks',
      uiTheme: 'irish',
      iconSet: 'st_patrick'
    }
  },

  // Aesthetic themes
  NEON_CYBER: {
    id: 'NEON_CYBER',
    name: 'Neon Cyber',
    category: FestivalCategory.AESTHETIC,
    modifiers: {
      demandMultiplier: 1.1,
      priceVariance: 0.2,
      specialEffects: ['digital_boost', 'neon_glow']
    },
    visualElements: {
      backgroundColor: '#00ffff',
      standDecoration: 'neon_lights',
      uiTheme: 'cyberpunk',
      iconSet: 'cyber'
    }
  },
  VINTAGE_RETRO: {
    id: 'VINTAGE_RETRO',
    name: 'Vintage Retro',
    category: FestivalCategory.AESTHETIC,
    modifiers: {
      demandMultiplier: 1.05,
      costVolatility: -0.1,
      specialEffects: ['nostalgia', 'classic_charm']
    },
    visualElements: {
      backgroundColor: '#daa520',
      standDecoration: 'vintage_signs',
      uiTheme: 'retro',
      iconSet: 'vintage'
    }
  },
  MINIMALIST_CLEAN: {
    id: 'MINIMALIST_CLEAN',
    name: 'Minimalist Clean',
    category: FestivalCategory.AESTHETIC,
    modifiers: {
      demandMultiplier: 1.0,
      priceVariance: -0.05,
      specialEffects: ['zen_focus', 'clean_efficiency']
    },
    visualElements: {
      backgroundColor: '#f5f5f5',
      standDecoration: 'simple_lines',
      uiTheme: 'minimal',
      iconSet: 'clean'
    }
  },
  COTTAGECORE_COZY: {
    id: 'COTTAGECORE_COZY',
    name: 'Cottagecore Cozy',
    category: FestivalCategory.AESTHETIC,
    modifiers: {
      demandMultiplier: 1.15,
      specialEffects: ['homemade_charm', 'countryside_peace']
    },
    visualElements: {
      backgroundColor: '#deb887',
      standDecoration: 'wildflowers',
      uiTheme: 'cottage',
      iconSet: 'cozy'
    }
  },
  DARK_GOTHIC: {
    id: 'DARK_GOTHIC',
    name: 'Dark Gothic',
    category: FestivalCategory.AESTHETIC,
    modifiers: {
      demandMultiplier: 0.95,
      criticalSaleChance: 0.15,
      specialEffects: ['mysterious_allure', 'dark_elegance']
    },
    visualElements: {
      backgroundColor: '#2f2f2f',
      standDecoration: 'gothic_arches',
      uiTheme: 'dark',
      iconSet: 'gothic'
    }
  },
  PASTEL_KAWAII: {
    id: 'PASTEL_KAWAII',
    name: 'Pastel Kawaii',
    category: FestivalCategory.AESTHETIC,
    modifiers: {
      demandMultiplier: 1.2,
      specialEffects: ['cuteness_overload', 'kawaii_magic']
    },
    visualElements: {
      backgroundColor: '#ffb6c1',
      standDecoration: 'cute_characters',
      uiTheme: 'kawaii',
      iconSet: 'pastel'
    }
  },
  GRUNGE_PUNK: {
    id: 'GRUNGE_PUNK',
    name: 'Grunge Punk',
    category: FestivalCategory.AESTHETIC,
    modifiers: {
      demandMultiplier: 1.0,
      priceVariance: 0.25,
      specialEffects: ['rebel_spirit', 'underground_cool']
    },
    visualElements: {
      backgroundColor: '#696969',
      standDecoration: 'graffiti',
      uiTheme: 'grunge',
      iconSet: 'punk'
    }
  },
  ART_DECO_GLAM: {
    id: 'ART_DECO_GLAM',
    name: 'Art Deco Glam',
    category: FestivalCategory.AESTHETIC,
    modifiers: {
      demandMultiplier: 1.25,
      costVolatility: 0.1,
      specialEffects: ['luxury_appeal', 'golden_age']
    },
    visualElements: {
      backgroundColor: '#ffd700',
      standDecoration: 'geometric_patterns',
      uiTheme: 'glamorous',
      iconSet: 'art_deco'
    }
  },
  TROPICAL_PARADISE: {
    id: 'TROPICAL_PARADISE',
    name: 'Tropical Paradise',
    category: FestivalCategory.AESTHETIC,
    modifiers: {
      demandMultiplier: 1.3,
      specialEffects: ['island_vibes', 'tropical_breeze']
    },
    visualElements: {
      backgroundColor: '#00ced1',
      standDecoration: 'palm_trees',
      uiTheme: 'tropical',
      iconSet: 'paradise'
    }
  },
  DESERT_OASIS: {
    id: 'DESERT_OASIS',
    name: 'Desert Oasis',
    category: FestivalCategory.AESTHETIC,
    modifiers: {
      demandMultiplier: 1.4,
      specialEffects: ['oasis_relief', 'desert_mirage']
    },
    visualElements: {
      backgroundColor: '#f4a460',
      standDecoration: 'cacti',
      uiTheme: 'desert',
      iconSet: 'oasis'
    }
  },

  // Era themes
  MEDIEVAL_TIMES: {
    id: 'MEDIEVAL_TIMES',
    name: 'Medieval Times',
    category: FestivalCategory.ERA,
    modifiers: {
      demandMultiplier: 1.0,
      costVolatility: 0.2,
      specialEffects: ['ye_olde_charm', 'medieval_fair']
    },
    visualElements: {
      backgroundColor: '#8b4513',
      standDecoration: 'castle_banners',
      uiTheme: 'medieval',
      iconSet: 'knights'
    }
  },
  WILD_WEST: {
    id: 'WILD_WEST',
    name: 'Wild West',
    category: FestivalCategory.ERA,
    modifiers: {
      demandMultiplier: 1.1,
      priceVariance: 0.3,
      specialEffects: ['frontier_spirit', 'gold_rush']
    },
    visualElements: {
      backgroundColor: '#daa520',
      standDecoration: 'saloon_doors',
      uiTheme: 'western',
      iconSet: 'cowboy'
    }
  },
  SPACE_AGE: {
    id: 'SPACE_AGE',
    name: 'Space Age',
    category: FestivalCategory.ERA,
    modifiers: {
      demandMultiplier: 1.2,
      specialEffects: ['cosmic_energy', 'space_exploration']
    },
    visualElements: {
      backgroundColor: '#191970',
      standDecoration: 'rockets',
      uiTheme: 'futuristic',
      iconSet: 'space'
    }
  },
  STONE_AGE: {
    id: 'STONE_AGE',
    name: 'Stone Age',
    category: FestivalCategory.ERA,
    modifiers: {
      demandMultiplier: 0.8,
      costVolatility: -0.2,
      specialEffects: ['primitive_charm', 'stone_tools']
    },
    visualElements: {
      backgroundColor: '#8b7355',
      standDecoration: 'cave_paintings',
      uiTheme: 'prehistoric',
      iconSet: 'stone_age'
    }
  },
  ROARING_TWENTIES: {
    id: 'ROARING_TWENTIES',
    name: 'Roaring Twenties',
    category: FestivalCategory.ERA,
    modifiers: {
      demandMultiplier: 1.3,
      criticalSaleChance: 0.2,
      specialEffects: ['jazz_age', 'prohibition_thrill']
    },
    visualElements: {
      backgroundColor: '#ffd700',
      standDecoration: 'art_deco',
      uiTheme: 'twenties',
      iconSet: 'jazz'
    }
  },
  DISCO_SEVENTIES: {
    id: 'DISCO_SEVENTIES',
    name: 'Disco Seventies',
    category: FestivalCategory.ERA,
    modifiers: {
      demandMultiplier: 1.25,
      specialEffects: ['disco_fever', 'groovy_vibes']
    },
    visualElements: {
      backgroundColor: '#ff69b4',
      standDecoration: 'disco_ball',
      uiTheme: 'disco',
      iconSet: 'seventies'
    }
  },
  NEON_EIGHTIES: {
    id: 'NEON_EIGHTIES',
    name: 'Neon Eighties',
    category: FestivalCategory.ERA,
    modifiers: {
      demandMultiplier: 1.15,
      priceVariance: 0.15,
      specialEffects: ['synthwave', 'neon_nights']
    },
    visualElements: {
      backgroundColor: '#ff1493',
      standDecoration: 'neon_grid',
      uiTheme: 'eighties',
      iconSet: 'retro_wave'
    }
  },
  GRUNGE_NINETIES: {
    id: 'GRUNGE_NINETIES',
    name: 'Grunge Nineties',
    category: FestivalCategory.ERA,
    modifiers: {
      demandMultiplier: 1.05,
      specialEffects: ['alternative_cool', 'flannel_comfort']
    },
    visualElements: {
      backgroundColor: '#696969',
      standDecoration: 'band_posters',
      uiTheme: 'grunge',
      iconSet: 'nineties'
    }
  },
  VICTORIAN_ELEGANCE: {
    id: 'VICTORIAN_ELEGANCE',
    name: 'Victorian Elegance',
    category: FestivalCategory.ERA,
    modifiers: {
      demandMultiplier: 1.1,
      costVolatility: 0.05,
      specialEffects: ['refined_taste', 'proper_etiquette']
    },
    visualElements: {
      backgroundColor: '#800080',
      standDecoration: 'lace_curtains',
      uiTheme: 'victorian',
      iconSet: 'elegant'
    }
  },
  ANCIENT_EGYPT: {
    id: 'ANCIENT_EGYPT',
    name: 'Ancient Egypt',
    category: FestivalCategory.ERA,
    modifiers: {
      demandMultiplier: 1.2,
      specialEffects: ['pharaoh_blessing', 'pyramid_power']
    },
    visualElements: {
      backgroundColor: '#daa520',
      standDecoration: 'hieroglyphs',
      uiTheme: 'egyptian',
      iconSet: 'ancient'
    }
  },

  // Genre themes
  ZOMBIE_APOCALYPSE: {
    id: 'ZOMBIE_APOCALYPSE',
    name: 'Zombie Apocalypse',
    category: FestivalCategory.GENRE,
    modifiers: {
      demandMultiplier: 0.7,
      criticalSaleChance: 0.4,
      specialEffects: ['survival_instinct', 'apocalypse_premium']
    },
    visualElements: {
      backgroundColor: '#8b0000',
      standDecoration: 'barricades',
      uiTheme: 'apocalypse',
      iconSet: 'zombie'
    }
  },
  SUPERHERO_CITY: {
    id: 'SUPERHERO_CITY',
    name: 'Superhero City',
    category: FestivalCategory.GENRE,
    modifiers: {
      demandMultiplier: 1.3,
      specialEffects: ['hero_boost', 'super_powers']
    },
    visualElements: {
      backgroundColor: '#0000ff',
      standDecoration: 'city_skyline',
      uiTheme: 'superhero',
      iconSet: 'comic'
    }
  },
  PIRATE_SEAS: {
    id: 'PIRATE_SEAS',
    name: 'Pirate Seas',
    category: FestivalCategory.GENRE,
    modifiers: {
      demandMultiplier: 1.15,
      priceVariance: 0.25,
      specialEffects: ['treasure_hunt', 'sea_adventure']
    },
    visualElements: {
      backgroundColor: '#008b8b',
      standDecoration: 'pirate_ship',
      uiTheme: 'nautical',
      iconSet: 'pirate'
    }
  },
  NINJA_VILLAGE: {
    id: 'NINJA_VILLAGE',
    name: 'Ninja Village',
    category: FestivalCategory.GENRE,
    modifiers: {
      demandMultiplier: 1.1,
      criticalSaleChance: 0.3,
      specialEffects: ['stealth_sales', 'ninja_efficiency']
    },
    visualElements: {
      backgroundColor: '#2f2f2f',
      standDecoration: 'bamboo',
      uiTheme: 'ninja',
      iconSet: 'martial_arts'
    }
  },
  WIZARD_ACADEMY: {
    id: 'WIZARD_ACADEMY',
    name: 'Wizard Academy',
    category: FestivalCategory.GENRE,
    modifiers: {
      demandMultiplier: 1.25,
      specialEffects: ['magic_boost', 'spell_casting']
    },
    visualElements: {
      backgroundColor: '#4b0082',
      standDecoration: 'magic_crystals',
      uiTheme: 'magical',
      iconSet: 'wizard'
    }
  },
  ROBOT_FACTORY: {
    id: 'ROBOT_FACTORY',
    name: 'Robot Factory',
    category: FestivalCategory.GENRE,
    modifiers: {
      demandMultiplier: 1.0,
      costVolatility: -0.15,
      specialEffects: ['automation', 'mechanical_precision']
    },
    visualElements: {
      backgroundColor: '#c0c0c0',
      standDecoration: 'gears',
      uiTheme: 'industrial',
      iconSet: 'robot'
    }
  },
  FAIRY_FOREST: {
    id: 'FAIRY_FOREST',
    name: 'Fairy Forest',
    category: FestivalCategory.GENRE,
    modifiers: {
      demandMultiplier: 1.2,
      specialEffects: ['fairy_magic', 'enchanted_grove']
    },
    visualElements: {
      backgroundColor: '#98fb98',
      standDecoration: 'mushrooms',
      uiTheme: 'enchanted',
      iconSet: 'fairy'
    }
  },
  DETECTIVE_NOIR: {
    id: 'DETECTIVE_NOIR',
    name: 'Detective Noir',
    category: FestivalCategory.GENRE,
    modifiers: {
      demandMultiplier: 1.05,
      criticalSaleChance: 0.25,
      specialEffects: ['mystery_intrigue', 'noir_atmosphere']
    },
    visualElements: {
      backgroundColor: '#2f2f2f',
      standDecoration: 'street_lamps',
      uiTheme: 'noir',
      iconSet: 'detective'
    }
  },
  RACING_SPEEDWAY: {
    id: 'RACING_SPEEDWAY',
    name: 'Racing Speedway',
    category: FestivalCategory.GENRE,
    modifiers: {
      demandMultiplier: 1.3,
      priceVariance: 0.2,
      specialEffects: ['speed_boost', 'adrenaline_rush']
    },
    visualElements: {
      backgroundColor: '#ff4500',
      standDecoration: 'checkered_flags',
      uiTheme: 'racing',
      iconSet: 'speed'
    }
  },
  MUSIC_FESTIVAL: {
    id: 'MUSIC_FESTIVAL',
    name: 'Music Festival',
    category: FestivalCategory.GENRE,
    modifiers: {
      demandMultiplier: 1.4,
      specialEffects: ['concert_energy', 'festival_vibes']
    },
    visualElements: {
      backgroundColor: '#ff69b4',
      standDecoration: 'stage_lights',
      uiTheme: 'festival',
      iconSet: 'music'
    }
  }
};

// Default configuration values
export const DEFAULT_CONFIG: GameConfig = {
  version: 1,
  game: {
    sessionDurationSec: 300,
    minPrice: 0.25,
    maxPrice: 5.0,
    minAdSpend: 0,
    maxAdSpend: 50
  },
  economy: {
    baseCustomers: 20,
    priceElasticity: 0.8,
    adEffect: 0.1,
    reputationEffect: 0.05,
    inventoryCostPerCup: 0.15,
    fixedCostPerDay: 5.0
  },
  statScaling: {
    ckToService: 0.001,
    pkToMarketing: 0.001,
    ageDaysToRep: 0.01
  },
  limits: {
    maxPostsPerUserPerDay: 10,
    minSecondsBetweenRuns: 30
  },
  payments: {
    powerups: {
      SUPER_SUGAR: {
        sku: 'super_sugar_boost',
        price: 99,
        currency: 'USD',
        dailyLimit: 2,
        effects: {
          type: 'SUPER_SUGAR',
          demandBonus: 0.2,
          serviceBonus: 1,
          duration: 'single_run'
        }
      }
    }
  },
  festivals: FESTIVAL_THEMES
};
