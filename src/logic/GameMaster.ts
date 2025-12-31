import { v4 as uuidv4 } from 'uuid';
import { BoardModel } from '../models/BoardModel';
import { PlayerModel } from '../models/PlayerModel';
import { RuleEngine } from './RuleEngine';
import { EffectManager } from './EffectManager';
import { GAME_CONFIG } from '../config';
// ★修正: ActionResult をここに追加
import type { CardData, CardEntity, Position, GamePhase, ActionResult } from '../types';

export class GameMaster {
  board: BoardModel;
  deck: CardEntity[] = [];
  discardPile: CardEntity[] = [];
  players: Map<string, PlayerModel> = new Map();
  turnOrder: string[] = [];
  activePlayerIndex: number = 0;

  ruleEngine: RuleEngine;
  effectManager: EffectManager;
  
  currentPhase: GamePhase = 'SETUP';
  winner: string | null = null;
  isFinalRound: boolean = false;
  turnsAfterDeckEmpty: number = 0;

  constructor(cardMasterData: CardData[]) {
    this.board = new BoardModel();
    this.ruleEngine = new RuleEngine(this.board);
    this.effectManager = new EffectManager(this);
    this.initializeDeck(cardMasterData);
  }

  addPlayer(playerId: string): void {
    const player = new PlayerModel(playerId);
    this.players.set(playerId, player);
    this.turnOrder.push(playerId);
  }

private initializeDeck(masterData: CardData[]): void {
    masterData.forEach(data => {
      // inDeck指定がない、またはtrueの場合のみデッキへ
      if (data.inDeck !== false) {
        // ★修正: レアリティに応じた枚数を取得
        const copies = GAME_CONFIG.CARD.COPIES_BY_RARITY[data.rarity] ?? 1;
        
        for (let i = 0; i < copies; i++) {
          this.deck.push({ instanceId: uuidv4(), ownerId: 'SYSTEM', data: data });
        }
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
    this.turnOrder.forEach(pid => this.drawCard(pid, GAME_CONFIG.CARD.INITIAL_HAND));
    this.activePlayerIndex = -1;
    this.nextTurn();
  }

  nextTurn(): ActionResult {
    if (this.isFinalRound) {
      this.turnsAfterDeckEmpty++;
      if (this.turnsAfterDeckEmpty >= this.turnOrder.length) {
        this.finishGame();
        return { success: true, message: "全ターン終了！結果発表へ..." };
      }
    }

    this.activePlayerIndex = (this.activePlayerIndex + 1) % this.turnOrder.length;
    const currentPlayerId = this.getCurrentPlayerId();
    const player = this.players.get(currentPlayerId);

    if (!player) return { success: false, message: "エラー" };

    let drawMsg = "";
    if (this.deck.length > 0) {
      this.drawCard(currentPlayerId, GAME_CONFIG.CARD.DRAW_PER_TURN);
      drawMsg = `${GAME_CONFIG.CARD.DRAW_PER_TURN}枚ドロー。`;
    } else {
      this.isFinalRound = true;
      drawMsg = "山札なし！最後のターンです。";
    }
    
    const income = this.calculateIncome(currentPlayerId);
    player.setBudget(income);

    return { 
      success: true, 
      message: `${currentPlayerId} の番です。${drawMsg}予算${income}を獲得。` 
    };
  }

  getCurrentPlayerId(): string {
    return this.turnOrder[this.activePlayerIndex];
  }

  drawCard(playerId: string, count: number = 1): void {
    const player = this.players.get(playerId);
    if (!player) return;

    for (let i = 0; i < count; i++) {
      if (player.getHand().length >= GAME_CONFIG.CARD.MAX_HAND) break;

      if (this.deck.length > 0) {
        const card = this.deck.pop();
        if (card) {
          card.ownerId = playerId;
          player.addCardToHand(card);
        }
      }
      if (this.deck.length === 0) this.isFinalRound = true;
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

    this.effectManager.executeInstantEffects(playerId, card);

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
      player.addBudget(GAME_CONFIG.ECONOMY.DISCARD_BONUS);
      return { success: true, message: `${playerId} は「${card.data.name}」を売却して${GAME_CONFIG.ECONOMY.DISCARD_BONUS}金を得ました` };
    }
    return { success: false, message: "カードが見つかりません" };
  }

  getPlayerStats(playerId: string) {
    const player = this.players.get(playerId);
    if (!player) return { p1: 0, p2: 0, budget: 0 };
    
    let totalP1 = 0; 
    let totalP2 = 0;
    
    this.board.getAllCards().forEach(({ card, pos }) => {
      if (card.ownerId === playerId) {
        const effectiveStats = this.effectManager.getEffectiveStats(card, pos);
        totalP1 += effectiveStats.p1;
        totalP2 += effectiveStats.p2;
      }
    });

    return { p1: totalP1, p2: totalP2, budget: player.getBudget() };
  }

  private calculateIncome(playerId: string): number {
    let income = 0;
    this.board.getAllCards().forEach(({ card, pos }) => {
      if (card.ownerId === playerId) {
        const effectiveStats = this.effectManager.getEffectiveStats(card, pos);
        income += effectiveStats.tax;
      }
    });
    return income;
  }

  private finishGame() {
    this.currentPhase = 'END';
    let bestScore = -1;
    let winningPlayer = null;

    this.turnOrder.forEach(pid => {
      const stats = this.getPlayerStats(pid);
      const bonus = this.effectManager.calculateEndGameBonus(pid);
      const finalP1 = stats.p1 + bonus;

      const cityPopulation = Math.min(finalP1, stats.p2);
      
      if (cityPopulation > bestScore) {
        bestScore = cityPopulation;
        winningPlayer = pid;
      } else if (cityPopulation === bestScore) {
        winningPlayer = "DRAW";
      }
    });
    this.winner = winningPlayer;
  }
}