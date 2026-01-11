import type { CardEntity } from '../types';

export class PlayerModel {
  readonly id: string;
  private hand: CardEntity[] = [];
  private budget: number = 0;

  constructor(id: string) {
    this.id = id;
  }

  public clone(): PlayerModel {
    const newPlayer = new PlayerModel(this.id);
    newPlayer.budget = this.budget;
    newPlayer.hand = this.hand.map(c => ({ ...c })); 
    return newPlayer;
  }

  addCardToHand(card: CardEntity) {
    this.hand.push(card);
  }

  // ★追加: シミュレーション用に手札を全消去するメソッド
  clearHand() {
    this.hand = [];
  }

  removeCardFromHand(instanceId: string): CardEntity | null {
    const idx = this.hand.findIndex(c => c.instanceId === instanceId);
    if (idx === -1) return null;
    return this.hand.splice(idx, 1)[0];
  }

  getHand(): CardEntity[] {
    return [...this.hand];
  }
  
  // (budget関連のメソッドは省略...変更なし)
  setBudget(amount: number) { this.budget = amount; }
  addBudget(amount: number) { this.budget += amount; }
  consumeBudget(amount: number): boolean {
    if (this.budget >= amount) {
      this.budget -= amount;
      return true;
    }
    return false;
  }
  getBudget(): number { return this.budget; }
}