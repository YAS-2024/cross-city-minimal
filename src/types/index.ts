export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export interface Position {
  x: number;
  y: number;
}

export type CardCategory = 'TOWN_HALL' | 'RESIDENTIAL' | 'NON_RESIDENTIAL';

export type EffectTrigger = 'ON_PLACE' | 'PASSIVE' | 'END_GAME';
export type EffectType = 'DRAW' | 'GET_BUDGET' | 'BUFF_ADJACENT' | 'BUFF_GLOBAL';

export interface CardEffect {
  trigger: EffectTrigger;
  type: EffectType;
  value: number;
  targetCategory?: CardCategory;
  description: string;
}

export interface CardData {
  id: string;
  name: string;
  category: CardCategory;
  rarity: 'COMMON' | 'UNCOMMON' | 'RARE' | 'LEGENDARY';
  cost: number;
  inDeck?: boolean; // falseの場合、山札に含まれない（初期配置など）
  image?: string;   // 画像ファイル名 (例: "card_name.png")
  stats: {
    p1: number; // 👤 人口
    p2: number; // ⚡ インフラ
    tax: number; // 💰 税収
  };
  arrows: Direction[];
  effects?: CardEffect[];
  description?: string; // ★追加: フレーバーテキストや補足説明用
}

export interface CardEntity {
  instanceId: string;
  ownerId: string;
  data: CardData;
}

export type GamePhase = 'SETUP' | 'DRAW' | 'BUDGET' | 'MAIN' | 'END';

export interface ActionResult {
  success: boolean;
  message: string;
}