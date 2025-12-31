import { v4 as uuidv4 } from 'uuid';
import { BoardModel } from '../models/BoardModel';
import { PlayerModel } from '../models/PlayerModel';
import { RuleEngine } from './RuleEngine';
import type { CardData, CardEntity, Position, GamePhase } from '../types';

export interface ActionResult {
  success: boolean;
  message: string;
}

export class GameMaster {
  board: BoardModel;
  deck: CardEntity[] = [];
  discardPile: CardEntity[] = [];

  players: Map<string, PlayerModel> = new Map();
  turnOrder: string[] = [];
  activePlayerIndex: number = 0;

  ruleEngine: RuleEngine;
  currentPhase: GamePhase = 'SETUP';
  winner: string | null = null;

  // ★変更: 新しい終了条件用の変数を追加
  isFinalRound: boolean = false; // 山札が尽きたら true
  turnsAfterDeckEmpty: number = 0; // 山札切れ後に経過したターン数

  constructor(cardMasterData: CardData[]) {
    this.board = new BoardModel();
    this.ruleEngine = new RuleEngine(this.board);
    this.initializeDeck(cardMasterData);
  }

  addPlayer(playerId: string): void {
    const player = new PlayerModel(playerId);
    this.players.set(playerId, player);
    this.turnOrder.push(playerId);
  }

  private initializeDeck(masterData: CardData[]): void {
    masterData.forEach(data => {
      for (let i = 0; i < 3; i++) {
        this.deck.push({ instanceId: uuidv4(), ownerId: 'SYSTEM', data: data });
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
    this.turnOrder.forEach(pid => this.drawCard(pid, 3));
    this.activePlayerIndex = -1;
    this.nextTurn();
  }

  // ★修正: ターン進行と終了判定ロジックを刷新
  nextTurn(): ActionResult {
    // 1. 終了判定チェック
    // 山札が尽きた状態(isFinalRound)で、全員が一巡(2ターン)したら終了
    // (山札切れさせた本人 + 次のプレイヤーまで)
    if (this.isFinalRound) {
      this.turnsAfterDeckEmpty++;
      // プレイヤー人数分(2回)のターン終了処理が走ったらゲームセット
      if (this.turnsAfterDeckEmpty >= this.turnOrder.length) {
        this.finishGame();
        return { success: true, message: "全ターン終了！結果発表へ..." };
      }
    }

    // 2. 次のプレイヤーへ
    this.activePlayerIndex = (this.activePlayerIndex + 1) % this.turnOrder.length;
    const currentPlayerId = this.getCurrentPlayerId();
    const player = this.players.get(currentPlayerId);

    if (!player) return { success: false, message: "エラー" };

    // 3. ドロー処理
    let drawMsg = "";
    if (this.deck.length > 0) {
      this.drawCard(currentPlayerId, 1);
      drawMsg = "1枚ドロー。";
    } else {
      // ドローできない場合
      this.isFinalRound = true; // 念のためここでもフラグセット
      drawMsg = "山札なし！最後のターンです。";
    }
    
    // 4. 予算回復
    const income = this.calculateIncome(currentPlayerId);
    player.setBudget(income);

    return { 
      success: true, 
      message: `${currentPlayerId} の番です。${drawMsg}予算${income}を獲得。` 
    };
  }

  private calculateIncome(playerId: string): number {
    let income = 0;
    this.board.getAllCards().forEach(({ card }) => {
      if (card.ownerId === playerId) income += card.data.stats.tax;
    });
    return income > 0 ? income : 2;
  }
  
  getCurrentPlayerId(): string {
    return this.turnOrder[this.activePlayerIndex];
  }

  // ★修正: ドロー時に山札が尽きたらフラグを立てる
  drawCard(playerId: string, count: number = 1): void {
    const player = this.players.get(playerId);
    if (!player) return;

    for (let i = 0; i < count; i++) {
      if (this.deck.length > 0) {
        const card = this.deck.pop();
        if (card) {
          card.ownerId = playerId;
          player.addCardToHand(card);
        }
      }
      
      // カードを引いた後（または引こうとして）デッキが0枚になったらファイナルラウンド開始
      if (this.deck.length === 0) {
        this.isFinalRound = true;
      }
    }
  }

  playCard(playerId: string, cardInstanceId: string, pos: Position): ActionResult {
    if (this.winner) return { success: false, message: "ゲームは終了しています" };
    if (playerId !== this.getCurrentPlayerId()) return { success: false, message: "手番ではありません" };

    const player = this.players.get(playerId);
    if (!player) return { success: false, message: "プレイヤーエラー" };

    const hand = player.getHand();
    const card = hand.find(c => c.instanceId === cardInstanceId);
    if (!card) return { success: false, message: "手札にカードがありません" };

    const check = this.ruleEngine.canPlaceCard(playerId, pos, player.getBudget(), card.data.cost);
    if (!check.valid) {
      return { success: false, message: `${check.reason}` };
    }

    player.removeCardFromHand(cardInstanceId);
    player.addBudget(-card.data.cost);
    this.board.placeCard(card, pos);

    return { success: true, message: `${playerId} は「${card.data.name}」を建設しました` };
  }

  discardFromHand(playerId: string, cardInstanceId: string): ActionResult {
    if (this.winner) return { success: false, message: "ゲーム終了済み" };
    if (playerId !== this.getCurrentPlayerId()) return { success: false, message: "手番ではありません" };

    const player = this.players.get(playerId);
    if (!player) return { success: false, message: "エラー" };

    const card = player.removeCardFromHand(cardInstanceId);
    if (card) {
      this.discardPile.push(card);
      player.addBudget(2);
      return { success: true, message: `${playerId} は「${card.data.name}」を売却して2金を得ました` };
    }
    return { success: false, message: "カードが見つかりません" };
  }

  private finishGame() {
    this.currentPhase = 'END';
    let bestScore = -1;
    let winningPlayer = null;

    this.turnOrder.forEach(pid => {
      const stats = this.getPlayerStats(pid);
      // ★勝敗条件: 👤と⚡の少ない値を「都市人口」とし、これを比較する
      const cityPopulation = Math.min(stats.p1, stats.p2);
      
      if (cityPopulation > bestScore) {
        bestScore = cityPopulation;
        winningPlayer = pid;
      } else if (cityPopulation === bestScore) {
        winningPlayer = "DRAW";
      }
    });
    this.winner = winningPlayer;
  }

  getPlayerStats(playerId: string) {
    const player = this.players.get(playerId);
    if (!player) return { p1: 0, p2: 0, budget: 0 };
    let totalP1 = 0; let totalP2 = 0;
    this.board.getAllCards().forEach(({ card }) => {
      if (card.ownerId === playerId) {
        totalP1 += card.data.stats.p1;
        totalP2 += card.data.stats.p2;
      }
    });
    return { p1: totalP1, p2: totalP2, budget: player.getBudget() };
  }
}