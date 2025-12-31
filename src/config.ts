// src/config.ts

export const GAME_CONFIG = {
  // 盤面設定
  BOARD: {
    RADIUS: 2,           // 中心から半径何マスか (2なら -2〜+2 の 5x5)
  },

  // カード・デッキ設定
  CARD: {
    COPIES_IN_DECK: 3,   // 1種類あたりの枚数
    INITIAL_HAND: 3,     // ゲーム開始時の手札枚数
    DRAW_PER_TURN: 1,    // ターン開始時のドロー枚数
    MAX_HAND: 7,         // 手札上限枚数（UIの表示崩れ防止のため推奨）
  },

  // 経済設定
  ECONOMY: {
    DISCARD_BONUS: 2,    // カードを捨てた時の収入
  },
  
  // システム設定
  SYSTEM: {
    AI_THINK_TIME: 1000, // CPUの思考時間(ms)
  }
} as const;