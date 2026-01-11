// src/config.ts

export const GAME_CONFIG = {
  // ... (BOARD, CARD, ECONOMY, SYSTEM は変更なし)
  BOARD: {
    ROWS: 5,
    COLS: 6,
    X_MIN: -3,
    X_MAX: 2,
    Y_MIN: -2,
    Y_MAX: 2,
  },
  CARD: {
    COPIES_BY_RARITY: { COMMON: 3, UNCOMMON: 2, RARE: 1, LEGENDARY: 1 },
    INITIAL_HAND: 3,
    DRAW_PER_TURN: 1,
    MAX_HAND: 7,
  },
  ECONOMY: { DISCARD_BONUS: 2 },
  SYSTEM: { AI_THINK_TIME: 1000 },

  // ★変更: AI設定
  AI: {
    DIFFICULTY: {
      EASY: { 
        // 1手あたりの基本回数
        BASE_SIMULATIONS: 10, 
        // 1ターン全体での総回数リミット（これを超えないように各手の回数を減らす）
        MAX_TOTAL_SIMULATIONS: 50, 
        DEPTH: 2 
      },
      NORMAL: { 
        BASE_SIMULATIONS: 50, 
        MAX_TOTAL_SIMULATIONS: 500, // 10手くらいならフルパワー、それ以上は分散
        DEPTH: 4 
      },
      HARD: { 
        BASE_SIMULATIONS: 300, 
        MAX_TOTAL_SIMULATIONS: 3000, // かなり余裕を持たせる
        DEPTH: 6 
      }
    }
  }
} as const;