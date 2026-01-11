import type { CardEntity, Position, Direction } from '../types';

export class BoardModel {
  // キーは "x,y" 形式の文字列
  private grid: Map<string, { card: CardEntity, pos: Position }>;

  constructor() {
    this.grid = new Map();
  }

  // ★追加: 盤面の複製を作成
  public clone(): BoardModel {
    const newBoard = new BoardModel();
    this.grid.forEach((value, key) => {
      // オブジェクトの浅いコピーを作成（カードデータ自体は不変なので参照でOKだが、配置情報はコピー）
      newBoard.grid.set(key, { 
        pos: { ...value.pos }, 
        card: { ...value.card } 
      });
    });
    return newBoard;
  }

  placeCard(card: CardEntity, pos: Position) {
    const key = `${pos.x},${pos.y}`;
    this.grid.set(key, { card, pos });
  }

  getCardAt(pos: Position): CardEntity | null {
    const key = `${pos.x},${pos.y}`;
    return this.grid.get(key)?.card || null;
  }

  isEmpty(pos: Position): boolean {
    return !this.getCardAt(pos);
  }

  getAllCards(): { pos: Position, card: CardEntity }[] {
    return Array.from(this.grid.values());
  }

  getAdjacentPos(pos: Position, dir: Direction): Position {
    switch (dir) {
      case 'UP': return { x: pos.x, y: pos.y - 1 };
      case 'DOWN': return { x: pos.x, y: pos.y + 1 };
      case 'LEFT': return { x: pos.x - 1, y: pos.y };
      case 'RIGHT': return { x: pos.x + 1, y: pos.y };
    }
  }

  getOppositeDir(dir: Direction): Direction {
    switch (dir) {
      case 'UP': return 'DOWN';
      case 'DOWN': return 'UP';
      case 'LEFT': return 'RIGHT';
      case 'RIGHT': return 'LEFT';
    }
  }
}