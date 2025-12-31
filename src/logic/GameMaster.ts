import { v4 as uuidv4 } from 'uuid';
import { BoardModel } from '../models/BoardModel';
import { PlayerModel } from '../models/PlayerModel';
import { RuleEngine } from './RuleEngine';
import type { CardData, CardEntity, Position, GamePhase } from '../types';

export class GameMaster {
  board: BoardModel;
  deck: CardEntity[] = [];
  discardPile: CardEntity[] = []; // ★捨て札

  players: Map<string, PlayerModel> = new Map();
  turnOrder: string[] = [];
  activePlayerIndex: number = 0;

  ruleEngine: RuleEngine;
  currentPhase: GamePhase = 'SETUP';

  constructor(cardMasterData: CardData[]) {
    this.board = new BoardModel();
    this.ruleEngine = new RuleEngine(this.board);
    this.initializeDeck(cardMasterData);
  }

  // --- セットアップ ---
  addPlayer(playerId: string): void {
    const player = new PlayerModel(playerId);
    this.players.set(playerId, player);
    this.turnOrder.push(playerId);
  }

  private initializeDeck(masterData: CardData[]): void {
    masterData.forEach(data => {
      // 仮: 各カード3枚ずつ
      for (let i = 0; i < 3; i++) {
        const card: CardEntity = {
          instanceId: uuidv4(),
          ownerId: 'SYSTEM',
          data: data
        };
        this.deck.push(card);
      }
    });
    this.shuffleDeck();
  }

  private shuffleDeck(): void {
    for (let i = this.deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
    }
  }

  startGame(): void {
    // 全員に初期手札
    this.turnOrder.forEach(playerId => {
      this.drawCard(playerId, 3);
    });
    
    this.activePlayerIndex = -1; // nextTurnで0になるように
    this.nextTurn();
  }

  // ★ ターン進行ロジック
  nextTurn(): void {
    // 次のプレイヤーへ
    this.activePlayerIndex = (this.activePlayerIndex + 1) % this.turnOrder.length;
    const currentPlayerId = this.getCurrentPlayerId();
    const player = this.players.get(currentPlayerId);

    if (!player) return;

    console.log(`=== ${currentPlayerId} のターン ===`);

    // 1. ドローフェイズ
    this.currentPhase = 'DRAW';
    this.drawCard(currentPlayerId, 1);

    // 2. ターン開始時処理（予算回復）
    this.currentPhase = 'BUDGET';
    const income = this.calculateIncome(currentPlayerId);
    player.setBudget(income); // 残った金は持ち越さないルール（仮）
    console.log(`予算回復: ${income}`);

    // 3. アクションフェイズ
    this.currentPhase = 'MAIN';
  }

  // 収入計算：盤面にある自分のカードのTaxを合計
  private calculateIncome(playerId: string): number {
    let income = 0;
    // 役場などの基本給があればここで足す（例: +2）
    
    this.board.getAllCards().forEach(({ card }) => {
      if (card.ownerId === playerId) {
        income += card.data.stats.tax;
      }
    });
    return income > 0 ? income : 2; // 最低保証2金
  }

  getPlayerStats(playerId: string) {
    const player = this.players.get(playerId);
    if (!player) return { p1: 0, p2: 0, budget: 0 };

    let totalP1 = 0;
    let totalP2 = 0;

    // 盤面のカードを集計
    this.board.getAllCards().forEach(({ card }) => {
      if (card.ownerId === playerId) {
        totalP1 += card.data.stats.p1;
        totalP2 += card.data.stats.p2;
      }
    });

    return {
      p1: totalP1,
      p2: totalP2,
      budget: player.getBudget()
    };
  }

  getCurrentPlayerId(): string {
    return this.turnOrder[this.activePlayerIndex];
  }

  // --- アクション ---

  drawCard(playerId: string, count: number = 1): void {
    const player = this.players.get(playerId);
    if (!player) return;

    for (let i = 0; i < count; i++) {
      const card = this.deck.pop();
      if (card) {
        card.ownerId = playerId;
        player.addCardToHand(card);
      } else {
        // デッキ切れなら捨て札をリシャッフル（簡易実装）
        if (this.discardPile.length > 0) {
          console.log("捨て札をリシャッフルします");
          this.deck = [...this.discardPile];
          this.discardPile = [];
          this.shuffleDeck();
          // リトライ
          i--; 
        } else {
          console.log('デッキも捨て札もありません');
        }
      }
    }
  }

  playCard(playerId: string, cardInstanceId: string, pos: Position): boolean {
    // 自分のターンかチェック
    if (playerId !== this.getCurrentPlayerId()) {
      console.log("手番ではありません");
      return false;
    }

    const player = this.players.get(playerId);
    if (!player) return false;

    const hand = player.getHand();
    const card = hand.find(c => c.instanceId === cardInstanceId);

    if (!card) { return false; }
    // ★ 修正箇所: playerId を第一引数に追加
    const check = this.ruleEngine.canPlaceCard(
      playerId, 
      pos,
      player.getBudget(),
      card.data.cost
    );

    if (!check.valid) {
      console.log(`配置不可: ${check.reason}`);
      return false; // UI側でエラー理由を表示したければ、戻り値を {success: boolean, reason?: string} に変えるのも手です
    }

    player.removeCardFromHand(cardInstanceId);
    player.addBudget(-card.data.cost);
    this.board.placeCard(card, pos);

    return true;
  }

  // 手札を捨てて臨時収入（オプション）
  discardFromHand(playerId: string, cardInstanceId: string): void {
    if (playerId !== this.getCurrentPlayerId()) return;
    const player = this.players.get(playerId);
    if (!player) return;

    const card = player.removeCardFromHand(cardInstanceId);
    if (card) {
      this.discardPile.push(card); // 捨て札置き場へ
      player.addBudget(2); // 臨時収入2金
      console.log(`${card.data.name}を捨てて2金得ました`);
    }
  }
}