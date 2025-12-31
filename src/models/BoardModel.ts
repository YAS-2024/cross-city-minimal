// src/models/BoardModel.ts
import type { CardEntity, Position, Direction } from '../types'; // ★ typeを追加

export class BoardModel {
  private grid: Map<string, CardEntity> = new Map();

  placeCard(card: CardEntity, pos: Position): void {
    const key = this.getKey(pos);
    this.grid.set(key, card);
  }

  getCardAt(pos: Position): CardEntity | undefined {
    return this.grid.get(this.getKey(pos));
  }

  isEmpty(pos: Position): boolean {
    return !this.grid.has(this.getKey(pos));
  }

  getAllCards(): { pos: Position; card: CardEntity }[] {
    const result: { pos: Position; card: CardEntity }[] = [];
    this.grid.forEach((card, key) => {
      const [x, y] = key.split(',').map(Number);
      result.push({ pos: { x, y }, card });
    });
    return result;
  }

  private getKey(pos: Position): string {
    return `${pos.x},${pos.y}`;
  }

  getAdjacentPos(pos: Position, dir: Direction): Position {
    switch (dir) {
      case 'UP':    return { x: pos.x, y: pos.y - 1 };
      case 'DOWN':  return { x: pos.x, y: pos.y + 1 };
      case 'LEFT':  return { x: pos.x - 1, y: pos.y };
      case 'RIGHT': return { x: pos.x + 1, y: pos.y };
    }
  }

  getOppositeDir(dir: Direction): Direction {
    switch (dir) {
      case 'UP':    return 'DOWN';
      case 'DOWN':  return 'UP';
      case 'LEFT':  return 'RIGHT';
      case 'RIGHT': return 'LEFT';
    }
  }
}