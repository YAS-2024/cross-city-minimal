// src/models/PlayerModel.ts
import type { CardEntity } from '../types'; // ★ typeを追加、CardData削除

export class PlayerModel {
  readonly id: string;
  private hand: CardEntity[] = [];
  
  private budget: number = 0;
  private score: { p1: number; p2: number } = { p1: 0, p2: 0 };

  constructor(id: string) {
    this.id = id;
  }

  addCardToHand(card: CardEntity): void {
    card.ownerId = this.id;
    this.hand.push(card);
  }

  removeCardFromHand(instanceId: string): CardEntity | undefined {
    const index = this.hand.findIndex(c => c.instanceId === instanceId);
    if (index === -1) return undefined;

    const [card] = this.hand.splice(index, 1);
    return card;
  }

  getHand(): CardEntity[] {
    return [...this.hand];
  }

  setBudget(amount: number): void {
    this.budget = amount;
  }

  addBudget(amount: number): void {
    this.budget += amount;
  }

  getBudget(): number {
    return this.budget;
  }
  
  resetBudget(baseIncome: number): void {
    this.budget = baseIncome;
  }

  // ★ scoreを使用するためのゲッターを追加（これで警告が消えます）
  getScore(): { p1: number; p2: number } {
    return this.score;
  }
}