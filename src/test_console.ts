// src/test_console.ts
import { GameMaster } from './logic/GameMaster';
import type { CardData } from './types'; // ★ typeを追加

// 1. テスト用のカードデータ（モック）を用意
// 本来は JSON から読み込みますが、テスト用にここで定義します
const mockCardData: CardData[] = [
  {
    id: "s001_town_hall",
    name: "役場",
    type: "PUBLIC",
    rarity: "COMMON",
    cost: 0,
    stats: { p1: 1, p2: 1, tax: 2 },
    arrows: ["UP", "DOWN", "LEFT", "RIGHT"], // 全方向
    description: "初期配置用"
  },
  {
    id: "c001_apartment",
    name: "アパート",
    type: "RESIDENTIAL",
    rarity: "COMMON",
    cost: 2,
    stats: { p1: 2, p2: 0, tax: 1 },
    arrows: ["UP"],
    description: "安価な住居"
  },
  {
    id: "c002_station",
    name: "駅",
    type: "INFRASTRUCTURE",
    rarity: "UNCOMMON",
    cost: 4,
    stats: { p1: 0, p2: 1, tax: 2 },
    arrows: ["LEFT", "RIGHT"],
    description: "インフラ拠点"
  }
];

// --- テスト実行関数 ---
const runTest = () => {
  console.log("=== Cross City Minimal Logic Test Start ===");

  // 2. ゲームマスターの初期化
  const gm = new GameMaster(mockCardData);
  console.log("GameMaster Initialized.");

  // 3. プレイヤー参加
  const playerId = "Player1";
  gm.addPlayer(playerId);
  console.log(`Player added: ${playerId}`);

  // 4. ゲーム開始（手札配布など）
  gm.startGame();
  const player = gm.players.get(playerId);
  
  if (!player) {
    console.error("Critical Error: Player not found!");
    return;
  }

  console.log(`\n[Status] Initial Budget: ${player.getBudget()}`);
  console.log(`[Status] Hand: ${player.getHand().map(c => c.data.name).join(", ")}`);

  // 5. 【重要】初期配置のシミュレーション
  // ルール上、最初に「役場」が場にあるはずなので、強制的に配置します
  // 本来はカードIDが必要ですが、テスト用にデッキ外から生成して配置してしまいます
  const townHall = {
    instanceId: "initial_town_hall",
    ownerId: playerId,
    data: mockCardData.find(c => c.id === "s001_town_hall")!
  };
  gm.board.placeCard(townHall, { x: 0, y: 0 });
  console.log("\n[Setup] Placed 'Town Hall' at (0, 0)");

  // --- テストアクション開始 ---

  // 手札から「アパート」を探す（なければ最初のカードを使う）
  const targetCard = player.getHand().find(c => c.data.id === "c001_apartment") || player.getHand()[0];
  
  if (!targetCard) {
    console.error("Hand is empty!");
    return;
  }
  
  console.log(`\n--- Action Test: Try to play '${targetCard.data.name}' ---`);

  // シナリオA: 遠すぎる場所に置こうとする（失敗するはず）
  console.log("Trying to place at (5, 5) [Invalid Pos]...");
  const resultA = gm.playCard(playerId, targetCard.instanceId, { x: 5, y: 5 });
  console.log(`Result: ${resultA ? "SUCCESS" : "FAILED"} (Expected: FAILED)`);

  // シナリオB: 役場の隣（右）に置こうとする（成功するはず）
  // 役場は全方向矢印を持っているので、(1,0)は置けるはず
  console.log("Trying to place at (1, 0) [Valid Pos next to Town Hall]...");
  const resultB = gm.playCard(playerId, targetCard.instanceId, { x: 1, y: 0 });
  console.log(`Result: ${resultB ? "SUCCESS" : "FAILED"} (Expected: SUCCESS)`);

  // --- 結果確認 ---
  console.log("\n=== Final Status ===");
  console.log(`Budget: ${player.getBudget()} (Expected: 5 - ${targetCard.data.cost} = ${5 - targetCard.data.cost})`);
  
  const placedCards = gm.board.getAllCards();
  console.log(`Cards on Board: ${placedCards.length}`);
  placedCards.forEach(p => {
    console.log(` - ${p.card.data.name} at (${p.pos.x}, ${p.pos.y})`);
  });

  console.log("\n=== Test Complete ===");
};

// 実行
runTest();