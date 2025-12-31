// src/config.ts

export const GAME_CONFIG = {
  BOARD: {
    RADIUS: 2,
  },

  CARD: {
    // ★変更: 一律設定(COPIES_IN_DECK)を削除し、レアリティ別に設定
    COPIES_BY_RARITY: {
      COMMON: 3,
      UNCOMMON: 2,
      RARE: 1,
      LEGENDARY: 1,
    },
    INITIAL_HAND: 3,
    DRAW_PER_TURN: 1,
    MAX_HAND: 7,
  },

  ECONOMY: {
    DISCARD_BONUS: 2,
  },
  
  SYSTEM: {
    AI_THINK_TIME: 1000,
  }
} as const;