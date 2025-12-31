// src/types/index.ts

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export interface Position {
  x: number;
  y: number;
}

export type CardType = 'RESIDENTIAL' | 'COMMERCIAL' | 'INFRASTRUCTURE' | 'PUBLIC' | 'SPECIAL';

export interface CardData {
  id: string;
  name: string;
  type: CardType;
  rarity: 'COMMON' | 'UNCOMMON' | 'RARE';
  cost: number;
  stats: {
    p1: number;
    p2: number;
    tax: number;
  };
  arrows: Direction[];
  description?: string;
}

export interface CardEntity {
  instanceId: string;
  ownerId: string;
  data: CardData;
}

export type GamePhase = 'SETUP' | 'DRAW' | 'BUDGET' | 'MAIN' | 'END';